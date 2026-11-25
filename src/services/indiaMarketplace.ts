import { z } from 'zod';
import { bodyTypes, indiaCatalogue, type CatalogueCar } from '../data/indiaCatalogue';
import { indiaDemo } from '../data/indiaDemo';
import { istDate } from './indiaFormat';
import { driveTimes, type DriveTime } from './driveSchedule';
export type { DriveTime } from './driveSchedule';
import type { ApiResponse, User, VehicleListing } from '../types';

export type DriveStatus = 'requested' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
export interface DriveSlot { dealerId: string; date: string; time: DriveTime; open: boolean; }
export interface TestDrive {
  id: string; customerId: string; dealerId: string; listingId: string;
  dealerName: string; address: string; vehicle: string; variant: string;
  name: string; mobile: string; email: string; contact: 'phone' | 'email';
  date: string; time: DriveTime; status: DriveStatus;
  history: { status: DriveStatus; date: string; time: DriveTime; changedAt: string }[];
}

export interface IndiaData { bookingHorizon?: number; catalogue: CatalogueCar[]; slots: DriveSlot[]; drives: TestDrive[]; }
export interface IndiaStore {
  run<T>(write: boolean, operation: (data: IndiaData) => T, scope?: 'catalogue'): Promise<T>;
}

export function emptyIndiaData(): IndiaData {
  const demo=indiaDemo();
  const listing=demo.listings.find(item=>item.dealerId==='d1')!;
  const slots:DriveSlot[]=[];
  const drives:TestDrive[]=[];
  const statuses:DriveStatus[]=['requested','confirmed','completed','cancelled'];
  statuses.forEach((status,index)=>{
    const customer=demo.customers[index];
    const date=istDate(new Date(Date.now()+(status==='completed'?-2:index+2)*86400000));
    const time='10:00';
    slots.push({dealerId:listing.dealerId,date,time,open:true});
    drives.push({id:`demo-drive-${index+1}`,customerId:customer.id,dealerId:listing.dealerId,listingId:listing.id,
      dealerName:listing.dealer!.dealershipName,address:`${listing.dealer!.address}, ${listing.dealer!.city}, India`,
      vehicle:`${listing.brand} ${listing.model}`,variant:listing.variant,name:customer.name,mobile:'',email:customer.email,
      contact:'email',date,time,status,history:[{status,date,time,changedAt:new Date().toISOString()}]});
  });
  return {catalogue:structuredClone(indiaCatalogue),slots,drives};
}
const label = z.string().trim().min(1).max(160);
const date = z.iso.date();
const time = z.enum(driveTimes);
const validSlot = z.object({ date,time });
const contact = z.object({
  name: z.string().trim().min(2).max(120), mobile:z.string().regex(/^(?:\+91)?[6-9]\d{9}$/),
  email:z.email().max(254),contact:z.enum(['phone','email']),
});
const carSchema = z.object({
  id:label,manufacturer:label,model:label,body:z.enum(bodyTypes),seats:z.number().int().min(1).max(12),
  image:z.url({ protocol:/^https$/ }).optional(),description:z.string().trim().min(1).max(1500),
  powertrain:label,features:z.array(label).max(20),active:z.boolean(),
  variants:z.array(z.object({name:label,fuel:z.enum(['Petrol','Diesel','Electric','Hybrid','CNG']),
    transmission:z.enum(['Manual','Automatic','CVT','DCT','Single-Speed']),indicativePrice:z.number().int().positive().max(1000000000)})).min(1).max(30),
});
const occupies = (drive: TestDrive) => drive.status === 'requested' || drive.status === 'confirmed' || drive.status === 'completed';
const sameSlot = (a:DriveSlot|TestDrive,b:{dealerId:string;date:string;time:DriveTime}) =>
  a.dealerId === b.dealerId && a.date === b.date && a.time === b.time;
