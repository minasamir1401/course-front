"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import SuperAdminSidebar from "./SuperAdminSidebar";
import StudentSidebar from "./StudentSidebar";
import Header from "./Header";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, ClipboardList, BookOpen, Settings, BarChart3 } from "lucide-react";

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
  const hasSidebar = true; // All roles now have a unified sidebar

  useEffect(() => {
    setMounted(true);
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);

    const pathKey = isSuperAdmin ? "super_admin_user" : isSchoolAdmin ? "school_admin_user" : "lms_user";
    const userStr = localStorage.getItem(pathKey) || localStorage.getItem("super_admin_user") || localStorage.getItem("school_admin_user") || localStorage.getItem("lms_user");
    if (userStr) {
      try { setRole(JSON.parse(userStr).role); } catch (_) {}
    }

    return () => window.removeEventListener("resize", onResize);
  }, [isSuperAdmin, isSchoolAdmin]);

  const renderSidebar = () => {
    if (isSuperAdmin) return <SuperAdminSidebar />;
    if (isSchoolAdmin) return <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} role={role} />;
    if (isStudent) return <StudentSidebar />;
    return null;
  };

  if (!mounted) return <div className="min-h-screen bg-slate-50" />;

  return (
    <div className="flex min-h-screen font-sans" dir="rtl" style={{ background: "var(--page-bg, #f8fafc)" }}>
      {isSidebarOpen && hasSidebar && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {renderSidebar()}

      <div className={`flex-1 ${hasSidebar ? "lg:mr-64" : ""} flex flex-col min-h-screen overflow-hidden`}>
        <Header
          onMenuClick={() => setIsSidebarOpen(true)}
          isMobile={isMobile}
          isStudent={isStudent}
          pathname={pathname}
          navLinks={NAV_LINKS}
        />

        <main className={`flex-1 p-3 sm:p-5 md:p-6 overflow-x-hidden ${isStudent && isMobile ? "pb-28" : "pb-6"}`}>
          {children}
        </main>

        {/* MODERN FLOATING MOBILE NAV - Stable Structure to prevent insertBefore errors */}
        {isStudent && isMobile && (
          <div className="fixed bottom-6 left-4 right-4 z-50 flex justify-center">
            <nav className="flex items-center justify-center gap-1 bg-white/95 backdrop-blur-xl p-2 rounded-[32px] border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] max-w-[480px] w-full mx-auto">
              {NAV_LINKS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex flex-col items-center justify-center gap-1 py-1 transition-all duration-300 grow ${
                      isActive ? "text-indigo-600" : "text-slate-400"
                    }`}
                  >
                    <div className={`p-2 rounded-2xl transition-all duration-300 ${
                      isActive ? "bg-indigo-600 text-white shadow-lg" : "bg-transparent"
                    }`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    
                    <span className={`text-[10px] font-black transition-all duration-300 ${
                      isActive ? "opacity-100 scale-100 h-auto" : "opacity-0 scale-90 h-0 overflow-hidden"
                    }`}>
                      {item.label}
                    </span>

                    {/* Using visibility instead of conditional rendering for stability */}
                    <div className={`w-1 h-1 bg-indigo-600 rounded-full mt-0.5 transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-0"}`} />
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
