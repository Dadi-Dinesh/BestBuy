import { ApiResponse, Dealer } from '../types';

function getAPI() {
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    return (window as any).electronAPI;
  }
  return null;
}

export const dealerService = {
  async getAll(): Promise<ApiResponse<Dealer[]>> {
    const api = getAPI();
    if (!api) return { success: true, data: [] };
    return api.dealers.getAll();
  },

  async getById(id: string): Promise<ApiResponse<Dealer>> {
    const api = getAPI();
    if (!api) return { success: false, error: 'No API available.' };
    return api.dealers.getById(id);
  },

  async update(id: string, data: Record<string, unknown>): Promise<ApiResponse<Dealer>> {
    const api = getAPI();
    if (!api) return { success: false, error: 'No API available.' };
    return api.dealers.update(id, data);
  },
};
