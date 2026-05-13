"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import SuperAdminSidebar from "./SuperAdminSidebar";
import Header from "./Header";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, ClipboardList, BookOpen, Settings, BarChart3, Sparkles } from "lucide-react";

const NAV_LINKS = [
  { label: "الرئيسية", href: "/dashboard", icon: LayoutDashboard },
  { label: "امتحاناتي", href: "/exams", icon: ClipboardList },
  { label: "نتائجي", href: "/reports", icon: BarChart3 },
  { label: "الكورسات", href: "/courses", icon: BookOpen },
  { label: "الإعدادات", href: "/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [role, setRole] = useState("");
  const pathname = usePathname();

  const isSuperAdmin = pathname?.startsWith("/super-admin");
  const isSchoolAdmin = pathname?.startsWith("/school-admin");
  const isStudent = !isSuperAdmin && !isSchoolAdmin;
  const hasSidebar = !isStudent;

  useEffect(() => {
    setMounted(true);
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);

    const pathKey = isSuperAdmin ? "super_admin_user" : isSchoolAdmin ? "school_admin_user" : "lms_user";
    const userStr = localStorage.getItem(pathKey) || localStorage.getItem("super_admin_user") || localStorage.getItem("school_admin_user") || localStorage.getItem("lms_user");
    if (userStr) {
      try { setRole(JSON.parse(userStr).role); } catch (_) { }
    }

    return () => window.removeEventListener("resize", onResize);
  }, [isSuperAdmin, isSchoolAdmin]);

  const renderSidebar = () => {
    if (isSuperAdmin) return <SuperAdminSidebar />;
    if (isSchoolAdmin) return <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role={role} />;
    return null;
  };

  if (!mounted) return <div className="min-h-screen bg-slate-50" />;

  return (
    <div className="flex min-h-screen font-sans overflow-hidden bg-transparent relative" dir="rtl">
      {/* Background Ornaments */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/40 blur-[120px] rounded-full animate-pulse" />
         <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-blue-100/30 blur-[100px] rounded-full" />
      </div>

      {isSidebarOpen && hasSidebar && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-slate-900/60 backdrop-blur-md transition-all duration-500"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {renderSidebar()}

      <div className={`flex-1 ${hasSidebar ? "lg:mr-72" : ""} flex flex-col min-h-screen relative z-10`}>
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          isMobile={isMobile}
          isStudent={isStudent}
          pathname={pathname}
          navLinks={NAV_LINKS}
        />

        <main className={`flex-1 p-2 sm:p-4 md:p-8 lg:p-10 transition-all duration-500 ${isStudent && isMobile ? "pb-32" : "pb-10"}`}>
          {children}
        </main>

        {/* ── PREMIUM MOBILE NAV ── */}
        {isStudent && isMobile && (
          <div className="fixed bottom-8 left-4 right-4 z-50 flex justify-center">
            <nav className="flex items-center justify-center gap-1.5 glass p-2 rounded-[32px] border-white/40 shadow-[0_25px_60px_-15px_rgba(79,70,229,0.3)] max-w-[440px] w-full mx-auto">
              {NAV_LINKS.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex flex-col items-center justify-center gap-1.5 py-1.5 transition-all duration-500 grow group ${isActive ? "text-indigo-600" : "text-slate-400"}`}
                  >
                    <div className={`p-3 rounded-2xl transition-all duration-500 transform ${
                      isActive 
                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200 -translate-y-1 scale-110" 
                      : "bg-transparent hover:bg-indigo-50/50 hover:text-indigo-600"
                    }`}>
                      <item.icon className="w-5 h-5" />
                    </div>

                    <span className={`text-[9px] font-black transition-all duration-500 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 h-0 overflow-hidden"}`}>
                      {item.label}
                    </span>

                    {isActive && (
                       <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full animate-bounce" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}

