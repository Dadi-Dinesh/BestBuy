import { PasswordRecovery } from './pages/PasswordRecovery';
import { MarketplaceHome } from './pages/MarketplaceHome';
import { IndiaCatalogue, IndiaCarDetails } from './pages/india/IndiaCatalogue';
import { TestDrives } from './pages/india/TestDrives';
import { CatalogueAdmin } from './pages/india/CatalogueAdmin';
import React, { useEffect, useState } from 'react';
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
import { authService } from './services/authService';
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

function AuthenticatedLayout() {
  const { user, token, logout, setUser } = useAuthStore();
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    let active = true;
    async function checkAccount() {
      try {
        const result = await authService.getUserById(userId!);
        if (!active) return;
        if (!result.success || !result.data || result.data.status === 'suspended' ||
            result.data.dealerProfile?.status === 'suspended') {
          logout();
        } else if (result.data.dealerProfile?.status !== useAuthStore.getState().user?.dealerProfile?.status) {
          setUser(result.data, token);
        }
      } catch {
        // An unavailable adapter is handled by the current screen.
      }
    }
    void checkAccount();
    window.addEventListener('focus', checkAccount);
    const timer = window.setInterval(checkAccount, 15_000);
    return () => {
      active = false;
      window.removeEventListener('focus', checkAccount);
      window.clearInterval(timer);
    };
  }, [userId, token, logout, setUser]);
  return <MainLayout />;
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
        <Route index element={<MarketplaceHome />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<PasswordRecovery />} />
        <Route path="/reset-password" element={<PasswordRecovery reset />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/role-selection" element={<RoleSelectionPage />} />

        {/* Authenticated Application Layout */}
        <Route path="/" element={<RequireAuth><AuthenticatedLayout /></RequireAuth>}>

          <Route path="dashboard" element={<RoleDashboard />} />

          {/* Customer-only protected routes */}
          <Route
            path="browse"
            element={
              <RequireAuth allowedRoles={['customer']}>
                <CustomerDashboard key="vehicles" initialTab="vehicles" />
              </RequireAuth>
            }
          />
          <Route
            path="compare"
            element={
              <RequireAuth allowedRoles={['customer']}>
                <CustomerDashboard key="comparison" initialTab="comparison" />
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
                <CustomerDashboard key="queues" initialTab="queues" />
              </RequireAuth>
            }
          />
          <Route
            path="bookings"
            element={
              <RequireAuth allowedRoles={['customer']}>
                <CustomerDashboard key="bookings" initialTab="bookings" />
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
          <Route path="admin/*" element={<RequireAuth allowedRoles={['admin']}><AdminDashboard /></RequireAuth>} />

          <Route path="offers" element={<RequireAuth allowedRoles={['customer']}><CustomerDashboard key="offers" initialTab="offers" /></RequireAuth>} />
          <Route path="catalogue" element={<RequireAuth allowedRoles={['customer']}><IndiaCatalogue /></RequireAuth>} />
          <Route path="catalogue/:id" element={<RequireAuth allowedRoles={['customer']}><IndiaCarDetails /></RequireAuth>} />
          <Route path="garage" element={<RequireAuth allowedRoles={['customer']}><IndiaCatalogue garage /></RequireAuth>} />
          <Route path="test-drives" element={<TestDrives />} />
          <Route path="admin/catalogue" element={<RequireAuth allowedRoles={['admin']}><CatalogueAdmin /></RequireAuth>} />

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
