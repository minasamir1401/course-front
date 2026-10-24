"use client";
import Link from 'next/link';
import { Clock3, FileQuestion, BookOpen, Target, Play, LockKeyhole, ChevronLeft, ChevronRight, CheckCircle2, CalendarDays } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import SubjectArtwork from './SubjectArtwork';
import LearningBackdrop from './LearningBackdrop';
import HtmlRenderer from '@/components/HtmlRenderer';
import { formatEgyptDateTime } from '@/lib/egyptTime';
import frame from './LearningPage.module.css';
import styles from './StudentExamIntro.module.css';

type Props={artworkKey?:string;examId:string;title:string;isEn:boolean;setExamLanguage:(language:'ar'|'en')=>void;duration:number;questions:number;type?:string;courseTitle?:string;domain?:string;subject?:unknown;coverImage?:string;description?:string;passwordRequired:boolean;password:string;setPassword:(value:string)=>void;previewPassword?:string;preview:boolean;verifying:boolean;onStart:()=>void;opens?:string;closes?:string};
export default function StudentExamIntro(props:Props){
  const {examId,title,isEn,setExamLanguage,duration,questions,type,courseTitle,domain,subject,coverImage,description,passwordRequired,password,setPassword,previewPassword,preview,verifying,onStart,opens,closes}=props;
  const ar=!isEn;const txt=(a:string,e:string)=>ar?a:e;const number=(value:number)=>value.toLocaleString(ar?'ar-EG':'en-GB');
  const typeLabel=type==='Assignment'?txt('واجب تطبيقي','Assignment'):type==='Quiz'||type==='Exam'||!type?txt('امتحان','Exam'):type;
  const metrics=[{label:txt('مدة الاختبار','Duration'),value:`${number(duration)} ${txt('دقيقة','minutes')}`,Icon:Clock3},{label:txt('عدد الأسئلة','Questions'),value:`${number(questions)} ${txt('سؤال','questions')}`,Icon:FileQuestion},{label:txt('نوع التقييم','Assessment type'),value:typeLabel,Icon:BookOpen},...(domain?[{label:txt('المجال','Domain'),value:domain,Icon:Target}]:[])];
  return <DashboardLayout mainClassName={frame.main}><div className={`${frame.shell} ${styles.shell}`} dir={ar?'rtl':'ltr'}><LearningBackdrop/>
    <div className={styles.topbar}><Link href={`/exams/${examId}/details`} className={frame.back}>{ar?<ChevronRight size={16}/>:<ChevronLeft size={16}/>} {txt('تفاصيل الامتحان','Exam details')}</Link><div className={styles.language} role="group" aria-label={txt('لغة الامتحان','Exam language')}><button type="button" aria-pressed={ar} onClick={()=>setExamLanguage('ar')}>العربية</button><button type="button" aria-pressed={isEn} onClick={()=>setExamLanguage('en')}>English</button></div></div>
    <section className={styles.introCard} aria-labelledby="exam-intro-title"><div className={styles.hero}><div className={styles.heroCopy}><span className={styles.eyebrow}>{preview?txt('وضع المعاينة','Preview mode'):txt('خطوتك التالية','Your next step')} <span aria-hidden="true">·</span> {typeLabel}</span><h1 id="exam-intro-title">{title}</h1>{courseTitle&&<p className={styles.course}>{courseTitle}</p>}<p className={styles.subtitle}>{txt('راجع تفاصيل اختبارك، وابدأ عندما تكون مستعدًا.','Review your assessment and start when you are ready.')}</p></div><SubjectArtwork examKey={props.artworkKey||examId} subject={subject} title={`${courseTitle||''} ${title}`} coverImage={coverImage} className={styles.art} priority/></div>
      <div className={styles.body}><div className={styles.metrics}>{metrics.map(({label,value,Icon})=><div className={styles.metric} key={label}><span><Icon size={21} aria-hidden="true"/></span><div><p>{label}</p><strong>{value}</strong></div></div>)}</div>
        {(opens||closes)&&<div className={styles.dates}>{opens&&<p><CalendarDays size={15} aria-hidden="true"/>{txt('يفتح:','Opens:')} {formatEgyptDateTime(opens,ar?'ar':'en')}</p>}{closes&&<p><CalendarDays size={15} aria-hidden="true"/>{txt('يغلق:','Closes:')} {formatEgyptDateTime(closes,ar?'ar':'en')}</p>}</div>}
        <div className={styles.bottom}><section className={styles.instructions} aria-labelledby="exam-instructions"><h2 id="exam-instructions">{txt('قبل أن تبدأ','Before you begin')}</h2>{description&&<HtmlRenderer html={description} className={styles.description}/>}<ul>{[txt('تأكد من مدة الاختبار وعدد الأسئلة قبل البدء.','Check the duration and number of questions.'),txt('يبدأ المؤقت بعد دخولك إلى الاختبار.','The timer starts after you enter the assessment.'),txt('أكد تسليم إجاباتك قبل إغلاق صفحة الاختبار.','Confirm your answers are submitted before closing the assessment.')].map(item=><li key={item}><CheckCircle2 size={16} aria-hidden="true"/>{item}</li>)}</ul></section>
          <form className={styles.startPanel} onSubmit={e=>{e.preventDefault();onStart();}}>{passwordRequired?<label className={styles.password}><span><LockKeyhole size={16} aria-hidden="true"/>{txt('كلمة سر فتح الامتحان','Exam password')}</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="off" placeholder={txt('أدخل كلمة السر','Enter the password')}/></label>:<div className={styles.ready}><span><Play size={19} aria-hidden="true"/></span><div><strong>{txt('جاهز للبدء؟','Ready to begin?')}</strong><p>{txt('خذ وقتك في قراءة التعليمات.','Take a moment to read the instructions.')}</p></div></div>}{previewPassword&&<p className={styles.previewPassword}>{txt('كلمة المرور في المعاينة:','Preview password:')} <bdi>{previewPassword}</bdi></p>}<button type="submit" className={styles.startButton} disabled={verifying}>{verifying?txt('جاري التحقق...','Verifying...'):txt('ابدأ الامتحان الآن','Start Exam Now')}{ar?<ChevronLeft size={19} aria-hidden="true"/>:<ChevronRight size={19} aria-hidden="true"/>}</button><Link href={`/exams/${examId}/details`} className={styles.backLink}>{txt('الرجوع إلى التفاصيل','Back to details')}</Link></form>
        </div>
      </div>
    </section>
  </div></DashboardLayout>;
}
