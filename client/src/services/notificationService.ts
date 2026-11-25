import { ApiResponse, Notification } from '../types';

let mockNotifications: Notification[] = [];

type Listener = (notifications: Notification[]) => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  const current = [...mockNotifications];
  listeners.forEach(fn => fn(current));
}

export const notificationService = {
  async getAll(userId?: string): Promise<ApiResponse<Notification[]>> {
    const list = userId
      ? mockNotifications.filter(n => !n.userId || n.userId === userId)
      : [...mockNotifications];
    return { success: true, data: list };
  },

  add(data: {
    userId?: string;
    title: string;
    message: string;
    type?: Notification['type'];
    category?: Notification['category'];
    linkTo?: string;
  }): Notification {
    const newNotif: Notification = {
      id: `n${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      category: data.category || 'system',
      linkTo: data.linkTo,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    mockNotifications.unshift(newNotif);
    notifyListeners();
    return newNotif;
  },

  markAsRead(id: string): void {
    const n = mockNotifications.find(item => item.id === id);
    if (n) {
      n.isRead = true;
      notifyListeners();
    }
  },

  markAllAsRead(userId?: string): void {
    mockNotifications.forEach(n => {
      if (!userId || !n.userId || n.userId === userId) {
        n.isRead = true;
      }
    });
    notifyListeners();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    listener([...mockNotifications]);
    return () => listeners.delete(listener);
  },
};
