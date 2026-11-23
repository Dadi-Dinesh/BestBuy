const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { randomUUID } = require('node:crypto');
const { readFile } = require('node:fs/promises');
const { resolve } = require('node:path');
const dotenv = require('dotenv');
const postgres = require('../dist-electron/src/database/postgres');
const { hashPassword } = require('../dist-electron/src/database/passwords');

dotenv.config({ path: process.env.BESTBUY_ENV_FILE || '.env', quiet: true });
const connectionString = process.env.DATABASE_URL;
const createPool = postgres.createPostgresPool;
const control = createPool(connectionString);
const schema = 'bestbuy_verify_' + randomUUID().replace(/-/g, '');
const scope = sql => sql.replace(/\bbestbuy\./g, schema + '.');

postgres.createPostgresPool = url => {
  const pool = createPool(url);
  const connect = pool.connect.bind(pool);
  const query = pool.query.bind(pool);
  pool.query = (sql, values) => query(scope(sql), values);
  pool.connect = async callback => {
    // pg's pool.query uses the callback overload internally.
    if (callback) return connect(callback);
    const client = await connect();
    const clientQuery = client.query.bind(client);
    const release = client.release.bind(client);
    client.query = (sql, values) => clientQuery(scope(sql), values);
    client.release = (...args) => {
      client.query = clientQuery;
      release(...args);
    };
    return client;
  };
  return pool;
};
const { PostgresDatabaseAdapter } = require('../dist-electron/src/database/adapters/PostgresDatabaseAdapter');
const { registerIpcHandlers } = require('../dist-electron/electron/ipcHandlers');

function verifyIpc(adapter) {
  const handlers = new Map();
  registerIpcHandlers({ handle: (channel, callback) => handlers.set(channel, callback) }, adapter);
  return id => {
    const sender = Object.assign(new EventEmitter(), { id, mainFrame: {}, isDestroyed: () => false });
    return (channel, ...args) => handlers.get(channel)({ sender, senderFrame: sender.mainFrame }, ...args);
  };
}

function good(response, label) {
  assert(response.success, `${label}: ${response.error}`);
  return response.data;
}

