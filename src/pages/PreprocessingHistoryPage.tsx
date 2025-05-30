// PreprocessingHistoryPage.tsx
import { useState } from 'react';
import { Table, Space, Button, Popconfirm, message, Tag, Card, Descriptions, Badge } from 'antd';
import { 
  DeleteOutlined, 
  FileSearchOutlined,
  CloudDownloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { 
  useGetPreprocessingHistoryQuery,
  useDeletePreprocessingRecordMutation 
} from '../features/history/api';
import DetailModal from '../components/PreprocessingDetailModal';
import { PreprocessingHistory } from '../features/history/types';

const PreprocessingHistoryPage = () => {
  const { 
    data: historyData = [], 
    isLoading, 
    isError,
    refetch 
  } = useGetPreprocessingHistoryQuery();
  const [deleteRecord] = useDeletePreprocessingRecordMutation();
  const [selectedRecord, setSelectedRecord] = useState<PreprocessingHistory | null>(null);

  const handleDelete = async (id: number) => {
    try {
      await deleteRecord(id).unwrap();
      message.success('记录删除成功');
      refetch();
    } catch (err) {
      message.error('删除记录失败');
    }
  };

  const handleDownload = (filename: string) => {
    const link = document.createElement('a');
    link.href = `/api/files/download?filename=${encodeURIComponent(filename)}`;
    link.download = filename;
    link.click();
  };

  const columns = [
    {
      title: '文件信息',
      dataIndex: 'original_file',
      key: 'file_info',
      render: (original: any, record: PreprocessingHistory) => (
        <Space direction="vertical" size="small">
          <div>
            <Tag color="blue">原始文件</Tag>
            <span>{original.file_name}</span>
          </div>
          <div>
            <Tag color="green">处理后文件</Tag>
            <span>{record.processed_file.file_name}</span>
          </div>
        </Space>
      )
    },
    {
      title: '处理步骤',
      dataIndex: 'processing_steps',
      key: 'steps',
      render: (steps: any[]) => (
        <Space direction="vertical" size="small">
          {steps.map(step => (
            <Tag key={step.id} color="purple">
              {step.step_name}: {step.parameters.strategy}
            </Tag>
          ))}
        </Space>
      )
    },
    {
      title: '时间信息',
      key: 'time_info',
      render: (_: any, record: PreprocessingHistory) => (
        <Space direction="vertical" size="small">
          <div>
            <Tag icon={<InfoCircleOutlined />}>创建时间</Tag>
            <span>{record.created_at}</span>
          </div>
          <div>
            <Tag icon={<InfoCircleOutlined />}>处理耗时</Tag>
            <span>{stepsTotalDuration(record.processing_steps)}</span>
          </div>
        </Space>
      )
    },
    {
      title: '文件大小',
      key: 'file_size',
      render: (_: any, record: PreprocessingHistory) => (
        <Space direction="vertical" size="small">
          <div>
            <Tag color="blue">原始大小</Tag>
            <span>{record.original_file.file_size}</span>
          </div>
          <div>
            <Tag color="green">处理后大小</Tag>
            <span>{record.processed_file.file_size}</span>
          </div>
        </Space>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: PreprocessingHistory) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<FileSearchOutlined />}
            onClick={() => setSelectedRecord(record)}
          >
            详情
          </Button>
          <Popconfirm
            title="确定要删除此记录吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
          <Button 
            type="default"
            icon={<CloudDownloadOutlined />}
            onClick={() => handleDownload(record.processed_file.file_name)}
          >
            下载
          </Button>
        </Space>
      )
    }
  ];

  const stepsTotalDuration = (steps: any[]) => {
    const total = steps.reduce((sum, step) => sum + parseFloat(step.duration), 0);
    return total.toFixed(2) + 's';
  };

  if (isError) {
    return <div>加载历史记录失败</div>;
  }

  return (
    <Card 
      title="数据预处理记录" 
      bordered={false}
      headStyle={{ border: 'none' }}
      bodyStyle={{ padding: '24px' }}
    >
      <Table
        columns={columns}
        dataSource={historyData}
        rowKey="id"
        loading={isLoading}
        bordered
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`
        }}
        expandable={{
          expandedRowRender: record => (
            <div style={{ margin: 0 }}>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="处理步骤详情" span={2}>
                  {record.processing_steps.map(step => (
                    <div key={step.id} style={{ marginBottom: '16px' }}>
                      <Tag color="processing">{step.step_name}</Tag>
                      <span>策略: {step.parameters.strategy}</span>
                      <span style={{ marginLeft: '16px' }}>耗时: {step.duration}</span>
                      <div style={{ marginTop: '8px' }}>
                        <pre style={{ margin: 0 }}>
                          {JSON.stringify(step.parameters, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </Descriptions.Item>
              </Descriptions>
            </div>
          ),
          expandIcon: ({ expanded, onExpand, record }) =>
            expanded ? (
              <Button type="text" onClick={e => onExpand(record, e)}>收起详情</Button>
            ) : (
              <Button type="text" onClick={e => onExpand(record, e)}>展开详情</Button>
            )
        }}
      />

      <DetailModal
        visible={!!selectedRecord}
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </Card>
  );
};

export default PreprocessingHistoryPage;