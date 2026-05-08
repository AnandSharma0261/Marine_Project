import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { CrewDashboard } from '@/pages/CrewDashboard';
import { Maintenance } from '@/pages/Maintenance';
import { Drills } from '@/pages/Drills';
import { Ships } from '@/pages/Ships';
import { UsersPage } from '@/pages/Users';
import { MyTasks } from '@/pages/MyTasks';
import { MyDrills } from '@/pages/MyDrills';

const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'admin' ? <AdminDashboard /> : <CrewDashboard />;
};

const App = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route
      element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }
    >
      <Route index element={<RootRedirect />} />
      <Route
        path="/maintenance"
        element={
          <ProtectedRoute roles={['admin']}>
            <Maintenance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/drills"
        element={
          <ProtectedRoute roles={['admin']}>
            <Drills />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ships"
        element={
          <ProtectedRoute roles={['admin']}>
            <Ships />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute roles={['admin']}>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-tasks"
        element={
          <ProtectedRoute roles={['crew']}>
            <MyTasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-drills"
        element={
          <ProtectedRoute roles={['crew']}>
            <MyDrills />
          </ProtectedRoute>
        }
      />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
