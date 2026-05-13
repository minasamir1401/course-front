"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, GraduationCap, Users, PanelsTopLeft,
  ClipboardList, BarChart2, LogOut, School, X, Menu
} from "lucide-react";

export default function SchoolAdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("school_admin_token");
    localStorage.removeItem("school_admin_user");
    router.push("/school-admin/login");
  };

  const isActive = (href: string) => {
    if (href === "/school-admin") return pathname === "/school-admin";
    return pathname.startsWith(href);
  };

  const navItems = [
    { href: "/school-admin", label: "لوحة التحكم", icon: LayoutDashboard },
    { href: "/school-admin/students", label: "قائمة الطلاب", icon: GraduationCap },
    { href: "/school-admin/teachers", label: "إدارة المدرسين", icon: Users },
    { href: "/school-admin/classes", label: "الفصول الدراسية", icon: PanelsTopLeft },
    { href: "/school-admin/exams", label: "الامتحانات", icon: ClipboardList },
    { href: "/school-admin/reports", label: "التقارير", icon: BarChart2 },
  ];

  // Get admin name from localStorage
  const [adminName, setAdminName] = React.useState("مدير المدرسة");
  React.useEffect(() => {
    const userStr = localStorage.getItem("school_admin_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.name) setAdminName(user.name);
      } catch {}
    }
  }, []);

  const initial = adminName.charAt(0) || "A";

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-[60] bg-indigo-600 text-white p-3 rounded-2xl shadow-xl"
      >
        {isOpen ? <X /> : <Menu />}
      </button>

      <aside
        className={`fixed top-0 right-0 h-full w-64 bg-white border-l border-slate-100 z-50 transition-all duration-300 ease-in-out lg:translate-x-0 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo Section */}
          <div className="flex items-center gap-3 px-2 py-4 mb-8 border-b border-slate-50">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
              <School className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">مدرستي</h1>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1 block">SCHOOL ADMIN</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden mr-auto text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group ${
                    active
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-sm ${active ? "font-black" : "font-bold"}`}>{label}</span>
                  {active && (
                    <div className="mr-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer Section */}
          <div className="mt-auto pt-6 border-t border-slate-50">
            {/* Admin info */}
            <div className="px-4 py-4 mb-4 bg-slate-50 rounded-[24px] border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xs font-black text-indigo-600 border border-slate-100 shadow-sm">
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-900 truncate leading-none mb-1">{adminName}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-[10px] text-emerald-600 font-bold">متصل الآن</p>
                </div>
              </div>
            </div>

            {/* Logout */}
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

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
        />
      )}
    </>
  );
}
