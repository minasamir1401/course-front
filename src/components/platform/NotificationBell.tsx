'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './Platform.module.css';
export default function NotificationBell() {
  const { language } = useLanguage(); const [count, setCount] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const load = () => { if (document.hidden) return; fetch('/api/notifications', { credentials: 'include', cache: 'no-store', signal: controller.signal }).then(async r => { if (r.ok) setCount((await r.json()).unread || 0); }).catch(() => {}); };
    load(); const timer = setInterval(load, 60000); window.addEventListener('klevro-notifications', load); document.addEventListener('visibilitychange', load);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener('klevro-notifications', load); document.removeEventListener('visibilitychange', load); };
  }, []);
  return <Link href="/notifications" className={styles.bell} aria-label={language === 'ar' ? `الإشعارات، ${count} غير مقروء` : `Notifications, ${count} unread`}><Bell size={19}/>{count > 0 && <span className={styles.badge} aria-hidden="true">{count > 99 ? '99+' : count}</span>}</Link>;
}
