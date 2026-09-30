import React from 'react';
import type { Metadata } from 'next';
import SchoolAdminReportsView from './SchoolAdminReportsView';

export const metadata: Metadata = {
  title: 'تقارير أداء الطلاب والحضور | Klevro',
  description: 'استعراض تقارير وإحصائيات الحضور والغياب ونتائج الاختبارات الخاصة بالمدرسة.',
};

export default function SchoolAdminReportsPage() {
  return <SchoolAdminReportsView />;
}
