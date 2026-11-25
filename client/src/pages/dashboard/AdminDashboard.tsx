import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, useLocation, useSearchParams } from 'react-router-dom';
import { AdminTable } from '../../components/admin/AdminTable';
import { AdminReports } from '../../components/admin/AdminReports';
import { MarketMonitoring, useMarketData } from '../../components/demand/MarketMonitoring';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { adminService } from '../../services/adminService';
import { dealerService } from '../../services/dealerService';
import { vehicleService } from '../../services/vehicleService';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency, formatDate } from '../../utils/helpers';
import type { ApiResponse, Dealer, User, VehicleListing } from '../../types';
import { adminMetrics, groupActiveQueues, listingReviewFlags, type AdminData } from '../../../../src/services/adminMetrics';
import { pricingService } from '../../../../src/services/pricingService';
import type { AuditEntry } from '../../../../src/services/auditLog';

const sections = [
  ['dashboard', 'Overview'], ['dealers', 'Dealers'], ['users', 'Customers'], ['listings', 'Listings'],
  ['queues', 'Shared queues'], ['reports', 'Reports'], ['demand', 'Demand and pricing'], ['audit', 'Audit log'],
];
const textLink = 'font-semibold text-slate-700 hover:underline';

function Status({ value }: { value: string }) {
  const variant = ['active', 'approved', 'available', 'completed'].includes(value) ? 'success'
    : ['suspended', 'cancelled', 'rejected'].includes(value) ? 'danger'
    : ['pending', 'offered', 'waiting'].includes(value) ? 'warning' : 'neutral';
  return <Badge variant={variant} className="capitalize">{value.replace(/_/g, ' ')}</Badge>;
}

function DemandPanel() {
  const monitor = useMarketData(true);
  return <MarketMonitoring monitor={monitor} />;
}

