"use client";

import React, { useState, useEffect } from "react";
import {
  Search, Bell, Menu, ChevronDown, LogOut, Settings,
  User, ArrowLeftCircle, Sparkles,
  Globe, Zap
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logout, stopImpersonation } from "@/lib/auth";
import { LucideIcon } from "lucide-react";

interface NavLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface HeaderProps {
  onMenuClick?: () => void;
  isMobile?: boolean;
  isStudent?: boolean;
  pathname?: string | null;
  navLinks?: NavLink[];
}

export default function Header({
  onMenuClick,
  isMobile = false,
  isStudent = false,
  pathname = "",
  navLinks = [],
}: HeaderProps) {
  const router = useRouter();
  const [userName, setUserName] = useState("المستخدم");
  const [userRoleName, setUserRoleName] = useState("");
  const [userInitials, setUserInitials] = useState("م");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsImpersonating(localStorage.getItem("is_impersonating") === "true");

    const pathKey = pathname?.startsWith("/super-admin")
      ? "super_admin_user"
      : pathname?.startsWith("/school-admin")
      ? "school_admin_user"
      : "lms_user";

    const userData =
      localStorage.getItem(pathKey) ||
      localStorage.getItem("super_admin_user") ||
      localStorage.getItem("school_admin_user") ||
      localStorage.getItem("lms_user");

    if (userData) {
      try {
        const user = JSON.parse(userData);
        const name = user.name || user.username || "المستخدم";
        setUserName(name);
        setUserInitials(name.charAt(0));
        const roles: Record<string, string> = {
          SUPER_ADMIN: "مدير النظام",
          SCHOOL_ADMIN: "مدير مدرسة",
          TEACHER: "معلم",
          STUDENT: "طالب",
        };
        setUserRoleName(roles[user.role] || "مستخدم");
      } catch (_) {}
    }
  }, [pathname]);

  const handleLogout = () => logout(router, pathname ?? undefined);

  return (
    <header
      className={`sticky top-0 z-40 flex items-center justify-between px-3 md:px-8 transition-all duration-500 ${
        scrolled ? "h-20 glass shadow-lg shadow-indigo-500/5 mt-2 mx-2 md:mx-4 rounded-[32px] border-white/40" : "h-24 bg-transparent"
      }`}
    >
      {/* ── RIGHT SIDE: Navigation & Logo ── */}
      <div className="flex items-center gap-3 md:gap-8 flex-1 min-w-0">
        
        {/* Brand / Title Section */}
        <div className="flex items-center gap-4">
           {!isStudent && (
              <button
                onClick={onMenuClick}
                className="lg:hidden p-3 rounded-2xl bg-white/50 hover:bg-white text-slate-600 transition-all border border-slate-200/40"
              >
                <Menu className="w-5 h-5" />
              </button>
           )}
           <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-200 flex items-center justify-center transform group-hover:rotate-12 transition-transform">
                 <Zap className="w-6 h-6 text-white fill-current" />
              </div>
              <div className="hidden sm:block">
                 <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1 uppercase">LMS PRO</h2>
                 <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Premium Learning</p>
              </div>
           </div>
        </div>

        {/* ── DESKTOP NAV (Students) ── */}
        {isStudent && !isMobile && (
          <nav className="flex items-center gap-1.5 glass p-1.5 rounded-[24px] border-white/20 shadow-sm">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/dashboard" && (pathname ?? "").startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[11px] font-black whitespace-nowrap transition-all duration-300 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200"
                      : "text-slate-500 hover:text-indigo-600 hover:bg-white/60"
                  }`}
                >
                  <link.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Search Bar */}
        {!isMobile && (
          <div className="hidden xl:flex items-center gap-3 bg-white/50 border border-white/80 rounded-2xl px-5 py-3 w-80 focus-within:w-96 focus-within:bg-white focus-within:shadow-2xl focus-within:shadow-indigo-100 focus-within:border-indigo-200 transition-all duration-500 group">
            <Search className="w-4 h-4 text-slate-400 shrink-0 group-focus-within:text-indigo-600" />
            <input
              type="text"
              placeholder="ابحث عن محتوى تعليمي..."
              className="bg-transparent text-xs font-bold outline-none w-full placeholder:text-slate-400"
            />
          </div>
        )}
      </div>

      {/* ── LEFT SIDE: Profile & Utilities ── */}
      <div className="flex items-center gap-4 shrink-0">
        
        {/* Support & Language */}
        <div className="hidden md:flex items-center gap-3 ml-2">
           <button className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-xl hover:shadow-indigo-100/20 transition-all border border-transparent hover:border-slate-100">
              <Globe className="w-5 h-5" />
           </button>
           <button className="relative w-12 h-12 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-xl hover:shadow-indigo-100/20 transition-all border border-transparent hover:border-slate-100">
              <Bell className="w-5 h-5" />
              <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-rose-500 ring-4 ring-white animate-pulse" />
           </button>
        </div>

        <div className="h-10 w-px bg-slate-200/50 mx-2 hidden md:block" />

        {/* Profile Card */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className="flex items-center gap-2 md:gap-4 p-1.5 md:p-2 sm:pl-6 rounded-[24px] bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/30 hover:border-indigo-200 transition-all active:scale-95 group"
          >
            <div className="relative">
               <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white font-black text-sm shadow-xl shadow-indigo-100 group-hover:rotate-6 transition-transform">
                 {userInitials}
               </div>
               <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-slate-900 leading-none mb-1">{userName}</p>
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{userRoleName}</p>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-300 transition-transform duration-500 ${showDropdown ? "rotate-180 text-indigo-600" : ""}`}
            />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <div className="absolute left-0 top-[calc(100%+16px)] w-72 z-20 rounded-[40px] overflow-hidden shadow-2xl shadow-indigo-200/40 border border-slate-100 bg-white animate-in zoom-in slide-in-from-top-4 duration-300 origin-top-left p-2">
                <div className="p-6 border-b border-slate-50 bg-slate-50/50 rounded-t-[32px] mb-2">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-lg flex items-center justify-center font-black text-xl text-indigo-600">
                         {userInitials}
                      </div>
                      <div className="min-w-0">
                         <p className="font-black text-base text-slate-900 truncate leading-tight">{userName}</p>
                         <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-1">{userRoleName}</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-1">
                  <DropdownItem icon={User} label="الملف الشخصي" onClick={() => { setShowDropdown(false); router.push("/profile"); }} />
                  <DropdownItem icon={Settings} label="إعدادات الحساب" onClick={() => { setShowDropdown(false); router.push("/settings"); }} />

                  {isImpersonating && (
                    <DropdownItem
                      icon={ArrowLeftCircle}
                      label="العودة للإدارة"
                      onClick={() => { setShowDropdown(false); stopImpersonation(); }}
                      color="indigo"
                    />
                  )}

                  <div className="h-px bg-slate-50 my-3 mx-4" />
                  <DropdownItem icon={LogOut} label="تسجيل الخروج" onClick={handleLogout} color="rose" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function DropdownItem({
  icon: Icon,
  label,
  onClick,
  color = "slate",
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  color?: "slate" | "indigo" | "rose";
}) {
  const colors = {
    slate: "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
    indigo: "text-indigo-600 hover:bg-indigo-50",
    rose: "text-rose-600 hover:bg-rose-50",
  };
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 px-5 py-4 rounded-3xl transition-all font-black text-sm ${colors[color]}`}
    >
      <div className={`p-2 rounded-xl transition-colors ${color === 'rose' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400 group-hover:text-indigo-600'}`}>
         <Icon className="w-4 h-4 shrink-0" />
      </div>
      <span>{label}</span>
    </button>
  );
}

