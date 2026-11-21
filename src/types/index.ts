export type UserRole = 'customer' | 'dealer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  createdAt: string;
  avatarUrl?: string;
  dealerProfile?: Dealer;
}

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
  status: 'pending' | 'approved' | 'rejected';
  isVerified: boolean;
  createdAt: string;
}

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
  id: string;
  dealerId: string;
  vehicleModelId: string;
  variantId: string;
  price: number;
  color: string;
  mileage: number;
  condition: 'new' | 'used' | 'certified';
  availability: 'available' | 'reserved' | 'sold';
  description?: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
  dealer?: Dealer;
  vehicleModel?: VehicleModel;
  variant?: VehicleVariant;
}

export interface QueueEntry {
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
  vehicleModelId: string;
  vehicleName: string;
  variantName?: string;
  offeredPrice: number;
  originalPrice: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiryDate: string;
  createdAt: string;
  notes?: string;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  listingId: string;
  dealerId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  bookingDate: string;
  notes?: string;
  listing?: VehicleListing;
  dealer?: Dealer;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
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
