"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Clock3, FileQuestion, RefreshCw, CalendarDays, MapPin, Play, BarChart3, ArrowUpRight, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { StudentFeedback } from '@/components/student/StudentPageHeader';
import ReferenceIcon from '@/components/student/ReferenceIcon';
import SubjectArtwork from '@/components/student/SubjectArtwork';
import { API_URL, apiFetch } from '@/lib/api';
import { studentSubjectLabel } from '@/lib/studentLocale';
import { getSubjectArtwork, parseSubjects, normalizeSubject } from '@/lib/subjectArtwork';
import { getStudentExamTitle, getStudentExamDuration } from '@/lib/examModuleView';
import { studentExamAvailability, examAvailabilityLabel, latestStudentSubmission, type ExamAvailability } from '@/lib/studentExamAvailability';
import { formatEgyptDateTime } from '@/lib/egyptTime';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './ExamsListView.module.css';

export default function ExamsListView() {
  const {language}=useLanguage();const ar=language==='ar';const txt=(a:string,e:string)=>ar?a:e;
  const [exams,setExams]=useState<any[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(false),[reload,setReload]=useState(0);
  const [search,setSearch]=useState(''),[status,setStatus]=useState(''),[now,setNow]=useState(Date.now());
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{
    const controller=new AbortController();setLoading(true);setError(false);
    apiFetch(API_URL+'/exams',{signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error();const data=await response.json();if(!controller.signal.aborted)setExams(Array.isArray(data)?data:[]);}).catch(()=>{if(!controller.signal.aborted)setError(true);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[reload]);
  const visible=exams.filter(exam=>normalizeSubject(getStudentExamTitle(exam,language)+' '+studentSubjectLabel(exam.subjects||exam.subject||exam.category,language)+' '+parseSubjects(exam.subjects||exam.subject||exam.category).join(' ')).includes(normalizeSubject(search))&&(!status||studentExamAvailability(exam,exam.submissions||[],undefined,now)===status));
  const number=(value:number)=>value.toLocaleString(ar?'ar-EG':'en-GB');
  const reset=()=>{setSearch('');setStatus('');};
  return <DashboardLayout mainClassName={styles.main}><div className={styles.page} dir={ar?'rtl':'ltr'}>
    <header className={styles.hero}><div className={styles.wave} aria-hidden="true"/><div className={styles.heroCopy}>
      <Link href="/dashboard" className={styles.breadcrumb}>{txt('الرئيسية','Home')}{ar?<ChevronLeft size={14}/>:<ChevronRight size={14}/>}<span>{txt('الامتحانات','Exams')}</span></Link>
      <div className={styles.title}><span><ReferenceIcon name="layers" size={27}/></span><h1>{txt('الامتحانات والتقييمات','Exams & assessments')}</h1></div>
      <p>{txt('راجع المواعيد والمدة والمحاولات قبل البدء. جميع المواعيد بتوقيت مصر.','Check dates, duration and attempts before starting. All dates use Egypt time.')}</p>
    </div><Image src="/klevro/illustrations/ui/assessment-hero.png" alt="" aria-hidden="true" width={960} height={480} preload sizes="(max-width: 600px) 220px, 360px" className={styles.heroArt}/></header>
    <section className={styles.examPanel} aria-label={txt('قائمة الامتحانات','Exam list')}>
      <div className={styles.toolbar}><label className={styles.search}><Search size={17} aria-hidden="true"/><input value={search} onChange={e=>setSearch(e.target.value)} type="search" aria-label={txt('ابحث عن امتحان','Search exams')} placeholder={txt('ابحث عن امتحان أو مادة…','Search exams or subjects…')}/></label><label className={styles.statusFilter}><span>{txt('الحالة','Status')}</span><select aria-label={txt('الحالة','Status')} value={status} onChange={e=>setStatus(e.target.value)}><option value="">{txt('كل الحالات','All statuses')}</option>{(['AVAILABLE','UPCOMING','CLOSED','COMPLETED'] as ExamAvailability[]).map(value=><option key={value} value={value}>{examAvailabilityLabel(value,ar)}</option>)}</select></label><div className={styles.toolbarActions}>{(search||status)&&<button onClick={reset}>{txt('مسح الفلاتر','Clear filters')}</button>}<Link href="/calendar"><CalendarDays size={16}/>{txt('مواعيد الامتحانات','Exam calendar')}</Link></div></div>
      {error&&<StudentFeedback title={txt('تعذر تحميل الامتحانات. حاول مرة أخرى.','Could not load exams. Please retry.')} retry={()=>setReload(value=>value+1)}/>}
      <p className={styles.resultCount} role="status">{error&&!exams.length?'—':loading&&!exams.length?txt('جارٍ تحميل الامتحانات…','Loading exams…'):`${number(visible.length)} ${txt('امتحان','exams')}`}</p>
      {loading&&!exams.length?<div className={styles.skeletons} aria-hidden="true">{[0,1,2].map(value=><div key={value}/>)}</div>:visible.length?<div className={styles.list}>{visible.map(exam=>{
        const submissions=exam.submissions||[],state=studentExamAvailability(exam,submissions,undefined,now),last=latestStudentSubmission(submissions),title=getStudentExamTitle(exam,language),subject=exam.subjects||exam.subject||exam.category,artwork=getSubjectArtwork(subject,title);
        const sections=exam.modules?.length>0;
        const questions=exam.questionsCount??exam._count?.questions??exam.questions?.length;
        const attempts=Number(exam.attemptsAllowed??1);const opens=exam.startDate||exam.publishDate,closes=exam.endDate||exam.cutOffDate;
        const details=`/exams/${exam.id}/details`;
        const stateArt=state==='COMPLETED'?'exam-completed':state==='AVAILABLE'?'exam-available':'exam-upcoming';
        return <article key={exam.id} className={styles.card} data-exam-state={state}>
          <div className={styles.visual}><SubjectArtwork subject={subject} title={title} coverImage={artwork.key==='general'?`/klevro/illustrations/ui/${stateArt}.png`:undefined}/><span className={styles.badge} data-state={state}><span aria-hidden="true"/>{examAvailabilityLabel(state,ar)}</span></div>
          <div className={styles.cardContent}><div className={styles.cardHeading}><span className={styles.examIcon} data-state={state}><ReferenceIcon name={state==='UPCOMING'?'file-clock':state==='COMPLETED'?'file-text':'clipboard'} size={26}/></span><div><h2><Link href={details}><bdi>{title}</bdi></Link></h2>{parseSubjects(subject).length>0&&<p className={styles.subject}>{artwork.key==='general'?parseSubjects(subject).join('، '):ar?artwork.ar:artwork.en}</p>}</div></div>
            <div className={styles.chips}><span><Clock3 size={15} aria-hidden="true"/>{number(getStudentExamDuration(exam))} {txt('دقيقة','min')}</span>{questions!=null&&<span><FileQuestion size={15} aria-hidden="true"/>{number(questions)} {txt('سؤال','questions')}</span>}{sections?<span><Layers size={15} aria-hidden="true"/>{txt('اختبارات داخل الأقسام','Exams in sections')}</span>:<span><RefreshCw size={14} aria-hidden="true"/>{txt('المحاولات:','Attempts:')} <bdi dir="ltr">{number(submissions.length)} / {attempts>0&&attempts!==999?number(attempts):txt('غير محدودة','Unlimited')}</bdi></span>}</div>
            <div className={styles.cardBottom}><div className={styles.dates}>{opens&&<p><CalendarDays size={14} aria-hidden="true"/><span>{txt('يفتح:','Opens:')} {formatEgyptDateTime(opens,language)}</span></p>}{closes&&<p><CalendarDays size={14} aria-hidden="true"/><span>{txt('يغلق:','Closes:')} {formatEgyptDateTime(closes,language)}</span></p>}{(opens||closes)&&<p><MapPin size={14} aria-hidden="true"/>{txt('بتوقيت مصر','Egypt time')}</p>}{!opens&&!closes&&<p className={styles.noDates}>{txt('بدون موعد فتح أو إغلاق محدد','No scheduled opening or closing date')}</p>}<p className={styles.stateNote}>{state==='COMPLETED'?txt('استخدمت المحاولات المسموح بها.','You have used all available attempts.'):state==='UPCOMING'?txt('ستتمكن من البدء عند موعد الإتاحة.','You can start when the exam opens.'):state==='CLOSED'?txt('انتهت فترة استقبال الإجابات.','The submission period has ended.'):txt('راجع التفاصيل ثم ابدأ عندما تكون مستعدًا.','Check the details and start when you are ready.')}</p></div>
              <div className={styles.cardActions}>{state==='AVAILABLE'&&<Link href={details} className={styles.primary}><Play size={15} aria-hidden="true"/>{sections?txt('عرض الأقسام والتفاصيل','View sections & details'):txt('ابدأ الاختبار','Start exam')}</Link>}{last&&<Link href={`/exams/result/${last.id}`} className={styles.secondary}><BarChart3 size={16} aria-hidden="true"/>{txt('نتيجة آخر محاولة','Latest result')}</Link>}{state!=='AVAILABLE'&&<Link href={details} className={styles.detailsLink}>{txt('عرض التفاصيل','View details')}<ArrowUpRight size={14} aria-hidden="true"/></Link>}</div>
            </div>
          </div>
        </article>;
      })}</div>:!error&&<div className={styles.empty}><ReferenceIcon name="clipboard" size={52} variant="duotone"/><h2>{txt(exams.length?'لا توجد امتحانات تطابق البحث':'لا توجد امتحانات منشورة لك حاليًا',exams.length?'No matching exams':'No published exams yet')}</h2><p>{txt(exams.length?'جرّب تغيير البحث أو الحالة.':'ستظهر الاختبارات هنا بمجرد إتاحتها لك من المدرسة.',exams.length?'Try another search or status.':'Your school’s exams will appear here when assigned.')}</p>{exams.length?<button onClick={reset}>{txt('عرض كل الامتحانات','Show all exams')}</button>:<Link href="/courses">{txt('تابع دروسك','Continue learning')}</Link>}</div>}
    </section><Link href="/reports" className={styles.reports}><BarChart3 size={17}/>{txt('عرض النتائج والمحاولات السابقة','View results & previous attempts')}<ArrowUpRight size={15}/></Link>
  </div></DashboardLayout>;
}
