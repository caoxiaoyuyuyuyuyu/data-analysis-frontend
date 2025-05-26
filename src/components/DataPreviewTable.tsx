import { Table, Spin, Alert, Typography, Card, Row, Col, Descriptions } from 'antd';
import { useGetFileDataQuery } from '../features/preprocessing/api';

const { Text } = Typography;

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
  })) || [];

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