import React, { useState, useEffect } from 'react';
import {
  Bell,
  ChevronDown,
  CheckCircle2,
  Tag,
  Calendar,
  ClipboardList,
  Info,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { desktopAPI, useDemoMode } from '../../services/desktopMode';
import { notificationService } from '../../services/notificationService';
import { Notification } from '../../types';
import { getInitials, formatDate } from '../../utils/helpers';

export const Header: React.FC = () => {
  const { user } = useAuthStore();
  const demo = useDemoMode();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (demo) {
      return notificationService.subscribe(all => setNotifications(all.filter(n => !n.userId || n.userId === user?.id)));
    }
    const api = desktopAPI();
    if (!api || !user) return;
    let active = true;
    const refresh = async () => {
      try {
        const result = await api.notifications.getAll();
        if (active && result.data) setNotifications(result.data);
      } catch {
        // Notifications are optional when the desktop is offline or in demo mode.
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 20_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [demo, user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  async function markRead(id?: string) {
    if (demo) {
      if (id) notificationService.markAsRead(id);
      else notificationService.markAllAsRead(user?.id);
      return;
    }
    try {
      if ((await desktopAPI()?.notifications.markRead(id))?.success) {
        setNotifications(list => list.map(item => !id || item.id === id ? { ...item, isRead:true } : item));
      }
    } catch {
      // Leave the unread state intact if the update failed.
    }
  }

  const getCategoryIcon = (category?: Notification['category']) => {
    switch (category) {
      case 'offer':
        return <Tag size={14} className="text-emerald-600" />;
      case 'booking':
        return <Calendar size={14} className="text-blue-600" />;
      case 'queue':
        return <ClipboardList size={14} className="text-amber-600" />;
      default:
        return <Info size={14} className="text-slate-500" />;
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div />

      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(v => !v)}
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => void markRead()}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => void markRead(n.id)}
                      className={`px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 ${
                        !n.isRead ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs mt-0.5 flex-shrink-0">
                          {getCategoryIcon(n.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {n.title}
                            </p>
                            {!n.isRead && (
                              <span className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-400 block mt-1 flex items-center gap-1">
                            <Clock size={10} />
                            {formatDate(n.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
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
