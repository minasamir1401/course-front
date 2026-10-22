"use client";
import { useState } from 'react';
import Image from 'next/image';
import { Search, SlidersHorizontal, Sparkles, Star, Trophy, BookOpen, BrainCircuit, ArrowUpRight, ChevronDown, RefreshCw, Layers, Target, Clock, CheckCircle2, Play, X } from 'lucide-react';
import { studentContentText, studentSubjectLabel } from '@/lib/studentLocale';
import SubjectArtwork from '@/components/student/SubjectArtwork';
import { questionMetadata } from '@/lib/bilingualMetadata';
import { normalizeSubject, getSubjectArtwork } from '@/lib/subjectArtwork';
import styles from './ActivitiesPage.module.css';

type Props = {
  language: string; data: any; subject: string; onSubject: (subject: string) => void; gradeLabel: string;
  loading: boolean; openingId: string | null; error: string; onRetry: () => void; hideScience: boolean;
  expanded: Record<string, boolean>; onToggle: (id: string) => void; onOpen: (id: string) => void;
  translate: (value: any) => string; typeLabel: (type: string) => string;
};
export const hasActivityAttempt = (activity: any) => Boolean(activity?.hasAttempt || activity?.bestAttemptCorrect || activity?.bestAttemptStars > 0);

function ActivityIcon({type}: {type: string}) {
  const Icon = ['MCQ','TRUE_FALSE','MULTI_SELECT'].includes(type) ? BookOpen : ['MATCHING','GROUP_SORTING','SEQUENCE_ORDER','DRAG_DROP_FILL'].includes(type) ? Layers : ['MATH_EQUATION','NUMBER_LINE','COUNT_OBJECTS','CLOCK'].includes(type) ? Target : BrainCircuit;
  return <Icon size={23} strokeWidth={1.6}/>;
}

