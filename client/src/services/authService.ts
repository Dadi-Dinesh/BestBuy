import { ApiResponse, User, RegisterData } from '../types';

function getAPI() {
  if (typeof window !== 'undefined' && (window as unknown as { electronAPI?: unknown }).electronAPI) {
    return (window as unknown as { electronAPI: Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>> }).electronAPI;
  }
  return null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Fallback in-memory demo data for browser dev mode
const mockBrowserUsers: User[] = [
  {
    id: 'u1',
    name: 'Alice Johnson',
    email: 'customer@demo.com',
    phoneNumber: '+1 (555) 234-5678',
    role: 'customer',
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    id: 'u2',
    name: 'Bob Smith',
    email: 'dealer@demo.com',
    phoneNumber: '+1 (555) 876-5432',
    role: 'dealer',
    createdAt: '2024-01-05T08:00:00Z',
    dealerProfile: {
      id: 'd1',
      userId: 'u2',
      dealershipName: 'Premier Auto Group',
      registrationNumber: 'DL-CA-2023-8891',
      contactPerson: 'Bob Smith',
      phone: '+1 (310) 555-0100',
      email: 'premier@autogroup.com',
      address: '1234 Motor Avenue',
      city: 'Los Angeles',
      state: 'CA',
      pinCode: '90025',
      status: 'approved',
      isVerified: true,
      createdAt: '2024-01-05T08:00:00Z',
    },
  },
  {
    id: 'u3',
    name: 'Admin User',
    email: 'admin@demo.com',
    phoneNumber: '+1 (555) 000-1122',
    role: 'admin',
    createdAt: '2024-01-01T08:00:00Z',
  },
];

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    const api = getAPI();
    if (api?.auth?.login) {
      return api.auth.login(credentials) as Promise<ApiResponse<{ user: User; token: string }>>;
    }

    // In-memory browser fallback
    await new Promise(r => setTimeout(r, 400));
    const normalizedEmail = credentials.email.trim().toLowerCase();
    const user = mockBrowserUsers.find(u => u.email.toLowerCase() === normalizedEmail);

    if (user && credentials.password === 'demo1234') {
      return {
        success: true,
        data: {
          user,
          token: `browser-token-${user.id}`,
        },
      };
    }

    return {
      success: false,
      error: 'Invalid email address or password. Please try again.',
    };
  },

  async register(data: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> {
    const api = getAPI();
    if (api?.auth?.register) {
      return api.auth.register(data) as Promise<ApiResponse<{ user: User; token: string }>>;
    }

    // In-memory browser fallback
    await new Promise(r => setTimeout(r, 500));
    const normalizedEmail = data.email.trim().toLowerCase();

    if (mockBrowserUsers.some(u => u.email.toLowerCase() === normalizedEmail)) {
      return {
        success: false,
        error: 'An account with this email address already exists.',
      };
    }

    const newId = `u${Date.now()}`;
    const newUser: User = {
      id: newId,
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
      role: data.role,
      createdAt: new Date().toISOString(),
    };

    if (data.role === 'dealer') {
      newUser.dealerProfile = {
        id: `d${Date.now()}`,
        userId: newId,
        dealershipName: data.dealershipName,
        registrationNumber: data.registrationNumber,
        contactPerson: data.contactPerson,
        phone: data.dealershipPhone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        pinCode: data.pinCode,
        status: 'pending',
        isVerified: false,
        createdAt: new Date().toISOString(),
      };
    }

    mockBrowserUsers.push(newUser);

    return {
      success: true,
      data: {
        user: newUser,
        token: `browser-token-${newId}`,
      },
      message: data.role === 'dealer'
        ? 'Dealer registration submitted! Awaiting administrator approval.'
        : 'Registration completed successfully.',
    };
  },

  async logout(): Promise<void> {
    const api = getAPI();
    if (api?.auth?.logout) {
      await api.auth.logout();
    }
  },

  async getAllUsers(): Promise<ApiResponse<User[]>> {
    const api = getAPI();
    if (api?.auth?.getAllUsers) {
      return api.auth.getAllUsers() as Promise<ApiResponse<User[]>>;
    }
    return { success: true, data: [...mockBrowserUsers] };
  },
};
