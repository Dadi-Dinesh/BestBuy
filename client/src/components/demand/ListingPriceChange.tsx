import type { VehicleListing } from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';

export function ListingPriceChange({ listing }: { listing: VehicleListing }) {
  const history = listing.priceHistory;
  const change = history?.[history.length - 1];
  if (!change) return null;

  return (
    <p className="text-xs text-slate-600">
      Dealer updated the price from {formatCurrency(change.previousPrice)} to {formatCurrency(change.newPrice)} on {formatDate(change.changedAt)}.
    </p>
  );
}
