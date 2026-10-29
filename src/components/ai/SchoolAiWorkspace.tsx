'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AiGuidanceEditor from './AiGuidanceEditor';
import AiStaffInsights from './AiStaffInsights';
import { checkAuthSession } from '@/lib/auth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
export default function SchoolAiWorkspace() {
  const { language } = useLanguage(); const router = useRouter(); const [schoolId, setSchoolId] = useState<string | null>(null);
  useEffect(() => { checkAuthSession().then(session => { if (!session.authenticated) router.replace('/school-admin/login'); else if (session.user?.role === 'SCHOOL_ADMIN') setSchoolId(session.user.schoolId); else router.replace('/school-admin'); }); }, [router]);
  return <DashboardLayout><div className="max-w-5xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}><h1 className="text-2xl font-black mb-3">{language === 'ar' ? 'المساعد التعليمي لمدرستك' : 'Your school’s learning assistant'}</h1><p className="text-sm text-slate-500 mb-7">{language === 'ar' ? 'حدد أسلوب المساعد ومعلومات المدرسة المعتمدة. اتصالات API يديرها المدير العام.' : 'Set the assistant’s style and approved school information. API connections are managed by the super admin.'}</p>{schoolId && <><AiGuidanceEditor scope="school" id={schoolId} language={language}/><AiStaffInsights/></>}</div></DashboardLayout>;
}
