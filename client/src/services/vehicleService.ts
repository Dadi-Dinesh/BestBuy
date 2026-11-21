import { ApiResponse, VehicleListing } from '../types';

function getAPI() {
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    return (window as any).electronAPI;
  }
  return null;
}

export const vehicleService = {
  async getAll(filters?: Record<string, unknown>): Promise<ApiResponse<VehicleListing[]>> {
    const api = getAPI();
    if (!api) {
      return { success: true, data: [] };
    }
    return api.vehicles.getAll(filters);
  },

  async getById(id: string): Promise<ApiResponse<VehicleListing>> {
    const api = getAPI();
    if (!api) {
      return { success: false, error: 'No API available.' };
    }
    return api.vehicles.getById(id);
  },

  async create(data: Record<string, unknown>): Promise<ApiResponse<VehicleListing>> {
    const api = getAPI();
    if (!api) {
      return { success: false, error: 'No API available.' };
    }
    return api.vehicles.create(data);
  },

  async update(id: string, data: Record<string, unknown>): Promise<ApiResponse<VehicleListing>> {
    const api = getAPI();
    if (!api) {
      return { success: false, error: 'No API available.' };
    }
    return api.vehicles.update(id, data);
  },

  async delete(id: string): Promise<ApiResponse<{ id: string }>> {
    const api = getAPI();
    if (!api) {
      return { success: false, error: 'No API available.' };
    }
    return api.vehicles.delete(id);
  },
};
