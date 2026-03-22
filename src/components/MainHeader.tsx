import React from 'react';
import { format, startOfDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';

interface HeaderProps {
  hasData?: boolean;
  onClear?: () => void;
}

export default function MainHeader({ hasData, onClear }: HeaderProps) {
  const today = startOfDay(new Date());

  return (
    <header className="mb-10">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-[#1F2937] tracking-tight">שלום אולג 👋</h1>
          <p className="text-[#374151] font-medium mt-1">
            היום, {format(today, 'd בMMMM yyyy', { locale: he })}
          </p>
        </div>
        {hasData && onClear && (
          <button
            onClick={onClear}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title="נקה נתונים"
          >
            <Trash2 className="w-5 h-5" strokeWidth={1.5} />
          </button>
        )}
      </div>
    </header>
  );
}
