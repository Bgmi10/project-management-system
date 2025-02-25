import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Suspense, lazy } from 'react';
import { Toaster } from 'react-hot-toast';
import Loader from './components/Loader';
import ProtectedRoutes from './components/ProtectedRoutes';

// Lazy load components
const HomePage = lazy(() => import('./components/HomePage'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const LoginPage = lazy(() => import('./components/auth/LoginPage'));
const Navigation = lazy(() => import('./components/Navigation'));
const NewProject = lazy(() => import('./components/project/NewProject'));
const ProjectList = lazy(() => import('./components/project/ProjectList'));
const ProjectPage = lazy(() => import('./components/project/ProjectPage'));
const NewTask = lazy(() => import('./components/NewTask'));

function App() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Suspense fallback={<Loader />}>
        <Navigation />
        <Routes>
            <Route 
            path="/" 
            element={user ? <Navigate to="/dashboard" replace /> : <HomePage />} 
          />
          <Route element={<ProtectedRoutes />}>
            <Route element={<Dashboard />} path="/dashboard" />
            <Route element={<ProjectList />} path="/projects" />
            <Route element={<NewProject />} path="/projects/new" />
            <Route element={<ProjectPage />} path="/projects/:projectId" />
            <Route element={<NewTask />} path="/projects/:projectId/tasks/new" />
          </Route>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
          />
        </Routes>
      </Suspense>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#4F46E5',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#fff',
              secondary: '#4F46E5',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#EF4444',
            },
          },
        }}
      />
    </div>
  );
}

export default App;
