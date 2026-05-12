"use client";

import React from 'react';
import SuperAdminLayout from '../layout';
import SuperAdminSidebar from '@/components/SuperAdminSidebar';
import ExamAttendanceReport from '@/components/ExamReport';
import { FileText } from 'lucide-react';

export default function SuperAdminReportsPage() {
  return (
    <SuperAdminLayout>
      <div className="min-h-screen bg-slate-50" dir="rtl">
        <SuperAdminSidebar />
        <main className="lg:mr-64 p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-3xl font-black text-slate-900 mb-2 flex items-center gap-3">
                  <FileText className="w-8 h-8 text-indigo-600" />
                  التقارير والإحصائيات
                </h1>
                <p className="text-slate-500 font-bold">استخراج تقارير أداء الطلاب وحضور الامتحانات لجميع المدارس.</p>
              </div>
            </div>

            <ExamAttendanceReport role="SUPER_ADMIN" />
          </div>
        </main>
      </div>
    </SuperAdminLayout>
  );
}
