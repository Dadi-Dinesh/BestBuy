import { indiaCatalogue } from './indiaCatalogue';
import type { Dealer,VehicleListing } from '../types';

const indiaSamples = ['Swift','Baleno','Fronx','Brezza','Creta','Venue','i20','Nexon','Punch','Nexon EV','XUV 3XO','Scorpio N','Sonet','Seltos','Glanza','City','Elevate','Virtus','Kushaq','Kwid','Windsor EV','Magnite','C3','Atto 3'];

export function indiaSampleInventory(dealers:Dealer[]) {
  return indiaCatalogue.filter(car=>indiaSamples.includes(car.model)).flatMap((car,index)=>{
    const selections = [dealers[index % dealers.length],dealers[(index+1) % dealers.length]];
    return selections.map((dealer,offset):VehicleListing=>{
      const variant=car.variants[0];
      const price=variant.indicativePrice+offset*15_000;
      return {
        id:`india-${car.id}-${offset}`,dealerId:dealer.id,dealer,vehicleModelId:car.id,variantId:`${car.id}-${variant.name}`,
        brand:car.manufacturer,model:car.model,variant:variant.name,year:2025,fuelType:variant.fuel,transmission:variant.transmission,
        color:offset?'Graphite':'White',mileage:0,condition:'new',price,dealerOfferPrice:price,exShowroomPrice:variant.indicativePrice,
        onRoadPrice:Math.round(price*1.12),quantity:2,availability:'available',deliveryTimeline:'Within 7 days',
        description:'Sample dealer inventory for the India Edition demonstration. Confirm actual prices and stock with a dealer.',
        images:car.image?[car.image]:[],createdAt:'2025-01-01T00:00:00Z',updatedAt:'2025-01-01T00:00:00Z',
      };
    });
  });
}
