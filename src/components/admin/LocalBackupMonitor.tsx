"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertTriangle, Archive } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiFetch } from '@/lib/api';

type Failure = 'database' | 'disk-full' | 'storage' | 'archive';
type BackupStatus = {
  viewerId: string;
  state: 'ready' | 'waiting' | 'failed' | 'overdue' | 'disabled';
  alert: { id: string; day: string; reason?: Failure } | null;
  archive: { day: string; filename: string; createdAt: string; size: number } | null;
  attempts: Array<{ id: string; day: string; startedAt: string; completedAt?: string; outcome: 'running' | 'success' | 'failure'; reason?: Failure }>;
};

const reasons: Record<Failure, [string, string]> = {
  database: ['تعذّر الاتصال بقاعدة البيانات', 'Database unavailable'],
  'disk-full': ['مساحة التخزين ممتلئة', 'Storage is full'],
  storage: ['تعذّر الوصول لتخزين النسخ', 'Backup storage unavailable'],
  archive: ['تعذّر إنشاء الأرشيف', 'Could not create the archive'],
};

const context = createContext<{ status: BackupStatus | null; unavailable: boolean }>({ status: null, unavailable: false });

function formatTime(value: string, isArabic: boolean) {
  return new Intl.DateTimeFormat(isArabic ? 'ar-EG' : 'en-GB', {
    dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Africa/Cairo',
  }).format(new Date(value));
}

export function LocalBackupMonitorProvider({ children }: { children: ReactNode }) {
  const isLogin = usePathname().replace(/\/+$/, '') === '/super-admin/login';
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    if (isLogin) return;
    let active = true;
    let pending: AbortController | null = null;
    async function refresh() {
      if (pending || document.visibilityState === 'hidden') return;
      const controller = new AbortController();
      pending = controller;
      const timeout = window.setTimeout(() => controller.abort(), 8000);
      try {
        const res = await apiFetch('/api/admin/monitor/backups', { cache: 'no-store', signal: controller.signal });
        if (!res.ok) throw new Error('Backup status unavailable');
        const data: BackupStatus = await res.json();
        if (active) {
          setStatus(data);
          setUnavailable(false);
        }
      } catch {
        if (active) setUnavailable(true);
      } finally {
        window.clearTimeout(timeout);
        pending = null;
      }
    }
    void refresh();
    const interval = window.setInterval(refresh, 30_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      pending?.abort();
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [isLogin]);

  return <context.Provider value={{ status: isLogin ? null : status, unavailable: !isLogin && unavailable }}>
    {!isLogin && <LocalBackupAlert />}
    {children}
  </context.Provider>;
}

function LocalBackupAlert() {
  const { status, unavailable } = useContext(context);
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [dismissed, setDismissed] = useState<string | null>(null);
  const key = status?.viewerId ? 'local-backup-alert:' + status.viewerId : null;
  useEffect(() => {
    if (!key) return;
    function read() {
      try { setDismissed(localStorage.getItem(key!)); } catch { /* Storage may be blocked. */ }
    }
    read();
    window.addEventListener('storage', read);
    return () => window.removeEventListener('storage', read);
  }, [key]);

  const alert = status?.alert;
  if (!alert || dismissed === alert.id) return null;
  const message = alert.reason
    ? (isArabic ? 'فشلت محاولة النسخ المحلي لليوم ' : 'Local backup attempt failed for ') + alert.day + ' · ' + reasons[alert.reason][isArabic ? 0 : 1]
    : (isArabic ? 'النسخة المحلية متأخرة ليوم ' : 'Local backup is overdue for ') + alert.day;
  return (
    <aside dir={isArabic ? 'rtl' : 'ltr'} role="status" className="flex flex-wrap items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className="flex-1 basis-48 font-semibold">
        {unavailable ? (isArabic ? 'آخر حالة معروفة: ' : 'Last known status: ') : ''}{message}
      </span>
      <Link className="font-semibold underline underline-offset-2" href="/super-admin/monitor#local-backups">
        {isArabic ? 'عرض التفاصيل' : 'View details'}
      </Link>
      <button type="button" className="rounded-lg border border-amber-300 px-3 py-1.5 font-semibold" onClick={() => {
        setDismissed(alert.id);
        if (key) try { localStorage.setItem(key, alert.id); } catch { /* Dismiss for this view. */ }
      }}>
        {isArabic ? 'تجاهل' : 'Dismiss'}
      </button>
    </aside>
  );
}

export function LocalBackupStatusCard() {
  const { status, unavailable } = useContext(context);
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const statusLabels: Record<BackupStatus['state'], string> = {
    ready: isArabic ? 'نسخة اليوم موجودة' : 'Today’s backup is available',
    waiting: isArabic ? 'في انتظار نسخة اليوم' : 'Waiting for today’s backup',
    failed: isArabic ? 'آخر محاولة فشلت' : 'A backup attempt failed',
    overdue: isArabic ? 'النسخة اتأخرت' : 'Backup overdue',
    disabled: isArabic ? 'جدولة النسخ المحلية غير مفعّلة' : 'Local backup scheduling is disabled',
  };
  const outcomeLabels = {
    running: isArabic ? 'بدأت المحاولة' : 'Started',
    success: isArabic ? 'نجحت' : 'Succeeded',
    failure: isArabic ? 'فشلت' : 'Failed',
  };
  return <section id="local-backups" className="scroll-mt-6 space-y-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
    <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
      <Archive className="h-5 w-5 text-indigo-600" aria-hidden="true" />
      {isArabic ? 'النسخ المحلية' : 'Local backups'}
    </h2>
    {unavailable && <p role="status" className="text-sm text-amber-800">
      {isArabic ? 'تعذّر تحديث حالة النسخ حاليًا.' : 'Backup status could not be refreshed.'}
    </p>}
    {!status && !unavailable && <p role="status" className="text-sm text-slate-600">{isArabic ? 'جارٍ تحميل الحالة…' : 'Loading status…'}</p>}
    {status && <p className="text-sm font-semibold text-slate-800">{statusLabels[status.state]}{status.alert && <span dir="ltr"> · {status.alert.day}</span>}</p>}
    {status?.archive && <p className="break-all text-sm text-slate-600">
      {isArabic ? 'آخر نسخة متاحة: ' : 'Latest available backup: '}<bdi>{status.archive.filename}</bdi>
    </p>}
    {!!status?.attempts.length && <ol className="max-h-56 divide-y overflow-auto rounded-xl border border-slate-200 px-3">
      {status.attempts.map(attempt => <li key={attempt.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
        <time dateTime={attempt.startedAt}>{formatTime(attempt.startedAt, isArabic)}</time>
        <span className={attempt.outcome === 'failure' ? 'text-rose-700' : 'text-slate-700'}>
          {outcomeLabels[attempt.outcome]}{attempt.reason && ' · ' + reasons[attempt.reason][isArabic ? 0 : 1]}
        </span>
      </li>)}
    </ol>}
  </section>;
}
