// 在 src/components 目录下创建 OutlierHandlingPanel.tsx 文件
import { Card, Form, Radio, Button, Space, Typography, Divider, Spin, Alert } from 'antd';
import { useGetFileDataQuery } from '../features/preprocessing/api';
import { useState } from 'react';

const { Text } = Typography;

interface OutlierHandlingPanelProps {
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

const OutlierHandlingPanel = ({ fileId, onApply }: OutlierHandlingPanelProps) => {
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
        type: 'outlier_handling',
        params: values,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <Spin tip="加载数据..." />;

  if (queryError) {
    const errMsg = (queryError as any)?.data?.error || '加载数据失败';
    return <Alert message={errMsg} type="error" />;
  }

  return (
    <Card title="异常值处理" bordered={false}>
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
          label="处理方法"
          initialValue="z_score"
          rules={[{ required: true, message: '请选择处理方法' }]}
        >
          <Radio.Group>
            <Radio value="z_score">Z-score 方法</Radio>
            <Radio value="iqr">IQR 方法</Radio>
          </Radio.Group>
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

export default OutlierHandlingPanel;