const indiaTime = (day:string,slot:DriveTime) => Date.parse(`${day}T${slot}:00+05:30`);
const future = (day:string,slot:DriveTime) => indiaTime(day,slot)>Date.now();
const horizon = (state:IndiaData,day:string,slot:DriveTime) =>
  indiaTime(day,slot) <= Date.now()+(state.bookingHorizon ?? 60)*86_400_000;
class IndiaError extends Error {}
function requireRule(condition: unknown,message:string): asserts condition {
  if (!condition) throw new IndiaError(message);
}
function record(booking: TestDrive) {
  booking.history.push({ status:booking.status,date:booking.date,time:booking.time,changedAt:new Date().toISOString() });
}

export function createIndiaMarketplace(store: IndiaStore, lookup: (id:string) => Promise<VehicleListing | undefined>) {
  return async (actor:User,command:string,raw?:unknown):Promise<ApiResponse<unknown>> => {
    try {
      const admin = actor.role === 'admin';
      const customer = actor.role === 'customer';
      const dealerId = actor.role === 'dealer' && actor.dealerProfile?.status === 'approved' ? actor.dealerProfile.id : undefined;
      if (command === 'catalogue') return {success:true,data:await store.run(false,state => state.catalogue.filter(car => car.active || admin),'catalogue')};
      if (command === 'saveCar') {
        requireRule(admin,'Administrator access is required.');
        const car = carSchema.parse(raw);
        const canonical = (value:string) => value.trim().toLocaleLowerCase('en-IN');
        requireRule(new Set(car.variants.map(item=>canonical(item.name))).size === car.variants.length,'Variant names must be unique.');
        return {success:true,data:await store.run(true,state=>{
          requireRule(!state.catalogue.some(item=>item.id!==car.id && canonical(item.manufacturer)===canonical(car.manufacturer) &&
            canonical(item.model)===canonical(car.model)),'This manufacturer and model already exist.');
          state.catalogue = [...state.catalogue.filter(item=>item.id!==car.id),car];
          return car;
        },'catalogue')};
      }
      if (command === 'setManufacturerActive') {
        requireRule(admin,'Administrator access is required.');
        const input=z.object({manufacturer:label,active:z.boolean()}).parse(raw);
        return {success:true,data:await store.run(true,state=>{
          requireRule(state.catalogue.some(car=>car.manufacturer===input.manufacturer),'Manufacturer was not found.');
          state.catalogue=state.catalogue.map(car=>car.manufacturer===input.manufacturer ? {...car,active:input.active} : car);
          return state.catalogue;
        },'catalogue')};
      }
      if (command === 'settings' || command === 'setSettings') {
        requireRule(admin,'Administrator access is required.');
        const write=command==='setSettings';
        const days=write ? z.number().int().min(7).max(120).parse(raw) : undefined;
        return {success:true,data:await store.run(write,state=>{
          if(days!==undefined) state.bookingHorizon=days;
          return state.bookingHorizon ?? 60;
        })};
      }
      if (command === 'drives') return {success:true,data:await store.run(false,state=>state.drives.filter(drive=>
        admin || (customer && drive.customerId===actor.id) || (dealerId && drive.dealerId===dealerId)))};
      if (command === 'dealerSlots') {
        requireRule(dealerId,'Only approved dealers can manage slots.');
        const day=date.parse(raw);
        return {success:true,data:await store.run(false,state=>state.slots.filter(slot=>slot.dealerId===dealerId && slot.date===day))};
      }
      if (command === 'setSlot') {
        requireRule(dealerId,'Only approved dealers can manage slots.');
        const input=validSlot.extend({open:z.boolean()}).parse(raw);
        requireRule(future(input.date,input.time),'Select a future time in India Standard Time.');
        const slot={...input,dealerId};
        return {success:true,data:await store.run(true,state=>{
          requireRule(!input.open || horizon(state,input.date,input.time),'This date is beyond the marketplace booking window.');
          requireRule(input.open || !state.drives.some(drive=>sameSlot(drive,slot) && occupies(drive)),'This slot has a booking.');
          state.slots=[...state.slots.filter(item=>!sameSlot(item,slot)),slot];
          return slot;
        })};
      }
      if (command === 'availability' || command === 'request') {
        requireRule(customer,'Only customers can request a test drive.');
        const input=z.object({listingId:label,date}).parse(raw);
        const listing=await lookup(input.listingId);
        requireRule(listing?.dealer?.status === 'approved' && listing.availability === 'available' && listing.quantity > 0,
          'This listing is unavailable for test drives.');
        const available = (state:IndiaData,slot:DriveSlot) => future(slot.date,slot.time) && horizon(state,slot.date,slot.time) && slot.open &&
          !state.drives.some(drive=>sameSlot(drive,slot)&&occupies(drive));
        if (command === 'availability') return {success:true,data:await store.run(false,state=>state.slots.filter(slot=>
          slot.dealerId===listing.dealerId && slot.date===input.date && available(state,slot)).map(slot=>slot.time).sort())};
        const info=contact.extend({time}).parse(raw);
        return {success:true,data:await store.run(true,state=>{
          const slot=state.slots.find(slot=>sameSlot(slot,{dealerId:listing.dealerId,date:input.date,time:info.time}));
          requireRule(slot && available(state,slot),'This slot is no longer available. Choose another time.');
          const booking:TestDrive = {
            id:crypto.randomUUID(),customerId:actor.id,dealerId:listing.dealerId,listingId:listing.id,
            dealerName:listing.dealer!.dealershipName,address:[listing.dealer!.address,listing.dealer!.city,listing.dealer!.state,listing.dealer!.pinCode].join(', '),
            vehicle:`${listing.brand} ${listing.model}`,variant:listing.variant,
            ...info,date:input.date,status:'requested',history:[],
          };
          record(booking);
          state.drives.push(booking);
          return booking;
        })};
      }
      if (command === 'reschedule' || command === 'changeStatus') {
        const id=z.object({id:label}).parse(raw).id;
        return {success:true,data:await store.run(true,state=>{
          const booking=state.drives.find(drive=>drive.id===id);
          requireRule(booking,'Test-drive request was not found.');
          requireRule(booking.status==='requested' || booking.status==='confirmed','This request is closed.');
          const owns=customer && booking.customerId===actor.id;
          if (command==='reschedule') {
            requireRule(owns,'Only the customer can reschedule this request.');
            requireRule(future(booking.date,booking.time),'A past booking cannot be rescheduled.');
            const next=validSlot.parse(raw);
            const slot=state.slots.find(slot=>sameSlot(slot,{...next,dealerId:booking.dealerId}));
            requireRule(slot?.open && future(next.date,next.time) && horizon(state,next.date,next.time) && !state.drives.some(other=>other.id!==id && sameSlot(other,slot) && occupies(other)),
              'This slot is no longer available.');
            Object.assign(booking,next,{status:'requested'});
          } else {
            const {status}=z.object({status:z.enum(['confirmed','rejected','cancelled','completed'])}).parse(raw);
            if (status==='cancelled') requireRule(owns && future(booking.date,booking.time),'Only the customer can cancel an upcoming request.');
            else {
              requireRule(dealerId===booking.dealerId,'Only the assigned dealer can change this request.');
              if (status==='confirmed') requireRule(booking.status==='requested' && future(booking.date,booking.time),'Only upcoming requests can be confirmed.');
              if (status==='rejected') requireRule(future(booking.date,booking.time),'A past booking cannot be rejected.');
              if (status==='completed') requireRule(booking.status==='confirmed' && !future(booking.date,booking.time),'Complete confirmed test drives after their start time.');
            }
            booking.status=status;
          }
          record(booking);
          return booking;
        })};
      }
      throw new IndiaError('Unknown India marketplace operation.');
    } catch (error) {
      const message = error instanceof IndiaError ? error.message : error instanceof z.ZodError
        ? `Check the ${error.issues[0]?.path.join(' ') || 'required'} field.` : 'The marketplace operation could not be saved. Try again.';
      return {success:false,error:message};
    }
  };
}
