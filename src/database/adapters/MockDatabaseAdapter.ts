import { IDatabaseAdapter, AdminStats } from '../IDatabaseAdapter';
import {
  User,
  Dealer,
  VehicleListing,
  VehicleModel,
  QueueEntry,
  Booking,
  Offer,
  RegisterData,
  ApiResponse,
} from '../../types';

export class MockDatabaseAdapter implements IDatabaseAdapter {
  readonly name = 'MockDatabaseAdapter';

  private _users: User[] = [
    {
      id: 'u1',
      name: 'Alice Johnson',
      email: 'customer@demo.com',
      phoneNumber: '+1 (555) 234-5678',
      role: 'customer',
      createdAt: '2024-01-10T08:00:00Z',
    },
    {
      id: 'u2',
      name: 'Bob Smith',
      email: 'dealer@demo.com',
      phoneNumber: '+1 (555) 876-5432',
      role: 'dealer',
      createdAt: '2024-01-05T08:00:00Z',
    },
    {
      id: 'u3',
      name: 'Admin User',
      email: 'admin@demo.com',
      phoneNumber: '+1 (555) 000-1122',
      role: 'admin',
      createdAt: '2024-01-01T08:00:00Z',
    },
    {
      id: 'u4',
      name: 'Marcus Vance',
      email: 'marcus@citycars.com',
      phoneNumber: '+1 (555) 998-7711',
      role: 'dealer',
      createdAt: '2024-01-15T09:30:00Z',
    },
    {
      id: 'u5',
      name: 'Elena Rostova',
      email: 'elena@apexmotors.com',
      phoneNumber: '+1 (555) 443-2211',
      role: 'dealer',
      createdAt: '2024-02-01T11:00:00Z',
    },
  ];

  private _passwords: Record<string, string> = {
    'customer@demo.com': 'demo1234',
    'dealer@demo.com': 'demo1234',
    'admin@demo.com': 'demo1234',
    'marcus@citycars.com': 'demo1234',
    'elena@apexmotors.com': 'demo1234',
  };

  private _dealers: Dealer[] = [
    {
      id: 'd1',
      userId: 'u2',
      dealershipName: 'Premier Auto Group',
      registrationNumber: 'DL-CA-2023-8891',
      contactPerson: 'Bob Smith',
      phone: '+1 (310) 555-0100',
      email: 'premier@autogroup.com',
      address: '1234 Motor Avenue',
      city: 'Los Angeles',
      state: 'CA',
      pinCode: '90025',
      status: 'approved',
      isVerified: true,
      createdAt: '2024-01-05T08:00:00Z',
    },
    {
      id: 'd2',
      userId: 'u4',
      dealershipName: 'City Cars Direct',
      registrationNumber: 'DL-CA-2022-4412',
      contactPerson: 'Marcus Vance',
      phone: '+1 (415) 555-0200',
      email: 'info@citycars.com',
      address: '567 Dealership Boulevard',
      city: 'San Francisco',
      state: 'CA',
      pinCode: '94103',
      status: 'approved',
      isVerified: true,
      createdAt: '2024-01-07T08:00:00Z',
    },
    {
      id: 'd3',
      userId: 'u5',
      dealershipName: 'Apex Motorworks',
      registrationNumber: 'DL-NV-2024-1109',
      contactPerson: 'Elena Rostova',
      phone: '+1 (702) 555-7788',
      email: 'elena@apexmotors.com',
      address: '890 Sahara Avenue',
      city: 'Las Vegas',
      state: 'NV',
      pinCode: '89104',
      status: 'pending',
      isVerified: false,
      createdAt: '2024-02-01T11:00:00Z',
    },
  ];

