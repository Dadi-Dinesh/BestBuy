import type { ApiResponse, CustomerAccountStatus, User } from '../types';
import { adminMetrics, type AdminData, type AdminStats } from '../../../src/services/adminMetrics';
import type { AuditEntry } from '../../../src/services/auditLog';
import { authService } from './authService';
import { bookingService } from './bookingService';
import { dealerService } from './dealerService';
import { mockAudit } from './mockAudit';
import { offerService } from './offerService';
import { queueService } from './queueService';
import { vehicleService } from './vehicleService';

function getAPI() {
  return (typeof window !== 'undefined' ? window : undefined) as (Window & {
    electronAPI?: { admin?: {
      getStats(): Promise<ApiResponse<AdminStats>>;
      getAuditLog(): Promise<ApiResponse<AuditEntry[]>>;
      updateCustomerStatus(id: string, status: CustomerAccountStatus, actorId: string): Promise<ApiResponse<User>>;
    } };
  }) | undefined;
}

export const adminService = {
  async loadData(): Promise<AdminData> {
    const [users, dealers, vehicles, queues, offers, bookings] = await Promise.all([
      authService.getAllUsers(), dealerService.getAll(), vehicleService.getAll(),
      queueService.getAll(), offerService.getAll(), bookingService.getAll(),
    ]);
    if (!users.data || !dealers.data || !vehicles.data || !queues.data || !offers.data || !bookings.data) {
      throw new Error('Administrator data is unavailable.');
    }
    return { users: users.data, dealers: dealers.data, vehicles: vehicles.data,
      queues: queues.data, offers: offers.data, bookings: bookings.data };
  },

  async getStats(): Promise<ApiResponse<AdminStats>> {
    const api = getAPI()?.electronAPI?.admin;
    if (api) return api.getStats();
    return { success: true, data: adminMetrics(await this.loadData()) };
  },

  async getAuditLog(): Promise<ApiResponse<AuditEntry[]>> {
    const api = getAPI()?.electronAPI?.admin;
    return api ? api.getAuditLog() : { success: true, data: mockAudit.list() };
  },

  async updateCustomerStatus(id: string, status: CustomerAccountStatus, actorId: string): Promise<ApiResponse<User>> {
    const api = getAPI()?.electronAPI?.admin;
    return api ? api.updateCustomerStatus(id, status, actorId) : authService.updateMockCustomerStatus(id, status, actorId);
  },
};