async function verify() {
  const adapter = new PostgresDatabaseAdapter({ adapter: 'postgres', url: connectionString });
  let initialized = false;
  try {
    const sql = await readFile(resolve(__dirname, '../src/database/migrations/001_initial.sql'), 'utf8');
    const session = await control.connect();
    try {
      await session.query('BEGIN');
      await session.query(sql.replace(/\bbestbuy\b/g, schema));
      await session.query('COMMIT');
      initialized = true;
      const adminPassword = randomUUID();
      const hash = await hashPassword(adminPassword);
      const admin = (await session.query(
        `INSERT INTO ${schema}.users(email,password_hash,name,role) VALUES ($1,$2,'Integration Admin','admin') RETURNING id`,
        ['admin@example.invalid', hash])).rows[0].id;
      await adapter.connect();
      const password = randomUUID();
      const customer = async suffix => good(await adapter.auth.register({
        role:'customer',name:`Test Customer ${suffix}`,email:`buyer${suffix}@example.invalid`,phoneNumber:'555-0100',password,
      }), 'Register customer').user;
      const registerDealer = async suffix => good(await adapter.auth.register({
        role:'dealer',name:`Test Dealer ${suffix}`,email:`dealer${suffix}@example.invalid`,phoneNumber:'555-0100',password,
        dealershipName:`Dealer ${suffix}`,registrationNumber:`TEST-${suffix}`,contactPerson:'Test Dealer',
        dealershipPhone:'555-0101',address:'10 Test Road',city:suffix === 'A' ? 'Los Angeles' : 'los angeles',state:'CA',pinCode:'90001',
      }), 'Register dealer').user.dealerProfile;
      const buyer = await customer('A');
      const buyer2 = await customer('B');
      assert.equal(good(await adapter.auth.login({email:buyer.email,password}), 'Login').user.id,buyer.id);
      assert.equal((await adapter.auth.login({email:buyer.email,password:'incorrect'})).success,false);
      const dealer = await registerDealer('A');
      const otherDealer = await registerDealer('B');
      assert.equal(dealer.status,'pending');
      assert.equal((await adapter.dealers.updateStatus(dealer.id,'approved',buyer.id)).success,false);
      good(await adapter.dealers.updateStatus(dealer.id,'approved',admin),'Approve dealer');
      good(await adapter.dealers.updateStatus(otherDealer.id,'approved',admin),'Approve second dealer');
      const listing = async (owner, brand, model, variant, price) => good(await adapter.vehicles.create({
        dealerId:owner.id,brand,model,variant,year:2025,fuelType:'Hybrid',transmission:'Automatic',
        color:'Silver',exShowroomPrice:34000,onRoadPrice:38000,dealerOfferPrice:price,quantity:2,
        deliveryTimeline:'Immediate',
      }), 'Create listing');
      const first = await listing(dealer,'Toyota','Camry','XSE Hybrid',35000);
      const second = await listing(otherDealer,'toyota','camry','xse hybrid',34500);
      assert.equal(first.variantId,second.variantId);
      assert.deepEqual(good(await adapter.vehicles.getAll({brand:'TOYOTA',model:'Camry',marketplace:true}), 'Vehicle search')
        .map(item=>item.dealerOfferPrice).sort(),[34500,35000]);
      const join = (who, item) => adapter.queue.join({
        customerId:who.id,vehicleModelId:item.vehicleModelId,variantId:item.variantId,city:item.dealer.city,state:item.dealer.state,
      });
      const joined = (await Promise.all([join(buyer,first),join(buyer,second),join(buyer2,second)]))
        .map(result=>good(result,'Concurrent queue join'));
      assert.equal(joined[0].id,joined[1].id);
      assert.notEqual(joined[0].position,joined[2].position);
      assert.equal((await session.query(`SELECT count(*)::int AS total FROM ${schema}.shared_queues`)).rows[0].total,1);
      good(await adapter.queue.leave(joined[2].id),'Leave queue');
      const rejoined = good(await join(buyer2,first),'Rejoin queue');
      assert(rejoined.position > Math.max(...joined.map(item=>item.position)));
      const send = (owner,item,entry,price) => adapter.offers.create({
        dealerId:owner.id,listingId:item.id,queueEntryId:entry.id,customerId:entry.customerId,
        vehicleName:'Ignored client value',variantName:'Ignored',offeredPrice:price,originalPrice:1,status:'pending',
        expiryDate:new Date(Date.now()+86_400_000).toISOString(),
      });
      const declined = good(await send(dealer,first,rejoined,34800),'Create offer to decline');
      assert.equal(declined.originalPrice,35000);
      good(await adapter.offers.updateStatus(declined.id,'declined'),'Reject offer');
      const offer = good(await send(dealer,first,joined[0],34300),'Create offer to accept');
      const accept = await Promise.all([adapter.offers.accept(offer.id,72),adapter.offers.accept(offer.id,72)]);
      assert.equal(accept.filter(result=>result.success).length,1);
      const {bookingId} = accept.find(result=>result.success).data;
      const direct = good(await adapter.bookings.create({ customerId:buyer2.id,listingId:second.id,dealerId:otherDealer.id,lockedPrice:34500 }), 'Create direct booking');
      good(await adapter.vehicles.updatePrice(first.id,{ dealerOfferPrice:36500 }), 'Update listing price');
      const locked = good(await adapter.bookings.getByCustomerId(buyer.id), 'Read locked booking').find(item=>item.id===bookingId);
      assert.equal(locked.lockedPrice,34300);
      assert.equal(locked.lockDurationHours,72);
      assert(Date.parse(locked.priceLockedUntil)>Date.now());
      assert.equal(direct.lockedPrice,34500);
      assert.equal((await adapter.bookings.create({ customerId:buyer2.id,listingId:first.id,dealerId:dealer.id,lockedPrice:35000 })).success,false);
      assert(good(await adapter.getNotifications(buyer.id),'List database notifications').length >= 2);
      good(await adapter.readNotifications(buyer.id),'Read database notifications');
      assert(good(await adapter.getNotifications(buyer.id),'Check read state').every(item=>item.isRead));
      good(await adapter.admin.updateCustomerStatus(buyer.id,'suspended',admin),'Suspend customer');
      assert.equal((await adapter.auth.login({email:buyer.email,password})).success,false);
      good(await adapter.admin.updateCustomerStatus(buyer.id,'active',admin),'Activate customer');
      good(await adapter.vehicles.delete(first.id,admin,'Integration verification'),'Moderate listing');
      assert.equal((await adapter.vehicles.getById(first.id)).success,false);
      assert.equal(good(await adapter.bookings.getByCustomerId(buyer.id),'Booking after listing removal')[0].lockedPrice,34300);
      const log = good(await adapter.admin.getAuditLog(),'Audit log');
      for (const action of ['Dealer status changed','Listing created','Price updated','Offer created','Booking accepted','Customer account status changed','Listing removed']) {
        assert(log.some(entry=>entry.action===action),action);
      }
      assert.equal(good(await adapter.admin.getStats(),'Admin stats').totalBookings,2);
      const connectIpc = verifyIpc(adapter);
      const customerIpc = connectIpc(1);
      const adminIpc = connectIpc(2);
      const dealerIpc = connectIpc(3);
      assert.equal((await customerIpc('admin:getStats')).success,false);
      good(await customerIpc('auth:login',{ email:buyer.email,password }), 'Customer IPC login');
      good(await adminIpc('auth:login',{ email:'admin@example.invalid',password:adminPassword }), 'Admin IPC login');
      good(await dealerIpc('auth:login',{ email:'dealerb@example.invalid',password }), 'Dealer IPC login');
      assert.equal((await customerIpc('bookings:getByCustomerId',buyer2.id)).success,false);
      assert.equal((await customerIpc('dealers:updateStatus',otherDealer.id,'suspended',admin)).success,false);
      assert.equal((await dealerIpc('offers:getByDealerId',dealer.id)).success,false);
      assert(good(await dealerIpc('bookings:getAll'),'Dealer demand projection').every(item=>!item.customerName && !item.lockedPrice));
      good(await adminIpc('admin:updateCustomerStatus',buyer.id,'suspended',buyer2.id),'Administrator IPC status change');
      assert.equal((await customerIpc('bookings:getByCustomerId',buyer.id)).success,false);
      good(await adminIpc('admin:updateCustomerStatus',buyer.id,'active',admin),'Administrator IPC reactivation');
      await customerIpc('auth:logout');
      assert.equal((await customerIpc('bookings:getByCustomerId',buyer.id)).success,false);
      console.log('Live PostgreSQL CRUD, concurrent queue and offer operations, pricing locks, notifications, administration, and IPC authorization passed.');
    } catch (error) {
      await session.query('ROLLBACK').catch(()=>undefined);
      throw error;
    } finally { session.release(); }
  } finally {
    await adapter.disconnect();
    if (initialized) await control.query(`DROP SCHEMA ${schema} CASCADE`);
    await control.end();
  }
}
verify().catch(error => {
  console.error('Live verification failed.', error.code || (error.code === 'ERR_ASSERTION' || error instanceof assert.AssertionError ? error.message : 'Check database configuration.'));
  if (error instanceof assert.AssertionError) console.error(error.message);
  process.exitCode=1;
});
