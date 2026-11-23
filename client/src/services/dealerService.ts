import { isMockAdmin } from './authService';
import { mockAudit } from './mockAudit';
import { ApiResponse, Dealer } from '../types';

function getAPI() {
  if (typeof window !== 'undefined' && (window as unknown as { electronAPI?: unknown }).electronAPI) {
    return (window as unknown as { electronAPI: Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>> }).electronAPI;
  }
  return null;
}

let mockDealers: Dealer[] = [
  {
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
  {
    id: 'd2',
    userId: 'u4',
    dealershipName: 'City Cars Direct',
    registrationNumber: 'DL-CA-2022-4412',
    contactPerson: 'Marcus Vance',
    phone: '+1 (415) 555-0200',
    email: 'info@citycars.com',
    address: '567 Dealership Boulevard',
    city: 'San Francisco',
    state: 'CA',
    pinCode: '94103',
    status: 'approved',
    isVerified: true,
    createdAt: '2024-01-07T08:00:00Z',
  },
  {
    id: 'd3',
    userId: 'u6',
    dealershipName: 'Pacific Horizon Motors',
    registrationNumber: 'DL-CA-2023-5582',
    contactPerson: 'David Chen',
    phone: '+1 (619) 555-0350',
    email: 'sales@pacifichorizon.com',
    address: '789 Harbor Drive',
    city: 'San Diego',
    state: 'CA',
    pinCode: '92101',
    status: 'approved',
    isVerified: true,
    createdAt: '2024-01-12T08:00:00Z',
  },
  {
    id: 'd4',
    userId: 'u7',
    dealershipName: 'Bay Area Prestige Autos',
    registrationNumber: 'DL-CA-2023-7719',
    contactPerson: 'Sarah Jenkins',
    phone: '+1 (408) 555-0420',
    email: 'contact@prestigeautos.com',
    address: '450 Silicon Valley Expressway',
    city: 'San Jose',
    state: 'CA',
    pinCode: '95113',
    status: 'approved',
    isVerified: true,
    createdAt: '2024-01-15T08:00:00Z',
  },
  {
    id: 'd5',
    userId: 'u5',
    dealershipName: 'Apex Motorworks',
    registrationNumber: 'DL-NV-2024-1109',
    contactPerson: 'Elena Rostova',
    phone: '+1 (702) 555-7788',
    email: 'elena@apexmotors.com',
    address: '890 Sahara Avenue',
    city: 'Las Vegas',
    state: 'NV',
    pinCode: '89104',
    status: 'pending',
    isVerified: false,
    createdAt: '2024-02-01T11:00:00Z',
  },
];

export function registerMockDealer(dealer: Dealer) {
  mockDealers.push(dealer);
}

export function mockDealerCanTrade(id: string) {
  return mockDealers.some(dealer => dealer.id === id && dealer.status === 'approved');
}

export const dealerService = {
  async getAll(): Promise<ApiResponse<Dealer[]>> {
    const api = getAPI();
    if (api?.dealers?.getAll) {
      return api.dealers.getAll() as Promise<ApiResponse<Dealer[]>>;
    }
    return { success: true, data: [...mockDealers] };
  },

  async getById(id: string): Promise<ApiResponse<Dealer>> {
    const api = getAPI();
    if (api?.dealers?.getById) {
      return api.dealers.getById(id) as Promise<ApiResponse<Dealer>>;
    }
    const dealer = mockDealers.find(d => d.id === id);
    if (!dealer) return { success: false, error: 'Dealer not found' };
    return { success: true, data: dealer };
  },

  async update(id: string, data: Record<string, unknown>): Promise<ApiResponse<Dealer>> {
    const api = getAPI();
    if (api?.dealers?.update) {
      return api.dealers.update(id, data) as Promise<ApiResponse<Dealer>>;
    }
    const idx = mockDealers.findIndex(d => d.id === id);
    if (idx !== -1) {
      const current = mockDealers[idx];
      mockDealers[idx] = { ...current, ...data, id: current.id, userId: current.userId,
        status: current.status, isVerified: current.isVerified } as Dealer;
      return { success: true, data: mockDealers[idx] };
    }
    return { success: false, error: 'Dealer not found' };
  },

  async updateStatus(id: string, status: Dealer['status'], actorId: string): Promise<ApiResponse<Dealer>> {
    const api = getAPI();
    if (api?.dealers?.updateStatus) {
      return api.dealers.updateStatus(id, status, actorId) as Promise<ApiResponse<Dealer>>;
    }
    const idx = mockDealers.findIndex(d => d.id === id);
    if (idx !== -1) {
      const dealer = mockDealers[idx];
      if (!isMockAdmin(actorId)) return { success: false, error: 'Administrator access is required.' };
      if (!['approved', 'rejected', 'suspended'].includes(status)) return { success: false, error: 'Invalid dealer status.' };
      if (dealer.status !== status) {
        mockAudit.record('Dealer status changed', actorId, id, `${dealer.dealershipName} · ${dealer.status} → ${status}`);
        mockDealers[idx] = { ...dealer, status, isVerified: status === 'approved' };
      }
      return { success: true, data: mockDealers[idx] };
    }
    return { success: false, error: 'Dealer not found' };
  },
};
