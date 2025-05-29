import { useState, useCallback, useEffect } from 'react';
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
  Typography,
  Alert
} from 'antd';
import { UploadOutlined, LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useGetTrainingHistoryQuery } from '../features/history/api';
import { useCheckPredictFileMutation } from '../features/files/api';
import { usePredictMutation } from '../features/predict/api';
import { Model } from '../features/models/types';
import { PredictionResult } from '../features/predict/types';
import { FileCheckResult } from '../types/files';

const { Title } = Typography;
const { Option } = Select;

const PredictionPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [fileCheckResult, setFileCheckResult] = useState<FileCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  // 获取用户训练过的模型列表
  const { data: models, isLoading: isLoadingModels } = useGetTrainingHistoryQuery();
  
  // API hooks
  const [predict] = usePredictMutation();
  const [checkFile] = useCheckPredictFileMutation();
  
  // 当文件或模型变化时触发检查
  useEffect(() => {
    if (file && selectedModel) {
      handleFileCheck();
    } else {
      setFileCheckResult(null);
    }
  }, [file, selectedModel]);

  // 文件检查函数
  const handleFileCheck = async () => {
    if (!file || !selectedModel) return;
    
    setIsChecking(true);
    setFileCheckResult(null);
    
    try {
      const result = await checkFile({ file, modelId: Number(selectedModel) }).unwrap();
      setFileCheckResult(result);
      
      if (!result.valid) {
        message.error(result.message || '文件检查未通过');
      }
    } catch (error) {
      message.error('文件检查失败');
      console.error('File check error:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // 执行预测
  const handlePredict = useCallback(async () => {
    if (!file || !selectedModel) {
      message.warning('请先选择模型和上传数据文件');
      return;
    }
    
    // 如果检查未通过，阻止预测
    if (fileCheckResult && !fileCheckResult.valid) {
      message.warning('请先解决文件检查问题');
      return;
    }
    
    setIsPredicting(true);
    setPredictionResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('training_record_id', selectedModel);
      
      const result = await predict(formData).unwrap();
      setPredictionResult(result);
      message.success('预测完成');
    } catch (error) {
      message.error('预测失败');
      console.error('Prediction error:', error);
    } finally {
      setIsPredicting(false);
    }
  }, [file, selectedModel, predict, fileCheckResult]);
  
  // 渲染文件检查结果
  const renderFileCheckResult = () => {
    if (!fileCheckResult || !file) return null;
    
    return (
      <Card title="文件检查结果" style={{ marginTop: 16 }}>
        {fileCheckResult.valid ? (
          <Alert
            message="文件检查通过"
            description={`文件 ${file.name} 符合要求，可以用于预测`}
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
          />
        ) : (
          <Alert
            message="文件检查未通过"
            description={
              <div>
                <p>{fileCheckResult.message}</p>
                {fileCheckResult.missing_columns && (
                  <div>
                    <p>缺少的列:</p>
                    <ul>
                      {fileCheckResult.missing_columns.map(col => (
                        <li key={col}>{col}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            }
            type="error"
            showIcon
            icon={<CloseCircleOutlined />}
          />
        )}
        
        {fileCheckResult.stats && (
          <Descriptions bordered column={2} style={{ marginTop: 16 }}>
            <Descriptions.Item label="文件名">{file.name}</Descriptions.Item>
            <Descriptions.Item label="文件大小">{(file.size / 1024).toFixed(2)} KB</Descriptions.Item>
            <Descriptions.Item label="行数">{fileCheckResult.stats.rows}</Descriptions.Item>
            <Descriptions.Item label="列数">{fileCheckResult.stats.columns}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>
    );
  };
  
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
          dataSource={predictionResult.predictions.map((item, index) => ({ ...item, key: index }))}
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
          
          {isChecking && (
            <div style={{ textAlign: 'center' }}>
              <Spin tip="正在检查文件..." size="large" />
            </div>
          )}
          
          <Button
            type="primary"
            onClick={handlePredict}
            disabled={!file || !selectedModel || isPredicting || (fileCheckResult && !fileCheckResult.valid) || isChecking}
            icon={isPredicting ? <LoadingOutlined /> : null}
            loading={isPredicting}
            size="large"
          >
            {isPredicting ? '预测中...' : '开始预测'}
          </Button>
        </Space>
      </Card>
      
      {renderFileCheckResult()}
      {renderPredictionResult()}
    </div>
  );
};

export default PredictionPage;