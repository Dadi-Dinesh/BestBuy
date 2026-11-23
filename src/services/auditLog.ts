import { pricingService } from './pricingService';
import type { VehicleListing } from '../types';

export type AuditAction =
  | 'Dealer status changed'
  | 'Customer account status changed'
  | 'Listing created'
  | 'Listing updated'
  | 'Listing removed'
  | 'Price updated'
  | 'Offer created'
  | 'Booking accepted';

export interface AuditEntry {
  id: number;
  action: AuditAction;
  actorId: string;
  targetId: string;
  detail: string;
  timestamp: string;
}

export function createAuditLog() {
  const entries: AuditEntry[] = [];
  return {
    record(action: AuditAction, actorId: string, targetId: string, detail: string) {
      entries.unshift({ id: entries.length + 1, action, actorId, targetId, detail, timestamp: new Date().toISOString() });
    },
    list() {
      return [...entries];
    },
  };
}

export function recordPriceUpdate(audit: ReturnType<typeof createAuditLog>, before: VehicleListing, after: VehicleListing) {
  const previous = pricingService.current(before);
  const next = pricingService.current(after);
  const changes = [
    previous !== next && `Dealer price ${previous} → ${next} USD`,
    before.exShowroomPrice !== after.exShowroomPrice && `Ex-showroom ${before.exShowroomPrice} → ${after.exShowroomPrice} USD`,
    before.onRoadPrice !== after.onRoadPrice && `On-road ${before.onRoadPrice} → ${after.onRoadPrice} USD`,
  ].filter(Boolean);
  if (changes.length) audit.record('Price updated', after.dealerId, after.id, changes.join(' · '));
}
