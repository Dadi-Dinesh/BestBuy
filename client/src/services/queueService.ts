import { ApiResponse, QueueEntry } from '../types';

function getAPI() {
  if (typeof window !== 'undefined' && (window as unknown as { electronAPI?: unknown }).electronAPI) {
    return (window as unknown as { electronAPI: Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>> }).electronAPI;
  }
  return null;
}

const mockQueues: QueueEntry[] = [
  {
    id: 'q1',
    vehicleModelId: 'vm1',
    variantId: 'vv2',
    customerId: 'u1',
    customerName: 'Alice Johnson',
    customerPhone: '+1 (555) 234-5678',
    position: 2,
    status: 'waiting',
    createdAt: '2024-02-05T10:15:00Z',
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
    vehicleModelId: 'vm4',
    variantId: 'vv5',
    customerId: 'u1',
    customerName: 'Alice Johnson',
    customerPhone: '+1 (555) 234-5678',
    position: 1,
    status: 'offered',
    createdAt: '2024-02-06T14:30:00Z',
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
  async join(data: { vehicleModelId: string; customerId: string; variantId?: string }): Promise<ApiResponse<QueueEntry>> {
    const api = getAPI();
    if (api?.queue?.join) {
      return api.queue.join(data) as Promise<ApiResponse<QueueEntry>>;
    }
    const newEntry: QueueEntry = {
      id: `q${Date.now()}`,
      vehicleModelId: data.vehicleModelId,
      variantId: data.variantId || '',
      customerId: data.customerId,
      position: mockQueues.length + 1,
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
    if (idx !== -1) mockQueues[idx].status = 'cancelled';
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
