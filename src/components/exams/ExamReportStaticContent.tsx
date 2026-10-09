import Image from 'next/image';
import { BarChart3 } from 'lucide-react';

export function ExamReportLogo() {
  return (
    <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm bg-white flex items-center justify-center p-1 border border-slate-100">
      <Image src="/logo.jpeg" alt="Klevro Logo" width={56} height={56} className="object-contain" />
    </div>
  );
}

export function ExamReportTitle({ title }: { title: string }) {
  return <h1 className="text-3xl font-black text-slate-800">{title}</h1>;
}

export function ExamAnalyticsBadge() {
  return (
    <div className="flex items-center gap-3">
      <div className="px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-sm bg-indigo-50 text-indigo-600 border border-indigo-100">
        <BarChart3 className="w-5 h-5" />
        تحليلات شاملة
      </div>
    </div>
  );
}

export function ExamReportLoading({ message }: { message: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <p className="font-black text-xl text-slate-400 animate-pulse text-right rtl" dir="rtl">{message}</p>
    </div>
  );
}

export function ExamSubmissionDescription() {
  return <p className="text-slate-500 font-medium">مراجعة تفصيلية لأداء الطالب في الامتحان.</p>;
}
