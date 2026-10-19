"use client";
import { formatEgyptDateTime } from '@/lib/egyptTime';
export default function LessonSaveStatus({ status, at, language, retry }: { status: string; at: string | null; language: string; retry: () => void }) {
  if (status === 'idle') return null;
  const ar = language === 'ar';
  return <div role={status === 'error' ? 'alert' : 'status'} className={`rounded-2xl p-3 text-xs font-bold flex flex-wrap gap-3 items-center ${status === 'error' ? 'bg-rose-50 text-rose-800' : 'bg-emerald-50 text-emerald-800'}`}>
    {status === 'saving' ? ar ? 'جارٍ حفظ تقدمك…' : 'Saving progress…' : status === 'error' ? ar ? 'تعذر تأكيد الحفظ على الخادم. أعد المحاولة قبل الإغلاق.' : 'Server save not confirmed. Retry before closing.' : `${ar ? 'آخر حفظ مؤكد:' : 'Last confirmed save:'} ${formatEgyptDateTime(at, language)}`}
    {status === 'error' && <button className="underline" onClick={retry}>{ar ? 'إعادة الحفظ' : 'Retry save'}</button>}
  </div>;
}
