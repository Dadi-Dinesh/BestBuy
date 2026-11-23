import { isMockCustomerSuspended } from './authService';
import { demandFixtures } from '../../../src/data/demandFixtures';
import { ApiResponse, QueueEntry } from '../types';

function getAPI() {
  if (typeof window !== 'undefined' && (window as unknown as { electronAPI?: unknown }).electronAPI) {
    return (window as unknown as { electronAPI: Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>> }).electronAPI;
  }
  return null;
}

const mockQueues: QueueEntry[] = [
  ...demandFixtures().queues,
  {
    id: 'q1',
    city: 'Los Angeles',
    vehicleModelId: 'vm1',
    variantId: 'vv2',
    customerId: 'u1',
    customerName: 'Alice Johnson',
    customerPhone: '+1 (555) 234-5678',
    position: 2,
    status: 'waiting',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    vehicleModel: {
      id: 'vm1',
      make: 'Toyota',
      model: 'Camry',
      year: 2024,
      category: 'Sedan',
      variants: [],
    },
    variant: {
      id: 'vv2',
      name: 'XSE Hybrid',
      trimLevel: 'Sport Premium',
      engineType: '2.5L Hybrid',
      transmission: 'eCVT',
      fuelType: 'Hybrid',
      seatingCapacity: 5,
      features: ['JBL Audio', 'Panoramic Roof'],
    },
  },
  {
    id: 'q2',
    city: 'San Francisco',
    vehicleModelId: 'vm4',
    variantId: 'vv5',
    customerId: 'u1',
    customerName: 'Alice Johnson',
    customerPhone: '+1 (555) 234-5678',
    position: 1,
    status: 'offered',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    vehicleModel: {
      id: 'vm4',
      make: 'Tesla',
      model: 'Model Y',
      year: 2024,
      category: 'Electric SUV',
      variants: [],
    },
    variant: {
      id: 'vv5',
      name: 'Long Range AWD',
      trimLevel: 'Long Range',
      engineType: 'Dual Motor',
      transmission: 'Single-Speed',
      fuelType: 'Electric',
      seatingCapacity: 5,
      features: ['Autopilot', 'All-Glass Roof'],
    },
  },
];

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
    const newEntry: QueueEntry = {
      id: `q${Date.now()}`,
      vehicleModelId: data.vehicleModelId,
      variantId: data.variantId || '',
      city: data.city,
      customerId: data.customerId,
      position: mockQueues.filter(queue =>
        queue.vehicleModelId === data.vehicleModelId && queue.variantId === (data.variantId || '') &&
        queue.city?.trim().toLowerCase() === data.city?.trim().toLowerCase() &&
        (queue.status === 'waiting' || queue.status === 'offered')
      ).length + 1,
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
    return { success: true, data: { position: entry ? entry.position : 1 } };
  },

  async leave(queueId: string): Promise<ApiResponse<{ id: string }>> {
    const api = getAPI();
    if (api?.queue?.leave) {
      return api.queue.leave(queueId) as Promise<ApiResponse<{ id: string }>>;
    }
    const idx = mockQueues.findIndex(q => q.id === queueId);
    if (idx === -1) return { success: false, error: 'Queue entry not found.' };
    if (isMockCustomerSuspended(mockQueues[idx].customerId)) return { success: false, error: 'This customer account is suspended.' };
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
