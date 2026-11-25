import { indiaDemo } from '../../../src/data/indiaDemo';
import { expireMockListingOffers } from './offerService';
import { recordPriceUpdate } from '../../../src/services/auditLog';
import { isMockAdmin } from './authService';
import { mockAudit } from './mockAudit';
import { resolveVehicleIdentity } from '../../../src/services/vehicleIdentity';
import { dealerService, mockDealerCanTrade } from './dealerService';
import { pricingService, type ListingPriceChange } from '../../../src/services/pricingService';
import {
  ApiResponse,
  VehicleListing,
  CreateVehicleListingData,
  UpdateVehicleListingData,
  VehicleAvailabilityStatus,
} from '../types';

function getAPI() {
  if (typeof window !== 'undefined' && (window as unknown as { electronAPI?: unknown }).electronAPI) {
    return (window as unknown as { electronAPI: Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>> }).electronAPI;
  }
  return null;
}

// In-memory fallback dataset for development
let mockBrowserVehicles = indiaDemo().listings;


const archivedPriceChanges: ListingPriceChange[] = [];

export const vehicleService = {
  async getMarketplacePreview(location:{state:string;city:string;locality:string;pin:string}): Promise<ApiResponse<VehicleListing[]>> {
    const api=getAPI();
    if(api?.vehicles?.preview) return api.vehicles.preview(location) as Promise<ApiResponse<VehicleListing[]>>;
    const result=await this.getAll({marketplace:true});
    return {...result,data:result.data?.filter(item=>(!location.state||item.dealer?.state===location.state)&&
      (!location.city||item.dealer?.city===location.city)&&(!location.pin||item.dealer?.pinCode===location.pin)&&
      (!location.locality||item.dealer?.address.toLowerCase().includes(location.locality.toLowerCase())))};

  },
  async getPriceChanges(): Promise<ApiResponse<ListingPriceChange[]>> {
    const api = getAPI();
    if (api?.vehicles?.getPriceChanges) {
      return api.vehicles.getPriceChanges() as Promise<ApiResponse<ListingPriceChange[]>>;
    }
    return { success: true, data: [...archivedPriceChanges, ...mockBrowserVehicles.flatMap(pricingService.listingChanges)] };
  },

  async getAll(filters?: Record<string, unknown>): Promise<ApiResponse<VehicleListing[]>> {
    const api = getAPI();
    if (api?.vehicles?.getAll) {
      return api.vehicles.getAll(filters) as Promise<ApiResponse<VehicleListing[]>>;
    }

    let results = [...mockBrowserVehicles];
    if (filters?.dealerId) {
      results = results.filter(v => v.dealerId === filters.dealerId);
    }
    if (filters?.availability) {
      results = results.filter(v => v.availability === filters.availability);
    }
    if (filters?.brand) {
      results = results.filter(v => v.brand.toLowerCase() === (filters.brand as string).toLowerCase());
    }
    if (filters?.model) {
      results = results.filter(v => v.model.toLowerCase() === (filters.model as string).toLowerCase());
    }
    if (filters?.variant) {
      results = results.filter(v => v.variant.toLowerCase() === (filters.variant as string).toLowerCase());
    }

    if (filters?.marketplace) results = results.filter(listing => mockDealerCanTrade(listing.dealerId));
    return { success: true, data: results };
  },

  async getById(id: string): Promise<ApiResponse<VehicleListing>> {
    const api = getAPI();
    if (api?.vehicles?.getById) {
      return api.vehicles.getById(id) as Promise<ApiResponse<VehicleListing>>;
    }
    const item = mockBrowserVehicles.find(v => v.id === id);
    if (!item) return { success: false, error: 'Vehicle listing not found' };
    return { success: true, data: item };
  },

  async create(data: CreateVehicleListingData | Record<string, unknown>): Promise<ApiResponse<VehicleListing>> {
    const api = getAPI();
    if (api?.vehicles?.create) {
      return api.vehicles.create(data) as Promise<ApiResponse<VehicleListing>>;
    }

    const exShowroom = Number(data.exShowroomPrice) || 25000;
    const dealerOffer = Number(data.dealerOfferPrice) || exShowroom;
    const onRoad = Number(data.onRoadPrice) || Math.round(exShowroom * 1.12);

    const dealerId = data.dealerId as string;
    const { data: dealer } = await dealerService.getById(dealerId);
    if (!mockDealerCanTrade(dealerId)) return { success: false, error: 'Only approved dealers can publish inventory.' };
    const brand = (data.brand as string) || 'Toyota';
    const model = (data.model as string) || 'Camry';
    const variant = (data.variant as string) || 'Base';
    if (!pricingService.isValid(dealerOffer)) return { success: false, error: 'Enter a valid positive dealer price.' };
    const newListing: VehicleListing = {
      id: `l${Date.now()}`,
      dealerId,
      dealer,
      ...resolveVehicleIdentity({
        brand, model, variant, vehicleModelId: data.vehicleModelId as string, variantId: data.variantId as string,
      }, mockBrowserVehicles),
      brand,
      model,
      variant,
      year: Number(data.year) || 2024,
      fuelType: (data.fuelType as VehicleListing['fuelType']) || 'Petrol',
      transmission: (data.transmission as VehicleListing['transmission']) || 'Automatic',
      color: (data.color as string) || 'Standard',
      mileage: Number(data.mileage) || 0,
      condition: (data.condition as VehicleListing['condition']) || 'new',
      price: dealerOffer,
      exShowroomPrice: exShowroom,
      onRoadPrice: onRoad,
      dealerOfferPrice: dealerOffer,
      quantity: typeof data.quantity === 'number' ? data.quantity : 1,
      deliveryTimeline: (data.deliveryTimeline as VehicleListing['deliveryTimeline']) || 'Immediate',
      availability: (data.availability as VehicleAvailabilityStatus) || 'available',
      description: (data.description as string) || '',
      images: Array.isArray(data.images) && data.images.length > 0
        ? data.images
        : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockBrowserVehicles.unshift(newListing);
    mockAudit.record('Listing created', dealerId, newListing.id, `${brand} ${model} ${variant}`);
    return { success: true, data: newListing };
  },

  async update(id: string, data: UpdateVehicleListingData | Record<string, unknown>): Promise<ApiResponse<VehicleListing>> {
    const api = getAPI();
    if (api?.vehicles?.update) {
      return api.vehicles.update(id, data) as Promise<ApiResponse<VehicleListing>>;
    }

    const idx = mockBrowserVehicles.findIndex(v => v.id === id);
    if (idx === -1) return { success: false, error: 'Vehicle not found' };

    const current = mockBrowserVehicles[idx];
    if (!mockDealerCanTrade(current.dealerId)) return { success: false, error: 'Only approved dealers can update inventory.' };
    const offerPrice = data.dealerOfferPrice !== undefined
      ? Number(data.dealerOfferPrice)
      : data.price !== undefined
      ? Number(data.price)
      : current.dealerOfferPrice;

    if (!pricingService.isValid(offerPrice)) return { success: false, error: 'Enter a valid positive dealer price.' };

    mockBrowserVehicles[idx] = {
      ...current,
      ...data,
      id: current.id,
      dealerId: current.dealerId,
      ...pricingService.revise(current, offerPrice, new Date().toISOString()),
      updatedAt: new Date().toISOString(),
    };

    mockAudit.record('Listing updated', current.dealerId, id, `${current.brand} ${current.model} ${current.variant}`);
    recordPriceUpdate(mockAudit, current, mockBrowserVehicles[idx]);
    return { success: true, data: mockBrowserVehicles[idx] };
  },

  async updatePrice(
    id: string,
    prices: { exShowroomPrice?: number; onRoadPrice?: number; dealerOfferPrice: number }
  ): Promise<ApiResponse<VehicleListing>> {
    const api = getAPI();
    if (api?.vehicles?.updatePrice) {
      return api.vehicles.updatePrice(id, prices) as Promise<ApiResponse<VehicleListing>>;
    }

    const idx = mockBrowserVehicles.findIndex(v => v.id === id);
    if (idx === -1) return { success: false, error: 'Vehicle not found' };

    if (!pricingService.isValid(prices.dealerOfferPrice)) return { success: false, error: 'Enter a valid positive dealer price.' };
    const current = mockBrowserVehicles[idx];
    if (!mockDealerCanTrade(current.dealerId)) return { success: false, error: 'Only approved dealers can update inventory.' };
    const updatedAt = new Date().toISOString();
    mockBrowserVehicles[idx] = {
      ...current,
      ...pricingService.revise(current, prices.dealerOfferPrice, updatedAt),
      exShowroomPrice: prices.exShowroomPrice ?? current.exShowroomPrice,
      onRoadPrice: prices.onRoadPrice ?? current.onRoadPrice,
      updatedAt,
    };

    recordPriceUpdate(mockAudit, current, mockBrowserVehicles[idx]);
    return { success: true, data: mockBrowserVehicles[idx] };
  },

  async updateAvailability(id: string, availability: VehicleAvailabilityStatus): Promise<ApiResponse<VehicleListing>> {
    const api = getAPI();
    if (api?.vehicles?.updateAvailability) {
      return api.vehicles.updateAvailability(id, availability) as Promise<ApiResponse<VehicleListing>>;
    }

    const idx = mockBrowserVehicles.findIndex(v => v.id === id);
    if (idx === -1) return { success: false, error: 'Vehicle not found' };

    const listing = mockBrowserVehicles[idx];
    if (!mockDealerCanTrade(listing.dealerId)) return { success: false, error: 'Only approved dealers can update inventory.' };
    mockAudit.record('Listing updated', listing.dealerId, id, `Availability changed to ${availability.replace(/_/g, ' ')}`);
    listing.availability = availability;
    if (availability === 'out_of_stock') {
      mockBrowserVehicles[idx].quantity = 0;
    }
    mockBrowserVehicles[idx].updatedAt = new Date().toISOString();

    return { success: true, data: mockBrowserVehicles[idx] };
  },

  async delete(id: string, actorId?: string, reason?: string): Promise<ApiResponse<{ id: string }>> {
    const api = getAPI();
    if (api?.vehicles?.delete) {
      return api.vehicles.delete(id, actorId, reason) as Promise<ApiResponse<{ id: string }>>;
    }
    const listing = mockBrowserVehicles.find(vehicle => vehicle.id === id);
    if (!listing) return { success: false, error: 'Vehicle listing not found.' };
    if (actorId ? !isMockAdmin(actorId) : !mockDealerCanTrade(listing.dealerId)) {
      return { success: false, error: 'Listing removal is unavailable for this account.' };
    }
    if (actorId && !reason?.trim()) return { success: false, error: 'Provide a reason for removing the listing.' };
    archivedPriceChanges.push(...pricingService.listingChanges(listing));
    expireMockListingOffers(id);
    mockAudit.record('Listing removed', actorId || listing.dealerId, id,
      `${listing.brand} ${listing.model} ${listing.variant}${reason?.trim() ? ` · ${reason.trim()}` : ''}`);
    mockBrowserVehicles = mockBrowserVehicles.filter(v => v.id !== id);
    return { success: true, data: { id } };
  },
};
