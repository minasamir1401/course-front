'use client';
import PageAccessGate from '@/components/PageAccessGate';

// Compatibility entry point: authorization is verified centrally, never from UI storage.
export default function SchoolAdminAuthGate({ children }: { children: React.ReactNode; loading: React.ReactNode }) {
  return <PageAccessGate>{children}</PageAccessGate>;
}
