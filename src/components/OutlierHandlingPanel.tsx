import { 
  Card, Form, Radio, Button, Space, 
  Typography, Divider, Spin, Alert, 
  InputNumber, Select, Row, Col 
} from 'antd';
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
  const [selectedMethod, setSelectedMethod] = useState('zscore');

  const { data: fileData, isLoading, error: queryError } = useGetFileDataQuery(fileId);
  const previewData = (fileData as FileDataResponse)?.preview;
  const metadata = (fileData as FileDataResponse)?.metadata;
  
  // 获取数值类型的列
  const numericColumns = previewData?.columns.filter(col => {
    if (fileData?.statistics?.dtypes) {
      const dtype = fileData.statistics.dtypes[col];
      return dtype === 'int64' || dtype === 'float64';
    }
    return true; // 如果没有数据类型信息，默认所有列
  }) || [];

  const handleSubmit = async () => {
    try {
      setError(null);
      setIsProcessing(true);
      const values = await form.validateFields();
      
      await onApply({
        type: 'outlier_handling',
        params: {
          method: values.method,
          threshold: values.threshold,
          columns: values.columns || numericColumns, // 默认所有数值列
        },
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

      <Form form={form} layout="vertical" initialValues={{ method: 'zscore', threshold: 3 }}>
        <Form.Item
          name="method"
          label="处理方法"
          rules={[{ required: true, message: '请选择处理方法' }]}
        >
          <Radio.Group onChange={(e) => setSelectedMethod(e.target.value)}>
            <Radio value="zscore">Z-score 方法</Radio>
            <Radio value="iqr">IQR 方法</Radio>
          </Radio.Group>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="threshold"
              label={selectedMethod === 'zscore' ? 'Z-score 阈值' : 'IQR 倍数'}
              rules={[{ required: true, message: '请输入阈值' }]}
            >
              <InputNumber 
                min={0.5} 
                max={selectedMethod === 'zscore' ? 10 : 5} 
                step={0.5} 
                style={{ width: '100%' }} 
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="columns"
              label="选择处理列"
            >
              <Select 
                mode="multiple" 
                placeholder="请选择要处理的列（默认全选）"
                style={{ width: '100%' }}
              >
                {numericColumns.map(col => (
                  <Select.Option key={col} value={col}>
                    {col}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

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