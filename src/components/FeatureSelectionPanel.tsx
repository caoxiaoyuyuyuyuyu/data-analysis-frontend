// src/components/FeatureSelectionPanel.tsx
import React, { useState } from 'react';
import { Card, Button, Checkbox, Space } from 'antd';

interface FeatureSelectionPanelProps {
  fileId: number;
  onApply: (params: { columns: string[] }) => void;
  columns: string[];
}

const FeatureSelectionPanel: React.FC<FeatureSelectionPanelProps> = ({ fileId, onApply, columns }) => {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  const handleCheckboxChange = (checkedValues: string[]) => {
    setSelectedColumns(checkedValues);
  };

  const handleApplyClick = () => {
    if (selectedColumns.length > 0) {
      onApply({ columns: selectedColumns });
    }
  };

  return (
    <Card title="选择特征列">
      <Checkbox.Group options={columns} value={selectedColumns} onChange={handleCheckboxChange} />
      <Space style={{ marginTop: 16 }}>
        <Button type="primary" onClick={handleApplyClick}>
          保留所选列
        </Button>
      </Space>
    </Card>
  );
};

export default FeatureSelectionPanel;