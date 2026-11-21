import { IpcMain } from 'electron';
import { getDatabaseAdapter } from '../src/database';

export function registerIpcHandlers(ipcMain: IpcMain): void {
  const adapter = getDatabaseAdapter();

  // Auth handlers
  ipcMain.handle('auth:login', async (_event, credentials) => {
    return adapter.auth.login(credentials);
  });

  ipcMain.handle('auth:register', async (_event, data) => {
    return adapter.auth.register(data);
  });

  ipcMain.handle('auth:logout', async () => {
    return { success: true };
  });

  ipcMain.handle('auth:getCurrentUser', async () => {
    return null;
  });

  // Vehicle handlers
  ipcMain.handle('vehicles:getAll', async (_event, filters) => {
    return adapter.vehicles.getAll(filters);
  });

  ipcMain.handle('vehicles:getById', async (_event, id) => {
    return adapter.vehicles.getById(id);
  });

  ipcMain.handle('vehicles:create', async (_event, data) => {
    return adapter.vehicles.create(data);
  });

  ipcMain.handle('vehicles:update', async (_event, id, data) => {
    return adapter.vehicles.update(id, data);
  });

  ipcMain.handle('vehicles:delete', async (_event, id) => {
    return adapter.vehicles.delete(id);
  });

  // Dealer handlers
  ipcMain.handle('dealers:getAll', async () => {
    return adapter.dealers.getAll();
  });

  ipcMain.handle('dealers:getById', async (_event, id) => {
    return adapter.dealers.getById(id);
  });

  ipcMain.handle('dealers:update', async (_event, id, data) => {
    return adapter.dealers.update(id, data);
  });

  // Queue handlers
  ipcMain.handle('queue:join', async (_event, data) => {
    return adapter.queue.join(data);
  });

  ipcMain.handle('queue:getPosition', async (_event, queueId) => {
    return adapter.queue.getPosition(queueId);
  });

  ipcMain.handle('queue:leave', async (_event, queueId) => {
    return adapter.queue.leave(queueId);
  });

  ipcMain.handle('queue:getByCustomerId', async (_event, customerId) => {
    return adapter.queue.getByCustomerId(customerId);
  });

  // Booking handlers
  ipcMain.handle('bookings:create', async (_event, data) => {
    return adapter.bookings.create(data);
  });

  ipcMain.handle('bookings:getByCustomerId', async (_event, customerId) => {
    return adapter.bookings.getByCustomerId(customerId);
  });

  ipcMain.handle('bookings:getByDealerId', async (_event, dealerId) => {
    return adapter.bookings.getByDealerId(dealerId);
  });

  ipcMain.handle('bookings:updateStatus', async (_event, id, status) => {
    return adapter.bookings.updateStatus(id, status);
  });
}
