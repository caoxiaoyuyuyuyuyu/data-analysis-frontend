import { Table, Tag, Space, Card, Button, Modal, message, Descriptions, Tabs } from 'antd';
import { 
  useGetPredictionHistoryQuery,
  useDeletePredictionRecordMutation
} from '../features/history/api';
import { useState } from 'react';
import { PredictionHistory } from '../features/history/types';
// import ReactJson from 'react-json-view';
import { JSONTree } from 'react-json-tree';

import { format } from 'date-fns';
import { Key } from 'react';

const { TabPane } = Tabs;

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

    const renderInputData = (data: Record<string, any> | undefined) => {
    if (!data) return <span>无输入数据</span>;

    return (
        <JSONTree
        data={data}
        hideRoot={true}
        shouldExpandNodeInitially={() => false} // 控制展开逻辑
        theme={{
            nestedNodeChildren: {
            marginLeft: '20px',
            },
            valueLabel: {
            color: '#333',
            },
            valueText: {
            color: '#999',
            },
        }}
        />
    );
    };

    const renderOutputData = (data: any[] | undefined) => {
    if (!data) return <span>无输出结果</span>;

    if (Array.isArray(data)) {
        return (
        <div>
            {data.map((item, index) => (
            <div key={index} style={{ marginBottom: 8 }}>
                <JSONTree
                data={item}
                hideRoot={true}
                shouldExpandNodeInitially={(key, data, level) => level < 1}
                theme={{
                    valueLabel: { color: '#333' },
                    valueText: { color: '#999' },
                    nestedNodeChildren: { marginLeft: '20px' }
                }}
                />
            </div>
            ))}
        </div>
        );
    }

    return (
        <JSONTree
        data={data}
        hideRoot={true}
        shouldExpandNodeInitially={() => false}
        theme={{
            valueLabel: { color: '#333' },
            valueText: { color: '#999' },
            nestedNodeChildren: { marginLeft: '20px' }
        }}
        />
    );
};

  const columns = [
    {
      title: '模型名称',
      dataIndex: 'model_name',
      key: 'model_name',
      render: (text: string, record: PredictionHistory) => (
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
      title: '模型类型',
      dataIndex: 'model_type',
      key: 'model_type',
      filters: [
        { text: '分类', value: 'classification' },
        { text: '回归', value: 'regression' },
        { text: '聚类', value: 'clustering' }
      ],
      onFilter: (value: Key | boolean, record: PredictionHistory) => {
        // 这里需要根据实际模型类型进行过滤
        return record.model_type === value;
      }
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
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => `${duration.toFixed(2)}秒`,
      sorter: (a: PredictionHistory, b: PredictionHistory) => a.duration - b.duration
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: PredictionHistory) => (
        <Space size="middle">
          <Button type="link" onClick={() => showDetail(record)}>详情</Button>
          <Button 
            type="link" 
            danger 
            onClick={() => showDeleteConfirm(record.id)}
            disabled={record.status === 'processing'}
          >
            删除
          </Button>
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
                <Descriptions.Item label="模型名称">{selectedPrediction.model_name}</Descriptions.Item>
                <Descriptions.Item label="预测时间">
                  {format(new Date(selectedPrediction.predict_time), 'yyyy-MM-dd HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="耗时">
                  {selectedPrediction.duration.toFixed(2)} 秒
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
              </Descriptions>
            </TabPane>
            
            <TabPane tab="输入数据" key="2">
              {renderInputData(selectedPrediction.input_data)}
            </TabPane>
            
            <TabPane tab="预测结果" key="3">
              {renderOutputData(selectedPrediction.output_data)}
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