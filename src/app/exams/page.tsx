"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { AlertCircle, Award, Trophy, Flame, Medal, Layers, Sparkles, ChevronDown } from 'lucide-react';
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ExamsPage() {
  const { t, language } = useLanguage();
  const [modules, setModules] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("lms_token") ||
        localStorage.getItem("school_admin_token") ||
        localStorage.getItem("super_admin_token");

      if (!token) {
        setLoading(false);
        return;
      }

      const [modulesRes, portfolioRes] = await Promise.all([
        fetch(`${API_URL}/exams`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/progress/portfolio`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (modulesRes.ok) {
        const modulesData = await modulesRes.json();
        setModules(Array.isArray(modulesData) ? modulesData : []);
      }

      if (portfolioRes.ok) {
        setPortfolio(await portfolioRes.json());
      }
    } catch (e) {
      setError(t('exams.connError') || "Connection Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className={`w-full max-w-[1400px] mx-auto space-y-8 md:space-y-12 pb-24 px-4 sm:px-6 md:px-8 bg-slate-50/50 min-h-screen overflow-x-hidden ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? "rtl" : "ltr"}>
        
        {/* ── PREMIUM HEADER HERO ── */}
        <div className="relative w-full rounded-[32px] md:rounded-[40px] bg-[#0f0f1d] overflow-hidden p-6 md:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 group mt-6">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none group-hover:bg-indigo-500/40 transition-colors duration-1000" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-fuchsia-600/30 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8 text-center md:text-start w-full">
            <div className="w-20 h-20 md:w-28 md:h-28 bg-white/10 backdrop-blur-xl rounded-[28px] flex items-center justify-center shrink-0 border border-white/20 shadow-inner group-hover:scale-105 group-hover:rotate-3 transition-all duration-500">
               <Trophy className="w-10 h-10 md:w-14 md:h-14 text-yellow-400" />
            </div>
            <div className="flex-1 text-white">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 text-indigo-200 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl border border-white/10 mb-4 backdrop-blur-md">
                 <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                 {language === 'ar' ? 'رحلة التعلم (Modular Journey)' : 'Modular Journey'}
              </div>
              <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tight leading-tight">
                {language === 'ar' ? 'اختباراتك المدرسية المتاحة' : 'Available School Exams'}
              </h1>
              <p className="text-slate-400 text-sm md:text-base font-bold max-w-2xl leading-relaxed">
                {language === 'ar' ? 'استعرض التقييمات والاختبارات الخاصة بمدرستك. قم بحل الاختبارات بدقة واجمع النقاط للارتقاء في مستواك.' : 'Browse assessments and exams specific to your school. Solve exams accurately and collect points to level up.'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ── MAIN MODULES LIST ── */}
          <div className="lg:col-span-8 flex flex-col gap-8 transition-all duration-300">
            {loading ? (
              <div className="py-24 text-center flex flex-col items-center gap-6 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-lg"></div>
              </div>
            ) : error ? (
              <div className="py-24 text-center bg-rose-50 rounded-[32px] border border-rose-100 shadow-sm">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                <p className="text-rose-600 font-black text-xl">{error}</p>
              </div>
            ) : modules.length === 0 ? (
              <div className="py-32 text-center bg-white rounded-[40px] border border-slate-100 shadow-sm group">
                <div className="w-24 h-24 bg-slate-50 border-2 border-slate-100 rounded-[28px] flex items-center justify-center mx-auto mb-8 text-slate-300">
                  <Layers className="w-12 h-12" />
                </div>
                <p className="text-slate-900 font-black text-2xl tracking-tight mb-2">
                  {language === 'ar' ? 'لا يوجد اختبارات متاحة حالياً' : 'No exams available right now'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {modules.map((module, index) => (
                  <Link href={`/exams/${module.id}/details`} key={`${module.id ?? 'module'}-${index}`} className="block bg-white rounded-3xl p-6 border-2 transition-all duration-300 cursor-pointer shadow-sm group relative overflow-hidden border-slate-100 hover:border-indigo-300 hover:shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-colors bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white">
                        <Layers className="w-7 h-7" />
                      </div>
                      <span className="bg-slate-50 text-slate-500 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border border-slate-200">
                        {module.modules?.length || 0} {language === 'ar' ? 'أقسام' : 'Sections'}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{module.title}</h3>
                    
                    <div className="mt-6 flex justify-end">
                      <div className="px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm transition-all bg-slate-50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                        {language === 'ar' ? 'عرض الأقسام' : 'View Sections'}
                        <ChevronDown className="w-4 h-4 transition-transform -rotate-90" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {/* ── SIDEBAR: GAMIFICATION & PORTFOLIO ── */}
          <div className="lg:col-span-4 space-y-8">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight px-2 flex items-center gap-2">
              <Award className="w-6 h-6 text-fuchsia-500" />
              {language === 'ar' ? 'إنجازاتك (Portfolio)' : 'Your Portfolio'}
            </h3>
            
            <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm">
              {!portfolio?.portfolio || portfolio.portfolio.length === 0 ? (
                <div className="text-center text-slate-400 py-12 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-300">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold">
                    {language === 'ar' ? 'لم تقم بحل أي اختبارات بعد، ابدأ رحلتك الآن!' : 'You haven\'t completed any exams yet, start your journey now!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {portfolio.portfolio.map((p: any, index: number) => (
                    <div key={`${p.id ?? 'portfolio'}-${index}`} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 group hover:border-fuchsia-200 transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-fuchsia-100 text-fuchsia-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Flame className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-800 text-sm">{p.title}</h4>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                              {p.completedExams} {language === 'ar' ? 'اختبار مكتمل' : 'Completed Exams'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-indigo-600">{p.totalScore} XP</div>
                        </div>
                      </div>
                      
                      {/* Progress Bar (Visual flair) */}
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-4">
                        <div className="h-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 rounded-full w-[100%]" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-[32px] p-8 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl pointer-events-none" />
              <Medal className="w-12 h-12 text-yellow-400 mb-4 drop-shadow-md" />
              <h3 className="text-2xl font-black mb-2">{language === 'ar' ? 'استمر في التقدم!' : 'Keep Making Progress!'}</h3>
              <p className="text-indigo-100 font-bold text-sm mb-6 opacity-90 leading-relaxed">
                {language === 'ar' ? 'كل اختبار تحله يقربك أكثر من التميز. نقاطك الحالية تعكس مجهودك.' : 'Every exam you solve brings you closer to excellence. Your current points reflect your effort.'}
              </p>
              <button className="w-full py-4 bg-white text-indigo-600 font-black rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform">
                {language === 'ar' ? 'اكتشف المهام المتاحة' : 'Discover Available Tasks'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
