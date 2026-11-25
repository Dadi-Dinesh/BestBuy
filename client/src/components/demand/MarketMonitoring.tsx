import { useDemoMode } from '../../services/desktopMode';
import { useEffect, useState } from 'react';
import { Badge } from '../ui/Badge';
import { Card, CardHeader } from '../ui/Card';
import { activityTrends, bookingCreatedAt, calculateMarkets, cityKey, isActiveQueue, Market } from '../../services/demandService';
import { bookingService } from '../../services/bookingService';
import { offerService } from '../../services/offerService';
import { queueService } from '../../services/queueService';
import { vehicleService } from '../../services/vehicleService';
import { pricingService } from '../../../../src/services/pricingService';
import { formatCurrency, formatDate } from '../../utils/helpers';

async function loadMarketData(includePriceChanges: boolean) {
  const [vehicles, queues, offers, bookings, priceChanges] = await Promise.all([
    vehicleService.getAll(), queueService.getAll(), offerService.getAll(), bookingService.getAll(),
    includePriceChanges ? vehicleService.getPriceChanges() : Promise.resolve({ data: [] }),
  ]);
  if (!vehicles.data || !queues.data || !offers.data || !bookings.data || !priceChanges.data) {
    throw new Error('Market data is temporarily unavailable.');
  }
  return { vehicles: vehicles.data, queues: queues.data, offers: offers.data, bookings: bookings.data, priceChanges: priceChanges.data };
}

export function useMarketData(includePriceChanges = false) {
  const [data, setData] = useState<Awaited<ReturnType<typeof loadMarketData>>>();
  const [error, setError] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  useEffect(() => {
    let active = true;
    setError(false);
    loadMarketData(includePriceChanges).then(
      result => { if (active) setData(result); },
      () => { if (active) setError(true); },
    );
    return () => { active = false; };
  }, [refreshCount, includePriceChanges]);
  const now = Date.now();
  const markets = data ? calculateMarkets(data.vehicles, data.queues, data.offers, data.bookings, now) : [];
  return { data, error, markets, now, refresh: () => setRefreshCount(count => count + 1) };
}

export function DemandBadge({ market }: { market: Market }) {
  return <Badge variant={market.level === 'High Demand' ? 'danger' : market.level === 'Medium Demand' ? 'warning' : 'neutral'}>{market.level}</Badge>;
}

interface ChartPoint {
  label: string;
  value: number | null;
}

