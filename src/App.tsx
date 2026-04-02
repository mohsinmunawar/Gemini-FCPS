/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ExamSelection from './pages/ExamSelection';
import StudyMode from './pages/StudyMode';
import QuestionScreen from './pages/QuestionScreen';
import ExamMode from './pages/ExamMode';
import MockExamSetup from './pages/MockExamSetup';
import MockExamSession from './pages/MockExamSession';
import MockExamResult from './pages/MockExamResult';
import Results from './pages/Results';
import AdminPanel from './pages/AdminPanel';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!isAdmin) return <Navigate to="/dashboard" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/exam-selection" element={<ExamSelection />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/study" element={<StudyMode />} />
              <Route path="/study/:bookId/:chapterId/:topicId" element={<QuestionScreen mode="study" />} />
              <Route path="/exam/quick" element={<QuestionScreen mode="quick" />} />
              <Route path="/exam/mock" element={<MockExamSetup />} />
              <Route path="/exam/mock/session" element={<MockExamSession />} />
              <Route path="/exam/mock/result/:examId" element={<MockExamResult />} />
              <Route path="/results/:examId" element={<Results />} />
            </Route>

            <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
