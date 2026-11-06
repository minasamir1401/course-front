'use client';
import AdminOverview from '@/components/dashboard/AdminOverview';
import TeachingWorkspace from './TeachingWorkspace';
import { useTeachingData } from './useTeachingData';
export default function SchoolHome() {
  const { data, error } = useTeachingData('/auth/me');
  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p role="status">جارٍ تحميل لوحة المتابعة… / Loading dashboard…</p>;
  return data.user?.role === 'TEACHER' ? <TeachingWorkspace/> : <AdminOverview/>;
}
