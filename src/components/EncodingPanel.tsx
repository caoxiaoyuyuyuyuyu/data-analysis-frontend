import { Card, Form, Select, Button, Space, Typography, Divider, Spin, Alert } from 'antd';
import { useState } from 'react';
import { useGetFileDataQuery } from '../features/preprocessing/api';

const { Text } = Typography;
const { Option } = Select;

interface EncodingPanelProps {
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

const EncodingPanel = ({ fileId, onApply }: EncodingPanelProps) => {
  const [form] = Form.useForm();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { data: fileData, isLoading, error: queryError } = useGetFileDataQuery(fileId);
  const previewData = (fileData as FileDataResponse)?.preview;
  const metadata = (fileData as FileDataResponse)?.metadata;

  // 获取可能的分类列名
  const potentialCategoricalColumns = previewData?.columns?.filter((col: string) => {
    const sampleValue = previewData?.sample_data?.[0]?.[col];
    return isNaN(parseFloat(sampleValue));
  }) || [];

  const handleSubmit = async () => {
    try {
      setError(null);
      setIsProcessing(true);
      const values = await form.validateFields();
      await onApply({
        type: 'encoding',
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
    <Card title="编码分类变量" bordered={false}>
      <Text type="secondary">
        当前文件: {metadata?.file_name || '未知文件'} (ID: {fileId})
      </Text>
      <Divider />

      {error && (
        <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="columns"
          label="选择分类列"
          rules={[{ required: true, message: '请至少选择一列' }]}
        >
          <Select
            mode="multiple"
            placeholder="请选择需要编码的列"
            style={{ width: '100%' }}
          >
            {potentialCategoricalColumns.map((col: string) => (
              <Option key={col} value={col}>
                {col}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="method"
          label="编码方法"
          initialValue="onehot"
          rules={[{ required: true, message: '请选择编码方法' }]}
        >
          <Select placeholder="请选择编码方法">
            <Option value="onehot">One-Hot 编码</Option>
            <Option value="ordinal">序号编码</Option>
            <Option value="target">目标编码</Option>
          </Select>
        </Form.Item>
        {/* 其余表单代码保持不变 */}
        {/* ... */}
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

export default EncodingPanel;