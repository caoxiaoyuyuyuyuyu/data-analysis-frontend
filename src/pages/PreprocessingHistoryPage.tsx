import { useState, useEffect } from 'react';
import { Table, Space, Button, Popconfirm, message, Tag, Card } from 'antd';
import { 
  DeleteOutlined, 
  FileSearchOutlined,
  CloudDownloadOutlined 
} from '@ant-design/icons';
import { 
  useGetPreprocessingHistoryQuery,
  useDeletePreprocessingRecordMutation 
} from '../features/history/api';
import { useAppDispatch } from '../store/hooks';
import { setPreprocessingHistory } from '../features/history/slice';
import DetailModal from '../components/PreprocessingDetailModal';
import { PreprocessingHistory } from '../features/history/types';

const PreprocessingHistoryPage = () => {
  const dispatch = useAppDispatch();
  const { 
    data: historyData, 
    isLoading, 
    isError,
    refetch 
  } = useGetPreprocessingHistoryQuery();
  const [deleteRecord] = useDeletePreprocessingRecordMutation();
  const [selectedRecord, setSelectedRecord] = useState<PreprocessingHistory | null>(null);

  // 当数据加载完成后更新Redux store
  useEffect(() => {
    if (historyData) {
      dispatch(setPreprocessingHistory(historyData));
    }
  }, [historyData, dispatch]);

  const handleDelete = async (id: number) => {
    try {
      await deleteRecord(id).unwrap();
      message.success('记录删除成功');
      refetch(); // 删除后重新获取数据
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
      title: '文件名',
      dataIndex: 'original_filename',
      key: 'filename',
      render: (text: string, record: PreprocessingHistory) => (
        <div>
          <div>原始文件：{text}</div>
          <div>处理后：{record.processed_filename}</div>
        </div>
      )
    },
    {
      title: '处理类型',
      dataIndex: 'operation_type',
      key: 'operation_type',
      render: (method: string) => <Tag color="blue">{method}</Tag>
    },
    {
      title: '处理时间',
      dataIndex: 'processing_time',
      key: 'processing_time'
    },
    {
      title: '数据维度',
      key: 'dimensions',
      render: (_: any, record: PreprocessingHistory) => (
        <div>
          <div>行数：{record.rows_before} → {record.rows_after}</div>
          <div>列数：{record.columns_before} → {record.columns_after}</div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: PreprocessingHistory) => (
        <Space size="middle">
          <Button
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
            icon={<CloudDownloadOutlined />}
            onClick={() => handleDownload(record.processed_filename)}
          >
            下载
          </Button>
        </Space>
      )
    }
  ];

  if (isError) {
    return <div>加载历史记录失败</div>;
  }

  return (
    <Card title="数据预处理记录">
      <Table
        columns={columns}
        dataSource={historyData || []}  // 直接使用RTK Query获取的数据
        rowKey="id"
        loading={isLoading}
        expandable={{
          expandedRowRender: record => (
            <div>
              <p><strong>处理参数：</strong></p>
              <pre>{JSON.stringify(record.parameters, null, 2)}</pre>
            </div>
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