import { Card, Row, Col, List, Tag, Space, Typography } from 'antd';
import { 
  FileDoneOutlined, 
  ExperimentOutlined, 
  LineChartOutlined,
  UserOutlined,
  DownloadOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useGetTrainingHistoryQuery } from '../features/history/api';
import { useAppSelector } from '../store/hooks';
import dayjs from 'dayjs';
import React from 'react';
import { message } from 'antd';
import { UserFile } from '../types/files';
import { useGetFilesQuery, useDownloadFileMutation } from '../features/files/api';

const { Title } = Typography;

// 文件大小格式化
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const DashboardPage = () => {
  const { data: files, isLoading: filesLoading } = useGetFilesQuery();
  const { data: history, isLoading: historyLoading } = useGetTrainingHistoryQuery();
  const { user } = useAppSelector((state) => state.auth);
  const [downloadFile] = useDownloadFileMutation();

  const HandleDownlad = async (file: UserFile) => {
  try {
    // 调用下载API
    const fileId = file.id;
    const result = await downloadFile(fileId).unwrap();
    
    // 假设后端返回的是一个 Blob 对象
    const url = window.URL.createObjectURL(new Blob([result]));
    const link = document.createElement('a');
    link.href = url;
    
    // 设置下载文件名（推荐从 response headers 中获取，这里假设是固定命名）
    link.setAttribute('download', file.file_name); // 可根据接口修改扩展名
    
    document.body.appendChild(link);
    link.click();
    
    // 清理
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('文件下载失败:', error);
    message.error('文件下载失败');
  }
  };

  const stats = [
    {
      title: '上传文件数',
      value: files?.length || 0,
      icon: <FileDoneOutlined />,
      color: '#1890ff'
    },
    {
      title: '训练次数',
      value: history?.length || 0,
      icon: <ExperimentOutlined />,
      color: '#52c41a'
    },
    {
      title: '最佳准确率',
      value: history?.length 
        ? `${(Math.max(...history.map(h => h.metrics.accuracy || h.metrics.r2 || 0.0)) * 100).toFixed(2)}%`
        : '0%',
      icon: <LineChartOutlined />,
      color: '#faad14'
    },
    {
      title: '当前用户',
      value: user?.username || '未登录',
      icon: <UserOutlined />,
      color: '#722ed1'
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: '32px', color: '#1f1f1f' }}>仪表盘</Title>
      
      {/* 统计卡片区域 */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        {stats.map((stat, index) => (
          <Col key={index} xs={24} sm={12} lg={6}>
            <Card 
              bordered={false}
              style={{
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                background: `linear-gradient(135deg, ${stat.color}10 0%, ${stat.color}05 100%)`
              }}
            >
              <Space size={16} align="start">
                <div style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: `${stat.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {React.cloneElement(stat.icon, { 
                    style: { 
                      fontSize: '24px',
                      color: stat.color 
                    } 
                  })}
                </div>
                <div>
                  <div style={{ 
                    color: '#666',
                    fontSize: '14px',
                    marginBottom: '4px'
                  }}>{stat.title}</div>
                  <div style={{ 
                    fontSize: '24px',
                    fontWeight: 600,
                    color: '#1f1f1f'
                  }}>{stat.value}</div>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 最近文件列表 */}
      <Card
        title="最近上传文件"
        bordered={false}
        style={{
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
        }}
        loading={filesLoading}
      >
        <List
          itemLayout="horizontal"
          dataSource={files?.slice(0, 5)}
          renderItem={(file) => (
            <List.Item
              actions={[
                <Tag icon={<ClockCircleOutlined />} color="blue">
                  {dayjs(file.upload_time).format('YYYY-MM-DD')}
                </Tag>,
                <DownloadOutlined 
                  key="download"
                  onClick={() => {
                    HandleDownlad(file)
                  }}
                  style={{ color: '#1890ff', fontSize: '18px', cursor: 'pointer' }}
                />
              ]}
            >
              <List.Item.Meta
                avatar={<FileDoneOutlined style={{ fontSize: '24px' }} />}
                title={<a>{file.file_name}</a>}
                description={
                  <Space>
                    <Tag color="geekblue">{file.file_type}</Tag>
                    <span style={{ color: '#666' }}>
                      {formatFileSize(file.file_size)}
                    </span>
                  </Space>
                }
              />
            </List.Item>
          )}
          locale={{ emptyText: '暂无上传文件' }}
        />
      </Card>
    </div>
  );
};

export default DashboardPage;