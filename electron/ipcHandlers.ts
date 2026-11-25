import { indiaLocations } from '../src/data/indiaLocations';
import { join } from 'node:path';
import { fileIndiaStore } from '../src/database/indiaStores';
import { createIndiaMarketplace } from '../src/services/indiaMarketplace';
import type { IpcMain, IpcMainInvokeEvent } from 'electron';
import type { IDatabaseAdapter } from '../src/database';
import { PostgresDatabaseAdapter } from '../src/database/adapters/PostgresDatabaseAdapter';
import type { ApiResponse, Booking, Dealer, Offer, RegisterData, User, VehicleAvailabilityStatus } from '../src/types';

const denied = () => ({ success: false, error: 'You do not have access to this operation.' });
const marketplace = (user: User) => user.role !== 'admin';
const approved = (user: User) => user.role === 'dealer' && user.dealerProfile?.status === 'approved';

export function registerIpcHandlers(
  ipc: IpcMain, adapter: IDatabaseAdapter, isTrustedSender: (event: IpcMainInvokeEvent) => boolean = () => true,
): void {
  const sessions = new Map<number, { userId: string; expires: number }>();
  const authenticatedSenders = new Set<number>();
  const lastAuthFailure = new Map<number, number>();
  const authenticating = new Map<number, symbol>();
  const live = adapter instanceof PostgresDatabaseAdapter ? adapter : undefined;

  function publicHandler<T extends unknown[]>(channel: string, action: (event: IpcMainInvokeEvent, ...args: T) => unknown) {
    ipc.handle(channel, async (event, ...args) => {
      if (event.senderFrame !== event.sender.mainFrame || !isTrustedSender(event)) return denied();
      try {
        return await action(event,...args as T);
      } catch {
        return { success:false,error:'The request could not be completed.' };
      }
    });
  }

  function handle<T extends unknown[]>(channel: string, action: (user: User, ...args: T) => unknown) {
    publicHandler(channel, async (event,...args: T) => {
      const session = sessions.get(event.sender.id);
      if (!session || session.expires <= Date.now()) {
        sessions.delete(event.sender.id);
        return denied();
      }
      const { data: user } = await adapter.auth.getUserById(session.userId);
      if (!user || user.status === 'suspended' || user.dealerProfile?.status === 'suspended') return denied();
      return action(user,...args);
    });
  }

  async function signIn(event: IpcMainInvokeEvent, authenticate: () => Promise<ApiResponse<{ user: User; token: string }>>) {
    const sender = event.sender.id;
    const now = Date.now();
    if (authenticating.has(sender) || now - (lastAuthFailure.get(sender) ?? 0) < 700) {
      return { success:false,error:'Wait a moment before trying again.' };
    }
    const attempt = Symbol();
    authenticating.set(sender,attempt);
    if (!authenticatedSenders.has(sender)) {
      authenticatedSenders.add(sender);
      event.sender.once('destroyed', () => {
        sessions.delete(sender);
        authenticatedSenders.delete(sender);
        lastAuthFailure.delete(sender);
        authenticating.delete(sender);
      });
    }
    try {
      const result = await authenticate();
      if (authenticating.get(sender) !== attempt || event.sender.isDestroyed()) return denied();
      if (result.success && result.data) sessions.set(sender,{userId:result.data.user.id,expires:Date.now()+12*3_600_000});
      else lastAuthFailure.set(sender,Date.now());
      return result;
    } finally {
      if (authenticating.get(sender) === attempt) authenticating.delete(sender);
    }
  }

  publicHandler('auth:login', (event, credentials: { email: string; password: string }) => signIn(event,() => adapter.auth.login(credentials)));
  publicHandler('auth:register', (event,data: RegisterData) =>
    ['customer','dealer'].includes(data?.role) ? signIn(event,() => adapter.auth.register(data)) : denied());
  publicHandler('auth:resetPassword', (event,code:unknown,password:unknown) =>
    live ? live.resetPassword(code,password) : {success:false,error:'Password recovery requires the PostgreSQL application.'});
  publicHandler('auth:logout', event => { sessions.delete(event.sender.id); authenticating.delete(event.sender.id); return { success:true }; });
  handle('auth:getUserById', (user,id: string) => user.id === id ? { success:true,data:user } : denied());
  handle('auth:getAllUsers', user => user.role === 'admin' ? adapter.auth.getAllUsers() : denied());

  async function owner(user: User,id: string) {
    return approved(user) && (await adapter.vehicles.getById(id)).data?.dealerId === user.dealerProfile?.id;
  }

  publicHandler('vehicles:preview',async (_event,location?:Record<string,string>)=>{
    const {state='',city='',pin='',locality=''}=location??{};
    if([state,city,pin,locality].some(value=>typeof value!=='string'||value.length>80)||
      (state&&!indiaLocations[state])||(city&&!indiaLocations[state]?.includes(city))||(pin&&!/^[1-9]\d{5}$/.test(pin)))
      return {success:false,error:'Choose a valid Indian location.'};
    const result=await adapter.vehicles.getAll({marketplace:true});
    if(!result.success) return result;
    return {success:true,data:(result.data??[]).filter(item=>item.dealer && indiaLocations[item.dealer.state]?.includes(item.dealer.city) &&
      (!state||item.dealer.state===state)&&(!city||item.dealer.city===city)&&(!pin||item.dealer.pinCode===pin)&&
      (!locality||item.dealer.address.toLowerCase().includes(locality.toLowerCase()))).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,6).map(item=>({
      id:item.id,brand:item.brand,model:item.model,variant:item.variant,dealerOfferPrice:item.dealerOfferPrice,
      dealer:{city:item.dealer?.city,dealershipName:item.dealer?.dealershipName},
    }))};
  });
  handle('vehicles:getAll', (user,filters?: Record<string,unknown>) => {
    const own = user.role === 'dealer' && user.dealerProfile?.id === filters?.dealerId;
    return adapter.vehicles.getAll({ ...filters,marketplace:marketplace(user) && !own });
  });
  handle('vehicles:getById', async (user,id: string) => {
    const result = await adapter.vehicles.getById(id);
    return user.role === 'admin' || (user.role === 'dealer' && result.data?.dealerId === user.dealerProfile?.id) ||
      result.data?.dealer?.status === 'approved' ? result : denied();
  });
  handle('vehicles:getPriceChanges', user => user.role === 'admin' ? adapter.vehicles.getPriceChanges() : denied());
  handle('vehicles:create', (user,data: Record<string,unknown>) => approved(user)
    ? adapter.vehicles.create({ ...data,dealerId:user.dealerProfile!.id }) : denied());
  handle('vehicles:update', async (user,id: string,data: Record<string,unknown>) => await owner(user,id)
    ? adapter.vehicles.update(id,data) : denied());
  handle('vehicles:updatePrice', async (user,id: string,prices: Parameters<IDatabaseAdapter['vehicles']['updatePrice']>[1]) =>
    await owner(user,id) ? adapter.vehicles.updatePrice(id,prices) : denied());
  handle('vehicles:updateAvailability', async (user,id: string,status: VehicleAvailabilityStatus) =>
    await owner(user,id) ? adapter.vehicles.updateAvailability(id,status) : denied());
  handle('vehicles:delete', async (user,id: string,_actor: unknown,reason?: string) => user.role === 'admin'
    ? adapter.vehicles.delete(id,user.id,reason) : await owner(user,id) ? adapter.vehicles.delete(id) : denied());

  handle('dealers:getAll', user => user.role === 'admin' ? adapter.dealers.getAll() : denied());
  handle('dealers:getById', (user,id: string) => user.role === 'admin' || user.dealerProfile?.id === id ? adapter.dealers.getById(id) : denied());
  handle('dealers:update', (user,id: string,data: Record<string,unknown>) => user.dealerProfile?.id === id ? adapter.dealers.update(id,data) : denied());
  handle('dealers:updateStatus', (user,id: string,status: Dealer['status']) => user.role === 'admin'
    ? adapter.dealers.updateStatus(id,status,user.id) : denied());

  handle('queue:join', (user,data: Parameters<IDatabaseAdapter['queue']['join']>[0]) => user.role === 'customer'
    ? adapter.queue.join({ ...data,customerId:user.id }) : denied());
  handle('queue:getByCustomerId', (user,id: string) => user.role === 'admin' || (user.role === 'customer' && user.id === id)
    ? adapter.queue.getByCustomerId(id) : denied());
  handle('queue:getAll', async user => {
    if (user.role === 'admin') return adapter.queue.getAll();
    if (user.role !== 'dealer' || !user.dealerProfile) return denied();
    const [result,inventory] = await Promise.all([adapter.queue.getAll(),adapter.vehicles.getAll({ dealerId:user.dealerProfile?.id })]);
    if (!result.data || !inventory.data) return { success:false,error:'Queue data is unavailable.' };
    return { success:true,data:result.data.map(entry => {
      const matches = inventory.data!.some(listing => listing.vehicleModelId === entry.vehicleModelId &&
        listing.variantId === entry.variantId && listing.dealer?.city?.toLowerCase() === entry.city?.toLowerCase());
      const { customerName,customerPhone,...summary } = entry;
      return matches ? { ...summary,customerName } : { ...summary,customerId:'',customerName:'Marketplace customer' };
    }).filter(entry => entry.customerId) };
  });
  async function ownsQueue(user: User,id: string) {
    return user.role === 'customer' && (await adapter.queue.getByCustomerId(user.id)).data?.some(item => item.id === id);
  }
  handle('queue:getPosition', async (user,id: string) => user.role === 'admin' || await ownsQueue(user,id) ? adapter.queue.getPosition(id) : denied());
  handle('queue:leave', async (user,id: string) => await ownsQueue(user,id) ? adapter.queue.leave(id) : denied());

  handle('offers:getByCustomerId', (user,id: string) => user.role === 'admin' || (user.role === 'customer' && user.id === id)
    ? adapter.offers.getByCustomerId(id) : denied());
  handle('offers:getByDealerId', (user,id: string) => user.role === 'admin' || user.dealerProfile?.id === id ? adapter.offers.getByDealerId(id) : denied());
  handle('offers:getAll', async user => {
    if (user.role === 'admin') return adapter.offers.getAll();
    if (user.role !== 'dealer') return denied();
    const result = await adapter.offers.getAll();
    return result.data ? { success:true,data:result.data.map(offer => ({
      listingId:offer.listingId, status:offer.status, expiryDate:offer.expiryDate, createdAt:offer.createdAt,
    })) } : result;
  });
  handle('offers:create', (user,data: Omit<Offer,'id'|'createdAt'>) => approved(user)
    ? adapter.offers.create({ ...data,dealerId:user.dealerProfile!.id }) : denied());
  async function ownsOffer(user: User,id: string) {
    return user.role === 'customer' && (await adapter.offers.getByCustomerId(user.id)).data?.some(offer => offer.id === id);
  }
  handle('offers:accept', async (user,id: string,hours: number) => await ownsOffer(user,id) ? adapter.offers.accept(id,hours) : denied());
  handle('offers:updateStatus', async (user,id: string,status: Offer['status']) => status === 'declined' && await ownsOffer(user,id)
    ? adapter.offers.updateStatus(id,status) : denied());

  handle('bookings:getByCustomerId', (user,id: string) => user.role === 'admin' || (user.role === 'customer' && user.id === id)
    ? adapter.bookings.getByCustomerId(id) : denied());
  handle('bookings:getByDealerId', (user,id: string) => user.role === 'admin' || user.dealerProfile?.id === id ? adapter.bookings.getByDealerId(id) : denied());
  handle('bookings:getAll', async user => {
    if (user.role === 'admin') return adapter.bookings.getAll();
    if (user.role !== 'dealer') return denied();
    const result = await adapter.bookings.getAll();
    return result.data ? { success:true,data:result.data.map(booking => ({
      listingId:booking.listingId,status:booking.status,createdAt:booking.createdAt,
      statusHistory:booking.statusHistory?.map(event => ({ timestamp:event.timestamp,status:event.status })),
    })) } : result;
  });
  handle('bookings:create', (user,data: Parameters<IDatabaseAdapter['bookings']['create']>[0]) => user.role === 'customer'
    ? adapter.bookings.create({ ...data,customerId:user.id }) : denied());
  handle('bookings:updateStatus', async (user,id: string,status: Booking['status']) => {
    if (user.role === 'customer' && status === 'cancelled' &&
      (await adapter.bookings.getByCustomerId(user.id)).data?.some(booking => booking.id === id)) {
      return adapter.bookings.updateStatus(id,status);
    }
    if (approved(user) && (await adapter.bookings.getByDealerId(user.dealerProfile!.id)).data?.some(booking => booking.id === id)) {
      return adapter.bookings.updateStatus(id,status);
    }
    return denied();
  });

  handle('admin:getStats', user => user.role === 'admin' ? adapter.admin.getStats() : denied());
  handle('admin:getAuditLog', user => user.role === 'admin' ? adapter.admin.getAuditLog() : denied());
  handle('admin:updateCustomerStatus', (user,id: string,status: 'active'|'suspended') => user.role === 'admin'
    ? adapter.admin.updateCustomerStatus(id,status,user.id) : denied());
  handle('notifications:getAll', user => adapter.getNotifications?.(user.id) ?? { success:true,data:[] });
  handle('notifications:markRead', (user,id?: string) => adapter.readNotifications?.(user.id,id) ?? denied());
  let india: ReturnType<typeof createIndiaMarketplace> | undefined;
  handle('india:operation', (user, command: string, input?: unknown) => {
    india ??= createIndiaMarketplace(live?.indiaStore() ?? fileIndiaStore(join(require('electron').app.getPath('userData'),'india-marketplace.json')),
      async id => (await adapter.vehicles.getById(id)).data);
    return india(user,command,input);
  });
  publicHandler('app:usesDatabase', () => !!live);
}
