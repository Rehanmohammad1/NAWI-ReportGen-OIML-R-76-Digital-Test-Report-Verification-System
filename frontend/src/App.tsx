import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { InstrumentsPage } from './pages/InstrumentsPage';
import { NewSessionPage } from './pages/NewSessionPage';
import { SessionDetailPage } from './pages/SessionDetailPage';
import { ReviewQueuePage } from './pages/ReviewQueuePage';
import { RepositoryPage } from './pages/RepositoryPage';
import { RulesPage } from './pages/RulesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { EquipmentPage } from './pages/EquipmentPage';
import { VerifyPage } from './pages/VerifyPage';
import { UsersPage } from './pages/UsersPage';

import { ErrorBoundary } from './components/ErrorBoundary';

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F1EADE] text-[#413B32] flex flex-col font-sans">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/instruments" element={<InstrumentsPage />} />
              <Route path="/sessions/new" element={<NewSessionPage />} />
              <Route path="/sessions/:id" element={<SessionDetailPage />} />
              <Route path="/review-queue" element={<ReviewQueuePage />} />
              <Route path="/repository" element={<RepositoryPage />} />
              <Route path="/rules" element={<RulesPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/equipment" element={<EquipmentPage />} />
              <Route path="/verify-public" element={<VerifyPage />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify/:reportNumber" element={<VerifyPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