  private _vehicleModels: VehicleModel[] = [
    {
      id: 'vm1',
      make: 'Toyota',
      model: 'Camry',
      year: 2024,
      category: 'Sedan',
      variants: [
        {
          id: 'vv1',
          name: 'LE',
          trimLevel: 'Base',
          engineType: '2.5L 4-Cylinder',
          transmission: '8-Speed Automatic',
          fuelType: 'Gasoline',
          seatingCapacity: 5,
          features: ['Apple CarPlay', 'Toyota Safety Sense 2.5+', 'Backup Camera', 'Dual-Zone Climate'],
        },
        {
          id: 'vv2',
          name: 'XSE Hybrid',
          trimLevel: 'Sport Premium',
          engineType: '2.5L 4-Cylinder Hybrid',
          transmission: 'eCVT',
          fuelType: 'Hybrid',
          seatingCapacity: 5,
          features: ['JBL 9-Speaker Audio', 'Heated Leather Seats', 'Panoramic Glass Roof', 'Head-Up Display'],
        },
      ],
    },
    {
      id: 'vm2',
      make: 'Honda',
      model: 'Accord',
      year: 2024,
      category: 'Sedan',
      variants: [
        {
          id: 'vv3',
          name: 'Sport',
          trimLevel: 'Sport',
          engineType: '1.5L Turbocharged VTEC',
          transmission: 'CVT',
          fuelType: 'Gasoline',
          seatingCapacity: 5,
          features: ['Honda Sensing', '12.3-inch Touchscreen', 'Wireless Apple CarPlay', '19-inch Alloy Wheels'],
        },
      ],
    },
    {
      id: 'vm3',
      make: 'Ford',
      model: 'F-150',
      year: 2024,
      category: 'Truck',
      variants: [
        {
          id: 'vv4',
          name: 'XLT SuperCrew',
          trimLevel: 'Mid-Level',
          engineType: '3.5L EcoBoost V6',
          transmission: '10-Speed Automatic',
          fuelType: 'Gasoline',
          seatingCapacity: 6,
          features: ['SYNC 4 with 12-inch Display', 'Pro Power Onboard 2.4kW', 'Co-Pilot360 2.0', 'Tow Package'],
        },
      ],
    },
    {
      id: 'vm4',
      make: 'Tesla',
      model: 'Model Y',
      year: 2024,
      category: 'Electric SUV',
      variants: [
        {
          id: 'vv5',
          name: 'Long Range AWD',
          trimLevel: 'Long Range',
          engineType: 'Dual Motor Electric',
          transmission: 'Single-Speed Fixed Gear',
          fuelType: 'Electric',
          seatingCapacity: 5,
          features: ['Autopilot', 'All-Glass Roof', 'Premium Audio', '310 Mile Range', 'Heated All Seats'],
        },
      ],
    },
    {
      id: 'vm5',
      make: 'BMW',
      model: '3 Series',
      year: 2024,
      category: 'Luxury Sedan',
      variants: [
        {
          id: 'vv6',
          name: '330i xDrive',
          trimLevel: 'M Sport Package',
          engineType: '2.0L TwinPower Turbo',
          transmission: '8-Speed Sport Automatic',
          fuelType: 'Gasoline',
          seatingCapacity: 5,
          features: ['BMW Curved Display', 'Live Cockpit Pro', 'Adaptive M Suspension', 'Harman Kardon'],
        },
      ],
    },
  ];

