import { IDatabaseAdapter } from '../IDatabaseAdapter';
import {
  User,
  Dealer,
  VehicleListing,
  VehicleModel,
  QueueEntry,
  Booking,
} from '../../types';

export class MockDatabaseAdapter implements IDatabaseAdapter {
  readonly name = 'MockDatabaseAdapter';

  private users: User[] = [
    {
      id: 'u1',
      name: 'Alice Johnson',
      email: 'customer@demo.com',
      role: 'customer',
      createdAt: '2024-01-10T08:00:00Z',
    },
    {
      id: 'u2',
      name: 'Bob Smith',
      email: 'dealer@demo.com',
      role: 'dealer',
      createdAt: '2024-01-05T08:00:00Z',
    },
    {
      id: 'u3',
      name: 'Admin User',
      email: 'admin@demo.com',
      role: 'admin',
      createdAt: '2024-01-01T08:00:00Z',
    },
  ];

  private passwords: Record<string, string> = {
    'customer@demo.com': 'demo1234',
    'dealer@demo.com': 'demo1234',
    'admin@demo.com': 'demo1234',
  };

  private dealers: Dealer[] = [
    {
      id: 'd1',
      userId: 'u2',
      dealershipName: 'Premier Auto Group',
      address: '1234 Motor Ave',
      city: 'Los Angeles',
      state: 'CA',
      phone: '(310) 555-0100',
      email: 'premier@autogroup.com',
      isVerified: true,
      createdAt: '2024-01-05T08:00:00Z',
    },
    {
      id: 'd2',
      userId: 'u4',
      dealershipName: 'City Cars Direct',
      address: '567 Dealership Blvd',
      city: 'San Francisco',
      state: 'CA',
      phone: '(415) 555-0200',
      email: 'info@citycars.com',
      isVerified: true,
      createdAt: '2024-01-07T08:00:00Z',
    },
  ];