export function AdminDashboard() {
  const { pathname } = useLocation();
  const section = pathname === '/dashboard' ? 'dashboard' : pathname.split('/')[2];
  const [params, setParams] = useSearchParams();
  const actorId = useAuthStore(state => state.user?.id);
  const [data, setData] = useState<AdminData>();
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const [removal, setRemoval] = useState<VehicleListing>();
  const [reason, setReason] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([adminService.loadData(), adminService.getAuditLog()]).then(([records, log]) => {
      if (!active) return;
      if (!log.success || !log.data) throw new Error(log.error || 'Audit log is unavailable.');
      setData(records);
      setAudit(log.data);
    }).catch((failure: unknown) => {
      if (active) setError(failure instanceof Error ? failure.message : 'Administrator data is unavailable.');
    });
    return () => { active = false; };
  }, [refresh, section]);

  useEffect(() => {
    setRemoval(undefined);
    setMessage('');
    setError('');
  }, [section]);

  async function mutate(run: () => Promise<ApiResponse<unknown>>, success: string) {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const result = await run();
      if (!result.success) {
        setError(result.error || 'The action could not be completed.');
        return;
      }
      // Read the new snapshot before accepting another action against the same account or listing.
      const [records, log] = await Promise.all([adminService.loadData(), adminService.getAuditLog()]);
      setData(records);
      if (log.data) setAudit(log.data);
      else setError(log.error || 'The action succeeded. Refresh to reload the audit log.');
      setMessage(success);
      setRemoval(undefined);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'The action could not be completed.');
    } finally {
      setBusy(false);
    }
  }

  const setFilter = (name: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    if (name === 'q' || name === 'status') next.delete('detail');
    if (name === 'dealer' || name === 'flagged') setRemoval(undefined);
    setParams(next, { replace: name === 'q' });
  };

  if (!sections.some(([key]) => key === section)) return <Navigate to="/dashboard" replace />;
  const search = (params.get('q') || '').trim().toLowerCase();
  const detailId = params.get('detail');
  const now = Date.now();
  const selectedDealer = data?.dealers.find(dealer => dealer.id === detailId);
  const selectedCustomer = data?.users.find(user => user.role === 'customer' && user.id === detailId);
  const customers = data?.users.filter(user => user.role === 'customer') ?? [];

  function dealerActions(dealer: Dealer) {
    const status = dealer.status;
    const actions: { label: string; next: Dealer['status'] }[] = status === 'pending'
      ? [{ label: 'Approve', next: 'approved' }, { label: 'Reject', next: 'rejected' }]
      : status === 'approved' ? [{ label: 'Suspend', next: 'suspended' }]
      : [{ label: 'Activate', next: 'approved' }];
    return <div className="flex flex-wrap gap-2">{actions.map(action =>
      <Button key={action.label} size="sm" variant={['Reject', 'Suspend'].includes(action.label) ? 'danger' : 'secondary'}
        disabled={busy || !actorId} onClick={() => actorId && mutate(
          () => dealerService.updateStatus(dealer.id, action.next, actorId), `${dealer.dealershipName} is now ${action.next}.`
        )}>{action.label}</Button>)}</div>;
  }

  function customerAction(customer: User) {
    const next = customer.status === 'suspended' ? 'active' : 'suspended';
    return <Button size="sm" variant={next === 'suspended' ? 'danger' : 'secondary'} disabled={busy || !actorId}
      onClick={() => actorId && mutate(() => adminService.updateCustomerStatus(customer.id, next, actorId),
        `${customer.name}’s account is now ${next}.`)}>{next === 'active' ? 'Activate' : 'Suspend'}</Button>;
  }

  return <div className="mx-auto max-w-7xl space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-slate-700">BestBuy administration</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{sections.find(([key]) => key === section)?.[1]}</h1>
      </div>
      <Button size="sm" variant="secondary" disabled={busy} onClick={() => { setError(''); setRefresh(count => count + 1); }}>Refresh</Button>
    </header>
    <nav aria-label="Administration" className="flex flex-wrap gap-1 border-b border-slate-200">
      {sections.map(([key, label]) => <NavLink key={key} end to={key === 'dashboard' ? '/dashboard' : `/admin/${key}`}
        className={({ isActive }) => `border-b-2 px-3 py-2 text-sm font-semibold ${isActive ? 'border-slate-600 text-slate-700' : 'border-transparent text-slate-600 hover:text-slate-700'}`}>{label}</NavLink>)}
    </nav>
    {error && <p role="alert" className="rounded-lg bg-slate-50 p-3 text-sm text-slate-800">{error}</p>}
    {message && <p role="status" className="rounded-lg bg-slate-50 p-3 text-sm text-slate-800">{message}</p>}
    {!data && !error && <p role="status" className="text-sm text-slate-500">Loading administration data…</p>}
    {data && <>
      {section === 'dashboard' && <Overview data={data} now={now} />}
      {section === 'dealers' && <>
        <div className="flex flex-wrap items-end gap-3">
          <Input label="Search dealers" placeholder="Name, city or registration number" value={params.get('q') || ''} onChange={event => setFilter('q', event.target.value)} />
          <Filter label="Dealer status" value={params.get('status') || ''} onChange={value => setFilter('status', value)}
            options={['pending', 'approved', 'rejected', 'suspended'].map(value => [value, value])} />
        </div>
        {selectedDealer && <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">{selectedDealer.dealershipName}</h2>
              <p className="mt-1 text-sm text-slate-600">{selectedDealer.address}, {selectedDealer.city}, {selectedDealer.state} {selectedDealer.pinCode}</p>
              <p className="text-sm text-slate-600">{selectedDealer.contactPerson} · {selectedDealer.phone} · {selectedDealer.email}</p>
              <p className="text-sm text-slate-600">Registration {selectedDealer.registrationNumber} · Joined {formatDate(selectedDealer.createdAt)}</p>
              <Link className={textLink + ' mt-3 inline-block text-sm'} to={`/admin/listings?dealer=${encodeURIComponent(selectedDealer.id)}`}>
                View inventory ({data.vehicles.filter(listing => listing.dealerId === selectedDealer.id).length})
              </Link>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setFilter('detail', '')}>Close details</Button>
          </div>
        </Card>}
        <AdminTable columns={['Dealership', 'City', 'Registration', 'Status', 'Inventory', 'Actions']}
          rows={data.dealers.filter(dealer =>
            (!params.get('status') || dealer.status === params.get('status')) &&
            [dealer.dealershipName, dealer.city, dealer.registrationNumber].some(value => value.toLowerCase().includes(search))
          ).map(dealer => ({ key: dealer.id, cells: [
            <button type="button" className={textLink} onClick={() => setFilter('detail', dealer.id)}>{dealer.dealershipName}</button>,
            dealer.city, dealer.registrationNumber, <Status value={dealer.status} />,
            <Link className={textLink} to={`/admin/listings?dealer=${encodeURIComponent(dealer.id)}`}>View inventory</Link>, dealerActions(dealer),
          ] }))} />
      </>}
      {section === 'users' && <>
        <Input label="Search customers" placeholder="Name, email or phone" value={params.get('q') || ''}
          onChange={event => setFilter('q', event.target.value)} />
        {selectedCustomer && <CustomerDetails customer={selectedCustomer} data={data} audit={audit} close={() => setFilter('detail', '')} />}
        <AdminTable columns={['Customer', 'Contact', 'Registered', 'Account', 'Actions']}
          rows={customers.filter(customer => [customer.name, customer.email, customer.phoneNumber ?? '']
            .some(value => value.toLowerCase().includes(search))).map(customer => ({ key: customer.id, cells: [
              <button type="button" className={textLink} onClick={() => setFilter('detail', customer.id)}>{customer.name}</button>,
              <>{customer.email}<br />{customer.phoneNumber}</>, formatDate(customer.createdAt),
              <Status value={customer.status ?? 'active'} />, customerAction(customer),
            ] }))} />
      </>}
      {section === 'listings' && <>
        <div className="flex flex-wrap items-end gap-3">
          <Filter label="Dealer" value={params.get('dealer') || ''} onChange={value => setFilter('dealer', value)}
            options={data.dealers.map(dealer => [dealer.id, dealer.dealershipName])} />
          <label className="flex items-center gap-2 py-2 text-sm"><input type="checkbox" checked={params.has('flagged')}
            onChange={event => setFilter('flagged', event.target.checked ? '1' : '')} /> Show flagged listings</label>
        </div>
        {removal && <Card>
          <form className="space-y-3" onSubmit={event => {
            event.preventDefault();
            if (actorId && reason.trim()) void mutate(() => vehicleService.delete(removal.id, actorId, reason),
              `${removal.brand} ${removal.model} listing removed.`);
          }}>
            <h2 className="font-semibold">Remove {removal.brand} {removal.model} {removal.variant}?</h2>
            <p className="text-sm text-slate-600">This removes the listing from inventory and records your reason in the audit log.</p>
            <Input label="Reason for removal" required value={reason} onChange={event => setReason(event.target.value)} />
            <div className="flex gap-2">
              <Button type="submit" variant="danger" size="sm" disabled={busy || !reason.trim()}>Confirm removal</Button>
              <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => setRemoval(undefined)}>Cancel</Button>
            </div>
          </form>
        </Card>}
        <Listings data={data} dealer={params.get('dealer')} flagged={params.has('flagged')} busy={busy}
          remove={listing => { setRemoval(listing); setReason(''); }} />
      </>}
      {section === 'queues' && <QueueMonitoring data={data} />}
      {section === 'reports' && <AdminReports data={data} now={now} />}
      {section === 'demand' && <DemandPanel key={refresh} />}
      {section === 'audit' && <AdminTable columns={['Time', 'Action', 'Actor', 'Record ID', 'Details']}
        empty="No actions have been recorded in this demo session."
        rows={audit.map(event => ({ key: String(event.id), cells: [
          new Date(event.timestamp).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'}), event.action,
          data.users.find(user => user.id === event.actorId)?.name || data.dealers.find(dealer => dealer.id === event.actorId)?.dealershipName || event.actorId,
          event.targetId, event.detail,
        ] }))} />}
    </>}
  </div>;
}

