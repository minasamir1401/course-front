"use client";

import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Mail } from "lucide-react";

export default function MessagesPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              الرسائل
            </h2>
            <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
              <span>الرئيسية</span> <span className="text-slate-300">/</span> <span>الرسائل</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-primary">
            <Mail className="w-6 h-6" />
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
            <Mail className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">صفحة الرسائل قيد التطوير</h3>
          <p className="text-slate-500 max-w-md">نحن نعمل على تجهيز هذه الصفحة بكامل المميزات قريباً.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
