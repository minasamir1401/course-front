"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { 
  LayoutDashboard, Building2, Users, GraduationCap, 
  Settings, LogOut, Menu, X, ClipboardList, BookOpen, UserCheck, Shield,
  UserCog, Plus
} from "lucide-react";
import { logout } from "@/lib/auth";

export default function SuperAdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => logout(router, pathname);

  const searchParams = useSearchParams();
  const currentRole = searchParams.get('role');

  const isActive = (href: string) => {
    // Check for role-based links first
    if (href.includes('role=')) {
      const roleInHref = new URLSearchParams(href.split('?')[1]).get('role');
      return currentRole === roleInHref;
    }

    // "All Users" should only be active if we are on /users and have NO role param
    if (href === '/super-admin/users') {
      return pathname === '/super-admin/users' && !currentRole;
    }

    if (href === '/super-admin') return pathname === '/super-admin';
    return pathname.startsWith(href);
  };

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden fixed top-4 right-4 z-[60] bg-blue-600 text-white p-3 rounded-2xl shadow-xl">
        {isOpen ? <X /> : <Menu />}
      </button>

      <aside className={`fixed top-0 right-0 h-full w-64 bg-white border-l border-slate-100 z-50 transition-all lg:translate-x-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'} shadow-xl`}>
        <div className="flex flex-col h-full p-5">
          {/* Logo */}
          <div className="flex items-center gap-3 px-3 py-8 mb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg"><Shield className="w-6 h-6 text-white" /></div>
            <h1 className="text-xl font-black text-slate-900 italic">LMS <span className="text-blue-600 text-[10px] block font-bold not-italic tracking-[1px]">COMMAND CENTER</span></h1>
          </div>

          <nav className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-1">
            
            {/* SECTION 1: MAIN */}
            <div className="space-y-1">
              <Link 
                href="/super-admin" 
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${isActive('/super-admin') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isActive('/super-admin') ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-50 group-hover:bg-slate-100'}`}>
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <span className={`text-sm ${isActive('/super-admin') ? 'font-black' : 'font-bold'}`}>لوحة التحكم</span>
              </Link>
            </div>

            {/* SECTION 2: PLATFORM MANAGEMENT */}
            <div className="space-y-1">
              <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1">إدارة المنصة</p>
              
              {/* Schools */}
              <Link href="/super-admin/schools" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${isActive('/super-admin/schools') ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isActive('/super-admin/schools') ? 'bg-indigo-600 text-white' : 'bg-slate-100 group-hover:bg-slate-200/50'}`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold">إدارة المدارس</span>
              </Link>

              {/* Users */}
              <Link href="/super-admin/users" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${isActive('/super-admin/users') ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isActive('/super-admin/users') ? 'bg-amber-500 text-white' : 'bg-slate-100 group-hover:bg-slate-200/50'}`}>
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold">إدارة المستخدمين</span>
              </Link>
            </div>

            {/* SECTION 3: EXAMS */}
            <div className="space-y-1">
              <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1">الامتحانات المركزية</p>
              
              <Link href="/super-admin/exams" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${isActive('/super-admin/exams') ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isActive('/super-admin/exams') ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'bg-slate-100 group-hover:bg-slate-200/50'}`}>
                  <ClipboardList className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold">كل الامتحانات</span>
              </Link>

              <Link href="/super-admin/exams/new" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${isActive('/super-admin/exams/new') ? 'bg-pink-50 text-pink-700 border border-pink-100' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isActive('/super-admin/exams/new') ? 'bg-pink-500 text-white' : 'bg-slate-100 group-hover:bg-slate-200/50'}`}>
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold">إنشاء جديد</span>
              </Link>

              <Link href="/super-admin/exam-supervisors" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${isActive('/super-admin/exam-supervisors') ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isActive('/super-admin/exam-supervisors') ? 'bg-cyan-600 text-white' : 'bg-slate-100 group-hover:bg-slate-200/50'}`}>
                  <UserCheck className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold">المشرفون</span>
              </Link>
            </div>

            {/* SECTION: CENTRAL COURSES */}
            <div className="space-y-1">
              <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1">الكورسات المركزية</p>
              
              <Link href="/super-admin/courses" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${isActive('/super-admin/courses') ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isActive('/super-admin/courses') ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-100 group-hover:bg-slate-200/50'}`}>
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold">كل الكورسات</span>
              </Link>

              <Link href="/super-admin/courses/create" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${isActive('/super-admin/courses/create') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isActive('/super-admin/courses/create') ? 'bg-emerald-600 text-white' : 'bg-slate-100 group-hover:bg-slate-200/50'}`}>
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold">إضافة كورس</span>
              </Link>
            </div>

            {/* SECTION 4: REPORTS */}
            <div className="space-y-1">
              <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1">التقارير</p>
              
              <Link href="/super-admin/reports" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${isActive('/super-admin/reports') ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isActive('/super-admin/reports') ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'bg-slate-100 group-hover:bg-slate-200/50'}`}>
                  <ClipboardList className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold">تقرير الحضور</span>
              </Link>
            </div>
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100">
            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:scale-110 transition-transform"><LogOut className="w-4 h-4" /></div>
              <span className="text-sm font-bold">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>
      {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" />}
    </>
  );
}
