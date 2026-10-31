"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Clock, FileText, Layers, RefreshCw, CalendarDays, Play, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { StudentFeedback } from '@/components/student/StudentPageHeader';
import SubjectArtwork from '@/components/student/SubjectArtwork';
import { examArtworkKey } from '@/lib/examArtwork';
import LearningBackdrop from '@/components/student/LearningBackdrop';
import { API_URL, apiFetch } from '@/lib/api';
import { getStudentExamTitle, getStudentExamDuration } from '@/lib/examModuleView';
import { studentExamAvailability, latestStudentSubmission, examAvailabilityLabel } from '@/lib/studentExamAvailability';
import { formatEgyptDateTime } from '@/lib/egyptTime';
import { useLanguage } from '@/contexts/LanguageContext';
import frame from '@/components/student/LearningPage.module.css';
import styles from './ExamDetails.module.css';

type Entry={child:any;moduleId?:string;sectionTitle?:string;section?:any};
export default function ExamDetailsPage() {
  const {id}=useParams();const {language}=useLanguage();const ar=language==='ar';const txt=(a:string,e:string)=>ar?a:e;
  const [exam,setExam]=useState<any>(null),[loading,setLoading]=useState(true),[error,setError]=useState(false),[reload,setReload]=useState(0),[now,setNow]=useState(Date.now());
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{const controller=new AbortController();setLoading(true);setError(false);setExam(null);
    apiFetch(API_URL+'/exams/'+id+'?includeQuestions=false',{signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error();const data=await response.json();if(!controller.signal.aborted)setExam(data);}).catch(()=>{if(!controller.signal.aborted)setError(true);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();
  },[id,reload]);
  const clean=(title:string)=>(title||'').replace(/(?:الموديول|الموديل|المديول|موديول|مديول)\s+/g,'القسم ');
  const number=(value:number)=>value.toLocaleString(ar?'ar-EG':'en-GB');
  const roots=(exam?.modules||[]).filter((item:any)=>!item.parentModuleId);
  const childrenOf=(section:any)=>Array.from(new Map([...(section.subModules||[]),...(exam?.modules||[]).filter((item:any)=>item.parentModuleId===section.id)].map((item:any)=>[item.id,item])).values()) as any[];
  const entriesOf=(section:any):Entry[]=>section.subExams?.length?section.subExams.map((child:any)=>({child,moduleId:section.id,sectionTitle:section.title,section})):(section.questionsCount||section._count?.questions||section.questions?.length)?[{child:null,moduleId:section.id,sectionTitle:section.title}]:[];
  const keyOf=(entry:Entry)=>entry.child?.id||entry.moduleId||exam?.id;
  function entryState(entry:Entry){const submissions=(exam.submissions||[]).filter((item:any)=>entry.child?item.subExamId===entry.child.id:!item.subExamId);return studentExamAvailability(entry.child||exam,submissions,entry.child?exam:undefined,now);}
  function attemptCard(entry:Entry){
    const {child,moduleId,sectionTitle,section}=entry;
    const submissions=(exam.submissions||[]).filter((item:any)=>child?item.subExamId===child.id:!item.subExamId),state=entryState(entry),last=latestStudentSubmission(submissions);
    const href='/exams/'+exam.id+(child?'?subExamId='+child.id:moduleId?'?moduleId='+moduleId:'');
    const opens=child?.publishDate||exam.startDate,closes=child?.cutOffDate||exam.endDate,attempts=child?.attemptsAllowed??exam.attemptsAllowed;
    const questions=child?.questionsCount??child?._count?.questions??child?.questions?.length??(moduleId?(section?.questionsCount??section?._count?.questions??section?.questions?.length):exam.questionsCount)??exam._count?.questions??(!moduleId?exam.questions?.length:undefined);
    const title=clean(child?.title||sectionTitle||exam.title);
    return <article key={keyOf(entry)} className={styles.attemptCard} data-attempt-state={state}>
      <div className={styles.attemptContent}><div className={styles.attemptHeading}><SubjectArtwork examKey={examArtworkKey(exam.id,child?.id||moduleId)} coverImage={child?.coverImage||exam.coverImage} subject={exam.subjects||exam.category} title={title} variant="thumbnail" className={styles.attemptThumb}/><h3>{title}</h3><span className={styles.state} data-state={state}>{examAvailabilityLabel(state,ar)}</span></div>
        <div className={styles.chips}><span><Clock size={16} aria-hidden="true"/>{number(getStudentExamDuration(exam,child?.id||null,moduleId))} {txt('دقيقة','min')}</span><span><FileText size={16} aria-hidden="true"/>{questions==null?'—':number(questions)} {txt('سؤال','questions')}</span><span><RefreshCw size={16} aria-hidden="true"/>{txt('المحاولات:','Attempts:')} <bdi>{number(submissions.length)} / {attempts&&attempts!==999?number(attempts):txt('غير محدودة','Unlimited')}</bdi></span></div>
        <div className={styles.dates}>{opens&&<p><CalendarDays size={15} aria-hidden="true"/>{txt('يفتح:','Opens:')} {formatEgyptDateTime(opens,language)}</p>}{closes&&<p><CalendarDays size={15} aria-hidden="true"/>{txt('يغلق:','Closes:')} {formatEgyptDateTime(closes,language)}</p>}</div>
        {state!=='AVAILABLE'&&<p className={styles.note}>{state==='UPCOMING'?txt('ستتمكن من البدء عند موعد الإتاحة.','You can start when the exam opens.'):state==='CLOSED'?txt('انتهت فترة استقبال الإجابات.','The submission period has ended.'):txt('استخدمت المحاولات المسموح بها.','You have used all available attempts.')}</p>}
        <div className={styles.actions}>{state==='AVAILABLE'&&<Link className={frame.primary} href={href}><Play size={16} aria-hidden="true"/>{txt(submissions.length?'محاولة جديدة':'ابدأ الاختبار',submissions.length?'New attempt':'Start exam')}</Link>}{last&&<Link className={frame.secondary} href={'/exams/result/'+last.id}><BarChart3 size={16} aria-hidden="true"/>{txt('نتيجة آخر محاولة','Latest result')}</Link>}</div>
      </div>
    </article>;
  }
  function nestedSection(section:any,ancestors=new Set<string>()):React.ReactNode {
    if(ancestors.has(section.id))return null;
    const visited=new Set(ancestors);visited.add(section.id);const entries=entriesOf(section),children=childrenOf(section);
    return <section key={section.id} className={styles.nestedSection}><h2>{clean(section.title)}</h2>{entries.map(entry=>attemptCard(entry))}{children.map(child=>nestedSection(child,visited))}{!entries.length&&!children.length&&<p className={styles.emptySection}>{txt('لا توجد اختبارات منشورة في هذا القسم.','No published exams in this section.')}</p>}</section>;
  }
  return <DashboardLayout mainClassName={frame.main}><div className={`${frame.shell} ${styles.shell}`} dir={ar?'rtl':'ltr'}><LearningBackdrop/>
    <header className={`${frame.hero} ${styles.hero}`}><div className={styles.heroCopy}><Link className={frame.back} href="/exams">{txt('الامتحانات','Exams')}{ar?<ChevronLeft size={16}/>:<ChevronRight size={16}/>}</Link><div className={styles.heroTitle}><span><Layers size={29}/></span><h1>{exam?clean(getStudentExamTitle(exam)):txt('تفاصيل الامتحان','Exam details')}</h1></div><p className={frame.description}>{txt('راجع المواعيد والمدة والمحاولات قبل البدء.','Check dates, duration and attempts before starting.')}</p></div>{exam&&<SubjectArtwork examKey={String(exam.id)} coverImage={exam.coverImage} subject={exam.subjects||exam.category} title={getStudentExamTitle(exam)} className={frame.heroArt} priority/>}</header>
    <div className={styles.content}>{loading?<p role="status" className={frame.status}>{txt('جارٍ تحميل التفاصيل…','Loading exam details…')}</p>:error?<StudentFeedback title={txt('تعذر تحميل تفاصيل الامتحان. حاول مرة أخرى.','Could not load exam details. Please retry.')} retry={()=>setReload(value=>value+1)}/>:exam&&<div className={styles.examPanel}>{roots.length?roots.map((section:any)=>{
      const entries=entriesOf(section),nested=childrenOf(section);
      return <section key={section.id} className={styles.rootSection}>{roots.length>1&&<h2 className={styles.rootTitle}>{clean(section.title)}</h2>}<div className={`${styles.columns} ${!nested.length?styles.single:!entries.length?styles.nestedOnly:''}`}><div className={styles.mainList}>{entries.map(entry=>attemptCard(entry))}{!entries.length&&!nested.length&&<p className={styles.emptySection}>{txt('لا توجد اختبارات منشورة في هذا القسم.','No published exams in this section.')}</p>}</div>{nested.length>0&&<div className={styles.sideList}>{nested.map(child=>nestedSection(child,new Set([section.id])))}</div>}</div></section>;
    }):attemptCard({child:null})}</div>}</div>
  </div></DashboardLayout>;
}
