import { Card, Form, Checkbox, Button, Space, Typography, Divider, Radio, Spin, Alert } from 'antd';
import { useGetFileDataQuery } from '../features/preprocessing/api';
import { useState } from 'react';

const { Text } = Typography;

interface FeatureScalingPanelProps {
  fileId: number;
  onApply: (params: any) => Promise<void>;
}

interface FileDataResponse {
  metadata: {
    file_id: number;
    file_name: string;
  };
  preview: {
    columns: string[];
    sample_data: Record<string, any>[];
  };
  statistics?: {
    dtypes?: Record<string, string>;
  };
}

const FeatureScalingPanel = ({ fileId, onApply }: FeatureScalingPanelProps) => {
  const [form] = Form.useForm();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { data: fileData, isLoading, error: queryError } = useGetFileDataQuery(fileId);
  const previewData = (fileData as FileDataResponse)?.preview;
  const metadata = (fileData as FileDataResponse)?.metadata;

  const handleSubmit = async () => {
    try {
      setError(null);
      setIsProcessing(true);
      const values = await form.validateFields();
      await onApply({
        type: 'feature_scaling',
        ...values,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败');
    } finally {
      setIsProcessing(false);
    }
  };

  // 获取数值型列名
  const numericColumns = previewData?.columns?.filter((col: string) => {
    const sampleValue = previewData?.sample_data?.[0]?.[col];
    return !isNaN(parseFloat(sampleValue));
  }) || [];

  if (isLoading) return <Spin tip="加载数据..." />;
  
  if (queryError) {
    const errMsg = (queryError as any)?.data?.error || '加载数据失败';
    return <Alert message={errMsg} type="error" />;
  }

  return (
    <Card title="特征缩放" bordered={false}>
      <Text type="secondary">
        当前文件: {metadata?.file_name || '未知文件'} (ID: {fileId})
      </Text>
      <Divider />

      {error && (
        <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="method"
          label="缩放方法"
          initialValue="standard"
          rules={[{ required: true, message: '请选择缩放方法' }]}
        >
          <Radio.Group>
            <Radio value="standard">标准化 (StandardScaler)</Radio>
            <Radio value="minmax">归一化 (MinMaxScaler)</Radio>
            <Radio value="robust">鲁棒缩放 (RobustScaler)</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="columns"
          label="选择要缩放的列"
          rules={[{ required: true, message: '请至少选择一列' }]}
        >
          <Checkbox.Group options={numericColumns.map(col => ({ label: col, value: col }))} />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={isProcessing}
            >
              应用处理
            </Button>
            <Button onClick={() => form.resetFields()}>重置</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default FeatureScalingPanel;