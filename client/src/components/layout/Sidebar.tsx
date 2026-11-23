import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  Search,
  Users,
  Building2,
  ClipboardList,
  BookOpen,
  Settings,
  LogOut,
  ChevronRight,
  TrendingDown,
} from 'lucide-react';
import { useDemoMode } from '../../services/desktopMode';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../utils/helpers';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard size={18} />, roles: ['customer', 'dealer', 'admin'] },
  { label: 'Browse Cars', to: '/browse', icon: <Search size={18} />, roles: ['customer'] },
  { label: 'Compare Dealers', to: '/compare', icon: <TrendingDown size={18} />, roles: ['customer'] },
  { label: 'My Queue', to: '/queue', icon: <ClipboardList size={18} />, roles: ['customer'] },
  { label: 'My Bookings', to: '/bookings', icon: <BookOpen size={18} />, roles: ['customer'] },
  { label: 'My Inventory', to: '/inventory', icon: <Car size={18} />, roles: ['dealer'] },
  { label: 'Dealership', to: '/dealership', icon: <Building2 size={18} />, roles: ['dealer'] },
  { label: 'Customers', to: '/admin/users', icon: <Users size={18} />, roles: ['admin'] },
  { label: 'Dealers', to: '/admin/dealers', icon: <Building2 size={18} />, roles: ['admin'] },
  { label: 'Listings', to: '/admin/listings', icon: <Car size={18} />, roles: ['admin'] },
  { label: 'Shared Queues', to: '/admin/queues', icon: <ClipboardList size={18} />, roles: ['admin'] },
  { label: 'Reports', to: '/admin/reports', icon: <TrendingDown size={18} />, roles: ['admin'] },
  { label: 'Audit Log', to: '/admin/audit', icon: <BookOpen size={18} />, roles: ['admin'] },
  { label: 'Switch Role', to: '/role-selection', icon: <Users size={18} />, roles: ['customer', 'dealer', 'admin'] },
  { label: 'Settings', to: '/settings', icon: <Settings size={18} />, roles: ['customer', 'dealer', 'admin'] },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  useLocation();
  const demo = useDemoMode();

  const filteredItems = navItems.filter(item =>
    user ? item.roles.includes(user.role) && (demo || item.to !== '/role-selection') : false
  );

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-slate-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Car size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">BestBuy</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {filteredItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={14} className="text-blue-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Role Badge + Logout */}
      <div className="px-3 py-4 border-t border-slate-200 space-y-1">
        <div className="px-3 py-2 rounded-lg bg-slate-50">
          <p className="text-xs text-slate-500">Signed in as</p>
          <p className="text-sm font-medium text-slate-800 truncate">{user?.name}</p>
          <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 capitalize">
            {user?.role}
          </span>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
