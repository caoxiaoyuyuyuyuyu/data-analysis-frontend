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
  HistoryPage,
  ProfilePage,
  NotFoundPage,
  UploadPage,
  PredictionPage,
  PredictionsHistoryPage
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
          <Route path="preprocessing" element={<PreprocessingListPage />} />
          <Route path="predictions" element={<PredictionPage />} />
          <Route path="predictions/history" element={<PredictionsHistoryPage />} />
          <Route path="preprocessing/history" element={<PreprocessingHistoryPage />} />
          <Route path="preprocessing/:fileId" element={<PreprocessingPage />} />
          <Route path="training" element={<ModelTrainingPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="profile" element={<ProfilePage />} />
          {/* 添加重定向 */}
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;