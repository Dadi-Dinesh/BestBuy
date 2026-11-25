import { useEffect, useRef, type ReactNode } from 'react';

export function Modal({ label, close, wide, children }: {
  label: string;
  close: () => void;
  wide?: boolean;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog ref={dialog} aria-label={label} onCancel={event => { event.preventDefault(); close(); }}
      className={`m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-6 shadow-xl backdrop:bg-slate-900/40 ${wide ? 'max-w-xl' : 'max-w-md'}`}>
      {children}
    </dialog>
  );
}