  private vehicleModels: VehicleModel[] = [
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
          transmission: 'Automatic',
          fuelType: 'Gasoline',
          seatingCapacity: 5,
          features: ['Apple CarPlay', 'Android Auto', 'Backup Camera', 'Lane Departure Warning'],
        },
        {
          id: 'vv2',
          name: 'XSE',
          trimLevel: 'Sport',
          engineType: '2.5L 4-Cylinder Hybrid',
          transmission: 'CVT',
          fuelType: 'Hybrid',
          seatingCapacity: 5,
          features: ['JBL Audio', 'Heated Seats', 'Sunroof', 'Adaptive Cruise Control', 'Head-Up Display'],
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
          trimLevel: 'Mid',
          engineType: '1.5L Turbocharged',
          transmission: 'CVT',
          fuelType: 'Gasoline',
          seatingCapacity: 5,
          features: ['Honda Sensing', 'Apple CarPlay', 'Remote Start', '18-inch Wheels'],
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
          name: 'XLT',
          trimLevel: 'Mid',
          engineType: '2.7L EcoBoost V6',
          transmission: '10-Speed Automatic',
          fuelType: 'Gasoline',
          seatingCapacity: 6,
          features: ['SYNC 4', 'Pro Power Onboard', 'FordPass Connect', 'B&O Sound System'],
        },
      ],
    },
    {
      id: 'vm4',
      make: 'BMW',
      model: '3 Series',
      year: 2024,
      category: 'Luxury Sedan',
      variants: [
        {
          id: 'vv5',
          name: '330i',
          trimLevel: 'Base',
          engineType: '2.0L TwinPower Turbo',
          transmission: '8-Speed Automatic',
          fuelType: 'Gasoline',
          seatingCapacity: 5,
          features: ['iDrive 7', 'Wireless Charging', 'Parking Assistant', 'Comfort Access'],
        },
      ],
    },
  ];

  private listings: VehicleListing[] = [
    {
      id: 'l1',
      dealerId: 'd1',
      vehicleModelId: 'vm1',
      variantId: 'vv1',
      price: 28500,
      color: 'Midnight Black',
      mileage: 0,
      condition: 'new',
      availability: 'available',
      description: 'Brand new 2024 Toyota Camry LE. Ready for immediate delivery.',
      images: [],
      createdAt: '2024-02-01T08:00:00Z',
      updatedAt: '2024-02-01T08:00:00Z',
    },
    {
      id: 'l2',
      dealerId: 'd1',
      vehicleModelId: 'vm1',
      variantId: 'vv2',
      price: 34900,
      color: 'Pearl White',
      mileage: 0,
      condition: 'new',
      availability: 'available',
      description: 'Camry XSE Hybrid. Fuel efficient and feature-packed.',
      images: [],
      createdAt: '2024-02-01T08:00:00Z',
      updatedAt: '2024-02-01T08:00:00Z',
    },
    {
      id: 'l3',
      dealerId: 'd2',
      vehicleModelId: 'vm1',
      variantId: 'vv1',
      price: 27800,
      color: 'Celestial Silver',
      mileage: 0,
      condition: 'new',
      availability: 'available',
      description: 'Competitive pricing on the Camry LE. Best deal in town.',
      images: [],
      createdAt: '2024-02-02T08:00:00Z',
      updatedAt: '2024-02-02T08:00:00Z',
    },
    {
      id: 'l4',
      dealerId: 'd2',
      vehicleModelId: 'vm2',
      variantId: 'vv3',
      price: 31200,
      color: 'Sonic Gray',
      mileage: 0,
      condition: 'new',
      availability: 'available',
      description: 'Honda Accord Sport. Turbocharged performance, premium feel.',
      images: [],
      createdAt: '2024-02-03T08:00:00Z',
      updatedAt: '2024-02-03T08:00:00Z',
    },
    {
      id: 'l5',
      dealerId: 'd1',
      vehicleModelId: 'vm3',
      variantId: 'vv4',
      price: 45000,
      color: 'Atlas Blue',
      mileage: 0,
      condition: 'new',
      availability: 'available',
      description: 'Ford F-150 XLT with EcoBoost engine. Work-ready and comfortable.',
      images: [],
      createdAt: '2024-02-04T08:00:00Z',
      updatedAt: '2024-02-04T08:00:00Z',
    },
  ];

  private queues: QueueEntry[] = [];
  private bookings: Booking[] = [];

  async connect(): Promise<void> {
    // In-memory mock: always ready
  }

  async disconnect(): Promise<void> {
    // In-memory mock: no-op
  }

  auth = {
    login: async (credentials: { email: string; password: string }) => {
      const user = this.users.find(u => u.email === credentials.email);
      if (!user || this.passwords[credentials.email] !== credentials.password) {
        return { success: false, error: 'Invalid email or password.' };
      }
      return { success: true, data: { user, token: `mock-token-${user.id}` } };
    },
    register: async (data: { name: string; email: string; password: string; role: string }) => {
      if (this.users.find(u => u.email === data.email)) {
        return { success: false, error: 'Email already registered.' };
      }
      const newUser: User = {
        id: `u${this.users.length + 1}`,
        name: data.name,
        email: data.email,
        role: data.role as User['role'],
        createdAt: new Date().toISOString(),
      };
      this.users.push(newUser);
      this.passwords[data.email] = data.password;
      return { success: true, data: { user: newUser, token: `mock-token-${newUser.id}` } };
    },
    getUserById: async (id: string) => {
      const user = this.users.find(u => u.id === id);
      if (!user) return { success: false, error: 'User not found.' };
      return { success: true, data: user };
    },
  };

  vehicles = {
    getAll: async (filters?: Record<string, unknown>) => {
      let result = [...this.listings];
      if (filters?.dealerId) {
        result = result.filter(l => l.dealerId === filters.dealerId);
      }
      if (filters?.availability) {
        result = result.filter(l => l.availability === filters.availability);
      }
      const enriched = result.map(l => ({
        ...l,
        dealer: this.dealers.find(d => d.id === l.dealerId),
        vehicleModel: this.vehicleModels.find(m => m.id === l.vehicleModelId),
        variant: this.vehicleModels
          .find(m => m.id === l.vehicleModelId)
          ?.variants.find(v => v.id === l.variantId),
      }));
      return { success: true, data: enriched };
    },
    getById: async (id: string) => {
      const listing = this.listings.find(l => l.id === id);
      if (!listing) return { success: false, error: 'Vehicle listing not found.' };
      return {
        success: true,
        data: {
          ...listing,
          dealer: this.dealers.find(d => d.id === listing.dealerId),
          vehicleModel: this.vehicleModels.find(m => m.id === listing.vehicleModelId),
          variant: this.vehicleModels
            .find(m => m.id === listing.vehicleModelId)
            ?.variants.find(v => v.id === listing.variantId),
        },
      };
    },
    create: async (data: Record<string, unknown>) => {
      const newListing: VehicleListing = {
        id: `l${this.listings.length + 1}`,
        dealerId: data.dealerId as string,
        vehicleModelId: data.vehicleModelId as string,
        variantId: (data.variantId as string) || '',
        price: Number(data.price),
        color: (data.color as string) || 'Default',
        mileage: Number(data.mileage) || 0,
        condition: (data.condition as VehicleListing['condition']) || 'new',
        availability: 'available',
        description: data.description as string,
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.listings.push(newListing);
      return { success: true, data: newListing };
    },
    update: async (id: string, data: Record<string, unknown>) => {
      const idx = this.listings.findIndex(l => l.id === id);
      if (idx === -1) return { success: false, error: 'Vehicle listing not found.' };
      this.listings[idx] = {
        ...this.listings[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      return { success: true, data: this.listings[idx] };
    },
    delete: async (id: string) => {
      const idx = this.listings.findIndex(l => l.id === id);
      if (idx === -1) return { success: false, error: 'Vehicle listing not found.' };
      this.listings.splice(idx, 1);
      return { success: true, data: { id } };
    },
  };

  dealers = {
    getAll: async () => {
      return { success: true, data: [...this.dealers] };
    },
    getById: async (id: string) => {
      const dealer = this.dealers.find(d => d.id === id);
      if (!dealer) return { success: false, error: 'Dealer not found.' };
      return { success: true, data: dealer };
    },
    update: async (id: string, data: Record<string, unknown>) => {
      const idx = this.dealers.findIndex(d => d.id === id);
      if (idx === -1) return { success: false, error: 'Dealer not found.' };
      this.dealers[idx] = { ...this.dealers[idx], ...data } as Dealer;
      return { success: true, data: this.dealers[idx] };
    },
  };

  queue = {
    join: async (data: { vehicleModelId: string; customerId: string; variantId?: string }) => {
      const position = this.queues.filter(
        q => q.vehicleModelId === data.vehicleModelId && q.status === 'waiting'
      ).length + 1;
      const entry: QueueEntry = {
        id: `q${this.queues.length + 1}`,
        vehicleModelId: data.vehicleModelId,
        variantId: data.variantId || '',
        customerId: data.customerId,
        position,
        status: 'waiting',
        createdAt: new Date().toISOString(),
      };
      this.queues.push(entry);
      return { success: true, data: entry };
    },
    getPosition: async (queueId: string) => {
      const entry = this.queues.find(q => q.id === queueId);
      if (!entry) return { success: false, error: 'Queue entry not found.' };
      return { success: true, data: { position: entry.position } };
    },
    leave: async (queueId: string) => {
      const idx = this.queues.findIndex(q => q.id === queueId);
      if (idx === -1) return { success: false, error: 'Queue entry not found.' };
      this.queues[idx].status = 'cancelled';
      return { success: true, data: { id: queueId } };
    },
    getByCustomerId: async (customerId: string) => {
      return {
        success: true,
        data: this.queues.filter(q => q.customerId === customerId),
      };
    },
  };

  bookings = {
    create: async (data: { customerId: string; listingId: string; dealerId: string; notes?: string }) => {
      const booking: Booking = {
        id: `b${this.bookings.length + 1}`,
        customerId: data.customerId,
        listingId: data.listingId,
        dealerId: data.dealerId,
        status: 'pending',
        bookingDate: new Date().toISOString(),
        notes: data.notes,
      };
      this.bookings.push(booking);
      return { success: true, data: booking };
    },
    getByCustomerId: async (customerId: string) => {
      return {
        success: true,
        data: this.bookings.filter(b => b.customerId === customerId),
      };
    },
    getByDealerId: async (dealerId: string) => {
      return {
        success: true,
        data: this.bookings.filter(b => b.dealerId === dealerId),
      };
    },
    updateStatus: async (id: string, status: Booking['status']) => {
      const booking = this.bookings.find(b => b.id === id);
      if (!booking) return { success: false, error: 'Booking not found.' };
      booking.status = status;
      return { success: true, data: booking };
    },
  };
}
