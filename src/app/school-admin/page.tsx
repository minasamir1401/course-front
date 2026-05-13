"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users, School, GraduationCap, Layout, ArrowUpRight,
  ClipboardList, Activity, ChevronRight, Plus,
  TrendingUp, Download, Search, Calendar, Bell
} from "lucide-react";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import DashboardLayout from "@/components/DashboardLayout";

export default function SchoolAdminPage() {
  const router = useRouter();
  const [schoolName, setSchoolName] = useState("مدرستك");
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    exams: 0,
    avgSuccess: 0
  });
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const performanceData = [
    { month: 'يناير', score: 75 },
    { month: 'فبراير', score: 82 },
    { month: 'مارس', score: 78 },
    { month: 'أبريل', score: 85 },
    { month: 'مايو', score: 91 },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = localStorage.getItem("school_admin_user");
        const token = localStorage.getItem("school_admin_token");

        if (!userData) return;

        const parsed = JSON.parse(userData);
        if (parsed?.schoolName) setSchoolName(parsed.schoolName);

        // Let Layout handle redirects, just fetch data here

        const sId = parsed.schoolId;
        if (!sId) return;

        // Fetch Stats
        const statsRes = await fetch(`${API_URL}/reports/school?schoolId=${sId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats({
            students: statsData.studentsCount || 0,
            teachers: statsData.teachersCount || 0,
            classes: 0,
            exams: statsData.totalExamsTaken || 0,
            avgSuccess: Math.round(statsData.averageScore || 0)
          });
        }

        // Fetch Recent Students
        const studentsRes = await fetch(`${API_URL}/admin/users?schoolId=${sId}&role=STUDENT`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          setRecentStudents(studentsData.slice(0, 5));
        }

      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    setMounted(true);
  }, [router]);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans" dir="rtl">
        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">

          {/* Top Welcome Section */}
          <div className="mb-6 md:mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 text-blue-600 font-bold mb-2 text-[10px] md:text-sm">
                <span className="w-6 md:w-8 h-1 bg-blue-600 rounded-full"></span>
                نظرة عامة على المدرسة
              </div>
              <h1 className="text-xl md:text-3xl font-black text-slate-900 mb-2 leading-tight">مرحباً بك، مدير مدرسة {schoolName}</h1>
              <p className="text-slate-500 text-xs md:text-lg font-medium opacity-80">إليك ملخص شامل لأداء مدرستك وتفاعل الطلاب اليوم.</p>
            </div>
            <div className="flex gap-2 md:gap-3 w-full md:w-auto">
              <Link href="/school-admin/students/add" className="flex-1 md:flex-none justify-center bg-blue-600 text-white px-4 md:px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 text-xs md:text-base">
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                إضافة طالب
              </Link>
              <button className="flex-1 md:flex-none justify-center bg-white text-slate-700 border border-slate-200 px-4 md:px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm text-xs md:text-base">
                <Download className="w-4 h-4 md:w-5 md:h-5" />
                تقرير
              </button>
            </div>
          </div>

          {/* Key Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard title="إجمالي الطلاب" value={stats.students} icon={<Users />} color="blue" trend="+12% زيادة" />
            <StatCard title="المدرسين" value={stats.teachers} icon={<GraduationCap />} color="indigo" trend="جميعهم نشطون" />
            <StatCard title="الامتحانات" value={stats.exams} icon={<ClipboardList />} color="purple" trend="6 امتحانات نشطة" />
            <StatCard title="معدل النجاح" value={`${stats.avgSuccess}%`} icon={<TrendingUp />} color="emerald" trend="+2% تحسن" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            {/* Analytics Chart */}
            <div className="lg:col-span-2 bg-white rounded-3xl md:rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-900 mb-1">إحصائيات الأداء</h3>
                  <p className="text-slate-500 text-xs md:text-sm">معدل درجات الطلاب خلال الفصل الدراسي</p>
                </div>
                <div className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-blue-50 text-blue-600 font-bold text-[10px] md:text-xs">
                  <Calendar className="w-4 h-4" />
                  آخر 5 أشهر
                </div>
              </div>

              <div className="h-[280px] md:h-[320px] w-full">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={performanceData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Upcoming Activity */}
            <div className="bg-white rounded-3xl md:rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg md:text-xl font-black text-slate-900">الأنشطة القادمة</h3>
                <button className="text-blue-600 text-[10px] md:text-xs font-bold hover:underline">عرض الكل</button>
              </div>
              <div className="space-y-5">
                {[
                  { title: 'اختبار الرياضيات الشهري', date: 'غداً، 09:00 ص', type: 'امتحان', color: 'blue' },
                  { title: 'اجتماع أولياء الأمور', date: '12 مايو، 04:00 م', type: 'اجتماع', color: 'amber' },
                  { title: 'تسليم أبحاث العلوم', date: '15 مايو، 12:00 م', type: 'موعد', color: 'emerald' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 group cursor-pointer">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-${item.color}-50 flex items-center justify-center text-${item.color}-600 transition-all group-hover:scale-110`}>
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="flex-1 border-b border-slate-50 pb-2">
                      <h4 className="text-slate-900 font-bold text-xs md:text-sm mb-1">{item.title}</h4>
                      <p className="text-[10px] md:text-[11px] text-slate-500 font-medium">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <p className="text-[10px] md:text-[11px] text-slate-600 font-bold mb-2">هل تريد إضافة حدث جديد؟</p>
                <button className="text-[10px] md:text-xs text-blue-600 font-black flex items-center gap-1 mx-auto hover:gap-2 transition-all">
                  اضغط هنا <ChevronRight className="w-3 h-3 rotate-180" />
                </button>
              </div>
            </div>
          </div>

          {/* Real Students Table */}
          <div className="bg-white rounded-3xl md:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg md:text-xl font-black text-slate-900">أحدث الطلاب المسجلين</h3>
                <p className="text-slate-500 text-xs md:text-sm">قائمة الطلاب الذين انضموا مؤخراً للمدرسة</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="بحث..." className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-100 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <Link href="/school-admin/students" className="px-4 md:px-5 py-2 rounded-xl bg-slate-900 text-white text-xs md:text-sm font-bold hover:bg-slate-800 transition-all">الكل</Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-slate-50/50">
                  <tr className="text-slate-500 text-xs font-bold border-b border-slate-50">
                    <th className="px-8 py-4">الطالب</th>
                    <th className="px-8 py-4">المرحلة الدراسية</th>
                    <th className="px-8 py-4">تاريخ التسجيل</th>
                    <th className="px-8 py-4">الحالة</th>
                    <th className="px-8 py-4 text-left">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                            <Users className="w-8 h-8 text-slate-300" />
                          </div>
                          <p className="text-slate-400 font-bold">لا يوجد طلاب مسجلين حالياً</p>
                        </div>
                      </td>
                    </tr>
                  ) : recentStudents.map((student, i) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xs">
                            {student.name?.charAt(0) || "S"}
                          </div>
                          <span className="font-bold text-slate-700">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">{student.grade || "غير محدد"}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          {student.createdAt ? new Date(student.createdAt).toLocaleDateString('ar-EG') : "—"}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                          نشط
                        </span>
                      </td>
                      <td className="px-8 py-5 text-left">
                        <Link href={`/school-admin/students`} className="w-8 h-8 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                          <ChevronRight className="w-4 h-4 rotate-180" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon, color, trend }: any) {
  const bgColors: any = {
    blue: "bg-blue-50",
    indigo: "bg-indigo-50",
    purple: "bg-purple-50",
    emerald: "bg-emerald-50"
  };

  const textColors: any = {
    blue: "text-blue-600",
    indigo: "text-indigo-600",
    purple: "text-purple-600",
    emerald: "text-emerald-600"
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-[20px] md:rounded-[28px] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-3 md:mb-4">
        <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl ${bgColors[color]} flex items-center justify-center ${textColors[color]} group-hover:scale-110 transition-transform`}>
          {React.cloneElement(icon, { className: "w-5 h-5 md:w-7 md:h-7" })}
        </div>
        <div className="flex flex-col items-end">
          <ArrowUpRight className="w-3.5 h-3.5 md:w-5 md:h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
        </div>
      </div>
      <div>
        <p className="text-slate-400 text-[9px] md:text-[10px] font-bold mb-1 uppercase tracking-wider">{title}</p>
        <h3 className="text-xl md:text-3xl font-black text-slate-900 mb-1 md:mb-2">{value}</h3>
        <p className="text-[9px] md:text-[11px] font-bold text-slate-400 flex items-center gap-1">
          <TrendingUp className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-500" />
          {trend}
        </p>
      </div>
    </div>
  );
}

