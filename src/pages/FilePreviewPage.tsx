import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from 'antd';
import { useGetFileByIdQuery } from '../features/files/api';
import DataPreviewTable from '../components/DataPreviewTable';
import { useAppDispatch } from '../store/hooks';

const PreprocessingPage = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const dispatch = useAppDispatch();
  const { data: file, isLoading } = useGetFileByIdQuery(Number(fileId));

  useEffect(() => {
    if (file) {
      // dispatch();
    }
    console.log('file', file);
  }, [file, dispatch]);
  return (
    <Card
      title={`数据预览 - ${file?.file_name || '文件加载中...'}`}
      loading={isLoading}
    >
      <DataPreviewTable fileId={Number(fileId)} />
    </Card>
  );
};

export default PreprocessingPage;