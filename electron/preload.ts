import { contextBridge, ipcRenderer } from 'electron';
import type { RegisterData, Dealer, Offer, Booking } from '../src/types';

const electronAPI = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      ipcRenderer.invoke('auth:login', credentials),
    register: (data: RegisterData) =>
      ipcRenderer.invoke('auth:register', data),
    logout: () => ipcRenderer.invoke('auth:logout'),
    getUserById: (id: string) => ipcRenderer.invoke('auth:getUserById', id),
    getAllUsers: () => ipcRenderer.invoke('auth:getAllUsers'),
  },

  // Vehicles
  vehicles: {
    getAll: (filters?: Record<string, unknown>) =>
      ipcRenderer.invoke('vehicles:getAll', filters),
    getById: (id: string) => ipcRenderer.invoke('vehicles:getById', id),
    create: (data: Record<string, unknown>) =>
      ipcRenderer.invoke('vehicles:create', data),
    update: (id: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke('vehicles:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('vehicles:delete', id),
  },

  // Dealers
  dealers: {
    getAll: () => ipcRenderer.invoke('dealers:getAll'),
    getById: (id: string) => ipcRenderer.invoke('dealers:getById', id),
    update: (id: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke('dealers:update', id, data),
    updateStatus: (id: string, status: Dealer['status']) =>
      ipcRenderer.invoke('dealers:updateStatus', id, status),
  },

  // Queue
  queue: {
    join: (data: { vehicleModelId: string; customerId: string; variantId?: string }) =>
      ipcRenderer.invoke('queue:join', data),
    getPosition: (queueId: string) =>
      ipcRenderer.invoke('queue:getPosition', queueId),
    leave: (queueId: string) =>
      ipcRenderer.invoke('queue:leave', queueId),
    getByCustomerId: (customerId: string) =>
      ipcRenderer.invoke('queue:getByCustomerId', customerId),
    getAll: () =>
      ipcRenderer.invoke('queue:getAll'),
  },

  // Offers
  offers: {
    getAll: () => ipcRenderer.invoke('offers:getAll'),
    getByCustomerId: (customerId: string) =>
      ipcRenderer.invoke('offers:getByCustomerId', customerId),
    getByDealerId: (dealerId: string) =>
      ipcRenderer.invoke('offers:getByDealerId', dealerId),
    create: (data: Omit<Offer, 'id' | 'createdAt'>) =>
      ipcRenderer.invoke('offers:create', data),
    updateStatus: (id: string, status: Offer['status']) =>
      ipcRenderer.invoke('offers:updateStatus', id, status),
  },

  // Bookings
  bookings: {
    getAll: () => ipcRenderer.invoke('bookings:getAll'),
    create: (data: { customerId: string; listingId: string; dealerId: string; notes?: string }) =>
      ipcRenderer.invoke('bookings:create', data),
    getByCustomerId: (customerId: string) =>
      ipcRenderer.invoke('bookings:getByCustomerId', customerId),
    getByDealerId: (dealerId: string) =>
      ipcRenderer.invoke('bookings:getByDealerId', dealerId),
    updateStatus: (id: string, status: Booking['status']) =>
      ipcRenderer.invoke('bookings:updateStatus', id, status),
  },

  // Admin
  admin: {
    getStats: () => ipcRenderer.invoke('admin:getStats'),
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
