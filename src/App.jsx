import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FirebaseAuthProvider } from './contexts/FirebaseAuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { EditModeProvider } from './contexts/EditModeContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import JobSelectionPage from './pages/JobSelectionPage';
import UploadPage from './pages/UploadPage';
import AnalysisPage from './pages/AnalysisPage';
import HistoryPage from './pages/HistoryPage';
import NotFoundPage from './pages/NotFoundPage';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ThemeProvider>
          <EditModeProvider>
            <FirebaseAuthProvider>
              <ToastProvider>
              <Routes>
            {/* Mixed public/protected routes with Layout */}
            <Route element={<Layout />}>
              {/* Public routes - accessible to everyone */}
              <Route path="/" element={<HomePage />} />
              <Route path="/careers" element={<JobSelectionPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/analysis/:analysisId" element={<AnalysisPage />} />
              
              {/* Protected routes - require authentication */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute>
                  <HistoryPage />
                </ProtectedRoute>
              } />
              
              {/* 404 Page - Catch all unmatched routes */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
              </ToastProvider>
            </FirebaseAuthProvider>
          </EditModeProvider>
        </ThemeProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App