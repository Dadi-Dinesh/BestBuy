import type { Booking, Dealer, Offer, QueueEntry, User, VehicleListing } from '../types';

export interface AdminData {
  users: User[];
  dealers: Dealer[];
  vehicles: VehicleListing[];
  queues: QueueEntry[];
  offers: Offer[];
  bookings: Booking[];
}

export const isActiveQueue = (queue: QueueEntry) => queue.status === 'waiting' || queue.status === 'offered';
export const isActiveOffer = (offer: Offer, now: number) => offer.status === 'pending' && Date.parse(offer.expiryDate) > now;
const normalized = (value?: string) => value?.trim().replace(/\s+/g, ' ').toLowerCase() ?? '';

export function groupActiveQueues(queues: QueueEntry[], vehicles: VehicleListing[]) {
  const groups = new Map<string, { key: string; city: string; brand: string; model: string; variant: string; entries: QueueEntry[] }>();
  for (const entry of queues.filter(isActiveQueue)) {
    const key = JSON.stringify([normalized(entry.city), entry.vehicleModelId, entry.variantId]);
    let group = groups.get(key);
    if (!group) {
      const listing = vehicles.find(item => item.vehicleModelId === entry.vehicleModelId && item.variantId === entry.variantId);
      group = {
        key, city: entry.city?.trim() || 'City unspecified',
        brand: entry.vehicleModel?.make || listing?.brand || 'Brand unspecified',
        model: entry.vehicleModel?.model || listing?.model || entry.vehicleModelId,
        variant: entry.variant?.name || listing?.variant || entry.variantId || 'All variants',
        entries: [],
      };
      groups.set(key, group);
    }
    group.entries.push(entry);
  }
  return [...groups.values()].map(group => ({
    ...group, entries: group.entries.sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt)),
    waiting: new Set(group.entries.filter(entry => entry.status === 'waiting').map(entry => entry.customerId)).size,
  })).sort((a, b) => a.city.localeCompare(b.city) || a.brand.localeCompare(b.brand) ||
    a.model.localeCompare(b.model) || a.variant.localeCompare(b.variant));
}

export function adminMetrics(data: AdminData, now = Date.now()) {
  return {
    totalCustomers: data.users.filter(user => user.role === 'customer').length,
    totalDealers: data.dealers.length,
    pendingApprovals: data.dealers.filter(dealer => dealer.status === 'pending').length,
    approvedDealers: data.dealers.filter(dealer => dealer.status === 'approved').length,
    totalVehicles: data.vehicles.length,
    activeQueues: groupActiveQueues(data.queues, data.vehicles).length,
    activeOffers: data.offers.filter(offer => isActiveOffer(offer, now)).length,
    totalBookings: data.bookings.length,
    completedBookings: data.bookings.filter(booking => booking.status === 'completed').length,
    cancelledBookings: data.bookings.filter(booking => booking.status === 'cancelled').length,
  };
}

export type AdminStats = ReturnType<typeof adminMetrics>;

export function listingReviewFlags(vehicles: VehicleListing[], priceIncreased: (listing: VehicleListing) => boolean) {
  const signature = (listing: VehicleListing) => JSON.stringify([
    listing.dealerId, listing.brand, listing.model, listing.variant, listing.color,
    listing.year, listing.condition, listing.mileage,
  ].map(value => normalized(String(value))));
  const counts = new Map<string, number>();
  for (const listing of vehicles) {
    const key = signature(listing);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return new Map(vehicles.map(listing => {
    const flags = [];
    if ((counts.get(signature(listing)) ?? 0) > 1) flags.push('Possible duplicate');
    if (!Number.isFinite(listing.dealerOfferPrice) || listing.dealerOfferPrice <= 0) flags.push('Invalid price');
    if (!Number.isInteger(listing.quantity) || listing.quantity < 0 ||
      (listing.availability === 'available' && listing.quantity === 0)) flags.push('Inconsistent inventory');
    if (priceIncreased(listing)) flags.push('Price increase flagged');
    return [listing.id, flags];
  }));
}
