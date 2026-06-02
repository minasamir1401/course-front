"use client";

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ExamAttendanceReport from '@/components/ExamReport';
import { FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SchoolAdminReportsPage() {
  const { t, language } = useLanguage();

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className={language === 'ar' ? 'text-right' : 'text-left'}>
          <h1 className="text-3xl font-black text-slate-900 mb-2 flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <FileText className="w-8 h-8 text-emerald-600" />
            </div>
            {t('schoolAdmin.reportsPage.title')}
          </h1>
          <p className="text-slate-500 font-bold opacity-80">{t('schoolAdmin.reportsPage.subtitle')}</p>
        </div>

        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-2 md:p-6 overflow-hidden">
          <ExamAttendanceReport role="SCHOOL_ADMIN" />
        </div>
      </div>
    </DashboardLayout>
  );
}
