import { resolveVehicleIdentity } from '../../services/vehicleIdentity';
import { demandFixtures } from '../../data/demandFixtures';
import { pricingService, type ListingPriceChange } from '../../services/pricingService';
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
  CreateVehicleListingData,
  UpdateVehicleListingData,
  VehicleAvailabilityStatus,
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
    {
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
    {
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
          transmission: 'Automatic',
          fuelType: 'Petrol',
          seatingCapacity: 5,
          features: ['Apple CarPlay', 'Toyota Safety Sense 2.5+', 'Backup Camera', 'Dual-Zone Climate'],
        },
        {
          id: 'vv2',
          name: 'XSE Hybrid',
          trimLevel: 'Sport Premium',
          engineType: '2.5L 4-Cylinder Hybrid',
          transmission: 'CVT',
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
          fuelType: 'Petrol',
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
          transmission: 'Automatic',
          fuelType: 'Petrol',
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
          transmission: 'Single-Speed',
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
          transmission: 'Automatic',
          fuelType: 'Petrol',
          seatingCapacity: 5,
          features: ['BMW Curved Display', 'Live Cockpit Pro', 'Adaptive M Suspension', 'Harman Kardon'],
        },
      ],
    },
  ];

  // Multi-dealer independent listings
  private _listings: VehicleListing[] = [
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
    },
    {
      id: 'l3',
      dealerId: 'd2', // City Cars Direct (SAME model as l1, but different price, delivery timeline & quantity!)
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
      price: 27900, // City Cars is cheaper than Premier ($27,900 vs $28,400)
      exShowroomPrice: 26320,
      onRoadPrice: 29200,
      dealerOfferPrice: 27900,
      quantity: 1,
      deliveryTimeline: 'Within 7 days',
      availability: 'available',
      description: 'City Cars Direct competitive price match! Ready for customer test drive at our San Francisco showroom.',
      images: ['https://images.unsplash.com/photo-1590362891988-f77804702e0a?auto=format&fit=crop&w=800&q=80'],
      createdAt: '2024-02-02T08:00:00Z',
      updatedAt: '2024-02-02T08:00:00Z',
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
      description: 'Honda Accord Sport with wireless Apple CarPlay, 19-inch sport alloys and Honda Sensing driver assist.',
      images: ['https://images.unsplash.com/photo-1592853625597-7d17be820d0c?auto=format&fit=crop&w=800&q=80'],
      createdAt: '2024-02-03T08:00:00Z',
      updatedAt: '2024-02-03T08:00:00Z',
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
      description: 'Ford F-150 SuperCrew with 3.5L EcoBoost, max trailering package and 2.4kW Pro Power Onboard.',
      images: ['https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80'],
      createdAt: '2024-02-04T08:00:00Z',
      updatedAt: '2024-02-04T08:00:00Z',
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
    },
    {
      id: 'l7',
      dealerId: 'd3', // Pacific Horizon Motors
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
    },
    {
      id: 'l8',
      dealerId: 'd4', // Bay Area Prestige Autos
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
    },
    {
      id: 'l17',
      dealerId: 'd5', // Apex Motorworks
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
    },
  ];

  private _queues: QueueEntry[] = [
    ...demandFixtures().queues,
    {
      id: 'q1',
      city: 'Los Angeles',
      vehicleModelId: 'vm1',
      variantId: 'vv2',
      customerId: 'u1',
      customerName: 'Alice Johnson',
      customerPhone: '+1 (555) 234-5678',
      position: 2,
      status: 'waiting',
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: 'q2',
      city: 'San Francisco',
      vehicleModelId: 'vm4',
      variantId: 'vv5',
      customerId: 'u1',
      customerName: 'Alice Johnson',
      customerPhone: '+1 (555) 234-5678',
      position: 1,
      status: 'offered',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'q3',
      city: 'Los Angeles',
      vehicleModelId: 'vm1',
      variantId: 'vv1',
      customerId: 'u6',
      customerName: 'David Miller',
      customerPhone: '+1 (555) 778-9900',
      position: 1,
      status: 'waiting',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
  ];

  private _offers: Offer[] = [
    ...demandFixtures().offers,
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
      color: 'Stealth Grey',
      availability: 'In Stock (Allocation #TY-44)',
      expectedDeliveryDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      offeredPrice: 46500,
      originalPrice: 47990,
      status: 'pending',
      expiryDate: new Date(Date.now() + 86400000 * 5).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      notes: 'Queue priority offer: $1,490 dealer incentive discount.',
      terms: 'Offer price valid for 5 days. Includes complimentary ceramic paint coating and 1st year mobile charger.',
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
      color: 'Wind Chill Pearl',
      availability: 'In Stock (2 units)',
      expectedDeliveryDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      offeredPrice: 33900,
      originalPrice: 34850,
      status: 'pending',
      expiryDate: new Date(Date.now() + 86400000 * 4).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      notes: 'Exclusive queue match pricing with immediate showroom delivery.',
      terms: 'Price includes destination fee and 2 years complimentary factory scheduled maintenance.',
    },
  ];

  private _bookings: Booking[] = [
    ...demandFixtures().bookings,
    {
      id: 'b1',
      customerId: 'u1',
      customerName: 'Alice Johnson',
      customerPhone: '+1 (555) 234-5678',
      listingId: 'l1',
      dealerId: 'd1',
      status: 'confirmed',
      bookingDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      lockedPrice: 28400,
      lockDurationHours: 72,
      priceLockedUntil: new Date(Date.now() + 86400000 * 3).toISOString(),
      vehicleName: 'Toyota Camry',
      variantName: 'LE',
      color: 'Midnight Black Metallic',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
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
      const newListing: VehicleListing = {
        id: `l${Date.now()}`,
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
      return { success: true, data: newListing };
    },

    update: async (id: string, data: UpdateVehicleListingData | Record<string, unknown>) => {
      const idx = this._listings.findIndex(l => l.id === id);
      if (idx === -1) return { success: false, error: 'Vehicle listing not found.' };

      const current = this._listings[idx];
      const updatedOfferPrice = data.dealerOfferPrice !== undefined
        ? Number(data.dealerOfferPrice)
        : data.price !== undefined
        ? Number(data.price)
        : current.dealerOfferPrice;

      if (!pricingService.isValid(updatedOfferPrice)) return { success: false, error: 'Enter a valid positive dealer price.' };

      this._listings[idx] = {
        ...current,
        ...data,
        ...pricingService.revise(current, updatedOfferPrice, new Date().toISOString()),
        updatedAt: new Date().toISOString(),
      };
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
      const updatedAt = new Date().toISOString();
      this._listings[idx] = {
        ...current,
        ...pricingService.revise(current, prices.dealerOfferPrice, updatedAt),
        exShowroomPrice: prices.exShowroomPrice ?? current.exShowroomPrice,
        onRoadPrice: prices.onRoadPrice ?? current.onRoadPrice,
        updatedAt,
      };

      return { success: true, data: { ...this._listings[idx], dealer: this._dealers.find(dealer => dealer.id === this._listings[idx].dealerId) } };
    },

    updateAvailability: async (id: string, availability: VehicleAvailabilityStatus) => {
      const idx = this._listings.findIndex(l => l.id === id);
      if (idx === -1) return { success: false, error: 'Vehicle listing not found.' };

      this._listings[idx].availability = availability;
      if (availability === 'out_of_stock') {
        this._listings[idx].quantity = 0;
      }
      this._listings[idx].updatedAt = new Date().toISOString();

      return { success: true, data: { ...this._listings[idx], dealer: this._dealers.find(dealer => dealer.id === this._listings[idx].dealerId) } };
    },

    delete: async (id: string) => {
      const idx = this._listings.findIndex(l => l.id === id);
      if (idx === -1) return { success: false, error: 'Vehicle listing not found.' };
      const [listing] = this._listings.splice(idx, 1);
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
    join: async (data: { vehicleModelId: string; customerId: string; variantId?: string; city?: string }) => {
      const position = this._queues.filter(
        q => q.vehicleModelId === data.vehicleModelId && q.variantId === (data.variantId || '') &&
        q.city?.trim().toLowerCase() === data.city?.trim().toLowerCase() &&
        (q.status === 'waiting' || q.status === 'offered')
      ).length + 1;
      const customer = this._users.find(u => u.id === data.customerId);
      const entry: QueueEntry = {
        id: `q${Date.now()}`,
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
      this._queues[idx].status = 'cancelled';
      return { success: true, data: { id: queueId } };
    },

    getByCustomerId: async (customerId: string) => {
      const userQueues = this._queues
        .filter(q => q.customerId === customerId)
        .map(q => ({
          ...q,
          vehicleModel: this._vehicleModels.find(m => m.id === q.vehicleModelId),
        }));
      return { success: true, data: userQueues };
    },

    getAll: async () => {
      const allQueues = this._queues.map(q => ({
        ...q,
        vehicleModel: this._vehicleModels.find(m => m.id === q.vehicleModelId),
      }));
      return { success: true, data: allQueues };
    },
  };

  offers = {
    accept: async (id: string, lockDurationHours: number): Promise<ApiResponse<{ offer: Offer; bookingId: string }>> => {
      const offer = this._offers.find(item => item.id === id);
      if (!offer?.listingId || offer.status !== 'pending' || !(Date.parse(offer.expiryDate) > Date.now())) {
        return { success: false, error: 'This offer is no longer available.' };
      }
      if (![24, 48, 72, 168].includes(lockDurationHours)) {
        return { success: false, error: 'Select a supported price lock duration.' };
      }

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
      offer.status = 'accepted';
      const queue = this._queues.find(item => item.id === offer.queueEntryId);
      if (queue && (queue.status === 'waiting' || queue.status === 'offered')) queue.status = 'booked';
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
      const listing = this._listings.find(item => item.id === data.listingId && item.dealerId === data.dealerId);
      if (!listing || !pricingService.isValid(data.offeredPrice)) {
        return { success: false, error: 'Select a dealer listing and enter a valid offer price.' };
      }
      const newOffer: Offer = {
        ...data,
        originalPrice: pricingService.current(listing),
        id: `o${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      this._offers.push(newOffer);
      return { success: true, data: newOffer };
    },

    updateStatus: async (id: string, status: Offer['status']) => {
      const offer = this._offers.find(o => o.id === id);
      if (!offer) return { success: false, error: 'Offer not found.' };
      if (offer.status !== 'pending' || status === 'accepted') {
        return { success: false, error: 'This offer status cannot be changed.' };
      }
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

    create: async (data: { customerId: string; listingId: string; dealerId: string; notes?: string; lockedPrice?: number; bookingDate?: string }) => {
      const listing = this._listings.find(item => item.id === data.listingId && item.dealerId === data.dealerId);
      if (!listing) return { success: false, error: 'Vehicle listing not found.' };
      const lockedPrice = pricingService.current(listing);
      if (data.lockedPrice !== undefined && data.lockedPrice !== lockedPrice) {
        return { success: false, error: 'The dealer price changed. Review the current listing price before booking.' };
      }
      const now = Date.now();
      const customer = this._users.find(u => u.id === data.customerId);
      const booking: Booking = {
        id: `b${Date.now()}`,
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
