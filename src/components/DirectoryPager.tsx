"use client";
import { useLanguage } from '@/contexts/LanguageContext';
export default function DirectoryPager({ page, total, pages, onPage, loading }: { page: number; total: number; pages: number; onPage: (page: number) => void; loading?: boolean }) {
  const { language } = useLanguage(); const ar = language === 'ar';
  return <nav aria-label={ar ? 'صفحات القائمة' : 'Directory pages'} className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-slate-100 bg-white"><span className="text-sm font-bold text-slate-600">{ar ? 'إجمالي النتائج:' : 'Total results:'} {total.toLocaleString(ar ? 'ar-EG' : 'en-GB')}</span><div className="flex items-center gap-3"><button className="report-secondary" disabled={loading || page <= 1} onClick={() => onPage(page - 1)}>{ar ? 'السابق' : 'Previous'}</button><span className="text-sm text-slate-600">{page} / {Math.max(1, pages)}</span><button className="report-secondary" disabled={loading || page >= pages} onClick={() => onPage(page + 1)}>{ar ? 'التالي' : 'Next'}</button></div></nav>;
}