  private _listings: VehicleListing[] = [
    {
      id: 'l1',
      dealerId: 'd1',
      vehicleModelId: 'vm1',
      variantId: 'vv1',
      price: 28400,
      color: 'Midnight Black Metallic',
      mileage: 12,
      condition: 'new',
      availability: 'available',
      description: 'Brand new 2024 Toyota Camry LE. Immediate delivery from Los Angeles showroom.',
      images: [],
      createdAt: '2024-02-01T08:00:00Z',
      updatedAt: '2024-02-01T08:00:00Z',
    },
    {
      id: 'l2',
      dealerId: 'd1',
      vehicleModelId: 'vm1',
      variantId: 'vv2',
      price: 34850,
      color: 'Wind Chill Pearl',
      mileage: 8,
      condition: 'new',
      availability: 'available',
      description: 'Toyota Camry XSE Hybrid. Exceptional 47 MPG combined. Fully optioned.',
      images: [],
      createdAt: '2024-02-01T08:00:00Z',
      updatedAt: '2024-02-01T08:00:00Z',
    },
    {
      id: 'l3',
      dealerId: 'd2',
      vehicleModelId: 'vm1',
      variantId: 'vv1',
      price: 27900,
      color: 'Celestial Silver Metallic',
      mileage: 15,
      condition: 'new',
      availability: 'available',
      description: 'City Cars Direct price match guarantee! Ready for customer test drive.',
      images: [],
      createdAt: '2024-02-02T08:00:00Z',
      updatedAt: '2024-02-02T08:00:00Z',
    },
    {
      id: 'l4',
      dealerId: 'd2',
      vehicleModelId: 'vm2',
      variantId: 'vv3',
      price: 31500,
      color: 'Sonic Gray Pearl',
      mileage: 5,
      condition: 'new',
      availability: 'available',
      description: 'Honda Accord Sport with wireless smartphone integration and 19-inch sport alloys.',
      images: [],
      createdAt: '2024-02-03T08:00:00Z',
      updatedAt: '2024-02-03T08:00:00Z',
    },
    {
      id: 'l5',
      dealerId: 'd1',
      vehicleModelId: 'vm3',
      variantId: 'vv4',
      price: 52400,
      color: 'Atlas Blue Metallic',
      mileage: 22,
      condition: 'new',
      availability: 'available',
      description: 'Ford F-150 SuperCrew. 3.5L EcoBoost with max trailering pack and 2.4kW onboard power.',
      images: [],
      createdAt: '2024-02-04T08:00:00Z',
      updatedAt: '2024-02-04T08:00:00Z',
    },
    {
      id: 'l6',
      dealerId: 'd2',
      vehicleModelId: 'vm4',
      variantId: 'vv5',
      price: 47990,
      color: 'Stealth Grey',
      mileage: 0,
      condition: 'new',
      availability: 'available',
      description: '2024 Tesla Model Y Long Range AWD. Eligible for clean vehicle tax credit.',
      images: [],
      createdAt: '2024-02-05T09:00:00Z',
      updatedAt: '2024-02-05T09:00:00Z',
    },
  ];

  private _queues: QueueEntry[] = [
    {
      id: 'q1',
      vehicleModelId: 'vm1',
      variantId: 'vv2',
      customerId: 'u1',
      customerName: 'Alice Johnson',
      customerPhone: '+1 (555) 234-5678',
      position: 2,
      status: 'waiting',
      createdAt: '2024-02-05T10:15:00Z',
    },
    {
      id: 'q2',
      vehicleModelId: 'vm4',
      variantId: 'vv5',
      customerId: 'u1',
      customerName: 'Alice Johnson',
      customerPhone: '+1 (555) 234-5678',
      position: 1,
      status: 'offered',
      createdAt: '2024-02-06T14:30:00Z',
    },
    {
      id: 'q3',
      vehicleModelId: 'vm1',
      variantId: 'vv1',
      customerId: 'u6',
      customerName: 'David Miller',
      customerPhone: '+1 (555) 778-9900',
      position: 1,
      status: 'waiting',
      createdAt: '2024-02-07T11:20:00Z',
    },
  ];

