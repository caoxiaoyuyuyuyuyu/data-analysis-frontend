import { Table, Spin, Alert, Typography, Card, Row, Col, Descriptions, Select } from 'antd';
import type { ColumnType } from 'antd/es/table';
import { useGetFileDataQuery } from '../features/preprocessing/api';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';
import React from 'react';
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
import { FileDataResponse } from '../features/preprocessing/api';

const { Text } = Typography;
const { Option } = Select;

// 定义可调整大小的列属性
interface ResizableColumnProps {
  width?: number;
  onResize?: (e: React.SyntheticEvent, { size }: { size: { width: number } }) => void;
}

// 创建兼容 Ant Design 的列类型
type ResizableColumnType<T> = ColumnType<T> & ResizableColumnProps;

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

const ResizableTitle: React.FC<ResizableColumnProps & { [key: string]: any }> = (props) => {
  const { onResize, width, ...restProps } = props;

  if (!width) {
    return <th {...restProps} />;
  }

  return (
    <Resizable
      width={width}
      height={0}
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  );
};

const DataPreviewTable: React.FC<DataPreviewTableProps> = ({ fileId, pageSize = 5 }) => {
  const { data, isLoading, error } = useGetFileDataQuery(fileId);
  const previewData = (data as FileDataResponse)?.preview;
  const stats = (data as FileDataResponse)?.statistics;
  const [xAxisColumn, setXAxisColumn] = React.useState<string>('');
  const [yAxisColumn, setYAxisColumn] = React.useState<string>('');
  const [chartType, setChartType] = React.useState<string>('bar');

  const [columnsWidth, setColumnsWidth] = React.useState<Record<string, number>>({});
  
  const handleResize = (columnKey: string) => (e: React.SyntheticEvent, { size }: { size: { width: number } }) => {
    setColumnsWidth(prev => ({
      ...prev,
      [columnKey]: size.width
    }));
  };

  if (isLoading) return <Spin tip="加载数据..." />;
  
  if (error) {
    const errMsg = (error as any)?.data?.error || '未知错误';
    return <Alert message={`加载失败: ${errMsg}`} type="error" />;
  }

  // 准备统计表格数据
  const getStatisticsTableData = (): Record<string, any>[] => {
    if (!stats) return [];
    
    const allColumns = previewData?.columns || [];
    const statsData: Record<string, any>[] = [];
    
    // 添加数据类型行
    const dtypeRow: Record<string, any> = { stat_name: '数据类型' };
    allColumns.forEach(col => {
      dtypeRow[col] = stats.dtypes?.[col] || 'N/A';
    });
    statsData.push(dtypeRow);
    
    // 添加缺失值行
    const missingRow: Record<string, any> = { stat_name: '缺失值' };
    allColumns.forEach(col => {
      const count = stats.missing_values?.[col] || 0;
      const percentage = ((count / (data?.metadata.rows || 1)) * 100).toFixed(2);
      missingRow[col] = `${count} (${percentage}%)`;
    });
    statsData.push(missingRow);
    
    // 添加数值统计行
    if (stats.numeric_stats) {
      const numericStats = ['min', 'max', 'mean', 'median', 'std'];
      numericStats.forEach(stat => {
        if (stats.numeric_stats?.[stat as keyof typeof stats.numeric_stats]) {
          const row: Record<string, any> = { stat_name: stat };
          allColumns.forEach(col => {
            const value = stats.numeric_stats?.[stat as keyof typeof stats.numeric_stats]?.[col];
            row[col] = typeof value === 'number' ? value.toFixed(2) : value || 'N/A';
          });
          statsData.push(row);
        }
      });
    }
    
    return statsData;
  };

  const statisticsData = getStatisticsTableData().map((item, index) => ({ 
    ...item,
    key: index.toString(),
  }));
  const allColumns = previewData?.columns || [];

  // 准备统计表格列
  const statsColumns: ResizableColumnType<Record<string, any>>[] = [
    {
      title: '统计项',
      dataIndex: 'stat_name',
      key: 'stat_name',
      width: columnsWidth['stat_name'] || 120,
      fixed: 'left' as const,
      render: (text: string) => <Text strong>{text}</Text>,
      onHeaderCell: () => ({
        style: { 
          padding: '0',
          position: 'relative' as React.CSSProperties['position']
        }
      }),
      onResize: handleResize('stat_name')
    },
    ...allColumns.map(col => ({
      title: col,
      dataIndex: col,
      key: col,
      width: columnsWidth[col] || 150,
      render: (value: any) => {
        if (value === 'N/A') return <Text type="secondary">{value}</Text>;
        if (typeof value === 'string' && value.includes('%')) {
          const [count, percentage] = value.split(' ');
          return (
            <span>
              <Text type={parseInt(count) > 0 ? 'danger' : 'success'}>{count}</Text>{' '}
              <Text type="secondary">{percentage}</Text>
            </span>
          );
        }
        return value;
      },
      onHeaderCell: () => ({
        style: { 
          padding: '0',
          position: 'relative' as React.CSSProperties['position']
        }
      }),
      onResize: handleResize(col)
    }))
  ];

  // 处理列定义
  const columns = previewData?.columns?.map((col) => ({
    title: <Text strong>{col}</Text>,
    dataIndex: col,
    key: col,
    ellipsis: true,
    render: (value: any) => value ?? <span style={{ color: '#ccc' }}>null</span>
  })) || [];

  // 原始预览表格列
  const previewColumns: ResizableColumnType<Record<string, any>>[] = previewData?.columns?.map((col) => ({
    title: <Text strong>{col}</Text>,
    dataIndex: col,
    key: col,
    width: columnsWidth[`preview_${col}`] || 150,
    ellipsis: true,
    render: (value: any) => value ?? <span style={{ color: '#ccc' }}>null</span>,
    onHeaderCell: () => ({
      style: { 
        padding: 0,
        position: 'relative'
      }
    }),
    onResize: handleResize(`preview_${col}`)
  })) || [];

  const previewDataSource = previewData?.sample_data?.map((item, index) => ({
    ...item,
    key: index
  })) as { [key: string]: any; key: number }[];

  const components = {
    header: {
      cell: ResizableTitle,
    },
  };
  const renderChart = () => {
    if (!xAxisColumn || !yAxisColumn || previewDataSource.length === 0) return null;

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={previewDataSource}>
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
            <ScatterChart data={previewDataSource}>
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
            <LineChart data={previewDataSource}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisColumn} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey={yAxisColumn} stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        const pieData = previewDataSource.map(item => ({ name: item[xAxisColumn], value: item[yAxisColumn] }));
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
            {data?.metadata.rows} 行 × {data?.metadata.columns} 列
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 统计信息表格 */}
      <Card title="数据统计" style={{ marginBottom: 16 }}>
        <Table
          columns={statsColumns}
          dataSource={statisticsData}
          pagination={false}
          scroll={{ x: 'max-content' }}
          size="middle"
          bordered
          components={components}
          rowClassName={() => 'stats-row'}
        />
      </Card>

      {/* 数据预览表格 */}
      <Card title="数据预览">
        <Table
          columns={previewColumns}
          dataSource={previewDataSource}
          pagination={{ pageSize }}
          scroll={{ x: 'max-content' }}
          size="middle"
          bordered
          components={components}
          rowClassName={() => 'preview-row'}
        />
      </Card>

      {/* 图表选择 */}
      <Card title="数据可视化">
        <div style={{ marginBottom: 32 }}>
        <Select
          value={chartType}
          onChange={(value) => setChartType(value as string)}
          style={{ width: 120, marginRight: 16 }}
        >
          <Option value="bar">柱状图</Option>
          <Option value="scatter">散点图</Option>
          <Option value="line">折线图</Option>
          <Option value="pie">饼状图</Option>
        </Select>
        <Select
          value={xAxisColumn}
          onChange={(value) => setXAxisColumn(value as string)}
          placeholder="选择X轴列"
          style={{ width: 120, marginRight: 16 }}
        >
          {columns.map((col) => (
            <Option key={col.key} value={col.dataIndex}>
              {col.title}
            </Option>
          ))}
        </Select>
        <Select
          value={yAxisColumn}
          onChange={(value) => setYAxisColumn(value as string)}
          placeholder="选择Y轴列"
          style={{ width: 120 }}
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
        .stats-row {
          font-family: monospace;
        }
        .react-resizable {
          position: relative;
        }
        .react-resizable-handle {
          position: absolute;
          width: 10px;
          height: 100%;
          bottom: 0;
          right: -5px;
          cursor: col-resize;
          z-index: 1;
        }
      `}</style>
    </div>
  );
};

export default DataPreviewTable;