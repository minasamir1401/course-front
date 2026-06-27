"use client";

import { API_URL } from '@/lib/api';
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Building2, BookOpen } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SchoolAdminLoginPage() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("school_admin_token");
    const userString = localStorage.getItem("school_admin_user");
    
    if (token && userString) {
      try {
        const user = JSON.parse(userString);
        if (user && user.role === "SCHOOL_ADMIN") {
          router.replace("/school-admin");
          return;
        }
      } catch (e) {
        localStorage.removeItem("school_admin_token");
        localStorage.removeItem("school_admin_user");
      }
    }
    setIsChecking(false);
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#064e3b] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(API_URL + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || (language === 'ar' ? "اسم المستخدم أو كلمة المرور غير صحيحة." : "Incorrect username or password."));
        return;
      }

      // Only allow SCHOOL_ADMIN or TEACHER
      if (data.user.role !== "SCHOOL_ADMIN" && data.user.role !== "TEACHER") {
        setError(t('login.roleErrorSchool'));
        return;
      }

      localStorage.setItem("school_admin_token", data.token);
      localStorage.setItem(
        "school_admin_user",
        JSON.stringify({
          id: data.user.id,
          role: data.user.role,
          name: data.user.name,
          schoolId: data.user.schoolId,
          schoolName: data.user.schoolName,
          username: username,
        })
      );

      router.push("/school-admin");
    } catch {
      setError(t('login.connError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      dir={language === 'ar' ? "rtl" : "ltr"}
      style={{
        background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #064e3b 100%)",
      }}
    >
      {/* Language Switch */}
      <button
        onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
        className="absolute top-6 right-6 z-50 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-xl backdrop-blur-md font-bold transition-all"
      >
        {language === 'ar' ? 'English' : 'العربية'}
      </button>

      {/* Background blobs */}
      <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, #10b981, transparent)" }} />
      <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />

      <div className="max-w-md w-full relative z-10">
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-8 text-center border-b border-white/10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{t('login.schoolAdminTitle')}</h1>
            <p className="text-emerald-200 text-sm">{t('login.schoolAdminSubtitle')}</p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="bg-red-500/20 text-red-100 p-3 rounded-xl text-sm font-medium border border-red-500/30">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-emerald-100 mb-2">{t('login.username')}</label>
                <div className="relative">
                  <div className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                    <User className="h-5 w-5 text-emerald-300" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full ${language === 'ar' ? 'pl-4 pr-10' : 'pr-4 pl-10'} py-3 bg-white/10 border border-white/20 rounded-xl outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all text-white placeholder-emerald-800`}
                    placeholder={t('login.usernameSchoolPlaceholder')}
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-emerald-100 mb-2">{t('login.password')}</label>
                <div className="relative">
                  <div className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                    <Lock className="h-5 w-5 text-emerald-300" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full ${language === 'ar' ? 'pl-4 pr-10' : 'pr-4 pl-10'} py-3 bg-white/10 border border-white/20 rounded-xl outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all text-white placeholder-emerald-800`}
                    placeholder="••••••••"
                    dir="ltr"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading ? t('login.loadingBtnVerify') : t('login.loginBtnSchool')}
              </button>
            </form>

            <div className="mt-6 pt-4 text-center border-t border-white/10">
               <Link href="/login" className="text-emerald-300 hover:text-white transition-colors text-xs font-medium">
                {t('login.studentLoginLink')}
              </Link>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="mt-6 text-center flex items-center justify-center gap-2 text-emerald-200 text-sm">
          <BookOpen className="w-4 h-4" />
          <span>{t('login.platform')}</span>
        </div>
      </div>
    </div>
  );
}
