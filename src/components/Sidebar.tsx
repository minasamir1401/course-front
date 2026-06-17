"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, GraduationCap, ClipboardList,
  Settings, LogOut, Menu, X, BookOpen, UserCheck,
  BarChart3, ShieldCheck
} from "lucide-react";
import { logout } from "@/lib/auth";
import { useLanguage } from "@/contexts/LanguageContext";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: (open: boolean) => void;
  role?: string;
}

export default function Sidebar({ isOpen: externalIsOpen, onClose, onToggle, role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, language } = useLanguage();
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Use external control if provided, otherwise manage internally
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const handleClose = () => {
    onClose?.();
    setInternalIsOpen(false);
  };
  const handleToggle = () => {
    if (externalIsOpen !== undefined) {
      onToggle?.(!isOpen);
      return;
    }
    setInternalIsOpen(prev => !prev);
  };

  const handleLogout = () => logout(router, pathname);

  const isActive = (href: string) => {
    if (href === '/school-admin') return pathname === '/school-admin';
    return pathname.startsWith(href);
  };

  const navGroups = [
    {
      title: t('schoolAdmin.sidebar.main'),
      links: [
        { href: "/school-admin", icon: LayoutDashboard, label: t('schoolAdmin.sidebar.dashboard') },
      ]
    },
    {
      title: t('schoolAdmin.sidebar.staffManagement'),
      links: [
        { href: "/school-admin/teachers", icon: UserCheck, label: t('schoolAdmin.sidebar.teachers') },
        { href: "/school-admin/students", icon: GraduationCap, label: t('schoolAdmin.sidebar.students') },
        { href: "/school-admin/classes", icon: Users, label: t('schoolAdmin.sidebar.classes') },
      ]
    },
    {
      title: t('schoolAdmin.sidebar.educationProcess'),
      links: [
        { href: "/school-admin/exams", icon: ClipboardList, label: t('schoolAdmin.sidebar.exams') },
        { href: "/school-admin/courses", icon: BookOpen, label: t('schoolAdmin.sidebar.courses') },
      ]
    },
    {
      title: t('schoolAdmin.sidebar.reportsAndStats'),
      links: [
        { href: "/school-admin/reports", icon: BarChart3, label: t('schoolAdmin.sidebar.finalReports') },
      ]
    }
  ];

  // RTL: slides from right; LTR: slides from left
  const sidePosition = language === 'ar' ? 'right-0' : 'left-0';
  const sideSlideOut = language === 'ar' ? 'translate-x-full' : '-translate-x-full';

  return (
    <>
      <aside className={`fixed top-0 ${sidePosition} h-full w-[280px] max-w-[85vw] bg-white border-slate-100 z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : sideSlideOut} shadow-xl flex flex-col ${language === 'ar' ? 'border-l' : 'border-r'}`}>

        {/* School Identity */}
        <div className="p-8 mb-4 border-b border-slate-50">
          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center shadow-xl shadow-indigo-100 group-hover:scale-110 transition-transform duration-500">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-black text-slate-900 tracking-tight truncate">{t('schoolAdmin.sidebar.adminCenter')}</h1>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[2px]">School Admin</p>
            </div>
          </div>
        </div>

        {/* Navigation Content */}
        <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              <h3 className={`px-4 text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-4 text-start`}>{group.title}</h3>
              <div className="space-y-1">
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all group relative overflow-hidden ${isActive(link.href)
                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 ${isActive(link.href) ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-indigo-50 group-hover:rotate-6'
                      }`}>
                      <link.icon className={`w-4 h-4 ${isActive(link.href) ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                    </div>
                    <span className={`text-sm tracking-tight ${isActive(link.href) ? 'font-black' : 'font-bold'}`}>{link.label}</span>
                    {isActive(link.href) && (
                      <div className={`absolute top-0 ${language === 'ar' ? 'left-0' : 'right-0'} w-1 h-full bg-white/30`} />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-6 mt-auto border-t border-slate-50 bg-slate-50/50 space-y-3" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <button className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-white border border-slate-100 text-slate-600 hover:text-slate-900 hover:shadow-md transition-all font-bold text-sm group">
            <Settings className="w-4 h-4 text-slate-400 group-hover:rotate-90 transition-transform duration-500" />
            <span>{t('schoolAdmin.sidebar.schoolSettings')}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all font-black text-sm group"
          >
            <LogOut className="w-4 h-4 transition-transform ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            <span>{t('schoolAdmin.sidebar.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.5); }
      `}</style>
    </>
  );
}
