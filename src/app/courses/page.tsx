"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ArrowLeft, ArrowRight, Play, BookOpen } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { StudentFeedback } from '@/components/student/StudentPageHeader';
import ReferenceIcon from '@/components/student/ReferenceIcon';
import SubjectArtwork from '@/components/student/SubjectArtwork';
import { fetchStudentStats, readCachedStudentStats } from '@/lib/student-stats';
import { getSubjectArtwork, normalizeSubject } from '@/lib/subjectArtwork';
import { studentContentText, studentGradeLabel } from '@/lib/studentLocale';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './CoursesPage.module.css';

type Course={id:string;title:string;subject?:string;coverImage?:string;course?:{coverImage?:string};image?:string;thumbnail?:string;courseImage?:string;progressPercent?:number;totalLessons?:number;lessonsCount?:number;completedLessonsCount?:number};
type Stats={name?:string;grade?:string;overallCourseProgress?:number;avgScore?:number|null;passRate?:number|null;totalExams?:number;courseProgresses?:Course[]};
type Status=''|'IN_PROGRESS'|'COMPLETED'|'NOT_STARTED';
const progressOf=(course:Course)=>Math.max(0,Math.min(100,Number(course.progressPercent)||0));
const statusOf=(course:Course):Exclude<Status,''>=>progressOf(course)>=100?'COMPLETED':progressOf(course)>0?'IN_PROGRESS':'NOT_STARTED';
const subjectKey=(course:Course)=>{const artwork=getSubjectArtwork(course.subject);return artwork.key==='general'?normalizeSubject(course.subject||''):artwork.key;};

