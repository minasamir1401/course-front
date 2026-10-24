"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BookOpen, Lock, CheckCircle2, Play, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { StudentFeedback } from '@/components/student/StudentPageHeader';
import SubjectArtwork from '@/components/student/SubjectArtwork';
import LearningBackdrop from '@/components/student/LearningBackdrop';
import { API_URL, apiFetch } from '@/lib/api';
import { fetchStudentStats } from '@/lib/student-stats';
import { formatEgyptDateTime } from '@/lib/egyptTime';
import { useLanguage } from '@/contexts/LanguageContext';
import frame from '@/components/student/LearningPage.module.css';
import styles from './CourseDetails.module.css';

export default function CourseDetailsPage() {
  const {id}=useParams();const {language}=useLanguage();const ar=language==='ar';const txt=(a:string,e:string)=>ar?a:e;
  const [course,setCourse]=useState<any>(null),[loading,setLoading]=useState(true),[error,setError]=useState(false),[reload,setReload]=useState(0),[progress,setProgress]=useState<number|null>(null);
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{
    const controller=new AbortController();setLoading(true);setError(false);setCourse(null);setProgress(null);
    apiFetch(API_URL+'/courses/'+id,{signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error();const data=await response.json();if(!controller.signal.aborted)setCourse(data);}).catch(()=>{if(!controller.signal.aborted)setError(true);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    fetchStudentStats('cookie_auth').then(data=>{const item=data.courseProgresses?.find((item:any)=>String(item.id||item.courseId)===String(id));if(!controller.signal.aborted&&item)setProgress(item.progressPercent);}).catch(()=>{});
    return()=>controller.abort();
  },[id,reload]);
  const lessons=(course?.lessons||[]).filter((lesson:any)=>lesson.isVisible!==false).sort((a:any,b:any)=>(a.order||0)-(b.order||0));
  const available=(lesson:any)=>(!lesson.publishDate||Date.parse(lesson.publishDate)<=now)&&(!lesson.cutOffDate||Date.parse(lesson.cutOffDate)>now);
  const completed=(lesson:any)=>Boolean(lesson.progresses?.[0]?.isCompleted);
  const next=lessons.find((lesson:any)=>available(lesson)&&!completed(lesson))||lessons.find(available);
  const groups:Record<string,any[]>={};lessons.forEach((lesson:any)=>{(groups[lesson.domain?.trim()||txt('الدروس','Lessons')]||=[]).push(lesson);});
  const percentage=Math.max(0,Math.min(100,Number(progress??(lessons.length?Math.round(lessons.filter(completed).length/lessons.length*100):0))||0));
  const number=(value:number)=>value.toLocaleString(ar?'ar-EG':'en-GB');
  const href=(lesson:any)=>'/lessons/'+lesson.id+'?courseId='+id;
  return <DashboardLayout mainClassName={frame.main}><div className={frame.shell} dir={ar?'rtl':'ltr'}><LearningBackdrop/>
    <header className={frame.hero}><div className={frame.heroCopy}><Link className={frame.back} href="/courses">{txt('مقرراتي الدراسية','My courses')}{ar?<ChevronLeft size={16}/>:<ChevronRight size={16}/>}</Link><h1>{course?.title||txt('تفاصيل المقرر','Course details')}</h1>{course?.description&&<p className={frame.description}>{course.description}</p>}{next&&<div className={styles.heroActions}><Link className={frame.primary} href={href(next)}><Play size={17}/>{txt(completed(next)?'راجع دروسك':percentage>0?'أكمل دراستك':'ابدأ أول درس',completed(next)?'Review lessons':percentage>0?'Continue learning':'Start first lesson')}</Link></div>}</div>{course&&<SubjectArtwork subject={course.subject} title={course.title} coverImage={course.coverImage} className={`${frame.heroArt} ${styles.heroArt}`} priority/>}</header>
    <div className={frame.content}>{loading?<p role="status" className={frame.status}>{txt('جارٍ تحميل دروسك…','Loading lessons…')}</p>:error?<StudentFeedback title={txt('تعذر تحميل المقرر. تحقق من الاتصال ثم حاول مرة أخرى.','Could not load this course. Check your connection and retry.')} retry={()=>setReload(value=>value+1)}/>:course&&<>
      <section className={`${frame.panel} ${styles.progressCard}`} aria-labelledby="course-progress"><div className={styles.progressHeading}><div><h2 id="course-progress">{txt('تقدمك في المقرر','Course progress')}</h2><p>{number(lessons.filter(completed).length)} / {number(lessons.length)} {txt('درس مكتمل','lessons completed')}</p></div><strong>{number(percentage)}%</strong></div><progress aria-label={txt('تقدم المقرر','Course progress')} value={percentage} max={100}/><p className={styles.xp}>{txt('نقاط التشجيع المكتسبة:','Reward points earned:')} {number(course.xpData?.totalCourseXP||0)} XP</p></section>
      {lessons.length?<div className={styles.groups}>{Object.entries(groups).map(([domain,items])=><details key={domain} open className={`${frame.panel} ${styles.group}`}><summary>{domain} <span>({number(items.length)})</span></summary><ol className={styles.lessonList}>{items.map((lesson:any,index:number)=>{
        const ready=available(lesson),done=completed(lesson),expired=lesson.cutOffDate&&Date.parse(lesson.cutOffDate)<=now;
        const seconds=Number(lesson.durationSeconds||lesson.videoDurationSeconds||Number(lesson.durationMinutes||lesson.videoDurationMinutes)*60||lesson.duration)||0;
        return <li key={lesson.id} className={styles.lesson} data-lesson-state={!ready?'locked':done?'completed':'available'}><div className={styles.lessonCopy}><span className={styles.lessonIcon} aria-hidden="true">{done?<CheckCircle2 size={23}/>:ready?<BookOpen size={23}/>:<Lock size={23}/>}</span><div><h3>{/^\s*\d/.test(lesson.title)?lesson.title:`${number(index+1)}. ${lesson.title}`}</h3><div className={styles.meta}>{done&&<span>{txt('مكتمل','Completed')}</span>}{seconds>0&&<span><Clock size={15} aria-hidden="true"/>{number(Math.ceil(seconds/60))} {txt('دقيقة','min')}</span>}</div>{!ready&&<p className={styles.scheduled}>{txt(expired?'انتهت إتاحة الدرس:':'متاح من:',expired?'Lesson closed:':'Available from:')} {formatEgyptDateTime(expired?lesson.cutOffDate:lesson.publishDate,language)}</p>}</div></div>{ready?<Link className={lesson.id===next?.id&&!done?frame.primary:frame.secondary} href={href(lesson)}>{txt(done?'مراجعة الدرس':lesson.id===next?.id&&percentage>0?'تابع من هنا':'افتح الدرس',done?'Review lesson':lesson.id===next?.id&&percentage>0?'Continue here':'Open lesson')}</Link>:<span className={styles.unavailable}>{txt(expired?'مغلق':'لم يبدأ',expired?'Closed':'Upcoming')}</span>}</li>;
      })}</ol></details>)}</div>:<div className={`${frame.panel} ${styles.empty}`}><BookOpen size={35} aria-hidden="true"/><h2>{txt('لم تُنشر دروس لهذا المقرر بعد','No published lessons yet')}</h2><p>{txt('ارجع إلى مقرراتك لاختيار درس آخر.','Return to your courses to choose another lesson.')}</p><Link className={frame.secondary} href="/courses">{txt('كل المقررات','All courses')}</Link></div>}
    </>}</div>
  </div></DashboardLayout>;
}
