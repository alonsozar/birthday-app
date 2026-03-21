"use client";
import { useState, useEffect } from 'react';
import { ParsedBirthday } from '@/lib/parseUtils';

export function useBirthdays() {
  const [birthdays, setBirthdays] = useState<ParsedBirthday[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('birthdays_data');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const revived = parsed.map((v: any) => ({
          ...v,
          birthday: new Date(v.birthday)
        }));
        setBirthdays(revived);
      } catch (e) {
        console.error('Failed to parse birthdays from local storage', e);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveBirthdays = (newBirthdays: ParsedBirthday[]) => {
    setBirthdays(newBirthdays);
    localStorage.setItem('birthdays_data', JSON.stringify(newBirthdays));
  };

  const clearBirthdays = () => {
    setBirthdays([]);
    localStorage.removeItem('birthdays_data');
  }

  return { birthdays, saveBirthdays, clearBirthdays, isLoaded };
}
