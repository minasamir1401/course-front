"use client";

import React, { useState, useEffect } from "react";
import {
  Search, Bell, Menu, ChevronDown, LogOut, Settings,
  User, BookOpen, ArrowLeftCircle
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
      className="sticky top-0 z-30 flex items-center justify-between bg-white border-b border-slate-100 shadow-sm px-4 md:px-6"
      style={{ height: "72px" }}
    >
      {/* ── RIGHT SIDE ── */}
      <div className="flex items-center gap-4 flex-1 min-w-0">

        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-base font-black text-slate-900 leading-none">مدرستي</p>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
              {isStudent ? "Student Portal" : "Admin Portal"}
            </p>
          </div>
        </div>

        {/* Admin mobile menu button */}
        {!isStudent && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="فتح القائمة"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* ── DESKTOP NAV (students only, not mobile) ── */}
        {isStudent && !isMobile && (
          <nav className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-2xl border border-slate-200/60">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/dashboard" && (pathname ?? "").startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
                  }`}
                >
                  <link.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Search bar — desktop only */}
        {isStudent && !isMobile && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/70 rounded-2xl px-3.5 py-2.5 w-56 focus-within:border-indigo-200 focus-within:bg-white focus-within:shadow-sm transition-all">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="ابحث هنا..."
              className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400"
            />
          </div>
        )}
      </div>

      {/* ── LEFT SIDE: actions ── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Bell */}
        <button className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border-2 border-white" />
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className="flex items-center gap-2 p-1 pl-3 rounded-2xl bg-slate-50 border border-slate-200/60 hover:bg-white hover:shadow-sm transition-all"
          >
            <div className="text-right hidden md:block">
              <p className="text-xs font-black text-slate-900 leading-none">{userName}</p>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{userRoleName}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-slate-200 flex items-center justify-center text-indigo-700 font-black text-sm border border-white shadow-sm">
              {userInitials}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <div
                className="absolute left-0 top-[calc(100%+8px)] w-64 z-20 rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/15 border border-slate-100 bg-white"
              >
                {/* Header */}
                <div className="px-5 py-4 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center font-black text-lg">
                      {userInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-sm truncate">{userName}</p>
                      <p className="text-[10px] text-indigo-300 font-semibold uppercase tracking-widest">{userRoleName}</p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-2 space-y-0.5">
                  <DropdownItem icon={User} label="الملف الشخصي" onClick={() => { setShowDropdown(false); router.push("/profile"); }} />
                  <DropdownItem icon={Settings} label="الإعدادات" onClick={() => { setShowDropdown(false); router.push("/settings"); }} />

                  {isImpersonating && (
                    <DropdownItem
                      icon={ArrowLeftCircle}
                      label="العودة للوحة الإدارة"
                      onClick={() => { setShowDropdown(false); stopImpersonation(); }}
                      color="indigo"
                    />
                  )}

                  <div className="h-px bg-slate-100 my-1" />

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

// Small helper component for cleanliness
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
    slate: "text-slate-600 hover:bg-slate-50",
    indigo: "text-indigo-600 hover:bg-indigo-50",
    rose: "text-rose-600 hover:bg-rose-50",
  };
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${colors[color]}`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}
