"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { BookOpen, Play, Clock, ChevronLeft, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("lms_token");
        if (!token) {
          router.push("/login");
          return;
        }

        const statsRes = await fetch(`${API_URL}/student/stats`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setCourses(statsData.courseProgresses || []);
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [router]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12" dir="rtl">
        {/* Animated Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-top duration-700">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2 flex items-center gap-3">
              متابعة المقررات
              <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
            </h1>
            <p className="text-slate-500 font-bold text-lg">شاهد تقدمك الفعلي في كل كورس وحقق أهدافك!</p>
          </div>
        </div>

        {/* Courses Grid with Entrance Animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.length > 0 ? courses.map((course, index) => {
            const isFinished = course.progressPercent === 100;
            const hasStarted = course.progressPercent > 0;

            return (
              <div 
                key={course.id}
                onClick={() => router.push(`/courses/${course.id}`)}
                style={{ animationDelay: `${index * 100}ms` }}
                className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer group relative overflow-hidden animate-in fade-in zoom-in duration-700 fill-mode-both"
              >
                {/* Visual Glow Effect */}
                <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${isFinished ? 'bg-emerald-400' : 'bg-indigo-400'}`}></div>

                {isFinished && (
                  <div className="absolute top-0 left-0 bg-emerald-500 text-white px-6 py-1.5 text-[10px] font-black rounded-br-2xl shadow-lg flex items-center gap-2 animate-bounce-subtle">
                    <CheckCircle2 className="w-3 h-3" />
                    مكتمل 100%
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-6 ${isFinished ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100' : 'bg-indigo-50 text-indigo-600 shadow-indigo-100'} shadow-lg`}>
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black px-3 py-1.5 bg-slate-50 text-slate-500 rounded-xl block mb-2 border border-slate-100 uppercase tracking-widest">{course.subject}</span>
                    {course.lastAccessedAt && (
                       <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                          <Clock className="w-3 h-3" />
                          <span>نشاط: {new Date(course.lastAccessedAt).toLocaleDateString('ar-EG')}</span>
                       </div>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-black text-slate-900 mb-6 group-hover:text-indigo-600 transition-colors leading-tight min-h-[3rem]">{course.title}</h3>
                
                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">الإنجاز الحالي</p>
                      <p className="text-base font-black text-slate-800 flex items-center gap-2">
                        {course.completedLessonsCount} / {course.totalLessons}
                        <span className="text-xs text-slate-400 font-bold">دروس</span>
                      </p>
                    </div>
                    <div className="text-left">
                      <p className={`text-2xl font-black transition-colors duration-500 ${isFinished ? 'text-emerald-600' : 'text-indigo-600'}`}>{course.progressPercent}%</p>
                    </div>
                  </div>

                  {/* Enhanced Animated Progress Bar */}
                  <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden shadow-inner p-0.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out relative ${isFinished ? 'bg-gradient-to-l from-emerald-400 to-emerald-600' : 'bg-gradient-to-l from-indigo-500 to-indigo-700'}`} 
                      style={{ width: `${course.progressPercent}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-6 mt-2">
                     <div className="flex items-center gap-2">
                        {isFinished ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 font-black text-xs bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                            <CheckCircle2 className="w-4 h-4" />
                            برافو! تم بنجاح
                          </div>
                        ) : hasStarted ? (
                          <div className="flex items-center gap-1.5 text-amber-600 font-black text-xs bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></div>
                            قيد المذاكرة
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 font-black text-xs bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                            <Circle className="w-3.5 h-3.5" />
                            جاهز للبدء
                          </div>
                        )}
                     </div>
                     <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black hover:bg-indigo-600 hover:scale-105 active:scale-95 shadow-lg hover:shadow-indigo-200 transition-all flex items-center gap-2">
                        {isFinished ? 'مراجعة' : hasStarted ? 'أكمل الآن' : 'ابدأ الدرس'}
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                     </button>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-full py-24 text-center bg-white rounded-[50px] border-2 border-slate-100 border-dashed animate-pulse">
              <BookOpen className="w-20 h-20 text-slate-200 mx-auto mb-6" />
              <p className="text-slate-500 text-xl font-black">لا توجد مقررات دراسية حالياً</p>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s infinite ease-in-out;
        }
      `}</style>
    </DashboardLayout>
  );
}
