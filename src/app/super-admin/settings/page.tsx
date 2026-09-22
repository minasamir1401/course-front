"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Shield, Sparkles, Key, Eye, EyeOff, Settings, Lock, Unlock, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
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

  // System Deletion Policy States
  const [allowContentDeletion, setAllowContentDeletion] = useState<boolean>(false);
  const [isLoadingPolicy, setIsLoadingPolicy] = useState<boolean>(true);
  const [isUpdatingPolicy, setIsUpdatingPolicy] = useState<boolean>(false);

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

  // Load user data and deletion policy on mount
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

    // Fetch system deletion policy
    const fetchPolicy = async () => {
      try {
        setIsLoadingPolicy(true);
        const headers: Record<string, string> = {};
        if (token && token !== "cookie_auth") {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(`${API_URL}/system/settings/deletion-policy`, {
          method: "GET",
          headers,
          credentials: "include"
        });
        if (res.ok) {
          const data = await res.json();
          setAllowContentDeletion(Boolean(data.allowContentDeletion));
        }
      } catch (err) {
        console.error("Failed to load deletion policy:", err);
      } finally {
        setIsLoadingPolicy(false);
      }
    };

    fetchPolicy();
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

  // Handle System Deletion Policy Toggle
  const handleToggleDeletionPolicy = async (newValue: boolean) => {
    const previous = allowContentDeletion;
    setAllowContentDeletion(newValue);
    setIsUpdatingPolicy(true);

    try {
      const token = localStorage.getItem("super_admin_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (token && token !== "cookie_auth") {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/system/settings/deletion-policy`, {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify({ allowContentDeletion: newValue })
      });

      if (res.ok) {
        const data = await res.json();
        setAllowContentDeletion(Boolean(data.allowContentDeletion));
        showToast(
          language === 'ar'
            ? (newValue
                ? "تم تفعيل السماح بحذف المحتوى والأسئلة لجميع المدارس والمعلمين بنجاح."
                : "تم قفل الحذف بنجاح. الحذف مقتصر الآن حصرا على الإدارة العامة.")
            : (newValue
                ? "Content deletion enabled for school admins and teachers."
                : "Content deletion locked. Only Super Admin can delete."),
          "success"
        );
      } else {
        const errData = await res.json().catch(() => ({}));
        setAllowContentDeletion(previous);
        showToast(errData.error || (language === 'ar' ? "فشل تحديث سياسة الحذف." : "Failed to update deletion policy."), "error");
      }
    } catch (err) {
      setAllowContentDeletion(previous);
      showToast(language === 'ar' ? "حدث خطأ في الاتصال بالخادم." : "Connection error.", "error");
    } finally {
      setIsUpdatingPolicy(false);
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
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">{language === 'ar' ? "إعدادات النظام والأمان" : "System & Security Settings"}</h2>
                <p className="text-slate-400 text-sm md:text-lg font-medium max-w-md leading-relaxed">{language === 'ar' ? "التحكم في سياسات الحذف وحماية حساب المدير العام." : "Control deletion policies and manage super admin credentials."}</p>
              </div>
            </div>
          </div>
          
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-800/10 blur-[120px] rounded-full"></div>
        </div>

        {/* Content Area */}
        <div className="w-full max-w-4xl mx-auto space-y-8">

          {/* System Deletion Policy Card */}
          <div className="bg-white p-8 md:p-12 rounded-[40px] md:rounded-[50px] border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                  allowContentDeletion ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {allowContentDeletion ? <Unlock className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black text-slate-800">
                      {language === 'ar' ? "سياسة صلاحيات حذف المحتوى والأسئلة" : "Content & Question Deletion Policy"}
                    </h3>
                    {isLoadingPolicy && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
                  </div>
                  <p className="text-xs text-slate-500 font-bold mt-1 max-w-xl leading-relaxed">
                    {language === 'ar'
                      ? "التحكم المركزي في إمكانية قيام مدراء المدارس والمعلمين بحذف الأسئلة والدروس والدورات عبر المنصة."
                      : "Central control over whether school admins and teachers can delete questions, lessons, and courses."}
                  </p>
                </div>
              </div>

              {/* Interactive Toggle Switch */}
              <div className="flex items-center gap-4 self-end md:self-center">
                <span className={`text-xs font-black px-3 py-1.5 rounded-full transition-colors ${
                  allowContentDeletion
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {allowContentDeletion
                    ? (language === 'ar' ? "الحذف مسموح للجميع" : "Deletion Allowed")
                    : (language === 'ar' ? "الحذف مقفل (محمي)" : "Deletion Locked")}
                </span>

                <div dir="ltr">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={allowContentDeletion}
                    disabled={isLoadingPolicy || isUpdatingPolicy}
                    onClick={() => handleToggleDeletionPolicy(!allowContentDeletion)}
                    className={`relative inline-flex h-9 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 ${
                      allowContentDeletion ? 'bg-amber-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-8 w-8 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                        allowContentDeletion ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    >
                      {isUpdatingPolicy ? (
                        <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                      ) : allowContentDeletion ? (
                        <Trash2 className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Lock className="w-4 h-4 text-slate-500" />
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Explanatory Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className={`p-5 rounded-2xl border transition-all ${
                !allowContentDeletion ? 'bg-emerald-50/50 border-emerald-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'
              }`}>
                <div className="flex items-center gap-2.5 mb-2 font-black text-xs text-emerald-800">
                  <Lock className="w-4 h-4" />
                  <span>{language === 'ar' ? "الوضع الافتراضي (الحذف مقفل ومحمي)" : "Default Mode (Deletion Protected)"}</span>
                </div>
                <p className="text-xs text-slate-600 font-bold leading-relaxed">
                  {language === 'ar'
                    ? "يمنع مدراء المدارس والمعلمين من حذف أي سؤال أو درس أو دورة لحماية بنك الأسئلة والبيانات من الحذف العرضي أو غير المصرح به. الحذف متاح فقط للمدير العام."
                    : "Prevents school admins and teachers from deleting questions, lessons, or courses. Deletion is restricted to Super Admin."}
                </p>
              </div>

              <div className={`p-5 rounded-2xl border transition-all ${
                allowContentDeletion ? 'bg-amber-50/60 border-amber-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'
              }`}>
                <div className="flex items-center gap-2.5 mb-2 font-black text-xs text-amber-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{language === 'ar' ? "وضع السماح بالحذف (مفتوح)" : "Deletion Enabled Mode (Open)"}</span>
                </div>
                <p className="text-xs text-slate-600 font-bold leading-relaxed">
                  {language === 'ar'
                    ? "يسمح لمدراء المدارس والمعلمين بحذف الأسئلة والدروس والدورات التابعة لمدارسهم. يوصى بتفعيله مؤقتا عند الحاجة فقط ثم إعادة قفله."
                    : "Allows school admins and teachers to delete questions, lessons, and courses belonging to their schools."}
                </p>
              </div>
            </div>
          </div>

          {/* Account & Security Card */}
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
