import type { ReactNode } from 'react';
import SchoolAdminAuthGate from './SchoolAdminAuthGate';
import AdminAuthLoading from '@/components/admin/AdminAuthLoading';

export default function SchoolAdminLayout({ children }: { children: ReactNode }) {
  return <SchoolAdminAuthGate loading={<AdminAuthLoading section="school" />}>{children}</SchoolAdminAuthGate>;
}