export default function CoursesPage() {
  const {language}=useLanguage();const ar=language==='ar';const txt=(a:string,e:string)=>ar?a:e;
  const [stats,setStats]=useState<Stats|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(false),[reload,setReload]=useState(0);
  const [search,setSearch]=useState(''),[subject,setSubject]=useState(''),[status,setStatus]=useState<Status>('');
  useEffect(()=>{
    let cancelled=false;setLoading(true);setError(false);
    const cached=readCachedStudentStats();if(cached?.courseProgresses){setStats(cached);setLoading(false);}
    fetchStudentStats('cookie_auth').then(data=>{if(!cancelled)setStats(data);}).catch(()=>{if(!cancelled)setError(true);}).finally(()=>{if(!cancelled)setLoading(false);});
    return()=>{cancelled=true;};
  },[reload]);
  const courses=stats?.courseProgresses||[];
  const states:Record<Exclude<Status,''>,string>={NOT_STARTED:txt('لم يبدأ','Not started'),IN_PROGRESS:txt('قيد الدراسة','In progress'),COMPLETED:txt('مكتمل','Completed')};
  const subjects=Array.from(new Map(courses.filter(course=>course.subject).map(course=>{const artwork=getSubjectArtwork(course.subject);return [subjectKey(course),artwork.key==='general'?course.subject!:(ar?artwork.ar:artwork.en)];})).entries());
  const inSubject=courses.filter(course=>!subject||subjectKey(course)===subject);
  const visible=inSubject.filter(course=>(!status||statusOf(course)===status)&&normalizeSubject(course.title+' '+studentContentText(course,'title',language)+' '+(course.subject||'')+' '+getSubjectArtwork(course.subject)[ar?'ar':'en']).includes(normalizeSubject(search)));
  const number=(value:number|null|undefined,percent=false)=>value==null?'—':`${Number(value.toFixed(1)).toLocaleString(ar?'ar-EG':'en-GB')}${percent?'%':''}`;
  const reset=()=>{setSearch('');setSubject('');setStatus('');};
  const metrics=[
    {key:'completion',label:txt('إكمال الدروس','Lesson completion'),value:number(stats?.overallCourseProgress,true),hint:txt('من إجمالي الدروس','Of all lessons'),icon:'book-open',tone:'purple'},
    {key:'score',label:txt('متوسط الدرجة','Average score'),value:number(stats?.avgScore,true),hint:txt('آخر محاولة لكل اختبار','Latest attempt per exam'),icon:'chart-bars',tone:'cyan'},
    {key:'pass',label:txt('نسبة النجاح','Pass rate'),value:number(stats?.passRate,true),hint:txt('من الاختبارات المسجلة','From recorded exams'),icon:'graduation-cap',tone:'cyan'},
    {key:'attempts',label:txt('محاولات الامتحانات','Exam attempts'),value:number(stats?.totalExams),hint:txt('كل محاولة خطوة للأمام','Every attempt is a step forward'),icon:'target',tone:'purple'},
  ];
  return <DashboardLayout mainClassName={styles.main}><div className={styles.page} dir={ar?'rtl':'ltr'}>
    <div className={styles.wave} aria-hidden="true"/>
    <section className={styles.welcome} aria-label={txt('أهلًا بعودتك','Welcome back')}>
      <div className={styles.identity}><div><p className={styles.greeting}><span>{txt('أهلًا','Hello')}{stats?.name?(ar?'،':','):''}</span>{stats?.name&&<bdi>{stats.name}</bdi>}<span aria-hidden="true">👋</span></p><p>{txt('كل خطوة في مقرراتك تقرّبك من أهدافك.','Every lesson brings you closer to your goals.')}</p></div></div>
      <label className={styles.subjectFilter}><span>{txt('المادة الدراسية','Subject')}</span><select aria-label={txt('المادة','Subject')} value={subject} onChange={e=>setSubject(e.target.value)}><option value="">{txt('كل المواد','All subjects')}</option>{subjects.map(([key,label])=><option value={key} key={key}>{label}</option>)}</select></label>
    </section>
    {error&&<StudentFeedback title={txt('تعذر تحديث المقررات. أعد المحاولة.','Could not refresh your courses. Please retry.')} retry={()=>setReload(value=>value+1)}/>}
    <section className={styles.metrics} aria-label={txt('ملخص تقدمك','Your progress summary')} aria-busy={loading}>{metrics.map(metric=><article key={metric.key} className={styles.metric} data-tone={metric.tone}><span className={styles.metricIcon}><ReferenceIcon name={metric.icon} variant="duotone" size={46}/></span><h2>{metric.label}</h2><strong><bdi className="student-number">{loading&&!stats?'—':metric.value}</bdi></strong><p>{metric.hint}</p><svg className={styles.sparkline} viewBox="0 0 100 38" aria-hidden="true"><defs><linearGradient id={`course-${metric.key}`} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#32c3d4" stopOpacity=".5"/><stop offset="1" stopColor="#c8b6ee" stopOpacity=".06"/></linearGradient></defs><path d="M2 32L18 27L31 18L46 22L60 13L76 20L97 9V38H2Z" fill={`url(#course-${metric.key})`}/><path d="M2 32L18 27L31 18L46 22L60 13L76 20L97 9" fill="none" stroke="#70519c" strokeWidth="2"/></svg></article>)}</section>
    <section className={styles.catalog} aria-labelledby="courses-title">
      <div className={styles.toolbar}><div className={styles.heading}><h1 id="courses-title">{txt('مقرراتي الدراسية','My courses')}</h1><p>{txt('تابع تقدّمك في مقرراتك، وابدأ درسك وخطوتك التالية.','Follow your progress and take your next learning step.')}</p></div>
        <div className={styles.tabs} role="group" aria-label={txt('حالة الدراسة','Learning status')}>{(['','IN_PROGRESS','COMPLETED','NOT_STARTED'] as Status[]).map(value=><button type="button" key={value} aria-pressed={status===value} onClick={()=>setStatus(value)}>{value?states[value]:txt('كل المقررات','All courses')} <span>({number(value?inSubject.filter(course=>statusOf(course)===value).length:inSubject.length)})</span></button>)}</div>
        <label className={styles.search}><Search size={17} aria-hidden="true"/><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder={txt('ابحث عن مقرر…','Search courses…')} aria-label={txt('ابحث عن مقرر','Search courses')}/></label>
      </div>
      <div className={styles.resultsLine}><p role="status">{error&&!stats?'—':loading&&!stats?txt('جارٍ تحميل المقررات…','Loading courses…'):`${number(visible.length)} ${txt('مقرر','courses')}`}</p>{(search||subject||status)&&<button type="button" onClick={reset}>{txt('مسح الفلاتر','Clear filters')}</button>}</div>
      {loading&&!stats?<div className={styles.grid} aria-hidden="true">{[0,1,2,3].map(key=><div className={styles.skeleton} key={key}/>)}</div>:visible.length?<div className={styles.grid}>{visible.map((course,index)=>{
        const progress=progressOf(course),state=statusOf(course),artwork=getSubjectArtwork(course.subject,course.title);
        return <article className={styles.card} key={course.id}>
          <div className={styles.cover}><SubjectArtwork subject={course.subject} title={course.title} coverImage={course.coverImage||course.course?.coverImage||course.image||course.thumbnail||course.courseImage} priority={index<4}/><span className={styles.status} data-state={state}><span aria-hidden="true"/>{states[state]}</span></div>
          <div className={styles.cardBody}><h2><bdi>{studentContentText(course,'title',language)}</bdi></h2><p className={styles.meta}>{course.subject?(artwork.key==='general'?course.subject:(ar?artwork.ar:artwork.en)):txt('مقرر دراسي','Course')}{stats?.grade&&<> · <bdi>{studentGradeLabel(stats.grade,language)}</bdi></>} · {number(course.totalLessons||course.lessonsCount||0)} {txt('درس','lessons')}</p>
            <div className={styles.progressRow}><progress max={100} value={progress} aria-label={course.title}/><strong dir="ltr" className="student-number">{number(progress)}%</strong></div>
            <Link className={styles.courseLink} href={`/courses/${course.id}`}>{progress===0?<Play size={14} aria-hidden="true"/>:ar?<ArrowLeft size={15} aria-hidden="true"/>:<ArrowRight size={15} aria-hidden="true"/>}{progress>=100?txt('مراجعة المقرر','Review course'):progress>0?txt('متابعة التعلم','Continue learning'):txt('ابدأ الآن','Start learning')}</Link>
          </div>
        </article>;
      })}</div>:!error&&<div className={styles.empty}><BookOpen size={40} aria-hidden="true"/><h2>{txt(courses.length?'لا توجد نتائج تطابق اختياراتك':'لم تُتح لك مقررات بعد',courses.length?'No matching courses':'No courses assigned yet')}</h2><p>{txt(courses.length?'غيّر كلمات البحث أو امسح الفلاتر لعرض مقرراتك.':'ستظهر مقرراتك هنا بمجرد إتاحتها لصفك من المدرسة.',courses.length?'Change your search or clear filters.':'Courses will appear when your school assigns them to your grade.')}</p>{courses.length>0&&<button onClick={reset}>{txt('عرض كل المقررات','Show all courses')}</button>}</div>}
    </section>
  </div></DashboardLayout>;
}
