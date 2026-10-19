"use client";
import { useRef } from 'react';
import { useModalFocus } from '@/hooks/useModalFocus';
import { useLanguage } from '@/contexts/LanguageContext';
export default function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  const ref = useRef<HTMLDivElement>(null); const { language } = useLanguage(); const ar = language === 'ar';
  useModalFocus(true, ref, onCancel);
  return <div className="fixed inset-0 z-[160] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}><div ref={ref} role="dialog" aria-modal="true" aria-labelledby="lesson-confirm-title" tabIndex={-1} className="bg-white rounded-[30px] border border-slate-200 shadow-xl p-6 sm:p-8 w-full max-w-md" onClick={e => e.stopPropagation()}><h2 id="lesson-confirm-title" className="text-xl font-black mb-4">{ar ? 'قبل المتابعة' : 'Before continuing'}</h2><p className="text-slate-600 leading-relaxed">{message}</p><div className="flex flex-wrap gap-3 mt-6"><button className="report-secondary" onClick={onCancel}>{ar ? 'رجوع للمراجعة' : 'Back to review'}</button><button className="report-primary" onClick={onConfirm}>{ar ? 'تأكيد والمتابعة' : 'Confirm & continue'}</button></div></div></div>;
}
