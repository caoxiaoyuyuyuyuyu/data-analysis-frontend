import React from 'react';
import { Table, Spin, Alert, Typography, Card, Row, Col, Descriptions, Select } from 'antd';
import { useGetFileDataQuery } from '../features/preprocessing/api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const { Text } = Typography;
const { Option } = Select;

interface DataPreviewTableProps {
  fileId: number;
  pageSize?: number;
}

interface PreviewData {
  columns: string[];
  sample_data: Record<string, any>[];
}

interface Statistics {
  categorical_stats?: Record<string, any>;
  dtypes?: Record<string, string>;
  missing_values?: Record<string, number>;
  numeric_stats?: {
    max?: Record<string, number>;
    mean?: Record<string, number>;
    median?: Record<string, number>;
    min?: Record<string, number>;
    std?: Record<string, number>;
  };
  shape?: [number, number];
}

interface FileDataResponse {
  metadata: {
    file_id: number;
    file_name: string;
    rows: number;
    columns: number;
  };
  preview?: PreviewData;
  statistics?: Statistics;
}

const DataPreviewTable: React.FC<DataPreviewTableProps> = ({ fileId, pageSize = 5 }) => {
  const { data, isLoading, error } = useGetFileDataQuery(fileId);
  const previewData = (data as FileDataResponse)?.preview;
  const stats = (data as FileDataResponse)?.statistics;
  const [chartType, setChartType] = React.useState<string>('bar');
  const [xAxisColumn, setXAxisColumn] = React.useState<string>('');
  const [yAxisColumn, setYAxisColumn] = React.useState<string>('');

  if (isLoading) return <Spin tip="加载数据..." />;

  if (error) {
    const errMsg = (error as any)?.data?.error || '未知错误';
    return <Alert message={`加载失败: ${errMsg}`} type="error" />;
  }

  // 处理列定义
  const columns = previewData?.columns?.map((col) => ({
    title: <Text strong>{col}</Text>,
    dataIndex: col,
    key: col,
    ellipsis: true,
    render: (value: any) => value ?? <span style={{ color: '#ccc' }}>null</span>
  })) || [];

  // 处理数据源
  const dataSource = previewData?.sample_data?.map((item, index) => ({
    ...item,
    key: index
  })) as { [key: string]: any; key: number }[];

  const renderChart = () => {
    if (!xAxisColumn || !yAxisColumn || dataSource.length === 0) return null;

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dataSource}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisColumn} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={yAxisColumn} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={dataSource}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisColumn} name={xAxisColumn} type="number" />
              <YAxis dataKey={yAxisColumn} name={yAxisColumn} type="number" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter dataKey={yAxisColumn} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dataSource}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisColumn} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey={yAxisColumn} stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        const pieData = dataSource.map(item => ({ name: item[xAxisColumn], value: item[yAxisColumn] }));
        const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className="data-preview-container">
      {/* 元数据卡片 */}
      <Card title="文件元数据" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="文件名">{data?.metadata.file_name}</Descriptions.Item>
          <Descriptions.Item label="文件ID">{data?.metadata.file_id}</Descriptions.Item>
          <Descriptions.Item label="行数">{data?.metadata.rows}</Descriptions.Item>
          <Descriptions.Item label="列数">{data?.metadata.columns}</Descriptions.Item>
          <Descriptions.Item label="数据维度" span={2}>
            {stats?.shape?.[0]} 行 × {stats?.shape?.[1]} 列
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 数据类型和缺失值统计 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card title="数据类型">
            {stats?.dtypes && Object.entries(stats.dtypes).map(([col, type]) => (
              <div key={col} style={{ marginBottom: 8 }}>
                <Text strong>{col}: </Text>
                <Text code>{type}</Text>
              </div>
            ))}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="缺失值统计">
            {stats?.missing_values && Object.entries(stats.missing_values).map(([col, count]) => (
              <div key={col} style={{ marginBottom: 8 }}>
                <Text strong>{col}: </Text>
                <Text type={count > 0 ? 'danger' : 'success'}>
                  {count} 个缺失值 ({((count / (data?.metadata.rows || 1)) * 100).toFixed(2)}%)
                </Text>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* 数值统计信息 */}
      {stats?.numeric_stats && (
        <Card title="数值统计" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            {Object.entries(stats.numeric_stats).map(([statName, values]) => (
              values && (
                <Col span={6} key={statName}>
                  <Card title={statName.toUpperCase()} size="small">
                    {Object.entries(values).map(([col, value]) => (
                      <div key={col} style={{ marginBottom: 4 }}>
                        <Text strong>{col}: </Text>
                        <Text>{typeof value === 'number' ? value.toFixed(2) : String(value)}</Text>
                      </div>
                    ))}
                  </Card>
                </Col>
              )
            ))}
          </Row>
        </Card>
      )}

      {/* 数据预览表格 */}
      <Card title="数据预览">
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={{ pageSize }}
          scroll={{ x: 'max-content' }}
          size="middle"
          bordered
          rowClassName={() => 'preview-row'}
        />
      </Card>

      {/* 图表选择 */}
      <Card title="数据可视化">
        <div style={{ marginBottom: 32 }}>
          <Text>选择呈现的图像</Text>
          <Select
            value={chartType}
            onChange={(value) => setChartType(value as string)}
            style={{ width: 120, marginRight: 16, marginLeft: 8 }}
          >
            <Option value="bar">柱状图</Option>
            <Option value="scatter">散点图</Option>
            <Option value="line">折线图</Option>
            <Option value="pie">饼状图</Option>
          </Select>
          <Text>选择x轴</Text>
          <Select
            value={xAxisColumn}
            onChange={(value) => setXAxisColumn(value as string)}
            placeholder="选择X轴列"
            style={{ width: 120, marginRight: 16, marginLeft: 8 }}
          >
            {columns.map((col) => (
              <Option key={col.key} value={col.dataIndex}>
                {col.title}
              </Option>
            ))}
          </Select>
          <Text>选择y轴</Text>
          <Select
            value={yAxisColumn}
            onChange={(value) => setYAxisColumn(value as string)}
            placeholder="选择Y轴列"
            style={{ width: 120, marginLeft: 8 }}
          >
            {columns.map((col) => (
              <Option key={col.key} value={col.dataIndex}>
                {col.title}
              </Option>
            ))}
          </Select>
        </div>
        {renderChart()}
      </Card>

      <style>{`
        .data-preview-container {
          margin: 16px 0;
        }
        .preview-row {
          font-family: monospace;
        }
      `}</style>
    </div>
  );
};

export default DataPreviewTable;