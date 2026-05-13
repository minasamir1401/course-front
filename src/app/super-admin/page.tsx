"use client";

import { API_URL } from '@/lib/api';
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Building2, Users, Shield, BookOpen,
  TrendingUp, Plus, Search, Settings,
  LogOut, Bell, LayoutDashboard, Globe, GraduationCap,
  ClipboardList, CheckCircle, Clock, ArrowUpRight, Activity,
  BarChart3, UserCheck, ChevronRight
} from "lucide-react";
import Link from "next/link";
import SuperAdminSidebar from "@/components/SuperAdminSidebar";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Mock data for charts - in real app this would come from API
  const schoolPerformanceData = [
    { name: 'الابتكارية', students: 450, growth: 12 },
    { name: 'المستقبل', students: 320, growth: 8 },
    { name: 'الرواد', students: 280, growth: 15 },
    { name: 'الأندلس', students: 510, growth: 5 },
    { name: 'المنار', students: 190, growth: 22 },
  ];

  const examsActivityData = [
    { day: 'الأحد', exams: 12, submissions: 450 },
    { day: 'الاثنين', exams: 18, submissions: 620 },
    { day: 'الثلاثاء', exams: 15, submissions: 580 },
    { day: 'الأربعاء', exams: 25, submissions: 890 },
    { day: 'الخميس', exams: 22, submissions: 760 },
  ];

  useEffect(() => {
    const token = localStorage.getItem("super_admin_token");
    if (!token) {
      router.push("/super-admin/login");
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await fetch(API_URL + "/super-admin/stats", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    setMounted(true);
  }, [router]);

  return (
    <DashboardLayout>
      <div className="space-y-10" dir="rtl">

        {/* Modern Dynamic Header */}
        <div className="relative overflow-hidden mb-10 rounded-[32px] bg-white border border-slate-100 shadow-sm p-8 sm:p-12">
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex items-center gap-6 text-right">
              <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-indigo-600/20 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <LayoutDashboard className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">مركز القيادة والتحكم</h1>
                <p className="text-slate-400 text-lg font-medium max-w-xl leading-relaxed">أهلاً بك مجدداً. إليك تقرير شامل عن أداء المنصة وجميع المدارس المرتبطة بالنظام.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex -space-x-4 space-x-reverse items-center ml-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold overflow-hidden shadow-sm">
                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-white bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">+12</div>
              </div>
              <button className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-slate-900/10">
                <Plus className="w-5 h-5" />
                إضافة مدرسة جديدة
              </button>
            </div>
          </div>

          {/* Abstract Decorations */}
          <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[60%] bg-purple-600 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[50%] bg-blue-600 blur-[100px] rounded-full"></div>
          </div>
        </div>

        {/* Stats Grid - Premium Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-10">
          <StatCard
            title="إجمالي المدارس"
            value={isLoading ? "..." : (stats?.schoolsCount || 0)}
            icon={<Building2 />}
            color="purple"
            trend="+2 هذا الشهر"
          />
          <StatCard
            title="إجمالي الطلاب"
            value={isLoading ? "..." : (stats?.studentsCount || 0)}
            icon={<GraduationCap />}
            color="blue"
            trend="+124 طالب جديد"
          />
          <StatCard
            title="إجمالي المعلمين"
            value={isLoading ? "..." : (stats?.teachersCount || 48)}
            icon={<Users />}
            color="amber"
            trend="نشط الآن"
          />
          <StatCard
            title="امتحانات نشطة"
            value={isLoading ? "..." : (stats?.activeExams || 15)}
            icon={<ClipboardList />}
            color="emerald"
            trend="عبر 8 مدارس"
          />
          <StatCard
            title="امتحانات مركزية"
            value={isLoading ? "..." : (stats?.centralExamsCount || 6)}
            icon={<Shield />}
            color="indigo"
            trend="قيد التنفيذ"
          />
        </div>

        {/* Visual Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* School Distribution Chart */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-1">توزيع الطلاب</h3>
                <p className="text-slate-400 text-sm">أكبر المدارس من حيث عدد الطلاب</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>

            <div className="h-[300px] w-full relative z-10">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={schoolPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.02)" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '16px', color: '#0f172a' }}
                      cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    />
                    <Bar dataKey="students" radius={[8, 8, 0, 0]}>
                      {schoolPerformanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4f46e5' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-purple-600/5 to-transparent pointer-events-none"></div>
          </div>

          {/* Activity Trend Area Chart */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-1">نشاط المنصة</h3>
                <p className="text-slate-400 text-sm">معدل الامتحانات والنتائج الأسبوعي</p>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></div>
                  مباشر
                </div>
              </div>
            </div>

            <div className="h-[300px] w-full relative z-10">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={examsActivityData}>
                    <defs>
                      <linearGradient id="colorExams" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.02)" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '16px', color: '#0f172a' }}
                    />
                    <Area type="monotone" dataKey="submissions" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorExams)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Quick Management Actions & Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
          {/* Management Shortcuts */}
          <div className="xl:col-span-1 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 px-2">إجراءات سريعة</h3>

            <QuickAction
              title="المدارس"
              desc="إدارة 24 مدرسة مسجلة"
              icon={<Building2 />}
              href="/super-admin/schools"
              color="from-indigo-600 to-blue-600"
            />
            <QuickAction
              title="الامتحانات المركزية"
              desc="إنشاء وتوزيع الاختبارات"
              icon={<Shield />}
              href="/super-admin/exams/new"
              color="from-blue-600 to-cyan-600"
            />
            <QuickAction
              title="إدارة الصلاحيات"
              desc="تعيين مشرفي الامتحانات"
              icon={<UserCheck />}
              href="/super-admin/users"
              color="from-amber-600 to-orange-600"
            />
          </div>

          {/* Recent Schools / Activity Table */}
          <div className="xl:col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900">آخر المدارس المسجلة</h3>
              <Link href="/super-admin/schools" className="text-indigo-600 text-sm font-bold hover:underline">عرض الكل</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-slate-400 text-sm border-b border-slate-50">
                    <th className="px-8 py-5 font-bold">المدرسة</th>
                    <th className="px-8 py-5 font-bold">المرحلة</th>
                    <th className="px-8 py-5 font-bold">الطلاب</th>
                    <th className="px-8 py-5 font-bold">الحالة</th>
                    <th className="px-8 py-5 font-bold">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[
                    { name: 'الابتكارية الدولية', type: 'High School', students: 540, status: 'نشط', color: 'emerald' },
                    { name: 'مدرسة المستقبل', type: 'Middle School', students: 320, status: 'نشط', color: 'emerald' },
                    { name: 'مدارس الرواد', type: 'Primary', students: 180, status: 'موقف', color: 'red' },
                  ].map((school, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-${school.color}-50 text-${school.color}-600 flex items-center justify-center font-bold border border-${school.color}-100`}>
                            {school.name.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{school.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-slate-500 text-sm font-medium">{school.type}</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-900 font-bold">{school.students}</span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600" style={{ width: '70%' }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${school.status === 'نشط' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                          {school.status}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <Link
                          href={`/super-admin/schools/${school.name === 'الابتكارية الدولية' ? 'school-1' : 'school-2'}`}
                          className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Reusable StatCard Component
function StatCard({ title, value, icon, color, trend }: any) {
  const colors: any = {
    purple: "from-purple-500 to-pink-500",
    blue: "from-blue-500 to-cyan-500",
    amber: "from-amber-500 to-orange-500",
    emerald: "from-emerald-500 to-teal-500",
    indigo: "from-indigo-500 to-purple-500"
  };

  return (
    <div className="bg-white p-6 rounded-[24px] border border-slate-100 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 shadow-sm hover:shadow-xl">
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${colors[color]}`}></div>
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all duration-500`}>
          {React.cloneElement(icon, { className: "w-6 h-6" })}
        </div>
        <div className="px-2 py-1 rounded-lg bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider">
          إحصائيات
        </div>
      </div>
      <p className="text-slate-400 text-xs font-bold mb-1">{title}</p>
      <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{value}</h3>
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
        {trend}
      </div>
    </div>
  );
}

// Reusable QuickAction Component
function QuickAction({ title, desc, icon, href, color }: any) {
  return (
    <Link href={href} className="flex items-center gap-4 p-5 rounded-[24px] bg-white border border-slate-100 hover:border-indigo-200 transition-all group relative overflow-hidden shadow-sm hover:shadow-xl">
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg shadow-indigo-600/10 group-hover:scale-110 transition-transform duration-500`}>
        {React.cloneElement(icon, { className: "w-7 h-7" })}
      </div>
      <div className="relative z-10">
        <h4 className="text-slate-900 font-black group-hover:text-indigo-600 transition-colors">{title}</h4>
        <p className="text-slate-400 text-sm font-medium">{desc}</p>
      </div>
      <div className="mr-auto w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
        <ChevronRight className="w-5 h-5" />
      </div>
    </Link>
  );
}


