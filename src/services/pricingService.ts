export interface PriceChange {
  previousPrice: number;
  newPrice: number;
  changedAt: string;
}

export interface ListingPriceChange extends PriceChange {
  listingId: string;
  dealerName: string;
  vehicleName: string;
}

interface ListingPricing {
  price: number;
  dealerOfferPrice: number;
  priceHistory?: PriceChange[];
}

export const pricingService = {
  current(listing: ListingPricing) {
    return listing.dealerOfferPrice ?? listing.price;
  },

  isValid(price: number) {
    return Number.isFinite(price) && price > 0;
  },

  revise(listing: ListingPricing, newPrice: number, changedAt: string) {
    const previousPrice = this.current(listing);
    const priceHistory = listing.priceHistory ?? [];
    return {
      price: newPrice,
      dealerOfferPrice: newPrice,
      priceHistory: newPrice === previousPrice
        ? priceHistory
        : [...priceHistory, { previousPrice, newPrice, changedAt }],
    };
  },

  average(prices: number[]) {
    return prices.length ? Math.round(prices.reduce((total, price) => total + price, 0) / prices.length) : null;
  },

  averageDealerPrice(listings: (ListingPricing & { dealerId: string })[]) {
    const byDealer = new Map<string, number[]>();
    for (const listing of listings) {
      const prices = byDealer.get(listing.dealerId) ?? [];
      prices.push(this.current(listing));
      byDealer.set(listing.dealerId, prices);
    }
    return this.average(Array.from(byDealer.values(), prices => this.average(prices)!));
  },

  listingChanges(listing: ListingPricing & {
    id: string; dealerId: string; dealer?: { dealershipName: string }; brand: string; model: string; variant: string;
  }): ListingPriceChange[] {
    return (listing.priceHistory ?? []).map(change => ({
      ...change,
      listingId: listing.id,
      dealerName: listing.dealer?.dealershipName ?? listing.dealerId,
      vehicleName: `${listing.brand} ${listing.model} ${listing.variant}`,
    }));
  },

  percentChange(previous: number, next: number) {
    return this.isValid(previous) ? (next - previous) / previous * 100 : 0;
  },

  reviewThreshold: 10,
};
