import { Table, Spin, Alert, Typography, Card, Row, Col, Descriptions, Select } from 'antd';
import type { ColumnType } from 'antd/es/table';
import { useGetFileDataQuery } from '../features/preprocessing/api';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';
import React from 'react';
import DataVisualizationChart from './DataVisualizationChart';
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

  if (isLoading) return <Spin tip="加载数据..." style={{ margin: '50px auto', display: 'block' }} />;

  if (error) {
    const errMsg = (error as any)?.data?.error || '未知错误';
    return <Alert message={`加载失败: ${errMsg}`} type="error" style={{ margin: '50px auto', width: '80%' }} />;
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

  return (
    <div className="data-preview-container" style={{ padding: '20px' }}>
      {/* 元数据卡片 */}
      <Card title="文件元数据" style={{ marginBottom: 16, boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="文件名">{data?.metadata.file_name}</Descriptions.Item>
          <Descriptions.Item label="文件ID">{data?.metadata.file_id}</Descriptions.Item>
          <Descriptions.Item label="行数">{data?.metadata.rows}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 统计表格 */}
      <Card title="数据统计" style={{ marginBottom: 16, boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
        <Table
          columns={statsColumns}
          dataSource={statisticsData}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
          size="middle"
          bordered
          components={components}
        />
      </Card>

      {/* 数据预览表格 */}
      <Card title="数据预览" style={{ marginBottom: 16, boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
        <Table
          columns={previewColumns}
          dataSource={previewDataSource}
          pagination={{ pageSize: 100 }}
          scroll={{ x: 'max-content' }}
          size="middle"
          bordered
          components={components}
        />
      </Card>

      {/* 数据可视化 */}
      <Card title="数据可视化" style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
        <DataVisualizationChart
          dataSource={previewDataSource}
          columns={allColumns}
          chartType={chartType}
          xAxisColumn={xAxisColumn}
          yAxisColumn={yAxisColumn}
          onChartTypeChange={(value) => setChartType(value)}
          onXAxisColumnChange={(value) => setXAxisColumn(value)}
          onYAxisColumnChange={(value) => setYAxisColumn(value)}
        />
      </Card>
    </div>
  );
};

export default DataPreviewTable;