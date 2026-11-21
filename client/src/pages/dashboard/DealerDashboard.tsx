import React, { useState, useEffect } from 'react';
import {
  Car,
  Plus,
  DollarSign,
  Users,
  ClipboardList,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Building2,
  Send,
  Trash2,
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

export const DealerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const dealerId = user?.dealerProfile?.id || 'd1';

  const [activeTab, setActiveTab] = useState<'inventory' | 'add-vehicle' | 'offers' | 'queues' | 'bookings'>('inventory');

  const [listings, setListings] = useState<VehicleListing[]>([]);
  const [queues, setQueues] = useState<QueueEntry[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Add vehicle form state
  const [newMake, setNewMake] = useState('Toyota');
  const [newModel, setNewModel] = useState('Camry');
  const [newVariant, setNewVariant] = useState('LE');
  const [newPrice, setNewPrice] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newMileage, setNewMileage] = useState('0');
  const [newCondition, setNewCondition] = useState<'new' | 'used' | 'certified'>('new');
  const [newDescription, setNewDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Make offer modal/state
  const [selectedQueue, setSelectedQueue] = useState<QueueEntry | null>(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerNotes, setOfferNotes] = useState('');

  // Status feedback
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
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
    }
    loadData();
  }, [dealerId]);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newPrice || Number(newPrice) <= 0) {
      setFormError('Please enter a valid vehicle listing price.');
      return;
    }
    if (!newColor.trim()) {
      setFormError('Please enter the vehicle color.');
      return;
    }

    const payload = {
      dealerId,
      vehicleModelId: 'vm1',
      variantId: 'vv1',
      price: Number(newPrice),
      color: newColor.trim(),
      mileage: Number(newMileage) || 0,
      condition: newCondition,
      description: newDescription.trim() || `${newMake} ${newModel} ${newVariant} available at our showroom.`,
    };

    const res = await vehicleService.create(payload);
    if (res.success && res.data) {
      const createdListing: VehicleListing = {
        ...res.data,
        vehicleModel: { id: 'vm1', make: newMake, model: newModel, year: 2024, category: 'Sedan', variants: [] },
        variant: { id: 'vv1', name: newVariant, trimLevel: 'Base', engineType: '2.5L Gas', transmission: 'Auto', fuelType: 'Gas', seatingCapacity: 5, features: [] },
      };
      setListings(prev => [createdListing, ...prev]);
      setFormSuccess('New vehicle successfully added to your inventory!');
      setNewPrice('');
      setNewColor('');
      setNewDescription('');
      setTimeout(() => {
        setActiveTab('inventory');
        setFormSuccess('');
      }, 1000);
    } else {
      setFormError(res.error || 'Failed to add vehicle.');
    }
  };

  const handleToggleAvailability = async (id: string, current: string) => {
    const nextAvailability = current === 'available' ? 'reserved' : current === 'reserved' ? 'sold' : 'available';
    const res = await vehicleService.update(id, { availability: nextAvailability });
    if (res.success) {
      setListings(prev =>
        prev.map(l => (l.id === id ? { ...l, availability: nextAvailability as VehicleListing['availability'] } : l))
      );
      setActionFeedback(`Vehicle status updated to ${nextAvailability}.`);
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const handleDeleteListing = async (id: string) => {
    const res = await vehicleService.delete(id);
    if (res.success) {
      setListings(prev => prev.filter(l => l.id !== id));
      setActionFeedback('Vehicle listing removed from inventory.');
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQueue || !offerPrice) return;

    const res = await offerService.create({
      queueEntryId: selectedQueue.id,
      customerId: selectedQueue.customerId,
      customerName: selectedQueue.customerName || 'Customer',
      dealerId,
      dealerName: user?.dealerProfile?.dealershipName || 'Premier Auto Group',
      vehicleModelId: selectedQueue.vehicleModelId,
      vehicleName: `${selectedQueue.vehicleModel?.make} ${selectedQueue.vehicleModel?.model}`,
      variantName: selectedQueue.variant?.name || 'Standard Edition',
      offeredPrice: Number(offerPrice),
      originalPrice: Number(offerPrice) + 1200,
      status: 'pending',
      expiryDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      notes: offerNotes || 'Special dealership priority incentive for waitlist queue member.',
    });

    if (res.success && res.data) {
      setOffers(prev => [res.data as Offer, ...prev]);
      setSelectedQueue(null);
      setOfferPrice('');
      setOfferNotes('');
      setActionFeedback('Special offer successfully transmitted to customer!');
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const handleUpdateBooking = async (id: string, status: Booking['status']) => {
    const res = await bookingService.updateStatus(id, status);
    if (res.success) {
      setBookings(prev => prev.map(b => (b.id === id ? { ...b, status } : b)));
      setActionFeedback(`Booking marked as ${status}.`);
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const totalInventoryValue = listings.reduce((sum, l) => sum + l.price, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {user?.dealerProfile?.dealershipName || 'Dealership Workspace'}
            </h1>
            <Badge variant="default" size="sm">Dealer Partner</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
            <Building2 size={13} className="text-slate-400" />
            <span>Lic: {user?.dealerProfile?.registrationNumber || 'DL-CA-2023-8891'}</span>
            <span>•</span>
            <span>Showroom: {user?.dealerProfile?.city || 'Los Angeles'}, {user?.dealerProfile?.state || 'CA'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {actionFeedback && (
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-lg flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              <span>{actionFeedback}</span>
            </div>
          )}
          <Button
            size="sm"
            onClick={() => setActiveTab('add-vehicle')}
            leftIcon={<Plus size={16} />}
          >
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Car size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Active Inventory</p>
              <p className="text-xl font-bold text-slate-900">{listings.length} Listed</p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Inventory Value</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(totalInventoryValue)}</p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Queue Demand</p>
              <p className="text-xl font-bold text-slate-900">{queues.length} Buyers</p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Booked Showroom Visits</p>
              <p className="text-xl font-bold text-slate-900">{bookings.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
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
          Manage Listings ({listings.length})
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
          Add Vehicle
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
          Customer Offers ({offers.length})
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
          Manage Bookings ({bookings.length})
        </button>
      </div>

      {/* TAB 1: INVENTORY MANAGEMENT TABLE */}
      {activeTab === 'inventory' && (
        <Card padding="none">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <CardHeader
              title="Vehicle Inventory"
              subtitle="Update your real-time prices, toggle availability, or remove listings."
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-3">Vehicle Details</th>
                  <th className="px-6 py-3">Color</th>
                  <th className="px-6 py-3">Condition & Miles</th>
                  <th className="px-6 py-3">Dealership Price</th>
                  <th className="px-6 py-3">Availability</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listings.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                          <Car size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {l.vehicleModel?.make} {l.vehicleModel?.model}
                          </p>
                          <p className="text-xs text-slate-500">{l.variant?.name || 'Base Edition'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs font-medium text-slate-700">{l.color}</td>

                    <td className="px-6 py-4 text-xs text-slate-600">
                      <span className="capitalize font-medium text-slate-800">{l.condition}</span> • {l.mileage} miles
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-900">
                      {formatCurrency(l.price)}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleAvailability(l.id, l.availability)}
                        title="Click to toggle status"
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <Badge
                          variant={
                            l.availability === 'available'
                              ? 'success'
                              : l.availability === 'reserved'
                              ? 'warning'
                              : 'neutral'
                          }
                        >
                          {l.availability} (change)
                        </Badge>
                      </button>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteListing(l.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                        title="Delete listing"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: ADD VEHICLE FORM */}
      {activeTab === 'add-vehicle' && (
        <Card padding="lg" className="max-w-2xl mx-auto border-slate-200">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Add Vehicle to Showroom Inventory</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              List a new vehicle with your customized pricing and availability status.
            </p>
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700">
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-xs font-medium text-green-700">
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleAddVehicle} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Make</label>
                <select
                  value={newMake}
                  onChange={e => setNewMake(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                >
                  <option value="Toyota">Toyota</option>
                  <option value="Honda">Honda</option>
                  <option value="Ford">Ford</option>
                  <option value="Tesla">Tesla</option>
                  <option value="BMW">BMW</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Model</label>
                <input
                  type="text"
                  value={newModel}
                  onChange={e => setNewModel(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                  placeholder="e.g. Camry, Accord, F-150"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Trim / Variant Name"
                placeholder="e.g. XLE Hybrid, Sport"
                value={newVariant}
                onChange={e => setNewVariant(e.target.value)}
                required
              />

              <Input
                label="Listing Price (USD)"
                type="number"
                placeholder="e.g. 32500"
                value={newPrice}
                onChange={e => setNewPrice(e.target.value)}
                leftElement={<DollarSign size={16} />}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Exterior Color"
                placeholder="e.g. Midnight Black"
                value={newColor}
                onChange={e => setNewColor(e.target.value)}
                required
              />

              <Input
                label="Mileage"
                type="number"
                placeholder="0"
                value={newMileage}
                onChange={e => setNewMileage(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Condition</label>
                <select
                  value={newCondition}
                  onChange={e => setNewCondition(e.target.value as 'new' | 'used' | 'certified')}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                >
                  <option value="new">Brand New</option>
                  <option value="certified">Certified Pre-Owned</option>
                  <option value="used">Pre-Owned</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Vehicle Description</label>
              <textarea
                rows={3}
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="Key equipment, factory packages, and warranty details..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setActiveTab('inventory')}>
                Cancel
              </Button>
              <Button type="submit">
                Publish Listing
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 3: QUEUE DEMAND */}
      {activeTab === 'queues' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center gap-3">
            <Sparkles size={20} className="text-amber-700 flex-shrink-0" />
            <p className="text-xs text-amber-900 leading-relaxed">
              <strong>Active Buyer Demand:</strong> Car shoppers join shared model queues. When you have matching inventory or can offer competitive pricing, submit a target offer directly to customers at the top of the queue.
            </p>
          </div>

          <Card padding="none">
            <div className="p-5 border-b border-slate-100">
              <CardHeader
                title="Customer Model Queues"
                subtitle="Customers currently in waitlist queues for car models."
              />
            </div>

            <div className="divide-y divide-slate-100">
              {queues.map(q => (
                <div key={q.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex flex-col items-center justify-center font-bold text-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase">Pos</span>
                      <span className="text-base leading-none">#{q.position}</span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        {q.vehicleModel?.make} {q.vehicleModel?.model}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Customer: <span className="font-semibold text-slate-700">{q.customerName}</span> ({q.customerPhone || 'Verified Buyer'})
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Joined: {formatDate(q.createdAt)} • Status: <span className="capitalize font-medium text-slate-700">{q.status}</span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedQueue(q);
                        setOfferPrice('');
                      }}
                      leftIcon={<Send size={14} />}
                    >
                      Make Direct Offer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Make Offer Modal / Drawer */}
          {selectedQueue && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">
                    Send Offer to {selectedQueue.customerName}
                  </h3>
                  <button onClick={() => setSelectedQueue(null)} className="text-slate-400 hover:text-slate-600">
                    <XCircle size={20} />
                  </button>
                </div>

                <form onSubmit={handleSendOffer} className="space-y-4">
                  <div>
                    <span className="text-xs text-slate-500 block">Target Vehicle</span>
                    <span className="text-sm font-bold text-slate-800">
                      {selectedQueue.vehicleModel?.make} {selectedQueue.vehicleModel?.model} ({selectedQueue.variant?.name || 'Base'})
                    </span>
                  </div>

                  <Input
                    label="Offered Price (USD)"
                    type="number"
                    placeholder="e.g. 29900"
                    value={offerPrice}
                    onChange={e => setOfferPrice(e.target.value)}
                    leftElement={<DollarSign size={16} />}
                    required
                  />

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Incentive Notes / Terms
                    </label>
                    <textarea
                      rows={3}
                      value={offerNotes}
                      onChange={e => setOfferNotes(e.target.value)}
                      placeholder="e.g. Exclusive $1,200 discount, complimentary dealer warranty included."
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
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
      )}

      {/* TAB 4: OFFERS SENT */}
      {activeTab === 'offers' && (
        <Card padding="none">
          <div className="p-5 border-b border-slate-100">
            <CardHeader
              title="Offers Submitted to Customers"
              subtitle="Review active and past price offers sent to queue members."
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
                    Target Customer: <span className="font-semibold text-slate-700">{o.customerName}</span> • Sent {formatDate(o.createdAt)}
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

      {/* TAB 5: BOOKINGS MANAGEMENT */}
      {activeTab === 'bookings' && (
        <Card padding="none">
          <div className="p-5 border-b border-slate-100">
            <CardHeader
              title="Customer Showroom Bookings"
              subtitle="Customer appointments for test drives and vehicle delivery."
            />
          </div>

          <div className="divide-y divide-slate-100">
            {bookings.map(b => (
              <div key={b.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900">
                      {b.listing?.vehicleModel?.make} {b.listing?.vehicleModel?.model}
                    </h4>
                    <Badge variant={b.status === 'confirmed' ? 'success' : 'warning'}>
                      {b.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customer: <span className="font-semibold text-slate-700">{b.customerName}</span> ({b.customerPhone || 'Phone on file'})
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Notes: {b.notes || 'Inspection visit.'}</p>
                </div>

                <div className="flex items-center gap-2">
                  {b.status !== 'confirmed' && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateBooking(b.id, 'confirmed')}
                      leftIcon={<CheckCircle2 size={14} />}
                    >
                      Confirm
                    </Button>
                  )}
                  {b.status !== 'completed' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleUpdateBooking(b.id, 'completed')}
                    >
                      Mark Completed
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
