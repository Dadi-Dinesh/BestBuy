import React, { useId } from 'react';
import { cn } from '../../utils/helpers';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftElement,
  rightElement,
  className,
  id,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const descriptionId = error || hint ? `${inputId}-description` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {leftElement && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {leftElement}
          </div>
        )}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={descriptionId}
          className={cn(
            'w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent',
            'disabled:bg-slate-50 disabled:text-slate-500 transition-colors',
            error ? 'border-slate-300 focus:ring-slate-500' : 'border-slate-200',
            leftElement ? 'pl-9' : '',
            rightElement ? 'pr-9' : '',
            className
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p id={descriptionId} className="mt-1 text-xs text-slate-600">{error}</p>}
      {hint && !error && <p id={descriptionId} className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
};
