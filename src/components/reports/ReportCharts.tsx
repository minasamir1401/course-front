"use client";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatEgyptDate } from '@/lib/egyptTime';

export default function ReportCharts({ report, language }: { report: any; language: string }) {
  const ar = language === 'ar';
  if (!report.timeline.length) return <div className="premium-card p-8 rounded-[30px] text-center text-slate-600">{ar ? 'لا توجد محاولات خلال الفترة المحددة. لن تُعرض درجات أو اتجاهات افتراضية.' : 'No attempts in this period. No default scores or trends are displayed.'}</div>;
  return <section className="premium-card rounded-[30px] p-5 sm:p-7" aria-label={ar ? 'متوسط الدرجة حسب يوم التسليم بتوقيت مصر' : 'Average score by submission day in Egypt'}>
    <h2 className="text-lg font-black text-slate-900">{ar ? 'متوسط الدرجة حسب يوم التسليم' : 'Average score by submission day'}</h2>
    <p className="text-sm text-slate-500 mt-1 mb-6">{ar ? 'المحور الأفقي: اليوم بتوقيت مصر · الرأسي: الدرجة % · المحاولة المعتمدة لكل اختبار.' : 'Horizontal: day in Egypt · Vertical: score % · Selected attempt per exam section.'}</p>
    <div className="h-[280px] w-full min-w-0" dir="ltr"><ResponsiveContainer width="100%" height={280} minWidth={0} initialDimension={{ width: 400, height: 280 }}><AreaChart data={report.timeline} margin={{ left: 0, right: 16, top: 12, bottom: 10 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="day" tickFormatter={day => formatEgyptDate(day + 'T12:00Z', language, { year: undefined })} tick={{ fontSize: 11 }} minTickGap={28} />
      <YAxis domain={[0, 100]} unit="%" width={48} tick={{ fontSize: 11 }} /><Tooltip labelFormatter={day => formatEgyptDate(String(day) + 'T12:00Z', language)} formatter={value => [`${value}%`, ar ? 'متوسط الدرجة' : 'Average score']} />
      <Area dataKey="averageScore" name={ar ? 'متوسط الدرجة (%)' : 'Average score (%)'} stroke="#6366f1" fill="#eef2ff" strokeWidth={3} connectNulls={false} isAnimationActive={false} />
    </AreaChart></ResponsiveContainer></div>
    <details className="mt-4 text-sm"><summary className="cursor-pointer text-indigo-700 font-bold">{ar ? 'عرض القيم النصية للرسم' : 'Show chart values as text'}</summary><ul className="mt-3 space-y-1">{report.timeline.map((day: any) => <li key={day.day}>{formatEgyptDate(day.day + 'T12:00Z', language)}: {day.averageScore ?? '—'}% · {day.attempts} {ar ? 'محاولة' : 'attempts'}</li>)}</ul></details>
  </section>;
}
