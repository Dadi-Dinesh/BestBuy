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
let mockBrowserVehicles: VehicleListing[] = [
  {
    id: 'l1',
    dealerId: 'd1', // Premier Auto Group
    vehicleModelId: 'vm1',
    variantId: 'vv1',
    brand: 'Toyota',
    model: 'Camry',
    variant: 'LE',
    year: 2024,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'Midnight Black Metallic',
    mileage: 12,
    condition: 'new',
    price: 28400,
    exShowroomPrice: 26320,
    onRoadPrice: 29800,
    dealerOfferPrice: 28400,
    quantity: 4,
    deliveryTimeline: 'Immediate',
    availability: 'available',
    description: 'Brand new 2024 Toyota Camry LE. Immediate delivery from Los Angeles showroom with complimentary first service.',
    images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80'],
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
  },
  {
    id: 'l2',
    dealerId: 'd1', // Premier Auto Group
    vehicleModelId: 'vm1',
    variantId: 'vv2',
    brand: 'Toyota',
    model: 'Camry',
    variant: 'XSE Hybrid',
    year: 2024,
    fuelType: 'Hybrid',
    transmission: 'CVT',
    color: 'Wind Chill Pearl',
    mileage: 8,
    condition: 'new',
    price: 34850,
    exShowroomPrice: 32900,
    onRoadPrice: 36500,
    dealerOfferPrice: 34850,
    quantity: 2,
    deliveryTimeline: 'Within 7 days',
    availability: 'available',
    description: 'Toyota Camry XSE Hybrid. Exceptional 47 MPG combined. Fully optioned with JBL audio and panoramic roof.',
    images: ['https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=800&q=80'],
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
  },
  {
    id: 'l3',
    dealerId: 'd2', // City Cars Direct (SAME model as l1, distinct dealer controls price & delivery!)
    vehicleModelId: 'vm1',
    variantId: 'vv1',
    brand: 'Toyota',
    model: 'Camry',
    variant: 'LE',
    year: 2024,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'Celestial Silver Metallic',
    mileage: 15,
    condition: 'new',
    price: 27900,
    exShowroomPrice: 26320,
    onRoadPrice: 29200,
    dealerOfferPrice: 27900,
    quantity: 1,
    deliveryTimeline: 'Within 7 days',
    availability: 'available',
    description: 'City Cars Direct price match guarantee! Ready for customer test drive at our San Francisco showroom.',
    images: ['https://images.unsplash.com/photo-1590362891988-f77804702e0a?auto=format&fit=crop&w=800&q=80'],
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
  },
  {
    id: 'l4',
    dealerId: 'd2', // City Cars Direct
    vehicleModelId: 'vm2',
    variantId: 'vv3',
    brand: 'Honda',
    model: 'Accord',
    variant: 'Sport',
    year: 2024,
    fuelType: 'Petrol',
    transmission: 'CVT',
    color: 'Sonic Gray Pearl',
    mileage: 5,
    condition: 'new',
    price: 31500,
    exShowroomPrice: 29800,
    onRoadPrice: 33100,
    dealerOfferPrice: 31500,
    quantity: 3,
    deliveryTimeline: 'Immediate',
    availability: 'available',
    description: 'Honda Accord Sport with wireless smartphone integration and 19-inch sport alloys.',
    images: ['https://images.unsplash.com/photo-1592853625597-7d17be820d0c?auto=format&fit=crop&w=800&q=80'],
    createdAt: '2024-02-03T08:00:00Z',
    updatedAt: '2024-02-03T08:00:00Z',
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
  },
  {
    id: 'l5',
    dealerId: 'd1', // Premier Auto Group
    vehicleModelId: 'vm3',
    variantId: 'vv4',
    brand: 'Ford',
    model: 'F-150',
    variant: 'XLT SuperCrew',
    year: 2024,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'Atlas Blue Metallic',
    mileage: 22,
    condition: 'new',
    price: 52400,
    exShowroomPrice: 49500,
    onRoadPrice: 55000,
    dealerOfferPrice: 52400,
    quantity: 2,
    deliveryTimeline: 'Within 15 days',
    availability: 'reserved',
    description: 'Ford F-150 SuperCrew. 3.5L EcoBoost with max trailering pack and 2.4kW onboard power.',
    images: ['https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80'],
    createdAt: '2024-02-04T08:00:00Z',
    updatedAt: '2024-02-04T08:00:00Z',
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
  },
  {
    id: 'l6',
    dealerId: 'd2', // City Cars Direct
    vehicleModelId: 'vm4',
    variantId: 'vv5',
    brand: 'Tesla',
    model: 'Model Y',
    variant: 'Long Range AWD',
    year: 2024,
    fuelType: 'Electric',
    transmission: 'Single-Speed',
    color: 'Stealth Grey',
    mileage: 0,
    condition: 'new',
    price: 47990,
    exShowroomPrice: 47990,
    onRoadPrice: 51200,
    dealerOfferPrice: 47990,
    quantity: 0,
    deliveryTimeline: 'Within 30 days',
    availability: 'out_of_stock',
    description: '2024 Tesla Model Y Long Range AWD. 310 miles EPA range with Autopilot and all-glass roof.',
    images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&q=80'],
    createdAt: '2024-02-05T09:00:00Z',
    updatedAt: '2024-02-05T09:00:00Z',
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
  },
  {
    id: 'l7',
    dealerId: 'd3', // Pacific Horizon Motors (San Diego)
    vehicleModelId: 'vm1',
    variantId: 'vv1',
    brand: 'Toyota',
    model: 'Camry',
    variant: 'LE',
    year: 2024,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'Supersonic Red',
    mileage: 6,
    condition: 'new',
    price: 28150,
    exShowroomPrice: 26320,
    onRoadPrice: 29500,
    dealerOfferPrice: 28150,
    quantity: 3,
    deliveryTimeline: 'Immediate',
    availability: 'available',
    description: 'San Diego showroom special. Supersonic Red Camry LE with all-weather package and tint.',
    images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80'],
    createdAt: '2024-02-06T08:00:00Z',
    updatedAt: '2024-02-06T08:00:00Z',
    dealer: {
      id: 'd3',
      userId: 'u6',
      dealershipName: 'Pacific Horizon Motors',
      registrationNumber: 'DL-CA-2023-5582',
      contactPerson: 'David Chen',
      phone: '+1 (619) 555-0350',
      email: 'sales@pacifichorizon.com',
      address: '789 Harbor Drive',
      city: 'San Diego',
      state: 'CA',
      pinCode: '92101',
      status: 'approved',
      isVerified: true,
      createdAt: '2024-01-12T08:00:00Z',
    },
  },
  {
    id: 'l8',
    dealerId: 'd4', // Bay Area Prestige Autos (San Jose)
    vehicleModelId: 'vm1',
    variantId: 'vv1',
    brand: 'Toyota',
    model: 'Camry',
    variant: 'LE',
    year: 2024,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'Midnight Black Metallic',
    mileage: 18,
    condition: 'new',
    price: 28700,
    exShowroomPrice: 26320,
    onRoadPrice: 30100,
    dealerOfferPrice: 28700,
    quantity: 2,
    deliveryTimeline: 'Within 15 days',
    availability: 'available',
    description: 'Silicon Valley certified dealer allocation. Full pre-delivery prep included.',
    images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80'],
    createdAt: '2024-02-07T08:00:00Z',
    updatedAt: '2024-02-07T08:00:00Z',
    dealer: {
      id: 'd4',
      userId: 'u7',
      dealershipName: 'Bay Area Prestige Autos',
      registrationNumber: 'DL-CA-2023-7719',
      contactPerson: 'Sarah Jenkins',
      phone: '+1 (408) 555-0420',
      email: 'contact@prestigeautos.com',
      address: '450 Silicon Valley Expressway',
      city: 'San Jose',
      state: 'CA',
      pinCode: '95113',
      status: 'approved',
      isVerified: true,
      createdAt: '2024-01-15T08:00:00Z',
    },
  },
  {
    id: 'l9',
    dealerId: 'd3', // Pacific Horizon Motors
    vehicleModelId: 'vm1',
    variantId: 'vv2',
    brand: 'Toyota',
    model: 'Camry',
    variant: 'XSE Hybrid',
    year: 2024,
    fuelType: 'Hybrid',
    transmission: 'CVT',
    color: 'Celestial Silver',
    mileage: 10,
    condition: 'new',
    price: 34200,
    exShowroomPrice: 32900,
    onRoadPrice: 35900,
    dealerOfferPrice: 34200,
    quantity: 1,
    deliveryTimeline: 'Immediate',
    availability: 'available',
    description: 'Special dealer promotion: $650 below regional MSRP for immediate delivery in San Diego.',
    images: ['https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=800&q=80'],
    createdAt: '2024-02-08T08:00:00Z',
    updatedAt: '2024-02-08T08:00:00Z',
    dealer: {
      id: 'd3',
      userId: 'u6',
      dealershipName: 'Pacific Horizon Motors',
      registrationNumber: 'DL-CA-2023-5582',
      contactPerson: 'David Chen',
      phone: '+1 (619) 555-0350',
      email: 'sales@pacifichorizon.com',
      address: '789 Harbor Drive',
      city: 'San Diego',
      state: 'CA',
      pinCode: '92101',
      status: 'approved',
      isVerified: true,
      createdAt: '2024-01-12T08:00:00Z',
    },
  },
  {
    id: 'l10',
    dealerId: 'd1', // Premier Auto Group
    vehicleModelId: 'vm2',
    variantId: 'vv3',
    brand: 'Honda',
    model: 'Accord',
    variant: 'Sport',
    year: 2024,
    fuelType: 'Petrol',
    transmission: 'CVT',
    color: 'Platinum White Pearl',
    mileage: 14,
    condition: 'new',
    price: 31900,
    exShowroomPrice: 29800,
    onRoadPrice: 33400,
    dealerOfferPrice: 31900,
    quantity: 2,
    deliveryTimeline: 'Within 7 days',
    availability: 'available',
    description: 'Premier Auto Group Los Angeles inventory with premium paint protection and floor mats.',
    images: ['https://images.unsplash.com/photo-1592853625597-7d17be820d0c?auto=format&fit=crop&w=800&q=80'],
    createdAt: '2024-02-09T08:00:00Z',
    updatedAt: '2024-02-09T08:00:00Z',
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
  },
  {
    id: 'l11',
    dealerId: 'd4', // Bay Area Prestige Autos
    vehicleModelId: 'vm2',
    variantId: 'vv3',
    brand: 'Honda',
    model: 'Accord',
    variant: 'Sport',
    year: 2024,
    fuelType: 'Petrol',
    transmission: 'CVT',
    color: 'Meteorite Gray Metallic',
    mileage: 4,
    condition: 'new',
    price: 31200,
    exShowroomPrice: 29800,
    onRoadPrice: 32800,
    dealerOfferPrice: 31200,
    quantity: 4,
    deliveryTimeline: 'Within 15 days',
    availability: 'available',
    description: 'Lowest price in Northern California. Volume dealer discount applied.',
    images: ['https://images.unsplash.com/photo-1592853625597-7d17be820d0c?auto=format&fit=crop&w=800&q=80'],
    createdAt: '2024-02-10T08:00:00Z',
    updatedAt: '2024-02-10T08:00:00Z',
    dealer: {
      id: 'd4',
      userId: 'u7',
      dealershipName: 'Bay Area Prestige Autos',
      registrationNumber: 'DL-CA-2023-7719',
      contactPerson: 'Sarah Jenkins',
      phone: '+1 (408) 555-0420',
      email: 'contact@prestigeautos.com',
      address: '450 Silicon Valley Expressway',
      city: 'San Jose',
      state: 'CA',
      pinCode: '95113',
      status: 'approved',
      isVerified: true,
      createdAt: '2024-01-15T08:00:00Z',
    },
  },
  {
    id: 'l12',
    dealerId: 'd1', // Premier Auto Group
    vehicleModelId: 'vm4',
    variantId: 'vv5',
    brand: 'Tesla',
    model: 'Model Y',
    variant: 'Long Range AWD',
    year: 2024,
    fuelType: 'Electric',
    transmission: 'Single-Speed',
    color: 'Pearl White Multi-Coat',
    mileage: 15,
    condition: 'new',
    price: 48490,
    exShowroomPrice: 47990,
    onRoadPrice: 51800,
    dealerOfferPrice: 48490,
    quantity: 2,
    deliveryTimeline: 'Within 7 days',
    availability: 'available',
    description: 'In-transit allocation arriving in Los Angeles showroom within 7 days. 20-inch Induction wheels.',
    images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&q=80'],
    createdAt: '2024-02-11T08:00:00Z',
    updatedAt: '2024-02-11T08:00:00Z',
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
  },
  {
    id: 'l13',
    dealerId: 'd3', // Pacific Horizon Motors
    vehicleModelId: 'vm4',
    variantId: 'vv5',
    brand: 'Tesla',
    model: 'Model Y',
    variant: 'Long Range AWD',
    year: 2024,
    fuelType: 'Electric',
    transmission: 'Single-Speed',
    color: 'Deep Blue Metallic',
    mileage: 8,
    condition: 'new',
    price: 47490,
    exShowroomPrice: 47990,
    onRoadPrice: 50700,
    dealerOfferPrice: 47490,
    quantity: 1,
    deliveryTimeline: 'Within 15 days',
    availability: 'available',
    description: 'Competitive electric incentive discount. Clean vehicle tax rebate eligible.',
    images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&q=80'],
    createdAt: '2024-02-12T08:00:00Z',
    updatedAt: '2024-02-12T08:00:00Z',
    dealer: {
      id: 'd3',
      userId: 'u6',
      dealershipName: 'Pacific Horizon Motors',
      registrationNumber: 'DL-CA-2023-5582',
      contactPerson: 'David Chen',
      phone: '+1 (619) 555-0350',
      email: 'sales@pacifichorizon.com',
      address: '789 Harbor Drive',
      city: 'San Diego',
      state: 'CA',
      pinCode: '92101',
      status: 'approved',
      isVerified: true,
      createdAt: '2024-01-12T08:00:00Z',
    },
  },
  {
    id: 'l14',
    dealerId: 'd4', // Bay Area Prestige Autos
    vehicleModelId: 'vm5',
    variantId: 'vv6',
    brand: 'BMW',
    model: '3 Series',
    variant: '330i xDrive',
    year: 2024,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'Portimao Blue Metallic',
    mileage: 11,
    condition: 'new',
    price: 45800,
    exShowroomPrice: 44500,
    onRoadPrice: 48900,
    dealerOfferPrice: 45800,
    quantity: 2,
    deliveryTimeline: 'Immediate',
    availability: 'available',
    description: 'BMW 330i xDrive with M Sport Package and Shadowline trim. Ready for immediate delivery.',
    images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80'],
    createdAt: '2024-02-13T08:00:00Z',
    updatedAt: '2024-02-13T08:00:00Z',
    dealer: {
      id: 'd4',
      userId: 'u7',
      dealershipName: 'Bay Area Prestige Autos',
      registrationNumber: 'DL-CA-2023-7719',
      contactPerson: 'Sarah Jenkins',
      phone: '+1 (408) 555-0420',
      email: 'contact@prestigeautos.com',
      address: '450 Silicon Valley Expressway',
      city: 'San Jose',
      state: 'CA',
      pinCode: '95113',
      status: 'approved',
      isVerified: true,
      createdAt: '2024-01-15T08:00:00Z',
    },
  },
  {
    id: 'l15',
    dealerId: 'd1', // Premier Auto Group
    vehicleModelId: 'vm5',
    variantId: 'vv6',
    brand: 'BMW',
    model: '3 Series',
    variant: '330i xDrive',
    year: 2024,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'Alpine White',
    mileage: 5,
    condition: 'new',
    price: 46500,
    exShowroomPrice: 44500,
    onRoadPrice: 49500,
    dealerOfferPrice: 46500,
    quantity: 1,
    deliveryTimeline: 'Within 7 days',
    availability: 'available',
    description: 'Alpine White with Tacora Red Vernasca Leather. Includes Premium Package.',
    images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80'],
    createdAt: '2024-02-14T08:00:00Z',
    updatedAt: '2024-02-14T08:00:00Z',
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
  },
  {
    id: 'l16',
    dealerId: 'd2', // City Cars Direct
    vehicleModelId: 'vm3',
    variantId: 'vv4',
    brand: 'Ford',
    model: 'F-150',
    variant: 'XLT SuperCrew',
    year: 2024,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'Carbonized Gray',
    mileage: 19,
    condition: 'new',
    price: 51800,
    exShowroomPrice: 49500,
    onRoadPrice: 54400,
    dealerOfferPrice: 51800,
    quantity: 1,
    deliveryTimeline: 'Within 7 days',
    availability: 'available',
    description: 'City Cars Direct discount price. Includes 302A luxury package and trailer tow.',
    images: ['https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80'],
    createdAt: '2024-02-15T08:00:00Z',
    updatedAt: '2024-02-15T08:00:00Z',
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
  },
  {
    id: 'l17',
    dealerId: 'd5', // Apex Motorworks (Pending dealer in Las Vegas)
    vehicleModelId: 'vm4',
    variantId: 'vv5',
    brand: 'Tesla',
    model: 'Model Y',
    variant: 'Long Range AWD',
    year: 2024,
    fuelType: 'Electric',
    transmission: 'Single-Speed',
    color: 'Solid Black',
    mileage: 2,
    condition: 'new',
    price: 47200,
    exShowroomPrice: 47990,
    onRoadPrice: 50400,
    dealerOfferPrice: 47200,
    quantity: 2,
    deliveryTimeline: 'Within 7 days',
    availability: 'available',
    description: 'Apex Motorworks exclusive price. Verification in progress with BestBuy platform.',
    images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&q=80'],
    createdAt: '2024-02-16T08:00:00Z',
    updatedAt: '2024-02-16T08:00:00Z',
    dealer: {
      id: 'd5',
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
  },
];

export const vehicleService = {
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

    const newListing: VehicleListing = {
      id: `l${Date.now()}`,
      dealerId: data.dealerId as string,
      vehicleModelId: (data.vehicleModelId as string) || 'vm1',
      variantId: (data.variantId as string) || 'vv1',
      brand: (data.brand as string) || 'Toyota',
      model: (data.model as string) || 'Camry',
      variant: (data.variant as string) || 'Base',
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
    const offerPrice = data.dealerOfferPrice !== undefined
      ? Number(data.dealerOfferPrice)
      : data.price !== undefined
      ? Number(data.price)
      : current.dealerOfferPrice;

    mockBrowserVehicles[idx] = {
      ...current,
      ...data,
      dealerOfferPrice: offerPrice,
      price: offerPrice,
      updatedAt: new Date().toISOString(),
    };

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

    mockBrowserVehicles[idx].dealerOfferPrice = prices.dealerOfferPrice;
    mockBrowserVehicles[idx].price = prices.dealerOfferPrice;
    if (prices.exShowroomPrice !== undefined) {
      mockBrowserVehicles[idx].exShowroomPrice = prices.exShowroomPrice;
    }
    if (prices.onRoadPrice !== undefined) {
      mockBrowserVehicles[idx].onRoadPrice = prices.onRoadPrice;
    }
    mockBrowserVehicles[idx].updatedAt = new Date().toISOString();

    return { success: true, data: mockBrowserVehicles[idx] };
  },

  async updateAvailability(id: string, availability: VehicleAvailabilityStatus): Promise<ApiResponse<VehicleListing>> {
    const api = getAPI();
    if (api?.vehicles?.updateAvailability) {
      return api.vehicles.updateAvailability(id, availability) as Promise<ApiResponse<VehicleListing>>;
    }

    const idx = mockBrowserVehicles.findIndex(v => v.id === id);
    if (idx === -1) return { success: false, error: 'Vehicle not found' };

    mockBrowserVehicles[idx].availability = availability;
    if (availability === 'out_of_stock') {
      mockBrowserVehicles[idx].quantity = 0;
    }
    mockBrowserVehicles[idx].updatedAt = new Date().toISOString();

    return { success: true, data: mockBrowserVehicles[idx] };
  },

  async delete(id: string): Promise<ApiResponse<{ id: string }>> {
    const api = getAPI();
    if (api?.vehicles?.delete) {
      return api.vehicles.delete(id) as Promise<ApiResponse<{ id: string }>>;
    }
    mockBrowserVehicles = mockBrowserVehicles.filter(v => v.id !== id);
    return { success: true, data: { id } };
  },
};
