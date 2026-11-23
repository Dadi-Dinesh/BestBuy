import { useEffect, useState } from 'react';
import type { ApiResponse, Notification } from '../types';

export function desktopAPI() {
  if (typeof window === 'undefined') return undefined;
  return (window as Window & { electronAPI?: {
    usesDatabase(): Promise<boolean>;
    notifications: {
      getAll(): Promise<ApiResponse<Notification[]>>;
      markRead(id?: string): Promise<ApiResponse<boolean>>;
    };
  } }).electronAPI;
}

export function useDemoMode() {
  const [demo, setDemo] = useState(!desktopAPI());
  useEffect(() => {
    let active = true;
    void desktopAPI()?.usesDatabase().then(live => { if (active) setDemo(!live); }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  return demo;
}
