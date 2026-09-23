import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UploadInspectionPage from './pages/UploadInspectionPage';
import AnalysisResultsPage from './pages/AnalysisResultsPage';
import ImageAnalysisPage from './pages/ImageAnalysisPage';
import VideoAnalysisPage from './pages/VideoAnalysisPage';
import LiveJobsPage from './pages/LiveJobsPage';
import RoadMapPage from './pages/RoadMapPage';
import RoadSegmentsPage from './pages/RoadSegmentsPage';
import DefectHistoryPage from './pages/DefectHistoryPage';
import MaintenancePriorityPage from './pages/MaintenancePriorityPage';
import AIRecommendationsPage from './pages/AIRecommendationsPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import LoadingSpinner from './components/LoadingSpinner';

function MainApplication() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [targetInspectionId, setTargetInspectionId] = useState(null);

  const navigateTo = (tab, inspectionId = null) => {
    setActiveTab(tab);
    if (inspectionId) {
      setTargetInspectionId(inspectionId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner message="Initializing Road Condition Intelligence System..." />
      </div>
    );
  }

  if (!user) {
    return authMode === 'login' ? (
      <LoginPage onSwitchToRegister={() => setAuthMode('register')} />
    ) : (
      <RegisterPage onSwitchToLogin={() => setAuthMode('login')} />
    );
  }

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <DashboardPage onNavigate={navigateTo} />}
      {activeTab === 'upload' && (
        <UploadInspectionPage
          onNavigate={navigateTo}
          onUploadComplete={(job) => {
            if (job?.inspection_id) {
              setTargetInspectionId(job.inspection_id);
            }
          }}
        />
      )}
      {activeTab === 'analysis-results' && (
        <AnalysisResultsPage inspectionId={targetInspectionId} onNavigate={navigateTo} />
      )}
      {activeTab === 'image-analysis' && (
        <AnalysisResultsPage inspectionId={targetInspectionId} onNavigate={navigateTo} />
      )}
      {activeTab === 'video-analysis' && (
        <AnalysisResultsPage inspectionId={targetInspectionId} onNavigate={navigateTo} />
      )}
      {activeTab === 'live-jobs' && <LiveJobsPage onNavigate={navigateTo} />}
      {activeTab === 'map' && <RoadMapPage onNavigate={navigateTo} />}
      {activeTab === 'road-segments' && <RoadSegmentsPage onNavigate={navigateTo} />}
      {activeTab === 'defect-history' && <DefectHistoryPage onNavigate={navigateTo} />}
      {activeTab === 'maintenance-priority' && (
        <MaintenancePriorityPage onNavigate={navigateTo} />
      )}
      {activeTab === 'ai-recommendations' && <AIRecommendationsPage onNavigate={navigateTo} />}
      {activeTab === 'reports' && <ReportsPage onNavigate={navigateTo} />}
      {activeTab === 'profile' && <ProfilePage />}
      {activeTab === 'users' && <UsersPage />}
      {activeTab === 'settings' && <SettingsPage />}
    </DashboardLayout>
  );
}

import RoadCareChatbot from './components/RoadCareChatbot';

export default function App() {
  return (
    <AuthProvider>
      <MainApplication />
      <RoadCareChatbot />
    </AuthProvider>
  );
}
