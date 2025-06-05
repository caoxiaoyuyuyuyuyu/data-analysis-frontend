import { Card, Form, InputNumber, Button, Space, Typography, Divider, Spin, Alert } from 'antd';
import { useGetFileDataQuery } from '../features/preprocessing/api';
import { useState } from 'react';

const { Text } = Typography;

interface PCAPanelProps {
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

const PCAPanel = ({ fileId, onApply }: PCAPanelProps) => {
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
        type: 'pca',
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
    <Card title="主成分分析（PCA）" bordered={false}>
      <Text type="secondary">
        当前文件: {metadata?.file_name || '未知文件'} (ID: {fileId})
      </Text>
      <Divider />

      {error && (
        <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="n_components"
          label="保留的主成分数量"
          initialValue={2}
          rules={[{ required: true, message: '请输入保留的主成分数量' }]}
        >
          <InputNumber min={1} />
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

export default PCAPanel;