import { Card, Form, InputNumber, Button, Space, Typography, Divider, Spin, Alert, Select } from 'antd';
import { useGetFileDataQuery } from '../features/preprocessing/api';
import { useState } from 'react';

const { Text } = Typography;
const { Option } = Select;

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
  const dtypes = (fileData as FileDataResponse)?.statistics?.dtypes || {};

  // 获取数值类型的列
  const numericColumns = previewData?.columns.filter(
    column => ['int64', 'float64', 'int32', 'float32'].includes(dtypes[column])
  ) || [];

  const handleSubmit = async () => {
    try {
      setError(null);
      setIsProcessing(true);
      const values = await form.validateFields();
      await onApply({
        type: 'pca',
        ...values,
        // 使用用户选择的列，如果未选择则使用所有数值列
        columns: values.columns || numericColumns
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
      
      {/* 添加PCA说明文字 */}
      {/* <Alert
        message="PCA 说明"
        description={
          <div>
            <p>主成分分析 (PCA) 是一种降维技术，用于：</p>
            <ul>
              <li>减少数据集维度，保留最重要的特征</li>
              <li>消除特征间的相关性</li>
              <li>提升算法效率并避免维度灾难</li>
              <li>可视化高维数据（通常降至2-3维）</li>
            </ul>
            <p>选择数值型特征进行分析，非数值特征将被自动忽略。</p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      /> */}

      {error && (
        <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />
      )}

      <Form form={form} layout="vertical" initialValues={{ n_components: 2 }}>
        {/* 添加特征列选择器 */}
        <Form.Item
          name="columns"
          label="选择特征列"
          rules={[{ required: true, message: '请至少选择一个特征列' }]}
          extra="仅显示数值类型的列"
        >
          <Select
            mode="multiple"
            placeholder="请选择要分析的列"
            allowClear
            style={{ width: '100%' }}
          >
            {numericColumns.map(column => (
              <Option key={column} value={column}>
                {column} ({dtypes[column]})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="n_components"
          label="保留的主成分数量"
          rules={[{ required: true, message: '请输入保留的主成分数量' }]}
          extra="设置降维后的维度数量（通常为2-3用于可视化）"
        >
          <InputNumber min={1} max={numericColumns.length} />
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