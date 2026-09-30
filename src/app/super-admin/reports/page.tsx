import React from 'react';
import type { Metadata } from 'next';
import SuperAdminReportsView from './SuperAdminReportsView';

export const metadata: Metadata = {
  title: 'التقارير المركزية والإحصائيات | Klevro',
  description: 'استخراج تقارير أداء الطلاب وحضور الامتحانات لجميع المدارس المسجلة.',
};

export default function SuperAdminReportsPage() {
  return <SuperAdminReportsView />;
}
