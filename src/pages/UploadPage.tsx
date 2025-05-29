import { useState } from 'react';
import { Upload, Button, message, Card, Space, Table, Typography, Tag, Spin, Alert } from 'antd';
import { UploadOutlined, DeleteOutlined, EditOutlined, DownloadOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import { useUploadFileMutation, useGetFilesQuery, useDeleteFileMutation, useDownloadFileMutation } from '../features/files/api';
import { Link, useNavigate } from 'react-router-dom';
import { UserFile } from '../types/files';
import moment from 'moment';


const { Title } = Typography;

const UploadPage = () => {
  const { 
    data: filesResponse, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useGetFilesQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  
  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();
  const [deleteFile] = useDeleteFileMutation();
  const [fileList, setFileList] = useState<any[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<number[]>([]);
  const navigate = useNavigate();
  const [downloadFile] = useDownloadFileMutation();

  const files = Array.isArray(filesResponse) ? filesResponse : [];

  // 构建树形结构数据
  const buildFileTree = (files: UserFile[]) => {
    const rootFiles = files.filter(file => !file.parent_id);
    const childFilesMap = files.reduce((acc, file) => {
      if (file.parent_id) {
        if (!acc[file.parent_id]) {
          acc[file.parent_id] = [];
        }
        acc[file.parent_id].push(file);
      }
      return acc;
    }, {} as Record<number, UserFile[]>);

    return rootFiles.map(file => ({
      ...file,
      children: childFilesMap[file.id] || [],
    }));
  };

  const fileTreeData = buildFileTree(files);

  const HandleDownlad = async (file: UserFile) => {
    try {
      const fileId = file.id;
      const result = await downloadFile(fileId).unwrap();
      const url = window.URL.createObjectURL(new Blob([result]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('文件下载失败:', error);
      message.error('文件下载失败');
    }
  };

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await uploadFile(formData).unwrap();
      message.success(`${file.name} 上传成功`);
      onSuccess(null, file);
      refetch();
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
      refetch();
    } catch (error) {
      message.error('文件删除失败');
    }
  };

  const toggleExpand = (record: UserFile) => {
    if (expandedRowKeys.includes(record.id)) {
      setExpandedRowKeys(expandedRowKeys.filter(key => key !== record.id));
    } else {
      setExpandedRowKeys([...expandedRowKeys, record.id]);
    }
  };

  const columns = [
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
      render: (text: string, record: UserFile) => (
        <Space>
          <Link to={`/file-preview/${record.id}`}>{text}</Link>
        </Space>
      )
    },
    {
      title: '大小',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size: number) => `${(size / 1024).toFixed(2)} KB`,
    },
    {
      title: '上传时间',
      dataIndex: 'upload_time',
      key: 'upload_time',
      render: (time: string) => (
        <Tag color="green">
          {moment(time).format('YYYY-MM-DD HH:mm')}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: UserFile) => (
        <Space>
          <Button
            type='default'
            icon={<DownloadOutlined />}
            onClick={() => HandleDownlad(record)}
          >
            下载
          </Button>
          {record.children?.length > 0 && (
          <Button 
            type="primary" 
            icon={<EditOutlined />}
            onClick={() => navigate(`/preprocessing/${record.id}`)}
          >
            处理
          </Button>
          )}
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
          {record.children?.length > 0 && (
            <Button 
              type="dashed" 
              icon={expandedRowKeys.includes(record.id) ? <DownOutlined /> : <RightOutlined />}
              onClick={() => toggleExpand(record)}
            >
              {expandedRowKeys.includes(record.id) ? '收起' : '展开'}
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
              dataSource={fileTreeData}
              rowKey="id"
              loading={isLoading}
              pagination={false}
              expandable={{
                expandedRowKeys,
                onExpand: () => {}, // 空函数，因为展开由按钮控制
                rowExpandable: (record) => record.children?.length > 0,
                expandIcon: () => null,
              }}
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