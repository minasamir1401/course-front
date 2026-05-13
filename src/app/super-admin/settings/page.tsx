"use client";

import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Settings, Save, Globe, Lock, Bell, 
  Database, Shield, Palette, Smartphone
} from "lucide-react";

export default function SuperAdminSettingsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-10 rtl" dir="rtl">
        {/* Premium Command Center Header */}
        <div className="relative bg-[#0f0f1d] rounded-[40px] p-12 overflow-hidden shadow-2xl border border-white/5">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-2xl shadow-slate-900/40 transform -rotate-6 transition-transform">
                 <Settings className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-black text-white tracking-tight mb-2">إعدادات النظام المركزية</h2>
                <p className="text-slate-400 text-lg font-medium max-w-md leading-relaxed">تخصيص الهوية، التحكم في التنبيهات، وإدارة المعايير التقنية للمنصة.</p>
              </div>
            </div>
            
            <button className="group bg-white text-[#0f0f1d] px-10 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-white/10 hover:scale-105 transition-all flex items-center gap-3">
              <Save className="w-6 h-6 text-slate-800" />
              حفظ الإعدادات
            </button>
          </div>
          
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-slate-600/10 blur-[120px] rounded-full"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-slate-800/10 blur-[120px] rounded-full"></div>
        </div>

        {/* Settings Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           {/* Navigation */}
           <div className="lg:col-span-1 space-y-4">
              {[
                { name: "الإعدادات العامة", icon: Globe, active: true },
                { name: "الهوية البصرية", icon: Palette },
                { name: "الحماية والخصوصية", icon: Shield },
                { name: "التنبيهات البريدية", icon: Bell },
                { name: "قاعدة البيانات", icon: Database },
              ].map((item) => (
                <button 
                  key={item.name}
                  className={`w-full flex items-center gap-4 p-6 rounded-[30px] font-black text-sm transition-all ${item.active ? 'bg-[#0f0f1d] text-white shadow-xl shadow-slate-900/20' : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'}`}
                >
                  <item.icon className={`w-6 h-6 ${item.active ? 'text-purple-400' : ''}`} />
                  {item.name}
                </button>
              ))}
           </div>

           {/* Content Area */}
           <div className="lg:col-span-2">
              <div className="bg-white p-12 rounded-[50px] border border-slate-100 shadow-sm space-y-10">
                 <section>
                    <h3 className="text-xl font-black text-slate-800 mb-8 border-b border-slate-50 pb-6">تخصيص المنصة</h3>
                    <div className="space-y-6">
                       <div className="flex flex-col gap-3">
                          <label className="text-sm font-bold text-slate-500">اسم المنصة (Brand Name)</label>
                          <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none font-bold" defaultValue="Secure LMS" />
                       </div>
                       <div className="flex flex-col gap-3">
                          <label className="text-sm font-bold text-slate-500">الرابط الرئيسي</label>
                          <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none font-bold text-slate-400" defaultValue="https://lms.platform.com" disabled />
                       </div>
                    </div>
                 </section>

                 <section>
                    <h3 className="text-xl font-black text-slate-800 mb-8 border-b border-slate-50 pb-6">تفضيلات النظام</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <label className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl cursor-pointer hover:bg-slate-100 transition-all">
                          <div className="flex items-center gap-4">
                             <Lock className="w-6 h-6 text-indigo-600" />
                             <span className="font-bold text-slate-700">تفعيل التسجيل التلقائي</span>
                          </div>
                          <input type="checkbox" className="w-6 h-6 accent-indigo-600" defaultChecked />
                       </label>
                       <label className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl cursor-pointer hover:bg-slate-100 transition-all">
                          <div className="flex items-center gap-4">
                             <Smartphone className="w-6 h-6 text-indigo-600" />
                             <span className="font-bold text-slate-700">تطبيق الهاتف</span>
                          </div>
                          <input type="checkbox" className="w-6 h-6 accent-indigo-600" defaultChecked />
                       </label>
                    </div>
                 </section>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
