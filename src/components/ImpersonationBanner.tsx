"use client";

import React, { useEffect, useState } from 'react';
import { LogOut, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { stopImpersonation } from '@/lib/auth';

export default function ImpersonationBanner() {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [userName, setUserName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkStatus = () => {
      const impersonating = localStorage.getItem("is_impersonating") === "true";
      setIsImpersonating(impersonating);
      
      if (impersonating) {
        // Find which user we are currently logged in as
        const lmsUser = localStorage.getItem("lms_user");
        const schoolAdminUser = localStorage.getItem("school_admin_user");
        const user = lmsUser ? JSON.parse(lmsUser) : (schoolAdminUser ? JSON.parse(schoolAdminUser) : null);
        if (user) setUserName(user.name);
      }
    };

    checkStatus();
    // Listen for storage changes in same tab
    window.addEventListener('storage', checkStatus);
    return () => window.removeEventListener('storage', checkStatus);
  }, []);

  const handleSwitchBack = () => {
    stopImpersonation();
  };

  if (!isImpersonating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-2 flex items-center justify-between shadow-2xl border-b border-white/20 animate-in slide-in-from-top duration-500" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center animate-pulse">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
          <span className="font-bold text-sm md:text-base">أنت الآن تتصفح كـ: {userName}</span>
          <span className="hidden md:inline-block text-xs bg-black/20 px-2 py-0.5 rounded-full border border-white/10 text-white/90">
            وضع محاكاة الصلاحيات (Impersonation Mode)
          </span>
        </div>
      </div>
      <button
        onClick={handleSwitchBack}
        className="flex items-center gap-2 bg-white text-amber-700 px-4 py-1.5 rounded-xl text-sm font-black hover:bg-slate-100 transition-all shadow-lg active:scale-95"
      >
        <LogOut className="w-4 h-4 rotate-180" />
        العودة لحساب الأدمن
      </button>
    </div>
  );
}
