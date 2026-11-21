import { User, Dealer, VehicleListing, VehicleModel, QueueEntry, ApiResponse } from '../types/index';

// In-memory mock data store
const mockUsers: User[] = [
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

const mockDealers: Dealer[] = [
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

const mockVehicleModels: VehicleModel[] = [
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

const mockListings: VehicleListing[] = [
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

const mockQueues: QueueEntry[] = [];

// Password map (mock only)
const mockPasswords: Record<string, string> = {
  'customer@demo.com': 'demo1234',
  'dealer@demo.com': 'demo1234',
  'admin@demo.com': 'demo1234',
};

export interface DataAdapter {
  auth: {
    login: (credentials: { email: string; password: string }) => Promise<ApiResponse<{ user: User; token: string }>>;
    register: (data: { name: string; email: string; password: string; role: string }) => Promise<ApiResponse<{ user: User; token: string }>>;
  };
  vehicles: {
    getAll: (filters?: Record<string, unknown>) => Promise<ApiResponse<VehicleListing[]>>;
    getById: (id: string) => Promise<ApiResponse<VehicleListing>>;
    create: (data: Record<string, unknown>) => Promise<ApiResponse<VehicleListing>>;
    update: (id: string, data: Record<string, unknown>) => Promise<ApiResponse<VehicleListing>>;
    delete: (id: string) => Promise<ApiResponse<{ id: string }>>;
  };
  dealers: {
    getAll: () => Promise<ApiResponse<Dealer[]>>;
    getById: (id: string) => Promise<ApiResponse<Dealer>>;
    update: (id: string, data: Record<string, unknown>) => Promise<ApiResponse<Dealer>>;
  };
  queue: {
    join: (data: { vehicleModelId: string; customerId: string }) => Promise<ApiResponse<QueueEntry>>;
    getPosition: (queueId: string) => Promise<ApiResponse<{ position: number }>>;
    leave: (queueId: string) => Promise<ApiResponse<{ id: string }>>;
  };
}

export function getMockAdapter(): DataAdapter {
  return {
    auth: {
      async login({ email, password }) {
        const user = mockUsers.find(u => u.email === email);
        if (!user || mockPasswords[email] !== password) {
          return { success: false, error: 'Invalid email or password.' };
        }
        return { success: true, data: { user, token: `mock-token-${user.id}` } };
      },
      async register({ name, email, password, role }) {
        if (mockUsers.find(u => u.email === email)) {
          return { success: false, error: 'Email already in use.' };
        }
        const newUser: User = {
          id: `u${mockUsers.length + 1}`,
          name,
          email,
          role: role as User['role'],
          createdAt: new Date().toISOString(),
        };
        mockUsers.push(newUser);
        mockPasswords[email] = password;
        return { success: true, data: { user: newUser, token: `mock-token-${newUser.id}` } };
      },
    },
    vehicles: {
      async getAll(filters) {
        let listings = [...mockListings];
        if (filters?.dealerId) {
          listings = listings.filter(l => l.dealerId === filters.dealerId);
        }
        if (filters?.availability) {
          listings = listings.filter(l => l.availability === filters.availability);
        }
        const enriched = listings.map(l => ({
          ...l,
          dealer: mockDealers.find(d => d.id === l.dealerId),
          vehicleModel: mockVehicleModels.find(m => m.id === l.vehicleModelId),
          variant: mockVehicleModels
            .find(m => m.id === l.vehicleModelId)
            ?.variants.find(v => v.id === l.variantId),
        }));
        return { success: true, data: enriched };
      },
      async getById(id) {
        const listing = mockListings.find(l => l.id === id);
        if (!listing) return { success: false, error: 'Listing not found.' };
        return {
          success: true,
          data: {
            ...listing,
            dealer: mockDealers.find(d => d.id === listing.dealerId),
            vehicleModel: mockVehicleModels.find(m => m.id === listing.vehicleModelId),
            variant: mockVehicleModels
              .find(m => m.id === listing.vehicleModelId)
              ?.variants.find(v => v.id === listing.variantId),
          },
        };
      },
      async create(data) {
        const newListing: VehicleListing = {
          id: `l${mockListings.length + 1}`,
          dealerId: data.dealerId as string,
          vehicleModelId: data.vehicleModelId as string,
          variantId: data.variantId as string,
          price: data.price as number,
          color: data.color as string,
          mileage: data.mileage as number,
          condition: data.condition as VehicleListing['condition'],
          availability: 'available',
          description: data.description as string,
          images: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockListings.push(newListing);
        return { success: true, data: newListing };
      },
      async update(id, data) {
        const idx = mockListings.findIndex(l => l.id === id);
        if (idx === -1) return { success: false, error: 'Listing not found.' };
        mockListings[idx] = { ...mockListings[idx], ...data, updatedAt: new Date().toISOString() };
        return { success: true, data: mockListings[idx] };
      },
      async delete(id) {
        const idx = mockListings.findIndex(l => l.id === id);
        if (idx === -1) return { success: false, error: 'Listing not found.' };
        mockListings.splice(idx, 1);
        return { success: true, data: { id } };
      },
    },
    dealers: {
      async getAll() {
        return { success: true, data: mockDealers };
      },
      async getById(id) {
        const dealer = mockDealers.find(d => d.id === id);
        if (!dealer) return { success: false, error: 'Dealer not found.' };
        return { success: true, data: dealer };
      },
      async update(id, data) {
        const idx = mockDealers.findIndex(d => d.id === id);
        if (idx === -1) return { success: false, error: 'Dealer not found.' };
        mockDealers[idx] = { ...mockDealers[idx], ...data } as Dealer;
        return { success: true, data: mockDealers[idx] };
      },
    },
    queue: {
      async join({ vehicleModelId, customerId }) {
        const position = mockQueues.filter(q => q.vehicleModelId === vehicleModelId && q.status === 'waiting').length + 1;
        const entry: QueueEntry = {
          id: `q${mockQueues.length + 1}`,
          vehicleModelId,
          variantId: '',
          customerId,
          position,
          status: 'waiting',
          createdAt: new Date().toISOString(),
        };
        mockQueues.push(entry);
        return { success: true, data: entry };
      },
      async getPosition(queueId) {
        const entry = mockQueues.find(q => q.id === queueId);
        if (!entry) return { success: false, error: 'Queue entry not found.' };
        return { success: true, data: { position: entry.position } };
      },
      async leave(queueId) {
        const idx = mockQueues.findIndex(q => q.id === queueId);
        if (idx === -1) return { success: false, error: 'Queue entry not found.' };
        mockQueues[idx].status = 'cancelled';
        return { success: true, data: { id: queueId } };
      },
    },
  };
}
