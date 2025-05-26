import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Tabs, Button, message } from 'antd';
import { useGetFileByIdQuery } from '../features/files/api';
import { usePreprocessFileMutation } from '../features/preprocessing/api';
import DataPreviewTable from '../components/DataPreviewTable';
import MissingValuesPanel from '../components/MissingValuesPanel';
import FeatureScalingPanel from '../components/FeatureScalingPanel';
import EncodingPanel from '../components/EncodingPanel';
import { useAppDispatch } from '../store/hooks';

const PreprocessingPage = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const dispatch = useAppDispatch();
  const { data: file, isLoading } = useGetFileByIdQuery(Number(fileId));
  const [preprocessFile] = usePreprocessFileMutation();
  const [activeTab, setActiveTab] = useState('preview');

  useEffect(() => {
    if (file) {
      // dispatch();
    }
    console.log('file', file);
  }, [file, dispatch]);
  const handleApply = async (step: { 
    type: 'missing_values' | 'feature_scaling' | 'encoding'; 
    params: any 
  }) => {
    try {
      await preprocessFile({
        fileId: Number(fileId),
        step,  // 将 step 作为单独的对象传递
      }).unwrap();
      message.success(`${step.type} 处理已应用`);
    } catch (err) {
      message.error('处理失败');
    }
  };

  const tabs = [
    {
      key: 'preview',
      label: '数据预览',
      children: <DataPreviewTable fileId={Number(fileId)} />,
    },
    {
      key: 'missing',
      label: '缺失值处理',
      children: (
        <MissingValuesPanel 
          fileId={Number(fileId)}
          onApply={(params) => handleApply({ 
            type: 'missing_values', 
            params 
          })}
        />
      ),
    },
    {
      key: 'scaling',
      label: '特征缩放',
      children: (
        <FeatureScalingPanel
          fileId={Number(fileId)}
          onApply={(params) => handleApply({ 
            type: 'feature_scaling', 
            params 
          })}
        />
      ),
    },
    {
      key: 'encoding',
      label: '编码分类变量',
      children: (
        <EncodingPanel
          fileId={Number(fileId)}
          onApply={(params) => handleApply({ 
            type: 'encoding', 
            params 
          })}
        />
      ),
    },
  ];

  return (
    <Card
      title={`数据预处理 - ${file?.file_name || '文件加载中...'}`}
      loading={isLoading}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabs}
      />
    </Card>
  );
};

export default PreprocessingPage;