export function BarChart({ title, points, format = String, maximum }: {
  title: string;
  points: ChartPoint[];
  format?: (value: number) => string;
  maximum?: number;
}) {
  const scale = maximum ?? Math.max(1, ...points.map(point => point.value ?? 0));
  return (
    <Card>
      <CardHeader title={title} />
      {points.length === 0 && <p className="text-sm text-slate-500">No records.</p>}
      <ul className="mt-3 space-y-2">
        {points.map(({ label, value }) => (
          <li key={label} className="grid grid-cols-[minmax(7rem,1fr)_1fr_auto] items-center gap-2 text-xs text-slate-700">
            <span>{label}</span>
            <div aria-hidden="true" className="h-2 rounded bg-slate-100">
              <div className="h-2 rounded bg-slate-600" style={{ width: `${(value ?? 0) / scale * 100}%` }} />
            </div>
            <span className="tabular-nums">{value === null ? 'No offers' : format(value)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function groupDemand(markets: Market[], group: (market: Market) => string) {
  const groups = new Map<string, number[]>();
  for (const market of markets) {
    const label = group(market);
    const scores = groups.get(label) ?? [];
    scores.push(market.score);
    groups.set(label, scores);
  }
  return Array.from(groups, ([label, scores]) => ({
    label, value: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
  })).sort((a, b) => b.value - a.value);
}

export function MarketMonitoring({ monitor, dealerId }: { monitor: ReturnType<typeof useMarketData>; dealerId?: string }) {
  const demo = useDemoMode();
  const [selectedMarket, setSelectedMarket] = useState('');
  const [reviewOnly, setReviewOnly] = useState(false);
  const { data, error, markets, now, refresh } = monitor;
  const scope = (dealerId ? markets.filter(market => market.listings.some(listing => listing.dealerId === dealerId)) : markets)
    .sort((a, b) => b.score - a.score);
  const selected = scope.find(market => market.key === selectedMarket);
  const trends = activityTrends(
    selected?.queue ?? data?.queues ?? [], selected?.marketOffers ?? data?.offers ?? [],
    selected?.marketBookings ?? data?.bookings ?? [], now,
  );
  const audit = [
    ...(data?.priceChanges ?? []).map(change => ({
      ...change, id: change.listingId, dealer: change.dealerName,
      vehicle: change.vehicleName, action: 'Listing price revised',
    })),
    ...(data?.offers ?? []).map(offer => ({
      id: offer.id, dealer: offer.dealerName ?? offer.dealerId, vehicle: `${offer.vehicleName} ${offer.variantName}`,
      previousPrice: offer.originalPrice, newPrice: offer.offeredPrice, changedAt: offer.createdAt, action: 'Direct offer sent',
    })),
  ].map(event => ({ ...event, percent: pricingService.percentChange(event.previousPrice, event.newPrice) }))
    .filter(event => !reviewOnly || event.percent >= pricingService.reviewThreshold)
    .sort((a, b) => Date.parse(b.changedAt) - Date.parse(a.changedAt));
  const activeBuyers = new Set((data?.queues ?? []).filter(isActiveQueue).map(queue => queue.customerId)).size;
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Demand and pricing</h2>
          <p className="text-sm text-slate-500">BestBuy {demo ? 'demo' : 'marketplace'} activity. Scores use active buyers, active offers, stock, completed bookings and booking activity in the last seven days.</p>
        </div>
        <button type="button" className="text-sm font-semibold text-slate-700" onClick={refresh}>Refresh data</button>
      </div>
      {error && <p role="alert" className="text-sm text-slate-700">Market data could not be refreshed.</p>}
      {!data ? <p className="text-sm text-slate-500">{error ? 'Try refreshing the data.' : 'Loading market data…'}</p> : <>
        <Card>
          <CardHeader title={dealerId ? 'Demand for your inventory' : 'Vehicle demand by city'} />
          {!scope.length && <p className="text-sm text-slate-500">No matching vehicle listings.</p>}
          {!!scope.length && <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500">
                <tr>{['Model and variant', 'City', 'Demand', 'Active customers', 'Active offers', 'Stock', 'Completed', 'Bookings in 7 days'].map(label => <th key={label} scope="col" className="p-2">{label}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scope.map(market => <tr key={market.key}>
                  <th scope="row" className="p-2 font-semibold">{market.modelName} {market.variantName}</th>
                  <td className="p-2">{market.city}</td>
                  <td className="p-2 whitespace-nowrap"><DemandBadge market={market} /> <span className="text-xs text-slate-500">{market.score}/100</span></td>
                  <td className="p-2">{market.waiting}</td><td className="p-2">{market.activeOffers}</td><td className="p-2">{market.units}</td>
                  <td className="p-2">{market.completed}</td><td className="p-2">{market.recent}</td>
                </tr>)}
              </tbody>
            </table>
          </div>}
        </Card>
        {!dealerId && <div className="grid gap-4 lg:grid-cols-2">
          <BarChart title="Demand by car model · average score" points={groupDemand(scope, market => market.modelName)} maximum={100} />
          <BarChart title="Demand by variant · average score" points={groupDemand(scope, market => `${market.modelName} ${market.variantName}`)} maximum={100} />
          <BarChart title="Demand by city · average score" points={groupDemand(scope, market => market.city)} maximum={100} />
          <BarChart title={`Customers waiting or offered · ${activeBuyers} unique buyers`} points={
            Array.from(new Set(data.queues.filter(isActiveQueue).map(queue => cityKey(queue.city)))).map(city => ({
              label: data.queues.find(queue => cityKey(queue.city) === city)?.city?.trim() || 'City unspecified',
              value: new Set(data.queues.filter(queue => isActiveQueue(queue) && cityKey(queue.city) === city).map(queue => queue.customerId)).size,
            }))
          } />
        </div>}
        <label className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
          {dealerId ? 'Demand trends for' : 'Trends for'}
          <select className="rounded-lg border border-slate-200 bg-white p-2" value={selected?.key ?? ''} onChange={event => setSelectedMarket(event.target.value)}>
            {!dealerId && <option value="">All marketplace activity</option>}
            {dealerId && <option value="" disabled>Select a model, variant and city</option>}
            {scope.map(market => <option key={market.key} value={market.key}>{market.modelName} {market.variantName} · {market.city}</option>)}
          </select>
        </label>
        {(!dealerId || selected) && <div className="grid gap-4 lg:grid-cols-2">
          <BarChart title="Queue joins · last 7 days (IST)" points={trends.map(point => ({ label: point.label, value: point.joined }))} />
          <BarChart title="Bookings created · last 7 days (IST)" points={trends.map(point => ({ label: point.label, value: point.bookings }))} />
          {!dealerId && <>
            <BarChart title="Average direct offer price · last 7 days (IST)" points={trends.map(point => ({ label: point.label, value: point.averageOffer }))} format={formatCurrency} />
            <BarChart title="Average current dealer price by city" points={
              Array.from(new Set((selected ? [selected] : scope).map(market => market.city)), city => ({
                label: city,
                value: pricingService.averageDealerPrice((selected ? [selected] : scope).filter(market => market.city === city).flatMap(market => market.listings)),
              }))
            } format={formatCurrency} />
          </>}
        </div>}
        {!dealerId && <Card>
          <CardHeader title="Recent booking activity" />
          <ul className="mt-3 divide-y divide-slate-100">
            {[...(selected?.marketBookings ?? data.bookings)]
              .filter(booking => bookingCreatedAt(booking))
              .sort((a, b) => Date.parse(bookingCreatedAt(b)!) - Date.parse(bookingCreatedAt(a)!))
              .slice(0, 10)
              .map(booking => <li key={booking.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                <span>{booking.vehicleName} {booking.variantName} · {booking.customerName || booking.customerId}</span>
                <span>{formatDate(bookingCreatedAt(booking)!)} · <Badge variant="neutral">{booking.status.replace('_', ' ')}</Badge></span>
              </li>)}
          </ul>
        </Card>}
        {!dealerId && <Card>
          <CardHeader title="Dealer pricing activity" subtitle={`Review flagged increases of ${pricingService.reviewThreshold}% or more.`} />
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={reviewOnly} onChange={event => setReviewOnly(event.target.checked)} />
            Show only flagged increases
          </label>
          {!audit.length && <p className="mt-2 text-sm text-slate-500">{reviewOnly ? 'No flagged price increases.' : 'No dealer pricing activity recorded.'}</p>}
          <ul className="mt-3 divide-y divide-slate-100">
            {audit.map((event, index) => {
              const change = event.percent;
              return <li key={`${event.id}-${index}`} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span><strong>{event.dealer}</strong> · {event.vehicle}<br /><span className="text-xs text-slate-500">{event.action} · {formatDate(event.changedAt)}</span></span>
                <span>{formatCurrency(event.previousPrice)} → {formatCurrency(event.newPrice)} {change >= pricingService.reviewThreshold && <Badge variant="warning">Review +{change.toFixed(1)}%</Badge>}</span>
              </li>;
            })}
          </ul>
        </Card>}
      </>}
    </section>
  );
}
