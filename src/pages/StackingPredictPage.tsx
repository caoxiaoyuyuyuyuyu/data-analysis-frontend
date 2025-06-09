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
  Divider,
  InputNumber,
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
import { useGetStackingTrainingHistoryQuery } from '../features/history/api';
import { useGetFilesQuery } from '../features/files/api';
import { usePredictMutation, useCheckFileMutation } from '../features/stacking_predict/api';
import { PredictionResult, PredictionTableColumn } from '../features/stacking_predict/types';
import { StackingModel } from '../features/stacking_training/types';
import { FileCheckResult } from '../types/files';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  ClusterOutlined
} from '@ant-design/icons';
import { ScatterChart, BarChart, PieChart, LineChart } from '@mui/x-charts';
import { useTheme } from '@mui/material/styles';
import { StackingTrainingHistory } from '../features/history/types';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const StackingPredictPage = () => {
  const [selectedFile, setSelectedFile] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [fileCheckResult, setFileCheckResult] = useState<FileCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Bin configuration for regression results
  const [binConfig, setBinConfig] = useState({
    strategy: 'equal-width' as 'equal-width' | 'equal-frequency',
    binCount: 5,
  });

  // Get user's trained models and files
  const { data: models = [], isLoading: isLoadingModels } = useGetStackingTrainingHistoryQuery();
  const { data: files = [], isLoading: filesLoading } = useGetFilesQuery();
  
  // API hooks
  const [predict] = usePredictMutation();
  const [checkFile] = useCheckFileMutation();

  // Get current selected file and model details
  const currentFile = files.find(f => f.id === selectedFile);
  const currentModel = models.find(m => m.id === selectedModel);

  const [featureCheckResult, setFeatureCheckResult] = useState<{
    isValid: boolean;
    missingColumns?: string[];
    extraColumns?: string[];
    expectedColumns?: string[];
    message?: string;
  } | null>(null);

  // Handle file check when file or model changes
  const handleFileCheck = useCallback(async () => {
    if (!selectedFile || !selectedModel) return;
    
    setIsChecking(true);
    setFeatureCheckResult(null);
    
    try {
      const result = await checkFile({
        file_id: selectedFile,
        model_id: selectedModel
      }).unwrap();
      
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
  }, [selectedFile, selectedModel, checkFile]);

  useEffect(() => {
    handleFileCheck();
  }, [selectedFile, selectedModel, handleFileCheck]);

  // Handle prediction submission
  const handlePredict = useCallback(async () => {
    if (!selectedFile || !selectedModel) {
      message.warning('请先选择模型和数据文件');
      return;
    }
    
    if (!featureCheckResult?.isValid) {
      message.warning('请先解决文件特征不匹配问题');
      return;
    }
    
    setIsPredicting(true);
    setPredictionResult(null);
    
    try {
      const requestBody = {
        training_record_id: selectedModel,
        input_file_id: selectedFile
      };
      
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

  // Data binning function for visualization
  const getBinnedDistributionData = (predictions: any[], config: typeof binConfig) => {
    // For classification, count class occurrences
    if (predictionResult?.visualization?.model_type === 'classification') {
      const classCounts: Record<string, number> = {};
      
      predictions.forEach(pred => {
        const label = String(pred);
        classCounts[label] = (classCounts[label] || 0) + 1;
      });
      
      return Object.entries(classCounts).map(([label, count], i) => ({
        id: `class_${i}`,
        value: count,
        label: label
      }));
    }
    
    // For regression, bin the values
    if (config.strategy === 'equal-width') {
      const min = Math.min(...predictions);
      const max = Math.max(...predictions);
      const step = (max - min) / config.binCount;
      
      return Array.from({ length: config.binCount }).map((_, i) => {
        const lower = min + i * step;
        const upper = lower + step;
        const count = predictions.filter(v => v >= lower && (i === config.binCount - 1 ? v <= upper : v < upper)).length;
        
        return {
          id: `bin_${i}`,
          value: count,
          label: `[${lower.toFixed(2)}, ${upper.toFixed(2)})`
        };
      });
    } else {
      const sorted = [...predictions].sort((a, b) => a - b);
      const binSize = Math.ceil(sorted.length / config.binCount);
      
      return Array.from({ length: config.binCount }).map((_, i) => {
        const startIdx = i * binSize;
        const endIdx = Math.min(startIdx + binSize, sorted.length);
        const lower = sorted[startIdx];
        const upper = endIdx < sorted.length ? sorted[endIdx] : sorted[sorted.length - 1];
        
        return {
          id: `bin_${i}`,
          value: endIdx - startIdx,
          label: `[${lower.toFixed(2)}, ${upper.toFixed(2)})`
        };
      });
    }
  };

  // Render model details
  const renderModelDetails = () => {
    if (!currentModel) return null;

    return (
      <Card 
        title="模型详情" 
        style={{ marginTop: 16 }}
        extra={<Tag color="blue">{currentModel.model_id}</Tag>}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Statistic 
              title="训练耗时" 
              value={currentModel.duration} 
              precision={2}
              valueStyle={{ fontSize: 14, fontWeight: 500, color: '#2f54eb' }}
              suffix="秒"
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          {/* <Col span={8}>
            <Statistic 
              title="模型大小" 
              value={(currentModel.model_file_size / 1024).toFixed(2)} 
              valueStyle={{ fontSize: 14, fontWeight: 500, color: '#2f54eb' }}
              suffix="KB"
              prefix={<FileOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="测试集比例" 
              value={(currentModel.test_size || 0) * 100} 
              valueStyle={{ fontSize: 14, fontWeight: 500, color: '#2f54eb' }}
              suffix="%"
              prefix={<ExperimentOutlined />}
            />
          </Col> */}
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
                        valueStyle={{ fontSize: 14, fontWeight: 500, color: '#2f54eb' }}
                        value={typeof value === 'number' ? value.toFixed(4) : value}
                      />
                    </Card>
                  </List.Item>
                )}
              />
            </Panel>
          )}

          {currentModel.base_model_names && (
            <Panel header="基模型" key="base_model_names">
              <Descriptions bordered column={2}>
                {Object.entries(currentModel.base_model_names).map(([key, value]) => (
                  <Descriptions.Item label={key} key={key}>
                    {String(value)}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </Panel>
          )}

          {currentModel.meta_model_name && (
            <Panel header="元模型" key="meta_model_name">
              <Descriptions bordered column={2}>
                <Descriptions.Item label="元模型名称">
                  {currentModel.meta_model_name}
                </Descriptions.Item>
              </Descriptions>
            </Panel>
          )}
  
          
          <Panel header="训练信息" key="information">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="创建时间">
                {format(new Date(currentModel.created_at), 'yyyy-MM-dd HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="目标列">
                <Tag color="purple">{currentModel.target}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Panel>
        </Collapse>
      </Card>
    );
  };

  // Render file details
  const renderFileDetails = () => {
    if (!currentFile) return null;

    return (
      <Card title="文件详情" style={{ marginTop: 16 }}
        extra={
          <Button 
            type="primary" 
            size="small"
            icon={<ToolOutlined />}
            onClick={() => navigate(`/preprocessing/${currentFile.id}`)}
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

  // Render file check results
  const renderFileCheckResult = () => {
    if (!featureCheckResult || !currentFile || !currentModel) return null;
    
    return (
      <Card title="文件特征检查" style={{ marginTop: 16 }}>
        {featureCheckResult.isValid ? (
          <Alert
            message="文件检查通过"
            description={`文件 ${currentFile.file_name} 的特征列与模型 ${currentModel.model_id} 匹配`}
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
          />
        )}
        
        <Divider />
        
        <Row gutter={[16, 16]}>
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
                style={{ maxHeight: 200, overflowY: 'auto' }}
              >
                <Text code style={{ wordBreak: 'break-word' }}>
                  {featureCheckResult.expectedColumns.join(', ')}
                </Text>
              </Card>
            </Col>
          )}

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
                style={{ borderColor: '#ff4d4f', borderRadius: 8, maxHeight: 200, overflowY: 'auto' }}
              >
                <Text code type="danger" style={{ wordBreak: 'break-word' }}>
                  {featureCheckResult.missingColumns.join(', ')}
                </Text>
              </Card>
            </Col>
          )}

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
                style={{ borderColor: '#52c41a', borderRadius: 8, maxHeight: 200, overflowY: 'auto' }}
              >
                <Text code type="success" style={{ wordBreak: 'break-word' }}>
                  {featureCheckResult.extraColumns.join(', ')}
                </Text>
              </Card>
            </Col>
          )}
        </Row>
      </Card>
    );
  };

  // Render prediction results table
  const renderPredictionResult = () => {
    if (!predictionResult || !predictionResult.predict_data) return null;

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
        render: (value) => (
          <Text strong style={{ color: '#1890ff' }}>
              {typeof value === 'number' ? value.toFixed(6) : String(value)}
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

  // Render visualizations
  const renderVisualizations = () => {
    if (!predictionResult?.visualization) return null;
    
    const { visualization } = predictionResult;
    
    return (
      <Card title="预测可视化分析" style={{ marginTop: 16 }}>
        <Collapse defaultActiveKey={['classification_metrics']}>
          {visualization.basic_metrics && (
            <Panel 
              header={
                <Space>
                  <BarChartOutlined />
                  <span>分类指标</span>
                  <Tag color="blue">模型评估</Tag>
                </Space>
              } 
              key="classification_metrics"
            >
              <Row gutter={16}>
                {Object.entries(visualization.basic_metrics).map(([key, value]) => (
                  <Col span={6} key={key}>
                    <Card size="small">
                      <Statistic
                        title={key.charAt(0).toUpperCase() + key.slice(1)}
                        value={value as number}
                        precision={4}
                        valueStyle={{ fontSize: 14, fontWeight: 500, color: '#2f54eb' }}
                        formatter={val => typeof val === 'number' ? val.toFixed(4) : String(val)}
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
              {visualization.class_labels && (
                <div style={{ marginTop: 16 }}>
                  <Text strong>类别标签: </Text>
                  {visualization.class_labels.map(label => (
                    <Tag key={label} color="geekblue" style={{ marginRight: 8 }}>
                      {label}
                    </Tag>
                  ))}
                </div>
              )}
            </Panel>
          )}

          {visualization.feature_importance && (
            <Panel 
              header={
                <Space>
                  <BarChartOutlined />
                  <span>特征重要性</span>
                </Space>
              } 
              key="feature_importance"
            >
              <div style={{ height: 400 }}>
                <BarChart
                  xAxis={[{
                    scaleType: 'band',
                    data: visualization.feature_importance.features,
                    label: '特征',
                  }]}
                  series={[{
                    data: visualization.feature_importance.importance,
                    label: '重要性',
                    color: theme.palette.primary.main
                  }]}
                  margin={{ left: 100 }}
                />
              </div>
            </Panel>
          )}
          
          {visualization.distribution && (
            <Panel 
              header={
                <Space>
                  <PieChartOutlined />
                  <span>预测结果分布</span>
                </Space>
              } 
              key="distribution"
            >
              {visualization.model_type !== 'classification' && (
                <Card size="small" style={{ marginBottom: 16 }}>
                  <Space>
                    <span>分箱策略：</span>
                    <Select
                      value={binConfig.strategy}
                      onChange={(value) => setBinConfig({...binConfig, strategy: value})}
                      style={{ width: 120 }}
                    >
                      <Option value="equal-width">等宽分箱</Option>
                      <Option value="equal-frequency">等频分箱</Option>
                    </Select>
                    
                    <span>分箱数量：</span>
                    <InputNumber 
                      min={3} 
                      max={15} 
                      value={binConfig.binCount}
                      onChange={(value) => setBinConfig({...binConfig, binCount: value || 5})}
                    />
                  </Space>
                </Card>
              )}

              <div style={{ height: 400 }}>
                <PieChart
                  series={[{
                    data: getBinnedDistributionData(
                      predictionResult.predict_data.map(d => d.prediction),
                      binConfig
                    ),
                    innerRadius: 30,
                    outerRadius: 100,
                  }]}
                  width={400}
                  height={400}
                />
              </div>
            </Panel>
          )}
          
          {visualization.cluster_visualization && (
            <Panel 
              header={
                <Space>
                  <ClusterOutlined />
                  <span>聚类可视化</span>
                </Space>
              } 
              key="cluster_visualization"
            >
              <div style={{ height: 500 }}>
                <ScatterChart
                  xAxis={[{ label: 'PC1' }]}
                  yAxis={[{ label: 'PC2' }]}
                  series={[
                    {
                      data: visualization.cluster_visualization.x.map((x, i) => ({
                        x,
                        y: visualization.cluster_visualization?.y[i] || 0,
                        id: i,
                        cluster: visualization.cluster_visualization?.labels[i] || 0
                      })),
                      label: '数据点',
                      valueFormatter: (params) => `点 ${params?.id}`
                    }
                  ]}
                  width={600}
                  height={500}
                />
              </div>
            </Panel>
          )}
          
          {visualization.model_type === 'regression' && visualization.distribution?.actual && (
            <Panel 
              header={
                <Space>
                  <LineChartOutlined />
                  <span>预测 vs 实际值</span>
                </Space>
              } 
              key="regression_comparison"
            >
              <div style={{ height: 400 }}>
                <LineChart
                  xAxis={[{ data: Object.keys(visualization.distribution.actual), scaleType: 'point' }]}
                  series={[
                    {
                      data: Object.values(visualization.distribution.actual),
                      label: '实际值',
                      color: theme.palette.success.main
                    },
                    {
                      data: Object.values(visualization.distribution.predicted),
                      label: '预测值',
                      color: theme.palette.primary.main
                    }
                  ]}
                />
              </div>
            </Panel>
          )}
        </Collapse>
      </Card>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title="Stacking模型预测">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={5}>1. 选择训练好的Stacking模型</Title>
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
              {models.map((model: StackingTrainingHistory) => (
                <Option key={model.id} value={model.id}>
                  {model.model_id} (ID: {model.id})
                </Option>
              ))}
            </Select>
          </div>

          {selectedModel && renderModelDetails()}
          
          <div>
            <Title level={5}>2. 选择预测数据文件</Title>
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
            disabled={!selectedFile || !selectedModel || isPredicting || (featureCheckResult && !featureCheckResult.isValid) || isChecking}
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
      {renderVisualizations()}
    </div>
  );
};

export default StackingPredictPage;