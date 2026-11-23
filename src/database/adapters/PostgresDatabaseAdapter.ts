import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { ZodError } from 'zod';
import type { IDatabaseAdapter } from '../IDatabaseAdapter';
import type { DatabaseConfig } from '../config';
import { createPostgresPool } from '../postgres';
import { hashPassword, verifyPassword } from '../passwords';
import * as validate from '../validation';
import { adminMetrics } from '../../services/adminMetrics';
import type { AuditAction } from '../../services/auditLog';
import type { ApiResponse, Booking, Dealer, Notification, Offer, QueueEntry, User, VehicleListing } from '../../types';
import { bookingView, dealerView, listingView, offerView, queueView, userView } from './postgresQueries';

type Connection = Pool | PoolClient;
class RequestError extends Error {}
const reject = (message: string): never => { throw new RequestError(message); };
const active = new Set(['waiting', 'offered']);

async function rows<T>(db: Connection, sql: string, values: unknown[] = []) {
  return (await db.query<{ data: T }>(sql, values)).rows.map(row => row.data);
}

async function one<T>(db: Connection, sql: string, values: unknown[] = []) {
  const result = (await rows<T>(db, sql, values))[0];
  return result ?? reject('Record is unavailable.');
}

async function audit(db: Connection, action: AuditAction, actorId: string, targetId: string, detail: string) {
  await db.query('INSERT INTO bestbuy.audit_logs(actor_id,target_id,action,detail) VALUES ($1,$2,$3,$4)', [actorId,targetId,action,detail]);
}

async function notify(db: Connection, userId: string, title: string, message: string, category: 'offer' | 'booking') {
  await db.query(`INSERT INTO bestbuy.notifications (user_id,title,message,type,category,link_to)
    VALUES ($1,$2,$3,'info',$4,$5)`, [userId,title,message,category,category === 'offer' ? '/dashboard' : '/bookings']);
}

export class PostgresDatabaseAdapter implements IDatabaseAdapter {
  readonly name = 'PostgresDatabaseAdapter';
  private readonly pool: Pool;

  constructor(config: DatabaseConfig) {
    this.pool = createPostgresPool(config.url);
    this.pool.on('error', () => console.error('An idle BestBuy database connection was lost.'));
  }

  async connect() {
    await this.pool.query('SELECT id FROM bestbuy.users LIMIT 0');
  }

  async disconnect() { await this.pool.end(); }

  private async respond<T>(work: () => Promise<T>): Promise<ApiResponse<T>> {
    try {
      return { success: true, data: await work() };
    } catch (error) {
      if (error instanceof RequestError) return { success: false, error: error.message };
      if (error instanceof ZodError) return { success: false, error: `Invalid input${error.issues[0]?.path.length ? ` (${error.issues[0].path.join('.')})` : ''}.` };
      if ((error as { code?: string }).code === '23505') return { success: false, error: 'A record with these details already exists.' };
      return { success: false, error: 'The database operation could not be completed.' };
    }
  }

