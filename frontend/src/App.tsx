import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#25221F] flex flex-col font-sans tech-grid-bg relative">
      <Header onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
      <div className="flex flex-1 relative overflow-hidden">
        <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 overflow-y-auto">
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
