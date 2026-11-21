import React from 'react';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="p-4 bg-slate-100 rounded-2xl mb-4">
        <Construction size={32} className="text-slate-400" />
      </div>
      <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
      <p className="text-sm text-slate-500 mt-2 max-w-xs">
        {description || 'This section is under construction and will be available in a future update.'}
      </p>
    </div>
  );
};
