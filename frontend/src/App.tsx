import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { WorkspaceInitScreen } from './components/WorkspaceInitScreen';

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
  const { isAuthenticated, user } = useAuth();
  const [initializing, setInitializing] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        setInitializing(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user?.id]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (initializing) {
    return <WorkspaceInitScreen />;
  }

  return (
    <div className="min-h-screen bg-[#EBE5DC] text-[#24211D] flex flex-col font-sans tech-grid-bg relative">
      <Header onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
      <div className="flex flex-1 relative overflow-hidden">
        <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 overflow-y-auto">
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
