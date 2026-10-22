"use client";
import Link from 'next/link';
import { useId } from 'react';
import { Lightbulb, ArrowUpRight, BookOpen, Star, GraduationCap } from 'lucide-react';
import ReferenceIcon from '@/components/student/ReferenceIcon';
import { questionMetadata } from '@/lib/bilingualMetadata';
import styles from './StudentReports.module.css';

function MiniTrend({ values, label, tone }: { values: (number | null)[]; label: string; tone: string }) {
  const gradientId = useId();
  const points = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (!points.length) return null;
  const maximum = Math.max(100, ...points);
  const path = points.map((value, index) => `${index ? 'L' : 'M'}${points.length === 1 ? 4 : 4 + index / (points.length - 1) * 84} ${29 - Math.max(0, value) / maximum * 24}`).join(' ');
  const line = points.length === 1 ? `${path}H88` : path;
  return <svg className={styles.miniTrend} data-tone={tone} viewBox="0 0 92 34" role="img" aria-label={label}><title>{label}</title><defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop stopColor="currentColor" stopOpacity=".38"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs><path d={`${line}L88 34L4 34Z`} fill={`url(#${gradientId})`}/><path d={line} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" /></svg>;
}

export function StudentReportSummary({ stats, report, language }: { stats: any; report: any; language: string }) {
  const ar = language === 'ar'; const txt = (a: string, e: string) => ar ? a : e;
  const number = (value: number | null | undefined, suffix = '') => value == null ? '—' : value.toLocaleString(ar ? 'ar-EG' : 'en-GB', { maximumFractionDigits: 1 }) + suffix;
  const cards = [
    { title: txt('إكمال الدروس', 'Lesson completion'), value: number(stats?.overallCourseProgress, '%'), icon: 'book-open', tone: 'purple', values: (stats?.courseProgresses || []).map((course: any) => course.progressPercent), trend: txt('نسب الإكمال في مقرراتك الحالية', 'Completion across your current courses') },
    { title: txt('متوسط الدرجة', 'Average score'), value: number(report.summary.averageScore, '%'), icon: 'chart-bars', tone: 'cyan', values: report.timeline.map((day: any) => day.averageScore), trend: txt('متوسط درجاتك حسب يوم التسليم', 'Average scores by submission day') },
    { title: txt('نسبة النجاح', 'Pass rate'), value: number(report.summary.passRate, '%'), icon: 'graduation-cap', tone: 'cyan', values: report.timeline.map((day: any) => day.passRate), trend: txt('نسب النجاح حسب يوم التسليم', 'Pass rates by submission day') },
    { title: txt('المحاولات المعتمدة / كل المحاولات', 'Selected / all attempts'), value: `${number(report.summary.selectedAttempts)} / ${number(report.summary.totalAttempts)}`, icon: 'target', tone: 'purple', values: report.timeline.map((day: any) => day.attempts), trend: txt('عدد المحاولات المعتمدة حسب اليوم', 'Selected attempt counts by day') },
  ];
  return <section className={styles.metrics} aria-label={txt('ملخص الأداء', 'Performance summary')}>{cards.map(card => <article className={styles.metricCard} key={card.icon} data-tone={card.tone}><span className={styles.metricIcon}>{card.icon === 'chart-bars' ? <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="currentColor"><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="2" width="4" height="19" rx="1"/></svg> : card.icon === 'graduation-cap' ? <GraduationCap size={24} strokeWidth={2.2} aria-hidden="true"/> : <ReferenceIcon name={card.icon} variant="outline" size={24} />}</span><h2>{card.title}</h2><p><bdi className="student-number">{card.value}</bdi></p><MiniTrend values={card.values} label={card.trend} tone={card.tone} /></article>)}</section>;
}

export function StudentReportNext({ report, language, onReview }: { report: any; language: string; onReview: () => void }) {
  const ar = language === 'ar'; const weak = report.skills.some((skill: any) => skill.sufficientEvidence && skill.correctRate < 60);
  return <section className={styles.next} aria-labelledby="student-next-title"><div className={styles.nextCopy}><h2 id="student-next-title"><span><Lightbulb size={20} aria-hidden="true" /></span>{ar ? 'خطوتك التالية' : 'Your next step'}</h2><p>{weak ? ar ? 'ابدأ بالمهارات التي تحتاج مراجعة أدناه، ثم تدرب داخل دروسك.' : 'Review the skills needing practice below, then continue in your lessons.' : ar ? 'راجع محاولاتك السابقة أو أكمل درسك التالي لبناء تقدمك.' : 'Review previous attempts or continue your next lesson.'}</p><div className={styles.nextActions}><Link href="/courses" className="report-primary">{ar ? 'تابع دروسك' : 'Continue learning'}<ArrowUpRight size={16} aria-hidden="true" /></Link><button type="button" className="report-secondary" onClick={onReview}><BookOpen size={16} aria-hidden="true" />{ar ? 'راجع محاولاتك' : 'Review attempts'}</button></div></div><div className={styles.referenceNextArt} aria-hidden="true"/></section>;
}

export function StudentReportPriority({ report, language, onDetails }: { report: any; language: string; onDetails: () => void }) {
  const ar = language === 'ar';
  const weak = report.skills.filter((skill: any) => skill.sufficientEvidence && skill.correctRate < 60).slice(0, 4);
  return <section className={styles.priority} aria-labelledby="priority-title"><div className={styles.priorityCopy}><h2 id="priority-title"><span><Star size={19} fill="currentColor" aria-hidden="true" /></span>{ar ? 'أولوية المتابعة' : 'Follow-up priority'}</h2><p>{ar ? 'ابدأ بمراجعة المهارات التالية، ثم أعد تقييمها بعد تدريب مرتبط.' : 'Review these skills and reassess after relevant practice.'}</p><button type="button" className="report-secondary" onClick={onDetails}>{ar ? 'اعرض تفاصيل المهارات' : 'View skill details'}<ArrowUpRight size={15} aria-hidden="true" /></button></div><div className={styles.priorityBars}>{weak.length ? weak.map((skill: any) => <div className={styles.priorityRow} key={skill.name}><span className={styles.priorityLabel}><span className={styles.priorityDot} aria-hidden="true" />{questionMetadata(skill, 'name', language)}<small>({skill.answers.toLocaleString(ar ? 'ar-EG' : 'en-GB')} {ar ? 'إجابة' : 'answers'})</small></span><progress value={skill.correctRate} max={100} aria-label={`${questionMetadata(skill,'name',language)} ${skill.correctRate}%`} /><bdi>{skill.correctRate.toLocaleString(ar ? 'ar-EG' : 'en-GB', { maximumFractionDigits: 1 })}%</bdi></div>) : <p className={styles.priorityEmpty}>{ar ? 'لا توجد مهارات ذات بيانات كافية أقل من ٦٠٪ في هذا النطاق. راجع تفاصيل المهارات للاطلاع على المتاح.' : 'No skills with sufficient evidence are below 60% in this scope. Open skill details to see the available evidence.'}</p>}</div></section>;
}
