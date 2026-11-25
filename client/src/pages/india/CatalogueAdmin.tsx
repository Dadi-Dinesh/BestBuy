import { useState } from 'react';
import { bodyTypes,type CatalogueCar } from '../../../../src/data/indiaCatalogue';
import type { FuelType,TransmissionType } from '../../types';
import { indiaRequest } from '../../services/indiaService';
import { field,panel,primary,secondary,SelectField,useIndiaCatalogue } from './IndiaCatalogue';

const blank=():CatalogueCar=>({id:crypto.randomUUID(),manufacturer:'',model:'',body:'SUV',seats:5,description:'',powertrain:'',features:[],variants:[],active:true});

export function CatalogueAdmin() {
  const {cars,setCars,loading,error}=useIndiaCatalogue();
  const [editing,edit]=useState<CatalogueCar>();
  const [variants,setVariants]=useState('');
  const [query,setQuery]=useState('');
  const [manufacturer,setManufacturer]=useState('');
  const [pending,setPending]=useState(false);
  const [failure,setFailure]=useState(''); const [message,setMessage]=useState('');
  function open(car:CatalogueCar) {
    edit(car);setFailure('');setMessage('');
    setVariants(car.variants.map(variant=>[variant.name,variant.fuel,variant.transmission,variant.indicativePrice].join(' | ')).join('\n'));
  }
  return <section className="mx-auto max-w-6xl space-y-4">
    <div className="flex items-center justify-between gap-3"><h1 className="text-3xl font-bold">Manage catalogue</h1>
      <button className={primary} onClick={()=>open(blank())}>Add model</button></div>
    {loading&&<p role="status">Loading catalogue…</p>}
    {(failure||error)&&<p role="alert">{failure||error}</p>}
    {message&&<p role="status">{message}</p>}
    <section className={`${panel} space-y-3`}><h2 className="font-semibold">Manufacturers</h2>
      <SelectField name="Manufacturer group" value={manufacturer} onChange={setManufacturer}
        options={Array.from(new Set(cars.map(car=>car.manufacturer))).sort()} placeholder="Select manufacturer"/>
      <div className="flex flex-wrap gap-2">{[true,false].map(active=><button key={String(active)} type="button" className={secondary}
        disabled={!manufacturer||pending||!!editing} onClick={()=>{
          setPending(true);setFailure('');setMessage('');
          indiaRequest<CatalogueCar[]>('setManufacturerActive',{manufacturer,active}).then(data=>{
            setCars(data);setMessage(active?'Manufacturer models published.':'Manufacturer models deactivated.');
          }).catch((error:Error)=>setFailure(error.message)).finally(()=>setPending(false));
        }}>{active?'Publish all models':'Deactivate all models'}</button>)}</div>
    </section>
    {editing&&<form className={`${panel} space-y-4`} onSubmit={event=>{
      event.preventDefault();
      setPending(true);setFailure('');setMessage('');
      const parsed=variants.split('\n').filter(line=>line.trim()).map(line=>{
        const [name,fuel,transmission,amount]=line.split('|').map(field=>field.trim());
        return {name,fuel:fuel as FuelType,transmission:transmission as TransmissionType,indicativePrice:Number(amount)};
      });
      indiaRequest<CatalogueCar>('saveCar',{...editing,variants:parsed}).then(car=>{
        setCars(items=>[...items.filter(item=>item.id!==car.id),car]);edit(undefined);setMessage('Catalogue model saved.');
      }).catch((error:Error)=>setFailure(error.message)).finally(()=>setPending(false));
    }}>
      <div className="grid gap-3 md:grid-cols-2">
        {(['manufacturer','model','powertrain','description','image'] as const).map(key=><label key={key} className="space-y-1 text-sm capitalize">
          {key==='image'?'Model image URL':key}<input className={field} type={key==='image'?'url':'text'} required={key!=='image'} value={editing[key]??''}
            onChange={e=>edit({...editing,[key]:key==='image'&&!e.target.value?undefined:e.target.value})}/></label>)}
        <label className="space-y-1 text-sm">Body type<select value={editing.body} className={field} onChange={e=>edit({...editing,body:e.target.value as CatalogueCar['body']})}>
          {bodyTypes.map(body=><option key={body}>{body}</option>)}</select></label>
        <label className="space-y-1 text-sm">Seats<input className={field} type="number" min="1" max="12" required value={editing.seats} onChange={e=>edit({...editing,seats:Number(e.target.value)})}/></label>
        <label className="space-y-1 text-sm">Features (comma separated)<input className={field} key={editing.id} defaultValue={editing.features.join(', ')} onChange={e=>edit({...editing,features:e.target.value.split(',').map(value=>value.trim()).filter(Boolean)})}/></label>
      </div>
      <label className="block space-y-1 text-sm">Variants · one per line as name | fuel | transmission | INR amount
        <textarea required className={field} rows={5} value={variants} onChange={e=>setVariants(e.target.value)}/></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={editing.active} onChange={e=>edit({...editing,active:e.target.checked})}/> Publish model</label>
      <div className="flex gap-2"><button className={primary} disabled={pending}>Save model</button><button className={secondary} type="button" onClick={()=>edit(undefined)}>Cancel</button></div>
    </form>}
    <label className="block space-y-1 text-sm">Find model<input className={field} value={query} onChange={e=>setQuery(e.target.value)}/></label>
    {cars.filter(item=>`${item.manufacturer} ${item.model}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>a.manufacturer.localeCompare(b.manufacturer)||a.model.localeCompare(b.model))
      .map(car=><div key={car.id} className={`${panel} flex items-center justify-between gap-3`}>
        <div><strong>{car.manufacturer} {car.model}</strong><p className="text-sm">{car.active?'Published':'Inactive'} · {car.variants.length} variants</p></div>
        <button className={secondary} onClick={()=>open(car)}>Edit model</button>
      </div>)}
  </section>;
}
