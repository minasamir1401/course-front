'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import AiChat from '@/components/ai/AiChat';
import { checkAuthSession } from '@/lib/auth';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/components/ai/AiAssistant.module.css';
function AssistantPage() {
  const params = useSearchParams(), router = useRouter(); const { language } = useLanguage(); const [ready, setReady] = useState(false);
  useEffect(() => { let active = true; checkAuthSession().then(session => { if (!session.authenticated) router.replace('/login'); else if (session.user?.role !== 'STUDENT') router.replace('/dashboard'); else if (active) setReady(true); }); return () => { active = false; }; }, [router]);
  return <DashboardLayout>{ready && <div dir={language === 'ar' ? 'rtl' : 'ltr'}><div className={styles.screenTitle}><h1>{language === 'ar' ? 'مساحتك مع المساعد' : 'Your assistant workspace'}</h1><p>{language === 'ar' ? 'دروسك، تقدّمك، وأسئلتك في محادثة واحدة.' : 'Your lessons, progress and questions, in one conversation.'}</p></div><div className={styles.full}><AiChat lessonId={params.get('lessonId') || undefined} initialPrompt={params.get('prompt') || ''}/></div></div>}</DashboardLayout>;
}
export default function Page() { return <Suspense><AssistantPage/></Suspense>; }
