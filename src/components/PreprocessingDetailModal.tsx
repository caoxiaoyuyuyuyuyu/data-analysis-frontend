// PreprocessingDetailModal.tsx
import { Modal, Descriptions, Button, Tag, Divider } from 'antd';
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
        <Button key="close" type="primary" onClick={onClose}>
          关闭
        </Button>
      ]}
      width={800}
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label="记录ID">{record.id}</Descriptions.Item>
        <Descriptions.Item label="创建时间">{record.created_at}</Descriptions.Item>
        
        <Descriptions.Item label="原始文件" span={2}>
          <div>
            <Tag color="blue">文件名</Tag> {record.original_file.file_name}
          </div>
          <div>
            <Tag color="blue">文件大小</Tag> {record.original_file.file_size}
          </div>
          <div>
            <Tag color="blue">上传时间</Tag> {record.original_file.upload_time}
          </div>
        </Descriptions.Item>
        
        <Descriptions.Item label="处理后文件" span={2}>
          <div>
            <Tag color="green">文件名</Tag> {record.processed_file.file_name}
          </div>
          <div>
            <Tag color="green">文件大小</Tag> {record.processed_file.file_size}
          </div>
          <div>
            <Tag color="green">上传时间</Tag> {record.processed_file.upload_time}
          </div>
        </Descriptions.Item>

        <Divider orientation="left">处理步骤</Divider>
        
        {record.processing_steps.map(step => (
          <Descriptions.Item key={step.id} label={step.step_name} span={2}>
            <div style={{ marginBottom: '8px' }}>
              <Tag>类型</Tag> {step.step_type}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <Tag>策略</Tag> {step.parameters.strategy}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <Tag>耗时</Tag> {step.duration}
            </div>
            <div>
              <Tag>参数</Tag>
              <pre style={{ margin: '8px 0 0 0' }}>
                {JSON.stringify(step.parameters, null, 2)}
              </pre>
            </div>
          </Descriptions.Item>
        ))}
      </Descriptions>
    </Modal>
  );
};

export default DetailModal;