'use client';
import Link from 'next/link';
import { Trophy, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './Competitions.module.css';
export default function CompetitionShortcut({ sourceKind }: { sourceKind?: string }) {
  const { language } = useLanguage(); const ar = language === 'ar';
  return <section className={styles.shortcut}><div><strong style={{ display: 'flex', gap: 9, alignItems: 'center' }}><Trophy size={21}/>{ar ? 'تعلّم، نافس، واحتفل بتقدمك' : 'Learn, compete and celebrate'}</strong><p>{ar ? 'تحديات تعليمية ونقاط تحفيز وترتيب حقيقي.' : 'Learning challenges, reward points and real rankings.'}</p></div><Link className={styles.secondary} href={`/competitions${sourceKind ? `?sourceKind=${sourceKind}` : ''}`}>{ar ? 'المنافسات والترتيب' : 'Competitions & rankings'}<ArrowUpRight size={17}/></Link></section>;
}
