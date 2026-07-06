"use client";

import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { User } from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";

export default function ProfilePage() {
  const { t, language } = useLanguage();

  return (
    <DashboardLayout>
      <div className={`flex flex-col gap-8 max-w-6xl mx-auto ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? "rtl" : "ltr"}>
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-[32px] md:rounded-[48px] premium-gradient-primary p-8 md:p-12 group shadow-2xl shadow-indigo-500/20 text-white flex justify-between items-center">
          <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-white/10 blur-[100px] rounded-full animate-pulse" />
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full border-white/20 mb-1">
               <span className="text-amber-300">✨</span>
               <span className="text-white text-[10px] font-black uppercase tracking-widest">{t('profile.home')} / {t('profile.title')}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight flex items-center gap-3.5">
              <User className="w-8 h-8 md:w-10 md:h-10 text-indigo-200" />
              {t('profile.title')}
            </h1>
          </div>
          <div className="relative z-10 w-16 h-16 md:w-20 md:h-20 glass rounded-3xl flex items-center justify-center text-white border-white/30 shadow-2xl floating">
            <User className="w-8 h-8 md:w-10 md:h-10" />
          </div>
        </div>
        
        {/* Under Development Card */}
        <div className="premium-card rounded-[40px] md:rounded-[50px] p-12 md:p-20 text-center flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden shadow-xl border border-indigo-50/60">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/30 via-transparent to-transparent pointer-events-none" />
          <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-indigo-50 to-violet-100 rounded-[30px] flex items-center justify-center text-indigo-600 mb-6 shadow-xl shadow-indigo-100/60 border border-indigo-200/50 floating">
            <User className="w-12 h-12 md:w-14 md:h-14 animate-pulse" />
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 tracking-tight">{t('profile.underDev')}</h3>
          <p className="text-slate-500 max-w-md font-bold text-base md:text-lg leading-relaxed">{t('profile.underDevDesc')}</p>
          <div className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-50 text-indigo-600 font-black text-xs md:text-sm border border-indigo-100 shadow-sm">
            <span>⚡</span>
            <span>قريباً: تخصيص الملف الشخصي والإنجازات والشارات</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
