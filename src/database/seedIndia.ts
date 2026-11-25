import { config } from 'dotenv';
import { createHash } from 'node:crypto';
import type { PoolClient } from 'pg';
import { createPostgresPool } from './postgres';
import { hashPassword } from './passwords';
import { indiaDemo } from '../data/indiaDemo';
import { istDate } from '../services/indiaFormat';

const namespace='india-marketplace-v1';
function seedId(key:string) {
  const hex=createHash('sha256').update(`${namespace}/${key}`).digest('hex');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-5${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
}

export async function seedIndia(db:PoolClient,password:string,now=new Date()) {
  const data=indiaDemo(now);
  const passwordHash=await hashPassword(password);
  let created=0, skipped=0;
  async function insert(key:string,sql:string,values:unknown[]) {
    const id=seedId(key);
    const previous=await db.query('SELECT record_id FROM bestbuy.demo_seed_records WHERE seed_key=$1',[`${namespace}/${key}`]);
    if(previous.rowCount){skipped++;return id;}
    // A collision aborts and rolls back the seed, leaving the existing record untouched.
    await db.query(sql,[id,...values]);
    await db.query('INSERT INTO bestbuy.demo_seed_records(seed_key,record_id) VALUES ($1,$2)',[`${namespace}/${key}`,id]);
    created++;
    return id;
  }
  await db.query("SELECT pg_advisory_xact_lock(hashtext('bestbuy:india-demo-seed'))");
  for(const user of data.users.filter(item=>item.role!=='admin')){
    const id=await insert(`user/${user.id}`,'INSERT INTO bestbuy.users(id,email,password_hash,name,role) VALUES ($1,$2,$3,$4,$5)',
      [`${user.id}@india-demo.bestbuy.example`,passwordHash,`${user.name} · Demo`,user.role]);
    if(user.role==='customer')await db.query('INSERT INTO bestbuy.customers(user_id) VALUES ($1) ON CONFLICT DO NOTHING',[id]);
  }
  for(const dealer of data.dealers){
    await insert(`dealer/${dealer.id}`,`INSERT INTO bestbuy.dealers(id,user_id,name,registration_number,status,profile)
      VALUES ($1,$2,$3,$4,'approved',$5)`,[seedId(`user/${dealer.userId}`),dealer.dealershipName,dealer.registrationNumber,
      {email:dealer.email,contactPerson:dealer.contactPerson,phone:dealer.phone,demo:true}]);
    await db.query('INSERT INTO bestbuy.cities(name,state) VALUES ($1,$2) ON CONFLICT DO NOTHING',[dealer.city,dealer.state]);
    await insert(`location/${dealer.id}`,`INSERT INTO bestbuy.dealer_locations(id,dealer_id,city_id,address,postal_code)
      SELECT $1,$2,c.id,$3,$4 FROM bestbuy.cities c WHERE lower(c.name)=lower($5) AND lower(c.state)=lower($6)`,
      [seedId(`dealer/${dealer.id}`),dealer.address,dealer.pinCode,dealer.city,dealer.state]);
  }
  const variantIds=new Map<string,string>();
  for(const listing of data.listings){
    let variant=variantIds.get(listing.variantId);
    if(!variant){
      await db.query('INSERT INTO bestbuy.vehicles(brand,model) VALUES ($1,$2) ON CONFLICT DO NOTHING',[listing.brand,listing.model]);
      const vehicle=(await db.query('SELECT id FROM bestbuy.vehicles WHERE lower(brand)=lower($1) AND lower(model)=lower($2)',[listing.brand,listing.model])).rows[0].id;
      await db.query('INSERT INTO bestbuy.vehicle_variants(vehicle_id,name) VALUES ($1,$2) ON CONFLICT DO NOTHING',[vehicle,listing.variant]);
      variant=(await db.query<{id:string}>('SELECT id FROM bestbuy.vehicle_variants WHERE vehicle_id=$1 AND lower(name)=lower($2)',[vehicle,listing.variant])).rows[0].id;
      variantIds.set(listing.variantId,variant);
    }
    const {year,fuelType,transmission,color,mileage,condition,deliveryTimeline,description,images}=listing;
    await insert(`listing/${listing.id}`,`INSERT INTO bestbuy.inventory(id,dealer_id,location_id,variant_id,details,
      dealer_price,ex_showroom,on_road,quantity,availability) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [seedId(`dealer/${listing.dealerId}`),seedId(`location/${listing.dealerId}`),variant,{year,fuelType,transmission,color,mileage,condition,deliveryTimeline,description,images,demo:true},
      listing.price,listing.exShowroomPrice,listing.onRoadPrice,listing.quantity,listing.availability]);
  }
  const offer=data.offers[0];
  const listing=data.listings.find(item=>item.id===offer.listingId)!;
  const variant=variantIds.get(listing.variantId);
  const dealerId=seedId(`dealer/${listing.dealerId}`);
  const listingId=seedId(`listing/${listing.id}`);
  const city=(await db.query('SELECT city_id FROM bestbuy.dealer_locations WHERE id=$1',[seedId(`location/${listing.dealerId}`)])).rows[0].city_id;
  await db.query('INSERT INTO bestbuy.shared_queues(variant_id,city_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',[variant,city]);
  const queue=(await db.query('SELECT id,last_position FROM bestbuy.shared_queues WHERE variant_id=$1 AND city_id=$2 FOR UPDATE',[variant,city])).rows[0];
  let position=queue.last_position;
  for(const entry of data.queues){
    const old=await db.query('SELECT 1 FROM bestbuy.demo_seed_records WHERE seed_key=$1',[`${namespace}/queue/${entry.id}`]);
    if(!old.rowCount)position++;
    await insert(`queue/${entry.id}`,'INSERT INTO bestbuy.queue_entries(id,queue_id,customer_id,position,status) VALUES ($1,$2,$3,$4,$5)',
      [queue.id,seedId(`user/${entry.customerId}`),position,entry.status]);
  }
  await db.query('UPDATE bestbuy.shared_queues SET last_position=$2 WHERE id=$1 AND last_position<$2',[queue.id,position]);
  const detail={vehicleName:offer.vehicleName,variantName:offer.variantName,demo:true};
  await insert('offer',`INSERT INTO bestbuy.offers(id,queue_entry_id,customer_id,dealer_id,listing_id,details,offered_price,original_price,expires_at,created_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [seedId(`queue/${offer.queueEntryId}`),seedId(`user/${offer.customerId}`),dealerId,listingId,detail,offer.offeredPrice,offer.originalPrice,offer.expiryDate,offer.createdAt]);
  await insert('booking',`INSERT INTO bestbuy.bookings(id,customer_id,dealer_id,listing_id,details,status,booked_for,locked_price,lock_hours,locked_until)
    VALUES ($1,$2,$3,$4,$5,'completed',$6,$7,72,$6)`,
    [seedId(`user/${data.customers[1].id}`),dealerId,listingId,detail,now,listing.price]);
  for(const [index,status] of ['requested','confirmed','completed','cancelled'].entries()){
    const date=istDate(new Date(+now+(status==='completed'?-2:index+2)*86400000));
    const time='10:00';
    const customer=data.customers[index];
    const customerId=seedId(`user/${customer.id}`);
    const key=`drive/${status}`;
    const booking={id:seedId(key),customerId,dealerId,listingId,vehicle:offer.vehicleName,
      variant:listing.variant,dealerName:listing.dealer!.dealershipName,address:`${listing.dealer!.address}, ${listing.dealer!.city}, India`,
      name:customer.name,email:`${customer.id}@india-demo.bestbuy.example`,mobile:'',contact:'email',status,date,time,
      history:[{status,date,time,changedAt:now.toISOString()}]};
    const exists=await db.query('SELECT 1 FROM bestbuy.demo_seed_records WHERE seed_key=$1',[`${namespace}/${key}`]);
    if(!exists.rowCount)await db.query('INSERT INTO bestbuy.test_drive_slots(dealer_id,day,slot,is_open) VALUES ($1,$2,$3,true) ON CONFLICT DO NOTHING',[dealerId,date,time]);
    await insert(key,`INSERT INTO bestbuy.test_drives(id,dealer_id,customer_id,listing_id,day,slot,status,details)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,[dealerId,customerId,listingId,date,time,status,booking]);
  }
  const result=await db.query<{count:number}>('SELECT count(*)::int AS count FROM bestbuy.demo_seed_records WHERE seed_key LIKE $1',[`${namespace}/%`]);
  if(result.rows[0].count!==created+skipped)throw new Error('Seed record count differs from the expected total.');
  return {created,updated:0,skipped,verified:result.rows[0].count,dealers:data.dealers.length,customers:data.customers.length,inventory:data.listings.length};
}

if(require.main===module){
  config({path:process.env.BESTBUY_ENV_FILE||'.env',quiet:true});
  void (async()=>{
    const password=process.env.BESTBUY_DEMO_PASSWORD;
    if(!password||password.length<12)throw new Error('Set BESTBUY_DEMO_PASSWORD to a password of at least 12 characters.');
    const pool=createPostgresPool(process.env.DATABASE_URL);
    try{
      const db=await pool.connect();
      try{await db.query('BEGIN');const result=await seedIndia(db,password);await db.query('COMMIT');console.log(result);}
      catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();}
    }finally{await pool.end();}
  })().catch(error=>{console.error('India demo seed failed.',error.code||error.message);process.exitCode=1;});
}
