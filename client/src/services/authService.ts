import { ApiResponse, User } from '../types';

// In Electron, window.electronAPI is exposed by preload.
// In browser dev mode (without Electron), we fall back to a no-op.
function getAPI() {
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    return (window as any).electronAPI;
  }
  return null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    const api = getAPI();
    if (!api) {
      // Browser dev fallback: mock response
      const mockUsers: Record<string, { user: User; token: string }> = {
        'customer@demo.com': {
          user: { id: 'u1', name: 'Alice Johnson', email: 'customer@demo.com', role: 'customer', createdAt: '2024-01-10T08:00:00Z' },
          token: 'mock-token-u1',
        },
        'dealer@demo.com': {
          user: { id: 'u2', name: 'Bob Smith', email: 'dealer@demo.com', role: 'dealer', createdAt: '2024-01-05T08:00:00Z' },
          token: 'mock-token-u2',
        },
        'admin@demo.com': {
          user: { id: 'u3', name: 'Admin User', email: 'admin@demo.com', role: 'admin', createdAt: '2024-01-01T08:00:00Z' },
          token: 'mock-token-u3',
        },
      };
      if (mockUsers[credentials.email] && credentials.password === 'demo1234') {
        return { success: true, data: mockUsers[credentials.email] };
      }
      return { success: false, error: 'Invalid email or password.' };
    }
    return api.auth.login(credentials);
  },

  async register(data: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> {
    const api = getAPI();
    if (!api) {
      return {
        success: true,
        data: {
          user: { id: `u${Date.now()}`, name: data.name, email: data.email, role: data.role as User['role'], createdAt: new Date().toISOString() },
          token: `mock-token-${Date.now()}`,
        },
      };
    }
    return api.auth.register(data);
  },

  async logout(): Promise<void> {
    const api = getAPI();
    if (api) {
      await api.auth.logout();
    }
  },
};
