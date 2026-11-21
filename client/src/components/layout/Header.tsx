import React, { useState } from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getInitials } from '../../utils/helpers';

const mockNotifications = [
  { id: '1', title: 'New offer available', message: 'A dealer has made an offer on your queued vehicle.', isRead: false, createdAt: '2024-02-10T09:00:00Z' },
  { id: '2', title: 'Booking confirmed', message: 'Your booking for Toyota Camry has been confirmed.', isRead: true, createdAt: '2024-02-09T14:00:00Z' },
];

export const Header: React.FC = () => {
  const { user } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = mockNotifications.filter(n => !n.isRead).length;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div />

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(v => !v)}
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <h4 className="text-sm font-semibold text-slate-900">Notifications</h4>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {mockNotifications.map(n => (
                  <div key={n.id} className={`px-4 py-3 ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
                    <div className="flex items-start gap-3">
                      {!n.isRead && <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />}
                      <div className={!n.isRead ? '' : 'ml-5'}>
                        <p className="text-sm font-medium text-slate-800">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-slate-100">
                <button className="text-xs text-blue-600 hover:underline">Mark all as read</button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {user ? getInitials(user.name) : '?'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-slate-800">{user?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
          <ChevronDown size={16} className="text-slate-400" />
        </div>
      </div>
    </header>
  );
};
