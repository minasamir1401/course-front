"use client";
import { useState } from 'react';
import Image from 'next/image';
import { getFullImageUrl } from '@/lib/api';
import { shouldSkipImageOptimization } from '@/lib/imageDisplay';
import { getSubjectArtwork, parseSubjects } from '@/lib/subjectArtwork';
import { getExamArtwork } from '@/lib/examArtwork';
import { BookOpen, Compass, FlaskConical, GraduationCap, Lightbulb, Target } from 'lucide-react';
import styles from './SubjectArtwork.module.css';

type Props={subject?:unknown;title?:string;coverImage?:string|null;variant?:'cover'|'thumbnail'|'preview';className?:string;priority?:boolean;examKey?:string};
export default function SubjectArtwork({subject,title='',coverImage,variant='cover',className='',priority=false,examKey}:Props) {
  const artwork=getSubjectArtwork(subject,title);
  const examArt=examKey?getExamArtwork(examKey,subject):null;
  const custom=coverImage?(coverImage.startsWith('/klevro/')?coverImage:getFullImageUrl(coverImage)):null;
  const [failedSource,setFailedSource]=useState<string|null>(null);
  const src=custom&&custom!==failedSource?custom:(examArt?.src||artwork.src);
  const isCustom=src===custom;
  const Motif = [BookOpen, Compass, FlaskConical, GraduationCap, Lightbulb, Target][examArt?.motif||0];
  return <div className={`${styles.artwork} ${styles[variant]} ${examArt&&!isCustom?styles.exam:''} ${className}`} data-subject={artwork.key} data-custom-cover={isCustom?'true':'false'} data-exam-artwork={examKey} data-artwork-fingerprint={examArt?.fingerprint}
    style={examArt&&!isCustom?{background:`linear-gradient(${examArt.angle}deg,${examArt.from},#fff 55%,${examArt.to})`,color:examArt.accent}:undefined}>
    {examArt&&!isCustom&&<><span className={styles.orbit} aria-hidden="true" style={{transform:`translate(${examArt.offset}%,${-examArt.offset}%) rotate(${examArt.angle}deg)`}}/><span className={styles.motif} aria-hidden="true"><Motif strokeWidth={1.7}/></span></>}
    <Image src={src} alt="" aria-hidden="true" fill preload={priority} sizes={variant==='thumbnail'?'84px':variant==='preview'?'180px':'(max-width: 480px) 100vw, (max-width: 1000px) 50vw, 25vw'} className={isCustom?styles.uploaded:styles.illustration} unoptimized={shouldSkipImageOptimization(src)} onError={isCustom?()=>setFailedSource(src):undefined}/>
  </div>;
}
export function SubjectPreview({subject,title='',coverImage,language,allowCustomCover=true}:{subject?:unknown;title?:string;coverImage?:string|null;language:string;allowCustomCover?:boolean}) {
  const ar=language==='ar';const values=parseSubjects(subject);const main=getSubjectArtwork(subject,title);
  return <div className={styles.previewPanel} dir={ar?'rtl':'ltr'}>
    <SubjectArtwork subject={subject} title={title} coverImage={coverImage} variant="preview"/>
    <div><strong>{ar?'الغلاف الذي يظهر للطالب':'Student cover preview'}</strong><p>{coverImage?(ar?'غلافك المرفوع':'Your uploaded cover'):(values.length?values.join('، '):(ar?main.ar:main.en))}</p><small>{ar?'تظهر صورة المادة تلقائيًا في المقررات والامتحانات والصفحة الرئيسية.':'Subject artwork appears automatically in courses, exams and the dashboard.'}{allowCustomCover&&(ar?' يمكنك رفع غلاف خاص بدلًا منها.':' Upload a cover to use your own.')}</small>{values.length>1&&!coverImage&&<small>{ar?'عند اختيار أكثر من مادة، يُستخدم غلاف أول مادة معروفة.':'For multiple subjects, the first recognized subject supplies the cover.'}</small>}</div>
  </div>;
}
