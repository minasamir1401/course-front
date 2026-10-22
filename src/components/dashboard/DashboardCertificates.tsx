'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, ArrowUpRight, FileImage, FileText } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './DashboardCertificates.module.css';

type Certificate = { id: string; title: string; mimeType: string; createdAt: string; revokedAt: string | null; school: { name: string } };
type CertificateSummary = { items: Certificate[]; total: number };

export default function DashboardCertificates({ refreshKey = 0 }: { refreshKey?: number }) {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const [summary, setSummary] = useState<CertificateSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError(false);
      try {
        const response = await apiFetch('/api/certificates?offset=0', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Certificates unavailable');
        const data: CertificateSummary = await response.json();
        if (!Array.isArray(data.items) || !Number.isInteger(data.total) || data.total < 0) throw new Error('Invalid certificate summary');
        if (!controller.signal.aborted) setSummary(data);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [refreshKey, retry]);

  const items = summary?.items.filter(item => !item.revokedAt).slice(0, 3) || [];
  return <section className={styles.section} aria-labelledby="dashboard-certificates-title" aria-busy={loading}>
    <div className={styles.heading}>
      <div className={styles.title}><span className={styles.icon}><Award size={25}/></span><div>
        <h2 id="dashboard-certificates-title">{ar ? 'شهاداتي' : 'My certificates'}</h2>
        <p>{ar ? 'إنجازاتك وتقدير مدرستك، محفوظة في مكان واحد.' : 'Your achievements and school recognition, saved in one place.'}</p>
      </div></div>
      <Link href="/certificates" className={styles.viewAll}>{ar ? 'عرض الكل' : 'View all'}<ArrowUpRight size={17} aria-hidden="true"/></Link>
    </div>
    {error && <div className={styles.error} role="alert"><p>{ar ? 'تعذر تحديث الشهادات. حاول مرة أخرى.' : 'Could not refresh certificates. Please retry.'}</p><button onClick={() => setRetry(value => value + 1)} disabled={loading}>{ar ? 'إعادة تحميل الشهادات' : 'Retry certificates'}</button></div>}
    {loading && !summary && <p role="status" className={styles.status}>{ar ? 'جارٍ تحميل شهاداتك…' : 'Loading your certificates…'}</p>}
    {summary && <>
      <p className={styles.count}>{ar ? 'إجمالي شهاداتك:' : 'Total certificates:'} <bdi>{summary.total.toLocaleString(ar ? 'ar-EG' : 'en-GB')}</bdi></p>
      {items.length ? <ul className={styles.grid}>{items.map(item => <li key={item.id}>
        <Link href="/certificates" className={styles.certificate}>
          <span className={styles.seal}><Award size={35} strokeWidth={1.6}/></span>
          <div className={styles.details}><span className={styles.school}><bdi>{item.school.name}</bdi></span><h3><bdi>{item.title}</bdi></h3><time dateTime={item.createdAt}>{new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeZone: 'Africa/Cairo' }).format(new Date(item.createdAt))}</time></div>
          <span className={styles.file}>{item.mimeType === 'application/pdf' ? <FileText size={16}/> : <FileImage size={16}/>}<span>{item.mimeType === 'application/pdf' ? 'PDF' : ar ? 'صورة' : 'Image'}</span></span>
        </Link>
      </li>)}</ul> : !error && <div className={styles.empty}><Award size={36}/><p>{ar ? 'ستظهر هنا الشهادات التي ترسلها لك مدرستك.' : 'Certificates sent by your school will appear here.'}</p></div>}
    </>}
  </section>;
}
