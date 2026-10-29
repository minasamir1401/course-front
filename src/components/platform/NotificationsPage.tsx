'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, BellRing, BookOpen, Award, Check, CheckCheck, RefreshCw, BellOff, Search, X, ArrowUpRight, CalendarDays, ClipboardList, Layers3, Inbox, AlertCircle, Smartphone, ChevronDown } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiFetch } from '@/lib/api';
import LearningBackdrop from '@/components/student/LearningBackdrop';
import styles from './NotificationsPage.module.css';

type Notice = { id: string; kind: string; titleAr: string; titleEn: string; body: string; href: string; readAt: string | null; createdAt: string };
const dayKey = (value: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value);
const notificationDestination = (value: string) => /^\/(?:dashboard|courses|lessons|exams|reports|calendar|certificates|notifications)(?:[/?#]|$)/.test(value) && !/[\\\u0000-\u0020]/.test(value) ? value : '/dashboard';
export default function NotificationsPage() {
  const { language } = useLanguage(); const ar = language === 'ar';
  const txt = useCallback((arabic: string, english: string) => ar ? arabic : english, [ar]);
  const [items, setItems] = useState<Notice[]>([]), [total, setTotal] = useState(0), [inboxTotal, setInboxTotal] = useState<number | null>(null), [unread, setUnread] = useState<number | null>(null);
  const [loading, setLoading] = useState(true), [loadingMore, setLoadingMore] = useState(false), [error, setError] = useState('');
  const [filter, setFilter] = useState('all'), [category, setCategory] = useState('all'), [search, setSearch] = useState(''), [query, setQuery] = useState('');
  const [marking, setMarking] = useState<string | null>(null), [message, setMessage] = useState('');
  const [configured, setConfigured] = useState(false), [key, setKey] = useState(''), [supported, setSupported] = useState(false), [subscribed, setSubscribed] = useState(false), [busy, setBusy] = useState(false), [permission, setPermission] = useState<NotificationPermission>('default');
  const requestEpoch = useRef(0), markLock = useRef(false);
  const invalidate = useCallback(() => { requestEpoch.current++; }, []);
  useEffect(() => { const timer = setTimeout(() => setQuery(search.trim()), 300); return () => clearTimeout(timer); }, [search]);
  const load = useCallback(async (offset = 0) => {
    const epoch = ++requestEpoch.current;
    setLoading(true); setLoadingMore(offset > 0); setError('');
    const params = new URLSearchParams({ offset: String(offset) });
    if (filter === 'unread') params.set('unread', '1');
    if (category !== 'all') params.set('category', category);
    if (query) params.set('q', query);
    try {
      const response = await apiFetch(`/api/notifications?${params}`, { cache: 'no-store' });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (epoch !== requestEpoch.current) return;
      const notices: Notice[] = data.items.map((notice: Notice) => ({ ...notice, href: notificationDestination(notice.href || '') }));
      setItems(old => offset ? [...new Map([...old, ...notices].map(item => [item.id, item])).values()] : notices);
      setTotal(data.total); setInboxTotal(data.inboxTotal ?? data.total); setUnread(data.unread);
    } catch { if (epoch === requestEpoch.current) setError(txt('تعذر تحميل الإشعارات. حاول مرة أخرى.', 'Unable to load notifications. Please retry.')); }
    finally { if (epoch === requestEpoch.current) { setLoading(false); setLoadingMore(false); } }
  }, [filter, category, query, txt]);
  useEffect(() => { void load(); return invalidate; }, [load, invalidate]);
  useEffect(() => {
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
  }, []);
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
    if (markLock.current || (id && !items.some(item => item.id === id && !item.readAt))) return;
    markLock.current = true; setMarking(id || 'all'); setError('');
    try {
      const response = await apiFetch('/api/notifications/read', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(id ? { id } : {}) });
      if (!response.ok) throw new Error();
      const data = await response.json();
      // Ignore any older inbox response which was already in flight before this write.
      invalidate(); setLoading(false); setLoadingMore(false);
      setItems(old => filter === 'unread' ? old.filter(item => id ? item.id !== id : false) : old.map(item => !id || item.id === id ? { ...item, readAt: item.readAt || new Date().toISOString() } : item));
      setUnread(old => typeof data.unread === 'number' ? data.unread : id ? Math.max(0, (old || 0) - 1) : 0);
      if (filter === 'unread') setTotal(old => id ? Math.max(0, old - 1) : 0);
      window.dispatchEvent(new Event('klevro-notifications'));
    } catch { setError(txt('تعذر تحديث حالة القراءة.', 'Could not update read status.')); }
    finally { markLock.current = false; setMarking(null); }
  };
  const today = dayKey(new Date()), yesterday = new Date(Date.parse(today + 'T12:00:00Z') - 86400000).toISOString().slice(0, 10);
  const groups = [{ key: 'today', title: txt('اليوم', 'Today') }, { key: 'yesterday', title: txt('أمس', 'Yesterday') }, { key: 'earlier', title: txt('في وقت سابق', 'Earlier') }].map(group => ({ ...group, items: items.filter(item => {
    const date = new Date(item.createdAt), key = Number.isNaN(date.getTime()) ? '' : dayKey(date);
    return (key === today ? 'today' : key === yesterday ? 'yesterday' : 'earlier') === group.key;
  }) })).filter(group => group.items.length);
  const kindInfo = (kind: string) => kind === 'CERTIFICATE' ? { icon: Award, label: txt('الشهادات', 'Certificates'), tone: 'green' } : ['EXAM', 'EXAM_OPEN'].includes(kind) ? { icon: ClipboardList, label: txt('الاختبارات', 'Assessments'), tone: 'blue' } : kind === 'COURSE' ? { icon: Layers3, label: txt('المقررات', 'Courses'), tone: 'purple' } : kind === 'LESSON' ? { icon: BookOpen, label: txt('الدروس', 'Lessons'), tone: 'purple' } : { icon: Bell, label: txt('تحديث', 'Update'), tone: 'neutral' };
  const hasFilters = filter !== 'all' || category !== 'all' || !!query;
  const resetFilters = () => { setFilter('all'); setCategory('all'); setSearch(''); setQuery(''); };
  return <DashboardLayout mainClassName={styles.main}><div className={styles.page} dir={ar ? 'rtl' : 'ltr'}>
    <LearningBackdrop/>
    <header className={styles.heading}><div><p className={styles.eyebrow}>{txt('مساحتك الدراسية / مركز الإشعارات', 'YOUR LEARNING SPACE / INBOX')}</p><h1>{txt('كل جديد، أقرب إليك.', 'Stay close to what’s next.')}</h1><p className={styles.intro}>{txt('تابع مستجدات دروسك واختباراتك، وارجع للتحديث اللي يهمك في وقته.', 'Keep up with your lessons and assessments, and find the updates that matter.')}</p></div><span className={styles.headingMark} aria-hidden="true"><BellRing size={29}/></span></header>
    <div className={styles.layout}>
      <section className={styles.inbox} aria-labelledby="inbox-title" aria-busy={loading}>
        <div className={styles.inboxHeading}><div className={styles.inboxTitle}><span><Inbox size={21} aria-hidden="true"/></span><div><h2 id="inbox-title">{txt('صندوق الإشعارات', 'Your inbox')}</h2><p>{unread === null ? txt('تحديثاتك في مكان واحد', 'All your updates together') : unread > 0 ? txt(`لديك ${unread} إشعارًا لم تقرأه بعد`, `${unread} unread updates waiting for you`) : txt('أنت متابع كل جديد', 'You’re all caught up')}</p></div></div><div className={styles.headerActions}><button type="button" className={styles.iconButton} disabled={loading || !!marking} onClick={() => void load()} aria-label={txt('تحديث', 'Refresh')}><RefreshCw size={17} className={loading ? styles.spin : ''}/></button><button type="button" className={styles.readAll} disabled={!unread || loading || !!marking} onClick={() => void mark()}><CheckCheck size={17} aria-hidden="true"/>{txt('قراءة الكل', 'Mark all read')}</button></div></div>
        <div className={styles.filters}><div className={styles.filterTabs} role="group" aria-label={txt('حالة الإشعارات', 'Notification status')}>{[{ value: 'all', label: txt('الكل', 'All'), count: inboxTotal }, { value: 'unread', label: txt('غير المقروء', 'Unread'), count: unread }].map(tab => <button type="button" key={tab.value} aria-pressed={filter === tab.value} onClick={() => setFilter(tab.value)}>{tab.label}<span>{tab.count ?? '—'}</span></button>)}</div><label className={styles.category}><span className={styles.sr}>{txt('نوع الإشعار', 'Notification type')}</span><select value={category} onChange={event => setCategory(event.target.value)}><option value="all">{txt('كل التحديثات', 'All updates')}</option><option value="learning">{txt('الدروس والمقررات', 'Lessons & courses')}</option><option value="assessments">{txt('الاختبارات', 'Assessments')}</option><option value="certificates">{txt('الشهادات', 'Certificates')}</option></select><ChevronDown size={15} aria-hidden="true"/></label></div>
        <div className={styles.searchRow}><label className={styles.search}><Search size={18} aria-hidden="true"/><span className={styles.sr}>{txt('ابحث في الإشعارات', 'Search notifications')}</span><input type="search" maxLength={150} value={search} onChange={event => setSearch(event.target.value)} placeholder={txt('ابحث عن درس، اختبار، أو تحديث…', 'Search for a lesson, assessment or update…')}/></label>{search && <button type="button" className={styles.iconButton} aria-label={txt('مسح البحث', 'Clear search')} onClick={() => { setSearch(''); setQuery(''); }}><X size={16}/></button>}</div>
        {error && <div className={styles.error} role="alert"><AlertCircle size={19} aria-hidden="true"/><p>{error}</p><button type="button" onClick={() => void load()}>{txt('إعادة المحاولة', 'Try again')}</button></div>}
        <div className={styles.list}>
          {loading && !loadingMore ? <div role="status" className={styles.loading}><span className={styles.sr}>{txt('جارٍ تحميل الإشعارات…', 'Loading notifications…')}</span>{[0, 1, 2].map(index => <div key={index} className={styles.skeleton} aria-hidden="true"><span/><div><i/><i/><i/></div></div>)}</div> : !items.length && !error ? <div className={styles.empty}><span><Bell size={31} aria-hidden="true"/></span><h3>{hasFilters ? txt('لا توجد إشعارات مطابقة', 'No matching updates') : txt('أنت متابع كل جديد', 'You’re all caught up')}</h3><p>{hasFilters ? txt('جرّب كلمات مختلفة أو اعرض كل الإشعارات.', 'Try different words or view all your updates.') : txt('ستجد هنا التحديثات الجديدة المتاحة لحسابك، بمجرد وصولها.', 'New updates available to your account will appear here when they arrive.')}</p>{hasFilters && <button type="button" className={styles.secondary} onClick={resetFilters}>{txt('عرض كل الإشعارات', 'View all notifications')}</button>}</div> : groups.map(group => <section key={group.key} className={styles.dayGroup} aria-labelledby={`notice-group-${group.key}`}><h3 id={`notice-group-${group.key}`} className={styles.groupTitle}>{group.title}<span/></h3>{group.items.map(item => {
            const info = kindInfo(item.kind), Icon = info.icon, date = new Date(item.createdAt);
            return <article key={item.id} className={styles.notice} data-unread={!item.readAt} aria-labelledby={`notice-${item.id}`}><span className={styles.noticeIcon} data-tone={info.tone}><Icon size={21} aria-hidden="true"/></span><div className={styles.noticeContent}><div className={styles.noticeMeta}><span className={styles.typeLabel}>{info.label}</span>{!item.readAt && <span className={styles.unreadBadge}>{txt('غير مقروء', 'Unread')}</span>}<time dateTime={item.createdAt}>{Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en-GB', { timeZone: 'Africa/Cairo', dateStyle: 'medium', timeStyle: 'short' }).format(date)}</time></div><h4 id={`notice-${item.id}`}>{(ar ? item.titleAr : item.titleEn) || item.titleAr || item.titleEn}</h4><p>{item.body}</p><div className={styles.noticeActions}><Link href={item.href} data-notification-id={item.id} onClick={event => { const id = event.currentTarget.dataset.notificationId; if (id) void mark(id); }}>{txt('عرض التفاصيل', 'View details')}<ArrowUpRight size={15} aria-hidden="true"/></Link>{!item.readAt && <button type="button" disabled={!!marking} data-notification-id={item.id} onClick={event => { const id = event.currentTarget.dataset.notificationId; if (id) void mark(id); }}><Check size={14} aria-hidden="true"/>{txt('تحديد كمقروء', 'Mark read')}</button>}</div></div></article>;
          })}</section>)}
        </div>
        {items.length > 0 && <footer className={styles.listFooter}><span>{txt(`عرض ${items.length} من ${total} إشعارًا`, `Showing ${items.length} of ${total} updates`)}</span>{items.length < total && <button type="button" className={styles.secondary} disabled={loading || !!marking} onClick={() => void load(items.length)}>{loadingMore ? txt('جارٍ التحميل…', 'Loading…') : txt('عرض المزيد', 'Load more')}<ChevronDown size={15} aria-hidden="true"/></button>}</footer>}
      </section>
      <aside className={styles.aside} aria-label={txt('خيارات التنبيهات', 'Notification options')}>
        <section className={styles.deviceCard} aria-labelledby="device-title"><div className={styles.deviceTop}><span><Smartphone size={23} aria-hidden="true"/></span><span className={styles.deviceStatus} data-enabled={subscribed}>{subscribed ? txt('مفعّلة', 'Enabled') : txt('غير مفعّلة', 'Not enabled')}</span></div><h2 id="device-title">{txt('تنبيهات جهازك', 'Device notifications')}</h2><p>{txt('خليك قريب من مستجداتك، حتى لما تكون خارج المنصة.', 'Stay in touch with your updates, even when you’re away from the platform.')}</p><button type="button" className={subscribed ? styles.secondary : styles.primary} disabled={busy || (!subscribed && (!supported || !configured || permission === 'denied'))} onClick={subscribed ? unsubscribe : subscribe}>{subscribed ? <BellOff size={17}/> : <BellRing size={17}/>}{subscribed ? txt('إيقاف على هذا الجهاز', 'Turn off on this device') : txt('تفعيل الإشعارات', 'Enable notifications')}</button>
          <div className={styles.deviceNote}>{!supported ? txt('بعض المتصفحات لا تدعم تنبيهات الجهاز. على iPhone، ثبّت التطبيق من Safari وافتحه من الشاشة الرئيسية.', 'Some browsers do not support device notifications. On iPhone, install from Safari and open from your Home Screen.') : !configured ? txt('تنبيهات الجهاز غير مهيأة حاليًا. إشعاراتك تظل متاحة في هذه الصفحة.', 'Device push is not configured yet. Your updates remain available on this page.') : permission === 'denied' ? txt('الإشعارات محظورة لهذا الموقع. يمكنك تعديل الإذن من إعدادات المتصفح.', 'Notifications are blocked for this site. You can change permission in browser settings.') : subscribed ? txt('التفعيل خاص بهذا الجهاز، ويمكنك إيقافه في أي وقت.', 'This setting applies to this device. You can turn it off at any time.') : txt('لن نطلب إذن المتصفح إلا عندما تختار التفعيل.', 'Browser permission is requested only when you choose to enable alerts.')}</div>{message && <p className={styles.deviceMessage} role="status">{message}</p>}
        </section>
        <section className={styles.shortcuts} aria-labelledby="shortcuts-title"><p className={styles.eyebrow}>{txt('كمّل من مساحتك', 'BACK TO YOUR LEARNING')}</p><h2 id="shortcuts-title">{txt('خطوتك التالية', 'Your next step')}</h2><Link href="/calendar"><span><CalendarDays size={19} aria-hidden="true"/></span><div><strong>{txt('جدولك الدراسي', 'Your calendar')}</strong><small>{txt('راجع المواعيد المتاحة لك', 'Check your upcoming dates')}</small></div><ArrowUpRight size={16} aria-hidden="true"/></Link><Link href="/courses"><span><BookOpen size={19} aria-hidden="true"/></span><div><strong>{txt('مقرراتك', 'Your courses')}</strong><small>{txt('ارجع للدروس وكمّل تعلّمك', 'Pick up your learning')}</small></div><ArrowUpRight size={16} aria-hidden="true"/></Link></section>
      </aside>
    </div>
  </div></DashboardLayout>;
}
