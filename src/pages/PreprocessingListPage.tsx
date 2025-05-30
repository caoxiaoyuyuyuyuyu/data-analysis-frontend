// src/pages/PreprocessingListPage.tsx
import { Table, Space, Tag, Typography, Button } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { 
  EditOutlined, 
  FileDoneOutlined, 
  ClockCircleOutlined 
} from '@ant-design/icons';
import { useGetFilesQuery } from '../features/files/api';
import { UserFile } from '../types/files';
import { useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { setFiles } from '../features/files/slice';

const { Title } = Typography;

const PreprocessingListPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: files = [], isLoading } = useGetFilesQuery();

  useEffect(() => {
    if (files) {
      dispatch(setFiles(files));
    }
    console.log('files', files);
  }, [files, dispatch]);

  const columns = [
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
      render: (text: string, record: UserFile) => (
        <Space>
          <FileDoneOutlined />
          <Link to={`/preprocessing/${record.id}`}>{text}</Link>
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'file_type',
      key: 'file_type',
      render: (type: string) => <Tag color="geekblue">{type.toUpperCase()}</Tag>
    },
    {
      title: '大小',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size: number) => `${(size / 1024).toFixed(2)} KB`
    },
    {
      title: '状态',
      dataIndex: 'is_processed',
      key: 'status',
      render: (processed: boolean) => (
        <Tag icon={processed ? <ClockCircleOutlined /> : <EditOutlined />} 
             color={processed ? 'green' : 'orange'}>
          {processed ? '已处理' : '待处理'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: UserFile) => (
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/preprocessing/${record.id}`)}
        >
          开始预处理
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginBottom: 24 }}>预处理任务列表</Title>
      <Table
        columns={columns}
        dataSource={files}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 8 }}
        locale={{
          emptyText: '暂无待处理文件'
        }}
      />
    </div>
  );
};

export default PreprocessingListPage;