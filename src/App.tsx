import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import {
  HomePage,
  LoginPage,
  RegisterPage,
  DashboardPage,
  PreprocessingPage,
  PreprocessingListPage,
  PreprocessingHistoryPage,
  ModelTrainingPage,
  TrainingHistoryPage,
  ProfilePage,
  NotFoundPage,
  UploadPage,
  PredictionPage,
  PredictionsHistoryPage,
  FilePreviewPage,
  StackingTrainingPage,
  StackingPredictPage
} from './pages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="file-preview/:fileId" element={<FilePreviewPage />} />
          <Route path="preprocessing" element={<PreprocessingListPage />} />
          <Route path="predictions" element={<PredictionPage />} />
          <Route path="history/predictions" element={<PredictionsHistoryPage />} />
          <Route path="history/preprocessing" element={<PreprocessingHistoryPage />} />
          <Route path="history/training" element={<TrainingHistoryPage />} />
          <Route path="preprocessing/:fileId" element={<PreprocessingPage />} />
          <Route path="training" element={<ModelTrainingPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="stacking/training" element={<StackingTrainingPage />} />
          <Route path="stacking/predict" element={<StackingPredictPage />} />
          {/* 添加重定向 */}
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;