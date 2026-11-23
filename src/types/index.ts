import type { PriceChange } from '../services/pricingService';

export type UserRole = 'customer' | 'dealer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  status?: CustomerAccountStatus;
  createdAt: string;
  avatarUrl?: string;
  dealerProfile?: Dealer;
}

export type CustomerAccountStatus = 'active' | 'suspended';
export type DealerVerificationStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface Dealer {
  id: string;
  userId: string;
  dealershipName: string;
  registrationNumber: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  logoUrl?: string;
  status: DealerVerificationStatus;
  isVerified: boolean;
  createdAt: string;
}

export type FuelType = 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid' | 'CNG';
export type TransmissionType = 'Manual' | 'Automatic' | 'CVT' | 'DCT' | 'Single-Speed';
export type DeliveryTimeline = 'Immediate' | 'Within 7 days' | 'Within 15 days' | 'Within 30 days' | '30+ days';
export type VehicleAvailabilityStatus = 'available' | 'reserved' | 'out_of_stock' | 'sold';

export interface VehicleVariant {
  id: string;
  name: string;
  trimLevel: string;
  engineType: string;
  transmission: string;
  fuelType: string;
  seatingCapacity: number;
  features: string[];
}

export interface VehicleModel {
  id: string;
  make: string;
  model: string;
  year: number;
  category: string;
  imageUrl?: string;
  variants: VehicleVariant[];
}

export interface VehicleListing {
  priceHistory?: PriceChange[];
  id: string;
  dealerId: string;
  vehicleModelId: string;
  variantId: string;

  // Manufacturer and specs
  brand: string;
  model: string;
  variant: string;
  year: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  color: string;
  mileage: number;
  condition: 'new' | 'used' | 'certified';

  // Pricing
  price: number; // primary effective price (dealer offer price)
  exShowroomPrice: number;
  onRoadPrice: number;
  dealerOfferPrice: number;

  // Inventory & Delivery
  quantity: number;
  deliveryTimeline: DeliveryTimeline;
  availability: VehicleAvailabilityStatus;

  // Details & Media
  description: string;
  images: string[];

  createdAt: string;
  updatedAt: string;

  dealer?: Dealer;
  vehicleModel?: VehicleModel;
  variantDetails?: VehicleVariant;
}

export interface CreateVehicleListingData {
  dealerId: string;
  vehicleModelId?: string;
  variantId?: string;
  brand: string;
  model: string;
  variant: string;
  year: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  color: string;
  mileage?: number;
  condition?: 'new' | 'used' | 'certified';
  exShowroomPrice: number;
  onRoadPrice: number;
  dealerOfferPrice: number;
  quantity: number;
  deliveryTimeline: DeliveryTimeline;
  availability?: VehicleAvailabilityStatus;
  description?: string;
  images?: string[];
}

export interface UpdateVehicleListingData extends Partial<CreateVehicleListingData> {
  price?: number;
}

export interface QueueEntry {
  city?: string;
  id: string;
  vehicleModelId: string;
  variantId: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  position: number;
  status: 'waiting' | 'offered' | 'booked' | 'cancelled';
  offeredListingId?: string;
  createdAt: string;
  vehicleModel?: VehicleModel;
  variant?: VehicleVariant;
}

export interface Offer {
  id: string;
  queueEntryId?: string;
  customerId: string;
  customerName?: string;
  dealerId: string;
  dealerName?: string;
  listingId?: string;
  vehicleModelId?: string;
  vehicleName: string;
  variantName: string;
  color?: string;
  availability?: string;
  expectedDeliveryDate?: string;
  offeredPrice: number;
  originalPrice: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiryDate: string;
  createdAt: string;
  notes?: string;
  terms?: string;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'payment_pending'
  | 'booked'
  | 'cancelled'
  | 'expired'
  | 'completed';

export interface BookingStatusHistoryItem {
  status: BookingStatus;
  timestamp: string;
  note?: string;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  listingId: string;
  dealerId: string;
  offerId?: string;
  status: BookingStatus;
  bookingDate: string;
  lockedPrice: number;
  lockDurationHours: number;
  priceLockedUntil: string;
  vehicleName?: string;
  variantName?: string;
  color?: string;
  notes?: string;
  statusHistory?: BookingStatusHistoryItem[];
  createdAt?: string;
  updatedAt?: string;
  listing?: VehicleListing;
  dealer?: Dealer;
}

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category?: 'offer' | 'booking' | 'queue' | 'system';
  linkTo?: string;
  isRead: boolean;
  createdAt: string;
}

export interface CustomerRegisterData {
  role: 'customer';
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface DealerRegisterData {
  role: 'dealer';
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  dealershipName: string;
  registrationNumber: string;
  contactPerson: string;
  dealershipPhone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
}

export type RegisterData = CustomerRegisterData | DealerRegisterData;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
