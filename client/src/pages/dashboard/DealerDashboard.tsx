import { DemandBadge, MarketMonitoring, useMarketData } from '../../components/demand/MarketMonitoring';
import { cityKey, isActiveQueue, marketKey } from '../../services/demandService';
import { pricingService } from '../../../../src/services/pricingService';
import React, { useState, useEffect } from 'react';
import {
  Car,
  Plus,
  DollarSign,
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Building2,
  Send,
  Trash2,
  Edit3,
  Calendar,
  Layers,
  ArrowUpDown,
  Tag,
  AlertCircle,
  Eye,
  Check,
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
  FuelType,
  TransmissionType,
  DeliveryTimeline,
  VehicleAvailabilityStatus,
  CreateVehicleListingData,
} from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';

export const DealerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const dealerId = user?.dealerProfile?.id || 'd1';

  // Navigation tab inside dashboard
  const [activeTab, setActiveTab] = useState<'inventory' | 'add-vehicle' | 'queues' | 'offers' | 'bookings' | 'demand'>('inventory');
  const monitor = useMarketData();

  // Inventory data
  const [listings, setListings] = useState<VehicleListing[]>([]);
  const [queues, setQueues] = useState<QueueEntry[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterModel, setFilterModel] = useState('all');
  const [filterVariant, setFilterVariant] = useState('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Quick Price Update Modal State
  const [priceModalListing, setPriceModalListing] = useState<VehicleListing | null>(null);
  const [editExShowroom, setEditExShowroom] = useState('');
  const [editOnRoad, setEditOnRoad] = useState('');
  const [editOfferPrice, setEditOfferPrice] = useState('');

  // Full Vehicle Edit Modal State
  const [editingListing, setEditingListing] = useState<VehicleListing | null>(null);

  // Add Vehicle Form State
  const [addBrand, setAddBrand] = useState('Toyota');
  const [addModel, setAddModel] = useState('Camry');
  const [addVariant, setAddVariant] = useState('LE');
  const [addYear, setAddYear] = useState('2024');
  const [addFuel, setAddFuel] = useState<FuelType>('Petrol');
  const [addTrans, setAddTrans] = useState<TransmissionType>('Automatic');
  const [addColor, setAddColor] = useState('');
  const [addMileage, setAddMileage] = useState('0');
  const [addExShowroom, setAddExShowroom] = useState('');
  const [addOnRoad, setAddOnRoad] = useState('');
  const [addOfferPrice, setAddOfferPrice] = useState('');
  const [addQuantity, setAddQuantity] = useState('1');
  const [addDelivery, setAddDelivery] = useState<DeliveryTimeline>('Immediate');
  const [addImageUrl, setAddImageUrl] = useState('');
  const [addDescription, setAddDescription] = useState('');

  // Form messages
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Make Offer Modal State
  const [selectedQueue, setSelectedQueue] = useState<QueueEntry | null>(null);
  const [offerListingId, setOfferListingId] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerNotes, setOfferNotes] = useState('');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [vRes, qRes, oRes, bRes] = await Promise.all([
          vehicleService.getAll({ dealerId }),
          queueService.getAll(),
          offerService.getByDealerId(dealerId),
          bookingService.getByDealerId(dealerId),
        ]);

        if (vRes.success && vRes.data) setListings(vRes.data);
        if (qRes.success && qRes.data) setQueues(qRes.data);
        if (oRes.success && oRes.data) setOffers(oRes.data);
        if (bRes.success && bRes.data) setBookings(bRes.data);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [dealerId]);

  // Handle Add Vehicle Form Submission
  const handleAddVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!addBrand.trim() || !addModel.trim() || !addVariant.trim() || !addColor.trim()) {
      setFormError('Please fill in Brand, Model, Variant, and Colour.');
      return;
    }

    const exPrice = Number(addExShowroom);
    const offerPriceNum = Number(addOfferPrice);
    if (!exPrice || exPrice <= 0 || !offerPriceNum || offerPriceNum <= 0) {
      setFormError('Please enter valid positive pricing.');
      return;
    }

    const payload: CreateVehicleListingData = {
      dealerId,
      brand: addBrand.trim(),
      model: addModel.trim(),
      variant: addVariant.trim(),
      year: parseInt(addYear, 10) || 2024,
      fuelType: addFuel,
      transmission: addTrans,
      color: addColor.trim(),
      mileage: parseInt(addMileage, 10) || 0,
      condition: 'new',
      exShowroomPrice: exPrice,
      onRoadPrice: Number(addOnRoad) || Math.round(exPrice * 1.12),
      dealerOfferPrice: offerPriceNum,
      quantity: parseInt(addQuantity, 10) || 1,
      deliveryTimeline: addDelivery,
      availability: (parseInt(addQuantity, 10) || 1) > 0 ? 'available' : 'out_of_stock',
      description: addDescription.trim() || `${addBrand} ${addModel} ${addVariant} with factory equipment and showroom warranty.`,
      images: addImageUrl.trim()
        ? [addImageUrl.trim()]
        : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'],
    };

    const res = await vehicleService.create(payload);
    if (res.success && res.data) {
      monitor.refresh();
      setListings(prev => [res.data as VehicleListing, ...prev]);
      setFeedback({ type: 'success', message: `Vehicle "${addBrand} ${addModel} ${addVariant}" successfully added to your inventory!` });
      setTimeout(() => setFeedback(null), 3500);

      // Reset form
      setAddColor('');
      setAddExShowroom('');
      setAddOnRoad('');
      setAddOfferPrice('');
      setAddQuantity('1');
      setAddDescription('');
      setAddImageUrl('');
      setActiveTab('inventory');
    } else {
      setFormError(res.error || 'Failed to add vehicle.');
    }
  };

  // Handle Quick Price Update
  const handleOpenPriceModal = (l: VehicleListing) => {
    setPriceModalListing(l);
    setEditExShowroom(String(l.exShowroomPrice || l.price));
    setEditOnRoad(String(l.onRoadPrice || Math.round(l.price * 1.12)));
    setEditOfferPrice(String(l.dealerOfferPrice || l.price));
  };

  const handleSavePriceModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceModalListing) return;

    const offerPriceNum = Number(editOfferPrice);
    if (!offerPriceNum || offerPriceNum <= 0) return;

    const res = await vehicleService.updatePrice(priceModalListing.id, {
      exShowroomPrice: Number(editExShowroom) || undefined,
      onRoadPrice: Number(editOnRoad) || undefined,
      dealerOfferPrice: offerPriceNum,
    });

    if (res.success && res.data) {
      monitor.refresh();
      setListings(prev => prev.map(l => (l.id === priceModalListing.id ? (res.data as VehicleListing) : l)));
      setPriceModalListing(null);
      setFeedback({ type: 'success', message: 'Pricing updated successfully.' });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // Handle Quick Availability Update
  const handleUpdateAvailability = async (id: string, newStatus: VehicleAvailabilityStatus) => {
    const res = await vehicleService.updateAvailability(id, newStatus);
    if (res.success && res.data) {
      monitor.refresh();
      setListings(prev => prev.map(l => (l.id === id ? (res.data as VehicleListing) : l)));
      setFeedback({ type: 'success', message: `Vehicle status changed to ${newStatus.replace('_', ' ')}.` });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // Handle Delete Vehicle
  const handleDeleteListing = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from your inventory?`)) return;

    const res = await vehicleService.delete(id);
    if (res.success) {
      monitor.refresh();
      setListings(prev => prev.filter(l => l.id !== id));
      setFeedback({ type: 'success', message: 'Vehicle deleted from your inventory.' });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // Handle Full Edit Save
  const handleSaveFullEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;

    const res = await vehicleService.update(editingListing.id, editingListing);
    if (res.success && res.data) {
      monitor.refresh();
      setListings(prev => prev.map(l => (l.id === editingListing.id ? (res.data as VehicleListing) : l)));
      setEditingListing(null);
      setFeedback({ type: 'success', message: 'Vehicle details updated successfully.' });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const matchingListings = (queue: QueueEntry) => listings.filter(listing =>
    listing.vehicleModelId === queue.vehicleModelId && (!queue.variantId || listing.variantId === queue.variantId) &&
    (!queue.city || cityKey(listing.dealer?.city) === cityKey(queue.city))
  );

  // Handle Send Direct Offer to Queue Member
  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQueue || !pricingService.isValid(Number(offerPrice))) return;
    const listing = matchingListings(selectedQueue).find(item => item.id === offerListingId);
    if (!listing) return;

    const res = await offerService.create({
      queueEntryId: selectedQueue.id,
      customerId: selectedQueue.customerId,
      customerName: selectedQueue.customerName || 'Customer',
      dealerId,
      dealerName: user?.dealerProfile?.dealershipName || 'Premier Auto Group',
      vehicleModelId: selectedQueue.vehicleModelId,
      listingId: listing.id,
      vehicleName: `${listing.brand} ${listing.model}`,
      variantName: listing.variant,
      color: listing.color,
      offeredPrice: Number(offerPrice),
      originalPrice: pricingService.current(listing),
      status: 'pending',
      expiryDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      notes: offerNotes || 'Exclusive dealer priority offer with immediate allocation guarantee.',
    });

    if (res.success && res.data) {
      monitor.refresh();
      setOffers(prev => [res.data as Offer, ...prev]);
      setSelectedQueue(null);
      setOfferPrice('');
      setOfferNotes('');
      setFeedback({ type: 'success', message: 'Direct offer transmitted to customer!' });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // Inventory Statistics
  const totalListed = listings.length;
  const availableVehicles = listings.filter(l => l.availability === 'available').length;
  const outOfStockVehicles = listings.filter(l => l.availability === 'out_of_stock' || l.quantity === 0).length;
  const reservedVehicles = listings.filter(l => l.availability === 'reserved').length;
  const recentlyAdded = [...listings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);

  // Dynamic filter lists
  const availableBrands = ['all', ...Array.from(new Set(listings.map(l => l.brand).filter(Boolean)))];
  const availableModels = ['all', ...Array.from(new Set(
    listings
      .filter(l => filterBrand === 'all' || l.brand === filterBrand)
      .map(l => l.model)
      .filter(Boolean)
  ))];
  const availableVariants = ['all', ...Array.from(new Set(
    listings
      .filter(l => (filterBrand === 'all' || l.brand === filterBrand) && (filterModel === 'all' || l.model === filterModel))
      .map(l => l.variant)
      .filter(Boolean)
  ))];

  // Filtered Listings
  const filteredListings = listings.filter(l => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      l.brand.toLowerCase().includes(term) ||
      l.model.toLowerCase().includes(term) ||
      l.variant.toLowerCase().includes(term) ||
      l.color.toLowerCase().includes(term);

    const matchesBrand = filterBrand === 'all' || l.brand === filterBrand;
    const matchesModel = filterModel === 'all' || l.model === filterModel;
    const matchesVariant = filterVariant === 'all' || l.variant === filterVariant;
    const matchesStatus = filterStatus === 'all' || l.availability === filterStatus;

    return matchesSearch && matchesBrand && matchesModel && matchesVariant && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {user?.dealerProfile?.dealershipName || 'Dealership Inventory & Workspace'}
            </h1>
            <Badge variant="info" size="sm">Independent Inventory</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
            <Building2 size={13} className="text-slate-400" />
            <span>Showroom: {user?.dealerProfile?.city || 'Los Angeles'}, {user?.dealerProfile?.state || 'CA'}</span>
            <span>•</span>
            <span>ID: <code className="font-mono text-slate-700">{dealerId}</code></span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => setActiveTab('add-vehicle')}
            leftIcon={<Plus size={16} />}
          >
            Add New Vehicle
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 1. REQUIRED INVENTORY OVERVIEW DASHBOARD (5 KEY METRICS) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        <Card padding="sm" className="border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Car size={20} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Listed</p>
              <p className="text-xl font-bold text-slate-900">{totalListed}</p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="border-emerald-200 bg-emerald-50/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-emerald-800 uppercase">Available</p>
              <p className="text-xl font-bold text-emerald-900">{availableVehicles}</p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="border-amber-200 bg-amber-50/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-amber-800 uppercase">Reserved</p>
              <p className="text-xl font-bold text-amber-900">{reservedVehicles}</p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="border-red-200 bg-red-50/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 text-red-700 rounded-xl">
              <XCircle size={20} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-red-800 uppercase">Out of Stock</p>
              <p className="text-xl font-bold text-red-900">{outOfStockVehicles}</p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="border-slate-200 col-span-2 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Queue Demand</p>
              <p className="text-xl font-bold text-slate-900">{queues.length} Buyers</p>
            </div>
          </div>
        </Card>
      </div>

      {/* RECENTLY ADDED VEHICLES TICKER */}
      {recentlyAdded.length > 0 && (
        <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            <Sparkles size={14} className="text-blue-600" />
            Recently Added:
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {recentlyAdded.map(r => (
              <span key={r.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg text-slate-700 font-medium border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                {r.brand} {r.model} {r.variant} • {formatCurrency(r.dealerOfferPrice || r.price)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* WORKSPACE NAVIGATION TABS */}
      <div className="border-b border-slate-200 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'inventory'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Car size={15} />
          Inventory Management ({listings.length})
        </button>

        <button
          onClick={() => setActiveTab('add-vehicle')}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'add-vehicle'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Plus size={15} />
          Register Vehicle
        </button>

        <button
          onClick={() => setActiveTab('queues')}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'queues'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users size={15} />
          Queue Demand ({queues.length})
        </button>

        <button
          onClick={() => setActiveTab('offers')}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'offers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send size={15} />
          Sent Offers ({offers.length})
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
          Bookings ({bookings.length})
        </button>
        <button onClick={() => setActiveTab('demand')} className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 ${activeTab === 'demand' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>
          Demand Trends
        </button>
      </div>

      {/* TAB 1: INVENTORY MANAGEMENT DASHBOARD & SEARCH/FILTERS */}
      {activeTab === 'demand' && <MarketMonitoring monitor={monitor} dealerId={dealerId} />}

      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Search and Cascading Filter Controls */}
          <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Search by brand, model, variant, colour..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  leftElement={<Search size={15} />}
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700"
                >
                  <option value="all">All Statuses</option>
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
            </div>

            {/* Cascading Filter Dropdowns: Brand -> Model -> Variant */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold uppercase text-[10px]">
                <Filter size={12} /> Filter By:
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Brand:</span>
                <select
                  value={filterBrand}
                  onChange={e => {
                    setFilterBrand(e.target.value);
                    setFilterModel('all');
                    setFilterVariant('all');
                  }}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-md bg-slate-50 font-medium text-slate-800"
                >
                  {availableBrands.map(b => (
                    <option key={b} value={b}>{b === 'all' ? 'All Brands' : b}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Model:</span>
                <select
                  value={filterModel}
                  onChange={e => {
                    setFilterModel(e.target.value);
                    setFilterVariant('all');
                  }}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-md bg-slate-50 font-medium text-slate-800"
                >
                  {availableModels.map(m => (
                    <option key={m} value={m}>{m === 'all' ? 'All Models' : m}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Variant:</span>
                <select
                  value={filterVariant}
                  onChange={e => setFilterVariant(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-md bg-slate-50 font-medium text-slate-800"
                >
                  {availableVariants.map(v => (
                    <option key={v} value={v}>{v === 'all' ? 'All Variants' : v}</option>
                  ))}
                </select>
              </div>

              {(filterBrand !== 'all' || filterModel !== 'all' || filterVariant !== 'all' || filterStatus !== 'all' || searchTerm) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterBrand('all');
                    setFilterModel('all');
                    setFilterVariant('all');
                    setFilterStatus('all');
                  }}
                  className="text-xs text-blue-600 hover:underline font-medium ml-auto"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* INVENTORY TABLE */}
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Vehicle / Specs</th>
                    <th className="px-5 py-3">Colour & Qty</th>
                    <th className="px-5 py-3">Pricing Structure</th>
                    <th className="px-5 py-3">Delivery Timeline</th>
                    <th className="px-5 py-3">Availability</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredListings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400 text-xs">
                        No vehicle listings match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredListings.map(v => (
                      <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                              <img
                                src={v.images[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80'}
                                alt={v.model}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-tight">
                                {v.brand} {v.model}
                              </p>
                              <p className="text-xs text-slate-500 font-medium">
                                {v.variant} • {v.year}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 font-medium text-slate-600">
                                  {v.fuelType}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 font-medium text-slate-600">
                                  {v.transmission}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-xs">
                          <p className="font-semibold text-slate-800">{v.color}</p>
                          <p className="text-slate-500 mt-0.5 font-medium">
                            Stock: <span className={v.quantity === 0 ? 'text-red-600 font-bold' : 'text-slate-800 font-semibold'}>{v.quantity} units</span>
                          </p>
                        </td>

                        <td className="px-5 py-4 text-xs">
                          <div className="space-y-0.5">
                            <p className="font-bold text-sm text-slate-900">
                              Offer: {formatCurrency(v.dealerOfferPrice || v.price)}
                            </p>
                            {monitor.markets.filter(market => market.key === marketKey(v.vehicleModelId, v.variantId, v.dealer?.city))
                              .map(market => <DemandBadge key={market.key} market={market} />)}
                            <p className="text-slate-400 text-[11px]">
                              Ex-Showroom: {formatCurrency(v.exShowroomPrice || v.price)}
                            </p>
                            <p className="text-slate-400 text-[11px]">
                              On-Road: {formatCurrency(v.onRoadPrice || Math.round(v.price * 1.12))}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-xs font-medium text-slate-700">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold">
                            <Clock size={12} />
                            {v.deliveryTimeline || 'Immediate'}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <select
                            value={v.availability}
                            onChange={e => handleUpdateAvailability(v.id, e.target.value as VehicleAvailabilityStatus)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer ${
                              v.availability === 'available'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : v.availability === 'reserved'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            <option value="available">Available</option>
                            <option value="reserved">Reserved</option>
                            <option value="out_of_stock">Out of Stock</option>
                            <option value="sold">Sold</option>
                          </select>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenPriceModal(v)}
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Update Price"
                            >
                              <DollarSign size={16} />
                            </button>

                            <button
                              onClick={() => setEditingListing(v)}
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Vehicle"
                            >
                              <Edit3 size={16} />
                            </button>

                            <button
                              onClick={() => handleDeleteListing(v.id, `${v.brand} ${v.model}`)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Vehicle"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: REGISTER NEW VEHICLE FORM (WITH ALL REQUIRED FIELDS) */}
      {activeTab === 'add-vehicle' && (
        <Card padding="lg" className="max-w-3xl mx-auto border-slate-200">
          <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Register New Vehicle to Inventory</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Each listing is independently managed by your dealership with your own pricing and delivery terms.
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-400">Dealer: {dealerId}</span>
          </div>

          {formError && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-700">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleAddVehicleSubmit} className="space-y-5">
            {/* 1. Manufacturer / Brand / Model / Variant */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Manufacturer / Brand"
                placeholder="e.g. Toyota, Honda, Ford"
                value={addBrand}
                onChange={e => setAddBrand(e.target.value)}
                required
              />

              <Input
                label="Car Model"
                placeholder="e.g. Camry, Accord, F-150"
                value={addModel}
                onChange={e => setAddModel(e.target.value)}
                required
              />

              <Input
                label="Variant / Trim"
                placeholder="e.g. LE, XSE, Sport"
                value={addVariant}
                onChange={e => setAddVariant(e.target.value)}
                required
              />
            </div>

            {/* 2. Specs: Year, Fuel Type, Transmission, Colour */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Input
                label="Manufacturing Year"
                type="number"
                placeholder="2024"
                value={addYear}
                onChange={e => setAddYear(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Fuel Type
                </label>
                <select
                  value={addFuel}
                  onChange={e => setAddFuel(e.target.value as FuelType)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white font-medium text-slate-800"
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="CNG">CNG</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Transmission
                </label>
                <select
                  value={addTrans}
                  onChange={e => setAddTrans(e.target.value as TransmissionType)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white font-medium text-slate-800"
                >
                  <option value="Automatic">Automatic</option>
                  <option value="Manual">Manual</option>
                  <option value="CVT">CVT</option>
                  <option value="DCT">DCT</option>
                  <option value="Single-Speed">Single-Speed</option>
                </select>
              </div>

              <Input
                label="Exterior Colour"
                placeholder="e.g. Midnight Black"
                value={addColor}
                onChange={e => setAddColor(e.target.value)}
                required
              />
            </div>

            {/* 3. Pricing: Ex-Showroom, On-Road, Dealer Offer Price */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign size={14} className="text-blue-600" />
                Dealership Pricing Breakdown (USD)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Ex-Showroom Price"
                  type="number"
                  placeholder="e.g. 26500"
                  value={addExShowroom}
                  onChange={e => setAddExShowroom(e.target.value)}
                  required
                />

                <Input
                  label="On-Road Price (Est.)"
                  type="number"
                  placeholder="e.g. 29500"
                  value={addOnRoad}
                  onChange={e => setAddOnRoad(e.target.value)}
                  required
                />

                <Input
                  label="Dealer Offer Price (Customer)"
                  type="number"
                  placeholder="e.g. 28200"
                  value={addOfferPrice}
                  onChange={e => setAddOfferPrice(e.target.value)}
                  hint="Competitive final purchase price"
                  required
                />
              </div>
            </div>

            {/* 4. Quantity & Delivery Availability */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Available Quantity"
                type="number"
                placeholder="1"
                value={addQuantity}
                onChange={e => setAddQuantity(e.target.value)}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Delivery Availability
                </label>
                <select
                  value={addDelivery}
                  onChange={e => setAddDelivery(e.target.value as DeliveryTimeline)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white font-medium text-slate-800"
                >
                  <option value="Immediate">Immediate Delivery</option>
                  <option value="Within 7 days">Within 7 days</option>
                  <option value="Within 15 days">Within 15 days</option>
                  <option value="Within 30 days">Within 30 days</option>
                  <option value="30+ days">30+ days</option>
                </select>
              </div>

              <Input
                label="Odometer Mileage"
                type="number"
                placeholder="0"
                value={addMileage}
                onChange={e => setAddMileage(e.target.value)}
              />
            </div>

            {/* 5. Images & Description */}
            <Input
              label="Vehicle Image URL"
              placeholder="https://images.unsplash.com/photo-..."
              value={addImageUrl}
              onChange={e => setAddImageUrl(e.target.value)}
              hint="Paste external vehicle image link or leave empty for verified stock photo"
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Vehicle Description & Showroom Inclusions
              </label>
              <textarea
                rows={3}
                value={addDescription}
                onChange={e => setAddDescription(e.target.value)}
                placeholder="Include details such as factory warranty, dealer discounts, ceramic coating, complimentary maintenance..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={() => setActiveTab('inventory')}>
                Cancel
              </Button>
              <Button type="submit" size="md">
                Publish Vehicle Listing
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 3: QUEUE DEMAND */}
      {activeTab === 'queues' && (
        <Card padding="none">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <CardHeader
              title="Active Customer Queue Demand"
              subtitle="Customer waitlist requests for vehicles across all dealerships. Make a targeted offer to win the buyer."
            />
          </div>

          <div className="divide-y divide-slate-100">
            {queues.map(q => (
              <div key={q.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center font-bold text-blue-700">
                    <span className="text-[9px] uppercase font-semibold">Rank</span>
                    <span className="text-base leading-none">#{q.position}</span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      {q.vehicleModel?.make} {q.vehicleModel?.model}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Buyer: <span className="font-semibold text-slate-700">{q.customerName}</span> ({q.customerPhone || 'Contact verified'})
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Waiting since {formatDate(q.createdAt)} • Status: <span className="font-semibold text-blue-600 capitalize">{q.status}</span>
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  disabled={!isActiveQueue(q) || !matchingListings(q).length}
                  onClick={() => {
                    setSelectedQueue(q);
                    setOfferListingId(matchingListings(q)[0]?.id ?? '');
                    setOfferPrice('');
                  }}
                  leftIcon={<Send size={14} />}
                >
                  Send Direct Offer
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 4: OFFERS SENT */}
      {activeTab === 'offers' && (
        <Card padding="none">
          <div className="p-5 border-b border-slate-100">
            <CardHeader
              title="Sent Direct Customer Offers"
              subtitle="Special incentives and dealer discounts submitted to waitlist queue members."
            />
          </div>

          <div className="divide-y divide-slate-100">
            {offers.map(o => (
              <div key={o.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900">{o.vehicleName}</h4>
                    <Badge variant={o.status === 'accepted' ? 'success' : o.status === 'pending' ? 'warning' : 'neutral'}>
                      {o.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Target Buyer: <span className="font-semibold text-slate-700">{o.customerName}</span> • Sent {formatDate(o.createdAt)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{o.notes}</p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(o.offeredPrice)}</p>
                  <p className="text-xs text-slate-400">Regular: {formatCurrency(o.originalPrice)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 5: BOOKINGS */}
      {activeTab === 'bookings' && (
        <Card padding="none">
          <div className="p-5 border-b border-slate-100">
            <CardHeader
              title="Customer Showroom Test Drives & Reservations"
              subtitle="Confirmed appointments from customers."
            />
          </div>

          <div className="divide-y divide-slate-100">
            {bookings.map(b => (
              <div key={b.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900">
                      {b.listing?.brand || 'Vehicle'} {b.listing?.model || ''}
                    </h4>
                    <Badge variant={b.status === 'confirmed' ? 'success' : 'warning'}>
                      {b.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customer: <span className="font-semibold text-slate-700">{b.customerName}</span> ({b.customerPhone || 'Phone on file'})
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Notes: {b.notes || 'Inspection reservation.'}</p>
                </div>

                <div className="text-right text-xs text-slate-500">
                  <p className="font-semibold text-slate-800">{formatDate(b.bookingDate)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* MODAL 1: QUICK PRICE UPDATE */}
      {priceModalListing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Update Price Structure
                </h3>
                <p className="text-xs text-slate-500">
                  {priceModalListing.brand} {priceModalListing.model} ({priceModalListing.variant})
                </p>
              </div>
              <button onClick={() => setPriceModalListing(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePriceModal} className="space-y-4">
              <Input
                label="Ex-Showroom Price (USD)"
                type="number"
                value={editExShowroom}
                onChange={e => setEditExShowroom(e.target.value)}
                leftElement={<DollarSign size={15} />}
                required
              />

              <Input
                label="On-Road Price (USD)"
                type="number"
                value={editOnRoad}
                onChange={e => setEditOnRoad(e.target.value)}
                leftElement={<DollarSign size={15} />}
                required
              />

              <Input
                label="Dealer Offer Price (Customer Final)"
                type="number"
                value={editOfferPrice}
                onChange={e => setEditOfferPrice(e.target.value)}
                leftElement={<DollarSign size={15} />}
                hint="This is the primary price displayed on marketplace search and comparisons"
                required
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => setPriceModalListing(null)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Prices
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: FULL VEHICLE EDIT */}
      {editingListing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Edit Vehicle Details ({editingListing.brand} {editingListing.model})
              </h3>
              <button onClick={() => setEditingListing(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveFullEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Variant"
                  value={editingListing.variant}
                  onChange={e => setEditingListing({ ...editingListing, variant: e.target.value })}
                  required
                />
                <Input
                  label="Colour"
                  value={editingListing.color}
                  onChange={e => setEditingListing({ ...editingListing, color: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Dealer Offer Price"
                  type="number"
                  value={editingListing.dealerOfferPrice || editingListing.price}
                  onChange={e => setEditingListing({ ...editingListing, dealerOfferPrice: Number(e.target.value), price: Number(e.target.value) })}
                  required
                />
                <Input
                  label="Available Quantity"
                  type="number"
                  value={editingListing.quantity}
                  onChange={e => setEditingListing({ ...editingListing, quantity: Number(e.target.value) })}
                  required
                />
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Delivery
                  </label>
                  <select
                    value={editingListing.deliveryTimeline}
                    onChange={e => setEditingListing({ ...editingListing, deliveryTimeline: e.target.value as DeliveryTimeline })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Immediate">Immediate</option>
                    <option value="Within 7 days">Within 7 days</option>
                    <option value="Within 15 days">Within 15 days</option>
                    <option value="Within 30 days">Within 30 days</option>
                    <option value="30+ days">30+ days</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editingListing.description}
                  onChange={e => setEditingListing({ ...editingListing, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => setEditingListing(null)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DIRECT OFFER TRANSMISSION */}
      {selectedQueue && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Send Direct Offer to {selectedQueue.customerName}
              </h3>
              <button onClick={() => setSelectedQueue(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSendOffer} className="space-y-4">
              <div>
                <span className="text-xs text-slate-400 block">Queue Target</span>
                <span className="text-sm font-bold text-slate-900">
                  {selectedQueue.vehicleModel?.make} {selectedQueue.vehicleModel?.model} ({selectedQueue.variant?.name || 'Waitlist'})
                </span>
              </div>

              <label className="block text-sm font-semibold text-slate-700">
                Dealer listing
                <select value={offerListingId} onChange={event => setOfferListingId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-2" required>
                  {matchingListings(selectedQueue).map(listing => <option key={listing.id} value={listing.id}>{listing.variant} · {listing.color} · Listed at {formatCurrency(pricingService.current(listing))}</option>)}
                </select>
              </label>

              <Input
                label="Offer Price (USD)"
                type="number"
                placeholder="e.g. 27800"
                value={offerPrice}
                onChange={e => setOfferPrice(e.target.value)}
                leftElement={<DollarSign size={16} />}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Incentives / Delivery Offer
                </label>
                <textarea
                  rows={3}
                  value={offerNotes}
                  onChange={e => setOfferNotes(e.target.value)}
                  placeholder="e.g. Immediate delivery from showroom, $1,000 cash discount, complimentary accessories..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => setSelectedQueue(null)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Send Offer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
