"use client";

import React, { useState, useEffect } from "react";
import {
  Search, Bell, Menu, ChevronDown, LogOut, Settings,
  User, BookOpen, ArrowLeftCircle, Sparkles, MessageSquare
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
      className="sticky top-0 z-30 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 transition-all"
      style={{ height: "80px" }}
    >
      {/* ── RIGHT SIDE ── */}
      <div className="flex items-center gap-6 flex-1 min-w-0">
        
        {/* Breadcrumb / Title Area */}
        <div className="flex items-center gap-3">
           {!isStudent && (
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all border border-slate-200/50"
              >
                <Menu className="w-5 h-5" />
              </button>
           )}
           <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                 <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
              <h2 className="text-sm font-black text-slate-800 tracking-tight uppercase">
                {pathname?.split('/').filter(Boolean).pop()?.replace('-', ' ') || "Dashboard"}
              </h2>
           </div>
        </div>

        {/* ── DESKTOP NAV (students only) ── */}
        {isStudent && !isMobile && (
          <nav className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/60">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/dashboard" && (pathname ?? "").startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-300 ${
                    isActive
                      ? "bg-white text-indigo-600 shadow-sm border border-slate-100"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <link.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Global Search */}
        {!isMobile && (
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/50 rounded-2xl px-4 py-3 w-64 focus-within:w-80 focus-within:border-indigo-300 focus-within:bg-white focus-within:shadow-xl focus-within:shadow-indigo-100/20 transition-all duration-500 group">
            <Search className="w-4 h-4 text-slate-400 shrink-0 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="text"
              placeholder="ابحث عن دروس، معلمين، أو كورسات..."
              className="bg-transparent text-xs font-bold outline-none w-full placeholder:text-slate-400"
            />
          </div>
        )}
      </div>

      {/* ── LEFT SIDE: Actions ── */}
      <div className="flex items-center gap-4 shrink-0">
        
        {/* Support/Notification Area */}
        <div className="hidden md:flex items-center gap-2 mr-2">
           <button className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
             <MessageSquare className="w-5 h-5" />
           </button>
           <button className="relative w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
           </button>
        </div>

        {/* Profile Card */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className="flex items-center gap-3 p-1.5 pl-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/20 transition-all active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-100 group-hover:rotate-6 transition-transform">
              {userInitials}
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-slate-900 leading-none mb-1">{userName}</p>
              <div className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{userRoleName}</p>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${showDropdown ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <div className="absolute left-0 top-[calc(100%+12px)] w-64 z-20 rounded-[32px] overflow-hidden shadow-2xl shadow-indigo-200/50 border border-slate-100 bg-white animate-in zoom-in duration-300 origin-top-left">
                <div className="p-5 border-b border-slate-50">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">حسابك الشخصي</p>
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-indigo-600">
                         {userInitials}
                      </div>
                      <div className="min-w-0">
                         <p className="font-black text-sm text-slate-900 truncate">{userName}</p>
                         <p className="text-[10px] text-indigo-600 font-bold">{userRoleName}</p>
                      </div>
                   </div>
                </div>

                <div className="p-3 space-y-1">
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

                  <div className="h-px bg-slate-50 my-2 mx-3" />
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${colors[color]}`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </button>
  );
}
