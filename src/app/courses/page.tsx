"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  BookOpen,
  Play,
  Clock,
  CheckCircle2,
  Sparkles,
  Search,
  Target,
  ArrowUpRight,
  MoreVertical,
  Filter
} from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL, getFullImageUrl } from "@/lib/api";

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("lms_token");
        if (!token) {
          router.push("/login");
          return;
        }

        const [statsRes, coursesRes] = await Promise.all([
          fetch(`${API_URL}/student/stats`, {
            headers: { "Authorization": `Bearer ${token}` }
          }),
          fetch(`${API_URL}/courses`, {
            headers: { "Authorization": `Bearer ${token}` }
          })
        ]);

        if (statsRes.ok && coursesRes.ok) {
          const statsData = await statsRes.json();
          const coursesRaw = await coursesRes.json();
          const coursesList = Array.isArray(coursesRaw) ? coursesRaw : (coursesRaw.courses || []);
          
          let progresses = statsData.courseProgresses || [];
          
          // Merge course details
          progresses = progresses.map((p: any) => {
            const fullCourse = coursesList.find((c: any) => c.id === p.id || c.id === p.courseId);
            return { ...p, ...fullCourse };
          });
          
          setCourses(progresses);
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [router]);

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-2xl shadow-indigo-100"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 pb-24 px-2 md:px-4" dir="rtl">
        
        {/* ── PREMIUM HEADER ── */}
        <div className="relative overflow-hidden rounded-[32px] md:rounded-[48px] premium-gradient-primary p-8 md:p-16 group shadow-2xl shadow-indigo-500/20">
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
           <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-white/10 blur-[100px] rounded-full animate-pulse" />
           
           <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8 md:gap-10">
              <div className="space-y-4 md:space-y-6 text-center lg:text-right w-full lg:w-auto">
                 <div className="inline-flex items-center gap-3 px-5 py-2 glass rounded-full border-white/20">
                    <Sparkles className="w-4 h-4 text-amber-300 floating" />
                    <span className="text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest">مسارك التعليمي المخصص</span>
                 </div>
                 <h1 className="text-3xl md:text-6xl font-black text-white leading-tight tracking-tight">
                    استكشف <span className="text-indigo-200">مقرراتك</span> الدراسية
                 </h1>
                 <p className="text-indigo-50/80 font-medium text-base md:text-lg max-w-xl leading-relaxed">
                    هنا تجد جميع مقرراتك الدراسية منظمة حسب التقدم. واصل رحلة تعلمك وحقق أهدافك اليوم!
                 </p>
              </div>

              <div className="w-full lg:w-[450px]">
                 <div className="relative group">
                    <input
                      type="text"
                      placeholder="ابحث عن كورس أو مادة..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full glass rounded-2xl md:rounded-[32px] py-4 md:py-6 pr-12 md:pr-14 pl-6 md:pl-8 text-white font-bold outline-none border-white/20 focus:border-white/40 focus:bg-white/10 transition-all placeholder:text-indigo-200 text-sm md:text-base"
                    />
                    <Search className="w-5 h-5 md:w-6 md:h-6 text-indigo-200 absolute right-5 md:right-6 top-1/2 -translate-y-1/2 group-focus-within:text-white transition-colors" />
                 </div>
              </div>
           </div>
        </div>

        {/* ── COURSE LIST VIEW ── */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 md:px-8">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                   <Target className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">جميع المقررات ({filteredCourses.length})</h2>
             </div>
             <div className="flex items-center gap-3">
                <button className="p-2.5 md:p-3 rounded-xl border border-slate-200 text-slate-400 hover:bg-white hover:text-indigo-600 transition-all">
                   <Filter className="w-5 h-5" />
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredCourses.length > 0 ? filteredCourses.map((course, index) => {
              const isFinished = course.progressPercent === 100;
              const hasStarted = course.progressPercent > 0;

              return (
                <div
                  key={course.id}
                  onClick={() => router.push(`/courses/${course.id}`)}
                  className="premium-card rounded-[32px] md:rounded-[40px] p-4 md:p-6 group cursor-pointer animate-in fade-in slide-in-from-bottom-6"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="flex flex-col lg:flex-row items-center gap-6 md:gap-8">
                    
                    {/* Thumbnail & Info */}
                    <div className="flex flex-1 items-center gap-4 md:gap-6 w-full lg:w-auto">
                      <div className={`relative w-20 h-20 md:w-40 md:h-28 rounded-2xl md:rounded-[28px] overflow-hidden shrink-0 shadow-2xl transition-transform duration-500 group-hover:scale-105 border border-slate-100 ${
                        isFinished ? 'shadow-emerald-100' : 'shadow-indigo-100'
                      }`}>
                        {(course.coverImage || course.course?.coverImage || course.image || course.thumbnail || course.courseImage) ? (
                          <img src={getFullImageUrl(course.coverImage || course.course?.coverImage || course.image || course.thumbnail || course.courseImage) || ""} className="w-full h-full object-cover" alt={course.title || course.course?.title} />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${
                            isFinished ? 'bg-emerald-50 text-emerald-500' : 'premium-gradient-primary text-white/40'
                          }`}>
                            <BookOpen className="w-8 h-8 md:w-10 md:h-10" />
                          </div>
                        )}
                        {isFinished && (
                           <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[2px] flex items-center justify-center">
                              <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-white" />
                           </div>
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-1.5 md:space-y-2 min-w-0">
                         <div className="flex items-center gap-3">
                            <span className={`text-[8px] md:text-[9px] font-black px-2 md:px-3 py-1 rounded-lg uppercase tracking-widest border ${
                               isFinished ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}>
                               {course.subject}
                            </span>
                            {hasStarted && !isFinished && (
                               <span className="flex items-center gap-1 text-[8px] md:text-[9px] font-black text-indigo-500 animate-pulse">
                                  <div className="w-1 h-1 rounded-full bg-indigo-500" />
                                  قيد التعلم
                               </span>
                            )}
                         </div>
                        <h3 className="text-lg md:text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate tracking-tight">
                          {course.title}
                        </h3>
                        <div className="flex items-center gap-3 md:gap-4 text-slate-400 font-bold text-[10px] md:text-xs">
                           <span className="flex items-center gap-1"><Clock className="w-3 md:w-3.5 h-3 md:h-3.5" /> 12 ساعة</span>
                           <span className="flex items-center gap-1"><Play className="w-3 md:w-3.5 h-3 md:h-3.5" /> {course.totalLessons || 0} درساً</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Metrics */}
                    <div className="w-full lg:w-72 flex flex-col gap-3 md:gap-4 md:px-4">
                      <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black">
                        <span className="text-slate-400 uppercase tracking-widest">إجمالي الإنجاز</span>
                        <span className={`px-2 py-0.5 md:py-1 rounded-md text-[10px] md:text-xs ${isFinished ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          {course.progressPercent}%
                        </span>
                      </div>
                      <div className="w-full h-2 md:h-2.5 bg-slate-50 rounded-full overflow-hidden shadow-inner p-0.5 border border-slate-100">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${
                            isFinished ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${course.progressPercent}%` }}
                        ></div>
                      </div>
                      <p className="text-[9px] md:text-[10px] text-slate-400 font-bold text-center">
                         {isFinished ? 'أحسنت! لقد أتممت هذا المقرر بنجاح' : course.lastAccessedAt ? `آخر نشاط: ${new Date(course.lastAccessedAt).toLocaleDateString('ar-EG')}` : 'ابدأ دراستك الآن'}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="w-full lg:w-auto flex items-center gap-3">
                       <button className={`flex-1 lg:flex-none px-6 md:px-10 py-4 md:py-5 rounded-2xl md:rounded-3xl text-xs md:text-sm font-black transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 ${
                          isFinished 
                          ? 'bg-slate-50 text-slate-900 hover:bg-slate-900 hover:text-white' 
                          : 'bg-indigo-600 text-white hover:bg-slate-900 hover:shadow-indigo-200'
                       }`}>
                         {isFinished ? 'مراجعة المقرر' : hasStarted ? 'متابعة التعلم' : 'ابدأ الآن'}
                         <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-y-1 group-hover:translate-x-[-4px] transition-transform" />
                       </button>
                       <button className="p-4 md:p-5 rounded-xl md:rounded-[24px] border border-slate-100 text-slate-400 hover:bg-slate-50 transition-all shrink-0">
                          <MoreVertical className="w-4 h-4 md:w-5 md:h-5" />
                       </button>
                    </div>

                  </div>
                </div>
              );
            }) : (
              <div className="py-24 md:py-40 text-center bg-white rounded-[40px] md:rounded-[60px] border-4 border-dashed border-slate-100 animate-in fade-in zoom-in duration-700 mx-4">
                <div className="w-20 h-20 md:w-28 md:h-28 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner">
                  <Search className="w-10 h-10 md:w-12 md:h-12 text-slate-200" />
                </div>
                <h3 className="text-slate-900 text-2xl md:text-3xl font-black mb-3 tracking-tight">لم يتم العثور على أي نتائج</h3>
                <p className="text-slate-400 font-bold text-base md:text-lg max-w-md mx-auto px-6">جرب البحث بكلمات أخرى أو تأكد من مسميات المواد الدراسية</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
