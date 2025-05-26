import { useState } from 'react';
import { 
  Card, 
  Form, 
  Radio, 
  Button, 
  Space, 
  Typography, 
  Divider,
  InputNumber,
  Alert,
  Select,
  Spin,
} from 'antd';
import { useGetFileDataQuery } from '../features/preprocessing/api'; // 新增导入

const { Text } = Typography;

interface MissingValueParams {
  strategy: 'mean' | 'median' | 'most_frequent' | 'constant' | 'drop';
  fill_value?: number | string;
  columns?: string[];
}

interface MissingValuesPanelProps {
  fileId: number;
  onApply: (params: MissingValueParams) => Promise<void>;
}

const MissingValuesPanel = ({ fileId, onApply }: MissingValuesPanelProps) => {
  const [form] = Form.useForm<MissingValueParams>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 使用 useGetFileDataQuery 获取数据
  const { data, isLoading, error: queryError } = useGetFileDataQuery(fileId);
  
  // 从返回数据中获取列名
  const columns = data?.preview?.columns || [];

  const handleSubmit = async () => {
    try {
      setError(null);
      setIsProcessing(true);
      const values = await form.validateFields();
      
      const finalParams = {
        ...values,
        columns: values.columns || columns
      };

      await onApply(finalParams);
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
    <Card 
      title="缺失值处理" 
      bordered={false}
      headStyle={{ borderBottom: '1px solid #f0f0f0' }}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        当前文件ID: {fileId}
      </Text>
      
      {error && (
        <Alert 
          message={error} 
          type="error" 
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          strategy: 'mean',
          columns: [],
        }}
      >
        <Form.Item
          name="columns"
          label="选择要处理的列"
          rules={[{ required: true, message: '请至少选择一列' }]}
        >
          <Select
            mode="multiple"
            placeholder="全选默认处理所有列"
            options={columns.map(col => ({ value: col, label: col }))}
            allowClear
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="strategy"
          label="处理策略"
          rules={[{ required: true, message: '请选择处理策略' }]}
        >
          <Radio.Group buttonStyle="solid">
            <Radio.Button value="mean">均值填充</Radio.Button>
            <Radio.Button value="median">中位数填充</Radio.Button>
            <Radio.Button value="most_frequent">众数填充</Radio.Button>
            <Radio.Button value="constant">固定值填充</Radio.Button>
            <Radio.Button value="drop">删除缺失行</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prev, curr) => prev.strategy !== curr.strategy}
        >
          {() => {
            const strategy = form.getFieldValue('strategy');
            
            return strategy === 'constant' ? (
              <Form.Item
                name="fill_value"
                label="填充值"
                rules={[{ required: true, message: '请输入填充值' }]}
                validateFirst
              >
                <InputNumber 
                  style={{ width: 200 }}
                  placeholder="输入数值或字符串"
                />
              </Form.Item>
            ) : strategy === 'drop' ? (
              <Alert 
                message="注意：这将永久删除包含缺失值的行" 
                type="warning"
                showIcon
              />
            ) : null;
          }}
        </Form.Item>

        <Divider />
        
        <Form.Item>
          <Space>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={isProcessing}
              disabled={isProcessing}
            >
              {isProcessing ? '处理中...' : '应用处理'}
            </Button>
            <Button 
              onClick={() => {
                form.resetFields();
                setError(null);
              }}
            >
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default MissingValuesPanel;