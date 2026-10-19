"use client";
import { useEffect, useState } from 'react';
import { formatEgyptDateTime } from '@/lib/egyptTime';
import { useLanguage } from '@/contexts/LanguageContext';
export default function EgyptClock() {
  const { language } = useLanguage(); const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const timer = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(timer); }, []);
  return <div className="hidden xl:block text-xs text-slate-600 font-bold" aria-label={language === 'ar' ? 'التاريخ والوقت في مصر' : 'Date and time in Egypt'}>{now ? formatEgyptDateTime(now, language) : 'Africa/Cairo'}<small className="block text-slate-500 font-medium mt-1">{language === 'ar' ? 'توقيت مصر' : 'Egypt time'} · Africa/Cairo</small></div>;
}
