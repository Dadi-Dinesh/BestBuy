import { Link } from 'react-router-dom';
import { calculateMarkets } from '../../services/demandService';
import { pricingService } from '../../../../src/services/pricingService';
import { isActiveOffer, type AdminData } from '../../../../src/services/adminMetrics';
import { formatCurrency } from '../../utils/helpers';
import { BarChart } from '../demand/MarketMonitoring';
import { AdminTable } from './AdminTable';

const percent = (part: number, total: number) => total ? Math.round(part / total * 100) : null;
const displayPercent = (value: number | null) => value === null ? '—' : `${value}%`;

export function AdminReports({ data, now }: { data: AdminData; now: number }) {
  const { dealers, users, vehicles, offers, bookings, queues } = data;
  const markets = calculateMarkets(vehicles, queues, offers, bookings, now).sort((a, b) => b.score - a.score);
  const dealerPerformance = dealers.map(dealer => {
    const dealerBookings = bookings.filter(booking => booking.dealerId === dealer.id);
    const dealerOffers = offers.filter(offer => offer.dealerId === dealer.id);
    const completed = dealerBookings.filter(booking => booking.status === 'completed').length;
    const offersWithBooking = new Set(dealerBookings.map(booking => booking.offerId));
    const converted = dealerOffers.filter(offer => offersWithBooking.has(offer.id)).length;
    return {
      dealer, completed, bookings: dealerBookings.length, offers: dealerOffers.length,
      activeOffers: dealerOffers.filter(offer => isActiveOffer(offer, now)).length,
      listings: vehicles.filter(listing => listing.dealerId === dealer.id).length,
      conversion: percent(converted, dealerOffers.length),
    };
  });
  const cityBookings = new Map<string, { total: number; completed: number; cancelled: number }>();
  for (const booking of bookings) {
    const city = booking.listing?.dealer?.city || vehicles.find(listing => listing.id === booking.listingId)?.dealer?.city ||
      booking.dealer?.city || dealers.find(dealer => dealer.id === booking.dealerId)?.city || 'City unspecified';
    const count = cityBookings.get(city) ?? { total: 0, completed: 0, cancelled: 0 };
    count.total++;
    if (booking.status === 'completed') count.completed++;
    if (booking.status === 'cancelled') count.cancelled++;
    cityBookings.set(city, count);
  }
  const registrations = new Map<string, { customers: number; dealers: number }>();
  function registerMonth(timestamp: string, type: 'customers' | 'dealers') {
    const month = timestamp.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) return;
    const row = registrations.get(month) ?? { customers: 0, dealers: 0 };
    row[type]++;
    registrations.set(month, row);
  }
  users.filter(user => user.role === 'customer').forEach(user => registerMonth(user.createdAt, 'customers'));
  dealers.forEach(dealer => registerMonth(dealer.createdAt, 'dealers'));
  const months = [...registrations.entries()].sort(([a], [b]) => a.localeCompare(b));
  const pricesByVariant = new Map<string, typeof vehicles>();
  for (const listing of vehicles) {
    const key = JSON.stringify([listing.vehicleModelId, listing.variantId]);
    const group = pricesByVariant.get(key) ?? [];
    group.push(listing);
    pricesByVariant.set(key, group);
  }
  const comparedPrices = [...pricesByVariant.entries()].filter(([, listings]) => new Set(listings.map(listing => listing.dealerId)).size > 1);
  const priceRows = comparedPrices.map(([key, listings]) => {
    const first = listings[0];
    const prices = listings.map(pricingService.current);
    return {
      key, label: `${first.brand} ${first.model} ${first.variant}`,
      dealers: new Set(listings.map(listing => listing.dealerId)).size,
      lowest: Math.min(...prices), average: pricingService.averageDealerPrice(listings)!, highest: Math.max(...prices),
    };
  });
  return <div className="space-y-7">
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Dealer performance</h2>
      <BarChart title="Bookings by dealer" points={dealerPerformance.map(row => ({ label: row.dealer.dealershipName, value: row.bookings }))} />
      <AdminTable columns={['Dealer', 'Listings', 'Active offers', 'Offers sent', 'Bookings', 'Completed', 'Offer-to-booking conversion']}
        rows={dealerPerformance.map(row => ({ key: row.dealer.id, cells: [row.dealer.dealershipName, row.listings, row.activeOffers,
          row.offers, row.bookings, row.completed, displayPercent(row.conversion)] }))} />
      <p className="text-xs text-slate-500">Conversion is the share of sent offers linked to a booking. The booking retains that link if it is cancelled later.</p>
    </section>
    <section className="space-y-3">
      <div className="flex justify-between gap-3">
        <h2 className="text-lg font-semibold">Vehicle demand</h2>
        <Link to="/admin/demand" className="text-sm font-medium text-slate-700">View demand and pricing</Link>
      </div>
      <BarChart title="Highest demand scores" maximum={100} points={markets.slice(0, 8).map(market => ({
        label: `${market.modelName} ${market.variantName} · ${market.city}`, value: market.score,
      }))} />
      <AdminTable columns={['Model and variant', 'City', 'Demand', 'Score', 'Active buyers', 'Available units']}
        rows={markets.map(market => ({ key: market.key, cells: [`${market.modelName} ${market.variantName}`,
          market.city, market.level, `${market.score}/100`, market.waiting, market.units] }))} />
    </section>
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Bookings by city</h2>
      <BarChart title="Booking totals" points={[...cityBookings].map(([label, counts]) => ({ label, value: counts.total }))} />
      <AdminTable columns={['City', 'Total bookings', 'Completed', 'Cancelled', 'Completion rate']}
        rows={[...cityBookings].map(([city, counts]) => ({
          key: city, cells: [city, counts.total, counts.completed, counts.cancelled, displayPercent(percent(counts.completed, counts.total))],
        }))} />
    </section>
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Dealer price comparison</h2>
      <p className="text-xs text-slate-500">Current prices for variants listed by multiple dealers. Each dealer has equal weight in the average.</p>
      <BarChart title="Average dealer price by variant" points={priceRows.map(row => ({ label: row.label, value: row.average }))} format={formatCurrency} />
      <AdminTable columns={['Model and variant', 'Dealers', 'Lowest', 'Average dealer price', 'Highest']}
        rows={priceRows.map(row => ({ key: row.key, cells: [row.label, row.dealers,
          formatCurrency(row.lowest), formatCurrency(row.average), formatCurrency(row.highest)],
        }))} />
    </section>
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Booking conversion</h2>
      <BarChart title="Offer-to-booking conversion by dealer" maximum={100} format={displayPercent}
        points={dealerPerformance.map(row => ({ label: row.dealer.dealershipName, value: row.conversion }))} />
    </section>
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Monthly registrations</h2>
      <BarChart title="Customer and dealer registrations" points={months.map(([label, count]) => ({ label, value: count.customers + count.dealers }))} />
      <AdminTable columns={['Month', 'Customers', 'Dealers']}
        rows={months.map(([month, counts]) => ({ key: month, cells: [month, counts.customers, counts.dealers] }))} />
    </section>
  </div>;
}
