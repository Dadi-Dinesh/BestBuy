import { indiaDemo } from '../../data/indiaDemo';
import { randomUUID } from 'node:crypto';
import { hashPassword, verifyPassword } from '../passwords';
import { authInput, signup, isIndianLocation } from '../validation';
import { canChangeBooking } from '../../services/bookingTransitions';
import { queueAllocation } from '../../services/queueAllocation';
import { createAuditLog, recordPriceUpdate } from '../../services/auditLog';
import { adminMetrics } from '../../services/adminMetrics';
import { resolveVehicleIdentity } from '../../services/vehicleIdentity';
import { pricingService, type ListingPriceChange } from '../../services/pricingService';
import { IDatabaseAdapter, AdminStats } from '../IDatabaseAdapter';
import {
  User,
  Notification,
  Dealer,
  VehicleListing,
  VehicleModel,
  QueueEntry,
  Booking,
  Offer,
  RegisterData,
  ApiResponse,
  CreateVehicleListingData,
  UpdateVehicleListingData,
  VehicleAvailabilityStatus,
} from '../../types';

export class MockDatabaseAdapter implements IDatabaseAdapter {
  readonly name = 'MockDatabaseAdapter';

  private audit = createAuditLog();
  private canAdmin(id: string) {
    return this._users.some(user => user.id === id && user.role === 'admin');
  }

  private dealerCanTrade(id: string) {
    return this._dealers.some(dealer => dealer.id === id && dealer.status === 'approved');
  }

  private customerSuspended(id: string) {
    return this._users.some(user => user.id === id && user.status === 'suspended');
  }

  private demo = indiaDemo();
  private _users = this.demo.users;
  private _dealers = this.demo.dealers;
  private _vehicleModels: VehicleModel[] = [];
  private _listings = this.demo.listings;
  private _queues = this.demo.queues;
  private _offers = this.demo.offers;
  private _bookings = this.demo.bookings;
  private demoPassword = hashPassword('demo1234');
  private _passwords = new Map(['u1','u2','u3'].map(id => [id, this.demoPassword]));

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  auth = {
    login: async (credentials: { email: string; password: string }) => {
      const input = authInput.safeParse(credentials);
      if (!input.success) return { success:false, error:'Enter a valid email address and password.' };
      const user = this._users.find(u => u.email.toLowerCase() === input.data.email);
      const hash = user ? await this._passwords.get(user.id) : undefined;
      if (!await verifyPassword(input.data.password, hash) || !user) {
        return { success: false, error: 'Invalid email address or password. Please check your credentials.' };
      }
      if (user.status === 'suspended') return { success: false, error: 'This customer account is suspended.' };
      const dealer = user.role === 'dealer' ? this._dealers.find(d => d.userId === user.id) : undefined;
      if (dealer?.status === 'suspended') return { success: false, error: 'This dealership is suspended.' };
      const userWithProfile: User = {
        ...user,
        dealerProfile: dealer,
      };
      return { success: true, data: { user: userWithProfile, token: `mock-jwt-token-${user.id}` } };
    },

    register: async (input: RegisterData) => {
      const parsed = signup.safeParse(input);
      if (!parsed.success) return { success:false, error:'Check the registration fields and try again.' };
      const data = parsed.data;
      if (data.role==='dealer' && !isIndianLocation(data)) return {success:false,error:'Select a listed Indian state and city.'};
      const passwordHash = hashPassword(data.password);
      if (this._users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) {
        return { success: false, error: 'An account with this email address already exists.' };
      }

      const newUserId = randomUUID();
      const newUser: User = {
        id: newUserId,
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        role: data.role,
        createdAt: new Date().toISOString(),
      };

      if (data.role === 'dealer') {
        const newDealer: Dealer = {
          id: randomUUID(),
          userId: newUserId,
          dealershipName: data.dealershipName,
          registrationNumber: data.registrationNumber,
          contactPerson: data.contactPerson,
          phone: data.dealershipPhone,
          email: data.email,
          address: data.address,
          city: data.city,
          state: data.state,
          pinCode: data.pinCode,
          status: 'pending',
          isVerified: false,
          createdAt: new Date().toISOString(),
        };
        this._dealers.push(newDealer);
        newUser.dealerProfile = newDealer;
      }

      this._users.push(newUser);
      this._passwords.set(newUserId, passwordHash);

      return {
        success: true,
        data: {
          user: newUser,
          token: `mock-jwt-token-${newUserId}`,
        },
        message: data.role === 'dealer'
          ? 'Dealer account registered successfully! Your account is pending administrator approval.'
          : 'Customer account created successfully!',
      };
    },

    getUserById: async (id: string) => {
      const user = this._users.find(u => u.id === id);
      if (!user) return { success: false, error: 'User not found.' };
      const dealerProfile = user.role === 'dealer' ? this._dealers.find(dealer => dealer.userId === id) : undefined;
      return { success: true, data: { ...user, dealerProfile } };
    },

    getAllUsers: async () => {
      return { success: true, data: [...this._users] };
    },
  };