  private async transaction<T>(work: (db: PoolClient) => Promise<T>) {
    const db = await this.pool.connect();
    try {
      await db.query('BEGIN');
      const result = await work(db);
      await db.query('COMMIT');
      return result;
    } catch (error) {
      await db.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally { db.release(); }
  }

  private async requireAdmin(db: Connection, actorId?: string) {
    if (!actorId) return reject('Administrator access is required.');
    await one(db, "SELECT id AS data FROM bestbuy.users WHERE id=$1 AND role='admin' AND status='active' FOR SHARE", [validate.id.parse(actorId)]);
    return actorId;
  }

  private async requireCustomer(db: Connection, id: string) {
    await one(db, "SELECT u.id AS data FROM bestbuy.users u JOIN bestbuy.customers c ON c.user_id=u.id WHERE u.id=$1 AND u.status='active' FOR SHARE OF u", [id]);
  }

  private async cityId(db: Connection, city: string, state: string) {
    return one<string>(db, `INSERT INTO bestbuy.cities(name,state) VALUES ($1,$2)
      ON CONFLICT (lower(regexp_replace(trim(name), '[[:space:]]+', ' ', 'g')),lower(trim(state)))
      DO UPDATE SET name=bestbuy.cities.name RETURNING id AS data`, [city,state]);
  }

  private async inventoryRow(db: Connection, id: string) {
    return one<VehicleListing>(db, `SELECT data FROM (${listingView}) v WHERE id=$1`, [id]);
  }

  private async lockListing(db: Connection, id: string, approved = true) {
    return one<{ dealerId: string; userId: string; price: number; exShowroom: number; onRoad: number; cityId: string; variantId: string }>(db,
      `SELECT jsonb_build_object('dealerId',i.dealer_id,'userId',d.user_id,'price',i.dealer_price,
        'exShowroom',i.ex_showroom,'onRoad',i.on_road,'cityId',l.city_id,'variantId',i.variant_id) AS data
      FROM bestbuy.inventory i JOIN bestbuy.dealers d ON d.id=i.dealer_id JOIN bestbuy.dealer_locations l ON l.id=i.location_id
      WHERE i.id=$1 AND i.deleted_at IS NULL AND (NOT $2::boolean OR d.status='approved') FOR UPDATE OF i FOR SHARE OF d`, [validate.id.parse(id),approved]);
  }

  auth: IDatabaseAdapter['auth'] = {
    login: credentials => this.respond(async () => {
      const { email, password } = validate.authInput.parse(credentials);
      const row = (await this.pool.query<{ data: User; password_hash: string }>(
        `SELECT data,password_hash FROM (${userView}) u WHERE email=$1`, [email])).rows[0];
      if (!await verifyPassword(password, row?.password_hash) || !row) return reject('Invalid email address or password.');
      if (row.data.status === 'suspended' || row.data.dealerProfile?.status === 'suspended') return reject('This account is suspended.');
      return { user: row.data, token: randomUUID() };
    }),
    register: input => this.respond(async () => {
      const data = validate.signup.parse(input);
      const passwordHash = await hashPassword(data.password);
      return this.transaction(async db => {
        const id = await one<string>(db, 'INSERT INTO bestbuy.users(email,password_hash,name,phone,role) VALUES ($1,$2,$3,$4,$5) RETURNING id AS data',
          [data.email,passwordHash,data.name,data.phoneNumber,data.role]);
        if (data.role === 'customer') {
          await db.query('INSERT INTO bestbuy.customers(user_id) VALUES ($1)', [id]);
        } else {
          const dealerId = await one<string>(db, 'INSERT INTO bestbuy.dealers(user_id,name,registration_number,profile) VALUES ($1,$2,$3,$4) RETURNING id AS data',
            [id,data.dealershipName,data.registrationNumber,{ contactPerson:data.contactPerson, phone:data.dealershipPhone, email:data.email }]);
          const cityId = await this.cityId(db,data.city,data.state);
          await db.query('INSERT INTO bestbuy.dealer_locations(dealer_id,city_id,address,postal_code) VALUES ($1,$2,$3,$4)',
            [dealerId,cityId,data.address,data.pinCode]);
        }
        return { user: await one<User>(db, `SELECT data FROM (${userView}) u WHERE id=$1`, [id]), token: randomUUID() };
      });
    }),
    getUserById: id => this.respond(() => one<User>(this.pool,`SELECT data FROM (${userView}) u WHERE id=$1`,[validate.id.parse(id)])),
    getAllUsers: () => this.respond(() => rows<User>(this.pool,`SELECT data FROM (${userView}) u ORDER BY data->>'name'`)),
  };

  dealers: IDatabaseAdapter['dealers'] = {
    getAll: () => this.respond(() => rows<Dealer>(this.pool,`SELECT data FROM (${dealerView}) d ORDER BY data->>'dealershipName'`)),
    getById: id => this.respond(() => one<Dealer>(this.pool,`SELECT data FROM (${dealerView}) d WHERE id=$1`,[validate.id.parse(id)])),
    update: (id,input) => this.respond(() => this.transaction(async db => {
      const key = validate.id.parse(id);
      await one(db,'SELECT id AS data FROM bestbuy.dealers WHERE id=$1 FOR UPDATE',[key]);
      const current = await one<Dealer>(db,`SELECT data FROM (${dealerView}) d WHERE id=$1`,[key]);
      const details = validate.location.parse({ ...current,...input });
      const dealer = validate.signup.options[1].pick({ dealershipName:true,contactPerson:true,dealershipPhone:true,email:true }).parse({
        ...current,...input,dealershipPhone:input.phone ?? current.phone,
      });
      const cityId = await this.cityId(db,details.city,details.state);
      await db.query('UPDATE bestbuy.dealers SET name=$2,profile=$3 WHERE id=$1',
        [key,dealer.dealershipName,{ contactPerson:dealer.contactPerson,phone:dealer.dealershipPhone,email:dealer.email }]);
      const primary = await one<{ id: string; cityId: string }>(db,
        `SELECT jsonb_build_object('id',id,'cityId',city_id) AS data
         FROM bestbuy.dealer_locations WHERE dealer_id=$1 AND is_primary FOR UPDATE`,[key]);
      if (primary.cityId === cityId) {
        await db.query('UPDATE bestbuy.dealer_locations SET address=$2,postal_code=$3 WHERE id=$1',
          [primary.id,details.address,details.pinCode]);
      } else {
        await db.query('UPDATE bestbuy.dealer_locations SET is_primary=false WHERE id=$1',[primary.id]);
        await db.query('INSERT INTO bestbuy.dealer_locations(dealer_id,city_id,address,postal_code) VALUES ($1,$2,$3,$4)',
          [key,cityId,details.address,details.pinCode]);
      }
      return one<Dealer>(db,`SELECT data FROM (${dealerView}) d WHERE id=$1`,[key]);
    })),
    updateStatus: (id,status,actorId) => this.respond(() => this.transaction(async db => {
      const actor = await this.requireAdmin(db,actorId);
      if (!['approved','rejected','suspended'].includes(status)) return reject('Invalid dealership status.');
      const key = validate.id.parse(id);
      const before = await one<string>(db,'SELECT status AS data FROM bestbuy.dealers WHERE id=$1 FOR UPDATE',[key]);
      if (before !== status) {
        await db.query('UPDATE bestbuy.dealers SET status=$2 WHERE id=$1',[key,status]);
        await audit(db,'Dealer status changed',actor,key,`${before} → ${status}`);
      }
      return one<Dealer>(db,`SELECT data FROM (${dealerView}) d WHERE id=$1`,[key]);
    })),
  };

  private async variantId(db: Connection, brand: string, model: string, variant: string) {
    const vehicle = await one<string>(db,`INSERT INTO bestbuy.vehicles(brand,model) VALUES ($1,$2)
      ON CONFLICT (lower(regexp_replace(trim(brand), '[[:space:]]+', ' ', 'g')),lower(regexp_replace(trim(model), '[[:space:]]+', ' ', 'g')))
      DO UPDATE SET brand=bestbuy.vehicles.brand RETURNING id AS data`,[brand,model]);
    return one<string>(db,`INSERT INTO bestbuy.vehicle_variants(vehicle_id,name) VALUES ($1,$2)
      ON CONFLICT (vehicle_id,lower(regexp_replace(trim(name), '[[:space:]]+', ' ', 'g')))
      DO UPDATE SET name=bestbuy.vehicle_variants.name RETURNING id AS data`,[vehicle,variant]);
  }

  vehicles: IDatabaseAdapter['vehicles'] = {
    getPriceChanges: () => this.respond(() => rows(this.pool,`SELECT jsonb_build_object('listingId',p.listing_id,
      'previousPrice',p.previous_price,'newPrice',p.new_price,'changedAt',p.changed_at,
      'dealerName',i.data->'dealer'->>'dealershipName','vehicleName',concat_ws(' ',i.brand,i.model,i.variant)) AS data
      FROM bestbuy.price_changes p JOIN (${listingView}) i ON i.id=p.listing_id ORDER BY p.id DESC`)),
    getAll: filters => this.respond(() => rows<VehicleListing>(this.pool,`SELECT data FROM (${listingView}) v
      WHERE deleted_at IS NULL AND (NOT $1::boolean OR dealer_status='approved')
      AND ($2::uuid IS NULL OR dealer_id=$2) AND ($3::text IS NULL OR availability=$3)
      AND ($4::text IS NULL OR lower(brand)=lower($4)) AND ($5::text IS NULL OR lower(model)=lower($5))
      AND ($6::text IS NULL OR lower(variant)=lower($6)) ORDER BY data->>'createdAt' DESC`,
      [filters?.marketplace === true,filters?.dealerId == null ? null : validate.id.parse(filters.dealerId),
        filters?.availability ?? null,filters?.brand ?? null,filters?.model ?? null,filters?.variant ?? null])),
    getById: id => this.respond(() => one<VehicleListing>(this.pool,`SELECT data FROM (${listingView}) v WHERE id=$1 AND deleted_at IS NULL`,[validate.id.parse(id)])),
    create: input => this.respond(() => this.transaction(async db => {
      const { dealerId,brand,model,variant,dealerOfferPrice,exShowroomPrice,onRoadPrice,quantity,availability,...details } = validate.listing.parse(input);
      const dealer = await one<{ locationId:string; actorId:string }>(db,`SELECT jsonb_build_object('locationId',l.id,'actorId',d.user_id) AS data
        FROM bestbuy.dealers d JOIN bestbuy.dealer_locations l ON l.dealer_id=d.id AND l.is_primary
        WHERE d.id=$1 AND d.status='approved' FOR SHARE OF d`,[dealerId]);
      const variantId = await this.variantId(db,brand,model,variant);
      const id = await one<string>(db,`INSERT INTO bestbuy.inventory(dealer_id,location_id,variant_id,details,dealer_price,ex_showroom,on_road,quantity,availability)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id AS data`,[dealerId,dealer.locationId,variantId,details,dealerOfferPrice,exShowroomPrice,onRoadPrice,quantity,availability]);
      await audit(db,'Listing created',dealer.actorId,id,`${brand} ${model} ${variant}`);
      return this.inventoryRow(db,id);
    })),
    update: (id,input) => this.editListing(id,{ ...input },'Listing updated'),
    updatePrice: (id,input) => this.editListing(id,input,'Price updated'),
    updateAvailability: (id,availability) => this.editListing(id,{ availability,...(availability === 'out_of_stock' ? { quantity:0 } : {}) },'Listing updated'),
    delete: (id,actorId,reason) => this.respond(() => this.transaction(async db => {
      const actor = actorId ? await this.requireAdmin(db,actorId) : undefined;
      const listing = await this.lockListing(db,id,!actor);
      const detail = reason === undefined ? '' : validate.note.parse(reason);
      if (actor && !detail) return reject('Provide a reason for removing the listing.');
      await db.query('UPDATE bestbuy.inventory SET deleted_at=now() WHERE id=$1',[id]);
      await db.query("UPDATE bestbuy.offers SET status='expired' WHERE listing_id=$1 AND status='pending'",[id]);
      await audit(db,'Listing removed',actor ?? listing.userId,id,detail || 'Removed by dealership');
      return { id };
    })),
  };

  private editListing(id: string,input: Record<string,unknown>,action: 'Listing updated' | 'Price updated') {
    return this.respond(() => this.transaction(async db => {
      const previous = await this.lockListing(db,id);
      const current = await this.inventoryRow(db,id);
      const changes = action === 'Price updated' ? validate.prices.parse(input) : input;
      const { dealerId,brand,model,variant,dealerOfferPrice,exShowroomPrice,onRoadPrice,quantity,availability,...details } =
        validate.listing.parse({ ...current,...changes,dealerId:current.dealerId, dealerOfferPrice:changes.dealerOfferPrice ?? ('price' in changes ? changes.price : undefined) ?? current.dealerOfferPrice,
          exShowroomPrice:changes.exShowroomPrice ?? current.exShowroomPrice,onRoadPrice:changes.onRoadPrice ?? current.onRoadPrice });
      const variantId = brand === current.brand && model === current.model && variant === current.variant ? current.variantId : await this.variantId(db,brand,model,variant);
      if (variantId !== current.variantId && await one<boolean>(db,`SELECT EXISTS(SELECT 1 FROM bestbuy.offers WHERE listing_id=$1
        UNION ALL SELECT 1 FROM bestbuy.bookings WHERE listing_id=$1) AS data`,[id])) return reject('Vehicle identity is fixed after an offer or booking.');
      await db.query(`UPDATE bestbuy.inventory SET variant_id=$2,details=$3,dealer_price=$4,ex_showroom=$5,on_road=$6,
       quantity=$7,availability=$8,updated_at=now() WHERE id=$1`,[id,variantId,details,dealerOfferPrice,exShowroomPrice,onRoadPrice,quantity,availability]);
      if (previous.price !== dealerOfferPrice) await db.query('INSERT INTO bestbuy.price_changes(listing_id,previous_price,new_price) VALUES ($1,$2,$3)',[id,previous.price,dealerOfferPrice]);
      if (action === 'Listing updated') await audit(db,action,previous.userId,id,`${brand} ${model} ${variant}`);
      if (previous.price !== dealerOfferPrice || previous.exShowroom !== exShowroomPrice || previous.onRoad !== onRoadPrice) {
        await audit(db,'Price updated',previous.userId,id,`Dealer ${previous.price} → ${dealerOfferPrice}, ex-showroom ${previous.exShowroom} → ${exShowroomPrice}, on-road ${previous.onRoad} → ${onRoadPrice}`);
      }
      return this.inventoryRow(db,id);
    }));
  }

  queue: IDatabaseAdapter['queue'] = {
    join: input => this.respond(() => this.transaction(async db => {
      const data = validate.queueJoin.parse(input);
      await this.requireCustomer(db,data.customerId);
      const cities = await rows<string>(db,`SELECT DISTINCT l.city_id AS data FROM bestbuy.inventory i
        JOIN bestbuy.dealer_locations l ON l.id=i.location_id JOIN bestbuy.cities c ON c.id=l.city_id
        JOIN bestbuy.vehicle_variants t ON t.id=i.variant_id JOIN bestbuy.dealers d ON d.id=i.dealer_id
        WHERE i.variant_id=$1 AND t.vehicle_id=$2 AND lower(regexp_replace(trim(c.name), '[[:space:]]+', ' ', 'g'))=lower(regexp_replace(trim($3), '[[:space:]]+', ' ', 'g'))
        AND ($4::text IS NULL OR lower(c.state)=lower($4)) AND i.deleted_at IS NULL AND d.status='approved'`,
        [data.variantId,data.vehicleModelId,data.city,data.state ?? null]);
      if (cities.length !== 1) return reject('Select an available city for this vehicle.');
      const queueId = await one<string>(db,`INSERT INTO bestbuy.shared_queues(variant_id,city_id) VALUES ($1,$2)
        ON CONFLICT (variant_id,city_id) DO UPDATE SET variant_id=excluded.variant_id RETURNING id AS data`,[data.variantId,cities[0]]);
      const existing = (await rows<QueueEntry>(db,`SELECT data FROM (${queueView}) q WHERE queue_id=$1 AND customer_id=$2
        AND status IN ('waiting','offered')`,[queueId,data.customerId]))[0];
      if (existing) return existing;
      const position = await one<number>(db,`UPDATE bestbuy.shared_queues SET last_position=last_position+1
        WHERE id=$1 RETURNING last_position AS data`,[queueId]);
      const id = await one<string>(db,`INSERT INTO bestbuy.queue_entries(queue_id,customer_id,position)
        VALUES ($1,$2,$3) RETURNING id AS data`,[queueId,data.customerId,position]);
      return one<QueueEntry>(db,`SELECT data FROM (${queueView}) q WHERE id=$1`,[id]);
    })),
    getPosition: id => this.respond(async () => ({ position: await one<number>(this.pool,
      'SELECT position AS data FROM bestbuy.queue_entries WHERE id=$1',[validate.id.parse(id)]) })),
    leave: id => this.respond(() => this.transaction(async db => {
      await one(db,`UPDATE bestbuy.queue_entries SET status='cancelled' WHERE id=$1 AND status IN ('waiting','offered') RETURNING id AS data`,[validate.id.parse(id)]);
      await db.query("UPDATE bestbuy.offers SET status='expired' WHERE queue_entry_id=$1 AND status='pending'",[id]);
      return { id };
    })),
    getByCustomerId: id => this.respond(() => rows<QueueEntry>(this.pool,`SELECT data FROM (${queueView}) q WHERE customer_id=$1
      ORDER BY data->>'createdAt' DESC`,[validate.id.parse(id)])),
    getAll: () => this.respond(() => rows<QueueEntry>(this.pool,`SELECT data FROM (${queueView}) q ORDER BY queue_id,position`)),
  };

  private async queueForUpdate(db: Connection,id: string) {
    await one(db,'SELECT id AS data FROM bestbuy.queue_entries WHERE id=$1 FOR UPDATE',[id]);
    return one<{ customerId: string; status: string; cityId: string; variantId: string }>(db,
      `SELECT jsonb_build_object('customerId',customer_id,'status',status,'cityId',city_id,'variantId',variant_id) AS data
        FROM (${queueView}) q WHERE id=$1`,[id]);
  }

  offers: IDatabaseAdapter['offers'] = {
    create: input => this.respond(() => this.transaction(async db => {
      const data = validate.createOffer.parse(input);
      if (Date.parse(data.expiryDate) <= Date.now()) return reject('Enter a future offer expiration.');
      await this.requireCustomer(db,data.customerId);
      const listing = await this.lockListing(db,data.listingId);
      const queue = await this.queueForUpdate(db,data.queueEntryId);
      if (listing.dealerId !== data.dealerId || queue.customerId !== data.customerId || !active.has(queue.status) ||
        listing.cityId !== queue.cityId || listing.variantId !== queue.variantId) {
        return reject('Choose a listing matching the customer’s active shared queue.');
      }
      const vehicle = await this.inventoryRow(db,data.listingId);
      const details = { vehicleName:`${vehicle.brand} ${vehicle.model}`, variantName:vehicle.variant, color:vehicle.color,
        availability:vehicle.availability, vehicleModelId:vehicle.vehicleModelId, notes:data.notes, terms:data.terms, expectedDeliveryDate:data.expectedDeliveryDate };
      const id = await one<string>(db,`INSERT INTO bestbuy.offers(queue_entry_id,customer_id,dealer_id,listing_id,details,offered_price,original_price,expires_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id AS data`,[data.queueEntryId,data.customerId,data.dealerId,data.listingId,details,data.offeredPrice,listing.price,data.expiryDate]);
      await db.query("UPDATE bestbuy.queue_entries SET status='offered' WHERE id=$1",[data.queueEntryId]);
      await audit(db,'Offer created',listing.userId,id,details.vehicleName);
      await notify(db,data.customerId,'New dealer offer',`You received an offer for the ${details.vehicleName}.`,'offer');
      return one<Offer>(db,`SELECT data FROM (${offerView}) o WHERE id=$1`,[id]);
    })),
    accept: (id,hours) => this.respond(() => this.transaction(async db => {
      const key = validate.id.parse(id);
      const lockHours = validate.locks.parse(hours);
      const offer = await one<Offer>(db,`SELECT data FROM (${offerView}) o WHERE id=$1`,[key]);
      await this.requireCustomer(db,offer.customerId);
      if (offer.queueEntryId && !active.has((await this.queueForUpdate(db,offer.queueEntryId)).status)) return reject('The queue entry is no longer active.');
      await one(db,`UPDATE bestbuy.offers SET status='accepted' WHERE id=$1 AND status='pending'
        AND expires_at>clock_timestamp() RETURNING id AS data`,[key]);
      const booking = await this.insertBooking(db,offer.customerId,offer.dealerId,offer.listingId!,offer.offeredPrice,lockHours,
        { vehicleName:offer.vehicleName,variantName:offer.variantName,color:offer.color },undefined,key);
      if (offer.queueEntryId) {
        await db.query("UPDATE bestbuy.queue_entries SET status='booked' WHERE id=$1",[offer.queueEntryId]);
        await db.query("UPDATE bestbuy.offers SET status='expired' WHERE queue_entry_id=$1 AND status='pending'",[offer.queueEntryId]);
      }
      await audit(db,'Booking accepted',offer.customerId,booking,`Accepted offer ${key}`);
      await notify(db,offer.customerId,'Offer accepted',`Your agreed price is locked for ${lockHours} hours.`,'booking');
      const dealer = await one<string>(db,'SELECT user_id AS data FROM bestbuy.dealers WHERE id=$1',[offer.dealerId]);
      await notify(db,dealer,'Offer accepted',`A customer accepted your offer for the ${offer.vehicleName}.`,'booking');
      return { offer: { ...offer,status:'accepted' },bookingId:booking };
    })),
    updateStatus: (id,status) => this.respond(() => this.transaction(async db => {
      if (status !== 'declined' && status !== 'expired') return reject('Invalid offer transition.');
      const key = validate.id.parse(id);
      const offer = await one<Offer>(db,`SELECT data FROM (${offerView}) o WHERE id=$1`,[key]);
      if (offer.queueEntryId) await this.queueForUpdate(db,offer.queueEntryId);
      await one(db,`UPDATE bestbuy.offers SET status=$2 WHERE id=$1 AND status='pending'
        AND expires_at>clock_timestamp() RETURNING id AS data`,[key,status]);
      if (offer.queueEntryId) await db.query(`UPDATE bestbuy.queue_entries SET status='waiting' WHERE id=$1 AND status='offered'
        AND NOT EXISTS (SELECT 1 FROM bestbuy.offers WHERE queue_entry_id=$1 AND status='pending' AND expires_at>now())`,[offer.queueEntryId]);
      return { ...offer,status };
    })),
    getAll: () => this.respond(() => rows<Offer>(this.pool,`SELECT data FROM (${offerView}) o ORDER BY data->>'createdAt' DESC`)),
    getByCustomerId: id => this.respond(() => rows<Offer>(this.pool,`SELECT data FROM (${offerView}) o WHERE customer_id=$1 ORDER BY data->>'createdAt' DESC`,[validate.id.parse(id)])),
    getByDealerId: id => this.respond(() => rows<Offer>(this.pool,`SELECT data FROM (${offerView}) o WHERE dealer_id=$1 ORDER BY data->>'createdAt' DESC`,[validate.id.parse(id)])),
  };

  private async insertBooking(db: Connection,customerId: string,dealerId: string,listingId: string,price: number,hours: number,
    details: Record<string,unknown>,date?: string,offerId?: string) {
    return one<string>(db,`INSERT INTO bestbuy.bookings(customer_id,dealer_id,listing_id,offer_id,details,
      booked_for,locked_price,lock_hours,locked_until,status_history)
      VALUES ($1,$2,$3,$4,$5,coalesce($6::timestamptz,now()+interval '2 days'),$7,$8,
        clock_timestamp()+$8::integer*interval '1 hour',
        jsonb_build_array(jsonb_build_object('status','pending','timestamp',clock_timestamp()))) RETURNING id AS data`,
      [customerId,dealerId,listingId,offerId ?? null,details,date ?? null,price,hours]);
  }

  bookings: IDatabaseAdapter['bookings'] = {
    create: input => this.respond(() => this.transaction(async db => {
      const data = validate.createBooking.parse(input);
      await this.requireCustomer(db,data.customerId);
      const listing = await this.lockListing(db,data.listingId);
      if (listing.dealerId !== data.dealerId) return reject('Select a valid listing.');
      if (data.lockedPrice !== undefined && data.lockedPrice !== listing.price) return reject('The dealer price changed. Review the current listing before booking.');
      const vehicle = await this.inventoryRow(db,data.listingId);
      const details = { vehicleName:`${vehicle.brand} ${vehicle.model}`,variantName:vehicle.variant,color:vehicle.color,notes:data.notes };
      const id = await this.insertBooking(db,data.customerId,data.dealerId,data.listingId,listing.price,data.lockDurationHours ?? 72,details,data.bookingDate);
      await notify(db,listing.userId,'New booking request',`A customer requested a booking for the ${details.vehicleName}.`,'booking');
      return one<Booking>(db,`SELECT data FROM (${bookingView}) b WHERE id=$1`,[id]);
    })),
    getAll: () => this.respond(() => rows<Booking>(this.pool,`SELECT data FROM (${bookingView}) b ORDER BY data->>'createdAt' DESC`)),
    getByCustomerId: id => this.respond(() => rows<Booking>(this.pool,`SELECT data FROM (${bookingView}) b WHERE customer_id=$1 ORDER BY data->>'createdAt' DESC`,[validate.id.parse(id)])),
    getByDealerId: id => this.respond(() => rows<Booking>(this.pool,`SELECT data FROM (${bookingView}) b WHERE dealer_id=$1 ORDER BY data->>'createdAt' DESC`,[validate.id.parse(id)])),
    updateStatus: (id,status) => this.respond(() => this.transaction(async db => {
      const key = validate.id.parse(id);
      const next = validate.bookingStatus.parse(status);
      const current = await one<Booking['status']>(db,'SELECT status AS data FROM bestbuy.bookings WHERE id=$1 FOR UPDATE',[key]);
      const transitions: Record<Booking['status'],Booking['status'][]> = {
        pending:['confirmed','cancelled','expired'], confirmed:['payment_pending','booked','cancelled','expired'],
        payment_pending:['booked','cancelled','expired'], booked:['completed','cancelled'], completed:[], cancelled:[], expired:[],
      };
      if (current !== next) {
        if (!transitions[current].includes(next)) return reject('Invalid booking transition.');
        await db.query(`UPDATE bestbuy.bookings SET status=$2,updated_at=now(),
          status_history=status_history || jsonb_build_array(jsonb_build_object('status',$2::text,'timestamp',now())) WHERE id=$1`,[key,next]);
        if (next === 'confirmed') {
          const actor = await one<string>(db,`SELECT d.user_id AS data FROM bestbuy.bookings b JOIN bestbuy.dealers d ON d.id=b.dealer_id WHERE b.id=$1`,[key]);
          await audit(db,'Booking accepted',actor,key,'Dealer confirmed the booking');
        }
      }
      return one<Booking>(db,`SELECT data FROM (${bookingView}) b WHERE id=$1`,[key]);
    })),
  };

  async getNotifications(userId: string) {
    return this.respond(() => rows<Notification>(this.pool,`SELECT jsonb_strip_nulls(jsonb_build_object(
      'id',id,'userId',user_id,'title',title,'message',message,'type',type,'category',category,'linkTo',link_to,
      'isRead',read_at IS NOT NULL,'createdAt',created_at)) AS data FROM bestbuy.notifications
      WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`,[userId]));
  }

  async readNotifications(userId: string,id?: string) {
    return this.respond(async () => {
      await this.pool.query(`UPDATE bestbuy.notifications SET read_at=now()
        WHERE user_id=$1 AND read_at IS NULL AND ($2::uuid IS NULL OR id=$2)`,[userId,id === undefined ? null : validate.id.parse(id)]);
      return true;
    });
  }

  admin: IDatabaseAdapter['admin'] = {
    getStats: () => this.respond(async () => {
      const [users,dealers,vehicles,queues,offers,bookings] = await Promise.all([
        this.auth.getAllUsers(),this.dealers.getAll(),this.vehicles.getAll(),this.queue.getAll(),this.offers.getAll(),this.bookings.getAll(),
      ]);
      if (!users.data || !dealers.data || !vehicles.data || !queues.data || !offers.data || !bookings.data) return reject('Statistics are unavailable.');
      return adminMetrics({users:users.data,dealers:dealers.data,vehicles:vehicles.data,queues:queues.data,offers:offers.data,bookings:bookings.data});
    }),
    getAuditLog: () => this.respond(() => rows(this.pool,`SELECT jsonb_build_object('id',id,'actorId',actor_id,
      'targetId',target_id,'action',action,'detail',detail,'timestamp',created_at) AS data FROM bestbuy.audit_logs ORDER BY id DESC LIMIT 1000`)),
    updateCustomerStatus: (id,status,actorId) => this.respond(() => this.transaction(async db => {
      const actor = await this.requireAdmin(db,actorId);
      const key = validate.id.parse(id);
      if (status !== 'active' && status !== 'suspended') return reject('Invalid customer status.');
      const current = await one<string>(db,"SELECT status AS data FROM bestbuy.users WHERE id=$1 AND role='customer' FOR UPDATE",[key]);
      if (current !== status) {
        await db.query('UPDATE bestbuy.users SET status=$2 WHERE id=$1',[key,status]);
        await audit(db,'Customer account status changed',actor,key,`${current} → ${status}`);
      }
      return one<User>(db,`SELECT data FROM (${userView}) u WHERE id=$1`,[key]);
    })),
  };
}
