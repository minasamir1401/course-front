"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, GraduationCap,
  Settings, LogOut, Menu, X, ClipboardList, BookOpen, UserCheck, Shield,
  Plus, PieChart, Layers
} from "lucide-react";
import { logout } from "@/lib/auth";

export default function SuperAdminSidebar({ isOpen: externalOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = externalOpen !== undefined ? (onClose || (() => {})) : setInternalOpen;

  const handleLogout = () => logout(router, pathname);

  const searchParams = useSearchParams();
  const currentRole = searchParams.get('role');

  const isActive = (href: string) => {
    if (href.includes('role=')) {
      const roleInHref = new URLSearchParams(href.split('?')[1]).get('role');
      return currentRole === roleInHref;
    }
    if (href === '/super-admin/users') {
      return pathname === '/super-admin/users' && !currentRole;
    }
    if (href === '/super-admin') return pathname === '/super-admin';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-5 right-5 z-[70] bg-slate-900 text-white p-3 rounded-2xl shadow-2xl active:scale-90 transition-all"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <aside className={`fixed top-0 right-0 h-full w-64 bg-white border-l border-slate-100 z-50 transition-all lg:translate-x-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'} shadow-xl flex flex-col`}>

        {/* Brand Logo */}
        <div className="px-6 py-8 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-none">LMS</h1>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[2px]">COMMAND CENTER</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto" dir="rtl">

          {/* MAIN */}
          <div className="space-y-1">
            <SidebarLink href="/super-admin" icon={LayoutDashboard} label="لوحة التحكم" active={isActive('/super-admin')} />
          </div>

          {/* PLATFORM */}
          <div className="space-y-1">
            <p className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">إدارة المنصة</p>
            <SidebarLink href="/super-admin/schools"  icon={Building2}     label="إدارة المدارس"    active={isActive('/super-admin/schools')} />
            <SidebarLink href="/super-admin/users"    icon={Users}         label="إدارة المستخدمين" active={isActive('/super-admin/users')} />
          </div>

          {/* EXAMS */}
          <div className="space-y-1">
            <p className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">الامتحانات المركزية</p>
            <SidebarLink href="/super-admin/exams"             icon={ClipboardList} label="كل الامتحانات"  active={isActive('/super-admin/exams')} />
            <SidebarLink href="/super-admin/exams/new"         icon={BookOpen}      label="إنشاء جديد"      active={isActive('/super-admin/exams/new')} />
            <SidebarLink href="/super-admin/exam-supervisors"  icon={UserCheck}     label="المشرفون"         active={isActive('/super-admin/exam-supervisors')} />
          </div>

          {/* COURSES */}
          <div className="space-y-1">
            <p className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">الكورسات المركزية</p>
            <SidebarLink href="/super-admin/courses"         icon={Layers} label="كل الكورسات"  active={isActive('/super-admin/courses')} />
            <SidebarLink href="/super-admin/courses/create"  icon={Plus}   label="إضافة كورس"   active={isActive('/super-admin/courses/create')} />
          </div>

          {/* REPORTS */}
          <div className="space-y-1">
            <p className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">التقارير</p>
            <SidebarLink href="/super-admin/reports" icon={PieChart} label="تقرير الحضور" active={isActive('/super-admin/reports')} />
          </div>

        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-bold text-sm group"
          >
            <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-all">
              <LogOut className="w-4 h-4" />
            </div>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {isOpen && (
        <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" />
      )}
    </>
  );
}

function SidebarLink({ href, icon: Icon, label, active, badge }: {
  href: string;
  icon: any;
  label: string;
  active: boolean;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group ${
        active
          ? 'bg-slate-900 text-white'
          : 'text-slate-700 hover:bg-slate-900 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
          active ? 'bg-white/15' : 'bg-slate-100 group-hover:bg-white/15'
        }`}>
          <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
        </div>
        <span className={`text-sm ${active ? 'font-black' : 'font-bold'}`}>{label}</span>
      </div>
      {badge && (
        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
          active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-white/20 group-hover:text-white'
        }`}>
          {badge}
        </span>
      )}
    </Link>
  );
}
