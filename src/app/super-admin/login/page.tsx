"use client";

import { API_URL } from '@/lib/api';
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Shield, BookOpen } from "lucide-react";
import Link from "next/link";
import { clearAllAuthData } from '@/lib/auth';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("super_admin_token");
    const userString = localStorage.getItem("super_admin_user");
    
    if (token && userString) {
      try {
        const user = JSON.parse(userString);
        if (user && user.role === "SUPER_ADMIN") {
          router.replace("/super-admin");
          return;
        }
      } catch (e) {
        localStorage.removeItem("super_admin_token");
        localStorage.removeItem("super_admin_user");
      }
    }
    setIsChecking(false);
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
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
        setError(data.details || data.error || "اسم المستخدم أو كلمة المرور غير صحيحة.");
        return;
      }

      // Only allow SUPER_ADMIN
      if (data.user.role !== "SUPER_ADMIN") {
        setError("هذه الصفحة مخصصة للمدير العام فقط. يرجى استخدام الصفحة المناسبة لدورك.");
        return;
      }

      localStorage.setItem("super_admin_token", data.token);
      localStorage.setItem(
        "super_admin_user",
        JSON.stringify({
          id: data.user.id,
          role: data.user.role,
          name: data.user.name,
          schoolId: data.user.schoolId,
          schoolName: data.user.schoolName,
          username: username,
        })
      );

      router.push("/super-admin");
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
        background: "linear-gradient(135deg, #0d0d1a 0%, #1a0533 50%, #0d0d1a 100%)",
      }}
    >
      {/* Background blobs */}
      <div
        className="absolute top-[-80px] right-[-80px] w-[350px] h-[350px] rounded-full opacity-25"
        style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }}
      />
      <div
        className="absolute bottom-[-80px] left-[-80px] w-[350px] h-[350px] rounded-full opacity-25"
        style={{ background: "radial-gradient(circle, #db2777, transparent)" }}
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-md w-full relative z-10">
        {/* Card */}
        <div
          className="backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(139,92,246,0.3)",
          }}
        >
          {/* Header */}
          <div
            className="p-8 text-center"
            style={{
              background: "linear-gradient(135deg, rgba(109,40,217,0.4), rgba(168,85,247,0.2))",
              borderBottom: "1px solid rgba(139,92,246,0.3)",
            }}
          >
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
              style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)" }}
            >
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">بوابة المدير العام</h1>
            <p className="text-purple-300 text-sm">وصول مقيد — للمدير العام فقط</p>
          </div>

          {/* Warning badge */}
          <div className="mx-8 mt-6">
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold"
              style={{
                background: "rgba(139,92,246,0.1)",
                border: "1px solid rgba(139,92,246,0.3)",
                color: "#c4b5fd",
              }}
            >
              <Shield className="w-4 h-4 flex-shrink-0" />
              <span>هذه الصفحة مخصصة للمدير العام (Super Admin) فقط. أي محاولة دخول بصلاحيات مختلفة سيتم رفضها.</span>
            </div>
          </div>

          {/* Form */}
          <div className="p-8 pt-5">
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div
                  className="p-3 rounded-xl text-sm font-medium"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#fca5a5",
                  }}
                >
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">اسم المستخدم</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 rounded-xl outline-none transition-all text-white placeholder-slate-600"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(139,92,246,0.3)",
                    }}
                    placeholder="اسم المستخدم للمدير العام"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">كلمة المرور</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 rounded-xl outline-none transition-all text-white placeholder-slate-600"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(139,92,246,0.3)",
                    }}
                    placeholder="••••••••"
                    dir="ltr"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full text-white font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/50"
                style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)" }}
              >
                {isLoading ? "جاري التحقق..." : "دخول المدير العام"}
              </button>
            </form>

            {/* Navigation links */}
            <div className="mt-6 pt-5 text-center space-y-2" style={{ borderTop: "1px solid rgba(139,92,246,0.2)" }}>
              <p className="text-xs text-slate-600">روابط أخرى</p>
              <div className="flex justify-center gap-4 text-xs">
                <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                  دخول الطلاب
                </Link>
                <span className="text-slate-700">|</span>
                <Link href="/school-admin/login" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
                  دخول مدير المدرسة
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="mt-6 text-center flex items-center justify-center gap-2 text-slate-600 text-sm">
          <BookOpen className="w-4 h-4" />
          <span>منصتي للتعليم الذكي</span>
        </div>
      </div>
    </div>
  );
}
