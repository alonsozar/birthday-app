"use client";
import React, { useMemo, useState, useEffect } from 'react';
import { format, isToday, isPast, setYear, startOfDay } from 'date-fns';
import { he } from 'date-fns/locale';
import FileUpload from '@/components/FileUpload';
import BirthdayCard from '@/components/BirthdayCard';
import MainHeader from '@/components/MainHeader';
import { useBirthdays } from '@/hooks/useBirthdays';

export default function Dashboard() {
  const { birthdays, saveBirthdays, clearBirthdays, isLoaded } = useBirthdays();
  const [isClient, setIsClient] = useState(false);
  const today = startOfDay(new Date());

  useEffect(() => {
    setIsClient(true);
  }, []);

  const sortedData = useMemo(() => {
    if (!birthdays || birthdays.length === 0) return { today: [], upcoming: [] };

    const processed = birthdays.map(p => ({
      ...p,
      birthday: new Date(p.birthday)
    })).filter(p => !isNaN(p.birthday.getTime()));

    const sorted = [...processed].sort((a, b) => {
      const aNext = setYear(a.birthday, today.getFullYear());
      const bNext = setYear(b.birthday, today.getFullYear());
      const aDate = (isPast(aNext) && !isToday(aNext)) ? setYear(aNext, today.getFullYear() + 1) : aNext;
      const bDate = (isPast(bNext) && !isToday(bNext)) ? setYear(bNext, today.getFullYear() + 1) : bNext;
      return aDate.getTime() - bDate.getTime();
    });

    return {
      today: sorted.filter(p => isToday(setYear(p.birthday, today.getFullYear()))),
      upcoming: sorted.filter(p => !isToday(setYear(p.birthday, today.getFullYear())))
    };
  }, [birthdays, today]);

  if (!isLoaded || !isClient) return <div className="min-h-screen bg-[#F9FAFB]" />;

  return (
    <main className="max-w-md mx-auto px-4 pt-12 pb-20" dir="rtl">
      {/* שימוש בקומפוננטה המוכנה של ה-Header */}
      <MainHeader />

      {birthdays.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-4 shadow-sm mt-8">
          <FileUpload onDataParsed={saveBirthdays} />
        </div>
      ) : (
        <div className="space-y-10 mt-8">
          <section>
            <h2 className="text-xl font-bold text-[#1F2937] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              חוגגים היום
            </h2>

            {sortedData.today.length > 0 ? (
              <div className="space-y-3">
                {sortedData.today.map(person => (
                  <BirthdayCard key={person.id} person={person} />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-xl p-8 text-center shadow-sm">
                <p className="text-slate-500 font-medium">אין חוגגים היום - זמן לנוח ☕</p>
              </div>
            )}
          </section>

          {sortedData.upcoming.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-[#1F2937] mb-4">ימי הולדת קרובים</h2>
              <div className="space-y-3">
                {sortedData.upcoming.map(person => (
                  <BirthdayCard key={person.id} person={person} />
                ))}
              </div>
            </section>
          )}

          <div className="pt-4 text-center">
            <button
              onClick={clearBirthdays}
              className="text-sm text-slate-400 hover:text-red-500 underline transition-colors"
            >
              נקה נתונים והעלה קובץ חדש
            </button>
          </div>
        </div>
      )}
    </main>
  );
}