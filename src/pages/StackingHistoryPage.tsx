import { Table, Tag, Space, Card, Button, Modal, message, Descriptions, Tabs } from 'antd';
import React, { ReactNode } from 'react';
import { 
  useGetStackingPredictionHistoryQuery,
  useGetStackingTrainingHistoryQuery,
} from '../features/history/api';
import { useState } from 'react';
import { 
  StackingPredictionHistory,
  StackingTrainingHistory
} from '../features/history/types';
import { format } from 'date-fns';
const { TabPane } = Tabs;
import renderInputData from '../components/renderInputData';


const StackingHistoryPage = () => {
  // Prediction history state
  const { data: predictions, isLoading: isPredictionsLoading } = useGetStackingPredictionHistoryQuery();
  const [selectedPrediction, setSelectedPrediction] = useState<StackingPredictionHistory | null>(null);
  const [predictionDetailVisible, setPredictionDetailVisible] = useState(false);

  // Training history state
  const { data: models, isLoading: isModelsLoading } = useGetStackingTrainingHistoryQuery();
  const [selectedModel, setSelectedModel] = useState<StackingTrainingHistory | null>(null);
  const [modelDetailVisible, setModelDetailVisible] = useState(false);

  const showPredictionDetail = (record: StackingPredictionHistory) => {
    setSelectedPrediction(record);
    setPredictionDetailVisible(true);
  };

  const showModelDetail = (record: StackingTrainingHistory) => {
    setSelectedModel(record);
    setModelDetailVisible(true);
  };


  // Common render functions
  const renderOutputData = (filePath: string | null) => {
    if (!filePath) return <span>无输出结果</span>;
    
    return (
      <div>
        <p>预测结果文件路径:</p>
        <p>{filePath}</p>
      </div>
    );
  };
  // Prediction columns
  const predictionColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: number, record: StackingPredictionHistory) => (
        <a onClick={() => showPredictionDetail(record)}>{text}</a>
      )
    },
    {
      title: '预测时间',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (text: string) => format(new Date(text), 'yyyy-MM-dd HH:mm:ss'),
      sorter: (a: StackingPredictionHistory, b: StackingPredictionHistory) => 
        new Date(a.end_time).getTime() - new Date(b.start_time).getTime()
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: StackingPredictionHistory) => (
        <Space size="middle">
          <Button type="link" onClick={() => showPredictionDetail(record)}>详情</Button>
        </Space>
      )
    }
  ];

  // Model columns
  const modelColumns = [
    {
      title: '模型名称',
      dataIndex: 'model_id',
      key: 'model_id',
      render: (text: string, record: StackingTrainingHistory) => (
        <a onClick={() => showModelDetail(record)}>{text}</a>
      )
    },
    {
      title: '训练时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => format(new Date(text), 'yyyy-MM-dd HH:mm:ss'),
      sorter: (a: StackingTrainingHistory, b: StackingTrainingHistory) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    },
    {
      title: '评估指标',
      key: 'metrics',
      render: (_: any, record: StackingTrainingHistory) => {
        const metrics = Object.entries(record.metrics).map(([name, value]) => ({
          name,
          value
        }));
        return (
          <div>
            {metrics.map(({ name, value }) => (
              <Tag key={name}>{`${name}: ${value}`}</Tag>
            ))}
          </div>
        );
      }
    },
    {
      title: '训练时长',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => `${duration.toFixed(2)}秒`,
        sorter: (a: StackingTrainingHistory, b: StackingTrainingHistory) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: StackingTrainingHistory) => (
        <Space size="middle">
          <Button type="link" onClick={() => showModelDetail(record)}>详情</Button>
        </Space>
      )
    }
  ];

  return (
    <Card title="模型融合历史记录">
      <Tabs defaultActiveKey="1">
        {/* Prediction History Tab */}
        <TabPane tab="预测历史" key="1">
          <Table
            columns={predictionColumns}
            dataSource={predictions || []}
            rowKey="id"
            loading={isPredictionsLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50']
            }}
          />

          {/* 预测详情弹窗 */}
        <Modal
            title="预测详情"
            visible={predictionDetailVisible}
            onCancel={() => setPredictionDetailVisible(false)}
            footer={null}
            width={800}
        >
            {selectedPrediction && (
            <Tabs defaultActiveKey="1">
                <TabPane tab="基本信息" key="1">
                <Descriptions bordered column={2}>
                    <Descriptions.Item label="ID">{selectedPrediction.id}</Descriptions.Item>
                    <Descriptions.Item label="预测时间">
                    {format(new Date(selectedPrediction.created_at), 'yyyy-MM-dd HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="耗时">
                    {selectedPrediction.start_time !== undefined && selectedPrediction.end_time !== null 
                        ? (new Date(selectedPrediction.end_time).getTime() - new Date(selectedPrediction.start_time).getTime()).toFixed(2) + ' 秒' 
                        : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="训练记录ID" span={2}>
                    {selectedPrediction.training_record_id}
                    </Descriptions.Item>
                    <Descriptions.Item label="输入文件ID" span={2}>
                    {selectedPrediction.input_file_id}
                    </Descriptions.Item>
                </Descriptions>
                </TabPane>
                
                <TabPane tab="指标" key="2">
                {renderInputData(selectedPrediction.result_summary)}
                </TabPane>
                
                <TabPane tab="预测结果" key="3">
                {renderOutputData(selectedPrediction.result_path)}
                </TabPane>
            </Tabs>
            )}
        </Modal>

        </TabPane>

        {/* Training History Tab */}
        <TabPane tab="训练历史" key="2">
          <Table
            columns={modelColumns}
            dataSource={models || []}
            rowKey="id"
            loading={isModelsLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50']
            }}
          />

          {/* Model Detail Modal */}
          <Modal
            title="融合模型详情"
            visible={modelDetailVisible}
            onCancel={() => setModelDetailVisible(false)}
            footer={null}
            width={800}
          >
            {selectedModel && (
              <Tabs defaultActiveKey="1">
                <TabPane tab="基本信息" key="1">
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="模型名称">{selectedModel.model_id}</Descriptions.Item>
                    <Descriptions.Item label="训练时间">
                      {format(new Date(selectedModel.created_at), 'yyyy-MM-dd HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="训练时长">
                      {(new Date(selectedModel.created_at).getTime() - new Date(selectedModel.created_at).getTime()).toFixed(2)} 秒
                    </Descriptions.Item>
                    <Descriptions.Item label="模型地址">{selectedModel.model_path}</Descriptions.Item>
                    <Descriptions.Item label="基础模型数量">{selectedModel.base_model_names.length}</Descriptions.Item>
                    <Descriptions.Item label="交叉验证折数">{selectedModel.cross_validation}</Descriptions.Item>
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
                
                
                <TabPane tab="基础模型" key="4">
                  <Descriptions bordered column={2}>
                    {Object.entries(selectedModel.base_model_names).map(([key, value]) => (
                      <Descriptions.Item key={key} label={key}>
                        {value}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                </TabPane>

                <TabPane tab="元模型" key="5">
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="元模型名称">{selectedModel.meta_model_name}</Descriptions.Item>
                  </Descriptions>
                </TabPane>

              </Tabs>
            )}
          </Modal>
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default StackingHistoryPage;