import type { IndiaData, IndiaStore } from '../../../src/services/indiaMarketplace';
import { useAuthStore } from '../store/authStore';
import { vehicleService } from './vehicleService';
import type { ApiResponse } from '../types';

async function createDemo() {
  const { createIndiaMarketplace,emptyIndiaData } = await import('../../../src/services/indiaMarketplace');
  const demoStore: IndiaStore = {
  async run(write,operation) {
    const saved=localStorage.getItem('bestbuy-india-demo');
    const data=saved ? JSON.parse(saved) as IndiaData : emptyIndiaData();
    const result=operation(data);
    if (write) localStorage.setItem('bestbuy-india-demo',JSON.stringify(data));
    return result;
  },
};
  return createIndiaMarketplace(demoStore,async id=>(await vehicleService.getById(id)).data);
}
let demo: ReturnType<typeof createDemo> | undefined;

export async function indiaRequest<T>(command:string,input?:unknown) {
  const api=(window as Window & {electronAPI?:{india:{operation(command:string,input?:unknown):Promise<ApiResponse<T>>}}}).electronAPI;
  try {
    const user=useAuthStore.getState().user;
    const result=api ? await api.india.operation(command,input) : user ? await (await (demo ??= createDemo()))(user,command,input) : undefined;
    if (!result?.success || result.data === undefined) throw new Error(result?.error || 'Sign in to continue.');
    return result.data as T;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'The request could not be completed.');
  }
}
