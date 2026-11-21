import { ApiResponse } from '../types';

export interface AdminStats {
  totalCustomers: number;
  totalDealers: number;
  totalVehicles: number;
  activeQueues: number;
  totalBookings: number;
  pendingApprovals: number;
}

function getAPI() {
  if (typeof window !== 'undefined' && (window as unknown as { electronAPI?: unknown }).electronAPI) {
    return (window as unknown as { electronAPI: Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>> }).electronAPI;
  }
  return null;
}

export const adminService = {
  async getStats(): Promise<ApiResponse<AdminStats>> {
    const api = getAPI();
    if (api?.admin?.getStats) {
      return api.admin.getStats() as Promise<ApiResponse<AdminStats>>;
    }
    return {
      success: true,
      data: {
        totalCustomers: 1,
        totalDealers: 3,
        totalVehicles: 6,
        activeQueues: 3,
        totalBookings: 1,
        pendingApprovals: 1,
      },
    };
  },
};
