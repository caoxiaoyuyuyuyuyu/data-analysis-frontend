import { Table, Tag, Space, Card, Button, Modal, message, Descriptions, Tabs } from 'antd';
import { 
  useGetTrainingHistoryQuery
} from '../features/history/api';
import { useDeleteModelMutation } from '../features/models/api';
import { useState } from 'react';
import { Model } from '../features/models/types';
import ReactECharts from 'echarts-for-react';
import { format } from 'date-fns';
import { Key } from 'react';

const { TabPane } = Tabs;

const HistoryPage = () => {
  const { data: history, isLoading, refetch } = useGetTrainingHistoryQuery();
  // const [retrainModel] = useRetrainModelMutation();
  const [deleteModel] = useDeleteModelMutation();
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<number | null>(null);

  const handleRetrain = async (modelId: number) => {
    try {
      // await retrainModel(modelId).unwrap();
      message.success('模型重新训练任务已提交');
      refetch();
    } catch (err) {
      message.error('重新训练失败');
    }
  };

  const handleDelete = async () => {
    if (!modelToDelete) return;
    
    try {
      await deleteModel(modelToDelete).unwrap();
      message.success('模型删除成功');
      setDeleteConfirmVisible(false);
      refetch();
    } catch (err) {
      message.error('模型删除失败');
    }
  };

  const showDetail = (record: Model) => {
    setSelectedModel(record);
    setDetailVisible(true);
  };

  const showDeleteConfirm = (modelId: number) => {
    setModelToDelete(modelId);
    setDeleteConfirmVisible(true);
  };

  const renderLearningCurve = (model: Model) => {
    if (!model.learning_curve) return null;

    const option = {
      title: {
        text: '学习曲线',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['训练集', '测试集'],
        bottom: 10
      },
      xAxis: {
        type: 'value',
        name: '训练样本数'
      },
      yAxis: {
        type: 'value',
        name: '得分'
      },
      series: [
        {
          name: '训练集',
          type: 'line',
          data: model.learning_curve.train_sizes.map((size, i) => [
            size,
            model.learning_curve.train_scores[i]
          ]),
          smooth: true
        },
        {
          name: '测试集',
          type: 'line',
          data: model.learning_curve.train_sizes.map((size, i) => [
            size,
            model.learning_curve.test_scores[i]
          ]),
          smooth: true
        }
      ]
    };

    return <ReactECharts option={option} style={{ height: 400 }} />;
  };

  const columns = [
    {
      title: '模型名称',
      dataIndex: 'model_name',
      key: 'model_name',
      render: (text: string, record: Model) => (
        <a onClick={() => showDetail(record)}>{text}</a>
      )
    },
    {
      title: '训练时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => format(new Date(text), 'yyyy-MM-dd HH:mm:ss'),
      sorter: (a: Model, b: Model) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    },
    {
      title: '评估指标',
      key: 'metrics',
      render: (_: any, record: Model) => {
        const mainMetric = record.metrics.accuracy !== undefined ? 
          `准确率: ${(record.metrics.accuracy * 100).toFixed(2)}%` : 
          `R²: ${record.metrics.r2?.toFixed(4) || 'N/A'}`;
        
        return (
          <Space direction="vertical" size={0}>
            <span>{mainMetric}</span>
            {record.metrics.precision && (
              <span>精确率: {(record.metrics.precision * 100).toFixed(2)}%</span>
            )}
          </Space>
        );
      }
    },
    {
      title: '训练时长',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => `${duration.toFixed(2)}秒`,
      sorter: (a: Model, b: Model) => a.duration - b.duration
    },
    {
      title: '状态',
      key: 'status',
      render: () => <Tag color="green">已完成</Tag>,
      filters: [
        { text: '已完成', value: 'completed' },
        { text: '失败', value: 'failed' }
      ],
      onFilter: (value: Key | boolean, record: Model) => {
        // 添加类型判断，确保 value 是字符串
        if (typeof value === 'string') {
          return value === 'completed'; // 根据实际字段调整逻辑
        }
        return false;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Model) => (
        <Space size="middle">
          <Button type="link" onClick={() => showDetail(record)}>详情</Button>
          <Button type="link" onClick={() => handleRetrain(record.id)}>重新训练</Button>
          <Button 
            type="link" 
            danger 
            onClick={() => showDeleteConfirm(record.id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Card title="训练历史记录">
      <Table
        columns={columns}
        dataSource={history || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50']
        }}
      />

      {/* 模型详情弹窗 */}
      <Modal
        title="模型详情"
        visible={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedModel && (
          <Tabs defaultActiveKey="1">
            <TabPane tab="基本信息" key="1">
              <Descriptions bordered column={2}>
                <Descriptions.Item label="模型名称">{selectedModel.model_name}</Descriptions.Item>
                <Descriptions.Item label="训练时间">
                  {format(new Date(selectedModel.created_at), 'yyyy-MM-dd HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="训练时长">
                  {selectedModel.duration.toFixed(2)} 秒
                </Descriptions.Item>
                <Descriptions.Item label="数据文件">{selectedModel.file_name}</Descriptions.Item>
              </Descriptions>
            </TabPane>
            
            <TabPane tab="评估指标" key="2">
              <Descriptions bordered column={2}>
                {Object.entries(selectedModel.metrics).map(([key, value]) => (
                  <Descriptions.Item key={key} label={key.toUpperCase()}>
                    {typeof value === 'number' ? value.toFixed(4) : value}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </TabPane>
            
            <TabPane tab="学习曲线" key="3">
              {renderLearningCurve(selectedModel)}
            </TabPane>
            
            <TabPane tab="训练参数" key="4">
              <Descriptions bordered column={2}>
                {Object.entries(selectedModel.model_parameters).map(([key, value]) => (
                  <Descriptions.Item key={key} label={key}>
                    {typeof value === 'boolean' ? (value ? '是' : '否') : value}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </TabPane>
          </Tabs>
        )}
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        title="确认删除"
        visible={deleteConfirmVisible}
        onOk={handleDelete}
        onCancel={() => setDeleteConfirmVisible(false)}
        okText="确认"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>确定要删除此模型吗？删除后将无法恢复。</p>
      </Modal>
    </Card>
  );
};

export default HistoryPage;