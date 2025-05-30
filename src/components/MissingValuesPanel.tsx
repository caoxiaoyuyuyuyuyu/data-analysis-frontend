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
  Row,
  Col,
  Table,
  Tag
} from 'antd';
import { useGetFileDataQuery } from '../features/preprocessing/api';
import { FileDataResponse } from '../features/preprocessing/api';

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

interface MissingValueStats {
  column: string;
  missing_count: number;
  missing_percentage: string;
  data_type: string;
}

const MissingValuesPanel = ({ fileId, onApply }: MissingValuesPanelProps) => {
  const [form] = Form.useForm<MissingValueParams>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, error: queryError } = useGetFileDataQuery(fileId);
  const stats = (data as FileDataResponse)?.statistics;
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

  // 准备表格数据
  const tableData: MissingValueStats[] = stats?.missing_values 
    ? Object.entries(stats.missing_values).map(([column, missing_count]) => ({
        column,
        missing_count,
        missing_percentage: ((missing_count / (data?.metadata.rows || 1)) * 100).toFixed(2) + '%',
        data_type: stats.dtypes?.[column] || 'unknown'
      }))
    : [];

  // 按缺失值数量降序排序
  const sortedTableData = [...tableData].sort((a, b) => b.missing_count - a.missing_count);

  // 表格列定义
  const tableColumns = [
    {
      title: '列名',
      dataIndex: 'column',
      key: 'column',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: '数据类型',
      dataIndex: 'data_type',
      key: 'data_type',
      render: (text: string) => <Tag color="geekblue">{text}</Tag>
    },
    {
      title: '缺失值数量',
      dataIndex: 'missing_count',
      key: 'missing_count',
      render: (count: number) => (
        <Text type={count > 0 ? 'danger' : 'success'}>
          {count}
        </Text>
      ),
      sorter: (a: MissingValueStats, b: MissingValueStats) => a.missing_count - b.missing_count
    },
    {
      title: '缺失值比例',
      dataIndex: 'missing_percentage',
      key: 'missing_percentage',
      render: (percentage: string) => (
        <Text type={percentage !== '0.00%' ? 'danger' : 'success'}>
          {percentage}
        </Text>
      ),
      sorter: (a: MissingValueStats, b: MissingValueStats) => 
        parseFloat(a.missing_percentage) - parseFloat(b.missing_percentage)
    }
  ];

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
        当前文件ID: {fileId} | 总行数: {data?.metadata.rows || 0}
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
      
      {/* 缺失值统计表格 */}
      <Card 
        title="缺失值统计" 
        style={{ marginTop: 24 }}
        extra={<Text>总缺失值: {tableData.reduce((sum, item) => sum + item.missing_count, 0)}</Text>}
      >
        <Table
          columns={tableColumns}
          dataSource={sortedTableData}
          rowKey="column"
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            hideOnSinglePage: true
          }}
          locale={{
            emptyText: '没有缺失值数据'
          }}
          summary={() => (
            tableData.length > 0 ? (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={2}>
                    <Text strong>总计</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text type="danger">
                      {tableData.reduce((sum, item) => sum + item.missing_count, 0)}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <Text type="danger">
                      {(
                        (tableData.reduce((sum, item) => sum + item.missing_count, 0) / 
                        (data?.metadata.rows || 1) / 
                        tableData.length) * 100
                      ).toFixed(2)}%
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            ) : null
          )}
        />
      </Card>
    </Card>
  );
};

export default MissingValuesPanel;