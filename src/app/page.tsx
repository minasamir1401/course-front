"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, BarChart, Shield, Zap, Globe, ArrowLeft, Users, GraduationCap, Play, Menu, X } from "lucide-react";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  // useEffect(() => {
  //   const token = localStorage.getItem("lms_token");
  //   const user = JSON.parse(localStorage.getItem("lms_user") || "null");
  //   
  //   if (token && user) {
  //     if (user.role === "SUPER_ADMIN") router.push("/super-admin");
  //     else if (user.role === "SCHOOL_ADMIN") router.push("/school-admin");
  //     else if (user.role === "TEACHER") router.push("/teacher");
  //     else if (user.role === "STUDENT") router.push("/dashboard");
  //   }
  // }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 leading-tight">منصتي</h1>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
            <Link href="#features" className="hover:text-primary transition-colors">المميزات</Link>
            <Link href="#solutions" className="hover:text-primary transition-colors">الحلول المدرسية</Link>
            <Link href="#analytics" className="hover:text-primary transition-colors">التقارير والذكاء</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-slate-600 hover:text-primary font-bold text-sm hidden sm:block">
              تسجيل الدخول
            </Link>
            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden text-slate-600 hover:text-primary p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 absolute top-20 left-0 right-0 p-6 space-y-4 shadow-xl animate-in slide-in-from-top duration-300">
            <Link href="#features" onClick={() => setIsMenuOpen(false)} className="block text-slate-600 font-bold hover:text-primary">المميزات</Link>
            <Link href="#solutions" onClick={() => setIsMenuOpen(false)} className="block text-slate-600 font-bold hover:text-primary">الحلول المدرسية</Link>
            <Link href="#analytics" onClick={() => setIsMenuOpen(false)} className="block text-slate-600 font-bold hover:text-primary">التقارير والذكاء</Link>
            <hr className="border-slate-100" />
            <Link href="/login" className="block bg-primary text-white text-center py-3 rounded-xl font-bold">تسجيل الدخول</Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 relative overflow-hidden">
        {/* Abstract Backgrounds */}
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
          <div className="flex-1 text-center lg:text-right">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
              <Zap className="w-4 h-4 fill-current" />
              الجيل الجديد من التعليم الرقمي
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-tight mb-6">
              ارتقِ بمستوى <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                التعليم والتحليل
              </span>
            </h1>
            <p className="text-lg lg:text-xl text-slate-500 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              منصة متكاملة للمدارس والمعلمين والطلاب. توفر امتحانات ذكية، تتبع دقيق للأداء، وتقارير تفصيلية تساعد في بناء مستقبل تعليمي أفضل.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link href="/dashboard" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-blue-500/30 transition-all">
                استكشف المنصة
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all shadow-sm">
                <Play className="w-5 h-5" />
                شاهد العرض التوضيحي
              </button>
            </div>
            <div className="mt-10 flex items-center justify-center lg:justify-start gap-6 text-sm text-slate-500 font-medium">
              <div className="flex items-center gap-2"><CheckCircle /> لا تحتاج لبطاقة ائتمان</div>
              <div className="flex items-center gap-2"><CheckCircle /> إعداد في 5 دقائق</div>
            </div>
          </div>

          <div className="flex-1 w-full max-w-2xl">
            <div className="relative rounded-2xl bg-slate-900 shadow-2xl p-2 border border-slate-800">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-2xl"></div>
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop"
                alt="Dashboard Preview"
                className="rounded-xl w-full h-auto object-cover opacity-90"
              />
              {/* Floating Element 1 */}
              <div className="absolute -left-8 top-1/4 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <BarChart className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold">متوسط الأداء</p>
                  <p className="text-xl font-extrabold text-slate-800">85%</p>
                </div>
              </div>
              {/* Floating Element 2 */}
              <div className="absolute -right-8 bottom-1/4 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4 animate-bounce" style={{ animationDuration: '4s' }}>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold">الطلاب المسجلين</p>
                  <p className="text-xl font-extrabold text-slate-800">+10,000</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-4">لماذا تختار منصتي؟</h2>
            <p className="text-slate-500 text-lg">صُممت المنصة لتلبية احتياجات المدارس الحديثة عبر أدوات تدمج بين سهولة الاستخدام وقوة التحليل.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                <Globe className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">نظام متعدد المدارس</h3>
              <p className="text-slate-500 leading-relaxed">
                أدر عدة فروع أو مدارس من لوحة تحكم واحدة، مع عزل كامل للبيانات وتخصيص الصلاحيات لكل مستوى إداري.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                <BarChart className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">تحليلات متقدمة</h3>
              <p className="text-slate-500 leading-relaxed">
                رسوم بيانية وتقارير مفصلة لكل طالب ومعلم، تتبع التطور الزمني وتحديد نقاط الضعف بدقة من خلال محرك التقارير.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mb-6">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">محرك امتحانات ذكي</h3>
              <p className="text-slate-500 leading-relaxed">
                إنشاء وتصحيح آلي للامتحانات المركزية والمدرسية. النظام مبني ليدعم الذكاء الاصطناعي في تحديد مستوى الصعوبة مستقبلاً.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl lg:text-5xl font-extrabold mb-2">+100K</div>
              <div className="text-blue-200 font-medium">طالب مسجل</div>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-extrabold mb-2">+500</div>
              <div className="text-blue-200 font-medium">مدرسة شريكة</div>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-extrabold mb-2">+50K</div>
              <div className="text-blue-200 font-medium">امتحان مجرى</div>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-extrabold mb-2">99.9%</div>
              <div className="text-blue-200 font-medium">استقرار النظام</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-500" />
            <span className="text-xl font-bold text-white">منصتي</span>
          </div>
          <p className="text-sm">© 2026 جميع الحقوق محفوظة لمنصة التعليم الذكية.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-white transition-colors">سياسة الخصوصية</Link>
            <Link href="#" className="hover:text-white transition-colors">الشروط والأحكام</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

function CheckCircle() {
  return (
    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
