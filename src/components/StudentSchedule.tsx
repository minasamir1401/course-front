"use client";
import { useEffect,useState } from 'react';
import Link from 'next/link';
import { CalendarDays,Clock3,RefreshCw,ArrowUpRight } from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import { StudentFeedback } from './student/StudentPageHeader';
import Image from 'next/image';
import SubjectArtwork from './student/SubjectArtwork';
import styles from './StudentSchedule.module.css';
import frame from './student/LearningPage.module.css';
import { API_URL,apiFetch } from '@/lib/api';
import { egyptDay,addCalendarDays,formatEgyptDate,formatEgyptDateTime } from '@/lib/egyptTime';
import { useLanguage } from '@/contexts/LanguageContext';
export default function StudentSchedule({assignments=false}:{assignments?:boolean}){
 const {language}=useLanguage();const ar=language==='ar';const txt=(a:string,e:string)=>ar?a:e;
 const [from,setFrom]=useState(()=>egyptDay()),[to,setTo]=useState(()=>addCalendarDays(egyptDay(),6)),[preset,setPreset]=useState('week');
 const [data,setData]=useState<any>(null),[error,setError]=useState(''),[reload,setReload]=useState(0),[status,setStatus]=useState('');
 useEffect(()=>{const controller=new AbortController();setData(null);setError('');
 apiFetch(API_URL+'/workspace/'+(assignments?'assignments':'calendar?'+new URLSearchParams({from,to})),{signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error();const json=await response.json();if(!controller.signal.aborted)setData(json);}).catch(()=>{if(!controller.signal.aborted)setError(txt('تعذر تحميل المواعيد. تحقق من اتصالك وحاول مرة أخرى.','Could not load your schedule. Check your connection and retry.'));});return()=>controller.abort();},[assignments,from,to,reload,language]);
 const labels:Record<string,string[]>={EXAM_START:['بداية امتحان','Exam opens'],EXAM_END:['إغلاق امتحان','Exam closes'],LESSON_START:['إتاحة درس','Lesson opens'],LESSON_END:['إغلاق درس','Lesson closes'],AVAILABLE:['متاح الآن','Available now'],UPCOMING:['لم يبدأ','Upcoming'],CLOSED:['انتهى الموعد','Closed'],COMPLETED:['تم التسليم','Submitted']};
 const rows:any[]=(assignments?data?.tasks:data?.events)||[];
 const order:Record<string,number>={AVAILABLE:0,CLOSED:1,UPCOMING:2,COMPLETED:3};
 const visible=rows.filter(item=>!assignments||!status||item.status===status).sort((a,b)=>assignments?(order[a.status]-order[b.status]||String(a.dueAt||'9999').localeCompare(String(b.dueAt||'9999'))):String(a.at).localeCompare(String(b.at)));
 const groups:Record<string,any[]>={}; visible.forEach(item=>{const key=assignments?item.status:item.day||egyptDay(item.at);(groups[key]||=[]).push(item);});
 function choose(value:string){const today=egyptDay();setPreset(value);if(value==='month'){const start=today.slice(0,7)+'-01';const date=new Date(start+'T12:00Z');date.setUTCMonth(date.getUTCMonth()+1);setFrom(start);setTo(addCalendarDays(date.toISOString().slice(0,10),-1));}else{setFrom(today);setTo(addCalendarDays(today,value==='today'?0:6));}}
 const taskLabel=(item:any)=>item.kind==='LESSON'?txt('افتح التدريب داخل الدرس','Open lesson practice'):item.kind==='EXAM'||item.kind?.startsWith('EXAM')?txt('تفاصيل الامتحان','Exam details'):txt('افتح الدرس','Open lesson');
 return <DashboardLayout mainClassName={frame.main}><div className={styles.page} dir={ar?'rtl':'ltr'}>
 <header className={styles.hero}><div><h1><span><CalendarDays size={26}/></span>{txt(assignments?'الواجبات والتدريبات':'تقويمك الدراسي',assignments?'Assignments & practice':'Your academic calendar')}</h1><p>{txt('مواعيد دروسك وامتحاناتك مرتبة حسب اليوم، بتوقيت مصر.','Your lessons and exams grouped by day, in Egypt time.')}</p></div><Image src="/klevro/illustrations/ui/calendar-hero.png" width={300} height={185} alt="" priority/></header>
 <div className={styles.filters}><div className={styles.filterTop}>{!assignments&&<div className={styles.presets} aria-label={txt('فترة التقويم','Calendar period')}>{[['today',txt('اليوم','Today')],['week',txt('٧ أيام','7 days')],['month',txt('الشهر','Month')]].map(([value,label])=><button key={value} aria-pressed={preset===value} onClick={()=>choose(value)}>{label}</button>)}</div>}<Link className={styles.action} href={assignments?'/calendar':'/exams'}><CalendarDays size={15}/>{txt(assignments?'عرض التقويم':'عرض الامتحانات',assignments?'View calendar':'View exams')}</Link></div>
 <div className={styles.fields}>{assignments?<label className={styles.field}><span>{txt('حالة الواجب','Assignment status')}</span><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">{txt('كل الحالات','All statuses')}</option>{['AVAILABLE','CLOSED','UPCOMING','COMPLETED'].map(value=><option key={value} value={value}>{labels[value][ar?0:1]}</option>)}</select></label>:<><label className={styles.field}><span>{txt('من يوم','From')}</span><input type="date" value={from} max={to} onChange={e=>{if(e.target.value){setFrom(e.target.value);setPreset('custom');}}}/></label><label className={styles.field}><span>{txt('إلى يوم — شامل','Through — inclusive')}</span><input type="date" value={to} min={from} onChange={e=>{if(e.target.value){setTo(e.target.value);setPreset('custom');}}}/></label></>}<button className={styles.action} onClick={()=>setReload(v=>v+1)}><RefreshCw size={15}/>{txt('تحديث','Refresh')}</button></div></div>
 {error&&<StudentFeedback title={error} retry={()=>setReload(v=>v+1)}/>}
 {!data&&!error&&<p role="status" className={styles.empty}>{txt('جارٍ تحميل المواعيد…','Loading schedule…')}</p>}
 {data&&<>{Object.entries(groups).map(([group,items])=><section key={group} className={styles.group}><h2><CalendarDays size={16}/>{assignments?labels[group]?.[ar?0:1]:formatEgyptDate(group+'T12:00Z',language,{weekday:'long',year:'numeric',month:'long',day:'numeric'})}<span>({items.length})</span></h2><div className={styles.events}>{items.map(item=><article key={item.id} className={styles.card}><div className={styles.copy}><span className={styles.kind} data-kind={item.kind}>{labels[assignments?item.status:item.kind]?.[ar?0:1]}</span><h3><bdi>{item.title}</bdi></h3><p><Clock3 size={12}/><span>{assignments&&!item.dueAt?txt('لا يوجد موعد إغلاق محدد','No closing date set'):formatEgyptDateTime(assignments?item.dueAt:item.at,language)} · {txt('توقيت مصر','Egypt time')}</span></p><Link className={styles.action} href={item.href}>{taskLabel(item)}<ArrowUpRight size={14}/></Link></div><SubjectArtwork subject={item.subject} title={item.courseTitle||item.title} coverImage={item.coverImage} className={styles.art}/></article>)}</div></section>)}
 {!visible.length&&<div className={styles.empty}><CalendarDays/><p>{txt(assignments?'لا توجد واجبات منشورة تطابق اختيارك.':'لا توجد مواعيد منشورة خلال هذه الفترة.',assignments?'No published assignments match this filter.':'No published events in this period.')}</p>{status&&<button className={styles.action} onClick={()=>setStatus('')}>{txt('كل الواجبات','All assignments')}</button>}<Link className={styles.action} href="/courses">{txt('تابع دروسك','Continue learning')}</Link></div>}</>}
 </div></DashboardLayout>;
}
