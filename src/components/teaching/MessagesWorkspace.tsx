'use client';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Bell, CalendarDays, Check, CheckCheck, ChevronDown, MessageCircle, MoreVertical, Plus, RefreshCw, Search, Send, Star, User, Users, X } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { egyptDay, formatEgyptDate } from '@/lib/egyptTime';
import { teachingRequest } from '@/lib/teachingClient';
import { useTeachingData } from './useTeachingData';
import styles from './MessagesWorkspace.module.css';

type Person = { id: string; name: string; grade?: string | null };
type Message = { id: string; senderId: string; recipientId: string; sender: Person; recipient: Person; body: string; createdAt: string; readAt: string | null };
type Inbox = { items: Message[]; unread: number; pagination: { pages: number } };
type Conversation = { person: Person; last?: Message; unread: number };
type Filter = 'all' | 'unread' | 'starred';

function Avatar({ person }: { person?: Person }) {
  const initials = person?.name.match(/[\p{L}\p{N}]+/gu)?.slice(0, 2).map(word => Array.from(word)[0]).join('');
  const tone = person ? Array.from(person.id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4 : 0;
  return <span className={styles.avatar} data-tone={tone} aria-hidden="true">{initials || <MessageCircle size={19} />}</span>;
}

function errorText(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function MessagesWorkspace({ staff = false }: { staff?: boolean }) {
  const params = useSearchParams();
  const { language } = useLanguage();
  const ar = language === 'ar';
  const t = (arabic: string, english: string) => ar ? arabic : english;
  const [reload, setReload] = useState(0);
  const [page, setPage] = useState(1);
  const [peer, setPeer] = useState(params.get('studentId') || '');
  const [threadPage, setThreadPage] = useState(1);
  const [body, setBody] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [newChat, setNewChat] = useState(false);
  const [starredState, setStarredState] = useState<{ owner: string; ids: string[] }>();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [requestId, setRequestId] = useState('');
  const thread = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDetailsElement>(null);
  const rosterSearch = useRef<HTMLInputElement>(null);
  const { data: session } = useTeachingData('/auth/me');
  const myId: string = session?.user?.id || '';
  const { data: inboxData, error: loadError, loading } = useTeachingData('/messages?page=' + page, reload);
  const inbox = inboxData as Inbox | undefined;
  const { data: roster, loading: rosterLoading, error: rosterError } = useTeachingData(staff && newChat ? '/teaching/overview?limit=100&search=' + encodeURIComponent(search) : '');
  const { data: profileData } = useTeachingData(staff && peer ? '/teaching/students/' + encodeURIComponent(peer) : '');
  const profile = profileData?.profile as Person | undefined;
  const starKey = myId ? 'klevro-message-stars:' + myId : '';
  const starred = starredState?.owner === myId ? starredState.ids : [];

  useEffect(() => {
    if (!starKey) return;
    // This preference belongs to this signed-in account on this browser.
    let ids: string[] = [];
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(starKey) || '[]');
      if (Array.isArray(stored)) ids = stored.filter((id): id is string => typeof id === 'string');
    } catch {}
    setStarredState({ owner: myId, ids });
  }, [myId, starKey]);
  useEffect(() => { if (newChat) rosterSearch.current?.focus(); }, [newChat]);

  const conversations = useMemo(() => {
    const results = new Map<string, Conversation>();
    if (!myId) return results;
    for (const message of inbox?.items || []) {
      const person = message.senderId === myId ? message.recipient : message.sender;
      if (!person?.id) continue;
      const existing = results.get(person.id);
      const unread = message.recipientId === myId && !message.readAt ? 1 : 0;
      if (existing) existing.unread += unread;
      else results.set(person.id, { person, last: message, unread });
    }
    return results;
  }, [inbox, myId]);
  const activeId = peer || conversations.keys().next().value || '';
  const { data: threadData, loading: threadLoading, error: threadError } = useTeachingData(activeId ? '/messages?peerId=' + encodeURIComponent(activeId) + '&page=' + threadPage : '', reload);
  const activeThread = threadData as Inbox | undefined;
  const messages = useMemo(() => (activeThread?.items || []).filter(message =>
    (message.senderId === myId && message.recipientId === activeId) || (message.recipientId === myId && message.senderId === activeId)
  ).slice().reverse(), [activeThread, activeId, myId]);
  const active = conversations.get(activeId)?.person || profile
    || (messages[0] ? (messages[0].senderId === myId ? messages[0].recipient : messages[0].sender) : undefined);
  const [chosen, setChosen] = useState<Person>();
  const activePerson = chosen?.id === activeId ? { ...chosen, ...active } : active;
  const activeGrade = profile?.id === activeId ? profile.grade || activePerson?.grade : activePerson?.grade;

  useEffect(() => {
    if (thread.current && !threadLoading) thread.current.scrollTop = threadPage === 1 ? thread.current.scrollHeight : 0;
  }, [threadPage, messages, threadLoading]);

  const query = search.trim().toLocaleLowerCase();
  const filtered = Array.from(conversations.values()).filter(({ person, last, unread }) =>
    (filter === 'all' || (filter === 'unread' ? unread > 0 : starred.includes(person.id)))
    && (!query || person.name.toLocaleLowerCase().includes(query) || last?.body.toLocaleLowerCase().includes(query))
  );
  const students = (roster?.students || []) as Person[];
  const labelDate = (value: string) => egyptDay(value) === egyptDay() ? t('اليوم', 'Today') : formatEgyptDate(value, language, { weekday: 'short' });
  const labelTime = (value: string) => new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en-GB', { timeStyle: 'short', timeZone: 'Africa/Cairo' }).format(new Date(value));

  function select(person: Person) {
    if (busy) return;
    setChosen(person);
    setPeer(person.id);
    setThreadPage(1);
    setRequestId('');
    setBody('');
    setNotice('');
    setError('');
    setNewChat(false);
    if (newChat) { setSearch(''); setFilter('all'); }
    if (menu.current) menu.current.open = false;
  }

  function toggleStar() {
    if (!activeId || !starKey) return;
    const ids = starred.includes(activeId) ? starred.filter(id => id !== activeId) : [...starred, activeId];
    setStarredState({ owner: myId, ids });
    try { localStorage.setItem(starKey, JSON.stringify(ids)); } catch {}
    if (menu.current) menu.current.open = false;
  }

  async function read(ids: string[]) {
    if (!ids.length) return;
    setPeer(activeId);
    setBusy(true);
    setError('');
    if (menu.current) menu.current.open = false;
    try {
      for (const id of ids) await teachingRequest('/messages/' + encodeURIComponent(id) + '/read', { method: 'PATCH' });
    } catch (cause) {
      setError(errorText(cause, t('تعذر تحديث الرسالة.', 'Could not update the message.')));
    } finally {
      setBusy(false);
      setReload(value => value + 1);
    }
  }
  const unreadIds = messages.filter(message => message.recipientId === myId && !message.readAt).map(message => message.id);
  const nav = [
    { href: '/school-admin/follow-up', label: t('الطلاب والدروس', 'Students & lessons'), icon: Users },
    { href: '/school-admin/schedule', label: t('الجدول والتقويم', 'Schedule & calendar'), icon: CalendarDays },
    { href: '/school-admin/messages', label: t('المحادثات والرسائل', 'Chat & messages'), icon: MessageCircle },
    { href: '/school-admin/reminders', label: t('التنبيهات والتذكيرات', 'Notices & reminders'), icon: Bell },
  ];

  return <DashboardLayout>
    <div className={styles.page} dir={ar ? 'rtl' : 'ltr'}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>{t('التواصل والتوجيه المباشر', 'Direct chat & guidance')}</p>
          <h1>{t('الرسائل', 'Messages')}</h1>
          <p>{staff ? t('تابع محادثاتك مع الطلاب وقدّم لهم التوجيه والدعم.', 'Manage conversations with students and follow up on their progress.') : t('تواصل مع معلميك وتابع رسائلك في مكان واحد.', 'Keep up with your teachers and their guidance in one place.')}</p>
        </div>
      </header>

      {staff && <nav className={styles.nav} aria-label={t('متابعة المعلم', 'Teacher follow-up')}>
        {nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={href.endsWith('/messages') ? 'page' : undefined}><Icon size={19} aria-hidden="true" />{label}</Link>)}
      </nav>}
      {(error || loadError || threadError) && <p role="alert" className={styles.error}>{error || loadError || threadError}</p>}
      {notice && <p role="status" className="sr-only">{notice}</p>}

      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label={t('قائمة المحادثات', 'Conversation list')}>
          <div className={styles.sidebarHead}>
            <div className={styles.sidebarTitle}>
              <h2>{newChat ? t('اختيار طالب', 'Choose a student') : t('المحادثات', 'Conversations')}</h2>
              {!newChat && <span className={styles.count}>{conversations.size}</span>}
              {staff && <button type="button" className={newChat ? styles.iconButton : styles.primary} onClick={() => { setNewChat(value => !value); setSearch(''); }} aria-label={newChat ? t('إغلاق اختيار الطالب', 'Close student picker') : undefined}>
                {newChat ? <X size={18} /> : <><Plus size={17} aria-hidden="true" />{t('محادثة جديدة', 'New chat')}</>}
              </button>}
            </div>
            <label className={styles.search}>
              <Search size={18} aria-hidden="true" />
              <input ref={rosterSearch} type="search" aria-label={newChat ? t('البحث عن طالب', 'Search for a student') : t('البحث في المحادثات', 'Search conversations')} placeholder={t('ابحث بالاسم…', 'Search by name…')} value={search} onChange={event => setSearch(event.target.value)} />
            </label>
            {!newChat && <div className={styles.filters} role="group" aria-label={t('تصفية المحادثات', 'Filter conversations')}>
              <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>{t('الكل', 'All')}</button>
              <button type="button" aria-pressed={filter === 'unread'} onClick={() => setFilter('unread')}>{t('غير مقروءة', 'Unread')}{!!inbox?.unread && <span>{inbox.unread}</span>}</button>
              <button type="button" aria-pressed={filter === 'starred'} onClick={() => setFilter('starred')}><Star size={15} aria-hidden="true" />{t('المفضلة', 'Starred')}</button>
            </div>}
          </div>
          <div className={styles.contacts}>
            {newChat ? <>
              {rosterLoading && <p role="status" className={styles.empty}>{t('جارٍ تحميل الطلاب…', 'Loading students…')}</p>}
              {rosterError && <p role="alert" className={styles.empty}>{rosterError}</p>}
              {students.map(person => <button key={person.id} className={styles.contact} type="button" onClick={() => select(person)}><Avatar person={person} /><span className={styles.contactText}><strong>{person.name}</strong><small>{person.grade || t('بدء محادثة', 'Start a conversation')}</small></span></button>)}
              {!rosterLoading && !rosterError && !students.length && <p className={styles.empty}>{t('لا يوجد طلاب يطابقون البحث.', 'No students match your search.')}</p>}
            </> : <>
              {filtered.map(({ person, last, unread }) => <button key={person.id} className={styles.contact} type="button" aria-pressed={person.id === activeId} onClick={() => { if (person.id !== activeId) select(person); }}>
                <Avatar person={person} />
                <span className={styles.contactText}><strong>{person.name}</strong><small dir="auto">{last?.body}</small></span>
                <span className={styles.contactMeta}>
                  {last && <time dateTime={last.createdAt}>{egyptDay(last.createdAt) === egyptDay() ? labelTime(last.createdAt) : formatEgyptDate(last.createdAt, language, { year: undefined })}</time>}
                  {unread > 0 ? <span className={styles.unread}>{unread}<span className="sr-only"> {t('غير مقروءة', 'unread')}</span></span> : starred.includes(person.id) ? <Star className={styles.star} size={15} aria-label={t('مفضلة', 'Starred')} /> : null}
                </span>
              </button>)}
              {!filtered.length && <p className={styles.empty} role={loading ? 'status' : undefined}>{loading ? t('جارٍ تحميل المحادثات…', 'Loading conversations…') : t('لا توجد محادثات هنا.', 'No conversations here.')}</p>}
            </>}
          </div>
          {!newChat && !!inbox?.pagination && inbox.pagination.pages > 1 && <div className={styles.pagination}>
            <button type="button" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>{t('السابق', 'Previous')}</button>
            <span>{page} / {inbox.pagination.pages}</span>
            <button type="button" disabled={page >= inbox.pagination.pages} onClick={() => setPage(value => value + 1)}>{t('التالي', 'Next')}</button>
          </div>}
        </aside>

        <section className={styles.window} aria-label={t('المحادثة الحالية', 'Active conversation')}>
          <header className={styles.windowHead}>
            <Avatar person={activePerson} />
            <div className={styles.activePerson}>
              <h2>{activePerson?.name || t('محادثة مباشرة', 'Direct conversation')}</h2>
              <p>{activeGrade || (activeId ? t('رسائل خاصة داخل كليفرو', 'Private messages on Klevro') : t('اختر محادثة من القائمة', 'Choose a conversation from the list'))}</p>
            </div>
            <button type="button" className={styles.iconButton} disabled={busy} onClick={() => { if (activeId) setPeer(activeId); setReload(value => value + 1); }} aria-label={t('تحديث الرسائل', 'Refresh messages')} title={t('تحديث الرسائل', 'Refresh messages')}><RefreshCw size={17} /></button>
            {activeId ? <details ref={menu} className={styles.menu} onKeyDown={event => {
              if (event.key === 'Escape' && menu.current?.open) { menu.current.open = false; menu.current.querySelector('summary')?.focus(); }
            }}>
              <summary className={styles.iconButton} aria-label={t('خيارات المحادثة', 'Conversation options')}><MoreVertical size={19} /></summary>
              <div className={styles.menuPanel}>
                <button type="button" onClick={toggleStar}><Star size={17} />{starred.includes(activeId) ? t('إزالة من المفضلة', 'Unstar conversation') : t('إضافة إلى المفضلة', 'Star conversation')}</button>
                {staff && <Link href={'/school-admin/follow-up/students/' + encodeURIComponent(activeId)}><User size={17} />{t('ملف متابعة الطالب', 'Student follow-up')}</Link>}
                {!!unreadIds.length && <button type="button" disabled={busy} onClick={() => void read(unreadIds)}><CheckCheck size={17} />{t('تعليم الرسائل الظاهرة كمقروءة', 'Mark visible messages as read')}</button>}
              </div>
            </details> : <Link className={styles.iconButton} href={staff ? '/school-admin/follow-up' : '/dashboard'} aria-label={t('العودة', 'Back')}><ArrowLeft size={18} /></Link>}
          </header>

          <div className={styles.thread} ref={thread}>
            {threadLoading && <p role="status" className={styles.empty}>{t('جارٍ تحميل المحادثة…', 'Loading conversation…')}</p>}
            {!threadLoading && !!activeThread?.pagination && activeThread.pagination.pages > 1 && <div className={styles.threadPagination}>
              {threadPage < activeThread.pagination.pages && <button type="button" onClick={() => setThreadPage(value => value + 1)}>{t('رسائل أقدم', 'Older messages')}</button>}
              {threadPage > 1 && <button type="button" onClick={() => setThreadPage(value => value - 1)}><ChevronDown size={14} />{t('رسائل أحدث', 'Newer messages')}</button>}
            </div>}
            {messages.map((message, index) => {
              const incoming = message.recipientId === myId;
              const newDay = !index || egyptDay(message.createdAt) !== egyptDay(messages[index - 1].createdAt);
              return <Fragment key={message.id}>
                {newDay && <div className={styles.day}><time dateTime={egyptDay(message.createdAt)}>{labelDate(message.createdAt)}</time></div>}
                <article className={`${styles.message} ${incoming ? styles.incoming : styles.outgoing}`} aria-label={incoming ? message.sender.name : t('أنت', 'You')}>
                  {incoming && <Avatar person={message.sender} />}
                  <div className={styles.messageContent}>
                    <p dir="auto" className={styles.bubble}>{message.body}</p>
                    <div className={styles.messageMeta}>
                      <time dateTime={message.createdAt}>{labelTime(message.createdAt)}</time>
                      {!incoming && (message.readAt ? <CheckCheck size={15} aria-label={t('مقروءة', 'Read')} /> : <Check size={15} aria-label={t('تم الإرسال', 'Sent')} />)}
                      {incoming && !message.readAt && <button type="button" onClick={() => void read([message.id])} disabled={busy}>{t('تعليم كمقروءة', 'Mark as read')}</button>}
                    </div>
                  </div>
                </article>
              </Fragment>;
            })}
            {!threadLoading && !threadError && !messages.length && <div className={styles.threadEmpty}>
              <span><MessageCircle size={29} aria-hidden="true" /></span>
              <h3>{activeId ? t('بداية المحادثة', 'Start the conversation') : t('رسائلك في مكان واحد', 'Your messages in one place')}</h3>
              <p>{activeId ? t('اكتب أول رسالة بالأسفل.', 'Write the first message below.') : t('اختر محادثة لعرض الرسائل هنا.', 'Select a conversation to see its messages here.')}</p>
            </div>}
          </div>

          <form className={styles.composer} onSubmit={async event => {
            event.preventDefault();
            if (!activeId || !body.trim() || busy) return;
            setBusy(true);
            setError('');
            setNotice('');
            const id = requestId || crypto.randomUUID();
            setRequestId(id);
            try {
              await teachingRequest('/messages', { method: 'POST', body: JSON.stringify({ recipientIds: [activeId], body, requestId: id }) });
              setPeer(activeId);
              setBody('');
              setRequestId('');
              setThreadPage(1);
              setPage(1);
              setReload(value => value + 1);
              setNotice(t('تم إرسال الرسالة', 'Message sent'));
            } catch (cause) {
              setError(errorText(cause, t('تعذر إرسال الرسالة.', 'Could not send the message.')));
            } finally {
              setBusy(false);
            }
          }}>
            <textarea rows={1} dir="auto" aria-label={t('نص الرسالة', 'Message')} maxLength={4000} placeholder={t('اكتب رسالتك هنا…', 'Write your message here…')} value={body} disabled={!activeId || busy} onChange={event => { setPeer(activeId); setBody(event.target.value); setRequestId(''); }} />
            <button type="submit" className={styles.send} disabled={!activeId || busy || !body.trim()} aria-label={t('إرسال الرسالة', 'Send message')} title={t('إرسال الرسالة', 'Send message')}><Send size={21} /></button>
          </form>
        </section>
      </div>
    </div>
  </DashboardLayout>;
}
