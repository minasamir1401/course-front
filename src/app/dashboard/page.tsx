"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { BookOpen, Clock, TrendingUp, Award, Play, ArrowUpRight, FileText, Sparkles, Zap, ListOrdered, GraduationCap, Target, Calendar, ArrowLeft, ChevronLeft } from 'lucide-react';
import { useRouter } from "next/navigation";
import { fetchStudentStats } from "@/lib/student-stats";
import { API_URL } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const chartData = [
  { name: 'السبت', value: 20 },
  { name: 'الأحد', value: 35 },
  { name: 'الإثنين', value: 55 },
  { name: 'الثلاثاء', value: 50 },
  { name: 'الأربعاء', value: 75 },
  { name: 'الخميس', value: 55 },
  { name: 'الجمعة', value: 55 },
];

export default function StudentDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("STUDENT");
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const { t, language } = useLanguage();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("lms_token") || 
                      localStorage.getItem("school_admin_token") || 
                      localStorage.getItem("super_admin_token") || 
                      localStorage.getItem("token");
        const userStr = localStorage.getItem("lms_user") || 
                        localStorage.getItem("school_admin_user") || 
                        localStorage.getItem("super_admin_user") || 
                        localStorage.getItem("user");
        if (!token || !userStr) {
          router.push("/login");
          return;
        }

        const user = JSON.parse(userStr);
        setUserRole(user.role || "STUDENT");

        if (user.role === "TEACHER") {
          setIsLoading(false);
          return;
        }

        const statsData = await fetchStudentStats(token);
        setStats(statsData);

        // Fetch real exams & upcoming tasks for student
        try {
          const examsRes = await fetch(`${API_URL}/exams`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const mappedTasks: any[] = [];
          const now = new Date();
          const colors = ['bg-fuchsia-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-indigo-500'];

          if (examsRes.ok) {
            const examsData = await examsRes.json();
            if (Array.isArray(examsData)) {
              examsData.slice(0, 5).forEach((exam: any, index: number) => {
                const taskDate = exam.createdAt ? new Date(exam.createdAt) : now;
                mappedTasks.push({
                  id: exam.id,
                  type: 'EXAM',
                  subject: exam.subject || (language === 'ar' ? 'اختبار' : 'Exam'),
                  title: exam.title,
                  date: taskDate,
                  color: colors[index % colors.length],
                  link: `/exams/${exam.id}`
                });
              });
            }
          }

          if (mappedTasks.length < 4 && statsData?.courseProgresses) {
            statsData.courseProgresses.forEach((course: any, idx: number) => {
              if (mappedTasks.length >= 4) return;
              if (course.progressPercent < 100) {
                mappedTasks.push({
                  id: course.id,
                  type: 'COURSE',
                  subject: course.subject || (language === 'ar' ? 'مادة دراسية' : 'Subject'),
                  title: language === 'ar' ? `متابعة دراسة كورس: ${course.title}` : `Continue course: ${course.title}`,
                  date: new Date(now.getTime() + (idx + 1) * 86400000),
                  color: colors[(mappedTasks.length + idx) % colors.length],
                  link: `/courses/${course.id}`
                });
              }
            });
          }

          setUpcomingTasks(mappedTasks);
        } catch (taskErr) {
          console.error("Error fetching student tasks:", taskErr);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [router, language]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center space-y-6">
            <p className="text-indigo-600 font-black text-sm uppercase tracking-[4px] animate-pulse">{t('dashboard.preparing')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (userRole === "TEACHER") {
    return (
      <DashboardLayout>
        <div className="w-full max-w-[1600px] mx-auto space-y-6 md:space-y-12 pb-24 px-2 md:px-4" dir="rtl">
          <div className="relative overflow-hidden rounded-[32px] md:rounded-[48px] premium-gradient-primary shadow-2xl shadow-indigo-500/20 group">
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-white/10 blur-[120px] rounded-full animate-pulse" />
            <div className="relative z-10 px-4 py-10 md:px-20 md:py-24 flex flex-col items-center justify-center gap-6 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
                <Sparkles className="w-4 h-4 text-amber-300 floating" />
                <span className="text-white text-[10px] font-black uppercase tracking-widest">{t('teacherDashboard.portal')}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight px-2">
                {t('teacherDashboard.welcome')}
              </h1>
              <p className="text-indigo-50 text-base md:text-xl lg:text-2xl font-medium max-w-2xl leading-relaxed opacity-90 px-4">
                {t('teacherDashboard.subtitle')}
              </p>
              <div className="flex flex-wrap justify-center gap-3 md:gap-4 pt-4 px-2">
                <button
                  onClick={() => router.push('/courses')}
                  className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-white text-indigo-600 rounded-xl md:rounded-2xl font-black text-base md:text-lg hover:scale-105 transition-all flex items-center justify-center gap-2 md:gap-3"
                >
                  <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
                  {t('teacherDashboard.courses')}
                </button>
                <button
                  onClick={() => router.push('/exams')}
                  className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-indigo-500/30 border border-white/20 text-white rounded-xl md:rounded-2xl font-black text-base md:text-lg hover:bg-white hover:text-indigo-600 transition-all flex items-center justify-center gap-2 md:gap-3"
                >
                  <FileText className="w-4 h-4 md:w-5 md:h-5" />
                  {t('teacherDashboard.exams')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const completedLessonsCount = stats?.lessonProgresses?.filter((p: any) => p.isCompleted).length || 0;
  const totalLessonsCount = stats?.courseProgresses?.reduce((sum: number, c: any) => sum + (c.totalLessons || 0), 0) || 0;
  const totalWatchedSeconds = stats?.lessonProgresses?.reduce((sum: number, p: any) => sum + (p.watchedSeconds || 0), 0) || 0;
  
  const learningHours = Math.round((totalWatchedSeconds / 3600) * 10) / 10;
  const progressRate = stats?.overallCourseProgress || 0;

  const badge1Earned = completedLessonsCount >= 1;
  const badge2Earned = completedLessonsCount >= 5;
  const badge3Earned = progressRate >= 75;
  const totalBadges = [badge1Earned, badge2Earned, badge3Earned].filter(Boolean).length;

  const translatedChartData = stats?.submissions && stats.submissions.length > 0
    ? stats.submissions.slice(0, 7).reverse().map((sub: any) => {
        const dateObj = new Date(sub.createdAt);
        const dayName = dateObj.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' });
        return {
          name: dayName,
          value: Math.round(sub.percentage || 0)
        };
      })
    : [
        { name: language === 'ar' ? 'السبت' : 'Sat', value: 0 },
        { name: language === 'ar' ? 'الأحد' : 'Sun', value: 0 },
        { name: language === 'ar' ? 'الإثنين' : 'Mon', value: 0 },
        { name: language === 'ar' ? 'الثلاثاء' : 'Tue', value: 0 },
        { name: language === 'ar' ? 'الأربعاء' : 'Wed', value: 0 },
        { name: language === 'ar' ? 'الخميس' : 'Thu', value: 0 },
        { name: language === 'ar' ? 'الجمعة' : 'Fri', value: 0 }
      ];

  return (
    <DashboardLayout>
      <div className={`w-full max-w-[1400px] mx-auto space-y-6 md:space-y-8 pb-24 px-4 sm:px-6 md:px-8 bg-slate-50/50 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? "rtl" : "ltr"}>
        
        {/* HERO CARD */}
        <div className="relative w-full rounded-[32px] bg-gradient-to-r from-[#200547] via-[#310c73] to-[#4514a3] overflow-hidden flex flex-col md:flex-row items-center justify-between p-8 md:p-12 shadow-xl shadow-indigo-900/20">
          {/* Abstract wavy lines in background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
            <svg className="absolute w-[200%] h-full left-0 top-0 text-white" viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,160 C320,300,420,0,740,160 C1060,320,1160,0,1440,160" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M0,200 C220,350,320,50,640,200 C960,350,1060,50,1440,200" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/30 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-fuchsia-500/20 rounded-full blur-[100px]" />
          </div>

          {/* Right Area (Books Image) */}
          <div className="w-full md:w-1/3 flex justify-center md:justify-start relative z-10 order-1 mb-8 md:mb-0">
             <img loading="lazy" decoding="async" src="https://cdn3d.iconscout.com/3d/premium/thumb/graduation-cap-and-books-5358784-4487403.png" 
               alt="Graduation Books" 
               className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-2xl" 
               onError={(e) => { e.currentTarget.style.display = 'none'; }}
             />
          </div>

          {/* Middle Area (Text & Progress Bar) */}
          <div className="w-full md:w-1/3 relative z-10 order-2 flex flex-col items-center md:items-start text-white space-y-3 px-4">
             <h1 className="text-3xl md:text-4xl font-black mb-1">
               {language === 'ar' ? 'تقدمك هذا الأسبوع' : 'Your Progress This Week'}
             </h1>
             <p className="text-white/80 font-medium text-xs md:text-sm">
               {language === 'ar' ? 'واصل التعلم لتحقيق هدفك الأسبوعي' : 'Keep learning to achieve your weekly goal'}
             </p>
             
             <div className="w-full mt-6 bg-white/5 p-1 rounded-full flex items-center gap-3 border border-white/10 backdrop-blur-sm relative shadow-inner">
                <div className="h-4 flex-1 bg-white/5 rounded-full overflow-hidden shadow-inner relative">
                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-fuchsia-400 to-indigo-300 rounded-full shadow-[0_0_15px_rgba(217,70,239,0.5)]" style={{ width: `${progressRate}%` }} />
                </div>
                <span className="font-bold text-sm px-3">{progressRate}%</span>
             </div>
             <p className="text-[10px] md:text-xs font-bold text-white/90 pt-1 flex items-center gap-1">
               {language === 'ar' ? 'أنت على الطريق الصحيح! 🎉' : 'You are on the right track! 🎉'}
             </p>
          </div>

          {/* Left Area (Circular Progress) */}
          <div className="w-full md:w-1/3 relative z-10 order-3 flex justify-center md:justify-end mt-8 md:mt-0">
             <div className="relative w-48 h-48 md:w-52 md:h-52">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background Circle */}
                  <circle className="stroke-white/10 stroke-[3] fill-none" cx="18" cy="18" r="15.9155" />
                  {/* Progress Circle */}
                  <circle
                    className="stroke-[#b165ff] stroke-[3.5] stroke-linecap-round fill-none drop-shadow-[0_0_15px_rgba(177,101,255,0.6)] transition-all duration-1000 ease-out"
                    strokeDasharray={`${progressRate}, 100`}
                    cx="18" cy="18" r="15.9155"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <span className="text-4xl md:text-5xl font-black text-white">{progressRate}%</span>
                   <span className="text-white/80 text-sm md:text-base font-bold mt-1">
                     {language === 'ar' ? 'مكتمل' : 'Completed'}
                   </span>
                </div>
             </div>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
           <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
              <div className="space-y-2">
                 <p className="text-slate-500 text-xs md:text-sm font-bold">
                   {language === 'ar' ? 'ساعات التعلم' : 'Learning Hours'}
                 </p>
                 <p className="text-3xl md:text-4xl font-black text-slate-900">{learningHours}</p>
                 <p className="text-[10px] md:text-xs font-bold text-emerald-500 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {language === 'ar' ? 'محدث للتو' : 'Just updated'}
                 </p>
              </div>
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#f0ebff] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                 <Clock className="w-6 h-6 md:w-7 md:h-7 text-[#8b5cf6]" />
              </div>
           </div>

           <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
              <div className="space-y-2">
                 <p className="text-slate-500 text-xs md:text-sm font-bold">
                   {language === 'ar' ? 'الدروس المكتملة' : 'Completed Lessons'}
                 </p>
                 <p className="text-3xl md:text-4xl font-black text-slate-900">{completedLessonsCount}</p>
                 <p className="text-[10px] md:text-xs font-bold text-slate-400">
                   {language === 'ar' ? `من أصل ${totalLessonsCount} درس` : `Out of ${totalLessonsCount} lessons`}
                 </p>
              </div>
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#e0f2fe] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                 <BookOpen className="w-6 h-6 md:w-7 md:h-7 text-[#0ea5e9]" />
              </div>
           </div>

           <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
              <div className="space-y-2">
                 <p className="text-slate-500 text-xs md:text-sm font-bold">
                   {language === 'ar' ? 'نسبة التقدم' : 'Progress Rate'}
                 </p>
                 <p className="text-3xl md:text-4xl font-black text-slate-900">{progressRate}%</p>
                 <p className="text-[10px] md:text-xs font-bold text-emerald-500 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {language === 'ar' ? 'شاهد مسارك التعليمي' : 'View learning path'}
                 </p>
              </div>
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#dcfce7] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                 <TrendingUp className="w-6 h-6 md:w-7 md:h-7 text-[#22c55e]" />
              </div>
           </div>

           <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
              <div className="space-y-2">
                 <p className="text-slate-500 text-xs md:text-sm font-bold">
                   {language === 'ar' ? 'الشارات' : 'Badges'}
                 </p>
                 <p className="text-3xl md:text-4xl font-black text-slate-900">{totalBadges}</p>
                 <p className="text-[10px] md:text-xs font-bold text-slate-400">
                   {language === 'ar' ? 'من أصل 3 شارات متاحة' : 'Out of 3 available'}
                 </p>
              </div>
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#ffedd5] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                 <Award className="w-6 h-6 md:w-7 md:h-7 text-[#f97316]" />
              </div>
           </div>
        </div>

        {/* CALENDAR & UPCOMING TASKS */}
        {(() => {
          // Dynamic Calendar Calculation
          const calYear = calendarDate.getFullYear();
          const calMonth = calendarDate.getMonth();
          const firstDayIndex = new Date(calYear, calMonth, 1).getDay(); // 0 = Sun
          const daysInCalMonth = new Date(calYear, calMonth + 1, 0).getDate();
          const prevCalMonthDays = new Date(calYear, calMonth, 0).getDate();

          const calendarGrid: Array<{ day: number; isCurrentMonth: boolean; fullDateStr: string; hasTask?: boolean; taskColor?: string }> = [];

          for (let i = firstDayIndex - 1; i >= 0; i--) {
            calendarGrid.push({ day: prevCalMonthDays - i, isCurrentMonth: false, fullDateStr: '' });
          }

          const todayDateObj = new Date();
          const isSelectedMonthCurrent = todayDateObj.getFullYear() === calYear && todayDateObj.getMonth() === calMonth;
          const currentTodayDay = todayDateObj.getDate();

          for (let d = 1; d <= daysInCalMonth; d++) {
            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const matchingTask = upcomingTasks.find(t => {
              const td = new Date(t.date);
              return td.getFullYear() === calYear && td.getMonth() === calMonth && td.getDate() === d;
            });

            calendarGrid.push({
              day: d,
              isCurrentMonth: true,
              fullDateStr: dateStr,
              hasTask: Boolean(matchingTask),
              taskColor: matchingTask?.color
            });
          }

          const totalGridCells = calendarGrid.length > 35 ? 42 : 35;
          const remainingGridCells = totalGridCells - calendarGrid.length;
          for (let i = 1; i <= remainingGridCells; i++) {
            calendarGrid.push({ day: i, isCurrentMonth: false, fullDateStr: '' });
          }

          const prevMonth = () => setCalendarDate(new Date(calYear, calMonth - 1, 1));
          const nextMonth = () => setCalendarDate(new Date(calYear, calMonth + 1, 1));

          const monthFormatted = calendarDate.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' });
          const todayFormatted = todayDateObj.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
          const todayTasksCount = upcomingTasks.filter(t => {
            const td = new Date(t.date);
            return td.toDateString() === todayDateObj.toDateString();
          }).length;

          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
               
               {/* Dynamic Calendar */}
               <div className="lg:col-span-5 bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                     <h2 className="text-xl font-black text-slate-900">
                       {language === 'ar' ? 'التقويم' : 'Calendar'}
                     </h2>
                  </div>
                  <div className="flex items-center justify-between gap-4 mb-8 relative px-2">
                     <button onClick={prevMonth} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                        <ChevronLeft className="w-5 h-5 text-slate-900 rotate-180" />
                     </button>
                     <span className="text-base md:text-lg font-black text-slate-900 capitalize">
                       {monthFormatted}
                     </span>
                     <button onClick={nextMonth} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                        <ChevronLeft className="w-5 h-5 text-slate-900" />
                     </button>
                  </div>

                  <div className="grid grid-cols-7 gap-2 text-center mb-6">
                     {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((day, i) => (
                        <div key={day} className="text-[10px] md:text-xs font-black text-slate-500">
                          {language === 'ar' ? day : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}
                        </div>
                     ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-y-6 gap-x-2 text-center text-xs md:text-sm font-bold text-slate-700 items-center">
                     {calendarGrid.map((item, idx) => {
                       if (!item.isCurrentMonth) {
                         return <div key={idx} className="text-slate-300">{item.day}</div>;
                       }
                       const isToday = isSelectedMonthCurrent && item.day === currentTodayDay;
                       if (isToday) {
                         return (
                           <div key={idx} className="bg-[#5c27f2] text-white w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-indigo-200 font-black">
                             {item.day}
                           </div>
                         );
                       }
                       if (item.hasTask) {
                         return (
                           <div key={idx} className="relative flex justify-center cursor-pointer">
                             <span className="z-10 relative">{item.day}</span>
                             <span className={`absolute bottom-[-10px] w-1.5 h-1.5 ${item.taskColor || 'bg-fuchsia-500'} rounded-full`} />
                           </div>
                         );
                       }
                       return <div key={idx}>{item.day}</div>;
                     })}
                  </div>

                  <div className="mt-auto pt-8">
                     <div className="bg-[#f5f3ff] rounded-xl p-4 flex items-center justify-between text-[#5c27f2] font-black text-xs md:text-sm">
                        <div className="flex items-center gap-2">
                           <Calendar className="w-4 h-4 text-[#5c27f2]" />
                           {todayTasksCount > 0 
                             ? (language === 'ar' ? `${todayTasksCount} مهام اليوم` : `${todayTasksCount} tasks today`)
                             : (language === 'ar' ? 'لا توجد مهام اليوم' : 'No tasks today')
                           }
                        </div>
                        <div className="text-indigo-400 font-bold">
                          {language === 'ar' ? `اليوم: ${todayFormatted}` : `Today: ${todayFormatted}`}
                        </div>
                     </div>
                  </div>
               </div>

               {/* Dynamic Upcoming Tasks */}
               <div className="lg:col-span-7 bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                     <h2 className="text-xl font-black text-slate-900">
                       {language === 'ar' ? 'المهام القادمة' : 'Upcoming Tasks'}
                     </h2>
                     <button onClick={() => router.push('/exams')} className="text-[#5c27f2] font-black text-xs md:text-sm hover:underline">
                       {language === 'ar' ? 'عرض الكل' : 'Explore All'}
                     </button>
                  </div>

                  <div className="flex-1 space-y-2">
                     {upcomingTasks.length === 0 ? (
                       <div className="py-12 text-center space-y-3">
                         <p className="text-slate-400 font-bold text-sm">
                           {language === 'ar' ? 'لا توجد مهام قادمة حالياً' : 'No upcoming tasks right now'}
                         </p>
                         <button onClick={() => router.push('/courses')} className="px-4 py-2 bg-indigo-50 text-[#5c27f2] font-black text-xs rounded-xl hover:bg-indigo-100 transition-colors">
                           {language === 'ar' ? 'استكشف الكورسات' : 'Explore Courses'}
                         </button>
                       </div>
                     ) : (
                       upcomingTasks.map((task, idx) => {
                         const taskDate = new Date(task.date);
                         const isToday = taskDate.toDateString() === todayDateObj.toDateString();
                         const isTomorrow = taskDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

                         let dateBadge = isToday
                           ? (language === 'ar' ? 'اليوم' : 'Today')
                           : isTomorrow
                           ? (language === 'ar' ? 'غداً' : 'Tomorrow')
                           : taskDate.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' });

                         return (
                           <div 
                             key={task.id + idx}
                             onClick={() => router.push(task.link)}
                             className="flex items-center justify-between border-b border-slate-50 py-4 hover:bg-slate-50/50 transition-colors px-2 rounded-xl cursor-pointer group"
                           >
                              <div className="flex items-center gap-4">
                                 <div className={`w-2.5 h-2.5 rounded-full ${task.color || 'bg-fuchsia-500'} group-hover:scale-125 transition-transform`} />
                                 <div>
                                    <p className="text-slate-400 text-[10px] md:text-xs font-bold mb-1">{task.subject}</p>
                                    <p className="text-slate-900 font-black text-xs md:text-sm group-hover:text-[#5c27f2] transition-colors">{task.title}</p>
                                 </div>
                              </div>
                              <div className="text-left flex flex-col items-end">
                                 <p className="text-slate-500 text-[10px] md:text-xs font-bold flex items-center gap-1.5 mb-1">
                                   <Calendar className="w-3 h-3 text-slate-400" /> {dateBadge}
                                 </p>
                                 <p className="text-slate-400 text-[10px]">11:59 PM</p>
                              </div>
                           </div>
                         );
                       })
                     )}
                  </div>

                  <button onClick={() => router.push('/courses')} className="w-full mt-6 py-4 bg-[#f5f3ff] text-[#5c27f2] font-black text-sm rounded-2xl hover:bg-[#ede9fe] transition-colors">
                     {language === 'ar' ? 'عرض جميع الكورسات والمهام' : 'Show All Courses & Tasks'}
                  </button>
               </div>
            </div>
          );
        })()}

        {/* BOTTOM GRID (Achievements & Line Chart) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
           
           {/* Achievements */}
           <div className="lg:col-span-4 bg-[#21094e] rounded-[32px] p-6 md:p-8 shadow-sm flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-48 h-48 bg-[#4c1d95]/40 rounded-full blur-[60px] pointer-events-none" />
              
              <div className="flex items-center justify-between mb-10 relative z-10">
                 <h2 className="text-xl font-black text-white">
                   {language === 'ar' ? 'إنجازاتك' : 'Your Achievements'}
                 </h2>
                 <button className="text-white/70 text-xs font-bold hover:text-white transition-colors">
                   {language === 'ar' ? 'عرض الكل' : 'Explore All'}
                 </button>
              </div>

              <div className="flex items-center justify-between gap-2 relative z-10 mt-auto">
                 {/* Badge 1 */}
                 <div className="flex flex-col items-center">
                    <div className="w-16 h-20 md:w-20 md:h-24 bg-gradient-to-b from-[#c084fc] to-[#7e22ce] [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)] flex items-center justify-center mb-4 shadow-lg border-2 border-[#d8b4fe]/30">
                       <div className="w-[85%] h-[88%] bg-gradient-to-b from-[#a855f7] to-[#6b21a8] [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)] flex items-center justify-center">
                          <Zap className="w-8 h-8 text-white fill-white drop-shadow-md" />
                       </div>
                    </div>
                    <p className="text-white font-black text-xs md:text-sm mb-1">
                      {language === 'ar' ? 'المثابر' : 'Persister'}
                    </p>
                    <p className="text-white/70 text-[9px] md:text-[10px] text-center font-bold">
                      {language === 'ar' ? '7 أيام متتالية' : '7 consecutive days'}
                    </p>
                 </div>

                 {/* Badge 2 */}
                 <div className="flex flex-col items-center">
                    <div className="w-16 h-20 md:w-20 md:h-24 bg-gradient-to-b from-[#34d399] to-[#047857] [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)] flex items-center justify-center mb-4 shadow-lg border-2 border-[#6ee7b7]/30">
                       <div className="w-[85%] h-[88%] bg-gradient-to-b from-[#10b981] to-[#065f46] [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)] flex items-center justify-center">
                          <Target className="w-8 h-8 text-white drop-shadow-md" />
                       </div>
                    </div>
                    <p className="text-white font-black text-xs md:text-sm mb-1">
                      {language === 'ar' ? 'المنجز' : 'Achiever'}
                    </p>
                    <p className="text-white/70 text-[9px] md:text-[10px] text-center font-bold">
                      {language === 'ar' ? 'أكملت 10 دروس' : 'Completed 10 lessons'}
                    </p>
                 </div>

                 {/* Badge 3 */}
                 <div className="flex flex-col items-center">
                    <div className="w-16 h-20 md:w-20 md:h-24 bg-gradient-to-b from-[#fbbf24] to-[#c2410c] [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)] flex items-center justify-center mb-4 shadow-lg border-2 border-[#fcd34d]/30">
                       <div className="w-[85%] h-[88%] bg-gradient-to-b from-[#f59e0b] to-[#9a3412] [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)] flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-white fill-white drop-shadow-md" />
                       </div>
                    </div>
                    <p className="text-white font-black text-xs md:text-sm mb-1">
                      {language === 'ar' ? 'المتفوق' : 'Outstanding'}
                    </p>
                    <p className="text-white/70 text-[9px] md:text-[10px] text-center font-bold">
                      {language === 'ar' ? 'نسبة تقدم 75%' : '75% progress'}
                    </p>
                 </div>
              </div>
           </div>

           {/* Chart Overview */}
           <div className="lg:col-span-8 bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-xl font-black text-slate-900">
                   {language === 'ar' ? 'نظرة عامة على أدائك' : 'Your Performance Overview'}
                 </h2>
                 <select className="bg-slate-50 border border-slate-100 text-slate-500 font-bold text-xs py-2 px-4 rounded-xl outline-none hover:bg-slate-100 cursor-pointer">
                    <option>{language === 'ar' ? 'هذا الأسبوع' : 'This Week'}</option>
                    <option>{language === 'ar' ? 'الشهر الماضي' : 'Last Month'}</option>
                 </select>
              </div>

              <div className="flex-1 w-full h-[220px]">
                 <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={translatedChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} 
                          dy={15} 
                       />
                       <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} 
                          domain={[0, 100]} 
                          ticks={[0, 25, 50, 75, 100]} 
                          tickFormatter={(value) => `${value}%`}
                       />
                       <Tooltip cursor={{ stroke: '#e2e8f0', strokeWidth: 2, strokeDasharray: '4 4' }} />
                       <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#7c3aed" 
                          strokeWidth={3} 
                          dot={{ r: 6, strokeWidth: 3, fill: '#fff', stroke: '#7c3aed' }} 
                          activeDot={{ r: 8, fill: '#2A1053', stroke: '#fff', strokeWidth: 3 }} 
                       />
                    </LineChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

