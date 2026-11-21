import {
  User,
  Dealer,
  VehicleListing,
  QueueEntry,
  Booking,
  ApiResponse,
} from '../types';

export interface IDatabaseAdapter {
  readonly name: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  auth: {
    login(credentials: { email: string; password: string }): Promise<ApiResponse<{ user: User; token: string }>>;
    register(data: { name: string; email: string; password: string; role: string }): Promise<ApiResponse<{ user: User; token: string }>>;
    getUserById(id: string): Promise<ApiResponse<User>>;
  };

  vehicles: {
    getAll(filters?: Record<string, unknown>): Promise<ApiResponse<VehicleListing[]>>;
    getById(id: string): Promise<ApiResponse<VehicleListing>>;
    create(data: Record<string, unknown>): Promise<ApiResponse<VehicleListing>>;
    update(id: string, data: Record<string, unknown>): Promise<ApiResponse<VehicleListing>>;
    delete(id: string): Promise<ApiResponse<{ id: string }>>;
  };

  dealers: {
    getAll(): Promise<ApiResponse<Dealer[]>>;
    getById(id: string): Promise<ApiResponse<Dealer>>;
    update(id: string, data: Record<string, unknown>): Promise<ApiResponse<Dealer>>;
  };

  queue: {
    join(data: { vehicleModelId: string; customerId: string; variantId?: string }): Promise<ApiResponse<QueueEntry>>;
    getPosition(queueId: string): Promise<ApiResponse<{ position: number }>>;
    leave(queueId: string): Promise<ApiResponse<{ id: string }>>;
    getByCustomerId(customerId: string): Promise<ApiResponse<QueueEntry[]>>;
  };

  bookings: {
    create(data: { customerId: string; listingId: string; dealerId: string; notes?: string }): Promise<ApiResponse<Booking>>;
    getByCustomerId(customerId: string): Promise<ApiResponse<Booking[]>>;
    getByDealerId(dealerId: string): Promise<ApiResponse<Booking[]>>;
    updateStatus(id: string, status: Booking['status']): Promise<ApiResponse<Booking>>;
  };
}
