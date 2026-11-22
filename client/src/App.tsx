import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoadingScreen } from './pages/LoadingScreen';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { RoleSelectionPage } from './pages/RoleSelectionPage';
import { MainLayout } from './components/layout/MainLayout';
import { CustomerDashboard } from './pages/dashboard/CustomerDashboard';
import { DealerDashboard } from './pages/dashboard/DealerDashboard';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { DealershipProfilePage } from './pages/dealer/DealershipProfilePage';
import { VehicleDetailsPage } from './pages/vehicle/VehicleDetailsPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAuthStore } from './store/authStore';
import type { UserRole } from './types';

function RoleDashboard() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'customer') return <CustomerDashboard />;
  if (user.role === 'dealer') return <DealerDashboard />;
  if (user.role === 'admin') return <AdminDashboard />;
  return <Navigate to="/login" replace />;
}

function RequireAuth({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: UserRole[] }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function App() {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  return (
    <HashRouter>
      <Routes>
        {/* Public authentication and entry routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/role-selection" element={<RoleSelectionPage />} />

        {/* Authenticated Application Layout */}
        <Route path="/" element={<RequireAuth><MainLayout /></RequireAuth>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<RoleDashboard />} />

          {/* Customer-only protected routes */}
          <Route
            path="browse"
            element={
              <RequireAuth allowedRoles={['customer']}>
                <CustomerDashboard initialTab="vehicles" />
              </RequireAuth>
            }
          />
          <Route
            path="compare"
            element={
              <RequireAuth allowedRoles={['customer']}>
                <CustomerDashboard initialTab="comparison" />
              </RequireAuth>
            }
          />
          <Route
            path="vehicle/:id"
            element={
              <RequireAuth allowedRoles={['customer']}>
                <VehicleDetailsPage />
              </RequireAuth>
            }
          />
          <Route
            path="queue"
            element={
              <RequireAuth allowedRoles={['customer']}>
                <CustomerDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="bookings"
            element={
              <RequireAuth allowedRoles={['customer']}>
                <CustomerDashboard />
              </RequireAuth>
            }
          />

          {/* Dealer-only protected routes */}
          <Route
            path="inventory"
            element={
              <RequireAuth allowedRoles={['dealer']}>
                <DealerDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="dealership"
            element={
              <RequireAuth allowedRoles={['dealer']}>
                <DealershipProfilePage />
              </RequireAuth>
            }
          />

          {/* Admin-only protected routes */}
          <Route
            path="admin/users"
            element={
              <RequireAuth allowedRoles={['admin']}>
                <AdminDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="admin/dealers"
            element={
              <RequireAuth allowedRoles={['admin']}>
                <AdminDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="admin/listings"
            element={
              <RequireAuth allowedRoles={['admin']}>
                <AdminDashboard />
              </RequireAuth>
            }
          />

          {/* Shared authenticated routes */}
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
