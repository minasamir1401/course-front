"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import SuperAdminSidebar from "./SuperAdminSidebar";
import Header from "./Header";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, BookOpen, BarChart3, Sparkles } from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";
import AdminErrorBridge from "@/components/AdminErrorBridge";
import { OfflineBanner } from "@/components/OfflineBanner";
import CompetitionShortcut from '@/components/competitions/CompetitionShortcut';
import Leaderboard from '@/components/competitions/Leaderboard';

export default function DashboardLayout({ children, hideSidebar, mainClassName = "" }: { children: React.ReactNode; hideSidebar?: boolean; mainClassName?: string }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
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
    { label: language === 'ar' ? 'الأنشطة التعليمية' : 'Activities', href: "/activities", icon: Sparkles },
  ];

  const isSuperAdmin = pathname?.startsWith("/super-admin");
  const isSchoolAdmin = pathname?.startsWith("/school-admin");
  const isStudent = !isSuperAdmin && !isSchoolAdmin;
  const hasSidebar = !isStudent;

  useEffect(() => {
    setMounted(true);
    const onResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
    };
    onResize();
    setIsSidebarOpen(hideSidebar ? false : window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);

    const pathKey = isSuperAdmin ? "super_admin_user" : isSchoolAdmin ? "school_admin_user" : "lms_user";
    const userStr = localStorage.getItem(pathKey) || localStorage.getItem("super_admin_user") || localStorage.getItem("school_admin_user") || localStorage.getItem("lms_user");
    if (userStr) {
      try { setRole(JSON.parse(userStr).role); } catch (_) { }
    }

    return () => window.removeEventListener("resize", onResize);
  }, [isSuperAdmin, isSchoolAdmin, hideSidebar]);

  const renderSidebar = () => {
    if (isSuperAdmin) return <SuperAdminSidebar isOpen={isSidebarOpen} onToggle={setIsSidebarOpen} onClose={() => setIsSidebarOpen(false)} />;
    if (isSchoolAdmin) return <Sidebar isOpen={isSidebarOpen} onToggle={setIsSidebarOpen} onClose={() => setIsSidebarOpen(false)} role={role} />;
    return null;
  };

  if (!mounted) return <div className="min-h-screen bg-slate-50" />;

  const isSidebarVisible = hasSidebar && !isFullscreen && (!hideSidebar || isSidebarOpen);

  return (
    <div className={`flex min-h-screen font-sans overflow-x-hidden bg-transparent relative ${isStudent ? 'student-workspace' : ''}`} dir={language === 'ar' ? "rtl" : "ltr"}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[200] focus:bg-white focus:p-4 focus:rounded-xl">{language === "ar" ? "انتقل إلى المحتوى" : "Skip to content"}</a>
      <AdminErrorBridge />
      <OfflineBanner language={language} />
      {/* Background Ornaments */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute inset-0 ${isStudent ? 'bg-gradient-to-br from-indigo-50/40 via-transparent to-blue-50/30' : 'bg-slate-50/60'}`} />
      </div>

      {isSidebarOpen && hasSidebar && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-slate-900/60 backdrop-blur-md transition-all duration-500"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {isSidebarVisible && renderSidebar()}

      <div className={`flex-1 min-w-0 w-full ${isSidebarVisible && isSidebarOpen && !isMobile ? (language === 'ar' ? 'lg:mr-72' : 'lg:ml-72') : ''} flex flex-col min-h-screen relative z-10 transition-all duration-300`}>
        <Header
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          isMobile={isMobile}
          isStudent={isStudent}
          pathname={pathname}
          navLinks={NAV_LINKS}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        />

        <main id="main-content" tabIndex={-1} className={`flex-1 p-1 sm:p-2 md:p-8 lg:p-10 transition-all duration-500 overflow-x-hidden ${isStudent && isMobile ? "pb-32" : "pb-10"} ${isFullscreen ? '!p-2 sm:!p-4' : ''} ${mainClassName}`}>
          {children}
          {isStudent && pathname === '/dashboard' && <Leaderboard/>}
          {isStudent && ['/dashboard', '/courses', '/exams', '/activities'].includes(pathname || '') && <CompetitionShortcut sourceKind={pathname === '/courses' ? 'COURSE' : pathname === '/exams' ? 'EXAM' : pathname === '/activities' ? 'ACTIVITY' : undefined}/>}
        </main>


      </div>
    </div>
  );
}
