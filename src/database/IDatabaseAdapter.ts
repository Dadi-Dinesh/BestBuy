import {
  User,
  Dealer,
  VehicleListing,
  QueueEntry,
  Booking,
  Offer,
  ApiResponse,
  RegisterData,
  CreateVehicleListingData,
  UpdateVehicleListingData,
  VehicleAvailabilityStatus,
} from '../types';

export interface AdminStats {
  totalCustomers: number;
  totalDealers: number;
  totalVehicles: number;
  activeQueues: number;
  totalBookings: number;
  pendingApprovals: number;
}

export interface IDatabaseAdapter {
  readonly name: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  auth: {
    login(credentials: { email: string; password: string }): Promise<ApiResponse<{ user: User; token: string }>>;
    register(data: RegisterData): Promise<ApiResponse<{ user: User; token: string }>>;
    getUserById(id: string): Promise<ApiResponse<User>>;
    getAllUsers(): Promise<ApiResponse<User[]>>;
  };

  vehicles: {
    getAll(filters?: Record<string, unknown>): Promise<ApiResponse<VehicleListing[]>>;
    getById(id: string): Promise<ApiResponse<VehicleListing>>;
    create(data: CreateVehicleListingData | Record<string, unknown>): Promise<ApiResponse<VehicleListing>>;
    update(id: string, data: UpdateVehicleListingData | Record<string, unknown>): Promise<ApiResponse<VehicleListing>>;
    updatePrice(id: string, prices: { exShowroomPrice?: number; onRoadPrice?: number; dealerOfferPrice: number }): Promise<ApiResponse<VehicleListing>>;
    updateAvailability(id: string, availability: VehicleAvailabilityStatus): Promise<ApiResponse<VehicleListing>>;
    delete(id: string): Promise<ApiResponse<{ id: string }>>;
  };

  dealers: {
    getAll(): Promise<ApiResponse<Dealer[]>>;
    getById(id: string): Promise<ApiResponse<Dealer>>;
    update(id: string, data: Record<string, unknown>): Promise<ApiResponse<Dealer>>;
    updateStatus(id: string, status: Dealer['status']): Promise<ApiResponse<Dealer>>;
  };

  queue: {
    join(data: { vehicleModelId: string; customerId: string; variantId?: string }): Promise<ApiResponse<QueueEntry>>;
    getPosition(queueId: string): Promise<ApiResponse<{ position: number }>>;
    leave(queueId: string): Promise<ApiResponse<{ id: string }>>;
    getByCustomerId(customerId: string): Promise<ApiResponse<QueueEntry[]>>;
    getAll(): Promise<ApiResponse<QueueEntry[]>>;
  };

  offers: {
    getAll(): Promise<ApiResponse<Offer[]>>;
    getByCustomerId(customerId: string): Promise<ApiResponse<Offer[]>>;
    getByDealerId(dealerId: string): Promise<ApiResponse<Offer[]>>;
    create(data: Omit<Offer, 'id' | 'createdAt'>): Promise<ApiResponse<Offer>>;
    updateStatus(id: string, status: Offer['status']): Promise<ApiResponse<Offer>>;
  };

  bookings: {
    getAll(): Promise<ApiResponse<Booking[]>>;
    create(data: { customerId: string; listingId: string; dealerId: string; notes?: string }): Promise<ApiResponse<Booking>>;
    getByCustomerId(customerId: string): Promise<ApiResponse<Booking[]>>;
    getByDealerId(dealerId: string): Promise<ApiResponse<Booking[]>>;
    updateStatus(id: string, status: Booking['status']): Promise<ApiResponse<Booking>>;
  };

  admin: {
    getStats(): Promise<ApiResponse<AdminStats>>;
  };
}
