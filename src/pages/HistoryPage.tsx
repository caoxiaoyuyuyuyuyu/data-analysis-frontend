import { Table, Tag, Space, Card } from 'antd';
import { useGetTrainingHistoryQuery } from '../features/history/api';

const columns = [
  {
    title: '模型名称',
    dataIndex: 'model_name',
    key: 'model_name',
  },
  {
    title: '训练时间',
    dataIndex: 'training_time',
    key: 'training_time',
    render: (text: string) => new Date(text).toLocaleString(),
  },
  {
    title: '准确率',
    dataIndex: ['metrics', 'accuracy'],
    key: 'accuracy',
    render: (value: number) => `${(value * 100).toFixed(2)}%`,
  },
  {
    title: '状态',
    key: 'status',
    render: () => <Tag color="green">已完成</Tag>,
  },
  {
    title: '操作',
    key: 'action',
    render: () => (
      <Space size="middle">
        <a>查看详情</a>
        <a>重新训练</a>
      </Space>
    ),
  },
];

const HistoryPage = () => {
  const { data: history, isLoading } = useGetTrainingHistoryQuery();

  return (
    <Card title="训练历史记录">
      <Table
        columns={columns}
        dataSource={history}
        rowKey="id"
        loading={isLoading}
      />
    </Card>
  );
};

export default HistoryPage;