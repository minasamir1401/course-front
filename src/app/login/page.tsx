"use client";

import { API_URL } from '@/lib/api';
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, BookOpen, GraduationCap } from "lucide-react";
import Link from "next/link";
import { clearAllAuthData } from '@/lib/auth';

export default function StudentLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("lms_token");
    const userString = localStorage.getItem("lms_user");
    
    if (token && userString) {
      try {
        const user = JSON.parse(userString);
        if (user) {
          if (user.role === "TEACHER") {
            router.replace("/teacher");
            return;
          } else if (user.role === "STUDENT") {
            router.replace("/dashboard");
            return;
          }
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
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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
        setError(data.error || "اسم المستخدم أو كلمة المرور غير صحيحة.");
        return;
      }

      // Block admin roles from using this login page
      if (data.user.role === "SUPER_ADMIN" || data.user.role === "SCHOOL_ADMIN") {
        setError("هذه الصفحة مخصصة للطلاب والمعلمين فقط. يرجى استخدام صفحة دخول الإدارة.");
        return;
      }

      localStorage.setItem("lms_token", data.token);
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

      if (data.user.role === "TEACHER") {
        router.push("/dashboard"); // Temporarily redirect to dashboard as /teacher does not exist yet
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(`خطأ في الاتصال: ${err.message || "لا يمكن الوصول للسيرفر"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      dir="rtl"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
      }}
    >
      {/* Background blobs */}
      <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />
      <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />

      <div className="max-w-md w-full relative z-10">
        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-8 text-center border-b border-white/10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">بوابة الطلاب والمعلمين</h1>
            <p className="text-blue-300 text-sm">سجّل دخولك للوصول إلى دروسك وامتحاناتك</p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 text-red-300 p-3 rounded-xl text-sm font-medium border border-red-500/20">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-blue-200 mb-2">اسم المستخدم</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all text-white placeholder-slate-500"
                    placeholder="أدخل اسم المستخدم"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-blue-200 mb-2">كلمة المرور</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all text-white placeholder-slate-500"
                    placeholder="••••••••"
                    dir="ltr"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full text-white font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}
              >
                {isLoading ? "جاري الدخول..." : "دخول"}
              </button>
            </form>
          </div>
        </div>

        {/* Branding */}
        <div className="mt-6 text-center flex items-center justify-center gap-2 text-slate-500 text-sm">
          <BookOpen className="w-4 h-4" />
          <span>منصتي للتعليم الذكي</span>
        </div>
      </div>
    </div>
  );
}
