'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, BellRing, BookOpen, Award, CheckCheck, RefreshCw, BellOff } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiFetch } from '@/lib/api';
import styles from './Platform.module.css';
import LearningBackdrop from '@/components/student/LearningBackdrop';
type Notice = { id: string; kind: string; titleAr: string; titleEn: string; body: string; href: string; readAt: string | null; createdAt: string };
export default function NotificationsPage() {
  const { language } = useLanguage(); const ar = language === 'ar'; const router = useRouter();
  const [items, setItems] = useState<Notice[]>([]); const [total, setTotal] = useState(0); const [unread, setUnread] = useState(0); const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [configured, setConfigured] = useState(false); const [key, setKey] = useState(''); const [supported, setSupported] = useState(false); const [subscribed, setSubscribed] = useState(false); const [busy, setBusy] = useState(false); const [permission, setPermission] = useState<NotificationPermission>('default');
  const load = useCallback(async (offset = 0) => {
    setLoading(true); setError('');
    try {
      const response = await apiFetch(`/api/notifications?offset=${offset}`, { cache: 'no-store' });
      if (!response.ok) throw new Error();
      const data = await response.json(); setItems(old => offset ? [...old, ...data.items] : data.items); setTotal(data.total); setUnread(data.unread); window.dispatchEvent(new Event('klevro-notifications'));
    } catch { setError(ar ? 'تعذر تحميل الإشعارات. حاول مرة أخرى.' : 'Unable to load notifications. Please retry.'); }
    finally { setLoading(false); }
  }, [ar]);
  useEffect(() => {
    if (!localStorage.getItem('lms_user')) { router.replace('/login'); return; }
    void load();
    const enabled = window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setSupported(enabled); if ('Notification' in window) setPermission(Notification.permission);
    if (enabled) {
      navigator.serviceWorker.getRegistration('/').then(reg => reg?.pushManager.getSubscription()).then(async sub => {
        if (!sub) { setSubscribed(false); return; }
        const response = await apiFetch('/api/push/devices', { cache: 'no-store' });
        if (response.ok) setSubscribed((await response.json()).devices.some((device: { endpoint: string }) => device.endpoint === sub.endpoint));
      }).catch(() => {});
      apiFetch('/api/push/config', { cache: 'no-store' }).then(async res => { if (res.ok) { const data = await res.json(); setConfigured(data.enabled); setKey(data.publicKey || ''); } }).catch(() => {});
    }
  }, [load, router]);
  const subscribe = async () => {
    setBusy(true); setMessage('');
    try {
      const allowed = await Notification.requestPermission(); setPermission(allowed);
      if (allowed !== 'granted') { setMessage(ar ? 'لم تُمنح صلاحية الإشعارات. يمكنك تفعيلها من إعدادات المتصفح.' : 'Notifications were not allowed. You can change this in browser settings.'); return; }
      const registration = await navigator.serviceWorker.ready;
      const raw = atob(key.replace(/-/g, '+').replace(/_/g, '/')); const applicationServerKey = Uint8Array.from(raw, char => char.charCodeAt(0));
      let sub = await registration.pushManager.getSubscription();
      if (!sub) sub = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
      const save = (subscription: PushSubscription) => apiFetch('/api/push/subscriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...subscription.toJSON(), language }) });
      let response = await save(sub);
      if (response.status === 409) { await sub.unsubscribe(); sub = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey }); response = await save(sub); }
      if (!response.ok) { await sub.unsubscribe(); throw new Error(); }
      setSubscribed(true); setMessage(ar ? 'تم تفعيل تنبيهات هذا الجهاز.' : 'Notifications are enabled for this device.');
    } catch { setMessage(ar ? 'تعذر تفعيل التنبيهات. تحقق من الاتصال وصلاحيات المتصفح.' : 'Could not enable notifications. Check your connection and browser permissions.'); }
    finally { setBusy(false); }
  };
  const unsubscribe = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration('/'); const sub = await reg?.pushManager.getSubscription();
      if (sub) { const response = await apiFetch('/api/push/subscriptions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) }); if (!response.ok) throw new Error(); await sub.unsubscribe(); }
      setSubscribed(false); setMessage(ar ? 'تم إيقاف تنبيهات هذا الجهاز. إشعارات المنصة ما زالت محفوظة هنا.' : 'Device alerts are off. Your inbox remains available here.');
    } catch { setMessage(ar ? 'تعذر إيقاف التنبيهات. حاول مرة أخرى.' : 'Could not disable notifications. Please retry.'); }
    finally { setBusy(false); }
  };
  const mark = async (id?: string) => {
    try {
      const response = await apiFetch('/api/notifications/read', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(id ? { id } : {}) });
      if (!response.ok) throw new Error();
      setItems(old => old.map(item => !id || item.id === id ? { ...item, readAt: new Date().toISOString() } : item)); setUnread(old => id ? Math.max(0, old - 1) : 0); window.dispatchEvent(new Event('klevro-notifications'));
    } catch { setError(ar ? 'تعذر تحديث حالة القراءة.' : 'Could not update read status.'); }
  };
  return <DashboardLayout mainClassName={styles.main}><div className={styles.page} dir={ar ? 'rtl' : 'ltr'}>
    <LearningBackdrop/>
    <section className={styles.hero}><div><span className={styles.muted}>Klevro · {ar ? 'مساحتك الدراسية' : 'Your learning space'}</span><h1>{ar ? 'كل جديد… في مكان واحد' : 'Every update, in one place'}</h1><p>{ar ? 'دروسك الجديدة، مواعيد فتح الامتحانات، وشهاداتك من المدرسة.' : 'New lessons, assessment opening times, and certificates from your school.'}</p></div><BellRing className={styles.heroIcon} size={45}/></section>
    <section className={styles.card}><div className={styles.row}><div><h2>{ar ? 'تنبيهات جهازك' : 'Device notifications'}</h2><p>{ar ? 'تظهر التنبيهات بعد موافقتك، حتى عندما لا تكون المنصة مفتوحة.' : 'Allow notifications to receive alerts even when the platform is not open.'}</p></div><button className={subscribed ? styles.secondary : styles.primary} disabled={busy || (!subscribed && (!supported || !configured || permission === 'denied'))} onClick={subscribed ? unsubscribe : subscribe}>{subscribed ? <BellOff size={18}/> : <BellRing size={18}/>}{subscribed ? (ar ? 'إيقاف على هذا الجهاز' : 'Turn off on this device') : (ar ? 'تفعيل الإشعارات' : 'Enable notifications')}</button></div>
      {!supported && <p className={styles.muted}>{ar ? 'على iPhone: ثبّت التطبيق من Safari وافتحه من الشاشة الرئيسية أولًا. بعض المتصفحات لا تدعم تنبيهات الجهاز.' : 'On iPhone, install from Safari and open from your Home Screen first. Some browsers do not support device notifications.'}</p>}
      {supported && !configured && <p className={styles.muted}>{ar ? 'تنبيهات الجهاز غير مهيأة حاليًا. جميع إشعاراتك ستظهر في المركز أدناه.' : 'Device push is not configured yet. All updates remain available in your inbox below.'}</p>}
      {permission === 'denied' && <p className={styles.muted}>{ar ? 'الإشعارات محظورة لهذا الموقع. غيّر الإذن من إعدادات المتصفح لتفعيلها.' : 'Notifications are blocked for this site. Change permission in your browser settings to enable them.'}</p>}
      {message && <p role="status">{message}</p>}
    </section>
    <div className={styles.toolbar}><h2>{ar ? `إشعاراتك (${unread} غير مقروء)` : `Your inbox (${unread} unread)`}</h2><button className={styles.secondary} disabled={loading} onClick={() => load()}><RefreshCw size={16}/>{ar ? 'تحديث' : 'Refresh'}</button><button className={styles.secondary} disabled={!unread} onClick={() => mark()}><CheckCheck size={17}/>{ar ? 'قراءة الكل' : 'Mark all read'}</button></div>
    {error && <p className={`${styles.status} ${styles.error}`} role="alert">{error}</p>}
    {loading && !items.length ? <p role="status">{ar ? 'جارٍ تحميل الإشعارات…' : 'Loading notifications…'}</p> : !items.length && !error ? <div className={styles.empty}><Bell size={40}/><h2>{ar ? 'أنت متابع كل جديد' : 'You’re all caught up'}</h2><p>{ar ? 'ستصلك هنا التحديثات الجديدة المتاحة لك.' : 'New updates available to you will appear here.'}</p></div> : items.map(item => <article className={`${styles.notice} ${!item.readAt ? styles.unread : ''}`} key={item.id}>{item.kind === 'CERTIFICATE' ? <Award size={23}/> : <BookOpen size={23}/>}<div style={{ flex: 1 }}><h2>{ar ? item.titleAr : item.titleEn}</h2><p>{item.body}</p><time className={styles.date} dateTime={item.createdAt}>{new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en-GB', { timeZone: 'Africa/Cairo', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.createdAt))} · {ar ? 'توقيت مصر' : 'Egypt time'}</time><div className={styles.actions}><Link className={styles.secondary} href={item.href.startsWith('/') && !item.href.startsWith('//') ? item.href : '/dashboard'} onClick={() => { if (!item.readAt) void mark(item.id); }}>{ar ? 'عرض التفاصيل' : 'View details'}</Link>{!item.readAt && <button className={styles.secondary} onClick={() => mark(item.id)}>{ar ? 'تحديد كمقروء' : 'Mark read'}</button>}</div></div></article>)}
    {items.length < total && <button className={styles.secondary} disabled={loading} onClick={() => load(items.length)}>{ar ? 'عرض المزيد' : 'Load more'}</button>}
  </div></DashboardLayout>;
}
