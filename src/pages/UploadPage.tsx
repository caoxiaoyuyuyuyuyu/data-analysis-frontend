import { useState, useEffect } from 'react';
import { Upload, Button, message, Card, Space, Table, Typography, Tag, Spin, Alert } from 'antd';
import { UploadOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useUploadFileMutation, useGetFilesQuery, useDeleteFileMutation } from '../features/files/api';
import { useNavigate } from 'react-router-dom';
import { UserFile } from '../types/files';

const { Title, Text } = Typography;

const UploadPage = () => {
  const { 
    data: filesResponse, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useGetFilesQuery(undefined, {
    refetchOnMountOrArgChange: true, // 添加这个选项确保每次加载都重新获取
  });
  
  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();
  const [deleteFile] = useDeleteFileMutation();
  const [fileList, setFileList] = useState<any[]>([]);
  const navigate = useNavigate();

  // 调试日志
  // useEffect(() => {
  //   console.log('filesResponse:', filesResponse);
  //   console.log('isLoading:', isLoading);
  //   console.log('isError:', isError);
  //   console.log('error:', error);
  // }, [filesResponse, isLoading, isError, error]);

  // 处理undefined情况，确保files总是数组
  const files = Array.isArray(filesResponse) ? filesResponse : [];

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await uploadFile(formData).unwrap();
      message.success(`${file.name} 上传成功`);
      onSuccess(null, file);
      refetch(); // 强制刷新文件列表
      setFileList([]);
    } catch (err) {
      message.error(`${file.name} 上传失败`);
      onError(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteFile(id).unwrap();
      message.success('文件删除成功');
      refetch(); // 强制刷新文件列表
    } catch (error) {
      message.error('文件删除失败');
    }
  };

  const columns = [
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
    },
    {
      title: '大小',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size: number) => `${(size / 1024).toFixed(2)} KB`,
    },
    {
      title: '状态',
      dataIndex: 'is_processed',
      key: 'is_processed',
      render: (processed: boolean) => (
        <Tag color={processed ? 'green' : 'orange'}>
          {processed ? '已处理' : '未处理'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: UserFile) => (
        <Space>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
          {!record.is_processed && (
            <Button 
              type="primary" 
              icon={<EditOutlined />}
              onClick={() => navigate(`/preprocessing/${record.id}`)}
            >
              处理
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (isError) {
    return (
      <Alert
        message="加载文件列表失败"
        description={error?.toString() || '未知错误'}
        type="error"
        showIcon
      />
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3}>数据上传</Title>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card title="上传新文件">
          <Upload
            customRequest={handleUpload}
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            showUploadList={false}
            accept=".txt,.csv,.xlsx,.xls"
            maxCount={1}
          >
            <Button 
              type="primary" 
              icon={<UploadOutlined />} 
              loading={isUploading}
            >
              选择文件并上传
            </Button>
          </Upload>
        </Card>

        <Card title="已上传文件">
          {isLoading ? (
            <Spin tip="加载中..." />
          ) : (
            <Table
              columns={columns}
              dataSource={files}
              rowKey="id"
              loading={isLoading}
              pagination={false}
              locale={{
                emptyText: '暂无上传文件',
              }}
            />
          )}
        </Card>
      </Space>
    </div>
  );
};

export default UploadPage;