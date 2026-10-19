"use client";
export default function ReportBreakdown({ report, language }: { report: any; language: string }) {
  const ar = language === 'ar';
  if (!report.modules?.length && !report.subExams?.length) return null;
  return <div className="grid lg:grid-cols-2 gap-6">{[[ar ? 'أداء الموديولات' : 'Module performance', report.modules || []], [ar ? 'أداء الاختبارات الفرعية' : 'Exam section performance', report.subExams || []]].map(([title, rows]: any) => rows.length ? <section key={title} className="premium-card rounded-[30px] p-6"><h2 className="font-black text-lg text-slate-900 mb-5">{title}</h2><div className="space-y-4">{rows.map((row: any) => <div key={row.id}><div className="flex justify-between gap-3 text-sm font-bold mb-2"><span>{row.title}</span><span className="text-indigo-700">{row.correctRate == null ? '—' : `${row.correctRate}%`}</span></div><progress className="w-full accent-indigo-600 h-2" value={row.correctRate || 0} max={100} aria-label={row.title} /><p className="text-xs text-slate-500 mt-1">{row.totalAnswers} {ar ? 'إجابة من المحاولات المعتمدة' : 'answers from selected attempts'}</p></div>)}</div></section> : null)}</div>;
}
