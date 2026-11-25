import { indiaDemo } from '../../../src/data/indiaDemo';
import { queueAllocation } from '../../../src/services/queueAllocation';
import { isMockCustomerSuspended } from './authService';
import { ApiResponse, QueueEntry } from '../types';

function getAPI() {
  if (typeof window !== 'undefined' && (window as unknown as { electronAPI?: unknown }).electronAPI) {
    return (window as unknown as { electronAPI: Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>> }).electronAPI;
  }
  return null;
}

const mockQueues = indiaDemo().queues;

export const queueService = {
  markBooked(id: string) {
    const entry = mockQueues.find(queue => queue.id === id);
    if (entry && (entry.status === 'waiting' || entry.status === 'offered')) entry.status = 'booked';
  },
  async join(data: { vehicleModelId: string; customerId: string; variantId?: string; city?: string; state?: string }): Promise<ApiResponse<QueueEntry>> {
    const api = getAPI();
    if (api?.queue?.join) {
      return api.queue.join(data) as Promise<ApiResponse<QueueEntry>>;
    }
    if (isMockCustomerSuspended(data.customerId)) return { success: false, error: 'This customer account is suspended.' };
    const { existing,position } = queueAllocation(mockQueues,data);
    if (existing) return { success:true,data:existing };
    const newEntry: QueueEntry = {
      id: crypto.randomUUID(),
      vehicleModelId: data.vehicleModelId,
      variantId: data.variantId || '',
      city: data.city,
      customerId: data.customerId,
      position,
      status: 'waiting',
      createdAt: new Date().toISOString(),
    };
    mockQueues.push(newEntry);
    return { success: true, data: newEntry };
  },

  async getPosition(queueId: string): Promise<ApiResponse<{ position: number }>> {
    const api = getAPI();
    if (api?.queue?.getPosition) {
      return api.queue.getPosition(queueId) as Promise<ApiResponse<{ position: number }>>;
    }
    const entry = mockQueues.find(q => q.id === queueId);
    return entry ? { success: true, data: { position:entry.position } } : { success:false,error:'Queue entry not found.' };
  },

  async leave(queueId: string): Promise<ApiResponse<{ id: string }>> {
    const api = getAPI();
    if (api?.queue?.leave) {
      return api.queue.leave(queueId) as Promise<ApiResponse<{ id: string }>>;
    }
    const idx = mockQueues.findIndex(q => q.id === queueId);
    if (idx === -1) return { success: false, error: 'Queue entry not found.' };
    if (isMockCustomerSuspended(mockQueues[idx].customerId)) return { success: false, error: 'This customer account is suspended.' };
    if (!['waiting','offered'].includes(mockQueues[idx].status)) return { success:false,error:'This queue entry is no longer active.' };
    mockQueues[idx].status = 'cancelled';
    return { success: true, data: { id: queueId } };
  },

  async getByCustomerId(customerId: string): Promise<ApiResponse<QueueEntry[]>> {
    const api = getAPI();
    if (api?.queue?.getByCustomerId) {
      return api.queue.getByCustomerId(customerId) as Promise<ApiResponse<QueueEntry[]>>;
    }
    return { success: true, data: mockQueues.filter(q => q.customerId === customerId) };
  },

  async getAll(): Promise<ApiResponse<QueueEntry[]>> {
    const api = getAPI();
    if (api?.queue?.getAll) {
      return api.queue.getAll() as Promise<ApiResponse<QueueEntry[]>>;
    }
    return { success: true, data: [...mockQueues] };
  },
};
