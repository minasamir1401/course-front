"use client";

import React, { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

function WavingHandIcon({ className = "w-6 h-6 inline-block shrink-0" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M19 3C20.5 4.5 21 6 21.5 7.5" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 6C25.5 7.5 26 9.2 26.5 11" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 5.5C15.8 7 16 8.5 16 10" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M10 13.5C10 12.67 10.67 12 11.5 12C12.33 12 13 12.67 13 13.5V18.5M13 12C13 11.17 13.67 10.5 14.5 10.5C15.33 10.5 16 11.17 16 12V18M16 12C16 11.17 16.67 10.5 17.5 10.5C18.33 10.5 19 11.17 19 12V18.5M19 13.5C19 12.67 19.67 12 20.5 12C21.33 12 22 12.67 22 13.5V21C22 24.87 18.87 28 15 28C11.69 28 9 25.31 9 22V16.5C9 15.67 9.67 15 10.5 15C11.33 15 12 15.67 12 16.5V17"
        stroke="#D97706"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 13.5C10 12.67 10.67 12 11.5 12C12.33 12 13 12.67 13 13.5V18.5M13 12C13 11.17 13.67 10.5 14.5 10.5C15.33 10.5 16 11.17 16 12V18M16 12C16 11.17 16.67 10.5 17.5 10.5C18.33 10.5 19 11.17 19 12V18.5M19 13.5C19 12.67 19.67 12 20.5 12C21.33 12 22 12.67 22 13.5V21C22 24.87 18.87 28 15 28C11.69 28 9 25.31 9 22V16.5C9 15.67 9.67 15 10.5 15C11.33 15 12 15.67 12 16.5V17"
        fill="#FBBF24"
      />
      <path d="M7.5 19.5C6.5 20.2 6.8 21.8 7.8 22.8L10 25" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function StudentLoginForm() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const schoolAdminToken = localStorage.getItem("school_admin_token");
    const schoolAdminUser = localStorage.getItem("school_admin_user");
    if (schoolAdminToken && schoolAdminUser) {
      try {
        const user = JSON.parse(schoolAdminUser);
        if (user && (user.role === "TEACHER" || user.role === "SCHOOL_ADMIN")) {
          router.replace("/school-admin");
          return;
        }
      } catch (e) {}
    }

    const token = localStorage.getItem("lms_token");
    const userString = localStorage.getItem("lms_user");
    if (token && userString) {
      try {
        const user = JSON.parse(userString);
        if (user && user.role === "STUDENT") {
          router.replace("/dashboard");
          return;
        }
      } catch (e) {
        localStorage.removeItem("lms_token");
        localStorage.removeItem("lms_user");
      }
    }
    setIsChecking(false);
  }, [router]);

  if (isChecking) {
    return (
      <main role="status" aria-label={language === "ar" ? "جارٍ التحقق من الحساب" : "Checking account"} className="min-h-screen bg-[#f8faff] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  const handleLogin = async (e: FormEvent) => {
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
      try {
        data = await res.json();
      } catch {
        // Non-JSON response
      }

      if (!res.ok) {
        if (res.status === 502 || res.status === 503 || res.status === 504) {
          setError(
            language === "ar"
              ? "خادم المنصة لا يستجيب حالياً. يرجى المحاولة لاحقاً."
              : "Server is currently unreachable. Please try again later."
          );
        } else {
          setError(
            language === "ar"
              ? "تعذر الدخول. تحقق من اسم المستخدم وكلمة المرور ثم أعد المحاولة."
              : "Could not sign in. Check your username and password and retry."
          );
        }
        return;
      }

      if (data.user.role === "SUPER_ADMIN" || data.user.role === "SCHOOL_ADMIN") {
        setError(t("login.roleErrorStudent"));
        return;
      }

      if (data.user.role === "TEACHER") {
        localStorage.setItem("school_admin_token", "cookie_auth");
        localStorage.setItem(
          "school_admin_token_expires_at",
          String(data.expiresAt || Date.now() + 8 * 60 * 60 * 1000)
        );
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
      } else {
        localStorage.setItem("lms_token", "cookie_auth");
        localStorage.setItem(
          "lms_token_expires_at",
          String(data.expiresAt || Date.now() + 8 * 60 * 60 * 1000)
        );
        localStorage.setItem(
          "lms_user",
          JSON.stringify({
            id: data.user.id,
            role: data.user.role,
            name: data.user.name,
            schoolId: data.user.schoolId,
            schoolName: data.user.schoolName,
            username: username,
          })
        );
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(t("login.connError"));
    } finally {
      setIsLoading(false);
    }
  };

  const ar = language === "ar";

  return (
    <div
      className="min-h-screen w-full relative overflow-x-hidden bg-cover bg-center bg-no-repeat flex flex-col justify-between"
      style={{ backgroundImage: "url('/images/login-bg.jpg')" }}
    >
      {/* Background Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-white/40 pointer-events-none -z-10" />

      {/* Top Header: EN on Left, Original Klevro Logo on Right */}
      <header className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 pt-6 sm:pt-8 flex items-center justify-between relative z-10" dir="ltr">
        {/* Language Switcher Pill (Left) */}
        <button
          type="button"
          onClick={() => setLanguage(ar ? "en" : "ar")}
          className="px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-slate-700 font-bold text-xs shadow-sm border border-slate-200/80 hover:bg-white hover:border-indigo-300 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          aria-label={ar ? "Switch to English" : "التبديل إلى العربية"}
        >
          {ar ? "EN" : "عربي"}
        </button>

        {/* Original Platform Logo (Unchanged) */}
        <Link href="/" className="flex items-center gap-2.5 font-black text-xl text-slate-900 hover:opacity-90 transition-opacity">
          <Image
            src="/logo.jpeg"
            alt="Klevro"
            width={40}
            height={40}
            priority
            className="rounded-xl shadow-sm object-cover"
          />
          <span className="tracking-tight text-slate-900 font-black">Klevro</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-8 sm:py-12 flex-1 flex items-center relative z-10">
        <div className="w-full grid lg:grid-cols-12 gap-8 lg:gap-14 items-center" dir="ltr">
          {/* Left Column: Educational Headline & 3D Illustration */}
          <div
            className="lg:col-span-6 flex flex-col justify-center items-start order-2 lg:order-1"
            dir={ar ? "rtl" : "ltr"}
          >
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-[#0f172a] leading-[1.25] tracking-tight">
              {ar ? (
                <>
                  منصتك التعليمية
                  <br />
                  في مكان واحد
                </>
              ) : (
                <>
                  Your Learning Platform
                  <br />
                  In One Place
                </>
              )}
            </h1>

            <p className="text-slate-500 text-sm sm:text-base font-medium mt-3.5 leading-relaxed max-w-md">
              {ar
                ? "ادخل بحساب المدرسة لمتابعة دروسك وواجباتك والاختبارات."
                : "Sign in with your school account to track your lessons, assignments, and exams."}
            </p>

            {/* Generated 3D Illustration (Full High Resolution, Transparent Alpha, No Crops) */}
            <div className="relative mt-4 sm:mt-6 w-full max-w-[440px] mx-auto lg:mx-0">
              <Image
                src="/images/edu-3d-clean.png"
                alt="3D Education Illustration"
                width={500}
                height={500}
                priority
                className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Right Column: Floating Login Card */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center relative order-1 lg:order-2">
            {/* The Login Card */}
            <div
              className="w-full max-w-[460px] bg-white/95 backdrop-blur-md rounded-[32px] p-7 sm:p-10 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.15)] border border-white/80 relative"
              dir={ar ? "rtl" : "ltr"}
            >
              {/* Card Header: Welcome back + waving hand */}
              <div className="text-right mb-7">
                <div className="flex items-center justify-start gap-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">
                    {ar ? "أهلاً بعودتك" : "Welcome Back"}
                  </h2>
                  <WavingHandIcon className="w-7 h-7 text-amber-500 shrink-0" />
                </div>
                <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed">
                  {ar
                    ? "ادخل بحساب المدرسة لمتابعة دروسك وواجباتك والاختبارات."
                    : "Sign in with your school account to track your lessons, assignments, and exams."}
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-5" aria-busy={isLoading}>
                {error && (
                  <div
                    id="login-error"
                    role="alert"
                    className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold flex items-start gap-2.5"
                  >
                    <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-500" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Username Field */}
                <div>
                  <label
                    htmlFor="student-username"
                    className="block text-right text-xs font-bold text-slate-700 mb-1.5"
                  >
                    {ar ? "اسم المستخدم" : "Username"}
                  </label>
                  <div
                    className="relative flex items-center bg-[#eff4fc] hover:bg-[#ebf1fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/25 focus-within:border-indigo-400 border border-slate-200/60 rounded-2xl h-[52px] px-3 transition-all"
                    dir="ltr"
                  >
                    {/* User Icon Badge on the left */}
                    <div className="w-9 h-9 rounded-xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center shrink-0">
                      <User size={18} />
                    </div>

                    <input
                      id="student-username"
                      type="text"
                      name="username"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      dir="ltr"
                      placeholder={ar ? "admin" : "Enter username"}
                      className="flex-1 bg-transparent border-none outline-none px-3 font-semibold text-slate-800 placeholder-slate-400 text-sm focus:ring-0"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="student-password"
                    className="block text-right text-xs font-bold text-slate-700 mb-1.5"
                  >
                    {ar ? "كلمة المرور" : "Password"}
                  </label>
                  <div
                    className="relative flex items-center bg-[#eff4fc] hover:bg-[#ebf1fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/25 focus-within:border-indigo-400 border border-slate-200/60 rounded-2xl h-[52px] px-3 transition-all"
                    dir="ltr"
                  >
                    {/* Lock Icon Badge on the left */}
                    <div className="w-9 h-9 rounded-xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center shrink-0">
                      <Lock size={18} />
                    </div>

                    <input
                      id="student-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      dir="ltr"
                      placeholder="•••••••••"
                      className="flex-1 bg-transparent border-none outline-none px-3 font-semibold text-slate-800 placeholder-slate-400 text-sm focus:ring-0 tracking-widest"
                    />

                    {/* Eye toggle on the right inside input */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 transition shrink-0 cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Show Password toggle action underneath */}
                  <div className="flex justify-start mt-2">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition cursor-pointer"
                    >
                      <span>
                        {showPassword
                          ? ar
                            ? "إخفاء كلمة المرور"
                            : "Hide password"
                          : ar
                          ? "إظهار كلمة المرور"
                          : "Show password"}
                      </span>
                      <Eye size={15} className="text-indigo-600" />
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[52px] rounded-2xl bg-gradient-to-r from-[#4f46e5] to-[#6366f1] text-white font-bold text-base flex items-center justify-center relative shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35 hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>{isLoading ? (ar ? "جارٍ تسجيل الدخول..." : "Signing in...") : ar ? "دخول" : "Sign in"}</span>
                  {!isLoading && (
                    <ArrowRight size={20} className="absolute right-5 text-white" />
                  )}
                </button>
              </form>
            </div>

            {/* Back to Home Link (Underneath Card) */}
            <div className="text-center mt-5">
              <Link
                href="/"
                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-4 transition"
              >
                {ar ? "العودة للرئيسية" : "Back to Home"}
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 relative z-10">
        © {new Date().getFullYear()} Klevro
      </footer>
    </div>
  );
}
