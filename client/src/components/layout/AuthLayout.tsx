import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../ui/ThemeToggle';

export function AuthLayout({children}:{children:ReactNode}) {
  return <main className="grid min-h-screen bg-white lg:grid-cols-[minmax(280px,0.7fr)_1fr]">
    <aside className="flex flex-col justify-between gap-6 border-b border-slate-200 bg-slate-50 p-6 lg:border-b-0 lg:border-r lg:p-12">
      <div className="flex items-center justify-between gap-3"><Link to="/" className="text-2xl font-bold tracking-tighter">BestBuy India</Link><ThemeToggle/></div>
      <div className="hidden max-w-sm space-y-3 lg:block"><p className="text-xs uppercase tracking-[.2em] text-slate-500">The marketplace</p>
        <p className="text-4xl font-semibold tracking-tight">Your next car starts here.</p>
        <p className="text-sm leading-6 text-slate-500">Compare prices, contact dealers and manage appointments from one account.</p></div>
      <Link to="/" className="hidden text-xs font-semibold underline lg:block">Back to the marketplace</Link>
    </aside>
    <div className="flex items-center justify-center p-5 sm:p-8">{children}</div>
  </main>;
}
