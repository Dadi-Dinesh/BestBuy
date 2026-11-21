import React, { useState, useEffect } from 'react';
import {
  Car,
  Search,
  ClipboardList,
  Tag,
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { vehicleService } from '../../services/vehicleService';
import { queueService } from '../../services/queueService';
import { offerService } from '../../services/offerService';
import { bookingService } from '../../services/bookingService';
import { VehicleListing, QueueEntry, Offer, Booking } from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMake, setSelectedMake] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'vehicles' | 'comparison' | 'queues' | 'offers' | 'bookings'>('vehicles');

  const [vehicles, setVehicles] = useState<VehicleListing[]>([]);
  const [queues, setQueues] = useState<QueueEntry[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Status feedback
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [vRes, qRes, oRes, bRes] = await Promise.all([
          vehicleService.getAll(),
          user ? queueService.getByCustomerId(user.id) : queueService.getAll(),
          user ? offerService.getByCustomerId(user.id) : offerService.getAll(),
          user ? bookingService.getByCustomerId(user.id) : bookingService.getAll(),
        ]);

        if (vRes.success && vRes.data) setVehicles(vRes.data);
        if (qRes.success && qRes.data) setQueues(qRes.data);
        if (oRes.success && oRes.data) setOffers(oRes.data);
        if (bRes.success && bRes.data) setBookings(bRes.data);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Handle Offer Response
  const handleOfferResponse = async (offerId: string, status: 'accepted' | 'declined') => {
    const res = await offerService.updateStatus(offerId, status);
    if (res.success) {
      setOffers(prev => prev.map(o => (o.id === offerId ? { ...o, status } : o)));
      setActionMessage(`Offer has been marked as ${status}.`);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  // Handle Leave Queue
  const handleLeaveQueue = async (queueId: string) => {
    const res = await queueService.leave(queueId);
    if (res.success) {
      setQueues(prev => prev.filter(q => q.id !== queueId));
      setActionMessage('You have left the waitlist queue.');
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  // Filter vehicles
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch =
      v.vehicleModel?.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vehicleModel?.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.dealer?.dealershipName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMake = selectedMake === 'all' || v.vehicleModel?.make === selectedMake;

    return matchesSearch && matchesMake;
  });

  // Price comparison groupings (models with listings from > 1 dealer or listings for same model)
  const comparisonGroups = vehicles.reduce((acc, curr) => {
    const key = `${curr.vehicleModel?.make} ${curr.vehicleModel?.model}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(curr);
    return acc;
  }, {} as Record<string, VehicleListing[]>);

  const makes = ['all', ...Array.from(new Set(vehicles.map(v => v.vehicleModel?.make).filter(Boolean)))];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back, {user?.name?.split(' ')[0] || 'Customer'}
            </h1>
            <Badge variant="default" size="sm">Buyer Portal</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare multi-dealer prices, manage queue spots, review dealer offers, and track your bookings.
          </p>
        </div>

        {actionMessage && (
          <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-lg flex items-center gap-2">
            <CheckCircle2 size={14} />
            <span>{actionMessage}</span>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Car size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Available Inventory</p>
              <p className="text-xl font-bold text-slate-900">{vehicles.length} Vehicles</p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <ClipboardList size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Active Queue Spots</p>
              <p className="text-xl font-bold text-slate-900">
                {queues.filter(q => q.status === 'waiting' || q.status === 'offered').length}
              </p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Tag size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Special Dealer Offers</p>
              <p className="text-xl font-bold text-slate-900">
                {offers.filter(o => o.status === 'pending').length} Pending
              </p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Active Bookings</p>
              <p className="text-xl font-bold text-slate-900">{bookings.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'vehicles'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search size={15} />
          Browse Inventory ({vehicles.length})
        </button>

        <button
          onClick={() => setActiveTab('comparison')}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'comparison'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingDown size={15} />
          Price Comparison
        </button>

        <button
          onClick={() => setActiveTab('queues')}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'queues'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList size={15} />
          My Queues ({queues.length})
        </button>

        <button
          onClick={() => setActiveTab('offers')}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'offers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag size={15} />
          Received Offers ({offers.length})
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'bookings'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar size={15} />
          My Bookings ({bookings.length})
        </button>
      </div>

      {/* TAB 1: BROWSE INVENTORY */}
      {activeTab === 'vehicles' && (
        <div className="space-y-4">
          {/* Search & Filter toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search by make, model, color, or dealership..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                leftElement={<Search size={16} />}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Make:</span>
              <div className="flex gap-1.5 overflow-x-auto">
                {makes.map(m => (
                  <button
                    key={m}
                    onClick={() => setSelectedMake(m as string)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      selectedMake === m
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Vehicle Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVehicles.map(v => (
              <Card key={v.id} padding="none" className="overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                        {v.vehicleModel?.category || 'Automobile'} • {v.vehicleModel?.year}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                        {v.vehicleModel?.make} {v.vehicleModel?.model}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">{v.variant?.name || 'Standard Edition'}</p>
                    </div>
                    <Badge variant={v.availability === 'available' ? 'success' : 'neutral'}>
                      {v.availability}
                    </Badge>
                  </div>

                  <div className="my-3 py-3 border-y border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Exterior Color</span>
                      <span className="font-medium text-slate-800">{v.color}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Condition</span>
                      <span className="font-medium text-slate-800 capitalize">{v.condition} ({v.mileage} mi)</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px]">Dealership Location</span>
                      <span className="font-medium text-slate-800 flex items-center gap-1.5">
                        <Building2 size={13} className="text-slate-400" />
                        {v.dealer?.dealershipName} • {v.dealer?.city}, {v.dealer?.state}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                    {v.description || 'Premium dealer inventory with verified mechanical inspection.'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Dealer Price</span>
                    <span className="text-lg font-bold text-slate-900">{formatCurrency(v.price)}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (v.vehicleModelId && user) {
                        queueService.join({ vehicleModelId: v.vehicleModelId, customerId: user.id });
                        setActionMessage(`Joined queue for ${v.vehicleModel?.make} ${v.vehicleModel?.model}!`);
                        setTimeout(() => setActionMessage(null), 3000);
                      }
                    }}
                    rightIcon={<ArrowRight size={14} />}
                  >
                    Join Queue
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PRICE COMPARISON */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center gap-3">
            <Sparkles size={20} className="text-blue-600 flex-shrink-0" />
            <p className="text-xs text-blue-900 leading-relaxed">
              <strong>Multi-Dealer Price Comparison:</strong> Dealers provide competitive pricing on the same car models. Compare prices side-by-side to ensure you get the best deal across all verified dealerships.
            </p>
          </div>

          <div className="space-y-6">
            {Object.entries(comparisonGroups).map(([modelName, groupListings]) => {
              const lowestPrice = Math.min(...groupListings.map(l => l.price));

              return (
                <Card key={modelName} padding="md" className="border-slate-200">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{modelName}</h3>
                      <p className="text-xs text-slate-500">
                        {groupListings.length} {groupListings.length === 1 ? 'dealership offer' : 'dealership offers available'}
                      </p>
                    </div>
                    <Badge variant="default" size="sm">
                      Best Price: {formatCurrency(lowestPrice)}
                    </Badge>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {groupListings.map(item => {
                      const isBestPrice = item.price === lowestPrice;
                      const priceDiff = item.price - lowestPrice;

                      return (
                        <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                              <Building2 size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {item.dealer?.dealershipName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {item.dealer?.city}, {item.dealer?.state} • Variant: {item.variant?.name || 'Base'} • Color: {item.color}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-base font-bold text-slate-900">{formatCurrency(item.price)}</p>
                              {isBestPrice ? (
                                <span className="text-[11px] font-semibold text-emerald-600 flex items-center justify-end gap-1">
                                  <CheckCircle2 size={12} /> Lowest Dealer Price
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400">
                                  +{formatCurrency(priceDiff)} diff
                                </span>
                              )}
                            </div>

                            <Button
                              size="sm"
                              variant={isBestPrice ? 'primary' : 'secondary'}
                              onClick={() => {
                                if (user) {
                                  bookingService.create({
                                    customerId: user.id,
                                    dealerId: item.dealerId,
                                    listingId: item.id,
                                    notes: `Price comparison booking for ${modelName}`,
                                  });
                                  setActionMessage(`Booking request submitted to ${item.dealer?.dealershipName}!`);
                                  setTimeout(() => setActionMessage(null), 3000);
                                }
                              }}
                            >
                              Book Now
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVE QUEUES */}
      {activeTab === 'queues' && (
        <Card padding="none">
          <div className="p-5 border-b border-slate-100">
            <CardHeader
              title="Vehicle Waitlist Queues"
              subtitle="Your active queue positions for high-demand models. Dealers make offers directly to top-ranked queue members."
            />
          </div>

          {queues.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              You are not currently in any vehicle waitlist queue.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {queues.map(q => (
                <div key={q.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center text-blue-700">
                      <span className="text-[10px] font-semibold uppercase">Pos</span>
                      <span className="text-lg font-bold leading-none">#{q.position}</span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        {q.vehicleModel?.make} {q.vehicleModel?.model}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Variant: {q.variant?.name || 'All variants'} • Joined {formatDate(q.createdAt)}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant={q.status === 'offered' ? 'warning' : 'default'} size="sm">
                          {q.status === 'offered' ? 'Offer Received!' : 'Waiting in Queue'}
                        </Badge>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock size={12} /> Priority queue active
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {q.status === 'offered' && (
                      <Button size="sm" onClick={() => setActiveTab('offers')}>
                        View Offer
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleLeaveQueue(q.id)}
                    >
                      Leave Queue
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: OFFERS */}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          <div className="p-5 bg-white border border-slate-200 rounded-xl">
            <h3 className="text-base font-bold text-slate-900">Dealer Offers</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalized pricing and incentives sent to you by certified dealerships.
            </p>
          </div>

          {offers.length === 0 ? (
            <Card padding="lg" className="text-center text-slate-400 text-sm">
              No current dealer offers available.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers.map(offer => {
                const discount = offer.originalPrice - offer.offeredPrice;
                return (
                  <Card key={offer.id} padding="md" className="border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Badge variant={offer.status === 'pending' ? 'warning' : offer.status === 'accepted' ? 'success' : 'neutral'}>
                            {offer.status.toUpperCase()}
                          </Badge>
                          <h4 className="text-base font-bold text-slate-900 mt-2">{offer.vehicleName}</h4>
                          <p className="text-xs text-slate-500">{offer.variantName || 'Special Queue Allocation'}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs line-through text-slate-400 block">
                            {formatCurrency(offer.originalPrice)}
                          </span>
                          <span className="text-xl font-bold text-blue-600 block">
                            {formatCurrency(offer.offeredPrice)}
                          </span>
                          {discount > 0 && (
                            <span className="text-[11px] font-semibold text-emerald-600">
                              Save {formatCurrency(discount)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-1 my-3">
                        <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Building2 size={13} className="text-slate-400" />
                          {offer.dealerName}
                        </p>
                        <p className="text-slate-500">{offer.notes}</p>
                        <p className="text-[11px] text-amber-700 pt-1 font-medium flex items-center gap-1">
                          <Clock size={11} /> Valid through {formatDate(offer.expiryDate)}
                        </p>
                      </div>
                    </div>

                    {offer.status === 'pending' && (
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <Button
                          className="flex-1"
                          size="sm"
                          onClick={() => handleOfferResponse(offer.id, 'accepted')}
                          leftIcon={<CheckCircle2 size={14} />}
                        >
                          Accept Offer
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOfferResponse(offer.id, 'declined')}
                          leftIcon={<XCircle size={14} />}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: BOOKINGS */}
      {activeTab === 'bookings' && (
        <Card padding="none">
          <div className="p-5 border-b border-slate-100">
            <CardHeader
              title="My Vehicle Bookings"
              subtitle="Track your scheduled showroom visits, test drives, and vehicle reservations."
            />
          </div>

          {bookings.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              You have no active bookings.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {bookings.map(b => (
                <div key={b.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Calendar size={22} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900">
                          {b.listing?.vehicleModel?.make || 'Vehicle'} {b.listing?.vehicleModel?.model || 'Booking'}
                        </h4>
                        <Badge variant={b.status === 'confirmed' ? 'success' : 'warning'} size="sm">
                          {b.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Dealership: <span className="font-semibold text-slate-700">{b.dealer?.dealershipName}</span> • {b.dealer?.address}, {b.dealer?.city}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Notes: {b.notes || 'Test drive & inspection reservation.'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-400">Scheduled Date</p>
                    <p className="text-sm font-semibold text-slate-800">{formatDate(b.bookingDate)}</p>
                    <p className="text-xs text-blue-600 font-medium mt-1">Showroom Phone: {b.dealer?.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
