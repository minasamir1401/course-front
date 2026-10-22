"use client";
import { useState } from 'react';
import Image from 'next/image';
import { getFullImageUrl } from '@/lib/api';
import { shouldSkipImageOptimization } from '@/lib/imageDisplay';
import { getSubjectArtwork, parseSubjects } from '@/lib/subjectArtwork';
import styles from './SubjectArtwork.module.css';

type Props={subject?:unknown;title?:string;coverImage?:string|null;variant?:'cover'|'thumbnail'|'preview';className?:string;priority?:boolean};
export default function SubjectArtwork({subject,title='',coverImage,variant='cover',className='',priority=false}:Props) {
  const artwork=getSubjectArtwork(subject,title);
  const custom=coverImage?(coverImage.startsWith('/klevro/')?coverImage:getFullImageUrl(coverImage)):null;
  const [failedSource,setFailedSource]=useState<string|null>(null);
  const src=custom&&custom!==failedSource?custom:artwork.src;
  const isCustom=src===custom;
  return <div className={`${styles.artwork} ${styles[variant]} ${className}`} data-subject={artwork.key} data-custom-cover={isCustom?'true':'false'}>
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
