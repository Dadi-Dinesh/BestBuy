import { indiaDemo } from '../../../src/data/indiaDemo';
import { hashDemoPassword, verifyDemoPassword } from './demoPasswords';
import { dealerService, registerMockDealer } from './dealerService';
import { mockAudit } from './mockAudit';
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
const mockBrowserUsers = indiaDemo().users;

let demoPassword: ReturnType<typeof hashDemoPassword> | undefined;
const demoUsers = new Set(['u1','u2','u3']);
const mockPasswords = new Map<string, Awaited<ReturnType<typeof hashDemoPassword>>>();

export function isMockAdmin(id: string) {
  return mockBrowserUsers.some(user => user.id === id && user.role === 'admin');
}

export function isMockCustomerSuspended(id: string) {
  return mockBrowserUsers.some(user => user.id === id && user.status === 'suspended');
}

export const authService = {
  async resetPassword(code:string,password:string):Promise<ApiResponse<unknown>> {
    const api=getAPI();
    if(api?.auth?.resetPassword) return api.auth.resetPassword(code,password) as Promise<ApiResponse<unknown>>;
    return {success:false,error:'Password recovery requires the PostgreSQL application.'};
  },
  async getUserById(id: string): Promise<ApiResponse<User>> {
    const api = getAPI();
    if (api?.auth?.getUserById) return api.auth.getUserById(id) as Promise<ApiResponse<User>>;
    const user = mockBrowserUsers.find(item => item.id === id);
    if (!user) return { success: false, error: 'User not found.' };
    const dealerProfile = user.dealerProfile ? (await dealerService.getById(user.dealerProfile.id)).data : undefined;
    return { success: true, data: { ...user, dealerProfile } };
  },

  updateMockCustomerStatus(id: string, status: 'active' | 'suspended', actorId: string): ApiResponse<User> {
    if (!isMockAdmin(actorId)) {
      return { success: false, error: 'Administrator access is required.' };
    }
    if (status !== 'active' && status !== 'suspended') return { success: false, error: 'Invalid customer status.' };
    const user = mockBrowserUsers.find(item => item.id === id && item.role === 'customer');
    if (!user) return { success: false, error: 'Customer not found.' };
    const previous = user.status ?? 'active';
    if (previous !== status) {
      user.status = status;
      mockAudit.record('Customer account status changed', actorId, id, `${user.name} · ${previous} → ${status}`);
    }
    return { success: true, data: { ...user } };
  },

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    const api = getAPI();
    if (api?.auth?.login) {
      return api.auth.login(credentials) as Promise<ApiResponse<{ user: User; token: string }>>;
    }

    // In-memory browser fallback
    await new Promise(r => setTimeout(r, 400));
    const normalizedEmail = credentials.email.trim().toLowerCase();
    const user = mockBrowserUsers.find(u => u.email.toLowerCase() === normalizedEmail);

    const stored = user && (demoUsers.has(user.id)
      ? await (demoPassword ??= hashDemoPassword('demo1234'))
      : mockPasswords.get(user.id));
    if (user && await verifyDemoPassword(credentials.password, stored)) {
      const profile = (await this.getUserById(user.id)).data;
      if (profile?.status === 'suspended' || profile?.dealerProfile?.status === 'suspended') {
        return { success: false, error: 'This account is suspended.' };
      }
      return {
        success: true,
        data: {
          user: profile ?? user,
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

    const passwordHash = await hashDemoPassword(data.password);
    if (mockBrowserUsers.some(u => u.email.toLowerCase() === normalizedEmail)) {
      return { success:false,error:'An account with this email address already exists.' };
    }
    const newId = crypto.randomUUID();
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
        id: crypto.randomUUID(),
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

    if (newUser.dealerProfile) registerMockDealer(newUser.dealerProfile);
    mockBrowserUsers.push(newUser);
    mockPasswords.set(newId, passwordHash);

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
