"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  GraduationCap,
  ChevronLeft,
  Calendar,
  MessageSquare,
  Award
} from "lucide-react";

const NAV_ITEMS = [
  { label: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard },
  { label: "مقرراتي الدراسية", href: "/courses", icon: BookOpen },
  { label: "الامتحانات والتقييمات", href: "/exams", icon: ClipboardList },
  { label: "تقارير الأداء", href: "/reports", icon: BarChart3 },
  { label: "الجدول الزمني", href: "/calendar", icon: Calendar },
  { label: "الرسائل", href: "/messages", icon: MessageSquare },
  { label: "الإنجازات", href: "/activities", icon: Award },
  { label: "الإعدادات", href: "/settings", icon: Settings },
];

export default function StudentSidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <aside className="fixed right-0 top-0 h-screen w-64 bg-white border-l border-slate-100 z-50 hidden lg:flex flex-col shadow-2xl shadow-indigo-100/20" dir="rtl">
      {/* Brand Section */}
      <div className="p-8 border-b border-slate-50 flex items-center gap-3 group cursor-pointer">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center shadow-lg shadow-indigo-100 transition-transform group-hover:scale-110">
          <GraduationCap className="w-7 h-7 text-white" />
        </div>
        <div className="animate-in fade-in slide-in-from-right duration-500">
          <h1 className="text-xl font-black text-slate-900 italic tracking-tighter leading-none">LMS</h1>
          <span className="text-indigo-600 text-[10px] block font-black not-italic tracking-[2px] uppercase mt-1">Student Portal</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 mt-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between group p-3.5 rounded-2xl transition-all duration-300 ${isActive
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isActive ? "bg-white/20" : "bg-slate-50 group-hover:bg-white shadow-sm"
                  }`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-black tracking-tight">{item.label}</span>
              </div>
              {isActive && <ChevronLeft className="w-4 h-4 animate-in fade-in slide-in-from-right" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile / Logout */}
      <div className="p-4 border-t border-slate-50 space-y-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-black text-sm group"
        >
          <div className="w-10 h-10 rounded-xl bg-red-100/50 flex items-center justify-center group-hover:scale-110 transition-transform">
            <LogOut className="w-5 h-5" />
          </div>
          تسجيل الخروج
        </button>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </aside>
  );
}
