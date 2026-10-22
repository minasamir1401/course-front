'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trophy, Users, Clock3, Play, Award, Volume2, Sparkles, ShieldCheck, Search, SlidersHorizontal, ArrowUpRight, RefreshCw, BookOpen, ClipboardCheck, CircleCheck, Flag, Radio, X } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import LearningBackdrop from '@/components/student/LearningBackdrop';
import { useLanguage } from '@/contexts/LanguageContext';
import { checkAuthSession } from '@/lib/auth';
import { competitionError, competitionRequest } from './api';
import Leaderboard from './Leaderboard';
import styles from './CompetitionHub.module.css';

type Competition = {
  id: string; title: string; titleEn?: string; description?: string; descriptionEn?: string; mode: string; status: string;
  teams: boolean; questionCount: number; participants: number; capacity: number; sourceKind: string;
  schoolName?: string; opensAt?: string | null; closesAt?: string | null; prizeLabel?: string | null;
  myEntry?: { score: number; finishedAt?: string | null } | null;
};
type Policy = { enabled: boolean; sound?: boolean; motion?: boolean };
type RoomState = 'available' | 'upcoming' | 'finished' | 'full';
const categories = ['', 'COURSE', 'EXAM', 'ACTIVITY'];
function roomState(room: Competition, now: number): RoomState {
  if (room.status === 'FINISHED' || room.myEntry?.finishedAt || (room.closesAt && new Date(room.closesAt).getTime() <= now)) return 'finished';
  if (room.opensAt && new Date(room.opensAt).getTime() > now) return 'upcoming';
  if (!room.myEntry && room.participants >= room.capacity) return 'full';
  return 'available';
}

