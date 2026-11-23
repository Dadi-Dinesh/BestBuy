import { ListingPriceChange } from '../../components/demand/ListingPriceChange';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Car,
  Building2,
  Calendar,
  Fuel,
  Gauge,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Tag,
  AlertCircle,
  Phone,
  MapPin,
  ChevronRight,
  TrendingDown,
  Info,
  Layers,
  Sparkles,
  Award,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { vehicleService } from '../../services/vehicleService';
import { queueService } from '../../services/queueService';
import { bookingService } from '../../services/bookingService';
import { VehicleListing } from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';

interface VehicleDetailsPageProps {
  listingId?: string;
  onBack?: () => void;
}

export const VehicleDetailsPage: React.FC<VehicleDetailsPageProps> = ({
  listingId: propListingId,
  onBack,
}) => {
  const { id: routeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const activeListingId = propListingId || routeId;

  const [listing, setListing] = useState<VehicleListing | null>(null);
  const [allListings, setAllListings] = useState<VehicleListing[]>([]);
  const [matchingDealers, setMatchingDealers] = useState<VehicleListing[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modals state
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [isJoiningQueue, setIsJoiningQueue] = useState(false);

  const [bookingDealerListing, setBookingDealerListing] = useState<VehicleListing | null>(null);
  const [bookingDate, setBookingDate] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [bookingNotes, setBookingNotes] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  useEffect(() => {
    async function loadVehicleData() {
      if (!activeListingId) return;
      setIsLoading(true);
      try {
        const [singleRes, allRes] = await Promise.all([
          vehicleService.getById(activeListingId),
          vehicleService.getAll({ marketplace: true }),
        ]);

        if (singleRes.success && singleRes.data && allRes.data?.some(item => item.id === activeListingId)) {
          setListing(singleRes.data);

          if (allRes.success && allRes.data) {
            setAllListings(allRes.data);
            // Find all dealers listing the same model and variant
            const matching = allRes.data.filter(
              item =>
                item.brand.toLowerCase() === singleRes.data!.brand.toLowerCase() &&
                item.model.toLowerCase() === singleRes.data!.model.toLowerCase() &&
                item.variant.toLowerCase() === singleRes.data!.variant.toLowerCase()
            );
            // Sort matching dealers: lowest price first for clean comparison
            matching.sort((a, b) => a.dealerOfferPrice - b.dealerOfferPrice);
            setMatchingDealers(matching.length > 0 ? matching : [singleRes.data]);
          }
        } else {
          setListing(null);
          setMatchingDealers([]);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadVehicleData();
  }, [activeListingId]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/browse');
    }
  };

  const handleJoinQueue = async () => {
    if (!listing || !user) return;
    setIsJoiningQueue(true);
    const res = await queueService.join({
      customerId: user.id,
      vehicleModelId: listing.vehicleModelId,
      variantId: listing.variantId,
      city: listing.dealer?.city,
      state: listing.dealer?.state,
    });
    setIsJoiningQueue(false);
    setShowQueueModal(false);

    if (res.success) {
      setActionSuccess(
        `Successfully joined waitlist queue for ${listing.brand} ${listing.model} (${listing.variant})!`
      );
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDealerListing || !user) return;
    setIsSubmittingBooking(true);
    setBookingError(null);

    const res = await bookingService.create({
      customerId: user.id,
      dealerId: bookingDealerListing.dealerId,
      listingId: bookingDealerListing.id,
      lockedPrice: bookingDealerListing.dealerOfferPrice,
      bookingDate,
      notes: bookingNotes || `Showroom visit & test drive scheduled for ${formatDate(bookingDate)}.`,
    });

    setIsSubmittingBooking(false);
    setBookingDealerListing(null);

    if (!res.success) {
      setBookingError(res.error || 'The booking could not be created.');
      const updated = await vehicleService.getById(bookingDealerListing.id);
      if (updated.success && updated.data) {
        const listing = updated.data;
        setMatchingDealers(previous => previous.map(item => item.id === listing.id ? listing : item));
        setListing(previous => previous?.id === listing.id ? listing : previous);
      }
    }
    if (res.success) {
      setActionSuccess(
        `Showroom visit confirmed with ${bookingDealerListing.dealer?.dealershipName || 'dealership'}!`
      );
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-600">Loading vehicle specifications and dealer offers...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="py-16 text-center max-w-md mx-auto">
        <AlertCircle size={40} className="mx-auto text-slate-300 mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Vehicle Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          The requested vehicle listing could not be found or has been withdrawn by the dealership.
        </p>
        <Button onClick={handleBack} variant="secondary" leftIcon={<ArrowLeft size={16} />}>
          Back to Vehicle Catalog
        </Button>
      </div>
    );
  }

  const lowestPrice = Math.min(...matchingDealers.map(d => d.dealerOfferPrice));
  const highestPrice = Math.max(...matchingDealers.map(d => d.dealerOfferPrice));
  const avgPrice = Math.round(
    matchingDealers.reduce((sum, d) => sum + d.dealerOfferPrice, 0) / matchingDealers.length
  );
  const images = listing.images && listing.images.length > 0
    ? listing.images
    : ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={handleBack}
            className="text-slate-600 hover:text-blue-600 font-medium flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Search
          </button>
          <span>/</span>
          <span>{listing.brand}</span>
          <span>/</span>
          <span>{listing.model}</span>
          <span>/</span>
          <span className="font-semibold text-slate-800">{listing.variant}</span>
        </div>

        {bookingError && <p role="alert" className="text-sm text-red-700">{bookingError}</p>}
        {actionSuccess && (
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-lg flex items-center gap-2">
            <CheckCircle2 size={14} />
            <span>{actionSuccess}</span>
          </div>
        )}
      </div>

      {/* Vehicle Hero & Key Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative aspect-[16/10] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <img
              src={images[selectedImageIndex] || images[0]}
              alt={`${listing.brand} ${listing.model}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge variant="default" size="sm">
                {listing.year} Model
              </Badge>
              <Badge variant={listing.availability === 'available' ? 'success' : 'warning'} size="sm">
                {listing.availability === 'available' ? 'In Stock' : listing.availability.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                    selectedImageIndex === idx ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Quick specs grid */}
          <Card padding="md" className="border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Core Technical Specifications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 flex items-center gap-1 mb-1">
                  <Fuel size={13} /> Fuel Type
                </span>
                <span className="font-bold text-slate-800">{listing.fuelType}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 flex items-center gap-1 mb-1">
                  <Gauge size={13} /> Transmission
                </span>
                <span className="font-bold text-slate-800">{listing.transmission}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 flex items-center gap-1 mb-1">
                  <Car size={13} /> Exterior Color
                </span>
                <span className="font-bold text-slate-800 truncate block">{listing.color}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 flex items-center gap-1 mb-1">
                  <Clock size={13} /> Delivery Time
                </span>
                <span className="font-bold text-slate-800">{listing.deliveryTimeline}</span>
              </div>
            </div>
          </Card>

          {/* Detailed Description */}
          <Card padding="md" className="border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Vehicle Overview & Condition
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {listing.description || 'Precision-engineered vehicle backed by manufacturer warranty and verified multi-point inspection.'}
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Odometer Mileage: <strong className="text-slate-800">{listing.mileage} miles</strong></span>
              <span>Condition: <strong className="text-slate-800 capitalize">{listing.condition}</strong></span>
              <span>Stock Quantity: <strong className="text-slate-800">{listing.quantity} units</strong></span>
            </div>
          </Card>
        </div>

        {/* Right Column: Pricing & Primary Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card padding="lg" className="border-slate-200 shadow-sm">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                {listing.brand}
              </span>
              <h1 className="text-2xl font-black text-slate-900 mt-0.5">
                {listing.model}
              </h1>
              <p className="text-sm text-slate-500 font-medium">{listing.variant}</p>
            </div>

            {/* Price breakdown box */}
            <div className="my-5 p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Ex-Showroom Base</span>
                <span className="text-xs font-semibold text-slate-700">{formatCurrency(listing.exShowroomPrice)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Estimated On-Road (Taxes & Fees)</span>
                <span className="text-xs font-semibold text-slate-700">{formatCurrency(listing.onRoadPrice)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Dealer Offer Price
                  </span>
                  <span className="text-2xl font-extrabold text-blue-600">
                    {formatCurrency(listing.dealerOfferPrice)}
                  </span>
                </div>
                {listing.dealerOfferPrice < listing.onRoadPrice && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    Save {formatCurrency(listing.onRoadPrice - listing.dealerOfferPrice)}
                  </span>
                )}
              </div>
              <ListingPriceChange listing={listing} />
            </div>

            {/* Showing selected dealer info */}
            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs space-y-1.5 mb-5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 size={14} className="text-blue-600" />
                  {listing.dealer?.dealershipName}
                </span>
                {listing.dealer?.isVerified && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck size={11} /> Verified Dealer
                  </span>
                )}
              </div>
              <p className="text-slate-600 flex items-center gap-1.5">
                <MapPin size={12} className="text-slate-400" />
                {listing.dealer?.address}, {listing.dealer?.city}, {listing.dealer?.state} {listing.dealer?.pinCode}
              </p>
              <p className="text-slate-600 flex items-center gap-1.5">
                <Phone size={12} className="text-slate-400" />
                Showroom Phone: <a href={`tel:${listing.dealer?.phone}`} className="text-blue-600 font-medium hover:underline">{listing.dealer?.phone}</a>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <Button
                className="w-full"
                size="lg"
                onClick={() => setBookingDealerListing(listing)}
                leftIcon={<Calendar size={18} />}
              >
                Book Test Drive / Visit
              </Button>

              <Button
                variant="secondary"
                className="w-full"
                size="md"
                onClick={() => setShowQueueModal(true)}
                leftIcon={<Sparkles size={16} className="text-amber-500" />}
              >
                Join Shared Queue
              </Button>
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-3">
              Explore multiple dealerships freely. Compare options below before making your final selection.
            </p>
          </Card>

          {/* Model Market Stats Summary Card */}
          <Card padding="md" className="border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-3">
              <TrendingDown size={14} className="text-blue-600" />
              Multi-Dealer Market Snapshot
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-semibold">Lowest Price</span>
                <span className="font-bold text-emerald-600 mt-0.5 block">{formatCurrency(lowestPrice)}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-semibold">Average Price</span>
                <span className="font-bold text-slate-700 mt-0.5 block">{formatCurrency(avgPrice)}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-semibold">Dealers</span>
                <span className="font-bold text-blue-600 mt-0.5 block">{matchingDealers.length} Available</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* SECTION: ALL MATCHING DEALERS FOR THIS MODEL & VARIANT */}
      <Card padding="none" className="border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Dealer Price & Availability Comparison
              </h2>
              <Badge variant="info" size="sm">
                {matchingDealers.length} Dealerships
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare all dealerships offering the {listing.brand} {listing.model} ({listing.variant}). Choose any dealer based on price, location, or delivery speed.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-slate-500">Best Deal:</span>
            <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
              {formatCurrency(lowestPrice)}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Dealership & Location</th>
                <th className="px-6 py-3.5">Verification</th>
                <th className="px-6 py-3.5">Offered Price</th>
                <th className="px-6 py-3.5">Stock & Availability</th>
                <th className="px-6 py-3.5">Est. Delivery</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matchingDealers.map(dealerListing => {
                const isLowest = dealerListing.dealerOfferPrice === lowestPrice;
                const isCurrent = dealerListing.id === listing.id;

                return (
                  <tr
                    key={dealerListing.id}
                    className={`transition-colors ${
                      isCurrent ? 'bg-blue-50/40' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Dealer info */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                          <Building2 size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-2">
                            {dealerListing.dealer?.dealershipName || 'Verified Dealership'}
                            {isCurrent && (
                              <span className="text-[10px] font-medium bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded">
                                Current
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={11} className="text-slate-400" />
                            {dealerListing.dealer?.city}, {dealerListing.dealer?.state} ({dealerListing.dealer?.pinCode})
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Tel: {dealerListing.dealer?.phone}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Verification */}
                    <td className="px-6 py-4">
                      {dealerListing.dealer?.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <ShieldCheck size={12} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Clock size={12} /> Pending
                        </span>
                      )}
                    </td>

                    {/* Price with comparison */}
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="text-base font-extrabold text-slate-900">
                          {formatCurrency(dealerListing.dealerOfferPrice)}
                        </p>
                        <ListingPriceChange listing={dealerListing} />
                        {isLowest ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <Award size={12} /> Cheapest Offer
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            +{formatCurrency(dealerListing.dealerOfferPrice - lowestPrice)} vs lowest
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Availability */}
                    <td className="px-6 py-4">
                      <Badge
                        variant={dealerListing.availability === 'available' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {dealerListing.availability === 'available'
                          ? `In Stock (${dealerListing.quantity} units)`
                          : dealerListing.availability.replace('_', ' ')}
                      </Badge>
                    </td>

                    {/* Delivery */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                        <Clock size={13} className="text-slate-400" />
                        <span>{dealerListing.deliveryTimeline}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isCurrent && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setListing(dealerListing);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                          >
                            View
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant={isLowest ? 'primary' : 'secondary'}
                          onClick={() => setBookingDealerListing(dealerListing)}
                          leftIcon={<Calendar size={13} />}
                        >
                          Book Visit
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

      {/* MODAL 1: JOIN WAITLIST QUEUE */}
      {showQueueModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Join Shared Vehicle Queue</h3>
              </div>
              <button
                onClick={() => setShowQueueModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are joining the shared priority queue for the{' '}
              <strong className="text-slate-900">{listing.brand} {listing.model} ({listing.variant})</strong>. All registered dealers receive notifications and send special discounted offers directly to waitlist members.
            </p>

            <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Applicant Name:</span>
                <span className="font-semibold text-slate-800">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact Email:</span>
                <span className="font-semibold text-slate-800">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Selected Trim:</span>
                <span className="font-semibold text-slate-800">{listing.variant} ({listing.fuelType})</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowQueueModal(false)}
                disabled={isJoiningQueue}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleJoinQueue}
                isLoading={isJoiningQueue}
                leftIcon={<Sparkles size={14} />}
              >
                Confirm & Join Queue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: BOOK VISIT / TEST DRIVE */}
      {bookingDealerListing && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Book Showroom Visit & Test Drive
                </h3>
                <p className="text-xs text-slate-500">
                  {bookingDealerListing.brand} {bookingDealerListing.model} ({bookingDealerListing.variant})
                </p>
              </div>
              <button
                onClick={() => setBookingDealerListing(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs space-y-1">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 size={13} className="text-blue-600" />
                  {bookingDealerListing.dealer?.dealershipName}
                </p>
                <p className="text-slate-600">
                  Showroom: {bookingDealerListing.dealer?.address}, {bookingDealerListing.dealer?.city} ({bookingDealerListing.dealer?.pinCode})
                </p>
                <p className="text-blue-700 font-semibold pt-1">
                  Agreed Dealer Offer: {formatCurrency(bookingDealerListing.dealerOfferPrice)}
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
                  placeholder="E.g., Test drive requested on highway, price negotiation, financing review..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setBookingDealerListing(null)}
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
                  Submit Booking
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
