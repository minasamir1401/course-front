"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Shield, Sparkles, Key, Eye, EyeOff, Settings } from 'lucide-react';
import { API_URL } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SuperAdminSettingsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { showToast } = useNotification();
  
  // States
  const [user, setUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Security Credentials States
  const [securityData, setSecurityData] = useState({
    name: "",
    username: "",
    oldPassword: "",
    password: "",
    confirmPassword: ""
  });

  // Password Visibility States
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Load user data on mount
  useEffect(() => {
    const token = localStorage.getItem("super_admin_token");
    if (!token) {
      router.push("/super-admin/login");
      return;
    }

    const userStr = localStorage.getItem("super_admin_user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setUser(parsed);
        setSecurityData({
          name: parsed.name || "",
          username: parsed.username || "",
          oldPassword: "",
          password: "",
          confirmPassword: ""
        });
      } catch (e) {
        console.error("Failed to parse super admin user:", e);
      }
    }
  }, [router]);

  // Handle Security Form Submission
  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (securityData.password || securityData.oldPassword) {
      if (!securityData.oldPassword) {
        showToast(language === 'ar' ? "يرجى إدخال كلمة المرور الحالية." : "Please enter your current password.", "error");
        return;
      }
      if (!securityData.password) {
        showToast(language === 'ar' ? "يرجى إدخال كلمة المرور الجديدة." : "Please enter the new password.", "error");
        return;
      }
      if (securityData.password !== securityData.confirmPassword) {
        showToast(language === 'ar' ? "كلمتا المرور غير متطابقتين!" : "Passwords do not match!", "error");
        return;
      }
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("super_admin_token");

    try {
      const payload: any = {
        name: securityData.name,
        username: securityData.username,
        role: "SUPER_ADMIN"
      };

      if (securityData.password) {
        payload.oldPassword = securityData.oldPassword;
        payload.password = securityData.password;
      }

      const res = await fetch(`${API_URL}/admin/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        // Update user in localStorage
        const updatedUser = {
          ...user,
          name: securityData.name,
          username: securityData.username
        };
        localStorage.setItem("super_admin_user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        // Reset password fields
        setSecurityData(prev => ({
          ...prev,
          oldPassword: "",
          password: "",
          confirmPassword: ""
        }));

        showToast(language === 'ar' ? "تم تحديث بيانات الحساب والأمان بنجاح!" : "Account security updated successfully!", "success");
      } else {
        showToast(data.error || (language === 'ar' ? "فشل تحديث البيانات." : "Update failed."), "error");
      }
    } catch (error) {
      showToast(language === 'ar' ? "حدث خطأ في الاتصال بالخادم." : "Connection error.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-10 rtl text-slate-800" dir="rtl">
        
        {/* Premium Command Center Header */}
        <div className="relative bg-[#0f0f1d] rounded-[40px] p-12 overflow-hidden shadow-2xl border border-white/5">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-2xl shadow-indigo-900/40 transform -rotate-6 transition-transform">
                 <Shield className="w-10 h-10 text-white" />
              </div>
              <div className="text-right">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">{language === 'ar' ? "إعدادات الحساب والأمان" : "Account & Security"}</h2>
                <p className="text-slate-400 text-sm md:text-lg font-medium max-w-md leading-relaxed">{language === 'ar' ? "حماية حساب المدير العام وتعديل بيانات تسجيل الدخول." : "Protect super admin account and edit login credentials."}</p>
              </div>
            </div>
          </div>
          
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-800/10 blur-[120px] rounded-full"></div>
        </div>

        {/* Content Area */}
        <div className="w-full max-w-4xl mx-auto">
          <div className="bg-white p-8 md:p-12 rounded-[40px] md:rounded-[50px] border border-slate-100 shadow-sm">
             <form onSubmit={handleSecuritySubmit} className="space-y-8 text-right">
                <h3 className="text-xl font-black text-slate-800 mb-2 border-b border-slate-50 pb-6 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-indigo-500" />
                  {language === 'ar' ? "تعديل بيانات الحساب والأمان" : "Edit Account & Security"}
                </h3>
                <p className="text-xs text-slate-400 font-bold mb-6">{language === 'ar' ? "تحديث بيانات تسجيل دخول المدير العام للنظام. كلمة المرور والاسم واسم المستخدم." : "Update Super Admin login credentials. Password, Name, and Username."}</p>

                <div className="space-y-6">
                   {/* Name Input */}
                   <div className="flex flex-col gap-3">
                       <label className="text-sm font-bold text-slate-500">{language === 'ar' ? "الاسم الكامل (Display Name)" : "Display Name"}</label>
                       <input 
                         type="text" 
                         required
                         className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none font-bold text-slate-800 focus:border-indigo-500 transition-colors"
                         placeholder={language === 'ar' ? "أدخل الاسم الكامل" : "Enter full name"}
                        value={securityData.name}
                        onChange={e => setSecurityData({ ...securityData, name: e.target.value })}
                      />
                   </div>

                   {/* Username Input */}
                   <div className="flex flex-col gap-3">
                       <label className="text-sm font-bold text-slate-500">{language === 'ar' ? "اسم المستخدم (Username)" : "Username"}</label>
                       <input 
                         type="text" 
                         required
                         className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none font-bold text-slate-800 focus:border-indigo-500 transition-colors text-center font-mono"
                         placeholder="superadmin"
                        dir="ltr"
                        value={securityData.username}
                        onChange={e => setSecurityData({ ...securityData, username: e.target.value })}
                      />
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                      
                      {/* Old Password Input (Full width in grid) */}
                      <div className="flex flex-col gap-3 md:col-span-2">
                         <label className="text-sm font-bold text-slate-500">{language === 'ar' ? "كلمة المرور الحالية" : "Current Password"}</label>
                         <div className="relative">
                           <input 
                             type={showOldPassword ? "text" : "password"} 
                             autoComplete="new-password"
                             className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-12 pl-12 py-4 outline-none font-bold text-slate-800 focus:border-indigo-500 transition-colors text-center font-mono"
                             placeholder={language === 'ar' ? "مطلوبة فقط في حال تغيير كلمة المرور" : "Required only when changing password"}
                             value={securityData.oldPassword}
                             onChange={e => setSecurityData({ ...securityData, oldPassword: e.target.value })}
                           />
                           <Key className="w-5 h-5 text-slate-400 absolute right-4 top-4" />
                           <button 
                              type="button" 
                              onClick={() => setShowOldPassword(!showOldPassword)}
                              className="absolute left-4 top-4 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                           >
                             {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                           </button>
                         </div>
                      </div>

                      {/* Password Input */}
                      <div className="flex flex-col gap-3">
                         <label className="text-sm font-bold text-slate-500">{language === 'ar' ? "كلمة المرور الجديدة" : "New Password"}</label>
                         <div className="relative">
                           <input 
                             type={showPassword ? "text" : "password"} 
                             autoComplete="new-password"
                             className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-12 pl-12 py-4 outline-none font-bold text-slate-800 focus:border-indigo-500 transition-colors text-center font-mono"
                             placeholder={language === 'ar' ? "اتركها فارغة لإبقائها كما هي" : "Leave blank to keep unchanged"}
                             value={securityData.password}
                             onChange={e => setSecurityData({ ...securityData, password: e.target.value })}
                           />
                           <Key className="w-5 h-5 text-slate-400 absolute right-4 top-4" />
                           <button 
                              type="button" 
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute left-4 top-4 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                           >
                             {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                           </button>
                         </div>
                      </div>

                      {/* Confirm Password Input */}
                      <div className="flex flex-col gap-3">
                         <label className="text-sm font-bold text-slate-500">{language === 'ar' ? "تأكيد كلمة المرور" : "Confirm Password"}</label>
                         <div className="relative">
                           <input 
                             type={showConfirmPassword ? "text" : "password"} 
                             autoComplete="new-password"
                             className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-12 pl-12 py-4 outline-none font-bold text-slate-800 focus:border-indigo-500 transition-colors text-center font-mono"
                             placeholder={language === 'ar' ? "تأكيد كلمة المرور" : "Confirm password"}
                             value={securityData.confirmPassword}
                             onChange={e => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                           />
                           <Key className="w-5 h-5 text-slate-400 absolute right-4 top-4" />
                           <button 
                              type="button" 
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute left-4 top-4 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                           >
                             {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                           </button>
                         </div>
                      </div>
                   </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-xl"
                >
                  {isSubmitting ? (language === 'ar' ? "جاري الحفظ..." : "Saving...") : (language === 'ar' ? "حفظ تغييرات الحساب" : "Save Account Changes")}
                  <Sparkles className="w-5 h-5" />
                </button>
             </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
