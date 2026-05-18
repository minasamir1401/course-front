"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import SuperAdminSidebar from "./SuperAdminSidebar";
import Header from "./Header";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, ClipboardList, BookOpen, Settings, BarChart3, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [role, setRole] = useState("");
  const pathname = usePathname();
  const { t, language } = useLanguage();

  const NAV_LINKS = [
    { label: t('nav.home'), href: "/dashboard", icon: LayoutDashboard },
    { label: t('nav.exams'), href: "/exams", icon: ClipboardList },
    { label: t('nav.reports'), href: "/reports", icon: BarChart3 },
    { label: t('nav.courses'), href: "/courses", icon: BookOpen },
    { label: t('nav.settings'), href: "/settings", icon: Settings },
  ];

  const isSuperAdmin = pathname?.startsWith("/super-admin");
  const isSchoolAdmin = pathname?.startsWith("/school-admin");
  const isStudent = !isSuperAdmin && !isSchoolAdmin;
  const hasSidebar = !isStudent;

  useEffect(() => {
    setMounted(true);
    const onResize = () => setIsMobile(window.innerWidth < 1024);
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
    if (isSuperAdmin) return <SuperAdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />;
    if (isSchoolAdmin) return <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role={role} />;
    return null;
  };

  if (!mounted) return <div className="min-h-screen bg-slate-50" />;

  return (
    <div className="flex min-h-screen font-sans overflow-x-hidden bg-transparent relative" dir={language === 'ar' ? "rtl" : "ltr"}>
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

        {/* ── MODERN DOCKED MOBILE NAV (MD3 STYLE) ── */}
        {isStudent && isMobile && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-2xl border-t border-slate-100 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
            <nav className="flex items-center justify-around w-full h-[68px] px-1">
              {NAV_LINKS.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative flex flex-col items-center justify-center w-full h-full gap-1.5 group"
                  >
                    {/* Icon container with expanding pill background for active state */}
                    <div className={`relative flex items-center justify-center w-14 h-8 rounded-full transition-all duration-500 ease-out overflow-hidden ${isActive
                        ? "bg-indigo-100/80 text-indigo-600"
                        : "bg-transparent text-slate-400 group-hover:text-slate-600"
                      }`}>
                      {/* Active background glow effect */}
                      {isActive && (
                        <div className="absolute inset-0 bg-indigo-600/10 blur-md rounded-full" />
                      )}
                      <Icon
                        className={`relative z-10 w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110 stroke-[2.5px]" : "stroke-[2px] group-hover:scale-110 group-hover:stroke-[2.5px]"
                          }`}
                      />
                    </div>

                    {/* Text Label */}
                    <span className={`text-[10px] font-bold tracking-wide transition-all duration-300 ${isActive
                        ? "text-indigo-600"
                        : "text-slate-400"
                      }`}>
                      {item.label}
                    </span>
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
