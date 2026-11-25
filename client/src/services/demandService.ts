import { istDate } from '../../../src/services/indiaFormat';
import { Booking, Offer, QueueEntry, VehicleListing } from '../types';
import { pricingService } from '../../../src/services/pricingService';

export const dayMs = 86_400_000;
export const cityKey = (city?: string) => city?.trim().toLowerCase() || '';
export const marketKey = (modelId: string, variantId: string, city?: string) =>
  JSON.stringify([modelId, variantId, cityKey(city)]);
export const isActiveQueue = (queue: QueueEntry) => queue.status === 'waiting' || queue.status === 'offered';

const isCompleted = (booking: Booking) => booking.status === 'completed';
const isBookingActivity = (booking: Booking) => !['cancelled', 'expired'].includes(booking.status);
export const bookingCreatedAt = (booking: Booking) => booking.createdAt ?? booking.statusHistory?.[0]?.timestamp;
const eventTime = (value?: string) => value ? Date.parse(value) : NaN;

export function demandScore(waiting: number, offers: number, units: number, completed: number, recent: number) {
  return Math.max(0, Math.min(100, waiting * 16 + offers * 8 - units * 10 + completed * 3 + recent * 10));
}

export function demandLevel(score: number) {
  if (score >= 51) return 'High Demand';
  if (score >= 20) return 'Medium Demand';
  return 'Low Demand';
}

export function calculateMarkets(vehicles: VehicleListing[], queues: QueueEntry[], offers: Offer[], bookings: Booking[], now = Date.now()) {
  const groups = new Map<string, VehicleListing[]>();
  for (const listing of vehicles) {
    const key = marketKey(listing.vehicleModelId, listing.variantId, listing.dealer?.city);
    const group = groups.get(key) ?? [];
    group.push(listing);
    groups.set(key, group);
  }

  return Array.from(groups, ([key, listings]) => {
    const first = listings[0];
    const city = first.dealer?.city?.trim();
    const listingIds = new Set(listings.map(listing => listing.id));
    const queue = queues.filter(entry => entry.city && city &&
      marketKey(entry.vehicleModelId, entry.variantId, entry.city) === key);
    const waiting = new Set(queue.filter(isActiveQueue).map(entry => entry.customerId)).size;
    const marketOffers = offers.filter(offer => offer.listingId && listingIds.has(offer.listingId));
    const activeOffers = marketOffers.filter(offer => offer.status === 'pending' && eventTime(offer.expiryDate) > now).length;
    const units = listings.reduce((sum, listing) => sum + (listing.availability === 'available' ? listing.quantity : 0), 0);
    const marketBookings = bookings.filter(booking => listingIds.has(booking.listingId));
    const completed = marketBookings.filter(isCompleted).length;
    const recent = marketBookings.filter(booking => {
      const time = eventTime(bookingCreatedAt(booking));
      return isBookingActivity(booking) && time > now - 7 * dayMs && time <= now;
    }).length;
    const score = demandScore(waiting, activeOffers, units, completed, recent);

    return {
      key, listings, queue, marketOffers, marketBookings, waiting, activeOffers, units, completed, recent, score,
      model: first.vehicleModelId, variant: first.variantId, modelName: `${first.brand} ${first.model}`,
      variantName: first.variant, city: city || 'City unspecified', level: demandLevel(score),
    };
  });
}

export type Market = ReturnType<typeof calculateMarkets>[number];

export function activityTrends(queues: QueueEntry[], offers: Offer[], bookings: Booking[], now = Date.now()) {
  const end = new Date(`${istDate(new Date(now))}T00:00:00+05:30`);
  return Array.from({ length: 7 }, (_, index) => {
    const start = end.getTime() - (6 - index) * dayMs;
    const inDay = (date?: string) => {
      const time = eventTime(date);
      return time >= start && time < start + dayMs && time <= now;
    };
    return {
      label: istDate(new Date(start)),
      joined: queues.filter(queue => inDay(queue.createdAt)).length,
      bookings: bookings.filter(booking => inDay(bookingCreatedAt(booking))).length,
      averageOffer: pricingService.average(offers.filter(offer => inDay(offer.createdAt)).map(offer => offer.offeredPrice)),
    };
  });
}
