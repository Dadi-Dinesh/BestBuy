import { ApiResponse, Booking } from '../types';

function getAPI() {
  if (typeof window !== 'undefined' && (window as unknown as { electronAPI?: unknown }).electronAPI) {
    return (window as unknown as { electronAPI: Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>> }).electronAPI;
  }
  return null;
}

const mockBookings: Booking[] = [
  {
    id: 'b1',
    customerId: 'u1',
    customerName: 'Alice Johnson',
    customerPhone: '+1 (555) 234-5678',
    listingId: 'l1',
    dealerId: 'd1',
    status: 'confirmed',
    bookingDate: '2024-02-15T10:00:00Z',
    notes: 'Test drive scheduled for Midnight Black Camry LE at LA showroom.',
    listing: {
      id: 'l1',
      dealerId: 'd1',
      vehicleModelId: 'vm1',
      variantId: 'vv1',
      brand: 'Toyota',
      model: 'Camry',
      variant: 'LE',
      year: 2024,
      fuelType: 'Petrol',
      transmission: 'Automatic',
      color: 'Midnight Black Metallic',
      mileage: 12,
      condition: 'new',
      price: 28400,
      exShowroomPrice: 26320,
      onRoadPrice: 29800,
      dealerOfferPrice: 28400,
      quantity: 3,
      deliveryTimeline: 'Immediate',
      availability: 'available',
      description: 'Brand new 2024 Toyota Camry LE in Midnight Black Metallic.',
      images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80'],
      createdAt: '2024-02-01T08:00:00Z',
      updatedAt: '2024-02-01T08:00:00Z',
    },
    dealer: {
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
  },
];

export const bookingService = {
  async getAll(): Promise<ApiResponse<Booking[]>> {
    const api = getAPI();
    if (api?.bookings?.getAll) {
      return api.bookings.getAll() as Promise<ApiResponse<Booking[]>>;
    }
    return { success: true, data: [...mockBookings] };
  },

  async create(data: { customerId: string; listingId: string; dealerId: string; notes?: string }): Promise<ApiResponse<Booking>> {
    const api = getAPI();
    if (api?.bookings?.create) {
      return api.bookings.create(data) as Promise<ApiResponse<Booking>>;
    }
    const newBooking: Booking = {
      id: `b${Date.now()}`,
      customerId: data.customerId,
      listingId: data.listingId,
      dealerId: data.dealerId,
      status: 'pending',
      bookingDate: new Date().toISOString(),
      notes: data.notes,
    };
    mockBookings.push(newBooking);
    return { success: true, data: newBooking };
  },

  async getByCustomerId(customerId: string): Promise<ApiResponse<Booking[]>> {
    const api = getAPI();
    if (api?.bookings?.getByCustomerId) {
      return api.bookings.getByCustomerId(customerId) as Promise<ApiResponse<Booking[]>>;
    }
    return { success: true, data: mockBookings.filter(b => b.customerId === customerId) };
  },

  async getByDealerId(dealerId: string): Promise<ApiResponse<Booking[]>> {
    const api = getAPI();
    if (api?.bookings?.getByDealerId) {
      return api.bookings.getByDealerId(dealerId) as Promise<ApiResponse<Booking[]>>;
    }
    return { success: true, data: mockBookings.filter(b => b.dealerId === dealerId) };
  },

  async updateStatus(id: string, status: Booking['status']): Promise<ApiResponse<Booking>> {
    const api = getAPI();
    if (api?.bookings?.updateStatus) {
      return api.bookings.updateStatus(id, status) as Promise<ApiResponse<Booking>>;
    }
    const booking = mockBookings.find(b => b.id === id);
    if (!booking) return { success: false, error: 'Booking not found' };
    booking.status = status;
    return { success: true, data: booking };
  },
};
