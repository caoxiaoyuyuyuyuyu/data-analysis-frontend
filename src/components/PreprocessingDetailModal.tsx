import { Modal, Descriptions, Button } from 'antd';
import { PreprocessingHistory } from '../features/history/types';

interface DetailModalProps {
  visible: boolean;
  record: PreprocessingHistory | null;
  onClose: () => void;
}

const DetailModal = ({ visible, record, onClose }: DetailModalProps) => {
  if (!record) return null;

  return (
    <Modal
      title="预处理记录详情"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>
      ]}
      width={800}
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label="原始文件" span={2}>
          {record.original_filename}
        </Descriptions.Item>
        <Descriptions.Item label="处理后文件" span={2}>
          {record.processed_filename}
        </Descriptions.Item>
        <Descriptions.Item label="处理类型">
          {record.operation_type}
        </Descriptions.Item>
        <Descriptions.Item label="处理方法">
          {record.parameters.strategy}
        </Descriptions.Item>
        <Descriptions.Item label="处理耗时" span={2}>
          {record.duration} 秒
        </Descriptions.Item>
        <Descriptions.Item label="处理参数" span={2}>
          <pre>{JSON.stringify(record.parameters, null, 2)}</pre>
        </Descriptions.Item>
        <Descriptions.Item label="处理前维度">
          {record.rows_before} 行 × {record.columns_before} 列
        </Descriptions.Item>
        <Descriptions.Item label="处理后维度">
          {record.rows_after} 行 × {record.columns_after} 列
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};

export default DetailModal;