import { useState, useCallback, useEffect } from 'react';
import { 
  Card, 
  Select, 
  Space, 
  message, 
  Table, 
  Descriptions, 
  Tag,
  Spin,
  Typography,
  Alert,
  Button,
  Collapse,
  Statistic,
  Row,
  Col,
  List,
  Divider
} from 'antd';
import { 
  LoadingOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ClockCircleOutlined,
  FileOutlined,
  ToolOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import { useGetTrainingHistoryQuery } from '../features/history/api';
import { useGetFilesQuery } from '../features/files/api';
import { usePredictMutation, useCheckFileMutation } from '../features/predict/api';
import { Model } from '../features/models/types';
import { PredictionResult, PredictionTableColumn } from '../features/predict/types';
import { FileCheckResult } from '../types/files';
import { format } from 'date-fns';
import { useNavigate  } from 'react-router-dom';



const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const PredictionPage = () => {
  const [selectedFile, setSelectedFile] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [fileCheckResult, setFileCheckResult] = useState<FileCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const navigate = useNavigate();

  
  // 获取用户训练过的模型列表
  const { data: models = [], isLoading: isLoadingModels } = useGetTrainingHistoryQuery();
  
  // API hooks
  const [predict] = usePredictMutation();
  const { data: files = [], isLoading: filesLoading } = useGetFilesQuery();
  
  // 获取当前选中的文件和模型详情
  const currentFile = files.find(f => f.id === selectedFile);
  const currentModel = models.find((m: Model) => m.id === selectedModel);
  const [featureCheckResult, setFeatureCheckResult] = useState<{
    isValid: boolean;
    missingColumns?: string[];
    extraColumns?: string[];
    expectedColumns?: string[];
    message?: string;
  } | null>(null);

  // 添加文件检查API
  const [checkFile] = useCheckFileMutation();
  
  const handleFileCheck = async () => {
    setIsChecking(true);
    setFeatureCheckResult(null);
    
    try {
      const result = await checkFile({
        file_id: selectedFile!,
        model_id: selectedModel!
      }).unwrap();
      console.log('checkFile result:', result);
      
      setFeatureCheckResult({
        isValid: result.valid,
        missingColumns: result.missing_columns,
        extraColumns: result.extra_columns,
        expectedColumns: result.expected_columns,
        message: result.message
      });
      
      if (!result.valid) {
        message.warning('文件检查未通过');
      }
    } catch (error) {
      message.error('文件检查失败');
      console.error('File check error:', error);
    } finally {
      setIsChecking(false);
    }
  };
  // 文件或模型变化时触发检查
  useEffect(() => {
    if (selectedFile && selectedModel) {
      handleFileCheck();
    } else {
      setFeatureCheckResult(null);
    }
  }, [selectedFile, selectedModel]);

  // 渲染模型详情
  const renderModelDetails = () => {
    if (!currentModel) return null;

    return (
      <Card 
        title="模型详情" 
        style={{ marginTop: 16 }}
        extra={<Tag color="blue">{currentModel.model_name}</Tag>}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Statistic 
              title="训练耗时" 
              value={currentModel.duration} 
              precision={2}
              suffix="秒"
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="模型大小" 
              value={(currentModel.model_file_size / 1024).toFixed(2)} 
              suffix="KB"
              prefix={<FileOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="测试集比例" 
              value={(currentModel.test_size || 0) * 100} 
              suffix="%"
              prefix={<ExperimentOutlined />}
            />
          </Col>
        </Row>

        <Collapse defaultActiveKey={['metrics']} style={{ marginTop: 16 }}>
          {currentModel.metrics && (
            <Panel header="模型指标" key="metrics">
              <List
                grid={{ gutter: 16, column: 3 }}
                dataSource={Object.entries(currentModel.metrics)}
                renderItem={([key, value]) => (
                  <List.Item>
                    <Card size="small">
                      <Statistic
                        title={key.toUpperCase()}
                        value={typeof value === 'number' ? value.toFixed(4) : value}
                      />
                    </Card>
                  </List.Item>
                )}
              />
            </Panel>
          )}

          {currentModel.model_parameters && Object.keys(currentModel.model_parameters).length > 0 && (
            <Panel header="模型参数" key="parameters">
              <Descriptions bordered column={2}>
                {Object.entries(currentModel.model_parameters).map(([key, value]) => (
                  <Descriptions.Item label={key} key={key}>
                    {typeof value === 'number' ? value.toFixed(6) : String(value)}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </Panel>
          )}
        </Collapse>

        <Descriptions bordered column={2} style={{ marginTop: 16 }}>
          <Descriptions.Item label="创建时间">
            {format(new Date(currentModel.created_at), 'yyyy-MM-dd HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {format(new Date(currentModel.updated_at), 'yyyy-MM-dd HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="目标列">
            <Tag color="purple">{currentModel.target_column}</Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    );
  };

  // 执行预测
  const handlePredict = useCallback(async () => {
    if (!selectedFile || !selectedModel) {
      message.warning('请先选择模型和数据文件');
      return;
    }
    
    if (fileCheckResult && !fileCheckResult.valid) {
      message.warning('请先解决文件检查问题');
      return;
    }
    
  // 检查是否通过验证
  if (!featureCheckResult?.isValid) {
    message.warning('请先解决文件特征不匹配问题');
    return;
  }
    setIsPredicting(true);
    setPredictionResult(null);
    
    try {
    // 创建 JSON 请求体
    const requestBody = {
      training_record_id: selectedModel,
      input_file_id: selectedFile  // 注意：后端使用的是 input_file_id 而不是 file_id
    };
    
    // 调用 API（需要修改 RTK Query 端点配置）
    const result = await predict(requestBody).unwrap();
      setPredictionResult(result);
      message.success('预测完成');
    } catch (error) {
      message.error('预测失败');
      console.error('Prediction error:', error);
    } finally {
      setIsPredicting(false);
    }
  }, [selectedFile, selectedModel, predict, featureCheckResult]);

   // 渲染文件检查结果（替换原有renderFileCheckResult）
  const renderFileCheckResult = () => {
    if (!featureCheckResult || !currentFile || !currentModel) return null;
    
    return (
      <Card title="文件特征检查" style={{ marginTop: 16 }}>
        {featureCheckResult.isValid ? (
          <Alert
            message="文件检查通过"
            description={`文件 ${currentFile.file_name} 的特征列与模型 ${currentModel.model_name} 匹配`}
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
          />
        ) : (
            <Alert
              message="文件检查未通过"
              description={featureCheckResult.message || '特征列不匹配'}
              type="error"
              showIcon
              icon={<CloseCircleOutlined />}
            />)}
          <>
            <Divider />
            
            <Row gutter={[16, 16]}>
              {/* 预期列 */}
              {featureCheckResult.expectedColumns && (
                <Col span={24}>
                  <Card
                    title={
                      <Space>
                        <FileOutlined />
                        <span>模型期望的特征列</span>
                        <Tag color="blue">{featureCheckResult.expectedColumns.length}</Tag>
                      </Space>
                    }
                    bordered
                    size="small"
                    styles={{
                      body: { maxHeight: 200, overflowY: 'auto' }
                    }}
                  >
                    <Text code style={{ wordBreak: 'break-word' }}>
                      {featureCheckResult.expectedColumns.join(', ')}
                    </Text>
                  </Card>
                </Col>
              )}

              {/* 缺失列 */}
              {featureCheckResult.missingColumns && featureCheckResult.missingColumns.length > 0 && (
                <Col span={12}>
                  <Card
                    title={
                      <Space>
                        <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                        <span>缺少的列</span>
                        <Tag color="red">{featureCheckResult.missingColumns.length}</Tag>
                      </Space>
                    }
                    bordered
                    size="small"
                    styles={{
                      body: { maxHeight: 200, overflowY: 'auto' }
                    }}
                    style={{ borderColor: '#ff4d4f', borderRadius: 8 }}
                  >
                    <Text code type="danger" style={{ wordBreak: 'break-word' }}>
                      {featureCheckResult.missingColumns.join(', ')}
                    </Text>
                  </Card>
                </Col>
              )}

              {/* 多余列 */}
              {featureCheckResult.extraColumns && featureCheckResult.extraColumns.length > 0 && (
                <Col span={12}>
                  <Card
                    title={
                      <Space>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <span>多余的列</span>
                        <Tag color="green">{featureCheckResult.extraColumns.length}</Tag>
                      </Space>
                    }
                    bordered
                    size="small"
                    styles={{
                      body: { maxHeight: 200, overflowY: 'auto' }
                    }}
                    style={{ borderColor: '#52c41a', borderRadius: 8 }}
                  >
                    <Text code type="success" style={{ wordBreak: 'break-word' }}>
                      {featureCheckResult.extraColumns.join(', ')}
                    </Text>
                  </Card>
                </Col>
              )}
            </Row>
            
          </>
      </Card>
    );
  };
  // 渲染文件详情
  const renderFileDetails = () => {
    if (!currentFile) return null;

    return (
      <Card title="文件详情" style={{ marginTop: 16 }}
        extra={
          <Button 
            type="primary" 
            size="small"
            icon={<ToolOutlined />} // 从 @ant-design/icons 导入
            onClick={() => {
              // 跳转到预处理页面
              navigate(`/preprocessing/${currentFile.id}`);
            }}
          >
            预处理
          </Button>
        }>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="文件名">
            <Text strong>{currentFile.file_name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="文件类型">
            <Tag color="blue">{currentFile?.file_type?.toUpperCase() || currentFile.file_name.split('.').pop()}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="文件大小">
            {(currentFile.file_size / 1024).toFixed(2)} KB
          </Descriptions.Item>
          <Descriptions.Item label="上传时间">
            {format(new Date(currentFile.upload_time), 'yyyy-MM-dd HH:mm:ss')}
          </Descriptions.Item>
          {currentFile.description && (
            <Descriptions.Item label="描述" span={2}>
              {currentFile.description}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    );
  };
  
  // 渲染预测结果
  const renderPredictionResult = () => {
  if (!predictionResult || !predictionResult.predict_data) return null;

  // 提取所有可能的列名（排除prediction）
  const allColumns: string[] = predictionResult.predict_data.reduce(
    (columns: string[], item: Record<string, any>) => {
      Object.keys(item).forEach(key => {
        if (key !== 'prediction' && !columns.includes(key)) {
          columns.push(key);
        }
      });
      return columns;
    }, 
    []
  );

  // 表格列配置（使用严格类型）
  const columns: PredictionTableColumn[] = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      render: (_: any, __: any, index: number) => index + 1,
    },
    ...allColumns.map((column: string) => ({
      title: column,
      dataIndex: column,
      key: column,
      render: (value: number) => value?.toFixed(4) || '-',
    })),
    {
      title: '预测结果',
      dataIndex: 'prediction',
      key: 'prediction',
      render: (value: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          {value?.toFixed(6)}
        </Text>
      ),
    },
  ];

  return (
    <Card title="预测结果" style={{ marginTop: 16 }}>
      <Descriptions bordered column={1}>
        {predictionResult.predict_time && (
          <Descriptions.Item label="预测时间">
            {new Date(predictionResult.predict_time).toLocaleString()}
          </Descriptions.Item>
        )}
        {predictionResult.predict_duration && (
          <Descriptions.Item label="预测耗时">
            {predictionResult.predict_duration.toFixed(2)}秒
          </Descriptions.Item>
        )}
      </Descriptions>

      <Title level={4} style={{ marginTop: 24 }}>预测数据详情</Title>
      <Table
        columns={columns}
        dataSource={predictionResult.predict_data.map((item, index) => ({
          ...item,
          key: index,
        }))}
        pagination={{
          pageSize: 5,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20'],
        }}
        scroll={{ x: 'max-content' }}
        style={{ marginTop: 16 }}
        size="middle"
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
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => {
                const children = option?.children as unknown;
                return typeof children === 'string' 
                  ? children.toLowerCase().includes(input.toLowerCase())
                  : false;
              }}
            >
              {models.map((model: Model) => (
                <Option key={model.id} value={model.id}>
                  {model.model_name} (ID: {model.id})
                </Option>
              ))}
            </Select>
          </div>

          {selectedModel && renderModelDetails()}
          
          <div>
            <Title level={5}>2. 选择数据文件</Title>
            <Select
              style={{ width: '100%' }}
              placeholder="选择文件"
              loading={filesLoading}
              onChange={(value) => setSelectedFile(Number(value))}
              value={selectedFile?.toString()}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => {
                const children = option?.children as unknown;
                return typeof children === 'string' 
                  ? children.toLowerCase().includes(input.toLowerCase())
                  : false;
              }}
            >
              {files.map((file) => (
                <Option key={file.id} value={file.id.toString()}>
                  {file.file_name} ({file?.file_type?.toUpperCase()})
                </Option>
              ))}
            </Select>
          </div>

          {selectedFile && renderFileDetails()}
          
          {isChecking && (
            <div style={{ textAlign: 'center' }}>
              <Spin tip="正在检查文件..." size="large" />
            </div>
          )}
          
          <Button
            type="primary"
            onClick={handlePredict}
            disabled={!selectedFile || !selectedModel || isPredicting || (fileCheckResult && !fileCheckResult.valid) || isChecking}
            icon={isPredicting ? <LoadingOutlined /> : null}
            loading={isPredicting}
            size="large"
            block
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