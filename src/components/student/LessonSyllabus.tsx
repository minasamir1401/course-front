"use client";
import { BookOpen, ArrowLeft, ArrowRight, Lock } from 'lucide-react';
import styles from './LessonSyllabus.module.css';
type Lesson={id:string;title:string;publishDate?:string;cutOffDate?:string};
export default function LessonSyllabus({lessons,lessonId,courseTitle,language,onNavigate,isAvailable}:{lessons:Lesson[];lessonId:string;courseTitle:string;language:string;onNavigate:(lesson:Lesson)=>void;isAvailable:(lesson:Lesson)=>boolean}) {
  const ar=language==='ar';const txt=(a:string,e:string)=>ar?a:e;const index=lessons.findIndex(lesson=>lesson.id===lessonId);
  const previous=index>0?lessons[index-1]:undefined,next=index>=0?lessons[index+1]:undefined;
  const number=(value:number)=>value.toLocaleString(ar?'ar-EG':'en-GB');
  return <section className={styles.syllabus} aria-labelledby="lesson-syllabus-title" data-lesson-syllabus>
    <div className={styles.heading}><span className={styles.icon}><BookOpen size={22} aria-hidden="true"/></span><div className={styles.title}><p>{txt('فهرس الدروس','Lesson syllabus')}</p><h2 id="lesson-syllabus-title">{courseTitle||txt('مقررك الدراسي','Your course')}</h2></div>{index>=0&&<span className={styles.count}>{txt(`الدرس ${number(index+1)} من ${number(lessons.length)}`,`Lesson ${number(index+1)} of ${number(lessons.length)}`)}</span>}</div>
    {lessons.length>1&&<label className={styles.choose}><span>{txt('انتقل إلى درس','Jump to a lesson')}</span><select aria-label={txt('اختر درسًا من المقرر','Choose a course lesson')} value={lessonId} onChange={e=>{const selected=lessons.find(lesson=>lesson.id===e.target.value);if(selected)onNavigate(selected);}}>{lessons.map((lesson,position)=><option key={lesson.id} value={lesson.id} disabled={!isAvailable(lesson)}>{number(position+1)}. {lesson.title}</option>)}</select></label>}
    <div className={styles.navigation}>{[{lesson:previous,label:txt('الدرس السابق','Previous lesson'),fallback:txt('أنت في أول درس','You are at the first lesson'),forward:false},{lesson:next,label:txt('الدرس التالي','Next lesson'),fallback:txt('أنت في آخر درس','You are at the last lesson'),forward:true}].map(item=>{
      const enabled=Boolean(item.lesson&&isAvailable(item.lesson));const Arrow=(ar!==item.forward)?ArrowRight:ArrowLeft;
      return <button type="button" key={item.label} className={`${styles.navButton} ${item.forward?styles.next:''}`} disabled={!enabled} onClick={()=>item.lesson&&onNavigate(item.lesson)}><span className={styles.navIcon}>{item.lesson&&!enabled?<Lock size={18} aria-hidden="true"/>:<Arrow size={19} aria-hidden="true"/>}</span><span className={styles.navText}><small>{item.label}{item.lesson&&!enabled&&<b>{txt('غير متاح حاليًا','Not available yet')}</b>}</small><strong>{item.lesson?.title||item.fallback}</strong></span></button>;
    })}</div>
  </section>;
}