  private archivedPriceChanges: ListingPriceChange[] = [];

  vehicles = {
    getPriceChanges: async () => ({
      success: true,
      data: [...this.archivedPriceChanges, ...this._listings.flatMap(listing => pricingService.listingChanges({
        ...listing, dealer: this._dealers.find(dealer => dealer.id === listing.dealerId),
      }))],
    }),

    getAll: async (filters?: Record<string, unknown>) => {
      let result = [...this._listings];
      if (filters?.dealerId) {
        result = result.filter(l => l.dealerId === filters.dealerId);
      }
      if (filters?.availability) {
        result = result.filter(l => l.availability === filters.availability);
      }
      if (filters?.brand) {
        result = result.filter(l => l.brand.toLowerCase() === (filters.brand as string).toLowerCase());
      }
      if (filters?.model) {
        result = result.filter(l => l.model.toLowerCase() === (filters.model as string).toLowerCase());
      }
      if (filters?.variant) {
        result = result.filter(l => l.variant.toLowerCase() === (filters.variant as string).toLowerCase());
      }
      if (filters?.marketplace) result = result.filter(listing => this.dealerCanTrade(listing.dealerId));
      const enriched = result.map(l => ({
        ...l,
        dealer: this._dealers.find(d => d.id === l.dealerId),
        vehicleModel: this._vehicleModels.find(m => m.id === l.vehicleModelId),
      }));
      return { success: true, data: enriched };
    },

    getById: async (id: string) => {
      const listing = this._listings.find(l => l.id === id);
      if (!listing) return { success: false, error: 'Vehicle listing not found.' };
      return {
        success: true,
        data: {
          ...listing,
          dealer: this._dealers.find(d => d.id === listing.dealerId),
          vehicleModel: this._vehicleModels.find(m => m.id === listing.vehicleModelId),
        },
      };
    },

    create: async (data: CreateVehicleListingData | Record<string, unknown>) => {
      const raw = data as Record<string, unknown>;
      const exShowroom = Number(raw.exShowroomPrice) || Number(raw.price) || 25000;
      const dealerOffer = Number(raw.dealerOfferPrice) || Number(raw.price) || exShowroom;
      const onRoad = Number(raw.onRoadPrice) || Math.round(exShowroom * 1.12);

      const brand = (raw.brand as string) || (raw.make as string) || 'Toyota';
      const model = (raw.model as string) || 'Camry';
      const variant = (raw.variant as string) || 'Base';

      if (!pricingService.isValid(dealerOffer)) return { success: false, error: 'Enter a valid positive dealer price.' };
      const dealerId = (raw.dealerId as string) || 'd1';
      if (!this.dealerCanTrade(dealerId)) return { success: false, error: 'Only approved dealers can publish inventory.' };
      const newListing: VehicleListing = {
        id: randomUUID(),
        dealerId,
        dealer: this._dealers.find(dealer => dealer.id === dealerId),
        ...resolveVehicleIdentity({
          brand, model, variant, vehicleModelId: raw.vehicleModelId as string, variantId: raw.variantId as string,
        }, this._listings),
        brand,
        model,
        variant,
        year: Number(raw.year) || 2024,
        fuelType: (data.fuelType as VehicleListing['fuelType']) || 'Petrol',
        transmission: (data.transmission as VehicleListing['transmission']) || 'Automatic',
        color: (data.color as string) || 'Alpine White',
        mileage: Number(data.mileage) || 0,
        condition: (data.condition as VehicleListing['condition']) || 'new',
        price: dealerOffer,
        exShowroomPrice: exShowroom,
        onRoadPrice: onRoad,
        dealerOfferPrice: dealerOffer,
        quantity: typeof data.quantity === 'number' ? data.quantity : 1,
        deliveryTimeline: (data.deliveryTimeline as VehicleListing['deliveryTimeline']) || 'Immediate',
        availability: (data.availability as VehicleAvailabilityStatus) || 'available',
        description: (data.description as string) || `${brand} ${model} ${variant} in brand new condition.`,
        images: Array.isArray(data.images) && data.images.length > 0
          ? data.images
          : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this._listings.unshift(newListing);
      this.audit.record('Listing created', dealerId, newListing.id, `${brand} ${model} ${variant}`);
      return { success: true, data: newListing };
    },

    update: async (id: string, data: UpdateVehicleListingData | Record<string, unknown>) => {
      const idx = this._listings.findIndex(l => l.id === id);
      if (idx === -1) return { success: false, error: 'Vehicle listing not found.' };

      const current = this._listings[idx];
      if (!this.dealerCanTrade(current.dealerId)) return { success: false, error: 'Only approved dealers can update inventory.' };
      const updatedOfferPrice = data.dealerOfferPrice !== undefined
        ? Number(data.dealerOfferPrice)
        : data.price !== undefined
        ? Number(data.price)
        : current.dealerOfferPrice;

      if (!pricingService.isValid(updatedOfferPrice)) return { success: false, error: 'Enter a valid positive dealer price.' };

      this._listings[idx] = {
        ...current,
        ...data,
        dealerId: current.dealerId,
        id: current.id,
        ...pricingService.revise(current, updatedOfferPrice, new Date().toISOString()),
        updatedAt: new Date().toISOString(),
      };
      this.audit.record('Listing updated', current.dealerId, id, `${current.brand} ${current.model} ${current.variant}`);
      recordPriceUpdate(this.audit, current, this._listings[idx]);
      return { success: true, data: { ...this._listings[idx], dealer: this._dealers.find(dealer => dealer.id === this._listings[idx].dealerId) } };
    },

    updatePrice: async (
      id: string,
      prices: { exShowroomPrice?: number; onRoadPrice?: number; dealerOfferPrice: number }
    ) => {
      const idx = this._listings.findIndex(l => l.id === id);
      if (idx === -1) return { success: false, error: 'Vehicle listing not found.' };

      if (!pricingService.isValid(prices.dealerOfferPrice)) return { success: false, error: 'Enter a valid positive dealer price.' };
      const current = this._listings[idx];
      if (!this.dealerCanTrade(current.dealerId)) return { success: false, error: 'Only approved dealers can update inventory.' };
      const updatedAt = new Date().toISOString();
      this._listings[idx] = {
        ...current,
        ...pricingService.revise(current, prices.dealerOfferPrice, updatedAt),
        exShowroomPrice: prices.exShowroomPrice ?? current.exShowroomPrice,
        onRoadPrice: prices.onRoadPrice ?? current.onRoadPrice,
        updatedAt,
      };

      recordPriceUpdate(this.audit, current, this._listings[idx]);
      return { success: true, data: { ...this._listings[idx], dealer: this._dealers.find(dealer => dealer.id === this._listings[idx].dealerId) } };
    },

    updateAvailability: async (id: string, availability: VehicleAvailabilityStatus) => {
      const idx = this._listings.findIndex(l => l.id === id);
      if (idx === -1) return { success: false, error: 'Vehicle listing not found.' };

      const listing = this._listings[idx];
      if (!this.dealerCanTrade(listing.dealerId)) return { success: false, error: 'Only approved dealers can update inventory.' };
      this.audit.record('Listing updated', listing.dealerId, id, `Availability changed to ${availability.replace(/_/g, ' ')}`);
      listing.availability = availability;
      if (availability === 'out_of_stock') {
        this._listings[idx].quantity = 0;
      }
      this._listings[idx].updatedAt = new Date().toISOString();

      return { success: true, data: { ...this._listings[idx], dealer: this._dealers.find(dealer => dealer.id === this._listings[idx].dealerId) } };
    },

    delete: async (id: string, actorId?: string, reason?: string) => {
      const idx = this._listings.findIndex(l => l.id === id);
      if (idx === -1) return { success: false, error: 'Vehicle listing not found.' };
      const current = this._listings[idx];
      if (actorId ? !this.canAdmin(actorId) : !this.dealerCanTrade(current.dealerId)) {
        return { success: false, error: 'Listing removal is unavailable for this account.' };
      }
      if (actorId && !reason?.trim()) return { success: false, error: 'Provide a reason for removing the listing.' };
      const [listing] = this._listings.splice(idx, 1);
      for (const offer of this._offers) {
        if (offer.listingId === id && offer.status === 'pending') offer.status = 'expired';
      }
      this.audit.record('Listing removed', actorId || listing.dealerId, id,
        `${listing.brand} ${listing.model} ${listing.variant}${reason?.trim() ? ` · ${reason.trim()}` : ''}`);
      this.archivedPriceChanges.push(...pricingService.listingChanges({
        ...listing, dealer: this._dealers.find(dealer => dealer.id === listing.dealerId),
      }));
      return { success: true, data: { id } };
    },
  };

  dealers = {
    getAll: async () => {
      return { success: true, data: [...this._dealers] };
    },

    getById: async (id: string) => {
      const dealer = this._dealers.find(d => d.id === id);
      if (!dealer) return { success: false, error: 'Dealership not found.' };
      return { success: true, data: dealer };
    },

    update: async (id: string, data: Record<string, unknown>) => {
      const idx = this._dealers.findIndex(d => d.id === id);
      if (idx === -1) return { success: false, error: 'Dealership not found.' };
      const current = this._dealers[idx];
      this._dealers[idx] = { ...current, ...data, id: current.id, userId: current.userId,
        status: current.status, isVerified: current.isVerified } as Dealer;
      return { success: true, data: this._dealers[idx] };
    },

    updateStatus: async (id: string, status: Dealer['status'], actorId?: string) => {
      if (!actorId || !this.canAdmin(actorId)) return { success: false, error: 'Administrator access is required.' };
      if (!['approved', 'rejected', 'suspended'].includes(status)) return { success: false, error: 'Invalid dealer status.' };
      const idx = this._dealers.findIndex(d => d.id === id);
      if (idx === -1) return { success: false, error: 'Dealership not found.' };
      const dealer = this._dealers[idx];
      if (dealer.status === status) return { success: true, data: dealer };
      this.audit.record('Dealer status changed', actorId, id, `${dealer.dealershipName} · ${dealer.status} → ${status}`);
      this._dealers[idx].status = status;
      this._dealers[idx].isVerified = status === 'approved';
      return { success: true, data: this._dealers[idx] };
    },
  };

  private queueVehicle(entry: QueueEntry) {
    const vehicleModel = this._vehicleModels.find(model => model.id === entry.vehicleModelId);
    return { vehicleModel, variant: vehicleModel?.variants.find(variant => variant.id === entry.variantId) };
  }

  queue = {
    join: async (data: { vehicleModelId: string; customerId: string; variantId?: string; city?: string }) => {
      if (this.customerSuspended(data.customerId)) return { success: false, error: 'This customer account is suspended.' };
      const { existing, position } = queueAllocation(this._queues,data);
      if (existing) return { success:true,data:{ ...existing,...this.queueVehicle(existing) } };
      const customer = this._users.find(u => u.id === data.customerId);
      const entry: QueueEntry = {
        id: randomUUID(),
        vehicleModelId: data.vehicleModelId,
        variantId: data.variantId || '',
        city: data.city,
        customerId: data.customerId,
        customerName: customer?.name || 'Customer',
        customerPhone: customer?.phoneNumber,
        position,
        status: 'waiting',
        createdAt: new Date().toISOString(),
      };
      this._queues.push(entry);
      return { success: true, data: entry };
    },

    getPosition: async (queueId: string) => {
      const entry = this._queues.find(q => q.id === queueId);
      if (!entry) return { success: false, error: 'Queue entry not found.' };
      return { success: true, data: { position: entry.position } };
    },

    leave: async (queueId: string) => {
      const idx = this._queues.findIndex(q => q.id === queueId);
      if (idx === -1) return { success: false, error: 'Queue entry not found.' };
      if (this.customerSuspended(this._queues[idx].customerId)) return { success: false, error: 'This customer account is suspended.' };
      if (!['waiting','offered'].includes(this._queues[idx].status)) return { success:false,error:'This queue entry is no longer active.' };
      this._queues[idx].status = 'cancelled';
      this.expireQueueOffers(queueId);
      return { success: true, data: { id: queueId } };
    },

    getByCustomerId: async (customerId: string) => {
      const userQueues = this._queues
        .filter(q => q.customerId === customerId)
        .map(q => ({
          ...q,
          ...this.queueVehicle(q),
        }));
      return { success: true, data: userQueues };
    },

    getAll: async () => {
      const allQueues = this._queues.map(q => ({
        ...q,
        ...this.queueVehicle(q),
      }));
      return { success: true, data: allQueues };
    },
  };

  private expireQueueOffers(queueId: string) {
    for (const offer of this._offers) {
      if (offer.queueEntryId === queueId && offer.status === 'pending') offer.status = 'expired';
    }
  }

  offers = {
    accept: async (id: string, lockDurationHours: number): Promise<ApiResponse<{ offer: Offer; bookingId: string }>> => {
      const offer = this._offers.find(item => item.id === id);
      if (!offer?.listingId || offer.status !== 'pending' || !(Date.parse(offer.expiryDate) > Date.now())) {
        return { success: false, error: 'This offer is no longer available.' };
      }
      if (this.customerSuspended(offer.customerId)) return { success: false, error: 'This customer account is suspended.' };
      if (![24, 48, 72, 168].includes(lockDurationHours)) {
        return { success: false, error: 'Select a supported price lock duration.' };
      }

      const queue = this._queues.find(item => item.id === offer.queueEntryId);
      if (queue && !['waiting','offered'].includes(queue.status)) return { success:false,error:'This queue entry is no longer active.' };
      const now = Date.now();
      const booking: Booking = {
        id: `booking-${offer.id}`,
        offerId: offer.id,
        customerId: offer.customerId,
        customerName: offer.customerName,
        listingId: offer.listingId,
        dealerId: offer.dealerId,
        vehicleName: offer.vehicleName,
        variantName: offer.variantName,
        color: offer.color,
        status: 'pending',
        lockedPrice: offer.offeredPrice,
        lockDurationHours,
        priceLockedUntil: new Date(now + lockDurationHours * 3_600_000).toISOString(),
        createdAt: new Date(now).toISOString(),
        bookingDate: new Date(now + 2 * 86_400_000).toISOString(),
      };
      this._bookings.unshift(booking);
      this.notify(offer.customerId,'Offer accepted','Your accepted price is locked.','booking');
      this.notify(this._dealers.find(dealer => dealer.id === offer.dealerId)?.userId,
        'Offer accepted',`A customer accepted your offer for ${offer.vehicleName}.`,'booking');
      this.audit.record('Booking accepted', offer.customerId, booking.id, `Accepted offer ${offer.id} · ${offer.vehicleName}`);
      offer.status = 'accepted';
      if (queue) {
        queue.status = 'booked';
        this.expireQueueOffers(queue.id);
      }
      return { success: true, data: { offer, bookingId: booking.id } };
    },

    getAll: async () => {
      return { success: true, data: [...this._offers] };
    },

    getByCustomerId: async (customerId: string) => {
      return {
        success: true,
        data: this._offers.filter(o => o.customerId === customerId),
      };
    },

    getByDealerId: async (dealerId: string) => {
      return {
        success: true,
        data: this._offers.filter(o => o.dealerId === dealerId),
      };
    },

    create: async (data: Omit<Offer, 'id' | 'createdAt'>) => {
      if (!this.dealerCanTrade(data.dealerId)) return { success: false, error: 'Only approved dealers can send offers.' };
      if (this.customerSuspended(data.customerId)) return { success: false, error: 'This customer account is suspended.' };
      const listing = this._listings.find(item => item.id === data.listingId && item.dealerId === data.dealerId);
      if (!listing || !pricingService.isValid(data.offeredPrice)) {
        return { success: false, error: 'Select a dealer listing and enter a valid offer price.' };
      }
      const queue = this._queues.find(entry => entry.id === data.queueEntryId);
      if (!queue || queue.customerId !== data.customerId || !['waiting','offered'].includes(queue.status) ||
          queue.vehicleModelId !== listing.vehicleModelId || (queue.variantId && queue.variantId !== listing.variantId) ||
          (queue.city && queue.city.toLowerCase() !== this._dealers.find(dealer => dealer.id === data.dealerId)?.city.toLowerCase())) {
        return { success:false,error:'Choose an active customer in the listing’s shared queue.' };
      }
      if (!(Date.parse(data.expiryDate) > Date.now())) return { success:false,error:'Choose a future offer expiration.' };
      const newOffer: Offer = {
        ...data,status:'pending',customerName:queue.customerName,
        vehicleName:`${listing.brand} ${listing.model}`,variantName:listing.variant,vehicleModelId:listing.vehicleModelId,
        originalPrice: pricingService.current(listing),
        id: randomUUID(),
        createdAt: new Date().toISOString(),
      };
      this._offers.push(newOffer);
      this.notify(newOffer.customerId,'New dealer offer',`You received an offer for the ${newOffer.vehicleName}.`,'offer');
      queue.status = 'offered';
      this.audit.record('Offer created', newOffer.dealerId, newOffer.id, `${newOffer.vehicleName} · ${newOffer.customerId}`);
      return { success: true, data: newOffer };
    },

    updateStatus: async (id: string, status: Offer['status']) => {
      const offer = this._offers.find(o => o.id === id);
      if (!offer) return { success: false, error: 'Offer not found.' };
      if (offer.status !== 'pending' || !['declined','expired'].includes(status) || !(Date.parse(offer.expiryDate) > Date.now())) {
        return { success: false, error: 'This offer status cannot be changed.' };
      }
      offer.status = status;
      if (status === 'declined') this.notify(this._dealers.find(dealer => dealer.id === offer.dealerId)?.userId,
        'Offer declined',`Your offer for ${offer.vehicleName} was declined.`,'offer');
      const queue = this._queues.find(entry => entry.id === offer.queueEntryId);
      if (queue?.status === 'offered' && !this._offers.some(item => item.queueEntryId === queue.id &&
        item.status === 'pending' && Date.parse(item.expiryDate) > Date.now())) queue.status = 'waiting';
      return { success: true, data: offer };
    },
  };

  bookings = {
    getAll: async () => {
      const enriched = this._bookings.map(b => ({
        ...b,
        listing: this._listings.find(l => l.id === b.listingId),
        dealer: this._dealers.find(d => d.id === b.dealerId),
      }));
      return { success: true, data: enriched };
    },

    create: async (data: { customerId: string; listingId: string; dealerId: string; notes?: string; lockedPrice?: number; bookingDate?: string }) => {
      if (this.customerSuspended(data.customerId)) return { success: false, error: 'This customer account is suspended.' };
      if (!this.dealerCanTrade(data.dealerId)) return { success: false, error: 'This dealer is unavailable for new bookings.' };
      const listing = this._listings.find(item => item.id === data.listingId && item.dealerId === data.dealerId);
      if (!listing) return { success: false, error: 'Vehicle listing not found.' };
      const lockedPrice = pricingService.current(listing);
      if (data.lockedPrice !== undefined && data.lockedPrice !== lockedPrice) {
        return { success: false, error: 'The dealer price changed. Review the current listing price before booking.' };
      }
      const now = Date.now();
      const customer = this._users.find(u => u.id === data.customerId);
      const booking: Booking = {
        id: randomUUID(),
        customerId: data.customerId,
        customerName: customer?.name || 'Customer',
        customerPhone: customer?.phoneNumber,
        listingId: data.listingId,
        dealerId: data.dealerId,
        status: 'pending',
        bookingDate: data.bookingDate || new Date(now).toISOString(),
        createdAt: new Date(now).toISOString(),
        lockedPrice,
        lockDurationHours: 72,
        priceLockedUntil: new Date(now + 72 * 3_600_000).toISOString(),
        vehicleName: `${listing.brand} ${listing.model}`,
        variantName: listing.variant,
        color: listing.color,
        notes: data.notes,
        listing,
        dealer: this._dealers.find(d => d.id === data.dealerId),
      };
      this._bookings.push(booking);
      this.notify(booking.dealer?.userId,'New booking request',`A customer requested a booking for ${booking.vehicleName}.`,'booking');
      return { success: true, data: booking };
    },

    getByCustomerId: async (customerId: string) => {
      const enriched = this._bookings
        .filter(b => b.customerId === customerId)
        .map(b => ({
          ...b,
          listing: this._listings.find(l => l.id === b.listingId),
          dealer: this._dealers.find(d => d.id === b.dealerId),
        }));
      return { success: true, data: enriched };
    },

    getByDealerId: async (dealerId: string) => {
      const enriched = this._bookings
        .filter(b => b.dealerId === dealerId)
        .map(b => ({
          ...b,
          listing: this._listings.find(l => l.id === b.listingId),
          dealer: this._dealers.find(d => d.id === b.dealerId),
        }));
      return { success: true, data: enriched };
    },

    updateStatus: async (id: string, status: Booking['status']) => {
      const booking = this._bookings.find(b => b.id === id);
      if (!booking) return { success: false, error: 'Booking not found.' };
      if (!canChangeBooking(booking.status,status)) return { success:false,error:'Invalid booking transition.' };
      if (booking.status === status) return { success:true,data:booking };
      if (status === 'confirmed') {
        this.audit.record('Booking accepted', booking.dealerId, booking.id, `Dealer confirmed ${booking.vehicleName || booking.listingId}`);
      }
      booking.status = status;
      booking.updatedAt = new Date().toISOString();
      this.notify(booking.customerId,'Booking updated',`Your booking is now ${status.replace(/_/g,' ')}.`,'booking');
      (booking.statusHistory ??= []).push({ status,timestamp:booking.updatedAt });
      return { success: true, data: booking };
    },
  };

  private notifications: Notification[] = [];

  private notify(userId: string | undefined,title: string,message: string,category: 'booking' | 'offer') {
    if (!userId) return;
    this.notifications.unshift({ id:randomUUID(),userId,title,message,category,
      type:'info',isRead:false,createdAt:new Date().toISOString() });
  }

  async getNotifications(userId: string) {
    return { success:true,data:this.notifications.filter(item => item.userId === userId).slice(0,100) };
  }

  async readNotifications(userId: string,id?: string) {
    for (const item of this.notifications) {
      if (item.userId === userId && (!id || id === item.id)) item.isRead = true;
    }
    return { success:true,data:true };
  }

  admin = {
    getStats: async (): Promise<ApiResponse<AdminStats>> => ({
      success: true,
      data: adminMetrics({ users: this._users, dealers: this._dealers, vehicles: this._listings,
        queues: this._queues, offers: this._offers, bookings: this._bookings }),
    }),
    getAuditLog: async () => ({ success: true, data: this.audit.list() }),
    updateCustomerStatus: async (id: string, status: 'active' | 'suspended', actorId: string) => {
      if (!this.canAdmin(actorId)) return { success: false, error: 'Administrator access is required.' };
      if (status !== 'active' && status !== 'suspended') return { success: false, error: 'Invalid customer status.' };
      const customer = this._users.find(user => user.id === id && user.role === 'customer');
      if (!customer) return { success: false, error: 'Customer not found.' };
      const previous = customer.status ?? 'active';
      if (previous !== status) {
        customer.status = status;
        this.audit.record('Customer account status changed', actorId, id, `${customer.name} · ${previous} → ${status}`);
      }
      return { success: true, data: { ...customer } };
    },
  };
}
