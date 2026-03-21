"use client";
import React from 'react';
import { differenceInYears, format } from 'date-fns';
import { he } from 'date-fns/locale';
import { MessageCircle, Gift } from 'lucide-react';
import { ParsedBirthday } from '@/lib/parseUtils';

interface BirthdayCardProps {
  person: ParsedBirthday;
}

export default function BirthdayCard({ person }: BirthdayCardProps) {
  const today = new Date();
  const age = differenceInYears(today, person.birthday);
  
  // Format birthday display: usually day and month "d בMMMM"
  const formattedDate = format(person.birthday, 'd בMMMM', { locale: he });
  
  const handleWhatsApp = () => {
    // Open Whatsapp with prefilled text
    const text = encodeURIComponent('מזל טוב!');
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-5 flex items-center justify-between border border-slate-100 mb-3 transition-colors hover:border-slate-200">
      <div className="flex items-center gap-4">
        <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center border border-slate-100">
          <Gift className="w-5 h-5 text-navy-800" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="font-semibold text-navy-800 text-lg">{person.name}</h3>
          <p className="text-slate-500 text-sm">
            חוגג/ת {age > 0 ? `גיל ${age}` : 'יום הולדת'} • {formattedDate}
          </p>
        </div>
      </div>
      <button 
        onClick={handleWhatsApp}
        className="text-slate-400 hover:text-green-500 hover:bg-green-50 p-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-green-100"
        title="שלח ברכה בווטסאפ"
      >
        <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
      </button>
    </div>
  );
}