export default function ActivitiesOverview(props: Props) {
  const {language, data, subject, onSubject, gradeLabel, loading, openingId, error, onRetry, hideScience, expanded, onToggle, onOpen, translate, typeLabel} = props;
  const ar = language === 'ar'; const txt = (a: string, e: string) => ar ? a : e;
  const [search, setSearch] = useState(''); const [status, setStatus] = useState('');
  const [collapsedMatches,setCollapsedMatches] = useState<Record<string,boolean>>({});
  const clusters: any[] = data?.clusters || [];
  const totalStars = clusters.reduce((n,c) => n + (c.stats?.totalStarsEarned || 0), 0);
  const maxStars = clusters.reduce((n,c) => n + (c.stats?.maxPossibleStars || 0), 0);
  const xp = clusters.reduce((n,c) => n + (c.stats?.totalXPEarned || 0), 0);
  const mastery = clusters.length ? Math.round(clusters.reduce((n,c) => n + (c.stats?.masteryPercent || 0), 0) / clusters.length) : 0;
  const query = normalizeSubject(search);
  const filtered = clusters.map(cluster => ({...cluster, skills: (cluster.skills || []).map((skill: any) => ({...skill, activities: (skill.activities || []).filter((activity: any) => {
    const matchesSearch = !query || normalizeSubject([studentSubjectLabel(cluster.subject,language), translate(cluster.name), translate(skill.name), studentContentText(activity,'title',language), typeLabel(activity.type)].join(' ')).includes(query);
    return matchesSearch && (!status || (status === 'saved' ? hasActivityAttempt(activity) : !hasActivityAttempt(activity)));
  })})).filter((skill: any) => !query && !status || skill.activities.length)})).filter(cluster => !query && !status || cluster.skills.length);
  const count = filtered.reduce((n,c) => n + c.skills.reduce((sum: number,s: any) => sum + s.activities.length, 0), 0);
  const clear = () => { setSearch(''); setStatus(''); };
  return <>
    <header className={styles.hero}>
      <div className={styles.heroCopy}><span className={styles.eyebrow}><Sparkles size={15}/>{txt('مساحتك للتدريب والتجربة','Your space to practise')}</span><h1>{txt('الأنشطة والمهارات','Activities & skills')}</h1><p>{txt('تعلّم بالتجربة، وطوّر مهاراتك خطوة بخطوة. اختر نشاطًا وتابع تقدّمك.','Learn by doing and build your skills step by step. Choose an activity and follow your progress.')}</p><span className={styles.grade}><BookOpen size={14}/>{gradeLabel}</span></div>
      <div className={styles.heroArt}><Image src={getSubjectArtwork(subject).src} alt="" aria-hidden="true" fill loading="eager" unoptimized sizes="(max-width:500px) 185px, 285px"/></div>
    </header>
    <section className={styles.metrics} aria-label={txt('تقدّمك في الأنشطة','Your activity progress')}>
      {[{label:txt('النجوم المكتسبة','Stars earned'),value:data?`${totalStars} / ${maxStars}`:'—',Icon:Trophy,tone:'gold'}, {label:txt('نقاط الخبرة','XP earned'),value:data?`${xp} XP`:'—',Icon:Sparkles,tone:'purple'}, {label:txt('متوسط الإتقان','Average mastery'),value:data?`${mastery}%`:'—',Icon:BrainCircuit,tone:'cyan'}, {label:txt('الصف الدراسي','Current grade'),value:gradeLabel,Icon:BookOpen,tone:'rose'}].map(({label,value,Icon,tone}) => <article key={tone} className={styles.metric}><span className={styles.metricIcon} data-tone={tone}><Icon size={22} strokeWidth={1.6}/></span><div><p>{label}</p><strong>{tone==='rose'?value:<bdi dir="ltr">{value}</bdi>}</strong></div></article>)}
    </section>
    <section className={styles.filters} aria-label={txt('تصفية الأنشطة','Filter activities')}>
      <div className={styles.subjects} role="group" aria-label={txt('المادة الدراسية','Subject')}>
        {['', ...new Set<string>(data?.subjects || [])].filter(item => !(item === 'العلوم' && hideScience)).map(item => <button key={item} onClick={()=>onSubject(item)} aria-pressed={subject === item}>{item ? studentSubjectLabel(item,language) : txt('كل المواد','All subjects')}</button>)}
      </div>
      <div className={styles.filterInputs}><label className={styles.search}><Search size={17}/><input aria-label={txt('ابحث عن نشاط أو مهارة','Search activities or skills')} placeholder={txt('ابحث عن نشاط أو مهارة…','Search activities or skills…')} value={search} onChange={e=>{setSearch(e.target.value);setCollapsedMatches({});}}/>{search && <button onClick={()=>setSearch('')} aria-label={txt('مسح البحث','Clear search')}><X size={15}/></button>}</label><label className={styles.statusFilter}><SlidersHorizontal size={16}/><select aria-label={txt('حالة النشاط','Activity status')} value={status} onChange={e=>{setStatus(e.target.value);setCollapsedMatches({});}}><option value="">{txt('كل الأنشطة','All activities')}</option><option value="new">{txt('أنشطة جديدة','New activities')}</option><option value="saved">{txt('تم تقييمها','Evaluated activities')}</option></select></label></div>
    </section>
    {error && <div role="alert" className={styles.error}>{error}<button onClick={onRetry}><RefreshCw size={15}/>{txt('إعادة المحاولة','Retry')}</button></div>}
    <div className={styles.sectionHeading}><div><span className={styles.sectionIcon}><Layers size={20}/></span><h2>{txt('رحلتك مع المهارات','Your skills journey')}</h2></div>{data && !loading && <span>{count} {txt('نشاط','activities')}</span>}</div>
    {loading ? <div className={styles.loading} role="status"><RefreshCw size={25}/><p>{txt('جارٍ تحميل أنشطتك…','Loading your activities…')}</p></div> : error && !data ? null : !filtered.length ? <section className={styles.empty}><BrainCircuit size={34}/><h2>{txt(query || status?'لا توجد أنشطة مطابقة':'أنشطتك القادمة تبدأ هنا', query || status?'No matching activities':'Your next activities start here')}</h2><p>{txt(query || status?'جرّب اسم مهارة آخر أو غيّر حالة النشاط.':'ستظهر الأنشطة هنا عندما تُنشر لصفّك ومادتك.',query || status?'Try another skill name or change the activity status.':'Activities will appear here when they are published for your grade and subject.')}</p>{(query || status) && <button onClick={clear} className={styles.secondary}>{txt('مسح الفلاتر','Clear filters')}</button>}</section> : <div className={styles.clusters}>
      {filtered.map((cluster: any, index: number) => {
        const searching = !!query || !!status;
        const open = searching ? !collapsedMatches[cluster.id] : !!expanded[cluster.id];
        const stats = cluster.stats || {}; const panelId = `cluster-${cluster.id}`;
        return <section className={styles.cluster} key={cluster.id}>
          <button className={styles.clusterHeader} aria-expanded={open} aria-controls={panelId} onClick={()=>searching ? setCollapsedMatches(current=>({...current,[cluster.id]:!current[cluster.id]})) : onToggle(cluster.id)}>
            <SubjectArtwork subject={cluster.subject} variant="thumbnail" className={styles.clusterArt}/>
            <div className={styles.clusterTitle}><small>{cluster.subject ? studentSubjectLabel(cluster.subject,language) : txt(`المحور ${index + 1}`,`Cluster ${index + 1}`)}</small><h3>{translate(cluster.name)}</h3>{cluster.description && <p>{translate(cluster.description)}</p>}</div>
            <div className={styles.clusterProgress}><span>{txt('مستوى الإتقان','Mastery')}<strong>{stats.masteryPercent || 0}%</strong></span><span className={styles.track}><span style={{width:`${Math.max(0,Math.min(100,stats.masteryPercent || 0))}%`}}/></span><small><Star size={12}/><bdi dir="ltr">{stats.totalStarsEarned || 0} / {stats.maxPossibleStars || 0}</bdi> {txt('نجوم','stars')}</small></div><span className={styles.chevron} data-open={open}><ChevronDown size={19}/></span>
          </button>
          <div id={panelId} hidden={!open} className={styles.clusterBody}>
            {cluster.skills.length ? cluster.skills.map((skill: any, skillIndex: number) => <section key={skill.id} className={styles.skill}>
              <div className={styles.skillHeading}><span>{skillIndex + 1}</span><div><h4>{translate(skill.name)}</h4>{skill.description && <p>{translate(skill.description)}</p>}</div><small>{skill.activities.length} {txt('نشاط','activities')}</small></div>
              {skill.activities.length ? <div className={styles.activityGrid}>{skill.activities.map((activity: any) => {
                const saved = hasActivityAttempt(activity); const title = studentContentText(activity,'title',language);
                const level = activity.difficulty === 'Easy' ? txt('سهل','Easy') : activity.difficulty === 'Hard' ? txt('متقدم','Advanced') : activity.difficulty ? txt('متوسط','Medium') : '';
                return <article className={styles.activity} data-activity-card={activity.id} key={activity.id}>
                  <div className={styles.activityTop}><span className={styles.activityIcon} data-kind={activity.type}><ActivityIcon type={activity.type}/></span><span className={styles.activityState} data-saved={saved}>{saved?<CheckCircle2 size={12}/>:<span/>}{saved?txt('تم التقييم','Evaluated'):txt('نشاط جديد','New activity')}</span></div>
                  <span className={styles.activityType}>{typeLabel(activity.type)}</span><h5>{title}</h5>
                  {activity.learningOutcome && <p className={styles.outcome}>{questionMetadata(activity,'learningOutcome',language)}</p>}
                  <div className={styles.activityMeta}>{level && <span>{level}</span>}{Number(activity.estimatedTime)>0 && <span><Clock size={12}/>{Math.ceil(Number(activity.estimatedTime)/60)} {txt('دقيقة','min')}</span>}</div>
                  <div className={styles.activityBottom}><span className={styles.stars} role="img" aria-label={txt(`${activity.bestAttemptStars || 0} من 3 نجوم`,`${activity.bestAttemptStars || 0} of 3 stars`)}>{[1,2,3].map(star=><Star key={star} size={15} aria-hidden="true" data-filled={star <= (activity.bestAttemptStars || 0)}/>)}</span><button aria-busy={openingId===activity.id} onClick={()=>onOpen(activity.id)} aria-label={`${txt('افتح النشاط','Open activity')}: ${title}`}>{openingId===activity.id ? <><RefreshCw size={14}/>{txt('جارٍ الفتح…','Opening…')}</> : <>{saved?txt('مراجعة النشاط','Review activity'):txt('ابدأ النشاط','Start activity')}{saved?<ArrowUpRight size={16}/>:<Play size={14}/>}</>}</button></div>
                </article>;
              })}</div> : <p className={styles.noItems}>{txt('لا توجد أنشطة منشورة لهذه المهارة بعد.','No activities have been published for this skill yet.')}</p>}
            </section>) : <p className={styles.noItems}>{txt('لا توجد مهارات منشورة في هذا المحور بعد.','No skills have been published in this cluster yet.')}</p>}
          </div>
        </section>;
      })}
    </div>}
  </>;
}
