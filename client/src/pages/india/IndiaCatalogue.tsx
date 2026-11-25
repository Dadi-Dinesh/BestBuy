import { useEffect,useMemo,useState } from 'react';
import { Link,useParams,useSearchParams } from 'react-router-dom';
import { bodyTypes, type CatalogueCar } from '../../../../src/data/indiaCatalogue';
import { indiaLocations } from '../../../../src/data/indiaLocations';
import { formatCurrency } from '../../utils/helpers';
import { indiaRequest } from '../../services/indiaService';
import { vehicleService } from '../../services/vehicleService';
import { useAuthStore } from '../../store/authStore';
import { useGarage } from '../../store/garageStore';
import type { VehicleListing } from '../../types';
import { VehicleImage } from '../../components/ui/VehicleImage';

export const field='w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900';
export const panel='rounded-xl border border-slate-200 bg-white p-5';
export const primary='inline-flex rounded-md bg-slate-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';
export const secondary='inline-flex rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50';

export function SelectField({name,value,options,onChange,placeholder='All'}:{
  name:string;value:string;options:readonly string[];onChange:(value:string)=>void;placeholder?:string;
}) {
  return <label className="block space-y-1 text-sm font-medium text-slate-700">
    <span>{name}</span><select aria-label={name} className={field} value={value} onChange={e=>onChange(e.target.value)}>
      <option value="">{placeholder}</option>{options.map(item=><option key={item}>{item}</option>)}
    </select>
  </label>;
}
export function useIndiaCatalogue() {
  const [cars,setCars]=useState<CatalogueCar[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true;
    indiaRequest<CatalogueCar[]>('catalogue').then(data=>{if(active)setCars(data);})
      .catch((err:Error)=>{if(active)setError(err.message);}).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[]);
  return {cars,setCars,loading,error};
}

const range=(car:CatalogueCar)=>[Math.min(...car.variants.map(v=>v.indicativePrice)),Math.max(...car.variants.map(v=>v.indicativePrice))];
const displayRange=(car:CatalogueCar)=>{const [low,high]=range(car);return low===high?formatCurrency(low):`${formatCurrency(low)} – ${formatCurrency(high)}`;};
const normalize=(value:string)=>value.trim().toLocaleLowerCase('en-IN');
const matches=(car:CatalogueCar,listing:VehicleListing)=>normalize(car.manufacturer)===normalize(listing.brand) && normalize(car.model)===normalize(listing.model);

