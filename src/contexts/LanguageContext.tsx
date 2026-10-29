"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname } from 'next/navigation';
import arTranslations from "@/locales/ar.json";
import enTranslations from "@/locales/en.json";

type Language = "ar" | "en";

const translations: Record<Language, any> = {
  ar: arTranslations,
  en: enTranslations,
};

interface LanguageContextType {
  ready: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  ready: false,
  language: "ar",
  setLanguage: () => {},
  t: () => ""
});

function storedLanguage(): Language | undefined {
  try { return localStorage.getItem('lms_lang') === 'en' ? 'en' : 'ar'; }
  catch { return undefined; }
}

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("ar");
  const [ready, setReady] = useState(false);
  const pathname = usePathname();

  const applyLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, []);

  useEffect(() => {
    const sync = () => { const stored = storedLanguage(); if (stored) applyLanguage(stored); };
    const onStorage = (event: StorageEvent) => { if (event.key === 'lms_lang' || event.key === null) sync(); };
    const onVisible = () => { if (document.visibilityState === 'visible') sync(); };
    sync(); setReady(true);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', sync);
    window.addEventListener('pageshow', sync);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', sync);
      window.removeEventListener('pageshow', sync);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [applyLanguage]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, pathname]);

  const setLanguage = useCallback((lang: Language) => {
    applyLanguage(lang);
    // Browser storage can be blocked; this must not disable language switching.
    try { localStorage.setItem('lms_lang', lang); } catch {}
  }, [applyLanguage]);

  const t = (key: string) => {
    const keys = key.split('.');
    let val: any = translations[language];
    let found = true;
    for (const k of keys) {
      if (val?.[k] === undefined) {
        found = false;
        break;
      }
      val = val[k];
    }
    if (found) return val;

    // Fallback lookup under "superAdmin" if not already requested
    if (!key.startsWith('superAdmin.')) {
      const fallbackKeys = ['superAdmin', ...keys];
      let fallbackVal: any = translations[language];
      let fallbackFound = true;
      for (const k of fallbackKeys) {
        if (fallbackVal?.[k] === undefined) {
          fallbackFound = false;
          break;
        }
        fallbackVal = fallbackVal[k];
      }
      if (fallbackFound) return fallbackVal;
    }

    return key;
  };

  // Public content must be present in server HTML; account pages retain their hydration gate.
  if (!ready && pathname !== "/") return <div className="min-h-screen bg-slate-50" />;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, ready }}>
      <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
