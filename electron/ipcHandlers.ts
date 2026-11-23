import { IpcMain } from 'electron';
import { getDatabaseAdapter } from '../src/database';
import { RegisterData, Dealer, Offer, Booking } from '../src/types';

export function registerIpcHandlers(ipcMain: IpcMain): void {
  const adapter = getDatabaseAdapter();

  // Auth handlers
  ipcMain.handle('auth:login', async (_event, credentials) => {
    return adapter.auth.login(credentials);
  });

  ipcMain.handle('auth:register', async (_event, data: RegisterData) => {
    return adapter.auth.register(data);
  });

  ipcMain.handle('auth:logout', async () => {
    return { success: true };
  });

  ipcMain.handle('auth:getUserById', async (_event, id: string) => {
    return adapter.auth.getUserById(id);
  });

  ipcMain.handle('auth:getAllUsers', async () => {
    return adapter.auth.getAllUsers();
  });

  // Vehicle handlers
  ipcMain.handle('vehicles:getPriceChanges', async () => {
    return adapter.vehicles.getPriceChanges();
  });
  ipcMain.handle('vehicles:getAll', async (_event, filters) => {
    return adapter.vehicles.getAll(filters);
  });

  ipcMain.handle('vehicles:getById', async (_event, id: string) => {
    return adapter.vehicles.getById(id);
  });

  ipcMain.handle('vehicles:create', async (_event, data) => {
    return adapter.vehicles.create(data);
  });

  ipcMain.handle('vehicles:update', async (_event, id: string, data) => {
    return adapter.vehicles.update(id, data);
  });

  ipcMain.handle('vehicles:updatePrice', async (_event, id: string, prices: { exShowroomPrice?: number; onRoadPrice?: number; dealerOfferPrice: number }) => {
    return adapter.vehicles.updatePrice(id, prices);
  });

  ipcMain.handle('vehicles:updateAvailability', async (_event, id: string, availability) => {
    return adapter.vehicles.updateAvailability(id, availability);
  });

  ipcMain.handle('vehicles:delete', async (_event, id: string) => {
    return adapter.vehicles.delete(id);
  });

  // Dealer handlers
  ipcMain.handle('dealers:getAll', async () => {
    return adapter.dealers.getAll();
  });

  ipcMain.handle('dealers:getById', async (_event, id: string) => {
    return adapter.dealers.getById(id);
  });

  ipcMain.handle('dealers:update', async (_event, id: string, data) => {
    return adapter.dealers.update(id, data);
  });

  ipcMain.handle('dealers:updateStatus', async (_event, id: string, status: Dealer['status']) => {
    return adapter.dealers.updateStatus(id, status);
  });

  // Queue handlers
  ipcMain.handle('queue:join', async (_event, data) => {
    return adapter.queue.join(data);
  });

  ipcMain.handle('queue:getPosition', async (_event, queueId: string) => {
    return adapter.queue.getPosition(queueId);
  });

  ipcMain.handle('queue:leave', async (_event, queueId: string) => {
    return adapter.queue.leave(queueId);
  });

  ipcMain.handle('queue:getByCustomerId', async (_event, customerId: string) => {
    return adapter.queue.getByCustomerId(customerId);
  });

  ipcMain.handle('queue:getAll', async () => {
    return adapter.queue.getAll();
  });

  // Offer handlers
  ipcMain.handle('offers:accept', async (_event, id: string, lockDurationHours: number) => {
    return adapter.offers.accept(id, lockDurationHours);
  });

  ipcMain.handle('offers:getAll', async () => {
    return adapter.offers.getAll();
  });

  ipcMain.handle('offers:getByCustomerId', async (_event, customerId: string) => {
    return adapter.offers.getByCustomerId(customerId);
  });

  ipcMain.handle('offers:getByDealerId', async (_event, dealerId: string) => {
    return adapter.offers.getByDealerId(dealerId);
  });

  ipcMain.handle('offers:create', async (_event, data) => {
    return adapter.offers.create(data);
  });

  ipcMain.handle('offers:updateStatus', async (_event, id: string, status: Offer['status']) => {
    return adapter.offers.updateStatus(id, status);
  });

  // Booking handlers
  ipcMain.handle('bookings:getAll', async () => {
    return adapter.bookings.getAll();
  });

  ipcMain.handle('bookings:create', async (_event, data) => {
    return adapter.bookings.create(data);
  });

  ipcMain.handle('bookings:getByCustomerId', async (_event, customerId: string) => {
    return adapter.bookings.getByCustomerId(customerId);
  });

  ipcMain.handle('bookings:getByDealerId', async (_event, dealerId: string) => {
    return adapter.bookings.getByDealerId(dealerId);
  });

  ipcMain.handle('bookings:updateStatus', async (_event, id: string, status: Booking['status']) => {
    return adapter.bookings.updateStatus(id, status);
  });

  // Admin handlers
  ipcMain.handle('admin:getStats', async () => {
    return adapter.admin.getStats();
  });
}
