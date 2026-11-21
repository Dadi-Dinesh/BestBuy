import { ApiResponse, VehicleListing } from '../types';

function getAPI() {
  if (typeof window !== 'undefined' && (window as unknown as { electronAPI?: unknown }).electronAPI) {
    return (window as unknown as { electronAPI: Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>> }).electronAPI;
  }
  return null;
}

export const vehicleService = {
  async getAll(filters?: Record<string, unknown>): Promise<ApiResponse<VehicleListing[]>> {
    const api = getAPI();
    if (api?.vehicles?.getAll) {
      return api.vehicles.getAll(filters) as Promise<ApiResponse<VehicleListing[]>>;
    }
    // Default mock listings for standalone browser mode
    return {
      success: true,
      data: [
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
          dealer: {
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
          vehicleModel: {
            id: 'vm1',
            make: 'Toyota',
            model: 'Camry',
            year: 2024,
            category: 'Sedan',
            variants: [],
          },
          variant: {
            id: 'vv1',
            name: 'LE',
            trimLevel: 'Base',
            engineType: '2.5L 4-Cylinder',
            transmission: '8-Speed Automatic',
            fuelType: 'Gasoline',
            seatingCapacity: 5,
            features: ['Apple CarPlay', 'Toyota Safety Sense', 'Backup Camera'],
          },
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
          dealer: {
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
          vehicleModel: {
            id: 'vm1',
            make: 'Toyota',
            model: 'Camry',
            year: 2024,
            category: 'Sedan',
            variants: [],
          },
          variant: {
            id: 'vv1',
            name: 'LE',
            trimLevel: 'Base',
            engineType: '2.5L 4-Cylinder',
            transmission: '8-Speed Automatic',
            fuelType: 'Gasoline',
            seatingCapacity: 5,
            features: ['Apple CarPlay', 'Toyota Safety Sense', 'Backup Camera'],
          },
        },
      ],
    };
  },

  async getById(id: string): Promise<ApiResponse<VehicleListing>> {
    const api = getAPI();
    if (api?.vehicles?.getById) {
      return api.vehicles.getById(id) as Promise<ApiResponse<VehicleListing>>;
    }
    return { success: false, error: 'Not implemented in browser fallback' };
  },

  async create(data: Record<string, unknown>): Promise<ApiResponse<VehicleListing>> {
    const api = getAPI();
    if (api?.vehicles?.create) {
      return api.vehicles.create(data) as Promise<ApiResponse<VehicleListing>>;
    }
    return {
      success: true,
      data: {
        id: `l${Date.now()}`,
        dealerId: data.dealerId as string,
        vehicleModelId: data.vehicleModelId as string,
        variantId: data.variantId as string,
        price: Number(data.price),
        color: data.color as string,
        mileage: Number(data.mileage),
        condition: data.condition as VehicleListing['condition'],
        availability: 'available',
        description: data.description as string,
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  },

  async update(id: string, data: Record<string, unknown>): Promise<ApiResponse<VehicleListing>> {
    const api = getAPI();
    if (api?.vehicles?.update) {
      return api.vehicles.update(id, data) as Promise<ApiResponse<VehicleListing>>;
    }
    return { success: true, data: { id, ...data } as unknown as VehicleListing };
  },

  async delete(id: string): Promise<ApiResponse<{ id: string }>> {
    const api = getAPI();
    if (api?.vehicles?.delete) {
      return api.vehicles.delete(id) as Promise<ApiResponse<{ id: string }>>;
    }
    return { success: true, data: { id } };
  },
};
