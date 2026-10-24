"use client";
import { AreaChart, Area, ComposedChart, Bar, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { formatEgyptDate } from '@/lib/egyptTime';
import styles from './StudentReports.module.css';
export default function ReportCharts({ report, language, student = false }: { report: any; language: string; student?: boolean }) {
  const ar = language === 'ar';
  const number = (value: any) => value == null ? '—' : Number(value).toLocaleString(ar ? 'ar-EG' : 'en-GB', { maximumFractionDigits: 1 });
  const title = ar ? 'متوسط الدرجة حسب يوم التسليم' : 'Average score by submission day';
  const values = <details className={student ? styles.chartValues : 'mt-4 text-sm'}><summary className={student ? undefined : "cursor-pointer text-indigo-700 font-bold"}>{ar ? 'عرض القيم النصية للرسم' : 'Show chart values as text'}</summary><ul>{report.timeline.map((day: any) => <li key={day.day}>{formatEgyptDate(day.day + 'T12:00Z', language)}: {number(day.averageScore)}% · {number(day.attempts)} {ar ? 'محاولة' : 'attempts'}{student && day.minimumScore != null && <> · {ar ? 'الأقل' : 'Lowest'} {number(day.minimumScore)}% · {ar ? 'الأعلى' : 'Highest'} {number(day.maximumScore)}%</>}</li>)}</ul></details>;
  if (!report.timeline.length) return <section className={student ? styles.chart : 'premium-card p-8 rounded-[30px]'} aria-label={title}>{student && <div className={styles.chartHeading}><h2><span><BarChart3 size={20} aria-hidden="true" /></span>{title}</h2></div>}<p className={styles.chartEmpty}>{ar ? 'لا توجد محاولات خلال الفترة المحددة. لن تُعرض درجات أو اتجاهات افتراضية.' : 'No attempts in this period. No default scores or trends are displayed.'}</p></section>;
  if (student) return <section className={styles.chart} aria-label={ar ? 'متوسط الدرجة حسب يوم التسليم' : 'Average score by submission day'}><div className={styles.chartHeading}><h2><span><BarChart3 size={20} aria-hidden="true" /></span>{title}</h2><p>{ar ? 'المتوسط مع أقل وأعلى درجة من المحاولات المعتمدة داخل الفترة، حسب يوم التسليم.' : 'The average, lowest and highest scores from selected attempts in the period, grouped by submission day.'}</p></div><div className={styles.legend} aria-label={ar ? 'دليل ألوان الرسم' : 'Chart legend'}><span><i aria-hidden="true" />{ar ? 'أقل درجة' : 'Lowest score'}</span><span><i aria-hidden="true" />{ar ? 'أعلى درجة' : 'Highest score'}</span><span><i aria-hidden="true" />{ar ? 'المتوسط' : 'Average'}</span></div><div className={styles.chartCanvas} dir="ltr"><ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 600, height: 270 }}><ComposedChart data={report.timeline} margin={{ left: 0, right: 14, top: 14, bottom: 0 }} barGap={4} accessibilityLayer>
    <CartesianGrid vertical={false} stroke="#e5e7ed" /><XAxis dataKey="day" tickFormatter={day => formatEgyptDate(day + 'T12:00Z', language, { year: undefined })} tick={{ fontSize: 12, fill: '#646874' }} minTickGap={30} axisLine={{ stroke: '#c9ccd8' }} tickLine={false} />
    <YAxis domain={[0, 100]} tickFormatter={value => number(value) + '%'} tick={{ fontSize: 12, fill: '#646874' }} width={48} axisLine={false} tickLine={false} />
    <Tooltip labelFormatter={day => formatEgyptDate(String(day) + 'T12:00Z', language)} formatter={(value, name) => [number(value) + '%', name]} contentStyle={{ border: '1px solid #ded3ee', borderRadius: 14, fontSize: 12, color: '#15152B', fontFamily: 'inherit', direction: ar ? 'rtl' : 'ltr' }} cursor={{ fill: '#eee8f844' }} />
    <Area type="linear" dataKey="averageScore" fill="#b49ddd" fillOpacity={0.33} stroke="none" legendType="none" tooltipType="none" isAnimationActive={false} />
    <Bar dataKey="minimumScore" name={ar ? 'أقل درجة' : 'Lowest score'} fill="#5028E8" maxBarSize={17} radius={[3,3,0,0]} isAnimationActive={false} />
    <Bar dataKey="maximumScore" name={ar ? 'أعلى درجة' : 'Highest score'} fill="#25BDD1" maxBarSize={17} radius={[3,3,0,0]} isAnimationActive={false} />
    <Line type="linear" dataKey="averageScore" name={ar ? 'متوسط الدرجة' : 'Average score'} stroke="#54248C" strokeWidth={2.3} dot={{r:3,fill:'#54248C',strokeWidth:0}} connectNulls={false} isAnimationActive={false} />
  </ComposedChart></ResponsiveContainer></div>{values}</section>;
  return <section className="premium-card rounded-[30px] p-5 sm:p-7" aria-label={ar ? 'متوسط الدرجة حسب يوم التسليم' : 'Average score by submission day'}>
    <h2 className="text-lg font-black text-slate-900">{title}</h2>
    <p className="text-sm text-slate-500 mt-1 mb-6">{ar ? 'المحور الأفقي: اليوم · الرأسي: الدرجة % · المحاولة المعتمدة لكل اختبار.' : 'Horizontal: day · Vertical: score % · Selected attempt per exam section.'}</p>
    <div className="h-[280px] w-full min-w-0" dir="ltr"><ResponsiveContainer width="100%" height={280} minWidth={0} initialDimension={{ width: 400, height: 280 }}><AreaChart data={report.timeline} margin={{ left: 0, right: 16, top: 12, bottom: 10 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="day" tickFormatter={day => formatEgyptDate(day + 'T12:00Z', language, { year: undefined })} tick={{ fontSize: 12, fill: '#51445f', fontWeight: 600 }} minTickGap={28} />
      <YAxis tickFormatter={value=>Number(value).toLocaleString(ar?'ar-EG':'en-GB')} domain={[0, 100]} unit="%" width={48} tick={{ fontSize: 12, fill: '#51445f', fontWeight: 600 }} /><Tooltip labelFormatter={day => formatEgyptDate(String(day) + 'T12:00Z', language)} formatter={value => [number(value)+'%', ar ? 'متوسط الدرجة' : 'Average score']} />
      <Area dataKey="averageScore" name={ar ? 'متوسط الدرجة (%)' : 'Average score (%)'} stroke="#6366f1" fill="#eef2ff" strokeWidth={3} connectNulls={false} isAnimationActive={false} />
    </AreaChart></ResponsiveContainer></div>{values}
  </section>;
}
