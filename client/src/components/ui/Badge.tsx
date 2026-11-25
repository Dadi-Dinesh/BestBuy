import React from 'react';
import { cn } from '../../utils/helpers';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-50 text-slate-700 border-slate-100',
  success: 'bg-slate-50 text-slate-700 border-slate-100',
  warning: 'bg-slate-50 text-slate-700 border-slate-100',
  danger: 'bg-slate-50 text-slate-700 border-slate-100',
  info: 'bg-slate-50 text-slate-700 border-slate-100',
  neutral: 'bg-slate-50 text-slate-600 border-slate-200',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
