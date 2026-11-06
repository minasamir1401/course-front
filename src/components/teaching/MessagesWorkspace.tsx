'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatEgyptDateTime } from '@/lib/egyptTime';
import { teachingRequest } from '@/lib/teachingClient';
import { useTeachingData } from './useTeachingData';
import styles from './TeachingWorkspace.module.css';

export default function MessagesWorkspace({ staff = false }: { staff?: boolean }) {
  const params = useSearchParams(), { language } = useLanguage(), ar = language === 'ar';
  const [reload, setReload] = useState(0), [page, setPage] = useState(1), [peer, setPeer] = useState(params.get('studentId') || ''), [body, setBody] = useState('');
  const [search, setSearch] = useState(''), [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false), [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const { data: session } = useTeachingData('/auth/me');
  const { data: inbox, error: loadError, loading } = useTeachingData('/messages?page=' + page, reload);
  const { data: roster } = useTeachingData(staff ? '/teaching/overview?limit=100&search=' + encodeURIComponent(search) : '');
  const { data: profile } = useTeachingData(staff && peer ? '/teaching/students/' + encodeURIComponent(peer) : '');
  const peers = new Map<string, string>();
  for (const message of inbox?.items || []) { const person = message.sender.id === session?.user?.id ? message.recipient : message.sender; peers.set(person.id, person.name); }
  for (const student of roster?.students || []) peers.set(student.id, student.name);
  if (profile?.profile) peers.set(profile.profile.id, profile.profile.name);
  async function read(id: string) { try { await teachingRequest('/messages/' + id + '/read', { method: 'PATCH' }); setReload(value => value + 1); } catch (cause: any) { setError(cause.message); } }
  return <DashboardLayout><div className={styles.page} dir={ar ? 'rtl' : 'ltr'}>
    <header className={styles.hero}><div><p className={styles.eyebrow}>{ar ? 'التواصل والتوجيه داخل المنصة' : 'Guidance & communication'}</p><h1>{ar ? 'الرسائل' : 'Messages'}</h1><p className={styles.muted}>{ar ? 'رسائل خاصة بين الطالب والمعلم المسموح له بمتابعته.' : 'Private messages between students and their permitted teaching staff.'}</p></div><div className={styles.actions}><button className={styles.button} onClick={() => setReload(value => value + 1)}>{ar ? 'تحديث الرسائل' : 'Refresh messages'}</button><Link className={styles.button} href={staff ? '/school-admin/follow-up' : '/dashboard'}>{ar ? 'العودة' : 'Back'}</Link></div></header>
    {(error || loadError) && <p role="alert" className={styles.error}>{error || loadError}</p>}{notice && <p role="status" className={styles.success}>{notice}</p>}
    <div className={styles.split}><section className={styles.panel}><h2>{ar ? 'المحادثات والرسائل الأخيرة' : 'Recent messages'} <span className={styles.badge}>{inbox?.unread || 0} {ar ? 'غير مقروءة' : 'unread'}</span></h2>
      {loading && <p role="status">{ar ? 'جارٍ التحميل…' : 'Loading…'}</p>}
      <div className={styles.stack}>{inbox?.items.map((message: any) => {
        const incoming = message.recipientId === session?.user?.id, person = incoming ? message.sender : message.recipient;
        return <article className={`${styles.message} ${incoming && !message.readAt ? styles.unread : ''}`} key={message.id}><strong>{incoming ? ar ? 'من ' : 'From ' : ar ? 'إلى ' : 'To '}{person.name}</strong><small className={styles.muted}>{formatEgyptDateTime(message.createdAt, language)} · {message.readAt ? ar ? 'مقروءة' : 'Read' : ar ? 'لم تُقرأ بعد' : 'Not yet read'}</small><p>{message.body}</p><div className={styles.actions}><button className={styles.button} onClick={() => { setPeer(person.id); setNotice(''); setError(''); }}>{ar ? 'كتابة رد' : 'Reply'}</button>{incoming && !message.readAt && <button className={styles.button} onClick={() => read(message.id)}>{ar ? 'تعليم كمقروءة' : 'Mark as read'}</button>}</div></article>;
      })}</div>{inbox && !inbox.items.length && <p className={styles.empty}>{ar ? 'لا توجد رسائل بعد. ستظهر هنا الرسائل الجديدة.' : 'No messages yet. New messages will appear here.'}</p>}
      {inbox?.pagination.pages > 1 && <div className={styles.pagination}><button className={styles.button} disabled={page <= 1} onClick={() => setPage(value => value - 1)}>{ar ? 'السابق' : 'Previous'}</button><span>{page} / {inbox.pagination.pages}</span><button className={styles.button} disabled={page >= inbox.pagination.pages} onClick={() => setPage(value => value + 1)}>{ar ? 'التالي' : 'Next'}</button></div>}
    </section><section className={styles.panel}><h2>{ar ? 'إرسال رسالة' : 'Send a message'}</h2><form className={styles.stack} onSubmit={async event => {
      event.preventDefault(); setBusy(true); setError(''); setNotice('');
      try { await teachingRequest('/messages', { method: 'POST', body: JSON.stringify({ recipientIds: [peer], body, requestId }) }); setBody(''); setRequestId(crypto.randomUUID()); setReload(value => value + 1); setNotice(ar ? 'تم إرسال الرسالة' : 'Message sent'); }
      catch (cause: any) { setError(cause.message); } finally { setBusy(false); }
    }}>
      {staff && <label className={styles.field}>{ar ? 'البحث في الطلاب' : 'Find a student'}<input type="search" value={search} onChange={event => setSearch(event.target.value)}/></label>}
      <label className={styles.field}>{ar ? 'المستلم' : 'Recipient'}<select required value={peer} onChange={event => { setPeer(event.target.value); setRequestId(crypto.randomUUID()); }}><option value="">{ar ? 'اختر المستلم' : 'Choose recipient'}</option>{[...peers.entries()].map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      {!staff && !peers.size && <p className={styles.muted}>{ar ? 'تقدر ترد على معلمك عندما يصلك توجيه منه.' : 'You can reply when your teacher sends you guidance.'}</p>}
      <label className={styles.field}>{ar ? 'نص الرسالة' : 'Message'}<textarea required maxLength={4000} value={body} onChange={event => setBody(event.target.value)}/></label><button className={`${styles.button} ${styles.primary}`} disabled={busy || !peer}>{busy ? ar ? 'جارٍ الإرسال…' : 'Sending…' : ar ? 'إرسال الرسالة' : 'Send message'}</button>
    </form></section></div>
  </div></DashboardLayout>;
}