  private _offers: Offer[] = [
    {
      id: 'o1',
      queueEntryId: 'q2',
      customerId: 'u1',
      customerName: 'Alice Johnson',
      dealerId: 'd2',
      dealerName: 'City Cars Direct',
      vehicleModelId: 'vm4',
      vehicleName: 'Tesla Model Y',
      variantName: 'Long Range AWD',
      offeredPrice: 46500,
      originalPrice: 47990,
      status: 'pending',
      expiryDate: '2024-02-28T23:59:59Z',
      createdAt: '2024-02-08T09:00:00Z',
      notes: 'Special incentive offer: $1,490 dealer discount plus complimentary ceramic coating.',
    },
    {
      id: 'o2',
      queueEntryId: 'q1',
      customerId: 'u1',
      customerName: 'Alice Johnson',
      dealerId: 'd1',
      dealerName: 'Premier Auto Group',
      vehicleModelId: 'vm1',
      vehicleName: 'Toyota Camry',
      variantName: 'XSE Hybrid',
      offeredPrice: 33900,
      originalPrice: 34850,
      status: 'pending',
      expiryDate: '2024-02-25T23:59:59Z',
      createdAt: '2024-02-09T14:00:00Z',
      notes: 'Exclusive queue match pricing with 2 years of complimentary factory maintenance.',
    },
  ];

  private _bookings: Booking[] = [
    {
      id: 'b1',
      customerId: 'u1',
      customerName: 'Alice Johnson',
      customerPhone: '+1 (555) 234-5678',
      listingId: 'l1',
      dealerId: 'd1',
      status: 'confirmed',
      bookingDate: '2024-02-15T10:00:00Z',
      notes: 'Test drive scheduled for Midnight Black Camry LE at LA showroom.',
    },
  ];

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  auth = {
    login: async (credentials: { email: string; password: string }) => {
      const user = this._users.find(u => u.email.toLowerCase() === credentials.email.toLowerCase());
      if (!user || this._passwords[user.email] !== credentials.password) {
        return { success: false, error: 'Invalid email address or password. Please check your credentials.' };
      }
      const dealer = user.role === 'dealer' ? this._dealers.find(d => d.userId === user.id) : undefined;
      const userWithProfile: User = {
        ...user,
        dealerProfile: dealer,
      };
      return { success: true, data: { user: userWithProfile, token: `mock-jwt-token-${user.id}` } };
    },

    register: async (data: RegisterData) => {
      if (this._users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) {
        return { success: false, error: 'An account with this email address already exists.' };
      }

      const newUserId = `u${Date.now()}`;
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
          id: `d${Date.now()}`,
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
      this._passwords[data.email] = data.password;

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
      return { success: true, data: user };
    },

    getAllUsers: async () => {
      return { success: true, data: [...this._users] };
    },
  };

