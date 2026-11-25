import { demoLocations } from './indiaLocations';
import { indiaSampleInventory } from './indiaInventory';
import type { User, Dealer, QueueEntry, Offer, Booking } from '../types';

export function indiaDemo(now = new Date()) {
  const timestamp=now.toISOString();
  const dealerNames=['Coastal Auto Group','Deccan City Motors','Garden City Motors','Marina Prestige Autos','Konkan Auto Studio'];
  const dealers:Dealer[]=demoLocations.map(([city,state,pinCode,area],index)=>({
    id:`d${index+1}`,userId:index===0?'u2':`demo-dealer-${index+1}`,dealershipName:`${dealerNames[index]} · Demo`,
    registrationNumber:`BESTBUY-INDIA-DEMO-${index+1}`,contactPerson:['Arjun Rao','Zoya Ahmed','Kiran Shetty','Meera Iyer','Rohan Shah'][index],
    phone:'+91 00000 00000',email:`dealer${index+1}@bestbuy.example`,address:`Sample showroom, ${area}`,
    city,state,pinCode,status:'approved',isVerified:true,createdAt:timestamp,
  }));
  const customers:User[]=['Ananya Rao','Aarav Mehta','Diya Menon','Kabir Sen'].map((name,index)=>({
    id:index===0?'u1':`demo-buyer-${index+1}`,name,email:index===0?'customer@bestbuy.example':`customer${index+1}@bestbuy.example`,
    role:'customer',createdAt:timestamp,
  }));
  const users:User[]=[...customers,...dealers.map((dealer,index):User=>({
    id:dealer.userId,name:dealer.contactPerson,email:index===0?'dealer@bestbuy.example':dealer.email,role:'dealer',dealerProfile:dealer,createdAt:timestamp,
  })),{id:'u3',name:'BestBuy Demo Admin',email:'admin@bestbuy.example',role:'admin',createdAt:timestamp}];
  const listings=indiaSampleInventory(dealers);
  const listing=listings.find(item=>item.dealerId==='d1')!;
  const queues:QueueEntry[]=customers.map((customer,index)=>({
    id:`india-queue-${index+1}`,vehicleModelId:listing.vehicleModelId,variantId:listing.variantId,
    city:listing.dealer!.city,customerId:customer.id,customerName:customer.name,position:index+1,
    status:index===0?'offered':'waiting',createdAt:timestamp,
  }));
  const offers:Offer[]=[{
    id:'india-demo-offer',queueEntryId:queues[0].id,customerId:customers[0].id,customerName:customers[0].name,
    dealerId:listing.dealerId,dealerName:listing.dealer!.dealershipName,listingId:listing.id,vehicleModelId:listing.vehicleModelId,
    vehicleName:`${listing.brand} ${listing.model}`,variantName:listing.variant,
    originalPrice:listing.dealerOfferPrice,offeredPrice:listing.dealerOfferPrice-10000,status:'pending',
    createdAt:timestamp,expiryDate:new Date(+now+7*86400000).toISOString(),
  }];
  const bookings:Booking[]=[{
    id:'india-demo-booking',customerId:customers[1].id,customerName:customers[1].name,listingId:listing.id,dealerId:listing.dealerId,
    status:'completed',bookingDate:timestamp,createdAt:timestamp,lockedPrice:listing.dealerOfferPrice,
    lockDurationHours:72,priceLockedUntil:timestamp,vehicleName:offers[0].vehicleName,variantName:listing.variant,
  }];
  return {users,dealers,customers,listings,queues,offers,bookings};
}
