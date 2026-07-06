"use client";

import React, { useState, useEffect } from "react";
import { Search, Bell, Menu, ChevronDown, LogOut, Settings, User, ArrowLeftCircle, Sparkles, Globe, Zap, Building2 } from 'lucide-react';
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { logout, stopImpersonation } from "@/lib/auth";
import { LucideIcon } from 'lucide-react';
import { API_URL, apiFetch } from '@/lib/api';


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
  const { t, language, setLanguage } = useLanguage();

  const [schools, setSchools] = useState<any[]>([]);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [currentSchoolName, setCurrentSchoolName] = useState<string>("");
  const [schoolSearchQuery, setSchoolSearchQuery] = useState("");

  const [isOnline, setIsOnline] = useState(true);
  const [isSessionValid, setIsSessionValid] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const checkToken = () => {
      const path = pathname || window.location.pathname;
      let token = "";
      if (path.startsWith("/super-admin")) {
        token = localStorage.getItem("super_admin_token") || "";
      } else if (path.startsWith("/school-admin")) {
        token = localStorage.getItem("school_admin_token") || "";
      } else {
        token = localStorage.getItem("lms_token") || "";
      }

      const isPreview = window.location.search.includes('preview=true');

      if (!token) {
        if (!path.endsWith("/login") && path !== "/login" && path !== "/" && !isPreview) {
          setIsSessionValid(false);
        } else {
          setIsSessionValid(true);
        }
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.exp && payload.exp * 1000 < Date.now() && !isPreview) {
          setIsSessionValid(false);
        } else {
          setIsSessionValid(true);
        }
      } catch (_) {
        setIsSessionValid(false);
      }
    };

    checkToken();
    const interval = setInterval(checkToken, 15000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [pathname]);

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
          SUPER_ADMIN: language === 'ar' ? "مدير النظام" : "System Admin",
          SCHOOL_ADMIN: language === 'ar' ? "مدير مدرسة" : "School Admin",
          TEACHER: language === 'ar' ? "معلم" : "Teacher",
          STUDENT: language === 'ar' ? "طالب" : "Student",
        };
        setUserRoleName(roles[user.role] || (language === 'ar' ? "مستخدم" : "User"));
      } catch (_) { }
    }
  }, [pathname, language]);

  useEffect(() => {
    const isSuperAdmin = pathname?.startsWith("/super-admin");
    const token = localStorage.getItem("super_admin_token");
    if (isSuperAdmin && token) {
      const fetchSchools = async () => {
        try {
          const res = await apiFetch(API_URL + "/admin/schools", {

            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.schools || []);
            setSchools(list);
          }
        } catch (error) {
          console.error("Failed to fetch schools in Header:", error);
        }
      };
      fetchSchools();
    } else {
      setSchools([]);
    }
  }, [pathname]);

  useEffect(() => {
    if (pathname && schools.length > 0) {
      const match = pathname.match(/\/super-admin\/schools\/([^/]+)/);
      if (match) {
        const activeSchoolId = match[1];
        const schoolObj = schools.find((s) => s.id === activeSchoolId);
        if (schoolObj) {
          setCurrentSchoolName(schoolObj.name);
          return;
        }
      }
    }
    setCurrentSchoolName("");
  }, [pathname, schools]);

  const handleLogout = () => logout(router, pathname ?? undefined);

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-700 ${scrolled ? 'pt-2 px-2 md:pt-4 md:px-4' : 'pt-0 px-0 md:pt-6 md:px-6'}`}>
      <div
        className={`mx-auto flex items-center justify-between transition-all duration-700 ${
          scrolled
            ? "h-16 md:h-20 bg-white/80 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[32px] md:rounded-[40px] border border-white px-3 md:px-6 max-w-7xl"
            : "h-20 md:h-24 bg-white/40 backdrop-blur-xl border-b border-slate-200/50 md:border md:border-white/60 md:rounded-[40px] px-4 md:px-8 max-w-[1600px] shadow-sm hover:shadow-xl hover:bg-white/60"
        }`}
      >
        {/* ── RIGHT SIDE: Navigation & Logo ── */}
        <div className="flex items-center gap-1.5 sm:gap-3 xl:gap-8 flex-1 min-w-0">

          {/* Brand / Title Section */}
          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            {!isStudent && (
              <button
                onClick={onMenuClick}
                className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white/50 hover:bg-white text-slate-600 transition-all border border-slate-200/40"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 shadow-xl shadow-indigo-200 flex items-center justify-center transform group-hover:rotate-12 transition-transform">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="hidden sm:block">
                <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1 flex items-center gap-0.5" dir="ltr">
                  <span className="text-indigo-600">K</span>LEVRO
                </h2>
                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">LMS Platform</p>
              </div>
            </div>
          </div>

          {/* School Switcher Dropdown for Superadmin */}
          {pathname?.startsWith("/super-admin") && schools.length > 0 && (
            <div className="relative z-50">
              <button
                onClick={() => setShowSchoolDropdown(!showSchoolDropdown)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white/80 border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-[10px] sm:text-xs font-black text-slate-800 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 hidden xs:block" />
                <span className="max-w-[70px] xs:max-w-[90px] sm:max-w-[180px] truncate">
                  {currentSchoolName || (language === 'ar' ? "انتقال سريع لمدرسة..." : "Switch school...")}
                </span>
                <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 transition-transform ${showSchoolDropdown ? "rotate-180 text-indigo-600" : ""}`} />
              </button>

              {showSchoolDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSchoolDropdown(false)} />
                  <div className={`absolute top-[calc(100%+8px)] ${language === 'ar' ? 'right-0' : 'left-0'} z-50 w-72 bg-white rounded-2xl border border-slate-100 shadow-2xl p-3 animate-in fade-in slide-in-from-top-2 duration-200`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="relative mb-3">
                      <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                      <input
                        type="text"
                        placeholder={language === 'ar' ? "ابحث عن مدرسة..." : "Search school..."}
                        value={schoolSearchQuery}
                        onChange={(e) => setSchoolSearchQuery(e.target.value)}
                        className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-2 ${language === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'} text-xs font-bold outline-none focus:bg-white focus:border-indigo-500 text-slate-900`}
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                      <button
                        onClick={() => {
                          setShowSchoolDropdown(false);
                          router.push("/super-admin/schools");
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-50 ${language === 'ar' ? 'text-right' : 'text-left'} ${!currentSchoolName ? "text-indigo-600 bg-indigo-50/50" : "text-slate-600"}`}
                      >
                        <Building2 className="w-4 h-4 shrink-0" />
                        <span>{language === 'ar' ? "إدارة جميع المدارس" : "Manage All Schools"}</span>
                      </button>
                      
                      <div className="h-px bg-slate-100 my-1" />

                      {schools
                        .filter((s) => s.name.toLowerCase().includes(schoolSearchQuery.toLowerCase()))
                        .map((school) => {
                          const isActive = currentSchoolName === school.name;
                          return (
                            <button
                              key={school.id}
                              onClick={() => {
                                setShowSchoolDropdown(false);
                                router.push(`/super-admin/schools/${school.id}`);
                              }}
                              className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between hover:bg-slate-50 ${language === 'ar' ? 'text-right' : 'text-left'} ${isActive ? "text-indigo-600 bg-indigo-50/50" : "text-slate-600"}`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Building2 className="w-4 h-4 shrink-0" />
                                <span className="truncate">{school.name}</span>
                              </div>
                              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── DESKTOP NAV (Students) ── */}
          {isStudent && !isMobile && (
            <nav className="flex items-center gap-1 xl:gap-1.5 glass p-1 xl:p-1.5 rounded-[24px] border-white/20 shadow-sm">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/dashboard" && (pathname ?? "").startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 xl:gap-2.5 px-2 lg:px-2.5 xl:px-6 py-2 lg:py-2 xl:py-3 rounded-xl xl:rounded-2xl text-[10px] xl:text-[11px] font-black whitespace-nowrap transition-all duration-300 ${isActive
                        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200"
                        : "text-slate-500 hover:text-indigo-600 hover:bg-white/60"
                      }`}
                  >
                    <link.icon className={`w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
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
                placeholder={t('header.searchPlaceholder')}
                className="bg-transparent text-xs font-bold outline-none w-full placeholder:text-slate-400"
              />
            </div>
          )}
        </div>

        {/* ── LEFT SIDE: Profile & Utilities ── */}
        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">

          {/* Language toggle - visible on all screen sizes */}
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="flex w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl items-center justify-center text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-md transition-all border border-slate-100 font-black text-[9px] sm:text-[10px] uppercase bg-white/70"
            title={language === 'ar' ? 'التبديل للإنجليزية' : 'Switch to Arabic'}
          >
            {language === 'ar' ? 'EN' : 'AR'}
          </button>
          {/* Connection Status Badge */}
          <div className={`hidden xs:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-[10px] font-black transition-all duration-300 ${
            !isOnline
              ? "bg-rose-50 border-rose-200 text-rose-600 shadow-sm animate-pulse"
              : !isSessionValid
                ? "bg-amber-50 border-amber-200 text-amber-600 shadow-sm animate-pulse"
                : "bg-emerald-50 border-emerald-100 text-emerald-600"
          }`}>
            <span className={`h-2 w-2 rounded-full ${
              !isOnline 
                ? "bg-rose-500 animate-ping" 
                : !isSessionValid 
                  ? "bg-amber-500 animate-pulse" 
                  : "bg-emerald-500"
            }`} />
            <span className="hidden sm:inline">
              {!isOnline
                ? (language === 'ar' ? "غير متصل بالإنترنت" : "Offline")
                : !isSessionValid
                  ? (language === 'ar' ? "انتهت الجلسة" : "Session Expired")
                  : (language === 'ar' ? "متصل بالخادم" : "Connected")}
            </span>
          </div>

          <button className="relative w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-xl hover:shadow-indigo-100/20 transition-all border border-transparent hover:border-slate-100">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute top-2 right-2 sm:top-3 sm:right-3 w-2 h-2 rounded-full bg-rose-500 ring-4 ring-white animate-pulse" />
          </button>

          <div className="h-10 w-px bg-slate-200/50 mx-2 hidden md:block" />

          {/* Impersonation Return Button */}
          {isImpersonating && (
            <button
              onClick={() => stopImpersonation()}
              className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-600 px-3 py-1.5 rounded-xl hover:bg-rose-100 transition-all font-bold text-xs"
            >
              <ArrowLeftCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{t('header.returnAdmin')}</span>
            </button>
          )}

          {/* Profile Card */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown((v) => !v)}
              className="flex items-center gap-1.5 sm:gap-2 xl:gap-4 p-1 sm:p-1.5 md:p-2 sm:ps-4 xl:ps-6 rounded-xl sm:rounded-[24px] bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/30 hover:border-indigo-200 transition-all active:scale-95 group"
            >
              <div className="relative">
                <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-lg sm:rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-100 group-hover:rotate-6 transition-transform">
                  {userInitials}
                </div>
                <div className={`absolute -bottom-1 -end-1 w-4 h-4 border-2 border-white rounded-full transition-colors duration-300 ${
                  !isOnline 
                    ? "bg-rose-500" 
                    : !isSessionValid 
                      ? "bg-amber-500" 
                      : "bg-emerald-500"
                }`} />
              </div>

              <div className="text-start hidden sm:block min-w-0">
                <p className="text-xs font-black text-slate-900 leading-none mb-1 truncate max-w-[80px] lg:max-w-[100px] xl:max-w-[150px]">{userName}</p>
                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest truncate">{userRoleName}</p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-300 transition-transform duration-500 ${showDropdown ? "rotate-180 text-indigo-600" : ""}`}
              />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                {/* Backdrop - adds dim on mobile */}
                <div
                  className="fixed inset-0 z-10 bg-slate-900/20 sm:bg-transparent backdrop-blur-[2px] sm:backdrop-blur-none"
                  onClick={() => setShowDropdown(false)}
                />
                {/* On mobile: fixed centered. On sm+: absolute anchored */}
                <div className="fixed inset-x-3 top-[76px] z-20 sm:absolute sm:inset-x-auto sm:top-[calc(100%+16px)] sm:end-0 sm:w-72 rounded-[32px] sm:rounded-[40px] overflow-hidden shadow-2xl shadow-indigo-200/40 border border-slate-100 bg-white animate-in zoom-in duration-300 origin-top sm:origin-top-right rtl:sm:origin-top-left p-1.5 sm:p-2">
                  <div className="p-4 sm:p-6 border-b border-slate-50 bg-slate-50/50 rounded-t-[24px] sm:rounded-t-[32px] mb-2">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-white border border-slate-100 shadow-lg flex items-center justify-center font-black text-lg sm:text-xl text-indigo-600">
                        {userInitials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-base text-slate-900 truncate leading-tight">{userName}</p>
                        <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-1">{userRoleName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-0.5 sm:space-y-1">
                    <DropdownItem icon={User} label={t('header.profile')} onClick={() => { setShowDropdown(false); router.push("/profile"); }} />
                    <DropdownItem icon={Settings} label={t('header.accountSettings')} onClick={() => { setShowDropdown(false); router.push("/settings"); }} />
                    <DropdownItem
                      icon={Globe}
                      label={language === 'ar' ? 'English' : 'العربية'}
                      onClick={() => {
                        setLanguage(language === 'ar' ? 'en' : 'ar');
                        setShowDropdown(false);
                      }}
                    />

                    {isImpersonating && (
                      <DropdownItem
                        icon={ArrowLeftCircle}
                        label={t('header.returnAdmin')}
                        onClick={() => { setShowDropdown(false); stopImpersonation(); }}
                        color="indigo"
                      />
                    )}

                    <div className="h-px bg-slate-100 my-2 mx-4" />
                    <DropdownItem icon={LogOut} label={t('header.logout')} onClick={handleLogout} color="rose" />
                  </div>
                </div>
              </>
            )}
          </div>
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
