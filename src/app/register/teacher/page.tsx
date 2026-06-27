"use client";

import { API_URL } from '@/lib/api';
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, BookOpen, GraduationCap, School, Phone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TeacherRegisterPage() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [schools, setSchools] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    schoolId: "",
    grade: "",
    specialization: "",
    phone: ""
  });

  const GRADES = [
    "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي",
    "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
    "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
  ];

  useEffect(() => {
    // Fetch schools list for dropdown
    const fetchSchools = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/schools`);
        if (res.ok) {
          const data = await res.json();
          setSchools(data);
        }
      } catch (err) {
        console.error("Error fetching schools list:", err);
      }
    };
    fetchSchools();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (!formData.schoolId) {
      setError(language === 'ar' ? "يرجى اختيار المدرسة التابع لها." : "Please select your school.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          role: "TEACHER"
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || (language === 'ar' ? "فشل إنشاء الحساب، يرجى المحاولة مرة أخرى." : "Registration failed, please try again."));
        return;
      }

      setSuccess(language === 'ar' ? "تم تسجيل حسابك كمعلم بنجاح! جاري تحويلك لصفحة تسجيل الدخول..." : "Teacher registered successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/school-admin/login");
      }, 2500);

    } catch (err) {
      setError(language === 'ar' ? "خطأ في الاتصال بالخادم." : "Connection error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-y-auto"
      dir={language === 'ar' ? "rtl" : "ltr"}
      style={{
        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
      }}
    >
      {/* Language Switch */}
      <button
        onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
        className="absolute top-6 right-6 z-50 bg-slate-200/80 hover:bg-slate-300/80 border border-slate-300 text-slate-800 px-4 py-2 rounded-xl backdrop-blur-md font-bold transition-all"
      >
        {language === 'ar' ? 'English' : 'العربية'}
      </button>

      {/* Decorative premium color blobs */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full opacity-30 pointer-events-none" style={{ background: "radial-gradient(circle, #bfdbfe, transparent)" }} />
      <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full opacity-30 pointer-events-none" style={{ background: "radial-gradient(circle, #dbeafe, transparent)" }} />

      <div className="max-w-xl w-full relative z-10 my-8">
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-[35px] overflow-hidden shadow-2xl p-8 sm:p-10">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-blue-100 shadow-md">
              <GraduationCap className="w-9 h-9 text-blue-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2">
              {language === 'ar' ? "تسجيل معلم جديد" : "Register as Teacher"}
            </h1>
            <p className="text-slate-500 font-bold text-sm">
              {language === 'ar' ? "أنشئ حسابك التعليمي للبدء في إدارة فصولك ومناهجك" : "Create your teaching account to start managing classes and courses"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-2xl text-sm font-bold text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 p-4 rounded-2xl text-sm font-bold text-center">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase">
                  {language === 'ar' ? "الاسم الكامل" : "Full Name"}
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none`}>
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text" required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 ${language === 'ar' ? 'pl-4 pr-11' : 'pr-4 pl-11'} outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 font-bold text-sm`}
                    placeholder={language === 'ar' ? "مثال: أ. محمد أحمد" : "e.g. Mr. John Doe"}
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase">
                  {language === 'ar' ? "اسم المستخدم" : "Username"}
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none`}>
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text" required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={`w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 ${language === 'ar' ? 'pl-4 pr-11' : 'pr-4 pl-11'} outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 font-bold text-sm`}
                    placeholder="username"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase">
                  {language === 'ar' ? "كلمة المرور" : "Password"}
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none`}>
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password" required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 ${language === 'ar' ? 'pl-4 pr-11' : 'pr-4 pl-11'} outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 font-bold text-sm`}
                    placeholder="••••••••"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase">
                  {language === 'ar' ? "رقم الهاتف (اختياري)" : "Phone (Optional)"}
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none`}>
                    <Phone className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 ${language === 'ar' ? 'pl-4 pr-11' : 'pr-4 pl-11'} outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 font-bold text-sm`}
                    placeholder="010XXXXXXXX"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* School Select */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-500 uppercase">
                {language === 'ar' ? "المدرسة" : "School"}
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none`}>
                  <School className="h-4 w-4 text-slate-400" />
                </div>
                <select
                  required
                  value={formData.schoolId}
                  onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                  className={`w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 ${language === 'ar' ? 'pl-4 pr-11' : 'pr-4 pl-11'} outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 font-bold text-sm appearance-none`}
                >
                  <option value="">{language === 'ar' ? "اختر المدرسة..." : "Select your school..."}</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Specialization / Subject */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase">
                  {language === 'ar' ? "المادة / التخصص" : "Subject / Specialization"}
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none`}>
                    <BookOpen className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text" required
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className={`w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 ${language === 'ar' ? 'pl-4 pr-11' : 'pr-4 pl-11'} outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 font-bold text-sm`}
                    placeholder={language === 'ar' ? "مثال: الرياضيات" : "e.g. Mathematics"}
                  />
                </div>
              </div>

              {/* Grade */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase">
                  {language === 'ar' ? "الصف الدراسي" : "Grade"}
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none`}>
                    <GraduationCap className="h-4 w-4 text-slate-400" />
                  </div>
                  <select
                    required
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className={`w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 ${language === 'ar' ? 'pl-4 pr-11' : 'pr-4 pl-11'} outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 font-bold text-sm appearance-none`}
                  >
                    <option value="">{language === 'ar' ? "اختر الصف..." : "Select grade..."}</option>
                    {GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Premium register button: blue background with black text */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-black font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-base cursor-pointer mt-6"
            >
              {isLoading 
                ? (language === 'ar' ? "جاري تسجيل الحساب..." : "Registering...") 
                : (language === 'ar' ? "تسجيل الحساب" : "Create Account")}
            </button>

            {/* Back to login */}
            <div className="text-center mt-6">
              <span className="text-slate-400 text-xs font-bold">
                {language === 'ar' ? "لديك حساب بالفعل؟ " : "Already have an account? "}
              </span>
              <button
                type="button"
                onClick={() => router.push("/school-admin/login")}
                className="text-blue-600 hover:text-blue-700 font-black text-xs transition-colors"
              >
                {language === 'ar' ? "تسجيل الدخول من هنا" : "Log in here"}
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}
