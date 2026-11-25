import type { BookingStatus } from '../types';

const transitions: Record<BookingStatus, BookingStatus[]> = {
  pending: ['confirmed', 'cancelled', 'expired'],
  confirmed: ['payment_pending', 'booked', 'cancelled', 'expired'],
  payment_pending: ['booked', 'cancelled', 'expired'],
  booked: ['completed', 'cancelled'],
  completed: [], cancelled: [], expired: [],
};

export function canChangeBooking(current: BookingStatus, next: BookingStatus) {
  return current === next || transitions[current].includes(next);
}