export function IndiaCatalogue({garage=false}:{garage?:boolean}) {
  const {cars,loading,error}=useIndiaCatalogue();
  const user=useAuthStore(state=>state.user?.id || '');
  const favourites=useGarage(state=>state.favourites[user]);
  const recent=useGarage(state=>state.recent[user]);
  const [params]=useSearchParams();
  const [query,setQuery]=useState(params.get('q')||'');
  const [make,setMake]=useState(params.get('make')||''); const [body,setBody]=useState(params.get('body')||'');
  const [fuel,setFuel]=useState(''); const [gear,setGear]=useState('');
  const [budget,setBudget]=useState(params.get('budget')||''); const [sort,setSort]=useState('');
  const [page,setPage]=useState(1);
  const [selection,setSelection]=useState<string[]>([]);
  const brands=Array.from(new Set(cars.map(car=>car.manufacturer))).sort();
  const matching=useMemo(()=>{
    const filtered=cars.filter(car=>(!garage || favourites?.includes(car.id) || recent?.includes(car.id)) &&
      normalize(`${car.manufacturer} ${car.model}`).includes(normalize(query)) && (!make || make===car.manufacturer) &&
      (!body || body===car.body) && car.variants.some(v=>(!fuel || v.fuel===fuel) && (!gear || v.transmission===gear) &&
        (!budget || v.indicativePrice<=Number(budget))));
    if (sort) filtered.sort((a,b)=>(range(a)[0]-range(b)[0])*(sort==='Price low to high'?1:-1));
    return filtered;
  },[cars,garage,favourites,recent,query,make,body,fuel,gear,budget,sort]);
  useEffect(()=>setPage(1),[query,make,body,fuel,gear,budget,sort,garage]);
  const compared=selection.map(id=>cars.find(car=>car.id===id)).filter((car):car is CatalogueCar=>!!car);
  return <section className="mx-auto max-w-7xl space-y-5">
    <div><h1 className="text-3xl font-bold tracking-tight">{garage?'My garage':'Indian car catalogue'}</h1>
      <p className="mt-2 text-sm text-slate-500">{garage?'Your favourites and recently viewed models on this device.':'Reference models and indicative ex-showroom prices. Confirm current prices, trim specifications and availability with dealers.'}</p></div>
    <div className={`${panel} grid gap-3 sm:grid-cols-2 xl:grid-cols-4`}>
      <label className="space-y-1 text-sm">Search<input className={field} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Manufacturer or model" /></label>
      <SelectField name="Manufacturer" value={make} onChange={setMake} options={brands}/>
      <SelectField name="Body type" value={body} onChange={setBody} options={bodyTypes}/>
      <SelectField name="Fuel" value={fuel} onChange={setFuel} options={['Petrol','Diesel','Electric','Hybrid','CNG']}/>
      <SelectField name="Transmission" value={gear} onChange={setGear} options={['Manual','Automatic','Single-Speed','CVT','DCT','Dual-Clutch']}/>
      <label className="space-y-1 text-sm">Maximum budget (₹)<input className={field} type="number" min="0" value={budget} onChange={e=>setBudget(e.target.value)}/></label>
      <SelectField name="Sort" value={sort} onChange={setSort} options={['Price low to high','Price high to low']} placeholder="Catalogue order"/>
    </div>
    {compared.length>0 && <div className={panel}><h2 className="font-semibold">Model comparison</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{compared.map(car=><div key={car.id}>
        <strong>{car.manufacturer} {car.model}</strong><p>{displayRange(car)}</p><p>{car.body} · {car.seats} seats · {car.powertrain}</p>
        <button className={secondary} onClick={()=>setSelection(selection.filter(id=>id!==car.id))}>Remove</button>
      </div>)}</div></div>}
    {loading && <p role="status">Loading catalogue…</p>}
    {error && <p role="alert">{error}</p>}
    {!loading&&!error && <p className="text-sm text-slate-500">{matching.length ? `${matching.length} models` : 'No models match your selection.'}</p>}
    {garage && <div className="space-y-2">
      <p className="text-sm">Favourites ({favourites?.length ?? 0}) · Recently viewed ({recent?.length ?? 0})</p>
      <div className="flex flex-wrap gap-2">{(favourites??[]).filter(id=>id.startsWith('listing:')).map(id=>
        <Link key={id} className={secondary} to={`/vehicle/${id.slice(8)}`}>Saved dealer listing</Link>)}</div>
      <div className="flex flex-wrap gap-2">{(recent??[]).map(id=>cars.find(car=>car.id===id)).map(car=>car&&<Link className={secondary} key={car.id} to={`/catalogue/${car.id}`}>{car.model}</Link>)}</div>
    </div>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {matching.slice((page-1)*15,page*15).map(car=><article key={car.id} className={`${panel} space-y-3`}>
        {car.image ? <VehicleImage src={car.image} alt={`${car.manufacturer} ${car.model}`} className="h-32 w-full object-cover"/> :
          <div className="flex h-24 items-center justify-center border border-slate-200 bg-slate-50 text-2xl font-semibold text-slate-700">{car.model}</div>}
        <div><p className="text-xs uppercase tracking-wider text-slate-500">{car.manufacturer}</p><h2 className="text-xl font-bold">{car.model}</h2></div>
        <p className="text-sm font-semibold">{displayRange(car)}</p>
        <p className="text-xs text-slate-500">{car.body} · {car.seats} seats · {car.variants.length} trims</p>
        <div className="flex flex-wrap gap-2"><Link className={primary} to={`/catalogue/${car.id}`}>View model</Link>
          <button className={secondary} aria-pressed={selection.includes(car.id)} disabled={selection.length>=3&&!selection.includes(car.id)}
            onClick={()=>setSelection(selection.includes(car.id)?selection.filter(id=>id!==car.id):[...selection,car.id])}>Compare</button></div>
      </article>)}
    </div>
    {matching.length>15&&<div className="flex items-center gap-3"><button className={secondary} disabled={page===1} onClick={()=>setPage(page-1)}>Previous</button>
      <span>Page {page} of {Math.ceil(matching.length/15)}</span><button className={secondary} disabled={page*15>=matching.length} onClick={()=>setPage(page+1)}>Next</button></div>}
  </section>;
}

export function IndiaCarDetails() {
  const {id}=useParams();
  const {cars,loading,error}=useIndiaCatalogue();
  const car=cars.find(item=>item.id===id);
  const user=useAuthStore(state=>state.user?.id || '');
  const saved=useGarage(state=>!!id && state.favourites[user]?.includes(id));
  const {toggle,visit}=useGarage();
  const [inventory,setInventory]=useState<VehicleListing[]>([]);
  const [inventoryError,setInventoryError]=useState('');
  const [variant,setVariant]=useState(''); const [state,setState]=useState('');
  const [city,setCity]=useState(''); const [pin,setPin]=useState('');
  const [photo,setPhoto]=useState('');
  useEffect(()=>{if(id&&car)visit(user,id);},[id,user,visit,car]);
  useEffect(()=>{
    vehicleService.getAll({marketplace:true}).then(result=>{
      if(result.success&&result.data)setInventory(result.data);
      else setInventoryError(result.error||'Dealer inventory could not be loaded.');
    }).catch(()=>setInventoryError('Dealer inventory could not be loaded.'));
  },[]);
  if (loading || !car) return <p>{error || (loading?'Loading model…':'Model is unavailable.')}</p>;
  const selected=car.variants.find(item=>item.name===variant) ?? car.variants[0];
  const listings=inventory.filter(listing=>matches(car,listing)&&normalize(listing.variant)===normalize(selected.name) &&
    (!state || listing.dealer?.state===state) && (!city || listing.dealer?.city===city) && (!pin || listing.dealer?.pinCode?.startsWith(pin)))
    .sort((a,b)=>a.dealerOfferPrice-b.dealerOfferPrice);
  const photos=Array.from(new Set([...(car.image?[car.image]:[]),...inventory.filter(item=>matches(car,item)).flatMap(item=>item.images)]));
  return <section className="mx-auto max-w-6xl space-y-5">
    <Link to="/catalogue" className={secondary}>Back to catalogue</Link>
    <div className={`${panel} grid gap-5 lg:grid-cols-2`}>
      <div className="space-y-2">
        <VehicleImage src={photo||photos[0]} alt={photos.length?`${car.manufacturer} ${car.model}`:'Catalogue image placeholder'} className="h-64 w-full object-contain bg-slate-50"/>
        {!photos.length&&<p className="text-xs text-slate-500">Model photography is unavailable.</p>}
        {photos.length>1&&<div className="flex gap-2 overflow-x-auto">{photos.map((url,index)=><button key={url} onClick={()=>setPhoto(url)} aria-label={`Image ${index+1}`}><VehicleImage src={url} alt="" className="h-12 w-16 object-cover"/></button>)}</div>}
      </div>
      <div className="space-y-3"><p className="text-sm uppercase tracking-wider text-slate-500">{car.manufacturer}</p>
        <h1 className="text-4xl font-bold">{car.model}</h1><p className="font-semibold">{displayRange(car)}</p>
        <p className="text-sm text-slate-500">Indicative ex-showroom prices</p><p>{car.description}</p>
        <SelectField name="Variant" value={selected.name} options={car.variants.map(item=>item.name)} onChange={setVariant} placeholder="Select variant"/>
        <p>{car.body} · {car.seats} seats · {selected.fuel} · {selected.transmission}</p>
        <p>{car.powertrain} · {car.features.join(' · ')}</p>
        <div className="flex flex-wrap gap-2"><Link to={`/test-drives?car=${car.id}&variant=${encodeURIComponent(selected.name)}`} className={primary}>Book Test Drive</Link>
          <button className={secondary} onClick={()=>toggle(user,car.id)} aria-pressed={!!saved}>{saved?'Remove favourite':'Add to favourites'}</button>
          <Link to="/catalogue" className={secondary}>Compare cars</Link></div>
      </div>
    </div>
    <div className={`${panel} space-y-3`}><h2 className="text-xl font-bold">Dealer prices · {selected.name}</h2>
      <div className="grid gap-2 md:grid-cols-3">
        <SelectField name="State" value={state} options={Object.keys(indiaLocations)} onChange={value=>{setState(value);setCity('');}}/>
        <SelectField name="City" value={city} options={state?indiaLocations[state]??[]:Object.values(indiaLocations).flat()} onChange={setCity}/>
        <label className="space-y-1 text-sm">PIN code<input className={field} value={pin} inputMode="numeric" maxLength={6} onChange={e=>setPin(e.target.value.replace(/\D/g,''))}/></label>
      </div>
      {inventoryError&&<p role="alert">{inventoryError}</p>}
      {!listings.length&&!inventoryError&&<p className="text-sm text-slate-500">No dealer listings for this variant and location.</p>}
      {listings.map(listing=><div key={listing.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
        <div><strong>{listing.dealer?.dealershipName}</strong><p className="text-sm">{listing.dealer?.city} · {listing.availability.replace(/_/g,' ')}</p></div>
        <strong>{formatCurrency(listing.dealerOfferPrice)}</strong><Link className={secondary} to={`/vehicle/${listing.id}`}>Dealer listing</Link>
      </div>)}
    </div>
  </section>;
}