function Filter({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: string[][];
  onChange: (value: string) => void;
}) {
  return <label className="block text-sm font-medium text-slate-700">
    {label}
    <select value={value} onChange={event => onChange(event.target.value)}
      className="mt-1 block min-w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 capitalize">
      <option value="">All</option>
      {options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
    </select>
  </label>;
}

function Overview({ data, now }: { data: AdminData; now: number }) {
  const stats = adminMetrics(data, now);
  const metrics = [
    ['Total customers', stats.totalCustomers, '/admin/users'],
    ['Registered dealers', stats.totalDealers, '/admin/dealers'],
    ['Pending dealer approvals', stats.pendingApprovals, '/admin/dealers?status=pending'],
    ['Approved dealers', stats.approvedDealers, '/admin/dealers?status=approved'],
    ['Total vehicles', stats.totalVehicles, '/admin/listings'],
    ['Active shared queues', stats.activeQueues, '/admin/queues'],
    ['Active offers', stats.activeOffers, '/admin/demand'],
    ['Total bookings', stats.totalBookings, '/admin/reports'],
    ['Completed bookings', stats.completedBookings, '/admin/reports'],
    ['Cancelled bookings', stats.cancelledBookings, '/admin/reports'],
  ] as const;
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
    {metrics.map(([label, value, to]) => <Link key={label} to={to}
      className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:bg-slate-50/40">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
    </Link>)}
  </div>;
}

function CustomerDetails({ customer, data, audit, close }: { customer: User; data: AdminData; audit: AuditEntry[]; close: () => void }) {
  const queues = data.queues.filter(entry => entry.customerId === customer.id);
  const offers = data.offers.filter(offer => offer.customerId === customer.id);
  const bookings = data.bookings.filter(booking => booking.customerId === customer.id);
  const activity = [
    { id: customer.id, name: 'Account registered', time: customer.createdAt },
    ...queues.map(entry => ({ id: entry.id, name: 'Joined shared queue', time: entry.createdAt })),
    ...offers.map(offer => ({ id: offer.id, name: `Received offer for ${offer.vehicleName}`, time: offer.createdAt })),
    ...audit.filter(event => event.action === 'Customer account status changed' && event.targetId === customer.id)
      .map(event => ({ id: `audit-${event.id}`, name: event.detail, time: event.timestamp })),
    ...bookings.flatMap(booking => (booking.statusHistory?.length ? booking.statusHistory.map((item, index) => ({
      id: `${booking.id}-${index}`, name: `Booking ${item.status.replace(/_/g, ' ')}`, time: item.timestamp,
    })) : [
      { id: booking.id, name: 'Booking created', time: booking.createdAt },
      { id: `${booking.id}-status`, name: `Booking ${booking.status.replace(/_/g, ' ')}`, time: booking.updatedAt },
    ])),
  ].filter(event => event.time).sort((a, b) => Date.parse(b.time!) - Date.parse(a.time!));
  return <section aria-label="Customer details" className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/30 p-4">
    <div className="flex flex-wrap justify-between gap-2">
      <div>
        <h2 className="text-lg font-bold">{customer.name} <Status value={customer.status ?? 'active'} /></h2>
        <p className="text-sm text-slate-600">{customer.email}{customer.phoneNumber ? ` · ${customer.phoneNumber}` : ''}</p>
      </div>
      <Button size="sm" variant="secondary" onClick={close}>Close details</Button>
    </div>
    <h3 className="text-sm font-semibold">Recent activity</h3>
    <AdminTable columns={['Activity', 'Date']} rows={activity.slice(0, 10).map(event => ({
      key: event.id, cells: [event.name, formatDate(event.time!)],
    }))} />
    <h3 className="text-sm font-semibold">Queue participation</h3>
    <AdminTable columns={['Model and variant', 'City', 'Joined', 'Status']}
      rows={queues.map(entry => {
        const listing = data.vehicles.find(item => item.vehicleModelId === entry.vehicleModelId && item.variantId === entry.variantId);
        return { key: entry.id, cells: [
          listing ? `${listing.brand} ${listing.model} ${listing.variant}`
            : [entry.vehicleModel?.make, entry.vehicleModel?.model || entry.vehicleModelId, entry.variant?.name || entry.variantId].filter(Boolean).join(' '),
          entry.city || 'City unspecified', formatDate(entry.createdAt), <Status value={entry.status} />,
        ] };
      })} />
    <h3 className="text-sm font-semibold">Booking history</h3>
    <AdminTable columns={['Vehicle', 'Dealer', 'Booking date', 'Locked price', 'Status']}
      rows={bookings.map(booking => ({ key: booking.id, cells: [
        booking.vehicleName ? `${booking.vehicleName} ${booking.variantName ?? ''}` : booking.listingId,
        data.dealers.find(dealer => dealer.id === booking.dealerId)?.dealershipName || booking.dealerId,
        formatDate(booking.bookingDate), formatCurrency(booking.lockedPrice), <Status value={booking.status} />,
      ] }))} />
  </section>;
}

function Listings({ data, dealer, flagged, busy, remove }: {
  data: AdminData;
  dealer: string | null;
  flagged: boolean;
  busy: boolean;
  remove: (listing: VehicleListing) => void;
}) {
  const flags = listingReviewFlags(data.vehicles, listing => (listing.priceHistory ?? []).some(change =>
    pricingService.percentChange(change.previousPrice, change.newPrice) >= pricingService.reviewThreshold));
  return <AdminTable columns={['Vehicle', 'Dealer', 'Price', 'Availability', 'Review', 'Actions']}
    rows={data.vehicles.filter(listing => (!dealer || listing.dealerId === dealer) && (!flagged || flags.get(listing.id)?.length))
      .map(listing => ({ key: listing.id, cells: [
        <><strong>{listing.brand} {listing.model}</strong><br />{listing.variant} · {listing.color} · {listing.year}</>,
        data.dealers.find(item => item.id === listing.dealerId)?.dealershipName || listing.dealerId,
        formatCurrency(listing.dealerOfferPrice), <><Status value={listing.availability} /> <span>{listing.quantity} units</span></>,
        <div className="flex flex-wrap gap-1">{flags.get(listing.id)?.map(flag => <Badge key={flag} variant="warning">{flag}</Badge>)}</div>,
        <Button size="sm" variant="danger" disabled={busy} onClick={() => remove(listing)}>Remove</Button>,
      ] }))} />;
}

function QueueMonitoring({ data }: { data: AdminData }) {
  const groups = groupActiveQueues(data.queues, data.vehicles);
  const cities = [...new Set(groups.map(group => group.city))];
  return <section className="space-y-4">
    <p className="text-sm text-slate-600">{groups.length} active queues. Queue size includes waiting and offered entries.</p>
    {cities.length === 0 && <Card><p className="text-sm text-slate-500">No active queues.</p></Card>}
    {cities.map(city => <section className="space-y-2" key={city}>
      <h2 className="font-semibold text-slate-900">{city}</h2>
      {groups.filter(group => group.city === city).map(group => <details key={group.key} className="rounded-xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">
          {group.brand} {group.model} · {group.variant}
          <span className="ml-3 font-normal text-slate-600">{group.entries.length} entries · {group.waiting} waiting</span>
        </summary>
        <div className="mt-3">
          <AdminTable columns={['Position', 'Customer', 'Status', 'Joined']}
            rows={group.entries.map(entry => ({ key: entry.id, cells: [
              entry.position, entry.customerName || data.users.find(user => user.id === entry.customerId)?.name || entry.customerId,
              <Status value={entry.status} />, formatDate(entry.createdAt),
            ] }))} />
        </div>
      </details>)}
    </section>)}
  </section>;
}
