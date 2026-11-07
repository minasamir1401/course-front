'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { RefreshCw, Send, CheckCheck, User, MessageSquare, ArrowRight } from 'lucide-react';
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

  const myId = session?.user?.id || '';

  const { peers, conversations } = useMemo(() => {
    const peerMap = new Map<string, string>();
    const convMap = new Map<string, { id: string; name: string; lastBody: string; lastAt: string; unread: number; messages: any[] }>();

    for (const message of inbox?.items || []) {
      const incoming = message.recipientId === myId || message.sender?.id !== myId;
      const person = message.sender?.id === myId ? message.recipient : message.sender;
      if (!person?.id) continue;
      peerMap.set(person.id, person.name);
      const existing = convMap.get(person.id);
      const isUnread = incoming && !message.readAt;
      if (!existing) {
        convMap.set(person.id, {
          id: person.id,
          name: person.name,
          lastBody: message.body,
          lastAt: message.createdAt,
          unread: isUnread ? 1 : 0,
          messages: [message],
        });
      } else {
        existing.messages.push(message);
        if (isUnread) existing.unread += 1;
      }
    }

    for (const student of roster?.students || []) {
      peerMap.set(student.id, student.name);
      if (!convMap.has(student.id)) {
        convMap.set(student.id, {
          id: student.id,
          name: student.name,
          lastBody: '',
          lastAt: '',
          unread: 0,
          messages: [],
        });
      }
    }

    if (profile?.profile) {
      peerMap.set(profile.profile.id, profile.profile.name);
      if (!convMap.has(profile.profile.id)) {
        convMap.set(profile.profile.id, {
          id: profile.profile.id,
          name: profile.profile.name,
          lastBody: '',
          lastAt: '',
          unread: 0,
          messages: [],
        });
      }
    }

    const q = search.trim().toLowerCase();
    const list = [...convMap.values()].filter(c => !q || c.name.toLowerCase().includes(q) || c.lastBody.toLowerCase().includes(q));
    return { peers: peerMap, conversations: list };
  }, [inbox?.items, roster?.students, profile?.profile, myId, search]);

  const activePeerId = peer || conversations.find(c => c.messages.length > 0)?.id || conversations[0]?.id || '';
  const activePeerName = (activePeerId && peers.get(activePeerId)) || '';
  const activeMessages = useMemo(() => {
    const all = inbox?.items || [];
    const filtered = activePeerId
      ? all.filter((m: any) => m.sender?.id === activePeerId || m.recipient?.id === activePeerId || m.senderId === activePeerId || m.recipientId === activePeerId)
      : all;
    const list = filtered.length > 0 ? filtered : all;
    return [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [inbox?.items, activePeerId]);

  async function read(id: string) {
    try {
      await teachingRequest('/messages/' + id + '/read', { method: 'PATCH' });
      setReload(value => value + 1);
    } catch (cause: any) {
      setError(cause.message);
    }
  }

  const getInitials = (name: string) => {
    const parts = (name || '').trim().split(/\s+/);
    return parts.slice(0, 2).map(p => p[0] || '').join('').toUpperCase() || 'U';
  };

  return (
    <DashboardLayout>
      <div className={styles.page} dir={ar ? 'rtl' : 'ltr'}>
        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>{ar ? 'التواصل والمحادثات المباشرة' : 'Direct chat & guidance'}</p>
            <h1>{ar ? 'المحادثات والرسائل' : 'Chat & Messages'}</h1>
            <p className={styles.muted}>{ar ? 'تواصل مباشر ومنظم في شكل محادثات بين الطالب والمعلم.' : 'Organized chat threads between students and their teaching staff.'}</p>
          </div>
          <div className={styles.actions}>
            <span className={`${styles.badge} ${inbox?.unread ? styles.warning : styles.good}`}>
              {inbox?.unread || 0} {ar ? 'غير مقروءة' : 'unread'}
            </span>
            <button className={styles.button} onClick={() => setReload(value => value + 1)}>
              <RefreshCw size={15} />
              {ar ? 'تحديث الرسائل' : 'Refresh messages'}
            </button>
            <Link className={styles.button} href={staff ? '/school-admin/follow-up' : '/dashboard'}>
              <ArrowRight size={15} />
              {ar ? 'العودة' : 'Back'}
            </Link>
          </div>
        </header>

        {staff && (
          <nav className={styles.nav} aria-label={ar ? 'متابعة المعلم' : 'Teacher follow-up'}>
            {[
              ['/school-admin/follow-up', ar ? 'الطلاب والدروس' : 'Students & lessons', false],
              ['/school-admin/schedule', ar ? 'الجدول والتقويم' : 'Schedule & calendar', false],
              ['/school-admin/messages', ar ? 'المحادثات والرسائل' : 'Chat & messages', true],
              ['/school-admin/reminders', ar ? 'التنبيهات والتذكيرات' : 'Notices & reminders', false],
            ].map(([href, label, active]) => (
              <Link key={String(href)} href={String(href)} aria-current={active ? 'page' : undefined}>
                {label}
              </Link>
            ))}
          </nav>
        )}

        {(error || loadError) && <p role="alert" className={styles.error}>{error || loadError}</p>}
        {notice && <p role="status" className={styles.success}>{notice}</p>}

        <div className={styles.chatLayout}>
          {/* Conversations Sidebar */}
          <aside className={styles.chatSidebar}>
            <div className={styles.chatSidebarHeader}>
              {staff && (
                <label className={styles.field}>
                  {ar ? 'البحث في الطلاب والمحادثات' : 'Find a student or chat'}
                  <input
                    type="search"
                    placeholder={ar ? 'ابحث بالاسم...' : 'Search by name...'}
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                  />
                </label>
              )}
              <label className={styles.field}>
                {ar ? 'المستلم / المحادثة النشطة' : 'Recipient / Active chat'}
                <select
                  required
                  value={peer || activePeerId}
                  onChange={event => {
                    setPeer(event.target.value);
                    setRequestId(crypto.randomUUID());
                    setNotice('');
                    setError('');
                  }}
                >
                  <option value="">{ar ? 'اختر المستلم' : 'Choose recipient'}</option>
                  {[...peers.entries()].map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className={styles.chatContactList}>
              {conversations.map(conv => {
                const isSelected = conv.id === activePeerId;
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => {
                      setPeer(conv.id);
                      setRequestId(crypto.randomUUID());
                      setNotice('');
                      setError('');
                    }}
                    className={`${styles.chatContactItem} ${isSelected ? styles.chatContactActive : ''}`}
                  >
                    <div className={styles.chatAvatar}>{getInitials(conv.name)}</div>
                    <div className={styles.chatContactMeta}>
                      <div className={styles.chatContactTop}>
                        <strong>{conv.name}</strong>
                        {conv.unread > 0 && (
                          <span className={`${styles.badge} ${styles.primary}`} style={{ padding: '2px 7px', fontSize: 10 }}>
                            {conv.unread}
                          </span>
                        )}
                      </div>
                      <p className={styles.chatContactPreview}>
                        {conv.lastBody || (ar ? 'اضغط لبدء محادثة جديدة' : 'Click to start a conversation')}
                      </p>
                    </div>
                  </button>
                );
              })}
              {!conversations.length && !loading && (
                <p className={styles.empty}>{ar ? 'لا توجد جهات اتصال مطابقة.' : 'No matching contacts.'}</p>
              )}
            </div>

            {inbox?.pagination?.pages > 1 && (
              <div className={styles.pagination} style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0' }}>
                <button className={styles.button} disabled={page <= 1} onClick={() => setPage(value => value - 1)}>
                  {ar ? 'السابق' : 'Previous'}
                </button>
                <span>{page} / {inbox.pagination.pages}</span>
                <button className={styles.button} disabled={page >= inbox.pagination.pages} onClick={() => setPage(value => value + 1)}>
                  {ar ? 'التالي' : 'Next'}
                </button>
              </div>
            )}
          </aside>

          {/* Active Chat Thread Window */}
          <section className={styles.chatWindow}>
            <div className={styles.chatHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className={styles.chatAvatar}>
                  {activePeerName ? getInitials(activePeerName) : <MessageSquare size={18} />}
                </div>
                <div>
                  <h2 style={{ marginBottom: 2, fontSize: 16 }}>
                    {activePeerName || (ar ? 'كل المحادثات' : 'All conversations')}
                  </h2>
                  <p className={styles.muted} style={{ fontSize: 12 }}>
                    {activePeerId
                      ? (ar ? 'محادثة مباشرة ومؤمنة داخل المنصة' : 'Direct private thread')
                      : (ar ? 'اختر محادثة من القائمة الجانبية للرد' : 'Select a conversation from the sidebar to reply')}
                  </p>
                </div>
              </div>
              {staff && activePeerId && (
                <Link className={styles.button} href={`/school-admin/follow-up/students/${encodeURIComponent(activePeerId)}`}>
                  <User size={15} />
                  {ar ? 'ملف متابعة الطالب' : 'Student follow-up'}
                </Link>
              )}
            </div>

            <div className={styles.chatThread}>
              {loading && <p role="status" className={styles.empty}>{ar ? 'جارٍ تحميل المحادثة…' : 'Loading conversation…'}</p>}
              {activeMessages.map((message: any) => {
                const incoming = message.recipientId === myId || (myId && message.sender?.id !== myId);
                const person = incoming ? message.sender : message.recipient;
                return (
                  <article
                    key={message.id}
                    className={`${styles.chatBubbleRow} ${incoming ? styles.chatBubbleTheirs : styles.chatBubbleMine} ${incoming && !message.readAt ? styles.unread : ''}`}
                  >
                    <div className={styles.chatBubbleCard}>
                      <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 4, opacity: incoming ? 0.75 : 0.9 }}>
                        {incoming ? `${ar ? 'من' : 'From'} ${person?.name || ''}` : `${ar ? 'أنت إلى' : 'You to'} ${person?.name || ''}`}
                      </div>
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{message.body}</p>
                    </div>
                    <div className={styles.chatBubbleMeta}>
                      <span>{formatEgyptDateTime(message.createdAt, language)}</span>
                      <span>·</span>
                      <span>
                        <CheckCheck size={13} style={{ display: 'inline', verticalAlign: 'middle', marginInlineEnd: 3 }} />
                        {message.readAt ? (ar ? 'مقروءة' : 'Read') : (ar ? 'لم تُقرأ بعد' : 'Unread')}
                      </span>
                      {incoming && !message.readAt && (
                        <button
                          type="button"
                          className={styles.button}
                          style={{ padding: '2px 8px', fontSize: 11, borderRadius: 8 }}
                          onClick={() => void read(message.id)}
                        >
                          {ar ? 'تعليم كمقروءة' : 'Mark as read'}
                        </button>
                      )}
                      {person?.id && peer !== person.id && (
                        <button
                          type="button"
                          className={styles.button}
                          style={{ padding: '2px 8px', fontSize: 11, borderRadius: 8 }}
                          onClick={() => { setPeer(person.id); setNotice(''); setError(''); }}
                        >
                          {ar ? 'كتابة رد' : 'Reply'}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}

              {inbox && !activeMessages.length && (
                <div className={styles.empty}>
                  <p>{ar ? 'لا توجد رسائل في هذه المحادثة بعد. ابدأ بإرسال أول رسالة بالأسفل.' : 'No messages in this conversation yet. Send the first message below.'}</p>
                </div>
              )}
            </div>

            <form
              className={styles.chatComposerBar}
              onSubmit={async event => {
                event.preventDefault();
                const targetRecipient = peer || activePeerId;
                if (!targetRecipient) return;
                setBusy(true);
                setError('');
                setNotice('');
                try {
                  await teachingRequest('/messages', {
                    method: 'POST',
                    body: JSON.stringify({ recipientIds: [targetRecipient], body, requestId }),
                  });
                  setBody('');
                  setRequestId(crypto.randomUUID());
                  setReload(value => value + 1);
                  setNotice(ar ? 'تم إرسال الرسالة' : 'Message sent');
                } catch (cause: any) {
                  setError(cause.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {!staff && !peers.size && (
                <p className={styles.muted}>{ar ? 'تقدر ترد على معلمك عندما يصلك توجيه منه.' : 'You can reply when your teacher sends you guidance.'}</p>
              )}
              <div className={styles.chatComposerRow}>
                <label className={styles.field} style={{ margin: 0 }}>
                  <span className="sr-only">{ar ? 'نص الرسالة' : 'Message'}</span>
                  <textarea
                    required
                    maxLength={4000}
                    placeholder={ar ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                    value={body}
                    onChange={event => setBody(event.target.value)}
                  />
                </label>
                <button
                  type="submit"
                  className={`${styles.button} ${styles.primary}`}
                  style={{ minHeight: 54, paddingInline: 22 }}
                  disabled={busy || !(peer || activePeerId)}
                >
                  <Send size={16} />
                  <span>{busy ? (ar ? 'جارٍ الإرسال…' : 'Sending…') : (ar ? 'إرسال الرسالة' : 'Send message')}</span>
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
