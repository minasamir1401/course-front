"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  BookOpen, 
  Play, 
  Clock, 
  ChevronLeft, 
  CheckCircle2, 
  Circle, 
  Sparkles,
  Search,
  Filter,
  BarChart3,
  ArrowRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

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

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-xl shadow-indigo-100"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-10 pb-20" dir="rtl">
        {/* Modern List Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-white p-8 md:p-12 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                المسار التعليمي
              </h1>
            </div>
            <p className="text-slate-500 font-bold text-lg max-w-xl leading-relaxed">
              هنا تجد جميع مقرراتك الدراسية منظمة حسب التقدم. واصل رحلة تعلمك الآن!
            </p>
          </div>

          <div className="w-full lg:w-96 relative z-10 space-y-4">
             <div className="relative group">
                <input 
                  type="text" 
                  placeholder="ابحث عن كورس أو مادة..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pr-12 pl-6 text-slate-900 font-bold outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-sm group-hover:shadow-md"
                />
                <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 transition-colors group-hover:text-indigo-600" />
             </div>
          </div>
        </div>

        {/* List View Container */}
        <div className="space-y-4">
          <div className="hidden md:grid grid-cols-12 gap-4 px-10 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
            <div className="col-span-5">المقرر والمادة</div>
            <div className="col-span-3 text-center">التقدم الدراسي</div>
            <div className="col-span-2 text-center">آخر نشاط</div>
            <div className="col-span-2 text-left">الإجراء</div>
          </div>

          {filteredCourses.length > 0 ? filteredCourses.map((course, index) => {
            const isFinished = course.progressPercent === 100;
            const hasStarted = course.progressPercent > 0;

            return (
              <div
                key={course.id}
                onClick={() => router.push(`/courses/${course.id}`)}
                className="bg-white rounded-[35px] p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-500 cursor-pointer group animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6 md:gap-4">
                  {/* Title & Subject */}
                  <div className="md:col-span-5 flex items-center gap-6">
                    <div className={`w-24 h-16 md:w-32 md:h-20 rounded-[20px] flex items-center justify-center transition-all duration-500 group-hover:scale-105 shrink-0 overflow-hidden border border-slate-100 ${
                      isFinished ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100' : 'bg-indigo-50 text-indigo-600 shadow-indigo-100'
                    } shadow-lg`}>
                      {course.coverImage ? (
                        <img src={course.coverImage} className="w-full h-full object-cover" alt={course.title} />
                      ) : (
                        <BookOpen className="w-8 h-8" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-black px-3 py-1 bg-slate-50 text-slate-400 rounded-lg border border-slate-100 uppercase tracking-widest mb-1.5 inline-block">
                        {course.subject}
                      </span>
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {course.title}
                      </h3>
                    </div>
                  </div>

                  {/* Progress Bar Column */}
                  <div className="md:col-span-3 flex flex-col gap-3 px-4">
                    <div className="flex justify-between items-center text-[10px] font-black">
                      <span className="text-slate-400 uppercase">معدل الإنجاز</span>
                      <span className={isFinished ? 'text-emerald-600' : 'text-indigo-600'}>
                        {course.progressPercent}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden shadow-inner p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                          isFinished ? 'bg-gradient-to-l from-emerald-400 to-emerald-600' : 'bg-gradient-to-l from-indigo-500 to-indigo-700'
                        }`}
                        style={{ width: `${course.progressPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Last Activity */}
                  <div className="md:col-span-2 text-center flex md:flex-col items-center justify-center gap-3 md:gap-1 border-t md:border-t-0 pt-4 md:pt-0 border-slate-50">
                    <Clock className="w-4 h-4 text-slate-300 md:mb-1" />
                    <div className="text-right md:text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">آخر مذاكرة</p>
                      <p className="text-xs font-black text-slate-800">
                        {course.lastAccessedAt ? new Date(course.lastAccessedAt).toLocaleDateString('ar-EG') : 'لم يبدأ'}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="md:col-span-2 flex justify-end">
                    <button className={`w-full md:w-auto px-8 py-4 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                      isFinished 
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' 
                        : 'bg-indigo-600 text-white hover:bg-slate-900 hover:shadow-indigo-200'
                    }`}>
                      {isFinished ? 'مراجعة الكورس' : hasStarted ? 'متابعة' : 'ابدأ الآن'}
                      <ChevronLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="py-32 text-center bg-white rounded-[50px] border-2 border-slate-100 border-dashed animate-in fade-in zoom-in duration-700">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Search className="w-10 h-10 text-slate-200" />
              </div>
              <p className="text-slate-900 text-2xl font-black mb-2">لم يتم العثور على نتائج</p>
              <p className="text-slate-400 font-bold">جرب البحث بكلمات أخرى أو تصفح الكورسات المتاحة</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
