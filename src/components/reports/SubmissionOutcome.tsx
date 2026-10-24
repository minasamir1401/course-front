"use client";
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { CheckCircle2, BookOpen } from 'lucide-react';
import { formatEgyptDateTime } from '@/lib/egyptTime';
const Confetti = dynamic(() => import('react-confetti'), { ssr: false });

export default function SubmissionOutcome({ submission, language }: { submission: any; language: string }) {
  const ar = language === 'ar', frozen = submission.historicalSnapshot === true;
  const [celebrate, setCelebrate] = useState(() => frozen && submission.passed === true && typeof window !== 'undefined'
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const txt = (a: string, e: string) => ar ? a : e;
  return <section className="bg-white border border-slate-200 rounded-[30px] p-6 shadow-sm mb-6" aria-label={txt('حالة النتيجة', 'Result status')}>
    {celebrate && <Confetti recycle={false} numberOfPieces={180} gravity={0.15} style={{ position: 'fixed', pointerEvents: 'none', zIndex: 60 }} onConfettiComplete={() => setCelebrate(false)} />}
    <div className="flex items-center gap-3 font-black text-lg text-slate-800">{submission.passed ? <CheckCircle2 className="text-emerald-700" /> : <BookOpen className="text-indigo-700" />}
      {frozen && typeof submission.passed === 'boolean' ? submission.passed ? txt('اجتزت الامتحان، أحسنت!', 'You passed. Well done!') : txt('راجع إجاباتك واستعد للخطوة التالية', 'Review your answers and prepare for your next step') : txt('الدرجة المسجلة', 'Recorded grade')}
    </div>
    <p className="text-sm text-slate-600 mt-3">{txt('موعد التسليم:', 'Submitted:')} {formatEgyptDateTime(submission.createdAt, language)}</p>
    {frozen && <p className="text-sm text-slate-600 mt-2">{txt('حد النجاح وقت التسليم:', 'Pass threshold at submission:')} {submission.exam?.passingScore ?? '—'}% · {txt('الإجابات الصحيحة:', 'Correct answers:')} {submission.correctAnswers ?? '—'} / {submission.totalQuestions ?? '—'}</p>}
    {!frozen && <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-4">{txt('سجل قديم: نعرض الدرجة المحفوظة. لا تتوفر نسخة مؤكدة من الأسئلة وحد النجاح وقت التسليم، ولا يُعاد تصحيح النتيجة عند فتحها.', 'Legacy record: the saved grade is displayed. Original questions and the pass threshold were not captured; opening this result does not regrade it.')}</p>}
  </section>;
}
