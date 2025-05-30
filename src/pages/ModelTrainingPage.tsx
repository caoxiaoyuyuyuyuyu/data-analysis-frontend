import { useState, useEffect } from 'react';
import { 
  Card, Form, Input, Button, Select, Slider, message, 
  Row, Col, Divider, Steps, Alert, Typography, Space, Spin,
  Collapse, Tag
} from 'antd';
import { 
  useGetFilesQuery
} from '../features/files/api';
import { useGetFileDataQuery } from '../features/preprocessing/api';
import { 
  useTrainModelMutation,
  useGetModelConfigsQuery 
} from '../features/models/api';
import { addModel } from '../features/training/slice';
import { useAppDispatch } from '../store/hooks';
import { 
  FileOutlined, DatabaseOutlined, 
  DeploymentUnitOutlined, QuestionCircleOutlined 
} from '@ant-design/icons';
import { ModelParameter } from '../features/models/types';
import { ModelTrainingRequest, Model } from '../features/models/types';


import ReactECharts from 'echarts-for-react';
import { Descriptions, Tabs } from 'antd';
import { format } from 'date-fns';

const { Panel } = Collapse;
const { Option } = Select;
const { Step } = Steps;
const { Title } = Typography;
type FormValues = {
  file_id: number;
  target_column: string;
  model_config: {
    model_type: string;
    parameters?: Record<string, any>;
  };
  test_size?: number;
  model_name?: string;
};
const ModelTrainingPage = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [isModelSelected, setIsModelSelected] = useState(false);
  const dispatch = useAppDispatch();
  // 在组件内部添加以下状态
  const [trainingResult, setTrainingResult] = useState<Model | null>(null);
  const [useDefaultParams, setUseDefaultParams] = useState(true); // 新增状态：是否使用默认参数
  
  // API hooks
  const { data: files, isLoading: isFilesLoading } = useGetFilesQuery();
  const { 
    data: fileData,
    isLoading: isFileDataLoading,
    error: fileDataError
  } = useGetFileDataQuery(selectedFileId!, { skip: !selectedFileId });
  
  const { 
    data: modelConfigs = [], 
    isLoading: isConfigsLoading 
  } = useGetModelConfigsQuery();
  
  const [trainModel, { isLoading: isTraining }] = useTrainModelMutation();

  // 获取文件的列名
  const columns = fileData?.preview?.columns || [];
  
  // 动态渲染参数输入控件
  const renderParameterInput = (param: ModelParameter) => {
    const commonProps = {
      defaultValue: param.default,
      placeholder: param.description,
      disabled: useDefaultParams // 根据 useDefaultParams 控制禁用状态
    };

    switch(param.type) {
      case 'number':
        return (
          <Slider 
            {...commonProps}
            min={param.min} 
            max={param.max} 
            step={param.step}
            marks={{
              [param.min!]: param.min,
              [param.max!]: param.max
            }}
          />
        );
      case 'select':
        return (
          <Select {...commonProps}>
            {param.options?.map(opt => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        );
      case 'boolean':
        return <Select {...commonProps} options={[
          { value: true, label: '是' },
          { value: false, label: '否' }
        ]} />;
      default:
        return <Input {...commonProps} />;
    }
  };

  // 初始化表单值
  useEffect(() => {
    if (modelConfigs.length > 0 && currentStep === 2) {
      const modelId = form.getFieldValue(['model_config', 'model_id']);
      const config = modelConfigs.find(c => c.model_id === modelId);
      
      if (config) {
        // 初始化所有参数字段
        const initialParams = config.parameters.reduce((acc, param) => {
          acc[param.name] = param.default;
          return acc;
        }, {} as Record<string, any>);
        
        form.setFieldsValue({
          'model_config': {
            'parameters': initialParams
          }
        });
      }
    }
  }, [currentStep, modelConfigs]);

  const onFinish = async () => {
    try {
      // 1. 首先验证必填字段
      await form.validateFields(['file_id', 'target_column', ['model_config', 'model_id']]);
      
      // 2. 手动获取所有字段值
      const values = {
        file_id: form.getFieldValue('file_id'),
        target_column: form.getFieldValue('target_column'),
        model_config: {
          model_id: form.getFieldValue(['model_config', 'model_id']),
          parameters: useDefaultParams ? {} : form.getFieldValue(['model_config', 'parameters']) || {} // 根据 useDefaultParams 决定是否使用自定义参数
        },
        use_default: useDefaultParams,
        test_size: form.getFieldValue('test_size') || 0.2,
        model_name: form.getFieldValue('model_name') || `model_${new Date().getTime()}`
      };

      // console.log('最终表单值:', values);
      
      // 3. 构建请求数据
      const requestData: ModelTrainingRequest = {
        file_id: values.file_id,
        target_column: values.target_column,
        model_config: values.model_config,
        use_default: values.use_default,
        test_size: values.test_size,
        model_name: values.model_name
      };

      console.log('请求数据:', requestData);
      const result = await trainModel(requestData).unwrap();
      
      setTrainingResult(result); // 保存训练结果
      // console.log('训练结果:', result);
      console.log('训练结果:', trainingResult);
      
      dispatch(addModel(result));
      message.success(`模型训练成功！`);
    } catch (err) {
      message.error(
        `模型训练失败: ${
          (err as { data?: { error?: string } })?.data?.error || 
          (err as Error)?.message || 
          '未知错误'
        }`
      );
      console.error('Training error:', err);
    }
  };
    const nextStep = async () => {
      try {
        // 验证当前步骤字段
        await form.validateFields();
        setCurrentStep(currentStep + 1);
      } catch (err) {
        console.log('Validation failed:', err);
      }
    };

  const prevStep = () => setCurrentStep(currentStep - 1);

    
  const renderTrainingResult = () => {
    if (!trainingResult) return null;

    // 学习曲线图表配置
    const learningCurveOption = {
      title: {
        text: '学习曲线',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          return `训练集大小: ${params[0].value}<br/>
                  训练集得分: ${params[0].data[1].toFixed(4)}<br/>
                  测试集得分: ${params[1].data[1].toFixed(4)}`;
        }
      },
      legend: {
        data: ['训练集', '测试集'],
        bottom: 10
      },
      xAxis: {
        type: 'value',
        name: '训练样本数',
        nameLocation: 'middle',
        nameGap: 25
      },
      yAxis: {
        type: 'value',
        name: '得分',
        min: 0,
        max: 1
      },
      series: [
        {
          name: '训练集',
          type: 'line',
          data: trainingResult.learning_curve.train_sizes.map((size, i) => [
            size,
            trainingResult.learning_curve.train_scores[i]
          ]),
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: {
            color: '#1890ff'
          }
        },
        {
          name: '测试集',
          type: 'line',
          data: trainingResult.learning_curve.train_sizes.map((size, i) => [
            size,
            trainingResult.learning_curve.test_scores[i]
          ]),
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: {
            color: '#52c41a'
          }
        }
      ]
    };

    // 指标卡片配置
    const metricsItems = [
      {
        key: '1',
        label: '模型信息',
        children: (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="模型名称">{trainingResult.model_name}</Descriptions.Item>
            <Descriptions.Item label="训练时间">
              {format(new Date(trainingResult.created_at), 'yyyy-MM-dd HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="训练时长">
              {trainingResult.duration.toFixed(2)} 秒
            </Descriptions.Item>
            <Descriptions.Item label="数据文件">{trainingResult.file_name}</Descriptions.Item>
          </Descriptions>
        )
      },
      {
        key: '2',
        label: '评估指标',
        children: (
          <Descriptions bordered column={2}>
            {Object.entries(trainingResult.metrics).map(([key, value]) => (
              <Descriptions.Item key={key} label={key.toUpperCase()}>
                {typeof value === 'number' ? value.toFixed(4) : value}
              </Descriptions.Item>
            ))}
          </Descriptions>
        )
      }
    ];

    return (
      <div style={{ marginTop: 24 }}>
        <Alert
          message="训练结果"
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: '1',
              label: '学习曲线',
              children: <ReactECharts option={learningCurveOption} style={{ height: 400 }} />
            },
            {
              key: '2',
              label: '模型信息',
              children: (
                <Tabs
                  defaultActiveKey="1"
                  items={metricsItems}
                />
              )
            },
            {
              key: '3',
              label: '参数详情',
              children: (
                <Descriptions bordered column={2}>
                  {Object.entries(trainingResult.model_parameters).map(([key, value]) => (
                    <Descriptions.Item key={key} label={key}>
                      {typeof value === 'boolean' ? (value ? '是' : '否') : value}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              )
            }
          ]}
        />
      </div>
    );
  };


  // 修改返回部分，将多个Form合并为一个
  return (
    <Card 
      title={
        <Space>
          <DeploymentUnitOutlined />
          <Title level={4} style={{ margin: 0 }}>模型训练</Title>
        </Space>
      }
      style={{ borderRadius: 8 }}
    >
      <Spin spinning={isFilesLoading || isFileDataLoading || isConfigsLoading}>
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="数据选择" icon={<FileOutlined />} />
          <Step title="模型配置" icon={<DatabaseOutlined />} />
          <Step title="训练参数" icon={<DeploymentUnitOutlined />} />
        </Steps>

        <Form form={form} layout="vertical"
            initialValues={{
              test_size: 0.2,
              model_name: `model_${new Date().getTime()}`
            }}>
          {/* 步骤1内容 */}
          {currentStep === 0 && (
            <>
              <Alert 
                message="请选择训练数据和目标变量" 
                type="info" 
                showIcon 
                style={{ marginBottom: 16 }}
              />
              
              <Form.Item
                name="file_id"
                label="数据文件"
                rules={[{ required: true, message: '请选择数据文件' }]}
              >
                <Select
                  placeholder="选择文件"
                  onChange={setSelectedFileId}
                  showSearch
                  optionFilterProp="children"
                >
                  {files?.map(file => (
                    <Option key={file.id} value={file.id}>
                      {file.file_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="target_column"
                label="目标变量"
                rules={[{ required: true, message: '请选择目标变量' }]}
              >
                <Select
                  placeholder="选择目标列"
                  loading={isFileDataLoading}
                  disabled={!selectedFileId}
                >
                  {columns.map(col => (
                    <Option key={col} value={col}>
                      {col}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {fileDataError && (
                <Alert 
                  message={`加载列信息失败: ${(fileDataError as any)?.data?.error || '未知错误'}`}
                  type="error" 
                  style={{ marginBottom: 16 }}
                />
              )}

              <Form.Item style={{ marginTop: 24 }}>
                <Button 
                  type="primary" 
                  onClick={nextStep}
                  disabled={!selectedFileId || !!fileDataError}
                >
                  下一步
                </Button>
              </Form.Item>
            </>
          )}

          {/* 步骤2内容 */}
          {currentStep === 1 && (
            <>
              <Alert 
                message="选择模型类型" 
                type="info" 
                showIcon 
                style={{ marginBottom: 16 }}
              />
              
              <Form.Item
                name={['model_config', 'model_id']}
                label="模型类型"
                rules={[{ required: true, message: '请选择模型类型' }]}
              >
                <Select
                  placeholder="选择模型类型"
                  onChange={(value) => {
                    setIsModelSelected(!!value);
                  }}
                >
                  {modelConfigs.map(config => (
                    <Option key={config.model_id} value={config.model_id}>
                      <Space>
                        <span>{config.display_name}</span>
                        <Tag color={config.category === 'classification' ? 'blue' : (config.category === 'clustering' ? 'pink' : 'orange')}>
                          {config.category === 'classification' ? '分类' : config.category === 'clustering' ? '聚类' : '回归'}
                        </Tag>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="model_name"
                label="模型名称"
                initialValue={`model_${new Date().getTime()}`}
              >
                <Input placeholder="输入模型名称" />
              </Form.Item>

              <Form.Item
                name="test_size"
                label="测试集比例"
                initialValue={0.2}
                tooltip="用于评估模型性能的数据比例"
              >
                <Slider 
                  min={0.1} 
                  max={0.5} 
                  step={0.05}
                  marks={{ 0.1: '10%', 0.3: '30%', 0.5: '50%' }}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Button onClick={prevStep}>上一步</Button>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                  <Button 
                    type="primary" 
                    onClick={nextStep}
                    disabled={!form.getFieldValue(['model_config', 'model_id'])}
                  >
                    下一步
                  </Button>
                </Col>
              </Row>
            </>
          )}

          {/* 步骤3内容 */}
          {currentStep === 2 && (
            <>
              <Alert 
                message="请选择是否使用默认参数，并设置训练参数" 
                type="info" 
                style={{ marginBottom: 16 }}
              />
              <Form.Item
                name="useDefaultParams"
                label="是否使用默认参数"
                rules={[{ required: true, message: '请选择是否使用默认参数' }]}
              >
                <Select
                  onChange={(value) => setUseDefaultParams(value === 'yes')}
                >
                  <Option value="yes">是</Option>
                  <Option value="no">否</Option>
                </Select>
              </Form.Item>
              <Alert 
                message="配置模型参数" 
                type="info" 
                showIcon 
                style={{ marginBottom: 16 }}
              />
              
              <Collapse defaultActiveKey={['1']}>
                <Panel 
                  key="1" 
                  header={
                    <Space>
                      <span>高级参数</span>
                      <Tag>
                        {modelConfigs.find(
                          c => c.model_id === form.getFieldValue(['model_config', 'model_id'])
                        )?.display_name}
                      </Tag>
                    </Space>
                  }
                >
                  {modelConfigs
                    .find(c => c.model_id === form.getFieldValue(['model_config', 'model_id']))
                    ?.parameters.map(param => (
                      <Form.Item
                        key={param.name}
                        name={['model_config', 'parameters', param.name]}
                        label={
                          <Space>
                            <span>{param.name}</span>
                            {param.description && (
                              <QuestionCircleOutlined 
                                title={param.description}
                                style={{ color: '#1890ff' }}
                              />
                            )}
                          </Space>
                        }
                        initialValue={param.default}
                        tooltip={param.description}
                      >
                        {renderParameterInput(param)}
                      </Form.Item>
                    ))
                  }
                </Panel>
              </Collapse>

              <Divider />

              <Row gutter={16}>
                <Col span={12}>
                  <Button onClick={prevStep}>上一步</Button>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                  <Space>
                    <Button onClick={() => form.resetFields()}>重置</Button>
                    <Button 
                      type="primary" 
                      onClick={onFinish}
                      loading={isTraining}
                    >
                      开始训练
                    </Button>
                  </Space>
                </Col>
              </Row>
            </>
          )}
        </Form>
      </Spin>
      {trainingResult && renderTrainingResult()}
    </Card>
  );
};

export default ModelTrainingPage;