import { indiaDemo } from '../../../src/data/indiaDemo';
import { formatINR } from '../../../src/services/indiaFormat';
import { canChangeBooking } from '../../../src/services/bookingTransitions';
import { mockDealerCanTrade } from './dealerService';
import { mockAudit } from './mockAudit';
import { isMockCustomerSuspended } from './authService';
import { pricingService } from '../../../src/services/pricingService';
import { vehicleService } from './vehicleService';
import { ApiResponse, Booking, BookingStatus, VehicleListing, Dealer } from '../types';
import { notificationService } from './notificationService';

function getAPI() {
  if (typeof window !== 'undefined' && (window as unknown as { electronAPI?: unknown }).electronAPI) {
    return (window as unknown as { electronAPI: Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>> }).electronAPI;
  }
  return null;
}

let mockBookings = indiaDemo().bookings;

export const bookingService = {
  async getAll(): Promise<ApiResponse<Booking[]>> {
    const api = getAPI();
    if (api?.bookings?.getAll) {
      return api.bookings.getAll() as Promise<ApiResponse<Booking[]>>;
    }
    return { success: true, data: [...mockBookings] };
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

  async create(data: {
    customerId: string;
    customerName?: string;
    customerPhone?: string;
    listingId: string;
    dealerId: string;
    lockedPrice?: number;
    lockDurationHours?: number;
    bookingDate?: string;
    notes?: string;
    vehicleName?: string;
    variantName?: string;
    color?: string;
  }): Promise<ApiResponse<Booking>> {
    const api = getAPI();
    if (api?.bookings?.create) {
      return api.bookings.create(data) as Promise<ApiResponse<Booking>>;
    }
    if (isMockCustomerSuspended(data.customerId)) return { success: false, error: 'This customer account is suspended.' };
    if (!mockDealerCanTrade(data.dealerId)) return { success: false, error: 'This dealer is unavailable for new bookings.' };
    const { data: listing } = await vehicleService.getById(data.listingId);
    if (!listing || listing.dealerId !== data.dealerId) return { success: false, error: 'Vehicle listing not found.' };
    const lockHours = data.lockDurationHours || 72;
    const price = pricingService.current(listing);
    if (data.lockedPrice !== undefined && data.lockedPrice !== price) {
      return { success: false, error: 'The dealer price changed. Review the current listing price before booking.' };
    }
    const lockedUntil = new Date(Date.now() + lockHours * 3600000).toISOString();

    const newBooking: Booking = {
      id: `b${Date.now()}`,
      customerId: data.customerId,
      customerName: data.customerName || 'Customer',
      customerPhone: data.customerPhone || '+91 90000 12341',
      listingId: data.listingId,
      dealerId: data.dealerId,
      status: 'pending',
      bookingDate: data.bookingDate || new Date(Date.now() + 86400000 * 2).toISOString(),
      lockedPrice: price,
      lockDurationHours: lockHours,
      priceLockedUntil: lockedUntil,
      vehicleName: data.vehicleName || 'Vehicle',
      variantName: data.variantName || 'Trim',
      color: data.color || 'Standard',
      notes: data.notes,
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date().toISOString(),
          note: `Booking request initiated. Price of ${formatINR(price)} locked for ${lockHours} hours.`,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockBookings.unshift(newBooking);

    // Notify dealer of new booking
    notificationService.add({
      userId: data.dealerId,
      title: 'New Booking Request',
      message: `${newBooking.customerName} submitted a booking for ${newBooking.vehicleName}. Price locked at ${formatINR(price)}.`,
      type: 'info',
      category: 'booking',
      linkTo: '/inventory',
    });

    return { success: true, data: newBooking };
  },

  async createFromOffer(data: {
    offerId: string;
    customerId: string;
    customerName?: string;
    dealerId: string;
    listingId: string;
    vehicleName: string;
    variantName: string;
    color?: string;
    lockedPrice: number;
    lockDurationHours: number;
    notes?: string;
  }): Promise<ApiResponse<Booking>> {
    const lockedUntil = new Date(Date.now() + data.lockDurationHours * 3600000).toISOString();

    const newBooking: Booking = {
      id: `b${Date.now()}`,
      offerId: data.offerId,
      customerId: data.customerId,
      customerName: data.customerName || 'Customer',
      listingId: data.listingId,
      dealerId: data.dealerId,
      status: 'pending',
      bookingDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      lockedPrice: data.lockedPrice,
      lockDurationHours: data.lockDurationHours,
      priceLockedUntil: lockedUntil,
      vehicleName: data.vehicleName,
      variantName: data.variantName,
      color: data.color || 'Standard',
      notes: data.notes,
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date().toISOString(),
          note: `Offer accepted by customer. Price locked at ${formatINR(data.lockedPrice)} for ${data.lockDurationHours} hours.`,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockBookings.unshift(newBooking);
    return { success: true, data: newBooking };
  },

  async updateStatus(
    id: string,
    status: BookingStatus,
    note?: string
  ): Promise<ApiResponse<Booking>> {
    const api = getAPI();
    if (api?.bookings?.updateStatus) {
      return api.bookings.updateStatus(id, status) as Promise<ApiResponse<Booking>>;
    }

    const booking = mockBookings.find(b => b.id === id);
    if (!booking) return { success: false, error: 'Booking not found' };

    if (!canChangeBooking(booking.status,status)) return { success:false,error:'Invalid booking transition.' };
    if (booking.status === status) return { success:true,data:booking };
    if (status === 'confirmed') {
      mockAudit.record('Booking accepted', booking.dealerId, id, `Dealer confirmed ${booking.vehicleName || booking.listingId}`);
    }
    booking.status = status;
    booking.updatedAt = new Date().toISOString();

    if (!booking.statusHistory) booking.statusHistory = [];
    booking.statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Status transitioned to ${status.replace('_', ' ').toUpperCase()}`,
    });

    // Workflow notifications
    let title = 'Booking Status Updated';
    let message = `Your booking for ${booking.vehicleName || 'vehicle'} is now ${status.replace('_', ' ').toUpperCase()}.`;
    let type: 'info' | 'success' | 'warning' | 'error' = 'info';

    switch (status) {
      case 'confirmed':
        title = 'Booking Confirmed by Dealership!';
        message = `Your showroom booking for ${booking.vehicleName} has been officially confirmed. The locked price of ${formatINR(booking.lockedPrice)} is guaranteed.`;
        type = 'success';
        break;
      case 'payment_pending':
        title = 'Booking: Token Payment Pending';
        message = `The dealer has requested a nominal token deposit to hold the ${booking.vehicleName}. Please review payment details.`;
        type = 'warning';
        break;
      case 'booked':
        title = 'Car Successfully Booked & Reserved!';
        message = `Payment verified! Vehicle ${booking.vehicleName} is reserved for you.`;
        type = 'success';
        break;
      case 'completed':
        title = 'Car Delivery & Booking Completed!';
        message = `Congratulations! Delivery for your ${booking.vehicleName} is complete.`;
        type = 'success';
        break;
      case 'cancelled':
        title = 'Booking Cancelled';
        message = `Booking for ${booking.vehicleName} has been cancelled${note ? `: ${note}` : '.'}`;
        type = 'error';
        break;
      case 'expired':
        title = 'Price Lock & Booking Expired';
        message = `The booking lock duration for ${booking.vehicleName} has elapsed.`;
        type = 'warning';
        break;
    }

    // Notify customer
    notificationService.add({
      userId: booking.customerId,
      title,
      message,
      type,
      category: 'booking',
      linkTo: '/bookings',
    });

    return { success: true, data: booking };
  },
};
