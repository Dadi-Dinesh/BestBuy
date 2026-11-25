import React, { useLayoutEffect, useRef } from 'react';
import { Outlet,Link,useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout: React.FC = () => {
  const {pathname}=useLocation();
  const content=useRef<HTMLElement>(null);
  useLayoutEffect(()=>{content.current?.scrollTo({top:0});},[pathname]);
  const section=pathname.split('/').filter(Boolean).at(-1)?.replace(/-/g,' ') || 'dashboard';
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main ref={content} className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto max-w-[100rem]">
            <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-slate-500">
              <Link to="/" className="font-semibold hover:underline">Marketplace</Link><span aria-hidden="true">/</span>
              <span aria-current="page" className="capitalize">{pathname.startsWith('/vehicle/')?'Vehicle details':pathname.startsWith('/catalogue/')?'Model details':section}</span>
            </nav>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