  vehicles = {
    getAll: async (filters?: Record<string, unknown>) => {
      let result = [...this._listings];
      if (filters?.dealerId) {
        result = result.filter(l => l.dealerId === filters.dealerId);
      }
      if (filters?.availability) {
        result = result.filter(l => l.availability === filters.availability);
      }
      const enriched = result.map(l => ({
        ...l,
        dealer: this._dealers.find(d => d.id === l.dealerId),
        vehicleModel: this._vehicleModels.find(m => m.id === l.vehicleModelId),
        variant: this._vehicleModels
          .find(m => m.id === l.vehicleModelId)
          ?.variants.find(v => v.id === l.variantId),
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
          variant: this._vehicleModels
            .find(m => m.id === listing.vehicleModelId)
            ?.variants.find(v => v.id === listing.variantId),
        },
      };
    },

    create: async (data: Record<string, unknown>) => {
      const newListing: VehicleListing = {
        id: `l${Date.now()}`,
        dealerId: data.dealerId as string,
        vehicleModelId: data.vehicleModelId as string,
        variantId: (data.variantId as string) || '',
        price: Number(data.price),
        color: (data.color as string) || 'Standard',
        mileage: Number(data.mileage) || 0,
        condition: (data.condition as VehicleListing['condition']) || 'new',
        availability: 'available',
        description: data.description as string,
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this._listings.push(newListing);
      return { success: true, data: newListing };
    },

    update: async (id: string, data: Record<string, unknown>) => {
      const idx = this._listings.findIndex(l => l.id === id);
      if (idx === -1) return { success: false, error: 'Vehicle listing not found.' };
      this._listings[idx] = {
        ...this._listings[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      return { success: true, data: this._listings[idx] };
    },

    delete: async (id: string) => {
      const idx = this._listings.findIndex(l => l.id === id);
      if (idx === -1) return { success: false, error: 'Vehicle listing not found.' };
      this._listings.splice(idx, 1);
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
      this._dealers[idx] = { ...this._dealers[idx], ...data } as Dealer;
      return { success: true, data: this._dealers[idx] };
    },

    updateStatus: async (id: string, status: Dealer['status']) => {
      const idx = this._dealers.findIndex(d => d.id === id);
      if (idx === -1) return { success: false, error: 'Dealership not found.' };
      this._dealers[idx].status = status;
      this._dealers[idx].isVerified = status === 'approved';
      return { success: true, data: this._dealers[idx] };
    },
  };

  queue = {
    join: async (data: { vehicleModelId: string; customerId: string; variantId?: string }) => {
      const position = this._queues.filter(
        q => q.vehicleModelId === data.vehicleModelId && q.status === 'waiting'
      ).length + 1;
      const customer = this._users.find(u => u.id === data.customerId);
      const entry: QueueEntry = {
        id: `q${Date.now()}`,
        vehicleModelId: data.vehicleModelId,
        variantId: data.variantId || '',
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
      this._queues[idx].status = 'cancelled';
      return { success: true, data: { id: queueId } };
    },

    getByCustomerId: async (customerId: string) => {
      const userQueues = this._queues
        .filter(q => q.customerId === customerId)
        .map(q => ({
          ...q,
          vehicleModel: this._vehicleModels.find(m => m.id === q.vehicleModelId),
          variant: this._vehicleModels
            .find(m => m.id === q.vehicleModelId)
            ?.variants.find(v => v.id === q.variantId),
        }));
      return { success: true, data: userQueues };
    },

    getAll: async () => {
      const allQueues = this._queues.map(q => ({
        ...q,
        vehicleModel: this._vehicleModels.find(m => m.id === q.vehicleModelId),
        variant: this._vehicleModels
          .find(m => m.id === q.vehicleModelId)
          ?.variants.find(v => v.id === q.variantId),
      }));
      return { success: true, data: allQueues };
    },
  };

  offers = {
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
      const newOffer: Offer = {
        ...data,
        id: `o${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      this._offers.push(newOffer);
      return { success: true, data: newOffer };
    },

    updateStatus: async (id: string, status: Offer['status']) => {
      const offer = this._offers.find(o => o.id === id);
      if (!offer) return { success: false, error: 'Offer not found.' };
      offer.status = status;
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

    create: async (data: { customerId: string; listingId: string; dealerId: string; notes?: string }) => {
      const customer = this._users.find(u => u.id === data.customerId);
      const booking: Booking = {
        id: `b${Date.now()}`,
        customerId: data.customerId,
        customerName: customer?.name || 'Customer',
        customerPhone: customer?.phoneNumber,
        listingId: data.listingId,
        dealerId: data.dealerId,
        status: 'pending',
        bookingDate: new Date().toISOString(),
        notes: data.notes,
        listing: this._listings.find(l => l.id === data.listingId),
        dealer: this._dealers.find(d => d.id === data.dealerId),
      };
      this._bookings.push(booking);
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
      booking.status = status;
      return { success: true, data: booking };
    },
  };

  admin = {
    getStats: async (): Promise<ApiResponse<AdminStats>> => {
      const totalCustomers = this._users.filter(u => u.role === 'customer').length;
      const totalDealers = this._dealers.length;
      const totalVehicles = this._listings.length;
      const activeQueues = this._queues.filter(q => q.status === 'waiting' || q.status === 'offered').length;
      const totalBookings = this._bookings.length;
      const pendingApprovals = this._dealers.filter(d => d.status === 'pending').length;

      return {
        success: true,
        data: {
          totalCustomers,
          totalDealers,
          totalVehicles,
          activeQueues,
          totalBookings,
          pendingApprovals,
        },
      };
    },
  };
}