export default function CompetitionHub() {
  const { language } = useLanguage(); const ar = language === 'ar'; const router = useRouter(); const query = useSearchParams();
  const rawSource = query.get('sourceKind') || ''; const sourceKind = categories.includes(rawSource) ? rawSource : '';
  const [items, setItems] = useState<Competition[]>([]);
  const [profile, setProfile] = useState({ sound: true, motion: true, publicName: false });
  const changedPreferences = useRef<Partial<typeof profile>>({});
  const changePreference = (field: keyof typeof profile, value: boolean) => {
    changedPreferences.current[field] = value;
    setProfile(previous => ({ ...previous, [field]: value }));
  };
  const [policy, setPolicy] = useState<Policy>({ enabled: true });
  const [error, setError] = useState(''); const [preferenceError, setPreferenceError] = useState(''); const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true); const [ready, setReady] = useState(false); const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState(''); const [status, setStatus] = useState('all'); const [now, setNow] = useState(() => Date.now());
  const text = (a: string, e: string) => ar ? a : e;
  const number = (value: number) => value.toLocaleString(ar ? 'ar-EG' : 'en-GB');
  const load = useCallback(async () => {
    setLoading(true); setError(''); setReady(false); setItems([]);
    try {
      const session = await checkAuthSession();
      if (!session.authenticated) { router.replace('/login'); return; }
      if (['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(session.user.role)) { router.replace((session.user.role === 'SUPER_ADMIN' ? '/super-admin' : '/school-admin') + '/competitions'); return; }
      if (session.user.role !== 'STUDENT') { setError(ar ? 'المشاركة في المنافسات متاحة لحساب الطالب.' : 'Use a student account to participate.'); return; }
      const [list, settings] = await Promise.all([competitionRequest('?sourceKind=' + encodeURIComponent(sourceKind)), competitionRequest('/profile')]);
      setItems(list.items); setPolicy(list.policy); setProfile(settings.profile); changedPreferences.current = {}; setReady(true); setNow(Date.now());
    } catch (e) { setError(competitionError((e as Error).message, ar)); }
    finally { setLoading(false); }
  }, [ar, router, sourceKind]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  const save = async () => {
    setBusy(true); setMessage(''); setPreferenceError('');
    try { if (Object.keys(changedPreferences.current).length) await competitionRequest('/profile', changedPreferences.current, 'PUT'); changedPreferences.current = {}; setMessage(ar ? 'تم حفظ تفضيلاتك.' : 'Your preferences were saved.'); }
    catch (e) { setPreferenceError(competitionError((e as Error).message, ar)); }
    finally { setBusy(false); }
  };
  const title = (room: Competition) => ar ? room.title : room.titleEn || room.title;
  const searchText = search.trim().toLocaleLowerCase();
  const filtered = items.filter(room => (!searchText || [room.title, room.titleEn, room.description, room.schoolName].filter(Boolean).join(' ').toLocaleLowerCase().includes(searchText)) && (status === 'all' || roomState(room, now) === status));
  const stateLabels = {
    available: text('متاحة الآن', 'Available now'), upcoming: text('تبدأ قريبًا', 'Upcoming'),
    finished: text('انتهت المشاركة', 'Participation ended'), full: text('اكتمل العدد', 'Full'),
  };
  const categoryLabels = [text('كل المسابقات', 'All competitions'), text('المقررات', 'Courses'), text('الامتحانات', 'Exams'), text('الأنشطة', 'Activities')];
  const metrics = [
    { label: text('المسابقات المعروضة', 'Listed competitions'), value: items.length, icon: Flag, tone: 'purple' },
    { label: text('شاركت بها', 'Joined competitions'), value: items.filter(room => room.myEntry).length, icon: Users, tone: 'cyan' },
    { label: text('أكملتها', 'Completed competitions'), value: items.filter(room => room.myEntry?.finishedAt).length, icon: CircleCheck, tone: 'gold' },
  ];
  return <DashboardLayout mainClassName={styles.main}><div className={styles.page} dir={ar ? 'rtl' : 'ltr'}>
    <LearningBackdrop/>
    <section className={styles.hero} aria-labelledby="competition-title">
      <div className={styles.heroCopy}><span className={styles.eyebrow}><Sparkles size={16}/>{text('مساحتك للتحدي والإنجاز', 'A little challenge. A new achievement.')}</span>
        <h1 id="competition-title">{text('المسابقات والتحديات', 'Competitions & challenges')}</h1>
        <p>{text('تعلّم، نافس، واحتفل بتقدّمك. اختر تحدّيك القادم وشارك زملاءك متعة الوصول للإجابة.', 'Learn, compete and celebrate your progress. Find your next challenge and enjoy discovering the answers together.')}</p>
        <div className={styles.heroActions}><a className={styles.primary} href="#competition-list"><Play size={16}/>{text('اكتشف المسابقات', 'Explore competitions')}</a><a className={styles.secondary} href="#competition-rankings"><Trophy size={17}/>{text('لوحة المتصدرين', 'Leaderboard')}</a></div>
      </div>
      <div className={styles.heroArt} aria-hidden="true"><Image src="/klevro/illustrations/dashboard-education.png" alt="" width={1680} height={960} priority sizes="(max-width:600px) 240px, 360px"/><span className={styles.artBadge}><Trophy size={23}/><span>{text('كل تحدٍّ… خطوة لقدّام', 'Every challenge is a step forward')}</span></span></div>
    </section>
    <section className={styles.metrics} aria-label={text('ملخص المسابقات في التصنيف المختار', 'Competition summary for the selected category')} aria-busy={loading}>
      {metrics.map(metric => <article className={styles.metric} key={metric.tone}><span className={styles.metricIcon} data-tone={metric.tone}><metric.icon size={24}/></span><div><h2>{metric.label}</h2><strong>{ready ? number(metric.value) : '—'}</strong><p>{text('ضمن التصنيف المختار', 'In the selected category')}</p></div><span className={styles.metricAccent} aria-hidden="true"/></article>)}
    </section>
    <div className={styles.workspace}>
      <section id="competition-list" className={styles.challenges} aria-labelledby="challenges-heading">
        <div className={styles.sectionHeading}><div><span className={styles.headingIcon}><Flag size={20}/></span><h2 id="challenges-heading">{text('اختر تحدّيك القادم', 'Choose your next challenge')}</h2></div><button className={styles.refresh} onClick={() => void load()} disabled={loading} aria-label={text('تحديث المسابقات', 'Refresh competitions')}><RefreshCw size={18}/></button></div>
        <div className={styles.filters}>
          <nav className={styles.categories} aria-label={text('تصنيف المسابقات', 'Competition categories')}>{categories.map((value, index) => <Link key={value} href={'/competitions' + (value ? '?sourceKind=' + value : '')} aria-current={value === sourceKind ? 'page' : undefined}>{categoryLabels[index]}</Link>)}</nav>
          <div className={styles.filterInputs}><label className={styles.search}><Search size={18}/><span className="sr-only">{text('ابحث عن مسابقة', 'Search competitions')}</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={text('ابحث عن مسابقة أو مدرسة…', 'Search competitions or schools…')}/>{search && <button aria-label={text('مسح البحث', 'Clear search')} onClick={() => setSearch('')}><X size={16}/></button>}</label>
            <label className={styles.statusFilter}><SlidersHorizontal size={16}/><span className="sr-only">{text('حالة المسابقة', 'Competition status')}</span><select value={status} onChange={event => setStatus(event.target.value)}><option value="all">{text('كل الحالات', 'All statuses')}</option>{Object.entries(stateLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          </div>
        </div>
        {error && <div role="alert" className={styles.error}><p>{error}</p><button className={styles.secondary} onClick={() => void load()}>{text('إعادة المحاولة', 'Retry')}</button></div>}
        {loading ? <div className={styles.loading} role="status"><RefreshCw size={22}/>{text('جارٍ تحميل المسابقات…', 'Loading competitions…')}</div> : ready && (!policy.enabled || !items.length || !filtered.length) ? <div className={styles.empty}><span className={styles.emptyIcon}>{!policy.enabled ? <ShieldCheck size={34}/> : search || status !== 'all' ? <Search size={34}/> : <Trophy size={34}/>}</span>
          <h3>{!policy.enabled ? text('المسابقات متوقفة حاليًا', 'Competitions are currently paused') : !items.length ? text('تحدّيك القادم يبدأ من هنا', 'Your next challenge starts here') : text('لا توجد نتائج مطابقة', 'No matching competitions')}</h3>
          <p>{!policy.enabled ? text('ستظهر المسابقات عند تفعيلها من الإدارة.', 'Competitions will appear when administration enables them.') : !items.length ? text('لا توجد مسابقات متاحة لك حتى الآن. ستجدها هنا بمجرد نشرها من الإدارة.', 'No competitions are available yet. They will appear here when an admin publishes them.') : text('جرّب كلمة أخرى أو غيّر حالة المسابقة.', 'Try another search or change the status filter.')}</p>
          {!!items.length && policy.enabled && <button className={styles.secondary} onClick={() => { setSearch(''); setStatus('all'); }}>{text('مسح الفلاتر', 'Clear filters')}</button>}
        </div> : ready && <><p className={styles.resultCount}>{number(filtered.length)} {text('مسابقة في هذا التصنيف', 'competitions in this category')}</p><div className={styles.cards}>{filtered.map(room => {
          const state = roomState(room, now); const completed = room.status === 'FINISHED' || !!room.myEntry?.finishedAt;
          const SourceIcon = room.sourceKind.includes('EXAM') ? ClipboardCheck : room.sourceKind === 'COURSE' ? BookOpen : room.sourceKind.includes('ACTIVITY') || room.sourceKind === 'CONTENT_SKILLS' ? Sparkles : Trophy;
          return <article className={styles.competition} key={room.id}>
            <div className={styles.cardTop}><span className={styles.sourceIcon} data-kind={room.sourceKind}><SourceIcon size={30}/></span><span className={styles.state} data-state={state}><span/>{stateLabels[state]}</span></div>
            <p className={styles.school}><bdi>{room.schoolName || 'Klevro'}</bdi></p><h3><bdi>{title(room)}</bdi></h3>{room.description && <p className={styles.description}>{ar ? room.description : room.descriptionEn || room.description}</p>}
            <div className={styles.mode}><span>{room.mode === 'LIVE' ? <Radio size={15}/> : <Clock3 size={15}/>} {room.mode === 'LIVE' ? text('مسابقة مباشرة', 'Live competition') : text('تحدٍّ بوقتك', 'Self-paced challenge')}</span><span><Users size={15}/>{room.teams ? text('فرق', 'Teams') : text('فردي', 'Individual')}</span></div>
            <dl className={styles.facts}><div><dt>{text('الأسئلة', 'Questions')}</dt><dd>{number(room.questionCount)}</dd></div><div><dt>{text('المشاركون', 'Participants')}</dt><dd><bdi>{number(room.participants)} / {number(room.capacity)}</bdi></dd></div></dl>
            {(room.opensAt || room.closesAt) && <div className={styles.dates}>{[['opensAt', text('تبدأ', 'Opens')], ['closesAt', text('تنتهي', 'Closes')]].map(([key, label]) => { const date = key === 'opensAt' ? room.opensAt : room.closesAt; return date ? <p key={key}><Clock3 size={14}/><span>{label}: <time dateTime={date}>{new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en-GB', { timeZone: 'Africa/Cairo', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))}</time></span></p> : null; })}<small>{text('جميع المواعيد بتوقيت مصر', 'All times are in Egypt time')}</small></div>}
            {room.prizeLabel && <p className={styles.prize}><Award size={17}/><bdi>{room.prizeLabel}</bdi></p>}
            <div className={styles.cardFooter}>{room.myEntry && <p className={styles.score}><Trophy size={16}/>{number(room.myEntry.score)} {text('نقطة', 'points')}</p>}<Link href={'/competitions/' + room.id} className={completed ? styles.secondary : styles.primary}>{completed ? <Trophy size={16}/> : <Play size={16}/>} {completed ? text('النتائج والترتيب', 'Results & rankings') : text('افتح المنافسة', 'Open competition')}<ArrowUpRight size={16} className={styles.arrow}/></Link></div>
          </article>;
        })}</div></>}
      </section>
      <aside className={styles.sidebar} aria-labelledby="preferences-title"><section className={styles.preferences}>
        <div className={styles.preferenceHeading}><span className={styles.headingIcon}><SlidersHorizontal size={21}/></span><div><h2 id="preferences-title">{text('تجربتك… باختيارك', 'Your experience, your choice')}</h2><p>{text('اضبط أجواء التحدّي على راحتك', 'Make the challenge feel like you')}</p></div></div>
        <label className={styles.preference}><span className={styles.preferenceIcon}><Volume2 size={19}/></span><span><strong>{text('أصوات الإجابات والتشجيع', 'Answer and encouragement sounds')}</strong><small>{policy.sound === false ? text('الصوت متوقف بواسطة الإدارة', 'Sound is disabled by administration') : text('تشجيع مع كل خطوة', 'A little encouragement along the way')}</small></span><input type="checkbox" checked={profile.sound} disabled={!ready || busy || policy.sound === false} onChange={event => changePreference('sound', event.target.checked)}/></label>
        <label className={styles.preference}><span className={styles.preferenceIcon} data-tone="cyan"><Sparkles size={19}/></span><span><strong>{text('حركات الاحتفال', 'Celebration effects')}</strong><small>{policy.motion === false ? text('الحركة متوقفة بواسطة الإدارة', 'Motion is disabled by administration') : text('احتفل بإجاباتك وإنجازاتك', 'Celebrate your answers and achievements')}</small></span><input type="checkbox" checked={profile.motion} disabled={!ready || busy || policy.motion === false} onChange={event => changePreference('motion', event.target.checked)}/></label>
        <div className={styles.privacy}><div><ShieldCheck size={19}/><h3>{text('ظهورك على لوحة النجوم', 'Your place on the public board')}</h3></div><label><input type="checkbox" checked={profile.publicName} disabled={!ready || busy} onChange={event => changePreference('publicName', event.target.checked)}/><span>{text('أوافق على إظهار اسمي الأول ومدرستي ونقاط منافساتي على الرئيسية عند تفعيل النشر.', 'Show my first name, school and competition points on the public homepage when publication is enabled.')}</span></label><p>{text('اختياري ويمكن إلغاؤه في أي وقت. درجات الامتحانات الرسمية لا تُنشر هنا.', 'Optional and reversible at any time. Official exam grades are not published here.')}</p></div>
        {preferenceError && <p role="alert" className={styles.preferenceError}>{preferenceError}</p>}{message && <p role="status" className={styles.saved}><CircleCheck size={17}/>{message}</p>}
        <button className={styles.primary} disabled={busy || loading || !ready} onClick={save}>{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ التفضيلات', 'Save preferences')}<CircleCheck size={16}/></button>
      </section><section className={styles.howItWorks} aria-labelledby="competition-steps"><span className={styles.eyebrow}><Trophy size={17}/>{text('تعلّم بروح المنافسة', 'Learning with friendly competition')}</span><h2 id="competition-steps">{text('تحدٍّ صغير، إنجاز جديد', 'A small challenge, a new achievement')}</h2><ol>{[text('اختر مسابقة تناسبك', 'Find a competition for you'), text('شارك وأجب عن الأسئلة', 'Join and answer the questions'), text('تابع نقاطك وترتيبك', 'Follow your points and ranking')].map((step, index) => <li key={step}><span>{number(index + 1)}</span>{step}</li>)}</ol><a href="#competition-rankings">{text('تعرّف على نجوم التعلّم', 'Meet the learning champions')}<ArrowUpRight size={16}/></a></section></aside>
    </div>
    <div id="competition-rankings" className={styles.rankings}><Leaderboard className={styles.leaderboard} hideArenaLink/></div>
  </div></DashboardLayout>;
}
