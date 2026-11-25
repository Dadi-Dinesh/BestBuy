import { indiaLocations, marketplaceCountry } from '../../../src/data/indiaLocations';
import { SelectField } from './india/IndiaCatalogue';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { indiaCatalogue, bodyTypes } from '../../../src/data/indiaCatalogue';
import { formatCurrency } from '../utils/helpers';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { VehicleImage } from '../components/ui/VehicleImage';
import { vehicleService } from '../services/vehicleService';
import type { VehicleListing } from '../types';
import { useAuthStore } from '../store/authStore';

export function MarketplaceHome() {
  const [query,setQuery]=useState('');
  const [listings,setListings]=useState<VehicleListing[]>([]);
  const [loaded,setLoaded]=useState(false);
  const [state,setState]=useState('');
  const [city,setCity]=useState('');
  const [locality,setLocality]=useState('');
  const [pin,setPin]=useState('');
  const [location,setLocation]=useState({state:'',city:'',locality:'',pin:''});
  const user=useAuthStore(state=>state.user);
  const navigate=useNavigate();
  const discover=(params:Record<string,string>)=>{
    const destination='/catalogue?'+new URLSearchParams(params);
    return user?.role==='customer' ? destination : '/login?'+new URLSearchParams({next:destination});
  };
  useEffect(()=>{
    let active=true;
    setLoaded(false);
    void vehicleService.getMarketplacePreview(location).then(result=>{if(active)setListings(result.data ?? []);})
      .catch(()=>{if(active)setListings([]);}).finally(()=>{if(active)setLoaded(true);});
    return ()=>{active=false;};
  },[location]);
  const popular=indiaCatalogue.filter(car=>['Nexon','Creta','Swift','Scorpio N'].includes(car.model));
  return <div className="min-h-screen bg-white text-slate-900">
    <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5 lg:px-12">
      <Link to="/" className="text-2xl font-extrabold tracking-tighter">BestBuy<span className="ml-2 text-xs font-medium tracking-normal text-slate-500">India</span></Link>
      <nav className="flex items-center gap-3" aria-label="Marketplace">
        <ThemeToggle/><Link className="btn-secondary" to={user?'/dashboard':'/login'}>{user?'Dashboard':'Sign in'}</Link>
        {!user&&<Link className="btn-primary" to="/register">Create account</Link>}
      </nav>
    </header>
    <main className="mx-auto max-w-7xl space-y-12 px-6 pb-16 lg:px-12">
      <section className="grid overflow-hidden rounded-xl border border-slate-200 bg-slate-50 md:grid-cols-[1fr_1fr]">
        <div className="space-y-5 p-7 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-slate-500">Indian automotive marketplace</p>
          <h1 className="max-w-lg text-4xl font-semibold tracking-tight sm:text-5xl">Find your next car.</h1>
          <p className="max-w-sm text-sm leading-6 text-slate-500">Explore models, compare dealer prices and request a test drive.</p>
          <form className="flex flex-wrap gap-2" onSubmit={event=>{event.preventDefault();navigate(discover({q:query.trim()}));}}>
            <input aria-label="Search cars" className="input-field min-w-0 flex-1" placeholder="Search by make or model" value={query} onChange={event=>setQuery(event.target.value)}/>
            <button className="btn-primary"><Search size={16}/> Search</button>
          </form>
        </div>
        <figure className="relative min-h-56 overflow-hidden bg-slate-100">
          <VehicleImage className="absolute inset-0 h-full w-full object-cover object-[center_78%] grayscale" src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1300&q=85" alt="Illustrative vehicle photograph"/>
        </figure>
      </section>
      <section className="space-y-4"><h2 className="section-title">Explore the catalogue</h2>
        <div className="flex flex-wrap gap-2">{[...new Set(indiaCatalogue.map(car=>car.manufacturer))].map(make=><Link key={make} className="btn-secondary" to={discover({make})}>{make}</Link>)}</div>
        <div className="grid gap-3 md:grid-cols-4">{popular.map(car=><Link key={car.id} className="card block p-4 hover:bg-slate-50" to={discover({q:car.model})}><p className="text-xs text-slate-500">{car.manufacturer}</p><strong>{car.model}</strong></Link>)}</div>
      </section>
      <section className="grid gap-5 md:grid-cols-2">
        <div className="card space-y-3 p-5"><h2 className="section-title">Shop by budget</h2><div className="flex flex-wrap gap-2">{[800000,1200000,2000000].map(amount=><Link key={amount} className="btn-secondary" to={discover({budget:String(amount)})}>Under {formatCurrency(amount)}</Link>)}</div></div>
        <div className="card space-y-3 p-5"><h2 className="section-title">Shop by body type</h2><div className="flex flex-wrap gap-2">{bodyTypes.map(body=><Link key={body} className="btn-secondary" to={discover({body})}>{body}</Link>)}</div></div>
      </section>
      <form className="card space-y-3 p-5" onSubmit={event=>{event.preventDefault();setLocation({state,city,locality,pin});}}>
        <h2 className="section-title">Find dealerships by location</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-1 text-sm">Country<select className="input-field" defaultValue={marketplaceCountry}><option>{marketplaceCountry}</option></select></label>
          <SelectField name="State or union territory" value={state} onChange={value=>{setState(value);setCity('');}} options={Object.keys(indiaLocations).sort()}/>
          <SelectField name="City" value={city} onChange={setCity} options={indiaLocations[state]??[]}/>
          <label className="space-y-1 text-sm">Locality<input className="input-field" maxLength={80} value={locality} onChange={event=>setLocality(event.target.value)}/></label>
          <label className="space-y-1 text-sm">PIN code<input className="input-field" inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} value={pin} onChange={event=>setPin(event.target.value)}/></label>
        </div><button className="btn-secondary">Apply location</button>
      </form>
      <section className="space-y-4"><h2 className="section-title">Recently added dealer listings</h2>
        {!listings.length&&<p className="text-sm text-slate-500">{loaded?'No dealer listings available yet.':'Loading listings…'}</p>}
        <div className="grid gap-3 md:grid-cols-3">{listings.slice(0,6).map(item=><article className="card p-4" key={item.id}><p className="text-xs text-slate-500">{item.dealer?.city} · {item.dealer?.dealershipName}</p><h3 className="font-semibold">{item.brand} {item.model}</h3><p className="text-sm">{item.variant} · {formatCurrency(item.dealerOfferPrice)}</p><Link className="mt-3 inline-flex items-center gap-1 text-sm font-semibold" to={discover({q:item.model})}>Explore model <ArrowRight size={14}/></Link></article>)}</div>
        <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
          <div><h2 className="section-title">Dealer offers</h2><p className="text-sm text-slate-500">View the quotes sent to your account.</p></div>
          <Link className="btn-primary" to={user?.role==='customer'?'/offers':'/login?next=%2Foffers'}>View my offers</Link>
        </div>
      </section>
    </main>
  </div>;
}
