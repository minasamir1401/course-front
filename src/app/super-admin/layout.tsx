import type { ReactNode } from 'react';
import { LocalBackupMonitorProvider } from '@/components/admin/LocalBackupMonitor';

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return <LocalBackupMonitorProvider>{children}</LocalBackupMonitorProvider>;
}
