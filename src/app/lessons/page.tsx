"use client";

import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  PlaySquare, CheckCircle, Clock, Calendar, Lock, Play, FileText, 
  MessageSquare, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Maximize, Settings, Volume2, Info, MessageCircle, FileDown
} from "lucide-react";

export default function LessonPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        
        {/* Header Breadcrumb */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-sm font-medium flex items-center gap-2 text-slate-500">
            <span className="hover:text-primary cursor-pointer transition-colors">الكورسات</span> 
            <ChevronLeft className="w-4 h-4 text-slate-300" />
            <span className="hover:text-primary cursor-pointer transition-colors">الرياضيات المتقدمة</span>
            <ChevronLeft className="w-4 h-4 text-slate-300" />
            <span className="text-slate-800 font-bold">الدرس 5: المشتقات وتطبيقاتها</span>
          </div>
        </div>

        {/* 3-Column Layout */}
        <div className="flex flex-col xl:flex-row gap-6 items-start">
          
          {/* Column 1: Course Content & Resources (Right Side conceptually, first in DOM in RTL) */}
          <div className="w-full xl:w-72 space-y-6 shrink-0 order-2 xl:order-1">
            
            {/* Course Content Accordion */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">محتوى الكورس</h3>
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-primary">78% مكتمل</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: `78%` }}></div>
                </div>
              </div>
              
              <div className="space-y-3">
                {/* Chapter 1 */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <button className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>الفصل الأول: الأساسيات</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {/* Chapter 2 */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <button className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>الفصل الثاني: النهايات والاتصال</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {/* Chapter 3 (Active) */}
                <div className="border border-primary/20 rounded-xl overflow-hidden shadow-sm shadow-blue-100">
                  <button className="w-full flex items-center justify-between p-3 bg-blue-50 text-primary transition-colors text-sm font-bold">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                      <span>الفصل الثالث: التفاضل</span>
                    </div>
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <div className="bg-white p-2 space-y-1">
                    <div className="flex items-center justify-between p-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 cursor-pointer">
                      <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> الدرس 1: مفهوم المشتقة</div>
                      <span className="text-xs text-slate-400">30:45</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 cursor-pointer">
                      <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> الدرس 2: قواعد الاشتقاق</div>
                      <span className="text-xs text-slate-400">28:10</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 cursor-pointer">
                      <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> الدرس 3: مشتقة الدوال المركبة</div>
                      <span className="text-xs text-slate-400">26:30</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg text-sm text-primary bg-blue-50 font-bold cursor-pointer">
                      <div className="flex items-center gap-2"><PlaySquare className="w-4 h-4" /> الدرس 5: المشتقات وتطبيقاتها</div>
                      <span className="text-xs">34:20</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg text-sm text-slate-500 cursor-not-allowed">
                      <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-slate-300" /> الدرس 6: القيم القصوى</div>
                      <span className="text-xs text-slate-400">31:15</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg text-sm text-slate-500 cursor-not-allowed">
                      <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-slate-300" /> الدرس 7: مسائل تطبيقية شاملة</div>
                      <span className="text-xs text-slate-400">35:40</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attached Resources */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">الموارد المرفقة</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:border-red-200 bg-red-50/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                      <FileDown className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <h4 className="text-sm font-bold text-slate-700 group-hover:text-red-600 transition-colors">ملخص الدرس (PDF)</h4>
                      <p className="text-xs text-slate-500">1.2 MB</p>
                    </div>
                  </div>
                </button>
                <button className="w-full flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:border-red-200 bg-red-50/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                      <FileDown className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <h4 className="text-sm font-bold text-slate-700 group-hover:text-red-600 transition-colors">أمثلة محلولة (PDF)</h4>
                      <p className="text-xs text-slate-500">2.4 MB</p>
                    </div>
                  </div>
                </button>
                <button className="w-full flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:border-orange-200 bg-orange-50/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                      <FileDown className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <h4 className="text-sm font-bold text-slate-700 group-hover:text-orange-600 transition-colors">ملف الشرح (PPT)</h4>
                      <p className="text-xs text-slate-500">3.6 MB</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

          </div>

          {/* Column 2: Video Player & Main Content (Center) */}
          <div className="flex-1 space-y-6 order-1 xl:order-2">
            
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 mb-1">الدرس 5: المشتقات وتطبيقاتها</h1>
                <p className="text-sm text-slate-500">الفصل الثالث: التفاضل</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-primary rounded-xl flex items-center justify-center">
                <PlaySquare className="w-6 h-6" />
              </div>
            </div>

            {/* Video Player */}
            <div className="w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden relative shadow-lg group">
              {/* Fake Video Screen */}
              <div className="absolute inset-0 flex items-center justify-center font-mono text-xl md:text-3xl lg:text-4xl text-[#FDE047] p-8">
                <div>
                  <div className="text-center mb-8">المشتقات وتطبيقاتها</div>
                  <div className="text-white text-center">f'(x) = <span className="text-blue-400">lim</span> <sub className="text-sm">h→0</sub> <span className="border-b border-white pb-1">f(x+h) - f(x)</span><br/><span className="text-center block mt-2">h</span></div>
                </div>
              </div>
              
              {/* Video Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-full bg-white/20 h-1.5 rounded-full mb-4 cursor-pointer relative">
                  <div className="absolute top-0 left-0 h-full bg-primary rounded-full" style={{ width: '45%' }}></div>
                  <div className="absolute top-1/2 left-[45%] -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow"></div>
                </div>
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-4" dir="ltr">
                    <button className="hover:text-primary transition-colors"><Play className="w-5 h-5 fill-current" /></button>
                    <button className="hover:text-primary transition-colors"><Volume2 className="w-5 h-5" /></button>
                    <span className="text-sm font-mono">15:40 / 34:20</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button className="text-sm font-bold bg-white/20 px-2 py-0.5 rounded hover:bg-white/30 transition-colors">1x</button>
                    <button className="hover:text-primary transition-colors"><Settings className="w-5 h-5" /></button>
                    <button className="hover:text-primary transition-colors"><Maximize className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex border-b border-slate-100">
                <button className="flex-1 py-4 text-sm font-bold text-primary border-b-2 border-primary bg-blue-50/30">نظرة عامة</button>
                <button className="flex-1 py-4 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors">الملاحظات</button>
                <button className="flex-1 py-4 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors">الأسئلة (12)</button>
              </div>
              <div className="p-6 space-y-6">
                <p className="text-slate-600 leading-relaxed">
                  في هذا الدرس ستفهم المشتقة هندسياً ورياضياً وكيفية تطبيقها في إيجاد ميل المماس ومعدلات التغير والقيم القصوى للدوال. سنقوم بحل مجموعة من الأمثلة التطبيقية لفهم أعمق.
                </p>

                <div>
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">أهداف الدرس</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <p className="text-slate-700">أن يتعرف الطالب على مفهوم المشتقة هندسياً</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <p className="text-slate-700">أن يحسب مشتقة الدوال الأساسية وقواعد الاشتقاق</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <p className="text-slate-700">أن يطبق المشتقات في حل مسائل عملية</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm">
                <ChevronRight className="w-5 h-5" />
                الدرس السابق
              </button>
              <button className="flex items-center gap-2 bg-[#4F46E5] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#4338CA] transition-colors shadow-md shadow-indigo-200">
                الدرس التالي
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

          </div>

          {/* Column 3: Lesson Info (Left Side conceptually, last in DOM) */}
          <div className="w-full xl:w-72 space-y-6 shrink-0 order-3">
            
            {/* Info */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">معلومات الدرس</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock className="w-4 h-4" /> المدة
                  </div>
                  <span className="font-bold text-slate-800 text-left">20 دقيقة</span>
                </div>
                <div className="h-px bg-slate-100"></div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <PlaySquare className="w-4 h-4" /> نوع الدرس
                  </div>
                  <span className="font-bold text-slate-800 text-left">فيديو</span>
                </div>
                <div className="h-px bg-slate-100"></div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Info className="w-4 h-4" /> المستوى
                  </div>
                  <span className="font-bold text-slate-800 text-left">متقدم</span>
                </div>
                <div className="h-px bg-slate-100"></div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-4 h-4" /> تاريخ الإضافة
                  </div>
                  <span className="font-bold text-slate-800 text-left">10 أبريل 2026</span>
                </div>
                <div className="h-px bg-slate-100"></div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock className="w-4 h-4" /> آخر تحديث
                  </div>
                  <span className="font-bold text-slate-800 text-left">12 أبريل 2026</span>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-center">
              <h3 className="font-bold text-slate-800 mb-4 text-right">تقدمك في الكورس</h3>
              
              <div className="w-32 h-32 mx-auto relative mb-4">
                <svg viewBox="0 0 36 36" className="w-full h-full text-blue-100" strokeWidth="3" stroke="currentColor" fill="none">
                  <path strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <svg viewBox="0 0 36 36" className="w-full h-full text-primary absolute top-0 left-0" strokeWidth="3" stroke="currentColor" fill="none" strokeDasharray="78, 100" strokeLinecap="round">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-800">78%</span>
                  <span className="text-[10px] text-slate-500">مكتمل</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">إجمالي الدروس</span>
                  <span className="font-bold text-slate-800">28</span>
                </div>
                <div className="flex items-center justify-between text-sm text-green-600">
                  <span className="font-medium">الدروس المكتملة</span>
                  <span className="font-bold">22</span>
                </div>
                <div className="flex items-center justify-between text-sm text-primary">
                  <span className="font-medium">الوقت الإجمالي</span>
                  <span className="font-bold">0 س 25 د</span>
                </div>
              </div>
            </div>

            {/* Teacher */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-center">
              <h3 className="font-bold text-slate-800 mb-4 text-right">المعلم</h3>
              <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden mx-auto mb-3 border-2 border-white shadow-md">
                <img src="https://i.pravatar.cc/150?img=11" alt="Teacher" className="w-full h-full object-cover" />
              </div>
              <h4 className="font-bold text-slate-800">أ. محمد إبراهيم</h4>
              <p className="text-xs text-slate-500 mb-2">معلم رياضيات</p>
              <div className="flex justify-center items-center gap-1 mb-4">
                <span className="text-sm font-bold text-slate-700">4.9</span>
                <div className="flex text-yellow-400">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                </div>
              </div>
              <button className="w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
                <MessageCircle className="w-4 h-4" />
                تواصل مع المعلم
              </button>
            </div>

          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
