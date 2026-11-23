import { ListingPriceChange } from '../../components/demand/ListingPriceChange';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Filter,
  RotateCcw,
  SlidersHorizontal,
  MapPin,
  ShieldCheck,
  ChevronDown,
  Fuel,
  Gauge,
  DollarSign,
  LayoutGrid,
  List,
  Eye,
  Award,
  Lock,
  AlertTriangle,
  Phone,
  Mail,
  User as UserIcon,
  ChevronRight,
  HelpCircle,
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
import {
  VehicleListing,
  QueueEntry,
  Offer,
  Booking,
  BookingStatus,
} from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { VehicleDetailsPage } from '../vehicle/VehicleDetailsPage';

interface CustomerDashboardProps {
  initialTab?: 'vehicles' | 'comparison' | 'queues' | 'offers' | 'bookings';
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ initialTab = 'vehicles' }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'vehicles' | 'comparison' | 'queues' | 'offers' | 'bookings'>(initialTab);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedVehicleForDetails, setSelectedVehicleForDetails] = useState<string | null>(null);

  // Raw data
  const [vehicles, setVehicles] = useState<VehicleListing[]>([]);
  const [queues, setQueues] = useState<QueueEntry[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Status message
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // --- 1. Customer Search Fields ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedModel, setSelectedModel] = useState('all');
  const [selectedVariant, setSelectedVariant] = useState('all');
  const [selectedFuelType, setSelectedFuelType] = useState<string>('all');
  const [selectedTransmission, setSelectedTransmission] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [pinCodeFilter, setPinCodeFilter] = useState('');
  const [maxBudget, setMaxBudget] = useState<number>(65000);

  // --- Filters & Sorting ---
  const [selectedAvailability, setSelectedAvailability] = useState<string>('all');
  const [selectedDealer, setSelectedDealer] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'lowest_price' | 'highest_price' | 'earliest_delivery' | 'newest'>('lowest_price');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Comparison Tab Active Model Key
  const [comparisonModelKey, setComparisonModelKey] = useState<string>('');

  // Offer Filter
  const [offerFilter, setOfferFilter] = useState<'all' | 'pending' | 'accepted' | 'declined' | 'expired'>('all');

  // Booking Filter
  const [bookingFilter, setBookingFilter] = useState<'all' | 'active' | 'history'>('all');

  // Offer Acceptance & Price Lock Modal
  const [acceptingOffer, setAcceptingOffer] = useState<Offer | null>(null);
  const [lockDurationHours, setLockDurationHours] = useState<number>(72);
  const [isAcceptingOffer, setIsAcceptingOffer] = useState(false);

  // Offer Decline Modal
  const [decliningOffer, setDecliningOffer] = useState<Offer | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [isDecliningOffer, setIsDecliningOffer] = useState(false);

  // Booking Cancellation Modal
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancellingBooking, setIsCancellingBooking] = useState(false);

  // Direct Booking Modal
  const [bookingVehicle, setBookingVehicle] = useState<VehicleListing | null>(null);
  const [bookingDate, setBookingDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
  const [bookingNotes, setBookingNotes] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Queue Modal
  const [queueModalVehicle, setQueueModalVehicle] = useState<VehicleListing | null>(null);
  const [isJoiningQueue, setIsJoiningQueue] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [vRes, qRes, oRes, bRes] = await Promise.all([
          vehicleService.getAll({ marketplace: true }),
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

  // Handle Offer Acceptance with Price Lock
  const handleConfirmAcceptOffer = async () => {
    if (!acceptingOffer) return;
    setIsAcceptingOffer(true);

    const res = await offerService.acceptOffer(acceptingOffer.id, lockDurationHours);
    setIsAcceptingOffer(false);
    setAcceptingOffer(null);

    if (!res.success) {
      setActionMessage(res.error || 'The offer could not be accepted.');
      setTimeout(() => setActionMessage(null), 4000);
    }
    if (res.success && res.data) {
      setOffers(prev => prev.map(o => (o.id === acceptingOffer.id ? { ...o, status: 'accepted' } : o)));

      // Reload bookings to reflect the new price-locked booking
      if (user) {
        const [bRes, qRes] = await Promise.all([
          bookingService.getByCustomerId(user.id), queueService.getByCustomerId(user.id),
        ]);
        if (bRes.success && bRes.data) setBookings(bRes.data);
        if (qRes.success && qRes.data) setQueues(qRes.data);
      }

      setActionMessage(
        `Offer Accepted! Price of $${acceptingOffer.offeredPrice.toLocaleString()} locked for ${lockDurationHours} hours.`
      );
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Handle Offer Decline
  const handleConfirmDeclineOffer = async () => {
    if (!decliningOffer) return;
    setIsDecliningOffer(true);

    const res = await offerService.declineOffer(decliningOffer.id, declineReason);
    setIsDecliningOffer(false);
    setDecliningOffer(null);
    setDeclineReason('');

    if (res.success) {
      setOffers(prev => prev.map(o => (o.id === decliningOffer.id ? { ...o, status: 'declined' } : o)));
      setActionMessage('Offer declined. Dealer has been notified.');
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  // Handle Booking Cancellation
  const handleConfirmCancelBooking = async () => {
    if (!cancellingBooking) return;
    setIsCancellingBooking(true);

    const res = await bookingService.updateStatus(cancellingBooking.id, 'cancelled', cancelReason);
    setIsCancellingBooking(false);
    setCancellingBooking(null);
    setCancelReason('');

    if (res.success && res.data) {
      setBookings(prev => prev.map(b => (b.id === cancellingBooking.id ? res.data! : b)));
      setActionMessage('Booking has been cancelled.');
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  // Switch to comparison tab for a specific offer's vehicle
  const handleCompareOfferWithMarket = (offer: Offer) => {
    const targetKey = comparisonKeys.find(k =>
      k.toLowerCase().includes(offer.vehicleName.toLowerCase())
    );
    if (targetKey) {
      setComparisonModelKey(targetKey);
    }
    setActiveTab('comparison');
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

  // Dynamic filter options derived from dataset
  const availableBrands = useMemo(() => {
    return ['all', ...Array.from(new Set(vehicles.map(v => v.brand).filter(Boolean)))];
  }, [vehicles]);

  const availableModels = useMemo(() => {
    return [
      'all',
      ...Array.from(
        new Set(
          vehicles
            .filter(v => selectedBrand === 'all' || v.brand === selectedBrand)
            .map(v => v.model)
            .filter(Boolean)
        )
      ),
    ];
  }, [vehicles, selectedBrand]);

  const availableVariants = useMemo(() => {
    return [
      'all',
      ...Array.from(
        new Set(
          vehicles
            .filter(
              v =>
                (selectedBrand === 'all' || v.brand === selectedBrand) &&
                (selectedModel === 'all' || v.model === selectedModel)
            )
            .map(v => v.variant)
            .filter(Boolean)
        )
      ),
    ];
  }, [vehicles, selectedBrand, selectedModel]);

  const availableColors = useMemo(() => {
    return ['all', ...Array.from(new Set(vehicles.map(v => v.color).filter(Boolean)))];
  }, [vehicles]);

  const availableCities = useMemo(() => {
    return ['all', ...Array.from(new Set(vehicles.map(v => v.dealer?.city).filter(Boolean) as string[]))];
  }, [vehicles]);

  const availableDealers = useMemo(() => {
    const map = new Map<string, string>();
    vehicles.forEach(v => {
      if (v.dealerId && v.dealer?.dealershipName) {
        map.set(v.dealerId, v.dealer.dealershipName);
      }
    });
    return Array.from(map.entries());
  }, [vehicles]);

  // Delivery timeline weight for sorting
  const deliveryWeight: Record<string, number> = {
    'Immediate': 1,
    'Within 7 days': 2,
    'Within 15 days': 3,
    'Within 30 days': 4,
    '30+ days': 5,
  };

  // Filtered & Sorted Search Results
  const filteredVehicles = useMemo(() => {
    return vehicles
      .filter(v => {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          v.brand.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.variant.toLowerCase().includes(q) ||
          v.color.toLowerCase().includes(q) ||
          (v.dealer?.dealershipName && v.dealer.dealershipName.toLowerCase().includes(q)) ||
          (v.dealer?.city && v.dealer.city.toLowerCase().includes(q));

        const matchesBrand = selectedBrand === 'all' || v.brand === selectedBrand;
        const matchesModel = selectedModel === 'all' || v.model === selectedModel;
        const matchesVariant = selectedVariant === 'all' || v.variant === selectedVariant;
        const matchesFuel = selectedFuelType === 'all' || v.fuelType === selectedFuelType;
        const matchesTransmission = selectedTransmission === 'all' || v.transmission === selectedTransmission;
        const matchesColor = selectedColor === 'all' || v.color.toLowerCase().includes(selectedColor.toLowerCase());
        const matchesCity = selectedCity === 'all' || v.dealer?.city?.toLowerCase() === selectedCity.toLowerCase();
        const matchesPin =
          !pinCodeFilter.trim() ||
          (v.dealer?.pinCode && v.dealer.pinCode.includes(pinCodeFilter.trim()));
        const matchesBudget = v.dealerOfferPrice <= maxBudget;
        const matchesAvailability =
          selectedAvailability === 'all' || v.availability === selectedAvailability;
        const matchesDealer = selectedDealer === 'all' || v.dealerId === selectedDealer;

        return (
          matchesQuery &&
          matchesBrand &&
          matchesModel &&
          matchesVariant &&
          matchesFuel &&
          matchesTransmission &&
          matchesColor &&
          matchesCity &&
          matchesPin &&
          matchesBudget &&
          matchesAvailability &&
          matchesDealer
        );
      })
      .sort((a, b) => {
        if (sortBy === 'lowest_price') return a.dealerOfferPrice - b.dealerOfferPrice;
        if (sortBy === 'highest_price') return b.dealerOfferPrice - a.dealerOfferPrice;
        if (sortBy === 'earliest_delivery') {
          const wA = deliveryWeight[a.deliveryTimeline] || 99;
          const wB = deliveryWeight[b.deliveryTimeline] || 99;
          return wA - wB;
        }
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
  }, [
    vehicles,
    searchQuery,
    selectedBrand,
    selectedModel,
    selectedVariant,
    selectedFuelType,
    selectedTransmission,
    selectedColor,
    selectedCity,
    pinCodeFilter,
    maxBudget,
    selectedAvailability,
    selectedDealer,
    sortBy,
  ]);

  // Group listings by Model & Variant for Multi-Dealer Price Comparison
  const comparisonGroups = useMemo(() => {
    const groups: Record<string, VehicleListing[]> = {};
    vehicles.forEach(v => {
      const key = `${v.brand} ${v.model} (${v.variant})`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(v);
    });
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.dealerOfferPrice - b.dealerOfferPrice);
    });
    return groups;
  }, [vehicles]);

  const comparisonKeys = Object.keys(comparisonGroups);

  useEffect(() => {
    if (comparisonKeys.length > 0 && (!comparisonModelKey || !comparisonGroups[comparisonModelKey])) {
      const multiDealerKey = comparisonKeys.find(k => comparisonGroups[k].length > 1);
      setComparisonModelKey(multiDealerKey || comparisonKeys[0]);
    }
  }, [comparisonKeys, comparisonModelKey, comparisonGroups]);

  const activeComparisonListings = comparisonGroups[comparisonModelKey] || [];
  const lowestGroupPrice = activeComparisonListings.length > 0
    ? Math.min(...activeComparisonListings.map(l => l.dealerOfferPrice))
    : 0;
  const highestGroupPrice = activeComparisonListings.length > 0
    ? Math.max(...activeComparisonListings.map(l => l.dealerOfferPrice))
    : 0;
  const avgGroupPrice = activeComparisonListings.length > 0
    ? Math.round(
        activeComparisonListings.reduce((sum, l) => sum + l.dealerOfferPrice, 0) /
          activeComparisonListings.length
      )
    : 0;

  // Filtered Offers List
  const filteredOffers = useMemo(() => {
    if (offerFilter === 'all') return offers;
    return offers.filter(o => o.status === offerFilter);
  }, [offers, offerFilter]);

  // Filtered Bookings List
  const filteredBookings = useMemo(() => {
    if (bookingFilter === 'all') return bookings;
    if (bookingFilter === 'active') {
      return bookings.filter(b => ['pending', 'confirmed', 'payment_pending', 'booked'].includes(b.status));
    }
    return bookings.filter(b => ['completed', 'cancelled', 'expired'].includes(b.status));
  }, [bookings, bookingFilter]);

  // Reset all search and filter fields
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedBrand('all');
    setSelectedModel('all');
    setSelectedVariant('all');
    setSelectedFuelType('all');
    setSelectedTransmission('all');
    setSelectedColor('all');
    setSelectedCity('all');
    setPinCodeFilter('');
    setMaxBudget(65000);
    setSelectedAvailability('all');
    setSelectedDealer('all');
    setSortBy('lowest_price');
  };

  const hasActiveFilters =
    searchQuery ||
    selectedBrand !== 'all' ||
    selectedModel !== 'all' ||
    selectedVariant !== 'all' ||
    selectedFuelType !== 'all' ||
    selectedTransmission !== 'all' ||
    selectedColor !== 'all' ||
    selectedCity !== 'all' ||
    pinCodeFilter !== '' ||
    maxBudget < 65000 ||
    selectedAvailability !== 'all' ||
    selectedDealer !== 'all';

  // Handle direct booking confirmation
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingVehicle || !user) return;
    setIsSubmittingBooking(true);

    const res = await bookingService.create({
      customerId: user.id,
      customerName: user.name,
      dealerId: bookingVehicle.dealerId,
      listingId: bookingVehicle.id,
      lockedPrice: bookingVehicle.dealerOfferPrice,
      lockDurationHours: 72,
      bookingDate,
      vehicleName: `${bookingVehicle.brand} ${bookingVehicle.model}`,
      variantName: bookingVehicle.variant,
      color: bookingVehicle.color,
      notes: bookingNotes || `Showroom visit scheduled for ${formatDate(bookingDate)}.`,
    });

    setIsSubmittingBooking(false);
    setBookingVehicle(null);

    if (!res.success) {
      setActionMessage(res.error || 'The booking could not be created.');
      const updated = await vehicleService.getAll({ marketplace: true });
      if (updated.success && updated.data) setVehicles(updated.data);
      setTimeout(() => setActionMessage(null), 4000);
    }
    if (res.success && res.data) {
      setBookings(prev => [res.data!, ...prev]);
      setActionMessage(
        `Booking request confirmed with ${bookingVehicle.dealer?.dealershipName || 'dealership'}! Price locked for 72 hours.`
      );
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Handle join queue confirmation
  const handleConfirmJoinQueue = async () => {
    if (!queueModalVehicle || !user) return;
    setIsJoiningQueue(true);

    const res = await queueService.join({
      customerId: user.id,
      vehicleModelId: queueModalVehicle.vehicleModelId,
      variantId: queueModalVehicle.variantId,
      city: queueModalVehicle.dealer?.city,
      state: queueModalVehicle.dealer?.state,
    });

    setIsJoiningQueue(false);
    setQueueModalVehicle(null);

    if (res.success && res.data) {
      const joined = res.data;
      setQueues(prev => [joined, ...prev.filter(entry => entry.id !== joined.id)]);
      setActionMessage(
        `Joined waitlist queue for ${queueModalVehicle.brand} ${queueModalVehicle.model}!`
      );
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Status Badge Helper
  const getBookingStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending Confirmation</Badge>;
      case 'confirmed':
        return <Badge variant="info">Confirmed by Dealer</Badge>;
      case 'payment_pending':
        return <Badge variant="warning">Payment Pending</Badge>;
      case 'booked':
        return <Badge variant="success">Booked & Reserved</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      case 'expired':
        return <Badge variant="neutral">Expired</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (selectedVehicleForDetails) {
    return (
      <VehicleDetailsPage
        listingId={selectedVehicleForDetails}
        onBack={() => setSelectedVehicleForDetails(null)}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back, {user?.name?.split(' ')[0] || 'Customer'}
            </h1>
            <Badge variant="default" size="sm">Customer Vehicle Hub</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Discover cars across independent dealerships, compare competitive pricing side-by-side, and explore dealers freely.
          </p>
        </div>

        {actionMessage && (
          <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-lg flex items-center gap-2 animate-fadeIn">
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
              <p className="text-xs text-slate-500 font-medium">Available Cars</p>
              <p className="text-xl font-bold text-slate-900">{vehicles.length} Listings</p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Tag size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Active Offers</p>
              <p className="text-xl font-bold text-slate-900">
                {offers.filter(o => o.status === 'pending').length} Received
              </p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <ClipboardList size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Waitlist Positions</p>
              <p className="text-xl font-bold text-slate-900">
                {queues.filter(q => q.status === 'waiting' || q.status === 'offered').length}
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
              <p className="text-xl font-bold text-slate-900">
                {bookings.filter(b => ['pending', 'confirmed', 'payment_pending', 'booked'].includes(b.status)).length}
              </p>
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
          Discover & Search ({filteredVehicles.length})
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
          onClick={() => setActiveTab('offers')}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'offers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag size={15} />
          Dealer Offers ({offers.length})
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
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CUSTOMER DISCOVERY & SEARCH                                        */}
      {/* ========================================================================= */}
      {activeTab === 'vehicles' && (
        <div className="space-y-5">
          {/* Main Search Panel */}
          <Card padding="md" className="border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Search by brand, model, variant, color, dealership, or city..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  leftElement={<Search size={16} />}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={showAdvancedFilters ? 'primary' : 'secondary'}
                  size="md"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  leftIcon={<SlidersHorizontal size={15} />}
                >
                  {showAdvancedFilters ? 'Hide Filters' : 'All 9 Filters'}
                </Button>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={handleResetFilters}
                    leftIcon={<RotateCcw size={14} />}
                    className="text-slate-500 hover:text-slate-800"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Cascading Filters: Brand -> Model -> Variant */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Car Brand
                </label>
                <select
                  value={selectedBrand}
                  onChange={e => {
                    setSelectedBrand(e.target.value);
                    setSelectedModel('all');
                    setSelectedVariant('all');
                  }}
                  className="w-full text-xs py-2 px-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableBrands.map(b => (
                    <option key={b} value={b}>
                      {b === 'all' ? 'All Brands' : b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Car Model
                </label>
                <select
                  value={selectedModel}
                  onChange={e => {
                    setSelectedModel(e.target.value);
                    setSelectedVariant('all');
                  }}
                  className="w-full text-xs py-2 px-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableModels.map(m => (
                    <option key={m} value={m}>
                      {m === 'all' ? 'All Models' : m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Variant / Trim
                </label>
                <select
                  value={selectedVariant}
                  onChange={e => setSelectedVariant(e.target.value)}
                  className="w-full text-xs py-2 px-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableVariants.map(v => (
                    <option key={v} value={v}>
                      {v === 'all' ? 'All Variants' : v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="pt-3 border-t border-slate-100 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Fuel Type
                    </label>
                    <select
                      value={selectedFuelType}
                      onChange={e => setSelectedFuelType(e.target.value)}
                      className="w-full text-xs py-2 px-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Fuels</option>
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="CNG">CNG</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Transmission
                    </label>
                    <select
                      value={selectedTransmission}
                      onChange={e => setSelectedTransmission(e.target.value)}
                      className="w-full text-xs py-2 px-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Transmissions</option>
                      <option value="Automatic">Automatic</option>
                      <option value="Manual">Manual</option>
                      <option value="CVT">CVT</option>
                      <option value="DCT">DCT</option>
                      <option value="Single-Speed">Single-Speed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Preferred Colour
                    </label>
                    <select
                      value={selectedColor}
                      onChange={e => setSelectedColor(e.target.value)}
                      className="w-full text-xs py-2 px-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Colours</option>
                      {availableColors.filter(c => c !== 'all').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Showroom City
                    </label>
                    <select
                      value={selectedCity}
                      onChange={e => setSelectedCity(e.target.value)}
                      className="w-full text-xs py-2 px-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Cities</option>
                      {availableCities.filter(c => c !== 'all').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Location PIN Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 90025"
                      value={pinCodeFilter}
                      onChange={e => setPinCodeFilter(e.target.value)}
                      className="w-full text-xs py-2 px-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Specific Dealer
                    </label>
                    <select
                      value={selectedDealer}
                      onChange={e => setSelectedDealer(e.target.value)}
                      className="w-full text-xs py-2 px-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Dealerships</option>
                      {availableDealers.map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <DollarSign size={13} className="text-blue-600" /> Maximum Budget:
                    </span>
                    <span className="font-bold text-blue-600 text-sm">
                      {formatCurrency(maxBudget)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="25000"
                    max="65000"
                    step="1000"
                    value={maxBudget}
                    onChange={e => setMaxBudget(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>$25,000</span>
                    <span>$45,000</span>
                    <span>$65,000+</span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Results Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-bold text-slate-900">{filteredVehicles.length} Vehicles Found</span>
              <span>across matching dealerships</span>
              {hasActiveFilters && (
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                  Filtered
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="text-xs py-1.5 px-2 border border-slate-200 rounded-lg bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="lowest_price">Lowest Price First</option>
                  <option value="highest_price">Highest Price First</option>
                  <option value="earliest_delivery">Earliest Delivery First</option>
                  <option value="newest">Recently Added</option>
                </select>
              </div>

              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 transition-colors ${
                    viewMode === 'cards' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Card View"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 transition-colors ${
                    viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Comparison Table View"
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Results: Cards View */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredVehicles.length === 0 ? (
                <div className="col-span-full py-16 text-center">
                  <Car size={36} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-700">No vehicles match your search criteria</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    Try adjusting your budget, fuel preference, or location filters.
                  </p>
                  <Button variant="secondary" size="sm" onClick={handleResetFilters}>
                    Reset Search Filters
                  </Button>
                </div>
              ) : (
                filteredVehicles.map(v => {
                  const peers = vehicles.filter(
                    item =>
                      item.brand.toLowerCase() === v.brand.toLowerCase() &&
                      item.model.toLowerCase() === v.model.toLowerCase() &&
                      item.variant.toLowerCase() === v.variant.toLowerCase()
                  );
                  const lowestPeerPrice = Math.min(...peers.map(p => p.dealerOfferPrice));
                  const isLowestOffer = v.dealerOfferPrice === lowestPeerPrice;

                  return (
                    <Card
                      key={v.id}
                      padding="none"
                      className="overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group border-slate-200"
                    >
                      <div>
                        <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                          <img
                            src={
                              v.images && v.images[0]
                                ? v.images[0]
                                : 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80'
                            }
                            alt={`${v.brand} ${v.model}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                            <Badge variant={v.availability === 'available' ? 'success' : 'warning'} size="sm">
                              {v.availability === 'available' ? `In Stock (${v.quantity})` : v.availability.replace('_', ' ')}
                            </Badge>
                            {isLowestOffer && peers.length > 1 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-sm">
                                <Award size={10} /> Lowest Dealer Price
                              </span>
                            )}
                          </div>

                          <div className="absolute bottom-2 right-2">
                            <span className="text-[10px] font-bold bg-slate-900/80 backdrop-blur-sm text-white px-2 py-0.5 rounded-md">
                              {v.deliveryTimeline}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 space-y-2.5">
                          <div>
                            <div className="flex items-center justify-between text-[11px] text-blue-600 font-bold uppercase tracking-wider">
                              <span>{v.year} • {v.fuelType}</span>
                              <span className="text-slate-400 font-medium lowercase">{v.transmission}</span>
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mt-0.5 group-hover:text-blue-600 transition-colors">
                              {v.brand} {v.model}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">{v.variant}</p>
                          </div>

                          <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-100">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                <Building2 size={13} className="text-slate-400" />
                                {v.dealer?.dealershipName}
                              </span>
                              {v.dealer?.isVerified && (
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  Verified
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                              <MapPin size={11} className="text-slate-400" />
                              {v.dealer?.city}, {v.dealer?.state} ({v.dealer?.pinCode})
                            </p>
                          </div>

                          {peers.length > 1 && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-0.5">
                              <TrendingDown size={12} className="text-blue-600" />
                              <span>Offered by <strong>{peers.length} dealerships</strong> in region</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                            Offered Price
                          </span>
                          <span className="text-base font-extrabold text-slate-900 block">
                            {formatCurrency(v.dealerOfferPrice)}
                          </span>
                          <ListingPriceChange listing={v} />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelectedVehicleForDetails(v.id)}
                            leftIcon={<Eye size={13} />}
                          >
                            Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setBookingVehicle(v)}
                            leftIcon={<Calendar size={13} />}
                          >
                            Book
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {/* Results: Table View */}
          {viewMode === 'table' && (
            <Card padding="none" className="border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Car & Variant</th>
                      <th className="px-5 py-3.5">Listing Dealership</th>
                      <th className="px-5 py-3.5">Location & PIN</th>
                      <th className="px-5 py-3.5">Offered Price</th>
                      <th className="px-5 py-3.5">Stock & Delivery</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredVehicles.map(v => (
                      <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900">{v.brand} {v.model}</p>
                          <p className="text-xs text-slate-500">{v.variant} • {v.fuelType} • {v.transmission}</p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800">{v.dealer?.dealershipName}</span>
                            {v.dealer?.isVerified && (
                              <span title="Verified Dealership" className="inline-flex">
                                <ShieldCheck size={14} className="text-emerald-600" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">{v.dealer?.phone}</p>
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-600">
                          <span className="font-medium text-slate-800">{v.dealer?.city}, {v.dealer?.state}</span>
                          <span className="text-slate-400 block text-[11px]">PIN: {v.dealer?.pinCode}</span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-base font-extrabold text-slate-900 block">
                            {formatCurrency(v.dealerOfferPrice)}
                          </span>
                          <ListingPriceChange listing={v} />
                          <span className="text-[10px] text-slate-400">
                            Ex-Showroom: {formatCurrency(v.exShowroomPrice)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <Badge variant={v.availability === 'available' ? 'success' : 'warning'} size="sm">
                            {v.availability === 'available' ? `${v.quantity} in stock` : v.availability.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-slate-500 block mt-0.5">{v.deliveryTimeline}</span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setSelectedVehicleForDetails(v.id)}
                            >
                              Details
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setBookingVehicle(v)}
                            >
                              Book
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MULTI-DEALER PRICE COMPARISON                                      */}
      {/* ========================================================================= */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-3">
            <Sparkles size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 leading-relaxed space-y-1">
              <p>
                <strong>Multi-Dealer Car Marketplace Comparison:</strong> Independent dealerships provide their own competitive pricing, availability, and delivery timelines for the same vehicle models.
              </p>
              <p className="text-blue-700">
                You are never forced to choose the cheapest offer. Compare all options freely based on showroom location, dealer verification, stock readiness, or timeline.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select Vehicle Model & Variant to Compare:
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {comparisonKeys.map(key => {
                const count = comparisonGroups[key].length;
                const isSelected = key === comparisonModelKey;
                return (
                  <button
                    key={key}
                    onClick={() => setComparisonModelKey(key)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-2 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{key}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count} {count === 1 ? 'dealer' : 'dealers'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {activeComparisonListings.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card padding="sm" className="border-emerald-200 bg-emerald-50/40">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Lowest Dealer Offer
                </span>
                <p className="text-xl font-extrabold text-emerald-700 mt-0.5">
                  {formatCurrency(lowestGroupPrice)}
                </p>
                <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
                  Save {formatCurrency(highestGroupPrice - lowestGroupPrice)} vs highest
                </span>
              </Card>

              <Card padding="sm" className="border-slate-200 bg-white">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Highest Dealer Offer
                </span>
                <p className="text-xl font-extrabold text-slate-800 mt-0.5">
                  {formatCurrency(highestGroupPrice)}
                </p>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Regional upper boundary
                </span>
              </Card>

              <Card padding="sm" className="border-slate-200 bg-white">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Market Average
                </span>
                <p className="text-xl font-extrabold text-blue-600 mt-0.5">
                  {formatCurrency(avgGroupPrice)}
                </p>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Across {activeComparisonListings.length} dealerships
                </span>
              </Card>

              <Card padding="sm" className="border-slate-200 bg-white">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Fastest Availability
                </span>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {activeComparisonListings.some(l => l.deliveryTimeline === 'Immediate')
                    ? 'Immediate Delivery'
                    : activeComparisonListings[0]?.deliveryTimeline || 'Within 7 days'}
                </p>
                <span className="text-[11px] text-slate-500 block mt-1">
                  {activeComparisonListings.filter(l => l.availability === 'available').length} dealers in stock
                </span>
              </Card>
            </div>
          )}

          {/* Comparison Table */}
          <Card padding="none" className="border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {comparisonModelKey} — All Participating Dealerships
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compare price, location proximity, stock quantity, and delivery timeline before booking.
                </p>
              </div>

              <Badge variant="info" size="sm">
                {activeComparisonListings.length} Active Offers
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-[11px] font-semibold tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Dealership</th>
                    <th className="px-6 py-3.5">Showroom Location</th>
                    <th className="px-6 py-3.5">Offered Price</th>
                    <th className="px-6 py-3.5">Price Comparison</th>
                    <th className="px-6 py-3.5">Stock & Availability</th>
                    <th className="px-6 py-3.5">Delivery Time</th>
                    <th className="px-6 py-3.5 text-right">Choose Dealership</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeComparisonListings.map(item => {
                    const isLowest = item.dealerOfferPrice === lowestGroupPrice;
                    const diffFromLowest = item.dealerOfferPrice - lowestGroupPrice;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isLowest ? 'bg-emerald-50/30' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                              <Building2 size={16} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                {item.dealer?.dealershipName}
                              </p>
                              {item.dealer?.isVerified ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 mt-0.5">
                                  <ShieldCheck size={11} /> Verified Dealer
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                                  Pending Verification
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-xs">
                          <p className="font-semibold text-slate-800 flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400" />
                            {item.dealer?.city}, {item.dealer?.state}
                          </p>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            {item.dealer?.address} • PIN: {item.dealer?.pinCode}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-base font-extrabold text-slate-900">
                            {formatCurrency(item.dealerOfferPrice)}
                          </p>
                          <ListingPriceChange listing={item} />
                          <p className="text-[10px] text-slate-400">
                            On-Road: {formatCurrency(item.onRoadPrice)}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          {isLowest ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                              <Award size={13} /> Cheapest Available
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-500">
                              +{formatCurrency(diffFromLowest)} vs lowest
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <Badge variant={item.availability === 'available' ? 'success' : 'warning'} size="sm">
                            {item.availability === 'available'
                              ? `In Stock (${item.quantity} units)`
                              : item.availability.replace('_', ' ')}
                          </Badge>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Color: {item.color}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-xs font-medium text-slate-700">
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-slate-400" />
                            {item.deliveryTimeline}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setSelectedVehicleForDetails(item.id)}
                            >
                              Specs
                            </Button>
                            <Button
                              size="sm"
                              variant={isLowest ? 'primary' : 'secondary'}
                              onClick={() => setBookingVehicle(item)}
                              leftIcon={<Calendar size={13} />}
                            >
                              Book Here
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CUSTOMER OFFER MANAGEMENT                                          */}
      {/* ========================================================================= */}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          {/* Header & Sub-Filter Pills */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Dealer Offers & Incentives</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review tailored proposals sent to you by verified dealerships. Accept an offer to lock the price guaranteed.
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-50 p-1 rounded-lg border border-slate-200">
              {(['all', 'pending', 'accepted', 'declined'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setOfferFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${
                    offerFilter === f
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f === 'pending' ? 'Active Offers' : f}
                </button>
              ))}
            </div>
          </div>

          {filteredOffers.length === 0 ? (
            <Card padding="lg" className="text-center text-slate-400 text-sm">
              No offers matching the selected filter.
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredOffers.map(offer => {
                const discount = offer.originalPrice - offer.offeredPrice;
                const exceedsBudget = offer.offeredPrice > maxBudget;

                return (
                  <Card
                    key={offer.id}
                    padding="md"
                    className="border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                offer.status === 'pending'
                                  ? 'warning'
                                  : offer.status === 'accepted'
                                  ? 'success'
                                  : 'neutral'
                              }
                            >
                              {offer.status === 'pending' && Date.parse(offer.expiryDate) <= Date.now() ? 'EXPIRED' : offer.status.toUpperCase()}
                            </Badge>
                            {exceedsBudget && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                                <AlertTriangle size={11} /> Exceeds Filtered Budget
                              </span>
                            )}
                          </div>
                          <h4 className="text-lg font-bold text-slate-900 mt-1">
                            {offer.vehicleName}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">{offer.variantName}</p>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-slate-500 block">
                            Listed when sent {formatCurrency(offer.originalPrice)}
                          </span>
                          <span className="text-2xl font-black text-blue-600 block">
                            {formatCurrency(offer.offeredPrice)}
                          </span>
                          {discount > 0 && (
                            <span className="text-[11px] font-bold text-emerald-600">
                              Save {formatCurrency(discount)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Specs and Dealer details grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs py-3">
                        <div className="p-2.5 bg-slate-50 rounded-lg">
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Offered Colour</span>
                          <span className="font-bold text-slate-800">{offer.color || 'Choice of In-Stock'}</span>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-lg">
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase">Expected Delivery</span>
                          <span className="font-bold text-slate-800">{offer.expectedDeliveryDate ? formatDate(offer.expectedDeliveryDate) : 'Within 7 days'}</span>
                        </div>
                      </div>

                      {/* Dealership Info Box */}
                      <div className="p-3 bg-blue-50/50 rounded-xl text-xs space-y-1 mb-3 border border-blue-100">
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Building2 size={13} className="text-blue-600" />
                          {offer.dealerName}
                        </p>
                        <p className="text-slate-600">{offer.notes}</p>
                        {offer.terms && (
                          <p className="text-[11px] text-slate-500 pt-1 border-t border-blue-100 mt-1">
                            <strong>Terms:</strong> {offer.terms}
                          </p>
                        )}
                        <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1 pt-1">
                          <Clock size={11} /> Offer valid until {formatDate(offer.expiryDate)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCompareOfferWithMarket(offer)}
                        leftIcon={<TrendingDown size={14} className="text-blue-600" />}
                      >
                        Compare with Market
                      </Button>

                      {offer.status === 'pending' && Date.parse(offer.expiryDate) > Date.now() && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setDecliningOffer(offer)}
                            leftIcon={<XCircle size={14} />}
                          >
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setAcceptingOffer(offer)}
                            leftIcon={<Lock size={14} />}
                          >
                            Accept & Lock Price
                          </Button>
                        </div>
                      )}

                      {offer.status === 'accepted' && (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={14} /> Price Locked & Booking Created
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CUSTOMER BOOKINGS & PRICE LOCK STATUS                               */}
      {/* ========================================================================= */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="p-5 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">My Vehicle Bookings & Price Locks</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Track your active vehicle reservations, showroom visits, locked pricing, and booking lifecycle history.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setBookingFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  bookingFilter === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({bookings.length})
              </button>
              <button
                onClick={() => setBookingFilter('active')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  bookingFilter === 'active' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active Bookings
              </button>
              <button
                onClick={() => setBookingFilter('history')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  bookingFilter === 'history' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Booking History
              </button>
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <Card padding="lg" className="text-center text-slate-400 text-sm">
              You have no bookings matching the selected filter.
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map(b => {
                const isLockActive = new Date(b.priceLockedUntil).getTime() > Date.now();

                return (
                  <Card key={b.id} padding="none" className="border-slate-200 overflow-hidden shadow-sm">
                    {/* Top Price Lock Strip */}
                    <div className="bg-slate-900 text-white px-5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Lock size={14} className="text-emerald-400" />
                        <span className="font-semibold text-slate-200">Guaranteed Locked Price:</span>
                        <span className="text-emerald-400 font-extrabold text-sm">
                          {formatCurrency(b.lockedPrice)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Lock Expiration:</span>
                        <span className="font-semibold text-slate-200">
                          {formatDate(b.priceLockedUntil)}
                        </span>
                        {isLockActive ? (
                          <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">
                            Active Lock
                          </span>
                        ) : (
                          <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold">
                            Lock Expired
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Vehicle Title & Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h4 className="text-lg font-bold text-slate-900">
                              {b.vehicleName || b.listing?.brand || 'Vehicle'} {b.variantName || b.listing?.variant || ''}
                            </h4>
                            {getBookingStatusBadge(b.status)}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Booking ID: <code className="font-mono text-slate-700">{b.id}</code> • Scheduled Date: <strong>{formatDate(b.bookingDate)}</strong>
                          </p>
                        </div>

                        {['pending', 'confirmed'].includes(b.status) && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setCancellingBooking(b)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            Cancel Booking
                          </Button>
                        )}
                      </div>

                      {/* Workflow Lifecycle Stepper */}
                      <div className="p-3.5 bg-slate-50 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Booking Progress Lifecycle
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                          {[
                            { key: 'pending', label: '1. Pending' },
                            { key: 'confirmed', label: '2. Confirmed' },
                            { key: 'payment_pending', label: '3. Payment' },
                            { key: 'booked', label: '4. Booked' },
                            { key: 'completed', label: '5. Completed' },
                          ].map(step => {
                            const statuses: BookingStatus[] = ['pending', 'confirmed', 'payment_pending', 'booked', 'completed'];
                            const currentIndex = statuses.indexOf(b.status);
                            const stepIndex = statuses.indexOf(step.key as BookingStatus);
                            const isDone = currentIndex >= stepIndex && b.status !== 'cancelled';
                            const isCurrent = b.status === step.key;

                            return (
                              <div
                                key={step.key}
                                className={`p-2 rounded-lg border font-semibold ${
                                  isCurrent
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : isDone
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-white text-slate-400 border-slate-200'
                                }`}
                              >
                                {step.label}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Dealer Contact & Booking Notes */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Dealership Showroom Contact
                          </span>
                          <p className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Building2 size={13} className="text-blue-600" />
                            {b.dealer?.dealershipName || 'Premier Auto Group'}
                          </p>
                          <p className="text-slate-600 flex items-center gap-1.5">
                            <MapPin size={12} className="text-slate-400" />
                            {b.dealer?.address || '1234 Motor Avenue'}, {b.dealer?.city || 'Los Angeles'}, {b.dealer?.state || 'CA'} ({b.dealer?.pinCode || '90025'})
                          </p>
                          <p className="text-slate-600 flex items-center gap-1.5">
                            <Phone size={12} className="text-slate-400" />
                            Direct Phone: <a href={`tel:${b.dealer?.phone}`} className="text-blue-600 font-semibold hover:underline">{b.dealer?.phone || '+1 (310) 555-0100'}</a>
                          </p>
                          <p className="text-slate-600 flex items-center gap-1.5">
                            <UserIcon size={12} className="text-slate-400" />
                            Contact Person: {b.dealer?.contactPerson || 'Dealership Representative'}
                          </p>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Notes & Audit Log
                          </span>
                          <p className="text-slate-600">{b.notes || 'No special requests submitted.'}</p>
                          {b.statusHistory && b.statusHistory.length > 0 && (
                            <div className="pt-2 border-t border-slate-200 space-y-1">
                              {b.statusHistory.map((hist, idx) => (
                                <p key={idx} className="text-[11px] text-slate-500">
                                  • <strong className="text-slate-700">{formatDate(hist.timestamp)}:</strong> {hist.note || hist.status}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ACTIVE QUEUES                                                      */}
      {/* ========================================================================= */}
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
                        {q.vehicleModel?.make || 'Vehicle'} {q.vehicleModel?.model || 'Waitlist'}
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

      {/* ========================================================================= */}
      {/* MODAL: ACCEPT OFFER & LOCK PRICE                                          */}
      {/* ========================================================================= */}
      {acceptingOffer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Accept Offer & Lock Price</h3>
              </div>
              <button
                onClick={() => setAcceptingOffer(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
              <p className="font-bold text-emerald-900">
                {acceptingOffer.vehicleName} ({acceptingOffer.variantName})
              </p>
              <p className="text-emerald-700">
                Dealership: <strong>{acceptingOffer.dealerName}</strong>
              </p>
              <p className="text-base font-black text-emerald-800 pt-1">
                Accepted Price: {formatCurrency(acceptingOffer.offeredPrice)}
              </p>
            </div>

            {/* Configurable Price Lock Duration */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Configurable Price Lock Duration:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[24, 48, 72, 168].map(hrs => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setLockDurationHours(hrs)}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-colors ${
                      lockDurationHours === hrs
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {hrs === 168 ? '7 Days' : `${hrs} Hours`}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                During this period, the dealer cannot increase the price or alter terms.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setAcceptingOffer(null)}
                disabled={isAcceptingOffer}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmAcceptOffer}
                isLoading={isAcceptingOffer}
                leftIcon={<Lock size={14} />}
              >
                Confirm Price Lock & Book
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DECLINE OFFER                                                      */}
      {/* ========================================================================= */}
      {decliningOffer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Decline Dealer Offer</h3>
              <button
                onClick={() => setDecliningOffer(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to decline the offer from{' '}
              <strong>{decliningOffer.dealerName}</strong> for{' '}
              <strong>{formatCurrency(decliningOffer.offeredPrice)}</strong>?
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reason for declining (Optional)
              </label>
              <select
                value={declineReason}
                onChange={e => setDeclineReason(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a reason...</option>
                <option value="Exceeds my budget">Exceeds my budget</option>
                <option value="Found a better price with another dealer">Found a better price with another dealer</option>
                <option value="Delivery timeline is too long">Delivery timeline is too long</option>
                <option value="Colour or trim preference not met">Colour or trim preference not met</option>
                <option value="No longer interested in this model">No longer interested in this model</option>
              </select>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDecliningOffer(null)}
                disabled={isDecliningOffer}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDeclineOffer}
                isLoading={isDecliningOffer}
              >
                Decline Offer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CANCEL BOOKING                                                     */}
      {/* ========================================================================= */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Cancel Booking</h3>
              <button
                onClick={() => setCancellingBooking(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to cancel your booking for{' '}
              <strong>{cancellingBooking.vehicleName || 'Vehicle'}</strong> with{' '}
              <strong>{cancellingBooking.dealer?.dealershipName || 'the dealership'}</strong>?
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reason for Cancellation
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="E.g., Schedule conflict, decided on different model..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCancellingBooking(null)}
                disabled={isCancellingBooking}
              >
                Keep Booking
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmCancelBooking}
                isLoading={isCancellingBooking}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DIRECT BOOKING */}
      {bookingVehicle && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Book Showroom Visit & Test Drive
                </h3>
                <p className="text-xs text-slate-500">
                  {bookingVehicle.brand} {bookingVehicle.model} ({bookingVehicle.variant})
                </p>
              </div>
              <button
                onClick={() => setBookingVehicle(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs space-y-1">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 size={13} className="text-blue-600" />
                  {bookingVehicle.dealer?.dealershipName}
                </p>
                <p className="text-slate-600">
                  Location: {bookingVehicle.dealer?.address}, {bookingVehicle.dealer?.city} ({bookingVehicle.dealer?.pinCode})
                </p>
                <p className="text-blue-700 font-semibold pt-1">
                  Guaranteed Offer: {formatCurrency(bookingVehicle.dealerOfferPrice)} • Timeline: {bookingVehicle.deliveryTimeline}
                </p>
              </div>

              <Input
                label="Preferred Visit Date"
                type="date"
                value={bookingDate}
                onChange={e => setBookingDate(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Visit Purpose & Special Requests
                </label>
                <textarea
                  rows={3}
                  value={bookingNotes}
                  onChange={e => setBookingNotes(e.target.value)}
                  placeholder="E.g., Test drive requested, financing discussion, vehicle trade-in evaluation..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setBookingVehicle(null)}
                  disabled={isSubmittingBooking}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isSubmittingBooking}
                  leftIcon={<Calendar size={14} />}
                >
                  Confirm Booking
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: JOIN QUEUE */}
      {queueModalVehicle && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Join Shared Waitlist Queue</h3>
              </div>
              <button
                onClick={() => setQueueModalVehicle(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Join the priority waitlist for the{' '}
              <strong className="text-slate-900">{queueModalVehicle.brand} {queueModalVehicle.model} ({queueModalVehicle.variant})</strong>. All registered dealerships receive notifications and provide direct offers.
            </p>

            <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Applicant:</span>
                <span className="font-semibold text-slate-800">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact:</span>
                <span className="font-semibold text-slate-800">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle Spec:</span>
                <span className="font-semibold text-slate-800">{queueModalVehicle.variant} ({queueModalVehicle.fuelType})</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setQueueModalVehicle(null)}
                disabled={isJoiningQueue}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmJoinQueue}
                isLoading={isJoiningQueue}
                leftIcon={<Sparkles size={14} />}
              >
                Join Queue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
