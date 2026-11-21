import { ApiResponse, Offer } from '../types';

function getAPI() {
  if (typeof window !== 'undefined' && (window as unknown as { electronAPI?: unknown }).electronAPI) {
    return (window as unknown as { electronAPI: Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>> }).electronAPI;
  }
  return null;
}

const mockOffers: Offer[] = [
  {
    id: 'o1',
    queueEntryId: 'q2',
    customerId: 'u1',
    customerName: 'Alice Johnson',
    dealerId: 'd2',
    dealerName: 'City Cars Direct',
    vehicleModelId: 'vm4',
    vehicleName: 'Tesla Model Y',
    variantName: 'Long Range AWD',
    offeredPrice: 46500,
    originalPrice: 47990,
    status: 'pending',
    expiryDate: '2024-02-28T23:59:59Z',
    createdAt: '2024-02-08T09:00:00Z',
    notes: 'Special incentive offer: $1,490 dealer discount plus complimentary ceramic coating.',
  },
  {
    id: 'o2',
    queueEntryId: 'q1',
    customerId: 'u1',
    customerName: 'Alice Johnson',
    dealerId: 'd1',
    dealerName: 'Premier Auto Group',
    vehicleModelId: 'vm1',
    vehicleName: 'Toyota Camry',
    variantName: 'XSE Hybrid',
    offeredPrice: 33900,
    originalPrice: 34850,
    status: 'pending',
    expiryDate: '2024-02-25T23:59:59Z',
    createdAt: '2024-02-09T14:00:00Z',
    notes: 'Exclusive queue match pricing with 2 years of complimentary factory maintenance.',
  },
];

export const offerService = {
  async getAll(): Promise<ApiResponse<Offer[]>> {
    const api = getAPI();
    if (api?.offers?.getAll) {
      return api.offers.getAll() as Promise<ApiResponse<Offer[]>>;
    }
    return { success: true, data: [...mockOffers] };
  },

  async getByCustomerId(customerId: string): Promise<ApiResponse<Offer[]>> {
    const api = getAPI();
    if (api?.offers?.getByCustomerId) {
      return api.offers.getByCustomerId(customerId) as Promise<ApiResponse<Offer[]>>;
    }
    return { success: true, data: mockOffers.filter(o => o.customerId === customerId) };
  },

  async getByDealerId(dealerId: string): Promise<ApiResponse<Offer[]>> {
    const api = getAPI();
    if (api?.offers?.getByDealerId) {
      return api.offers.getByDealerId(dealerId) as Promise<ApiResponse<Offer[]>>;
    }
    return { success: true, data: mockOffers.filter(o => o.dealerId === dealerId) };
  },

  async create(data: Omit<Offer, 'id' | 'createdAt'>): Promise<ApiResponse<Offer>> {
    const api = getAPI();
    if (api?.offers?.create) {
      return api.offers.create(data) as Promise<ApiResponse<Offer>>;
    }
    const newOffer: Offer = {
      ...data,
      id: `o${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    mockOffers.push(newOffer);
    return { success: true, data: newOffer };
  },

  async updateStatus(id: string, status: Offer['status']): Promise<ApiResponse<Offer>> {
    const api = getAPI();
    if (api?.offers?.updateStatus) {
      return api.offers.updateStatus(id, status) as Promise<ApiResponse<Offer>>;
    }
    const offer = mockOffers.find(o => o.id === id);
    if (!offer) return { success: false, error: 'Offer not found' };
    offer.status = status;
    return { success: true, data: offer };
  },
};
