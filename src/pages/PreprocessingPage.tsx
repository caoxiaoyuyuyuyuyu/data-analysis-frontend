import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Tabs, Button, message } from 'antd';
import { useGetFileByIdQuery } from '../features/files/api';
import { usePreprocessFileMutation, useGetFileDataQuery } from '../features/preprocessing/api';
import DataPreviewTable from '../components/DataPreviewTable';
import MissingValuesPanel from '../components/MissingValuesPanel';
import FeatureScalingPanel from '../components/FeatureScalingPanel';
import EncodingPanel from '../components/EncodingPanel';
import PCAPanel from '../components/PCAPanel';
import OutlierHandlingPanel from '../components/OutlierHandlingPanel';
import FeatureSelectionPanel from '../components/FeatureSelectionPanel';
import { useAppDispatch } from '../store/hooks';
import { StepType } from '../features/preprocessing/api';

const PreprocessingPage = () => {
  const orignalFileId = useParams<{ fileId: string }>().fileId;
  const [fileId, setfileId] = useState<number | null>(Number(orignalFileId));
  const dispatch = useAppDispatch();
  const [preprocessFile] = usePreprocessFileMutation();
  const [activeTab, setActiveTab] = useState('preview');
  const [processedRecordId, setprocessedRecordId] = useState<number | null>(null);
  const processedRecordIdRef = useRef<number | null>(null);
  
  // 保持ref和状态同步
  useEffect(() => {
    processedRecordIdRef.current = processedRecordId;
  }, [processedRecordId]);

  useEffect(() => {
    if (!fileId) {
      setfileId(Number(orignalFileId));
    }
    console.log('fileId', fileId);
  }, []);

  const { data: original_file } = useGetFileByIdQuery(Number(orignalFileId));
  const { data: file, isLoading } = useGetFileByIdQuery(Number(fileId));
  useEffect(() => {
    if (file) {
      // dispatch();
    }
    console.log('file', file);
  }, [file, dispatch]);

  const handleApply = async (step: {
    type: StepType;
    params: any
  }) => {
    try {
      const response = await preprocessFile({
        fileId: Number(fileId),
        step,
        processed_record_id: processedRecordIdRef.current
      }).unwrap();
      message.success(`${step.type} 处理已应用`);
      const newRecordId = response.processed_record_id;
      
      console.log('response', response);
      console.log('newRecordId', newRecordId);
      setprocessedRecordId(newRecordId);
      setfileId(response.processed_file_id);
    } catch (err) {
      message.error('处理失败');
    }
  };

  const { data: fileData } = useGetFileDataQuery(Number(fileId));
  const columns = fileData?.preview?.columns || [];

  const tabs = [
    {
      key: 'preview',
      label: '数据预览',
      children: <DataPreviewTable fileId={Number(fileId)} />,
    },
    {
      key: 'feature-selection',
      label: '选择特征列',
      children: (
        <FeatureSelectionPanel
          fileId={Number(fileId)}
          onApply={(params) => handleApply({
            type: 'feature_selection',
            params
          })}
          columns={columns}
        />
      ),
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
    {
      key: 'pca',
      label: '主成分分析（PCA）',
      children: (
        <PCAPanel
          fileId={Number(fileId)}
          onApply={(params) => handleApply({
            type: 'pca',
            params
          })}
        />
      ),
    },
    {
      key: 'outlier',
      label: '异常值处理',
      children: (
        <OutlierHandlingPanel
          fileId={Number(fileId)}
          onApply={(params) => handleApply({
            type: 'outlier_handling',
            params
          })}
        />
      ),
    },

  ];

  return (
    <Card
      title={`数据预处理 - ${original_file?.file_name || '文件加载中...'}`}
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