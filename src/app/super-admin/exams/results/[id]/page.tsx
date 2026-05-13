"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { 
  BarChart3, Users, CheckCircle2, XCircle, 
  Clock, ArrowRight, Download, Globe, Building2 
} from "lucide-react";

export default function SuperAdminExamResultsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          examTitle: data[0]?.exam?.title || "تقرير الامتحان"
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 rtl" dir="rtl">
        {/* Header */}
        <div className="bg-[#1a1a2e] p-10 rounded-[40px] shadow-2xl relative overflow-hidden text-white">
          <div className="relative z-10 flex justify-between items-center">
             <div>
                <button onClick={() => router.back()} className="flex items-center gap-2 text-indigo-300 hover:text-white mb-4 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                  العودة للقائمة
                </button>
                <h2 className="text-4xl font-black">{stats?.examTitle || "تحليل النتائج"}</h2>
                <p className="text-indigo-200/60 mt-2">عرض تقارير الأداء التفصيلية على مستوى المنظومة.</p>
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
              <p className="text-slate-400 font-bold text-sm">إجمالي المختبرين</p>
           </div>
           <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-3xl font-black text-slate-800">{stats?.passRate || 0}%</h4>
              <p className="text-slate-400 font-bold text-sm">نسبة النجاح العامة</p>
           </div>
           <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h4 className="text-3xl font-black text-slate-800">{stats?.average || 0}%</h4>
              <p className="text-slate-400 font-bold text-sm">متوسط الدرجات</p>
           </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800">سجل المحاولات</h3>
              <div className="flex gap-2">
                 <span className="px-4 py-1.5 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black tracking-widest uppercase">تاريخ اليوم</span>
              </div>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                 <thead>
                    <tr className="bg-slate-50/50">
                       <th className="p-6 text-sm font-black text-slate-400">الطالب</th>
                       <th className="p-6 text-sm font-black text-slate-400">المدرسة</th>
                       <th className="p-6 text-sm font-black text-slate-400">النتيجة</th>
                       <th className="p-6 text-sm font-black text-slate-400">التوقيت</th>
                       <th className="p-6 text-sm font-black text-slate-400">الحالة</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {submissions.map((s: any) => (
                       <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-6">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                                   {s.user?.name?.[0]}
                                </div>
                                <span className="font-bold text-slate-700">{s.user?.name}</span>
                             </div>
                          </td>
                          <td className="p-6">
                             <span className="flex items-center gap-2 text-slate-500 font-medium">
                                <Building2 className="w-4 h-4" />
                                {s.user?.school?.name || "عام"}
                             </span>
                          </td>
                          <td className="p-6 font-black text-slate-800">{s.percentage}%</td>
                          <td className="p-6 text-slate-500 text-sm">{new Date(s.createdAt).toLocaleDateString("ar-EG")}</td>
                          <td className="p-6">
                             {s.percentage >= 50 ? (
                                <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                                   <CheckCircle2 className="w-4 h-4" />
                                   ناجح
                                </span>
                             ) : (
                                <span className="flex items-center gap-1.5 text-red-500 font-bold">
                                   <XCircle className="w-4 h-4" />
                                   راسب
                                </span>
                             )}
                          </td>
                       </tr>
                    ))}
                    {submissions.length === 0 && !loading && (
                       <tr>
                          <td colSpan={5} className="p-20 text-center text-slate-400 font-bold">لا توجد محاولات لهذا الامتحان حتى الآن.</td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
