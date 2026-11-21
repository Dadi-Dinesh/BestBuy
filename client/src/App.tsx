import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoadingScreen } from './pages/LoadingScreen';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { RoleSelectionPage } from './pages/RoleSelectionPage';
import { MainLayout } from './components/layout/MainLayout';
import { CustomerDashboard } from './pages/dashboard/CustomerDashboard';
import { DealerDashboard } from './pages/dashboard/DealerDashboard';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { PlaceholderPage } from './pages/PlaceholderPage';
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
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/role-selection" element={<RoleSelectionPage />} />

        {/* Protected routes */}
        <Route path="/" element={<RequireAuth><MainLayout /></RequireAuth>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<RoleDashboard />} />

          {/* Customer routes */}
          <Route path="browse" element={<RequireAuth allowedRoles={['customer']}><PlaceholderPage title="Browse Cars" description="Search and filter vehicles from all dealers. Coming soon." /></RequireAuth>} />
          <Route path="queue" element={<RequireAuth allowedRoles={['customer']}><PlaceholderPage title="My Queue" description="View your position in vehicle queues and manage offers." /></RequireAuth>} />
          <Route path="bookings" element={<RequireAuth allowedRoles={['customer']}><PlaceholderPage title="My Bookings" description="Track and manage your vehicle bookings." /></RequireAuth>} />

          {/* Dealer routes */}
          <Route path="inventory" element={<RequireAuth allowedRoles={['dealer']}><PlaceholderPage title="My Inventory" description="Manage your vehicle listings, prices, and availability." /></RequireAuth>} />
          <Route path="dealership" element={<RequireAuth allowedRoles={['dealer']}><PlaceholderPage title="Dealership Profile" description="Update your dealership information and location." /></RequireAuth>} />

          {/* Admin routes */}
          <Route path="admin/users" element={<RequireAuth allowedRoles={['admin']}><PlaceholderPage title="All Users" description="View and manage all registered users." /></RequireAuth>} />
          <Route path="admin/dealers" element={<RequireAuth allowedRoles={['admin']}><PlaceholderPage title="All Dealers" description="Verify and manage dealer accounts." /></RequireAuth>} />
          <Route path="admin/listings" element={<RequireAuth allowedRoles={['admin']}><PlaceholderPage title="All Listings" description="Monitor all vehicle listings on the platform." /></RequireAuth>} />

          {/* Shared routes */}
          <Route path="settings" element={<PlaceholderPage title="Settings" description="Manage your account preferences and notifications." />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
