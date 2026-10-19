"use client";
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function StudentPageHeader({ title, description, back, action }: {
  title: string; description?: string; back?: { href: string; label: string }; action?: React.ReactNode;
}) {
  const { language } = useLanguage();
  const Arrow = language === 'ar' ? ChevronRight : ChevronLeft;
  return <header className="student-page-heading">
    {back && <Link href={back.href} className="inline-flex items-center gap-1 text-sm font-bold text-indigo-700 mb-4"><Arrow size={18} />{back.label}</Link>}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="min-w-0"><h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-relaxed break-words">{title}</h1>{description && <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed max-w-3xl">{description}</p>}</div>
      {action && <div className="flex flex-wrap gap-2 shrink-0">{action}</div>}
    </div>
  </header>;
}

export function StudentFeedback({ title, retry, children }: { title: string; retry?: () => void; children?: React.ReactNode }) {
  const { language } = useLanguage();
  return <div role="alert" className="report-error space-y-3"><p>{title}</p>{retry && <button className="report-secondary" onClick={retry}>{language === 'ar' ? 'إعادة المحاولة' : 'Retry'}</button>}{children}</div>;
}
