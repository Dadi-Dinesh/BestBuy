import { indiaDemo } from '../../../src/data/indiaDemo';
import { formatINR } from '../../../src/services/indiaFormat';
import { mockDealerCanTrade } from './dealerService';
import { mockAudit } from './mockAudit';
import { isMockCustomerSuspended } from './authService';
import { pricingService } from '../../../src/services/pricingService';
import { vehicleService } from './vehicleService';
import { queueService } from './queueService';
import { ApiResponse, Offer } from '../types';
import { notificationService } from './notificationService';
import { bookingService } from './bookingService';

function getAPI() {
  if (typeof window !== 'undefined' && (window as unknown as { electronAPI?: unknown }).electronAPI) {
    return (window as unknown as { electronAPI: Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>> }).electronAPI;
  }
  return null;
}

let mockOffers = indiaDemo().offers;

export function expireMockListingOffers(listingId: string) {
  for (const offer of mockOffers) {
    if (offer.listingId === listingId && offer.status === 'pending') offer.status = 'expired';
  }
}

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

    if (!mockDealerCanTrade(data.dealerId)) return { success: false, error: 'Only approved dealers can send offers.' };
    if (isMockCustomerSuspended(data.customerId)) return { success: false, error: 'This customer account is suspended.' };
    const { data: listing } = data.listingId ? await vehicleService.getById(data.listingId) : {};
    if (!listing || listing.dealerId !== data.dealerId || !pricingService.isValid(data.offeredPrice)) {
      return { success: false, error: 'Select a dealer listing and enter a valid offer price.' };
    }
    const newOffer: Offer = {
      ...data,
      originalPrice: pricingService.current(listing),
      id: `o${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    mockOffers.unshift(newOffer);
    mockAudit.record('Offer created', newOffer.dealerId, newOffer.id, `${newOffer.vehicleName} · ${newOffer.customerId}`);

    // Trigger in-app notification for the customer
    notificationService.add({
      userId: newOffer.customerId,
      title: 'New Dealer Offer Received!',
      message: `${newOffer.dealerName || 'A dealership'} sent you an offer of ${formatINR(newOffer.offeredPrice)} for the ${newOffer.vehicleName} (${newOffer.variantName}).`,
      type: 'success',
      category: 'offer',
      linkTo: '/dashboard',
    });

    return { success: true, data: newOffer };
  },

  async acceptOffer(id: string, lockDurationHours = 72): Promise<ApiResponse<{ offer: Offer; bookingId: string }>> {
    const api = getAPI();
    if (api?.offers?.accept) {
      return api.offers.accept(id, lockDurationHours) as Promise<ApiResponse<{ offer: Offer; bookingId: string }>>;
    }
    const offer = mockOffers.find(o => o.id === id);
    if (!offer?.listingId || offer.status !== 'pending' || !(Date.parse(offer.expiryDate) > Date.now())) {
      return { success: false, error: 'This offer is no longer available.' };
    }
    if (isMockCustomerSuspended(offer.customerId)) return { success: false, error: 'This customer account is suspended.' };
    if (![24, 48, 72, 168].includes(lockDurationHours)) {
      return { success: false, error: 'Select a supported price lock duration.' };
    }
    offer.status = 'accepted';

    // 1. Create booking with locked price
    const bookingRes = await bookingService.createFromOffer({
      offerId: offer.id,
      customerId: offer.customerId,
      customerName: offer.customerName,
      dealerId: offer.dealerId,
      listingId: offer.listingId,
      vehicleName: offer.vehicleName,
      variantName: offer.variantName,
      color: offer.color,
      lockedPrice: offer.offeredPrice,
      lockDurationHours,
      notes: `Created from accepted offer ${offer.id}. Terms: ${offer.terms || 'Standard dealer terms apply.'}`,
    });

    if (!bookingRes.success || !bookingRes.data) {
      offer.status = 'pending';
      return { success: false, error: bookingRes.error || 'Could not create the price lock.' };
    }
    const bookingId = bookingRes.data.id;
    mockAudit.record('Booking accepted', offer.customerId, bookingId, `Accepted offer ${offer.id} · ${offer.vehicleName}`);
    if (offer.queueEntryId) queueService.markBooked(offer.queueEntryId);

    // 2. Notify Dealer
    notificationService.add({
      userId: offer.dealerId,
      title: 'Offer Accepted! Price Locked',
      message: `${offer.customerName || 'Customer'} accepted your offer of ${formatINR(offer.offeredPrice)} for ${offer.vehicleName}. Price is locked for ${lockDurationHours} hours.`,
      type: 'success',
      category: 'booking',
      linkTo: '/inventory',
    });

    // 3. Notify Customer
    notificationService.add({
      userId: offer.customerId,
      title: 'Offer Accepted & Price Locked!',
      message: `Your accepted price of ${formatINR(offer.offeredPrice)} with ${offer.dealerName} is locked for ${lockDurationHours} hours. Booking is Pending Confirmation.`,
      type: 'info',
      category: 'booking',
      linkTo: '/bookings',
    });

    return { success: true, data: { offer, bookingId } };
  },

  async declineOffer(id: string, reason?: string): Promise<ApiResponse<Offer>> {
    const api = getAPI();
    if (api?.offers?.updateStatus) {
      return api.offers.updateStatus(id, 'declined') as Promise<ApiResponse<Offer>>;
    }
    const offer = mockOffers.find(o => o.id === id);
    if (!offer || offer.status !== 'pending') return { success: false, error: 'This offer is no longer available.' };

    offer.status = 'declined';

    // Notify dealer
    notificationService.add({
      userId: offer.dealerId,
      title: 'Offer Declined',
      message: `Customer ${offer.customerName || ''} declined your offer of ${formatINR(offer.offeredPrice)} on ${offer.vehicleName}${reason ? `: "${reason}"` : '.'}`,
      type: 'warning',
      category: 'offer',
      linkTo: '/inventory',
    });

    return { success: true, data: offer };
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
