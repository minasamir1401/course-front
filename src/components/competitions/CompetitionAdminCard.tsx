'use client';
import Link from 'next/link';
import { BookOpen, Eye, GraduationCap, Pencil, School, Trophy } from 'lucide-react';
import { studentGradeLabel, studentSubjectLabel } from '@/lib/studentLocale';
import styles from './CompetitionAuthoring.module.css';

export default function CompetitionAdminCard({ room, base, ar }: { room: any; base: string; ar: boolean }) {
  const text = (a: string, e: string) => ar ? a : e;
  return <article className={styles.card} aria-labelledby={'competition-title-' + room.id}>
    <div className={styles.row}><span className={styles.tag}>{({ DRAFT: text('مسودة', 'Draft'), OPEN: text('منشورة', 'Published'), FINISHED: text('نتائج معتمدة', 'Finalised'), CANCELLED: text('ملغاة', 'Cancelled') } as Record<string, string>)[room.status]}</span><Trophy size={23}/></div>
    <h2 id={'competition-title-' + room.id} style={{ marginTop: 15 }}>{ar ? room.title : room.titleEn || room.title}</h2>
    <span className={styles.tag}>{room.schoolId ? text('خاصة بمدرسة محددة', 'School competition') : text('عامة لكل مدارس المنصة', 'All platform schools')}</span>
    <dl className={styles.audienceSummary}>
      <div><dt><School size={16}/>{text('المدرسة المستهدفة', 'Target school')}</dt><dd>{room.schoolId ? room.schoolName || text('مدرسة غير متاحة', 'School unavailable') : text('كل مدارس المنصة', 'All platform schools')}</dd></div>
      <div><dt><GraduationCap size={16}/>{text('الصف المستهدف', 'Target grade')}</dt><dd>{room.grade ? studentGradeLabel(room.grade, ar ? 'ar' : 'en') : text('كل الصفوف', 'All grades')}</dd></div>
      <div><dt><BookOpen size={16}/>{text('المادة', 'Subject')}</dt><dd>{room.subject ? studentSubjectLabel(room.subject, ar ? 'ar' : 'en') : text('بدون مادة محددة', 'No subject selected')}</dd></div>
    </dl>
    <p className={styles.muted}>{room.questionCount} {text('سؤال', 'questions')} · {room.participants} {text('مشارك', 'players')}</p>
    <div className={styles.actions} style={{ marginTop: 16 }}>
      <Link className={styles.secondary} href={base + '/competitions/' + room.id + '/preview'}><Eye size={16}/>{text('معاينة كطالب', 'Preview as student')}</Link>
      <Link className={styles.secondary} href={base + '/competitions/' + room.id + '/edit'}><Pencil size={16}/>{text('تعديل المسابقة', 'Edit competition')}</Link>
      <Link className={styles.primary} href={base + '/competitions/' + room.id + '/results'}><Eye size={16}/>{text('نتائج الطلاب', 'Student results')}</Link>
    </div>
  </article>;
}
