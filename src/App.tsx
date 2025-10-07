import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateFMS from './pages/CreateFMS';
import ViewAllFMS from './pages/ViewAllFMS';
import StartProject from './pages/StartProject';
import Logs from './pages/Logs';
import UserManagement from './pages/UserManagement';
import TaskManagement from './pages/TaskManagement';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <BrowserRouter>
          <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/create-fms"
            element={
              <PrivateRoute>
                <Layout>
                  <CreateFMS />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/view-fms"
            element={
              <PrivateRoute>
                <Layout>
                  <ViewAllFMS />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/start-project"
            element={
              <PrivateRoute>
                <Layout>
                  <StartProject />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/logs"
            element={
              <PrivateRoute>
                <Layout>
                  <Logs />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <Layout>
                  <UserManagement />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <PrivateRoute>
                <Layout>
                  <TaskManagement />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
