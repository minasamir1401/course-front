"use client";
import { checkAuthSession, clearAllAuthData } from "@/lib/auth";

import { API_URL } from '@/lib/api';
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, BookOpen } from 'lucide-react';
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SchoolAdminLoginForm() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let active = true;
    void checkAuthSession().then(session => {
      if (!active) return;
      if (session.authenticated && session.user && (['SCHOOL_ADMIN', 'TEACHER', 'SUPER_ADMIN'].includes(session.user.role))) {
        const role = session.user.role;
        const prefix = role === 'SUPER_ADMIN' ? 'super_admin' : role === 'STUDENT' ? 'lms' : 'school_admin';
        localStorage.setItem(prefix + '_token', 'cookie_auth');
        localStorage.setItem(prefix + '_user', JSON.stringify(session.user));
        router.replace(role === 'SUPER_ADMIN' ? '/super-admin' : role === 'STUDENT' ? '/dashboard' : '/school-admin');
        return;
      }
      if (!session.authenticated && !session.unavailable) clearAllAuthData();
      setIsChecking(false);
    });
    return () => { active = false; };
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
        body: JSON.stringify({ username: username.trim(), password }),
      });

      let data: any = {};
      try { data = await res.json(); } catch {}

      if (!res.ok) {
        if (res.status === 502 || res.status === 503 || res.status === 504) {
          setError(language === 'ar' ? 'خادم المنصة لا يستجيب حالياً. يرجى المحاولة لاحقاً.' : 'Server is currently unreachable. Please try again later.');
        } else {
          setError(data.error || (language === 'ar' ? "اسم المستخدم أو كلمة المرور غير صحيحة." : "Incorrect username or password."));
        }
        return;
      }

      if (data.user.role !== "SCHOOL_ADMIN" && data.user.role !== "TEACHER") {
        setError(t('login.roleErrorSchool'));
        return;
      }

      localStorage.setItem("school_admin_token", "cookie_auth");
      localStorage.setItem("school_admin_token_expires_at", String(data.expiresAt || Date.now() + (8 * 60 * 60 * 1000)));
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
    <main
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      dir={language === 'ar' ? "rtl" : "ltr"}
      style={{
        background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #064e3b 100%)",
      }}
    >
      <button
        onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
        className="absolute top-6 right-6 z-50 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-xl backdrop-blur-md font-bold transition-all"
      >
        {language === 'ar' ? 'English' : 'العربية'}
      </button>

      <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, #10b981, transparent)" }} />
      <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-8 text-center border-b border-white/10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 bg-white shadow-lg overflow-hidden">
              <Image src="/klevro/brand/klevro-logo.jpg" alt="Klevro" width={80} height={80} priority className="object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{t('login.schoolAdminTitle')}</h1>
            <p className="text-emerald-200 text-sm">{t('login.schoolAdminSubtitle')}</p>
          </div>

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

        <div className="mt-6 text-center flex items-center justify-center gap-2 text-emerald-200 text-sm">
          <BookOpen className="w-4 h-4" />
          <span>{t('login.platform')}</span>
        </div>
      </div>
    </main>
  );
}
