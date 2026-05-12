"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, GraduationCap,
  Settings, LogOut, Menu, X, ClipboardList,
  BookOpen, BarChart2, Activity, School, Layout
} from "lucide-react";
import { logout } from "@/lib/auth";

export default function Sidebar({ isOpen, onClose, role }: { isOpen?: boolean; onClose?: () => void; role?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => { setMounted(true); }, []);

  const handleLogout = () => logout(router, pathname);

  const schoolAdminItems = [
    { label: "لوحة التحكم", icon: LayoutDashboard, href: "/school-admin", color: "indigo" },
    { label: "قائمة الطلاب", icon: GraduationCap, href: "/school-admin/students", color: "indigo" },
    { label: "إدارة المدرسين", icon: Users, href: "/school-admin/teachers", color: "indigo" },
    { label: "الفصول الدراسية", icon: Layout, href: "/school-admin/classes", color: "indigo" },
    { label: "الامتحانات", icon: ClipboardList, href: "/school-admin/exams", color: "indigo" },
    { label: "التقارير", icon: BarChart2, href: "/school-admin/reports", color: "indigo" },
  ];

  const studentItems = [
    { label: "الرئيسية", icon: LayoutDashboard, href: "/dashboard", color: "indigo" },
    { label: "امتحاناتي", icon: ClipboardList, href: "/exams", color: "indigo" },
    { label: "نتائجي", icon: BarChart2, href: "/reports", color: "indigo" },
    { label: "الكورسات", icon: BookOpen, href: "/courses", color: "indigo" },
    { label: "الإعدادات", icon: Settings, href: "/settings", color: "indigo" },
  ];

  const menuItems = role === "STUDENT" ? studentItems : schoolAdminItems;

  const isActive = (href: string) => {
    if (!mounted) return false;
    if (pathname === href) return true;
    if (href === "/dashboard" || href === "/school-admin") return false;
    return pathname.startsWith(href);
  };

  return (
    <>
      <aside
        className={`fixed top-0 right-0 h-full w-64 bg-white border-l border-slate-100 z-50 transition-all duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo Section */}
          <div className="flex items-center gap-3 px-2 py-4 mb-8 border-b border-slate-50">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
              <School className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">مدرستي</h1>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1 block">
                {role === "STUDENT" ? "بوابة الطالب" : "إدارة المدرسة"}
              </span>
            </div>
            <button onClick={onClose} className="lg:hidden mr-auto text-slate-400 hover:text-slate-600"><X /></button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
            {menuItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group ${
                    active 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                  }`}>
                    <item.icon className="w-4.5 h-4.5" />
                  </div>
                  <span className={`text-sm ${active ? 'font-black' : 'font-bold'}`}>{item.label}</span>
                  {active && (
                    <div className="mr-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer Section */}
          <div className="mt-auto pt-6 border-t border-slate-50">
            <div className="px-4 py-4 mb-4 bg-slate-50 rounded-[24px] border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xs font-black text-indigo-600 border border-slate-100 shadow-sm">
                {role === "STUDENT" ? "S" : "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-900 truncate leading-none mb-1">
                  {role === "STUDENT" ? "طالب نشط" : "مدير النظام"}
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-[10px] text-emerald-600 font-bold">متصل الآن</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="text-sm font-black">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
