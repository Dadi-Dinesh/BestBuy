import { ApiResponse, Notification } from '../types';

let mockNotifications: Notification[] = [
  {
    id: 'n1',
    userId: 'u1',
    title: 'New Priority Offer Received!',
    message: 'City Cars Direct sent you a special offer of $46,500 on Tesla Model Y Long Range AWD ($1,490 discount).',
    type: 'success',
    category: 'offer',
    linkTo: '/compare',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'n2',
    userId: 'u1',
    title: 'New Dealer Incentive: Toyota Camry',
    message: 'Premier Auto Group submitted an offer of $33,900 on Camry XSE Hybrid with 2 years complimentary service.',
    type: 'info',
    category: 'offer',
    linkTo: '/dashboard',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'n3',
    userId: 'u1',
    title: 'Queue Priority Update',
    message: 'You moved to Position #1 in the Tesla Model Y queue. Dealers are reviewing your allocation.',
    type: 'warning',
    category: 'queue',
    linkTo: '/queue',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'n4',
    userId: 'u2', // Dealer Premier Auto Group
    title: 'Customer Joined Queue',
    message: 'Alice Johnson joined the waitlist for Toyota Camry XSE Hybrid.',
    type: 'info',
    category: 'queue',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

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
