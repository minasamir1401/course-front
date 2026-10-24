"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ReferenceIcon from '@/components/student/ReferenceIcon';
import SubjectArtwork from '@/components/student/SubjectArtwork';
import DashboardCertificates from './DashboardCertificates';
import CompetitionShortcut from '@/components/competitions/CompetitionShortcut';
import { fetchStudentStats } from '@/lib/student-stats';
import { formatEgyptDateTime } from '@/lib/egyptTime';
import { studentContentText } from '@/lib/studentLocale';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './StudentOverview.module.css';

type Course = { id:string; title:string; subject?:string; coverImage?:string; progressPercent:number; completedLessonsCount:number; totalLessons:number; lastAccessedAt?:string };
type UpcomingExam = { id:string; title:string; startDate:string; subject?:string; coverImage?:string };
type StudentStats = { name?:string; overallCourseProgress?:number; avgScore?:number|null; totalExams?:number; xp?:number; courseProgresses?:Course[]; upcomingTasks?:UpcomingExam[]; generatedAt?:string };
const percent = (value: number | undefined) => Math.max(0,Math.min(100,Number(value)||0));

export default function StudentOverview() {
  const router=useRouter(); const {language}=useLanguage(); const ar=language==='ar';
  const txt=(a:string,e:string)=>ar?a:e;
  const [stats,setStats]=useState<StudentStats|null>(null);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [reload,setReload]=useState(0);
  useEffect(()=>{
    let cancelled=false;
    async function load(){
      setError('');setLoading(true);
      try {
        const user=JSON.parse(localStorage.getItem('lms_user')||localStorage.getItem('school_admin_user')||'{}');
        if(user.role==='TEACHER'){router.replace('/school-admin');return;}
        const data=await fetchStudentStats('cookie_auth');if(!cancelled)setStats(data);
      }catch{if(!cancelled)setError(ar?'تعذر تحميل تقدمك. أعد المحاولة.':'Could not load your progress. Please retry.');}
      finally{if(!cancelled)setLoading(false);}
    }
    void load();return()=>{cancelled=true;};
  },[reload,router,ar]);
  const number=(value:number|null|undefined)=>value==null?'—':value.toLocaleString(ar?'ar-EG':'en-GB');
  const courses=stats?.courseProgresses||[];
  const resume=[...courses].filter(course=>course.progressPercent>0&&course.progressPercent<100).sort((a,b)=>String(b.lastAccessedAt||'').localeCompare(String(a.lastAccessedAt||'')))[0]||courses.find(course=>course.progressPercent<100);
  const displayedCourses=[...courses].sort((a,b)=>Number(b.id===resume?.id)-Number(a.id===resume?.id)).slice(0,4);
  const completed=courses.reduce((sum,course)=>sum+(course.completedLessonsCount||0),0), total=courses.reduce((sum,course)=>sum+(course.totalLessons||0),0);
  const metrics=[
    {label:txt('إكمال الدروس','Lesson completion'),value:stats?.overallCourseProgress==null?'—':number(percent(stats.overallCourseProgress))+'%',icon:'book-open',tone:'purple',hint:txt(`${number(completed)} من ${number(total)} درس`,`${number(completed)} of ${number(total)} lessons`)},
    {label:txt('متوسط آخر محاولة لكل اختبار','Average latest attempt per exam'),value:stats?.avgScore==null?'—':number(stats.avgScore)+'%',icon:'chart-bars',tone:'cyan',hint:txt('آخر محاولاتك','Latest attempts')},
    {label:txt('محاولات الامتحانات','Exam attempts'),value:number(stats?.totalExams),icon:'target',tone:'cyan',hint:txt('محاولات مسجّلة','Recorded attempts')},
    {label:txt('نقاط التشجيع XP','Reward XP'),value:number(stats?.xp),icon:'star',tone:'purple',hint:txt('نقاط التشجيع','Learning rewards')},
  ];
  return <DashboardLayout mainClassName={styles.main}><div className={styles.dashboard} dir={ar?'rtl':'ltr'}>
    <section className={styles.hero} aria-labelledby="student-welcome">
      <div className={styles.heroWave} aria-hidden="true"/>
      <div className={styles.welcome}>
        <div className={styles.identity}><div><h1 id="student-welcome"><span>{txt('أهلًا','Welcome')}{stats?.name?(ar?'،':','):''}</span>{stats?.name&&<bdi>{stats.name}</bdi>}<span aria-hidden="true">👋</span></h1><p>{txt('ابدأ بخطوة واضحة اليوم، وتابع تقدّمك الحقيقي.','Take one clear step today and follow your real progress.')}</p></div></div>
        <div className={styles.shortcuts}><Link href="/exams"><ReferenceIcon name="clipboard" size={17}/>{txt('امتحاناتك وتقييماتك','Your exams & assessments')}</Link><Link href="/calendar"><ReferenceIcon name="calendar" size={17}/>{txt('مواعيدك القادمة','Upcoming dates')}</Link></div>
      </div>
      <Image src="/klevro/illustrations/dashboard-education.png" alt="" aria-hidden="true" width={1680} height={960} priority sizes="(max-width: 600px) 270px, (max-width: 1000px) 360px, 430px" className={styles.heroArt}/>
      <div className={styles.heroActions}><Link href={resume?`/courses/${resume.id}`:'/courses'} className={styles.primary}><ReferenceIcon name="arrow-up-right" size={17}/>{txt('أكمل دراستك','Continue learning')}</Link><button type="button" className={styles.refresh} onClick={()=>setReload(value=>value+1)} disabled={loading} aria-label={txt('تحديث تقدمك','Refresh progress')}><ReferenceIcon name="refresh" size={19} className={loading?styles.spinning:''}/></button></div>
    </section>
    {error&&<div className={styles.error} role="alert"><span>{error}</span><button onClick={()=>setReload(value=>value+1)}>{txt('إعادة المحاولة','Retry')}</button></div>}
    {!stats&&!error?<div role="status" className={styles.loading}><span>{txt('جارٍ تحميل دروسك…','Loading your lessons…')}</span><div className={styles.skeletons}>{[0,1,2,3].map(item=><div key={item}/>)}</div></div>:stats&&<>
      <section className={styles.metrics} aria-label={txt('ملخص تقدمك','Your progress summary')} aria-busy={loading}>{metrics.map(metric=><article key={metric.icon} className={styles.metric} data-tone={metric.tone}>
        <span className={styles.metricIcon}><ReferenceIcon name={metric.icon} size={44} variant="duotone"/></span><h2>{metric.label}</h2><p className={styles.metricValue} dir="auto"><bdi className="student-number">{metric.value}</bdi></p><p className={styles.metricHint}>{metric.hint}</p><svg className={styles.metricFlourish} viewBox="0 0 76 32" aria-hidden="true"><defs><linearGradient id={`metric-${metric.icon}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#25bdd1" stopOpacity=".6"/><stop offset="1" stopColor="#8257dd" stopOpacity=".04"/></linearGradient></defs><path d="M3 26Q17 10 31 17T72 8V32H3Z" fill={`url(#metric-${metric.icon})`}/><path d="M3 26Q17 10 31 17T72 8" fill="none" stroke="#7043bc" strokeWidth="2"/></svg>
      </article>)}</section>
      <div className={styles.columns}>
        <section className={styles.coursesPanel} aria-labelledby="next-lessons"><div className={styles.panelHeading}><h2 id="next-lessons"><ReferenceIcon name="book-open" size={24}/>{txt('دروسك وخطوتك التالية','Your lessons & next step')}</h2><Link href="/courses">{txt('كل الكورسات','All courses')} <span aria-hidden="true">{ar?'←':'→'}</span></Link></div>
          {displayedCourses.length?<ul className={styles.courseList}>{displayedCourses.map(course=><li key={course.id} className={styles.courseRow}><SubjectArtwork subject={course.subject} title={course.title} coverImage={course.coverImage} variant="thumbnail"/><div className={styles.courseContent}><div className={styles.courseTitle}><h3><bdi>{studentContentText(course,'title',language)}</bdi></h3></div><progress className={styles.progress} value={percent(course.progressPercent)} max={100} aria-label={course.title}/><p className={styles.lessonCount}><bdi dir="ltr">{number(course.completedLessonsCount)} / {number(course.totalLessons)}</bdi> {txt('درس','lessons')}</p></div><div className={styles.courseAction}><span className={styles.percent}>{number(percent(course.progressPercent))}%</span><Link href={`/courses/${course.id}`}>{txt('افتح الكورس','Open course')}<ReferenceIcon name="arrow-up-right" size={15}/></Link></div></li>)}</ul>:<div className={styles.emptyCourses}><ReferenceIcon name="book-open" size={48} variant="duotone"/><p>{txt('لم تُتح لك كورسات بعد. ستظهر هنا بمجرد إتاحتها لصفك من المدرسة.','No courses assigned yet. They will appear when your school makes them available to your grade.')}</p><Link href="/courses" className={styles.secondary}>{txt('استعرض مقرراتك','Browse your courses')}</Link></div>}
        </section>
        <section className={styles.schedulePanel} aria-labelledby="upcoming-exams"><div className={styles.scheduleInner}><div className={styles.scheduleHeading}><span className={styles.smallTile}><ReferenceIcon name="calendar" size={21}/></span><h2 id="upcoming-exams">{txt('أقرب مواعيد الامتحانات','Upcoming exam dates')}</h2></div>
          {stats.upcomingTasks?.length?<ul className={styles.examList}>{stats.upcomingTasks.slice(0,3).map(exam=><li key={exam.id}><Link href={`/exams/${exam.id}/details`}><SubjectArtwork subject={exam.subject} title={exam.title} examKey={String(exam.id)} coverImage={exam.coverImage} variant="thumbnail" className={styles.examThumb}/><div><h3><bdi>{studentContentText(exam,'title',language)}</bdi></h3><p>{formatEgyptDateTime(exam.startDate,language)}</p></div><ReferenceIcon name="arrow-up-right" size={15}/></Link></li>)}</ul>:<><p className={styles.scheduleEmpty}>{txt('لا توجد امتحانات منشورة بموعد قادم. يمكنك مراجعة المتاح الآن.','No published upcoming exams. You can check exams available now.')}</p><div className={styles.calendarScene}><Image src="/klevro/illustrations/dashboard-calendar.png" alt="" aria-hidden="true" width={1536} height={1024} sizes="(max-width: 600px) 280px, 330px"/><span aria-hidden="true"/></div></>}
          <div className={styles.scheduleActions}><Link href="/exams" className={styles.primary}>{txt('استعرض الامتحانات','Browse exams')}<ReferenceIcon name="arrow-up-right" size={17}/></Link><Link href="/calendar" className={styles.secondary}><ReferenceIcon name="calendar" size={18}/>{txt('التقويم','Calendar')}</Link></div>
        </div></section>
      </div>
      <section className={styles.reportCallout}><div className={styles.reportCopy}><ReferenceIcon name="chart-bars" size={45} variant="duotone"/><div><h2>{txt('اعرف ما أتقنته وما يحتاج تدريبًا','See strengths and what needs practice')}</h2><p>{txt('تقاريرك تفصل نتائج الامتحانات عن نقاط المكافآت.','Reports keep academic results separate from reward points.')}</p></div></div><div className={styles.reportAction}><Link href="/reports" className={styles.primary}><ReferenceIcon name="arrow-up-right" size={17}/>{txt('افتح تقريرك','Open your report')}</Link><ReferenceIcon name="target" size={45} variant="duotone"/></div></section>
      {stats.generatedAt&&<p className={styles.updated}>{txt('آخر تحديث:','Updated:')} {formatEgyptDateTime(stats.generatedAt,language)}</p>}
    </>}
    <CompetitionShortcut/><DashboardCertificates refreshKey={reload}/>
  </div></DashboardLayout>;
}
