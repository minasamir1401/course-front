import type { ReactNode } from 'react';
import SuperAdminAuthGate from './SuperAdminAuthGate';
import AdminAuthLoading from '@/components/admin/AdminAuthLoading';

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return <SuperAdminAuthGate loading={<AdminAuthLoading section="super" />}>{children}</SuperAdminAuthGate>;
}
