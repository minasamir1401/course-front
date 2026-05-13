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

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  role?: string;
}

export default function Sidebar({ isOpen: externalIsOpen, onClose, role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Use external control if provided, otherwise manage internally
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const handleClose = () => {
    onClose?.();
    setInternalIsOpen(false);
  };
  const handleToggle = () => {
    if (onClose) onClose();
    else setInternalIsOpen(prev => !prev);
  };

  const handleLogout = () => logout(router, pathname);

  const isActive = (href: string) => {
    if (href === '/school-admin') return pathname === '/school-admin';
    return pathname.startsWith(href);
  };

  const navGroups = [
    {
      title: "الرئيسية",
      links: [
        { href: "/school-admin", icon: LayoutDashboard, label: "لوحة التحكم" },
      ]
    },
    {
      title: "إدارة الكوادر",
      links: [
        { href: "/school-admin/teachers", icon: UserCheck, label: "المعلمون" },
        { href: "/school-admin/students", icon: GraduationCap, label: "الطلاب" },
        { href: "/school-admin/classes", icon: Users, label: "الفصول الدراسية" },
      ]
    },
    {
      title: "العملية التعليمية",
      links: [
        { href: "/school-admin/exams", icon: ClipboardList, label: "الامتحانات" },
        { href: "/school-admin/courses", icon: BookOpen, label: "المقررات" },
      ]
    },
    {
      title: "التقارير والإحصاء",
      links: [
        { href: "/school-admin/reports", icon: BarChart3, label: "التقارير النهائية" },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={handleToggle} 
        className="lg:hidden fixed top-5 right-5 z-[70] bg-indigo-600 text-white p-3 rounded-2xl shadow-xl active:scale-90 transition-all"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <aside className={`fixed top-0 right-0 h-full w-72 bg-white border-l border-slate-100 z-50 transition-all duration-500 lg:translate-x-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'} shadow-[0_0_40px_rgba(0,0,0,0.03)] flex flex-col`}>
        
        {/* School Identity */}
        <div className="p-8 mb-4 border-b border-slate-50">
          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center shadow-xl shadow-indigo-100 group-hover:scale-110 transition-transform duration-500">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-black text-slate-900 tracking-tight truncate">مركز الإدارة</h1>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[2px]">School Admin</p>
            </div>
          </div>
        </div>

        {/* Navigation Content */}
        <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar" dir="rtl">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-4">{group.title}</h3>
              <div className="space-y-1">
                {group.links.map((link) => (
                  <Link 
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all group relative overflow-hidden ${
                      isActive(link.href) 
                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 ${
                      isActive(link.href) ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-indigo-50 group-hover:rotate-6'
                    }`}>
                      <link.icon className={`w-4 h-4 ${isActive(link.href) ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                    </div>
                    <span className={`text-sm tracking-tight ${isActive(link.href) ? 'font-black' : 'font-bold'}`}>{link.label}</span>
                    {isActive(link.href) && (
                       <div className="absolute top-0 right-0 w-1 h-full bg-white/30" />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-6 mt-auto border-t border-slate-50 bg-slate-50/50 space-y-3">
          <button className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-white border border-slate-100 text-slate-600 hover:text-slate-900 hover:shadow-md transition-all font-bold text-sm group">
            <Settings className="w-4 h-4 text-slate-400 group-hover:rotate-90 transition-transform duration-500" />
            <span>إعدادات المدرسة</span>
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all font-black text-sm group"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>تسجيل الخروج</span>
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
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 10px; }
      `}</style>
    </>
  );
}
