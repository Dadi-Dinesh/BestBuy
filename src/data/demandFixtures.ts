import type { Booking, Offer, QueueEntry } from '../types';

export function demandFixtures(now = Date.now()) {
  const daysAgo = (days: number) => new Date(now - days * 86_400_000).toISOString();
  const buyers = [
    { customerId: 'demo-nora', customerName: 'Nora Chen' },
    { customerId: 'demo-isaac', customerName: 'Isaac Vega' },
    { customerId: 'demo-priya', customerName: 'Priya Shah' },
    { customerId: 'demo-maya', customerName: 'Maya Brooks' },
  ];
  const queues: QueueEntry[] = buyers.map((buyer, index) => ({
    ...buyer,
    id: `demo-queue-${index}`,
    vehicleModelId: 'vm4',
    variantId: 'vv5',
    city: 'Los Angeles',
    position: index + 1,
    status: index === 0 ? 'offered' : 'waiting',
    createdAt: daysAgo(5 - index),
  }));
  const vehicle = {
    dealerId: 'd1', listingId: 'l12', vehicleName: 'Tesla Model Y', variantName: 'Long Range AWD',
  };
  const offers: Offer[] = [
    {
      ...vehicle, ...buyers[0], id: 'demo-offer-current', queueEntryId: queues[0].id,
      dealerName: 'Premier Auto Group', offeredPrice: 47900, originalPrice: 48490,
      status: 'pending', createdAt: daysAgo(1), expiryDate: daysAgo(-4),
    },
    {
      ...vehicle, customerId: 'demo-adrian', customerName: 'Adrian Lee', id: 'demo-offer-accepted',
      dealerName: 'Premier Auto Group', offeredPrice: 47650, originalPrice: 48490,
      status: 'accepted', createdAt: daysAgo(5), expiryDate: daysAgo(2),
    },
  ];
  const bookings: Booking[] = [{
    ...vehicle, id: 'demo-booking-completed', customerId: offers[1].customerId,
    customerName: offers[1].customerName, offerId: offers[1].id, status: 'completed',
    createdAt: daysAgo(4), bookingDate: daysAgo(1), lockedPrice: offers[1].offeredPrice,
    lockDurationHours: 72, priceLockedUntil: daysAgo(1),
  }];
  return { queues, offers, bookings };
}
