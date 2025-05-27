import { useState, useCallback } from 'react';
import { 
  Upload, 
  Button, 
  Card, 
  Select, 
  Space, 
  message, 
  Table, 
  Descriptions, 
  Tag,
  Spin,
  Typography 
} from 'antd';
import { UploadOutlined, LoadingOutlined } from '@ant-design/icons';
import { useGetTrainingHistoryQuery } from '../features/history/api';
import { usePredictMutation } from '../features/predict/api';
import { Model } from '../features/models/types';
import { PredictionResult } from '../features/predict/types';

const { Title } = Typography;
const { Option } = Select;

const PredictionPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  
  // 获取用户训练过的模型列表
  const { data: models, isLoading: isLoadingModels } = useGetTrainingHistoryQuery();
  
  // 预测Mutation
  const [predict] = usePredictMutation();
  
  // 处理文件上传
  const handleFileChange = (info: any) => {
    if (info.file.status === 'done') {
      setFile(info.file.originFileObj);
      message.success(`${info.file.name} 文件上传成功`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 文件上传失败`);
    }
  };
  
  // 执行预测
  const handlePredict = useCallback(async () => {
    if (!file || !selectedModel) {
      message.warning('请先选择模型和上传数据文件');
      return;
    }
    
    setIsPredicting(true);
    setPredictionResult(null);
    
    try {
      // 创建FormData对象
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model_id', selectedModel);
      
      // 调用预测API
      const result = await predict(formData).unwrap();
      setPredictionResult(result);
      message.success('预测完成');
    } catch (error) {
      message.error('预测失败');
      console.error('Prediction error:', error);
    } finally {
      setIsPredicting(false);
    }
  }, [file, selectedModel, predict]);
  
  // 渲染预测结果
  const renderPredictionResult = () => {
    if (!predictionResult) return null;
    
    return (
      <Card title="预测结果" style={{ marginTop: 16 }}>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="模型名称">{predictionResult.model_info.name}</Descriptions.Item>
          <Descriptions.Item label="模型类型">{predictionResult.model_info.type}</Descriptions.Item>
          <Descriptions.Item label="预测耗时">{predictionResult.predict_duration.toFixed(2)}秒</Descriptions.Item>
          <Descriptions.Item label="预测时间">{new Date(predictionResult.predict_time).toLocaleString()}</Descriptions.Item>
        </Descriptions>
        
        <Title level={4} style={{ marginTop: 24 }}>预测数据</Title>
        <Table
          dataSource={predictionResult.predictions}
          rowKey="id" // 如果每条预测记录有 id 字段
          pagination={{ pageSize: 5 }}
          style={{ marginTop: 16 }}
        />
      </Card>
    );
  };
  
  return (
    <div style={{ padding: 24 }}>
      <Card title="数据预测">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={5}>1. 选择训练好的模型</Title>
            <Select
              style={{ width: '100%' }}
              placeholder="选择模型"
              loading={isLoadingModels}
              onChange={(value) => setSelectedModel(value)}
              value={selectedModel}
            >
              {models?.map((model: Model) => (
                <Option key={model.id} value={model.id.toString()}>
                  {model.model_name} ({model.model_type})
                </Option>
              ))}
            </Select>
          </div>
          
          <div>
            <Title level={5}>2. 上传预测数据文件</Title>
            <Upload.Dragger
              name="file"
              multiple={false}
              accept=".txt,.csv,.xlsx,.json"
              beforeUpload={(file) => {
                setFile(file);
                return false; // 阻止自动上传
              }}
              onChange={handleFileChange}
              showUploadList={true}
              maxCount={1}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
              <p className="ant-upload-hint">支持 TXT、CSV、Excel 或 JSON 格式</p>
            </Upload.Dragger>
          </div>
          
          <Button
            type="primary"
            onClick={handlePredict}
            disabled={!file || !selectedModel || isPredicting}
            icon={isPredicting ? <LoadingOutlined /> : null}
            loading={isPredicting}
            size="large"
          >
            {isPredicting ? '预测中...' : '开始预测'}
          </Button>
        </Space>
      </Card>
      
      {isPredicting && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Spin tip="预测处理中..." size="large" />
        </div>
      )}
      
      {renderPredictionResult()}
    </div>
  );
};

export default PredictionPage;