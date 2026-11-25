import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useTheme = create(persist<{ dark: boolean; toggle: () => void }>(
  set => ({ dark:false, toggle:() => set(state => ({ dark:!state.dark })) }), { name:'bestbuy-theme' },
));
const apply = () => { document.documentElement.dataset.theme = useTheme.getState().dark ? 'dark' : 'light'; };
if (typeof document !== 'undefined') {
  apply();
  useTheme.subscribe(apply);
}
export function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return <button type="button" aria-pressed={dark} onClick={toggle}
    className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800">{dark ? 'Light mode' : 'Dark mode'}</button>;
}
