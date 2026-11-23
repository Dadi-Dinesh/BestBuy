import { z } from 'zod';
export const id = z.uuid();
const label = z.string().trim().min(1).max(200);
export const note = z.string().trim().max(3000);
export const date = z.iso.datetime({ offset: true }).or(z.iso.date());
export const money = z.number().positive().max(999999999999.99).refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.001);
export const location = z.object({ city: label, state: label, address: label, pinCode: label });
export const adminInput = z.object({ email: z.email().max(254).transform(value => value.toLowerCase()), name: label, password: z.string().min(12).max(256) });
export const authInput = z.object({ email: z.email().max(254).transform(value => value.toLowerCase()), password: z.string().min(1).max(256) });
const register = authInput.extend({ name: label, phoneNumber: label, password: z.string().min(8).max(256) });
export const signup = z.discriminatedUnion('role', [
  register.extend({ role: z.literal('customer') }),
  register.merge(location).extend({ role: z.literal('dealer'), dealershipName: label, registrationNumber: label, contactPerson: label, dealershipPhone: label }),
]);
export const availability = z.enum(['available','reserved','out_of_stock','sold']);
export const listing = z.object({
  dealerId: id, brand: label, model: label, variant: label, year: z.number().int().min(1886).max(2100),
  fuelType: z.enum(['Petrol','Diesel','Electric','Hybrid','CNG']),
  transmission: z.enum(['Manual','Automatic','CVT','DCT','Single-Speed']),
  color: label, mileage: z.number().int().nonnegative().max(10000000).default(0),
  condition: z.enum(['new','used','certified']).default('new'),
  exShowroomPrice: money, onRoadPrice: money, dealerOfferPrice: money,
  quantity: z.number().int().nonnegative().max(1000000),
  deliveryTimeline: z.enum(['Immediate','Within 7 days','Within 15 days','Within 30 days','30+ days']),
  availability: availability.default('available'), description: note.default(''),
  images: z.array(z.url({ protocol: /^https?$/ })).max(20).default([]),
});
export const prices = z.object({ dealerOfferPrice: money, exShowroomPrice: money.optional(), onRoadPrice: money.optional() });
export const locks = z.union([z.literal(24),z.literal(48),z.literal(72),z.literal(168)]);
export const queueJoin = z.object({ customerId: id, vehicleModelId: id, variantId: id, city: label, state: label.optional() });
export const createOffer = z.object({
  queueEntryId: id, customerId: id, dealerId: id, listingId: id, offeredPrice: money,
  expiryDate: date, expectedDeliveryDate: date.optional(), notes: note.optional(), terms: note.optional(),
});
export const createBooking = z.object({
  customerId: id, dealerId: id, listingId: id, notes: note.optional(), lockedPrice: money.optional(),
  bookingDate: date.optional(), lockDurationHours: locks.optional(),
});
export const bookingStatus = z.enum(['pending','confirmed','payment_pending','booked','cancelled','expired','completed']);
