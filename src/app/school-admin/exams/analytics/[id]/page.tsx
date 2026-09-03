
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";
import { CheckCircle2, XCircle, ChevronRight, LayoutDashboard, RefreshCw, Award, Target, Clock, User, Mail, ArrowRight, FileText, BarChart3, HelpCircle, Layers, Building2, Users } from 'lucide-react';
import Image from 'next/image';
import Link from "next/link";
import { useNotification } from "@/context/NotificationContext";

export default function ExamAnalyticsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useNotification();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [id]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("school_admin_token") || localStorage.getItem("lms_token") || localStorage.getItem("token");
      const res = await fetch(`${API_URL}/exams/${id}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        showToast(json.error || "خطأ في جلب التقارير", "error");
        router.back();
      }
    } catch (error) {
      console.error(error);
      showToast("خطأ في الاتصال بالخادم", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-black text-xl text-slate-400 animate-pulse text-right rtl" dir="rtl">جاري تجميع التقارير التحليلية للامتحان...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!data || !data.exam) return null;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 rtl pb-20" dir="rtl">
        
        {/* Header with Navigation and Logo */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()} 
              className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm group"
            >
              <ArrowRight className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm bg-white flex items-center justify-center p-1 border border-slate-100">
                 <Image src="/logo.jpeg" alt="Klevro Logo" width={56} height={56} className="object-contain" />
               </div>
               <div>
                 <h1 className="text-3xl font-black text-slate-800">التقارير التحليلية للامتحان</h1>
                 <p className="text-slate-500 font-medium">{data.exam.title}</p>
               </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-sm bg-indigo-50 text-indigo-600 border border-indigo-100">
                <BarChart3 className="w-5 h-5" />
                تحليلات شاملة
             </div>
          </div>
        </div>

        {/* Top Level KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-400">إجمالي المختبرين</p>
              <p className="text-3xl font-black text-slate-800">{data.overall.totalSubmissions}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <Target className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-400">متوسط الدرجات (النسبة)</p>
              <p className="text-3xl font-black text-slate-800">{Math.round(data.overall.avgScore)}%</p>
            </div>
          </div>
        </div>

        {/* Modules Breakdown */}
        {data.modules && data.modules.length > 0 && (
          <div className="bg-white rounded-[35px] border border-slate-100 shadow-sm p-8">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <Layers className="w-6 h-6 text-indigo-600" />
              أداء الطلاب في الموديولات (Modules)
            </h3>
            <div className="space-y-6">
              {data.modules.map((mod: any, idx: number) => (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700">{mod.title}</span>
                    <span className="font-black text-indigo-600">{Math.round(mod.correctRate)}% إجابات صحيحة</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000" 
                      style={{ width: `${mod.correctRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SubExams Breakdown */}
        {data.subExams && data.subExams.length > 0 && (
          <div className="bg-white rounded-[35px] border border-slate-100 shadow-sm p-8">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <FileText className="w-6 h-6 text-indigo-600" />
              أداء الطلاب في الاختبارات الفرعية (Sub-Exams)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.subExams.map((se: any, idx: number) => (
                <div key={idx} className="p-5 border border-slate-100 rounded-2xl bg-slate-50 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800">{se.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">يتبع موديول: {data.modules?.find((m: any) => m.id === se.moduleId)?.title || se.moduleId}</p>
                    </div>
                    <div className="bg-white px-3 py-1 rounded-lg border border-slate-200 font-black text-indigo-600">
                      {Math.round(se.correctRate)}%
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-1000" 
                      style={{ width: `${se.correctRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schools Performance (Super Admin Only) */}
        {data.schools && data.schools.length > 0 && (
          <div className="bg-white rounded-[35px] border border-slate-100 shadow-sm p-8">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <Building2 className="w-6 h-6 text-indigo-600" />
              تقارير أداء المدارس المشتركة
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b-2 border-slate-100 text-slate-400 font-bold text-sm">
                    <th className="pb-4">اسم المدرسة</th>
                    <th className="pb-4">عدد الطلاب المشاركين</th>
                    <th className="pb-4">متوسط النتيجة العامة</th>
                  </tr>
                </thead>
                <tbody>
                  {data.schools.map((school: any, i: number) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 font-bold text-slate-700">{school.name}</td>
                      <td className="py-4 font-black text-slate-500">{school.count} طالب</td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-indigo-600 w-12">{Math.round(school.avgScore)}%</span>
                          <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${school.avgScore}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detailed Students List */}
        <div className="bg-white rounded-[35px] border border-slate-100 shadow-sm p-8">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
            <User className="w-6 h-6 text-indigo-600" />
            سجل إجابات الطلاب
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b-2 border-slate-100 text-slate-400 font-bold text-sm">
                  <th className="pb-4">اسم الطالب</th>
                  <th className="pb-4">المدرسة</th>
                  <th className="pb-4">النتيجة (%)</th>
                  <th className="pb-4">الدرجة</th>
                  <th className="pb-4">تاريخ التسليم</th>
                  <th className="pb-4">العمليات</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((student: any, i: number) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 font-bold text-slate-700">{student.name || 'غير معروف'}</td>
                    <td className="py-4 font-medium text-slate-500">{student.schoolName || '-'}</td>
                    <td className="py-4 font-black text-indigo-600">{Math.round(student.percentage || 0)}%</td>
                    <td className="py-4 font-bold text-slate-700">{student.score}</td>
                    <td className="py-4 text-sm text-slate-400">{new Date(student.createdAt).toLocaleDateString('ar-EG')}</td>
                    <td className="py-4">
                      <Link 
                        href={`/school-admin/exams/submissions/${student.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"
                      >
                        <ArrowRight className="w-4 h-4 rotate-180" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
