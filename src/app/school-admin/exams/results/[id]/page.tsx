"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { API_URL } from "@/lib/api";
import { Users, Award, Search, ArrowRight, UserCheck, BarChart3, TrendingUp } from 'lucide-react';
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ExamResultsPage() {
  const { id } = useParams();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("school_admin_token");
      
      // Fetch exam info
      const examRes = await fetch(`${API_URL}/exams/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const examData = await examRes.json();
      setExam(examData);

      // Fetch submissions
      const res = await fetch(`${API_URL}/exams/${id}/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSubmissions(data);
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter((s: any) => 
    s.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.user?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const averageScore = submissions.length > 0 
    ? Math.round(submissions.reduce((acc: number, curr: any) => acc + curr.percentage, 0) / submissions.length)
    : 0;

  return (
    <DashboardLayout>
      <div className={`flex flex-col gap-8 ${isAr ? 'rtl' : 'ltr'}`} dir={isAr ? 'rtl' : 'ltr'}>
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/school-admin/exams" className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 transition-colors shadow-sm">
              <ArrowRight className={`w-6 h-6 ${isAr ? '' : 'rotate-180'}`} />
            </Link>
            <div>
              <h2 className="text-3xl font-black text-slate-800">{exam?.title || (isAr ? "نتائج الامتحان" : "Exam Results")}</h2>
              <p className="text-slate-500">{isAr ? "متابعة أداء الطلاب في هذا الامتحان بالتفصيل." : "Detailed breakdown of student performance in this exam."}</p>
            </div>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{isAr ? "إجمالي المتقدمين" : "Total Examinees"}</p>
            <h4 className="text-2xl font-black text-slate-800">{submissions.length} {isAr ? "طالب" : "Students"}</h4>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{isAr ? "متوسط الدرجات" : "Average Score"}</p>
            <h4 className="text-2xl font-black text-slate-800">{averageScore}%</h4>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-4">
              <Award className="w-6 h-6" />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{isAr ? "نسبة النجاح" : "Pass Rate"}</p>
            <h4 className="text-2xl font-black text-slate-800">
              {submissions.length > 0 ? Math.round((submissions.filter((s: any) => s.percentage >= (exam?.passingScore || 50)).length / submissions.length) * 100) : 0}%
            </h4>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mb-4">
              <BarChart3 className="w-6 h-6" />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{isAr ? "أعلى درجة" : "Highest Score"}</p>
            <h4 className="text-2xl font-black text-slate-800">
              {submissions.length > 0 ? Math.max(...submissions.map((s: any) => s.percentage)) : 0}%
            </h4>
          </div>
        </div>

        {/* Results Table Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-indigo-600" />
              {isAr ? "تفاصيل إجابات الطلاب" : "Student Answer Details"}
            </h3>
            <div className="relative w-full md:w-64">
              <input 
                type="text" 
                placeholder={isAr ? "ابحث عن طالب..." : "Search student..."} 
                className={`w-full border border-slate-200 rounded-xl py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${isAr ? 'pl-4 pr-10 text-right' : 'pr-4 pl-10 text-left'}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className={`w-4 h-4 text-slate-400 absolute top-3 ${isAr ? 'right-3' : 'left-3'}`} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className={`w-full ${isAr ? 'text-right' : 'text-left'}`}>
              <thead className="bg-slate-50 text-slate-500 text-sm">
                <tr>
                  <th className="p-6 font-bold">{isAr ? "اسم الطالب" : "Student Name"}</th>
                  <th className="p-6 font-bold">{isAr ? "اسم المستخدم" : "Username"}</th>
                  <th className="p-6 font-bold">{isAr ? "تاريخ التقديم" : "Submission Date"}</th>
                  <th className="p-6 font-bold">{isAr ? "الدرجة" : "Score"}</th>
                  <th className="p-6 font-bold">{isAr ? "النسبة" : "Percentage"}</th>
                  <th className="p-6 font-bold">{isAr ? "الحالة" : "Status"}</th>
                  <th className="p-6 font-bold text-center">{isAr ? "الإجراء" : "Action"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredSubmissions.map((submission: any) => {
                  const passed = submission.percentage >= (exam?.passingScore || 50);
                  return (
                    <tr key={submission.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-6 font-bold text-slate-800">{submission.user?.name}</td>
                      <td className="p-6 text-slate-500 font-mono text-xs">{submission.user?.username}</td>
                      <td className="p-6 text-slate-500 text-sm">{new Date(submission.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</td>
                      <td className="p-6 font-bold text-slate-800">{submission.totalScore}</td>
                      <td className="p-6 font-black text-indigo-600">{Math.round(submission.percentage)}%</td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {passed ? (isAr ? "ناجح" : "Passed") : (isAr ? "راسب" : "Failed")}
                        </span>
                      </td>
                      <td className="p-6 text-center">
                        <Link 
                          href={`/school-admin/exams/submissions/${submission.id}`}
                          className="text-indigo-600 font-bold hover:underline text-sm"
                        >
                          {isAr ? "عرض التفاصيل" : "View Details"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredSubmissions.length === 0 && (
              <div className="py-20 text-center">
                <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 font-bold">{isAr ? "لا توجد نتائج لهذا الامتحان بعد." : "No results for this exam yet."}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

