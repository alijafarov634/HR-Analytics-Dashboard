import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HRDataProvider } from './context/HRDataContext';
import { CandidateManagementPage } from './pages/CandidateManagementPage';
import { EmployeeDirectoryPage } from './pages/EmployeeDirectoryPage';
import { HRPerformancePage } from './pages/HRPerformancePage';
import { OverviewPage } from './pages/OverviewPage';
import { RecruitmentAnalyticsPage } from './pages/RecruitmentAnalyticsPage';
import { ReportsInsightsPage } from './pages/ReportsInsightsPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <HRDataProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/recruitment" element={<RecruitmentAnalyticsPage />} />
            <Route path="/candidates" element={<CandidateManagementPage />} />
            <Route path="/employees" element={<EmployeeDirectoryPage />} />
            <Route path="/performance" element={<HRPerformancePage />} />
            <Route path="/reports" element={<ReportsInsightsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </HRDataProvider>
  );
}
