import React, { useState, useEffect } from 'react';
import {
  Card, Form, Select, Button, Steps, Alert, Typography, Row, Col, Space, Spin,
  Input,
  message,
  Slider
} from 'antd';
import { useGetFilesQuery } from '../features/files/api';
import { useGetFileDataQuery } from '../features/preprocessing/api';
import { useTrainStackingModelMutation } from '../features/stackingtraining/api'
import { addStackingModel } from '../features/stackingtraining/slice';
import { useAppDispatch } from '../store/hooks';
import { stackingModelConfigs } from '../features/stackingtraining/modelConfig';
import { DeploymentUnitOutlined } from '@ant-design/icons';

const { Step } = Steps;
const { Title } = Typography;

type FormValues = {
  input_file_id: number;
  target: string;
  base_model_name: string[];
  meta_model_name: string;
  task_type: 'classification' | 'regression';
  cross_validation: number;
  model_name: string;
};

const StackingTrainingPage = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const dispatch = useAppDispatch();

  // 本地模型配置
  const [trainingResult, setTrainingResult] = useState<any | null>(null);

  // API hooks
  const { data: files, isLoading: isFilesLoading } = useGetFilesQuery();
  const { 
    data: fileData,
    isLoading: isFileDataLoading,
    error: fileDataError
  } = useGetFileDataQuery(selectedFileId!, { skip: !selectedFileId });

  const [trainStackingModel, { isLoading: isTraining }] = useTrainStackingModelMutation();

  // 获取文件列名
  const columns = fileData?.preview?.columns || [];
  const [taskType, setTaskType] = useState<'classification' | 'regression'>('regression');

  // 模型选择时自动识别任务类型
  useEffect(() => {
    const modelId = form.getFieldValue(['model_config', 'model_id']);
    if (!modelId) return;

    const selectedModel = stackingModelConfigs.find(c => c.model_id === modelId);
    if (selectedModel) {
      setTaskType(selectedModel.category as 'classification' | 'regression');
    }
  }, [form.getFieldValue(['model_config', 'model_id']), stackingModelConfigs]);

  // 提交训练请求
  const onFinish = async () => {
    try {
      // 验证必填字段
      await form.validateFields(['input_file_id', 'target', 'meta_model_name']);
      
      // 获取表单值
      const values = form.getFieldsValue();
      
      // 构建训练请求
      const requestData: FormValues = {
        input_file_id: values.input_file_id,
        target: values.target,
        base_model_name: values.base_model_name,
        meta_model_name: values.meta_model_name,
        task_type: values.task_type,
        cross_validation: values.cross_validation,
        model_name: values.model_name || `stacking_${Date.now()}`
      };

      // 发送训练请求
      const result = await trainStackingModel(requestData).unwrap();
      setTrainingResult(result);
      dispatch(addStackingModel(result));
      message.success('模型融合训练成功');
    } catch (err) {
      message.error(`模型融合训练失败: ${err}`);
    }
  };

  // 分步导航控制
  const nextStep = async () => {
    try {
      await form.validateFields();
      setCurrentStep(currentStep + 1);
    } catch (err) {
      console.log('Validation failed:', err);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // 过滤模型（根据任务类型）
  const filteredBaseModels = stackingModelConfigs
    .filter(c => c.type === 'base' && c.category === taskType);

  const filteredMetaModels = stackingModelConfigs
    .filter(c => c.type === 'meta' && c.category === taskType);

  return (
    <Card
      title={
        <Space>
          <DeploymentUnitOutlined /> 模型融合训练
        </Space>
      }
      style={{ borderRadius: 8 }}
    >
      <Spin spinning={isFilesLoading || isFileDataLoading}>
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="数据选择" />
          <Step title="模型选择" />
          <Step title="训练参数" />
        </Steps>

        <Form form={form} layout="vertical" initialValues={{
          cross_validation: 5,
          model_name: `stacking_${Date.now()}`
        }}
        onValuesChange={(changedValues, allValues) => {
                if (changedValues.taskType !== undefined) {
                  setTaskType(changedValues.taskType);
                }
              }}>
          {/* 步骤1：数据选择 */}
          {currentStep === 0 && (
            <>
              <Form.Item name="input_file_id" label="数据文件">
                <Select onChange={setSelectedFileId}>
                  {files?.map(file => (
                    <Select.Option key={file.id} value={file.id}>
                      {file.file_name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="target" label="目标变量">
                <Select disabled={!selectedFileId}>
                  {columns.map((col: string) => (
                    <Select.Option key={col} value={col}>{col}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Button type="primary" onClick={nextStep} disabled={!selectedFileId}>
                下一步
              </Button>
            </>
          )}

          {/* 步骤2：模型选择 */}
          {currentStep === 1 && (
            <>
              <Form.Item name="taskType" label="任务类型">
                <Select placeholder="请选择任务类型">
                  <Select.Option value="classification">分类</Select.Option>
                  <Select.Option value="regression">回归</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="base_model_name" label="基模型">
                <Select mode="multiple" placeholder="选择基模型">
                  {filteredBaseModels.map(config => (
                    <Select.Option key={config.model_id} value={config.model_id}>
                      {config.display_name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="meta_model_name" label="元模型">
                <Select placeholder="选择元模型">
                  {filteredMetaModels.map(config => (
                    <Select.Option key={config.model_id} value={config.model_id}>
                      {config.display_name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Button onClick={prevStep}>上一步</Button>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                  <Button type="primary" onClick={nextStep}>
                    下一步
                  </Button>
                </Col>
              </Row>
            </>
          )}

          {/* 步骤3：训练参数 */}
          {currentStep === 2 && (
            <>
              <Form.Item name="cross_validation" label="交叉验证折数" initialValue={5}>
                <Select options={[
                  { value: 3, label: '3 折' },
                  { value: 5, label: '5 折' },
                  { value: 10, label: '10 折' }
                ]} />
              </Form.Item>
              <Form.Item name="model_name" label="模型名称" initialValue={`stacking_${Date.now()}`}>
                <Input />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Button onClick={prevStep}>上一步</Button>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                  <Space>
                    <Button onClick={() => form.resetFields()}>重置</Button>
                    <Button type="primary" onClick={onFinish} loading={isTraining}>
                      开始训练
                    </Button>
                  </Space>
                </Col>
              </Row>
            </>
          )}
        </Form>
      </Spin>
    </Card>
  );
};

export default StackingTrainingPage;