import type { QueueEntry } from '../types';

export function queueAllocation(entries: QueueEntry[], request: {
  vehicleModelId: string; variantId?: string; city?: string; customerId: string;
}) {
  const city = (value?: string) => (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  const queue = entries.filter(entry => entry.vehicleModelId === request.vehicleModelId &&
    entry.variantId === (request.variantId || '') && city(entry.city) === city(request.city));
  return {
    existing: queue.find(entry => entry.customerId === request.customerId && ['waiting','offered'].includes(entry.status)),
    position: queue.reduce((maximum, entry) => Math.max(maximum, entry.position), 0) + 1,
  };
}
