"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { BarChart3, Users, CheckCircle2, XCircle, Clock, ArrowRight, Download, Globe, Building2, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";

export default function SuperAdminExamResultsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null);

  // Group submissions by school
  const groupedSubmissions = submissions.reduce((acc: any, s: any) => {
    const schoolName = s.user?.school?.name || (language === 'ar' ? "عام" : "General");
    if (!acc[schoolName]) acc[schoolName] = [];
    acc[schoolName].push(s);
    return acc;
  }, {});

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("super_admin_token");
      const res = await fetch(`${API_URL}/exams/${id}/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSubmissions(data);
      
      // Basic stats calculation
      if (data.length > 0) {
        const avg = data.reduce((acc: any, curr: any) => acc + curr.percentage, 0) / data.length;
        const pass = data.filter((s: any) => s.percentage >= 50).length;
        setStats({
          total: data.length,
          average: avg.toFixed(1),
          passRate: ((pass / data.length) * 100).toFixed(1),
          examTitle: data[0]?.exam?.title || (language === 'ar' ? "تقرير الامتحان" : "Exam Report")
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const formatTime = (seconds?: number | null) => {
    if (seconds === undefined || seconds === null) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <DashboardLayout>
      <div className={`flex flex-col gap-8 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="bg-[#1a1a2e] p-10 rounded-[40px] shadow-2xl relative overflow-hidden text-white">
          <div className="relative z-10 flex justify-between items-center">
             <div>
                <button onClick={() => router.back()} className="flex items-center gap-2 text-indigo-300 hover:text-white mb-4 transition-colors">
                  {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowRight className="w-4 h-4 rotate-180" />}
                  {language === 'ar' ? 'العودة للقائمة' : 'Back to list'}
                </button>
                <h2 className="text-4xl font-black">{stats?.examTitle || (language === 'ar' ? "تحليل النتائج" : "Results Analysis")}</h2>
                <p className="text-indigo-200/60 mt-2">{language === 'ar' ? 'عرض تقارير الأداء التفصيلية على مستوى المنظومة.' : 'View detailed performance reports across the system.'}</p>
             </div>
             <button className="bg-indigo-600 p-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl">
                <Download className="w-6 h-6" />
             </button>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -mr-32 -mt-32"></div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-3xl font-black text-slate-800">{stats?.total || 0}</h4>
              <p className="text-slate-400 font-bold text-sm">{language === 'ar' ? 'إجمالي المختبرين' : 'Total Examinees'}</p>
           </div>
           <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-3xl font-black text-slate-800">{stats?.passRate || 0}%</h4>
              <p className="text-slate-400 font-bold text-sm">{language === 'ar' ? 'نسبة النجاح العامة' : 'Overall Pass Rate'}</p>
           </div>
           <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h4 className="text-3xl font-black text-slate-800">{stats?.average || 0}%</h4>
              <p className="text-slate-400 font-bold text-sm">{language === 'ar' ? 'متوسط الدرجات' : 'Average Score'}</p>
           </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800">{language === 'ar' ? 'سجل المحاولات' : 'Attempts Record'}</h3>
              <div className="flex gap-2">
                 <span className="px-4 py-1.5 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black tracking-widest uppercase">{language === 'ar' ? 'تاريخ اليوم' : 'Today\'s Date'}</span>
              </div>
           </div>
            <div className="flex flex-col">
               {Object.entries(groupedSubmissions).map(([schoolName, schoolSubmissions]: [string, any]) => (
                  <div key={schoolName} className="border-b border-slate-50 last:border-0">
                     <button
                        onClick={() => setExpandedSchool(expandedSchool === schoolName ? null : schoolName)}
                        className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors focus:outline-none"
                     >
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                              <Building2 className="w-6 h-6" />
                           </div>
                           <div className="text-right">
                              <h4 className="text-xl font-black text-slate-800">{schoolName}</h4>
                              <p className="text-slate-500 font-bold mt-1 text-sm">{schoolSubmissions.length} {language === 'ar' ? 'طالب' : 'Students'}</p>
                           </div>
                        </div>
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                          {expandedSchool === schoolName ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
                        </div>
                     </button>
                     
                     {expandedSchool === schoolName && (
                        <div className="p-6 bg-slate-50/30 overflow-x-auto border-t border-slate-50">
                           <table className={`w-full text-${language === 'ar' ? 'right' : 'left'} border-collapse`}>
                              <thead>
                                 <tr className="bg-white/50 text-slate-500 text-sm">
                                    <th className="p-4 font-black">{language === 'ar' ? 'الطالب' : 'Student'}</th>
                                    <th className="p-4 font-black">{language === 'ar' ? 'النتيجة' : 'Result'}</th>
                                    <th className="p-4 font-black">{language === 'ar' ? 'التوقيت' : 'Time'}</th>
                                    <th className="p-4 font-black">{language === 'ar' ? 'الوقت المستغرق' : 'Duration'}</th>
                                    <th className="p-4 font-black">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                                    <th className="p-4 text-center font-black">{language === 'ar' ? 'الإجراء' : 'Action'}</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100/50">
                                 {schoolSubmissions.map((s: any) => (
                                    <tr key={s.id} className="hover:bg-white transition-colors group">
                                       <td className="p-4">
                                          <div className="flex items-center gap-3">
                                             <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                                                {s.user?.name?.[0]}
                                             </div>
                                             <div className="flex flex-col">
                                                <span className="font-bold text-slate-700">{s.user?.name}</span>
                                                <span className="text-xs text-slate-400 font-mono">{s.user?.username}</span>
                                             </div>
                                          </div>
                                       </td>
                                       <td className="p-4 font-black text-indigo-600">{Math.round(s.percentage)}%</td>
                                       <td className="p-4 text-slate-500 text-sm">{new Date(s.createdAt).toLocaleDateString(language === 'ar' ? "ar-EG" : "en-US")}</td>
                                       <td className="p-4 text-slate-500 text-sm font-mono">{formatTime(s.totalTime)}</td>
                                       <td className="p-4">
                                          <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${s.percentage >= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                             {s.percentage >= 50 ? (language === 'ar' ? 'ناجح' : 'Passed') : (language === 'ar' ? 'راسب' : 'Failed')}
                                          </span>
                                       </td>
                                       <td className="p-4 text-center">
                                          <Link 
                                             href={`/super-admin/exams/submissions/${s.id}`}
                                             className="inline-flex items-center justify-center p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
                                             title={language === 'ar' ? 'عرض إجابات الطالب' : 'View Student Answers'}
                                          >
                                             <FileText className="w-4 h-4" />
                                          </Link>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     )}
                  </div>
               ))}
               {submissions.length === 0 && !loading && (
                  <div className="p-20 text-center text-slate-400 font-bold border-t border-slate-50">{language === 'ar' ? 'لا توجد محاولات لهذا الامتحان حتى الآن.' : 'No attempts for this exam yet.'}</div>
               )}
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
