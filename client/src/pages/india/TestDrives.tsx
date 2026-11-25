import { useEffect,useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { istDate } from '../../../../src/services/indiaFormat';
import { driveTimes, type DriveTime } from '../../../../src/services/driveSchedule';
import type { DriveSlot, TestDrive } from '../../../../src/services/indiaMarketplace';
import { indiaLocations } from '../../../../src/data/indiaLocations';
import { useAuthStore } from '../../store/authStore';
import { useDemoMode } from '../../services/desktopMode';
import { indiaRequest } from '../../services/indiaService';
import { vehicleService } from '../../services/vehicleService';
import type { VehicleListing } from '../../types';
import { field,panel,primary,secondary,SelectField,useIndiaCatalogue } from './IndiaCatalogue';

const clock=(time:string)=>{const [h,m]=time.split(':');return `${Number(h)%12||12}:${m} ${Number(h)>=12?'PM':'AM'}`;};
const unique=(items:string[])=>Array.from(new Set(items)).sort();
const active=(item:TestDrive)=>['requested','confirmed'].includes(item.status);
const upcoming=(item:TestDrive)=>active(item) && Date.parse(`${item.date}T${item.time}:00+05:30`)>Date.now();
function SlotPicker({slots,selected,choose}:{slots:DriveTime[];selected:string;choose:(slot:DriveTime)=>void}) {
  return <div className="flex flex-wrap gap-2">{slots.map(slot=><button key={slot} type="button" className={selected===slot?primary:secondary}
    aria-pressed={selected===slot} onClick={()=>choose(slot)}>{clock(slot)}</button>)}</div>;
}

export function TestDrives() {
  const user=useAuthStore(store=>store.user);
  const demo=useDemoMode();
  const customer=user?.role==='customer';
  const dealer=user?.role==='dealer';
  const [params]=useSearchParams();
  const {cars}=useIndiaCatalogue();
  const [inventory,setInventory]=useState<VehicleListing[]>([]);
  const [list,setList]=useState<TestDrive[]>([]);
  const [make,setMake]=useState(''); const [model,setModel]=useState(''); const [variant,setVariant]=useState('');
  const [state,setState]=useState(''); const [city,setCity]=useState('');
  const [listingId,setListingId]=useState(params.get('listing')||'');
  const [day,setDay]=useState(istDate()); const [slot,setSlot]=useState<DriveTime|''>('');
  const [slots,setSlots]=useState<DriveTime[]>([]); const [dealerSlots,setDealerSlots]=useState<DriveSlot[]>([]);
  const [reschedule,setReschedule]=useState<TestDrive>();
  const [confirmation,setConfirmation]=useState<TestDrive>();
  const [busy,setBusy]=useState(false); const [loading,setLoading]=useState(true);
  const [slotsLoading,setSlotsLoading]=useState(false); const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [mode,setMode]=useState('Upcoming');
  const savedListing=inventory.find(item=>item.id===listingId);
  const firstCar=cars.find(car=>car.id===params.get('car'));
  useEffect(()=>{
    if(firstCar){setMake(firstCar.manufacturer);setModel(firstCar.model);setVariant(params.get('variant')||'');}
  },[firstCar,params]);
  useEffect(()=>{
    if(!params.get('listing'))return;
    const fromDetails=inventory.find(item=>item.id===params.get('listing'));
    if(fromDetails){setMake(fromDetails.brand);setModel(fromDetails.model);setVariant(fromDetails.variant);}
  },[inventory,params]);
  const loadDrives=async()=>setList(await indiaRequest<TestDrive[]>('drives'));
  useEffect(()=>{
    setLoading(true);
    const requests:Promise<unknown>[]=[loadDrives()];
    if(customer)requests.push(vehicleService.getAll({marketplace:true}).then(result=>{
      if(!result.success||!result.data)throw new Error(result.error||'Dealer inventory is unavailable.');
      setInventory(result.data.filter(item=>item.availability==='available'&&item.quantity>0));
    }));
    Promise.all(requests).catch((err:Error)=>setError(err.message)).finally(()=>setLoading(false));
  },[customer]);
  useEffect(()=>{
    let activeRequest=true;
    setSlots([]);setSlot('');
    if(dealer)setDealerSlots([]);
    const id=reschedule?.listingId||listingId;
    if(customer&&id&&day){
      setSlotsLoading(true);
      indiaRequest<DriveTime[]>('availability',{listingId:id,date:day}).then(items=>{if(activeRequest)setSlots(items);})
        .catch((err:Error)=>{if(activeRequest)setError(err.message);}).finally(()=>{if(activeRequest)setSlotsLoading(false);});
    }else setSlotsLoading(false);
    if(dealer&&day&&user?.dealerProfile?.status==='approved')indiaRequest<DriveSlot[]>('dealerSlots',day)
      .then(items=>{if(activeRequest)setDealerSlots(items);}).catch((err:Error)=>{if(activeRequest)setError(err.message);});
    return ()=>{activeRequest=false;};
  },[customer,dealer,day,listingId,reschedule,user?.dealerProfile?.status]);

  async function run<T>(command:string,input:unknown,done:(result:T)=>void) {
    setBusy(true);setError('');setMessage('');
    try {
      const result=await indiaRequest<T>(command,input);
      done(result);
      await loadDrives();
    }catch(error){setError((error as Error).message);}
    finally{setBusy(false);}
  }
  const candidates=inventory.filter(item=>item.brand===make&&item.model===model&&item.variant===variant&&
    (!state||item.dealer?.state===state)&&(!city||item.dealer?.city===city));

  return <section className="mx-auto max-w-6xl space-y-5">
    <header><h1 className="text-3xl font-bold tracking-tight">Test drives</h1>
      <p className="text-sm text-slate-500">{demo?'Demo appointments. Requests and confirmations are saved locally and do not contact a real dealer.':'All appointment times are in India Standard Time (IST).'}</p>
    </header>
    {loading&&<p role="status">Loading appointments…</p>}
    {error&&<p role="alert" className={panel}>{error}</p>}
    {message&&<p role="status" className={panel}>{message}</p>}
    {confirmation&&<section className={`${panel} space-y-2`} aria-label="Test drive confirmation">
      <h2 className="text-xl font-bold">Request submitted</h2>
      <p>Status · Awaiting dealer confirmation</p><p>Booking ID · <code>{confirmation.id}</code></p>
      <p>{confirmation.name} · {confirmation.vehicle} {confirmation.variant}</p>
      <p>{confirmation.dealerName} · {confirmation.address}</p><p>{confirmation.date} · {clock(confirmation.time)} IST</p>
      <button className={secondary} onClick={()=>setConfirmation(undefined)}>Dismiss</button>
    </section>}
    {customer&&<form className={`${panel} space-y-4`} onSubmit={event=>{
      event.preventDefault();
      if(!slot||!day)return;
      if(reschedule)void run<TestDrive>('reschedule',{id:reschedule.id,date:day,time:slot},item=>{setConfirmation(item);setReschedule(undefined);});
      else {
        const values=Object.fromEntries(new FormData(event.currentTarget));
        void run<TestDrive>('request',{...values,listingId,date:day,time:slot},item=>{
          setConfirmation(item);setSlots(items=>items.filter(time=>time!==slot));setSlot('');
        });
      }
    }}>
      <h2 className="text-xl font-bold">{reschedule?`Reschedule ${reschedule.vehicle}`:'Book a test drive'}</h2>
      {!reschedule&&<>
        <div className="grid gap-3 md:grid-cols-3">
          <SelectField name="Manufacturer" options={unique([...inventory.map(item=>item.brand),...(make?[make]:[])])} value={make}
            placeholder="Choose manufacturer" onChange={value=>{setMake(value);setModel('');setVariant('');setListingId('');}}/>
          <SelectField name="Model" options={unique([...inventory.filter(item=>item.brand===make).map(item=>item.model),...(model?[model]:[])])}
            value={model} placeholder="Choose model" onChange={value=>{setModel(value);setVariant('');setListingId('');}}/>
          <SelectField name="Variant" options={unique([...inventory.filter(item=>item.brand===make&&item.model===model).map(item=>item.variant),...(variant?[variant]:[])])}
            value={variant} placeholder="Choose variant" onChange={value=>{setVariant(value);setListingId('');}}/>
          <SelectField name="State" value={state} options={Object.keys(indiaLocations)} onChange={value=>{setState(value);setCity('');setListingId('');}}/>
          <SelectField name="City" value={city} options={state?indiaLocations[state]??[]:Object.values(indiaLocations).flat()} onChange={value=>{setCity(value);setListingId('');}}/>
          <label className="block space-y-1 text-sm">Dealer<select className={field} value={listingId} onChange={e=>setListingId(e.target.value)} required>
            <option value="">Choose dealer</option>{candidates.map(item=><option key={item.id} value={item.id}>{item.dealer?.dealershipName} · {item.dealer?.city} · {item.color}</option>)}</select></label>
        </div>
        {variant&&!candidates.length&&<p className="text-sm text-slate-500">No dealer has eligible stock for this variant and location.</p>}
        {savedListing&&<p className="text-sm">{savedListing.dealer?.address}, {savedListing.dealer?.city} {savedListing.dealer?.pinCode}</p>}
      </>}
      <label className="block max-w-xs space-y-1 text-sm">Date<input className={field} type="date" required value={day} min={istDate()} onChange={e=>{setDay(e.target.value);setError('');}}/></label>
      {(listingId||reschedule)&&day&&<div className="space-y-2"><p className="text-sm font-semibold">Available time slots · IST</p>
        <SlotPicker slots={slots} selected={slot} choose={setSlot}/>
        {!slots.length&&<p className="text-sm text-slate-500">{slotsLoading?'Checking availability…':'No open slots on this date.'}</p>}
      </div>}
      {!reschedule&&<div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">Full name<input className={field} name="name" defaultValue={user?.name} required minLength={2}/></label>
        <label className="space-y-1 text-sm">Indian mobile number<input className={field} name="mobile" type="tel" required pattern="(?:\+91)?[6-9][0-9]{9}" placeholder="9876543210"/></label>
        <label className="space-y-1 text-sm">Email<input className={field} name="email" type="email" required defaultValue={user?.email}/></label>
        <label className="space-y-1 text-sm">Preferred contact method<select name="contact" className={field}><option value="phone">Phone</option><option value="email">Email</option></select></label>
      </div>}
      <div className="flex gap-2"><button className={primary} disabled={!slot||busy} type="submit">{busy?'Saving…':reschedule?'Save new time':'Request test drive'}</button>
        {reschedule&&<button type="button" className={secondary} onClick={()=>setReschedule(undefined)}>Cancel reschedule</button>}</div>
    </form>}
    {dealer&&<section className={`${panel} space-y-3`}><h2 className="text-xl font-bold">Dealer availability</h2>
      {user?.dealerProfile?.status!=='approved' ? <p>Your dealership must be approved to publish appointment slots.</p>:<>
        <label className="block max-w-xs space-y-1 text-sm">Availability date<input className={field} type="date" value={day} min={istDate()} onChange={e=>setDay(e.target.value)}/></label>
        <div className="flex flex-wrap gap-2">{driveTimes.map(time=>{
          const opened=dealerSlots.some(item=>item.time===time&&item.open);
          const occupied=list.some(item=>item.date===day&&item.time===time&&(active(item)||item.status==='completed'));
          return <button key={time} type="button" className={opened?primary:secondary} disabled={busy||occupied||!day} onClick={()=>
            void run<DriveSlot>('setSlot',{date:day,time,open:!opened},item=>setDealerSlots(items=>[...items.filter(previous=>previous.time!==time),item]))}>
            {clock(time)} · {occupied?'Booked':opened?'Open':'Closed'}</button>;
        })}</div>
      </>}
    </section>}
    <section className={`${panel} space-y-3`}><h2 className="text-xl font-bold">{customer?'My appointments':'Test-drive requests'}</h2>
      {customer&&<SelectField name="Appointment view" value={mode} options={['Upcoming','Completed','History']} onChange={setMode} placeholder="All appointments"/>}
      {list.filter(item=>!customer||!mode||mode==='History'||(mode==='Completed'?item.status==='completed':upcoming(item))).map(item=><article className="space-y-2 border-t border-slate-200 pt-3" key={item.id}>
        <h3 className="font-bold">{item.vehicle} · {item.variant}</h3>
        <p>{item.status} · {item.date} · {clock(item.time)} IST</p>
        <p className="text-sm text-slate-500">{item.dealerName} · {item.name} · {item.contact==='phone'?item.mobile:item.email}</p>
        <details className="text-xs"><summary>Booking history</summary>{item.history.map((event,index)=><p key={index}>{event.status} · {event.date} · {clock(event.time)}</p>)}</details>
        <div className="flex flex-wrap gap-2">
          {customer&&upcoming(item)&&<>
            <button className={secondary} type="button" disabled={busy} onClick={()=>{setReschedule(item);setDay(item.date);setError('');document.querySelector('main')?.scrollTo({top:0});}}>Reschedule</button>
            <button className={secondary} type="button" disabled={busy} onClick={()=>void run('changeStatus',{id:item.id,status:'cancelled'},()=>setMessage('Test drive cancelled.'))}>Cancel booking</button></>}
          {dealer&&active(item)&&<>
            {item.status==='requested'&&upcoming(item)&&<button className={primary} disabled={busy} onClick={()=>void run('changeStatus',{id:item.id,status:'confirmed'},()=>setMessage('Request confirmed.'))}>Accept request</button>}
            {item.status==='confirmed'&&!upcoming(item)&&<button className={primary} disabled={busy} onClick={()=>void run('changeStatus',{id:item.id,status:'completed'},()=>setMessage('Test drive completed.'))}>Mark completed</button>}
            {upcoming(item)&&<button className={secondary} disabled={busy} onClick={()=>void run('changeStatus',{id:item.id,status:'rejected'},()=>setMessage('Request rejected.'))}>Reject request</button>}
            <button className={secondary} onClick={()=>void navigator.clipboard.writeText(item.contact==='phone'?item.mobile:item.email)
              .then(()=>setMessage('Contact copied.')).catch(()=>setError('Could not copy. The contact details are shown above.'))}>Copy contact</button></>}
        </div>
      </article>)}
      {!loading&&!list.some(item=>!customer||!mode||mode==='History'||(mode==='Completed'?item.status==='completed':upcoming(item)))&&<p className="text-sm text-slate-500">No appointments in this view.</p>}
    </section>
  </section>;
}
