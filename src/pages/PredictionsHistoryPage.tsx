import { Table, Tag, Space, Card, Button, Modal, message, Descriptions, Tabs } from 'antd';
import { 
  useGetPredictionHistoryQuery,
  useDeletePredictionRecordMutation
} from '../features/history/api';
import { useState } from 'react';
import { PredictionHistory } from '../features/history/types';
import { format } from 'date-fns';
import { Key } from 'react';
const { TabPane } = Tabs;
import renderInputData from '../components/renderInputData';

const PredictionsPage = () => {
  const { data: predictions, isLoading, refetch } = useGetPredictionHistoryQuery();
  const [deletePrediction] = useDeletePredictionRecordMutation();
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionHistory | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [predictionToDelete, setPredictionToDelete] = useState<number | null>(null);

  const handleDelete = async () => {
    if (!predictionToDelete) return;
    
    try {
      await deletePrediction(predictionToDelete).unwrap();
      message.success('预测记录删除成功');
      setDeleteConfirmVisible(false);
      refetch();
    } catch (err) {
      message.error('预测记录删除失败');
    }
  };

  const showDetail = (record: PredictionHistory) => {
    setSelectedPrediction(record);
    setDetailVisible(true);
  };

  const showDeleteConfirm = (predictionId: number) => {
    setPredictionToDelete(predictionId);
    setDeleteConfirmVisible(true);
  };

  const renderOutputData = (filePath: string | null) => {
    if (!filePath) return <span>无输出结果</span>;
    
    return (
      <div>
        <p>预测结果文件路径:</p>
        <p>{filePath}</p>
      </div>
    );
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: number, record: PredictionHistory) => (
        <a onClick={() => showDetail(record)}>{text}</a>
      )
    },
    {
      title: '预测时间',
      dataIndex: 'predict_time',
      key: 'predict_time',
      render: (text: string) => format(new Date(text), 'yyyy-MM-dd HH:mm:ss'),
      sorter: (a: PredictionHistory, b: PredictionHistory) => 
        new Date(a.predict_time).getTime() - new Date(b.predict_time).getTime()
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: PredictionHistory) => {
        let color = 'default';
        if (record.status === 'completed') color = 'green';
        if (record.status === 'failed') color = 'red';
        if (record.status === 'processing') color = 'blue';
        
        return <Tag color={color}>{record.status === 'completed' ? '完成' : 
               record.status === 'failed' ? '失败' : '处理中'}</Tag>;
      },
      filters: [
        { text: '完成', value: 'completed' },
        { text: '失败', value: 'failed' },
        { text: '处理中', value: 'processing' }
      ],
      onFilter: (value: Key | boolean, record: PredictionHistory) => {
        return record.status === value;
      }
    },
    {
      title: '耗时',
      dataIndex: 'predict_duration',
      key: 'duration',
      render: (duration?: number | null) => {
        if (duration === undefined || duration === null) return '-';
        return `${Number(duration).toFixed(2)}秒`;
      },
      sorter: (a: PredictionHistory, b: PredictionHistory) => {
        const durationA = a.predict_duration || 0;
        const durationB = b.predict_duration || 0;
        return durationA - durationB;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: PredictionHistory) => (
        <Space size="middle">
          <Button type="link" onClick={() => showDetail(record)}>详情</Button>
          {/* <Button 
            type="link" 
            danger 
            onClick={() => showDeleteConfirm(record.id)}
            disabled={record.status === 'processing'}
          >
            删除
          </Button> */}
        </Space>
      )
    }
  ];

  return (
    <Card title="预测历史记录">
      <Table
        columns={columns}
        dataSource={predictions || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50']
        }}
      />

      {/* 预测详情弹窗 */}
      <Modal
        title="预测详情"
        visible={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedPrediction && (
          <Tabs defaultActiveKey="1">
            <TabPane tab="基本信息" key="1">
              <Descriptions bordered column={2}>
                <Descriptions.Item label="ID">{selectedPrediction.id}</Descriptions.Item>
                <Descriptions.Item label="预测时间">
                  {format(new Date(selectedPrediction.predict_time), 'yyyy-MM-dd HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="耗时">
                  {selectedPrediction.predict_duration !== undefined && selectedPrediction.predict_duration !== null 
                    ? Number(selectedPrediction.predict_duration).toFixed(2) + ' 秒' 
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={selectedPrediction.status === 'completed' ? 'green' : 
                              selectedPrediction.status === 'failed' ? 'red' : 'blue'}>
                    {selectedPrediction.status === 'completed' ? '完成' : 
                     selectedPrediction.status === 'failed' ? '失败' : '处理中'}
                  </Tag>
                </Descriptions.Item>
                {selectedPrediction.error_message && (
                  <Descriptions.Item label="错误信息" span={2}>
                    {selectedPrediction.error_message}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="训练记录ID" span={2}>
                  {selectedPrediction.training_record_id}
                </Descriptions.Item>
                <Descriptions.Item label="输入文件ID" span={2}>
                  {selectedPrediction.input_file_id}
                </Descriptions.Item>
              </Descriptions>
            </TabPane>
            
            <TabPane tab="指标" key="2">
              {renderInputData(selectedPrediction.parameters)}
            </TabPane>
            
            <TabPane tab="预测结果" key="3">
              {renderOutputData(selectedPrediction.output_file_path)}
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
        <p>确定要删除此预测记录吗？删除后将无法恢复。</p>
      </Modal>
    </Card>
  );
};

export default PredictionsPage;