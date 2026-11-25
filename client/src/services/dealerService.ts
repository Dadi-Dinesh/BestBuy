import { indiaDemo } from '../../../src/data/indiaDemo';
import { isMockAdmin } from './authService';
import { mockAudit } from './mockAudit';
import { ApiResponse, Dealer } from '../types';

function getAPI() {
  if (typeof window !== 'undefined' && (window as unknown as { electronAPI?: unknown }).electronAPI) {
    return (window as unknown as { electronAPI: Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>> }).electronAPI;
  }
  return null;
}

let mockDealers = indiaDemo().dealers;

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
