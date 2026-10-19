"use client";
import DashboardLayout from "./DashboardLayout";
import { Timer, AlertCircle } from "lucide-react";
import { formatEgyptDate } from "@/lib/egyptTime";
export default function LessonAccessState({ isLoading, isExpired, lesson, language, t, router, retry }: any) {
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 border-[6px] border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin shadow-2xl shadow-indigo-200 mx-auto"></div>
            <p className="text-indigo-600 font-black text-sm uppercase tracking-[4px] animate-pulse">{t('lesson.preparing')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isExpired) {
    return (
      <DashboardLayout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="w-24 h-24 bg-red-500/10 rounded-[40px] flex items-center justify-center mb-8 border border-red-500/20 animate-bounce">
            <Timer className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">{t('lesson.expiredAccess')}</h2>
          <p className="text-slate-500 text-lg font-bold max-w-md mb-12 leading-relaxed">
            {t('lesson.expiredMessage')} {lesson?.cutOffDate && !isNaN(new Date(lesson.cutOffDate).getTime()) ? `(${formatEgyptDate(lesson.cutOffDate, language)})` : ''}. {t('lesson.contactAdmin')}
          </p>
          <button
            onClick={() => router.push('/courses')}
            className="bg-indigo-600 text-white px-12 py-5 rounded-[22px] font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-indigo-100"
          >
            {t('lesson.backToCourses')}
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!lesson) {
    return (
      <DashboardLayout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-slate-300 mx-auto" />
            <p role="alert" className="text-slate-600 font-bold text-xl">{t('lesson.contentNotAvailable')}</p>
            <div className="flex flex-wrap justify-center gap-3">{retry && <button className="report-primary" onClick={retry}>{language === 'ar' ? 'إعادة المحاولة' : 'Retry'}</button>}<button className="report-secondary" onClick={() => router.push('/courses')}>{language === 'ar' ? 'العودة للمقررات' : 'Back to courses'}</button></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }


return null;
}
