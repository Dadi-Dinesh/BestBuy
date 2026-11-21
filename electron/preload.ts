import { contextBridge, ipcRenderer } from 'electron';

// Type-safe API exposed to renderer
const electronAPI = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      ipcRenderer.invoke('auth:login', credentials),
    register: (data: { name: string; email: string; password: string; role: string }) =>
      ipcRenderer.invoke('auth:register', data),
    logout: () => ipcRenderer.invoke('auth:logout'),
    getCurrentUser: () => ipcRenderer.invoke('auth:getCurrentUser'),
  },
  // Vehicles
  vehicles: {
    getAll: (filters?: Record<string, unknown>) =>
      ipcRenderer.invoke('vehicles:getAll', filters),
    getById: (id: string) => ipcRenderer.invoke('vehicles:getById', id),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('vehicles:create', data),
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
  },
  // Queue
  queue: {
    join: (data: { vehicleModelId: string; customerId: string }) =>
      ipcRenderer.invoke('queue:join', data),
    getPosition: (queueId: string) => ipcRenderer.invoke('queue:getPosition', queueId),
    leave: (queueId: string) => ipcRenderer.invoke('queue:leave', queueId),
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
