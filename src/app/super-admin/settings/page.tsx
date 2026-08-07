"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Settings, Save, Globe, Lock, Bell, Database, Shield, Palette, Smartphone, Sparkles, Key } from 'lucide-react';
import { API_URL } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SuperAdminSettingsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { showToast } = useNotification();
  
  // States
  const [activeTab, setActiveTab] = useState<"general" | "visual" | "security" | "notifications" | "database">("general");
  const [user, setUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // General Platform Config States (Mockable/Saved in local storage)
  const [brandName, setBrandName] = useState("Klevro");
  const [allowAutoRegister, setAllowAutoRegister] = useState(true);
  const [enableMobileApp, setEnableMobileApp] = useState(true);

  // Security Credentials States
  const [securityData, setSecurityData] = useState({
    name: "",
    username: "",
    password: "",
    confirmPassword: ""
  });

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

    if (securityData.password && securityData.password !== securityData.confirmPassword) {
      showToast("كلمتا المرور غير متطابقتين!", "error");
      return;
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
          password: "",
          confirmPassword: ""
        }));

        showToast("تم تحديث بيانات الحساب والأمان بنجاح!", "success");
      } else {
        showToast(data.error || "فشل تحديث البيانات.", "error");
      }
    } catch (error) {
      showToast("حدث خطأ في الاتصال بالخادم.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mock Save for General Settings
  const handleGeneralSave = () => {
    showToast(language === 'ar' ? "تم حفظ إعدادات النظام المركزية بنجاح!" : "Central system settings saved successfully!", "success");
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-10 rtl text-slate-800" dir="rtl">
        
        {/* Premium Command Center Header */}
        <div className="relative bg-[#0f0f1d] rounded-[40px] p-12 overflow-hidden shadow-2xl border border-white/5">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-2xl shadow-indigo-900/40 transform -rotate-6 transition-transform">
                 <Settings className="w-10 h-10 text-white" />
              </div>
              <div className="text-right">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">{language === 'ar' ? "إعدادات النظام المركزية" : "Central System Settings"}</h2>
                <p className="text-slate-400 text-sm md:text-lg font-medium max-w-md leading-relaxed">{language === 'ar' ? "تخصيص الهوية، حماية الحساب، وإدارة الإعدادات التقنية للمنصة." : "Customize identity, account protection, and technical settings."}</p>
              </div>
            </div>
            
            {activeTab === "general" && (
              <button 
                onClick={handleGeneralSave}
                className="group bg-white text-[#0f0f1d] px-10 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-white/5 hover:scale-105 transition-all flex items-center gap-3"
              >
                <Save className="w-6 h-6 text-slate-800" />
                {language === 'ar' ? "حفظ الإعدادات" : "Save Settings"}
              </button>
            )}
          </div>
          
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-800/10 blur-[120px] rounded-full"></div>
        </div>

        {/* Settings Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           
           {/* Navigation Sidebar */}
           <div className="lg:col-span-1 space-y-4">
              {[
                { id: "general", name: language === 'ar' ? "الإعدادات العامة" : "General Settings", icon: Globe },
                { id: "visual", name: language === 'ar' ? "الهوية البصرية" : "Visual Identity", icon: Palette },
                { id: "security", name: language === 'ar' ? "الحماية والخصوصية" : "Security & Privacy", icon: Shield },
                { id: "notifications", name: language === 'ar' ? "التنبيهات البريدية" : "Email Notifications", icon: Bell },
                { id: "database", name: language === 'ar' ? "قاعدة البيانات" : "Database", icon: Database },
              ].map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-4 p-6 rounded-[30px] font-black text-sm transition-all border ${
                    activeTab === item.id 
                      ? 'bg-[#0f0f1d] text-white shadow-xl shadow-slate-900/20 border-transparent' 
                      : 'bg-white text-slate-400 hover:bg-slate-50 border-slate-100'
                  }`}
                >
                  <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'text-indigo-400' : 'text-slate-400'}`} />
                  {item.name}
                </button>
              ))}
           </div>

           {/* Content Area */}
           <div className="lg:col-span-2">
              <div className="bg-white p-8 md:p-12 rounded-[40px] md:rounded-[50px] border border-slate-100 shadow-sm">
                 
                 {/* TAB 1: General Settings */}
                 {activeTab === "general" && (
                   <div className="space-y-10">
                     <section className="text-right">
                        <h3 className="text-xl font-black text-slate-800 mb-8 border-b border-slate-50 pb-6 flex items-center gap-2">
                          <Globe className="w-6 h-6 text-indigo-500" />
                          {language === 'ar' ? "تخصيص المنصة العامة" : "Platform Customization"}
                        </h3>
                        <div className="space-y-6">
                           <div className="flex flex-col gap-3">
                              <label className="text-sm font-bold text-slate-500">{language === 'ar' ? "اسم المنصة (Brand Name)" : "Brand Name"}</label>
                              <input 
                                type="text" 
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none font-bold text-slate-800 focus:border-indigo-500 transition-colors" 
                                value={brandName} 
                                onChange={(e) => setBrandName(e.target.value)}
                              />
                           </div>
                           <div className="flex flex-col gap-3">
                              <label className="text-sm font-bold text-slate-500">{language === 'ar' ? "الرابط الرئيسي للمنصة" : "Platform URL"}</label>
                              <input 
                                type="text" 
                                className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-6 py-4 outline-none font-bold text-slate-400 cursor-not-allowed" 
                                value="https://mina.red-gate.tech" 
                                disabled 
                              />
                           </div>
                        </div>
                     </section>

                     <section className="text-right">
                        <h3 className="text-xl font-black text-slate-800 mb-8 border-b border-slate-50 pb-6">{language === 'ar' ? "تفضيلات النظام الافتراضية" : "System Defaults"}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <label className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl cursor-pointer hover:bg-slate-100/70 transition-all border border-transparent hover:border-slate-100">
                              <div className="flex items-center gap-4">
                                 <Lock className="w-6 h-6 text-indigo-600" />
                                 <span className="font-bold text-slate-700">{language === 'ar' ? "تفعيل التسجيل التلقائي" : "Enable Auto Register"}</span>
                              </div>
                              <input 
                                type="checkbox" 
                                className="w-6 h-6 accent-indigo-600 rounded-lg" 
                                checked={allowAutoRegister} 
                                onChange={(e) => setAllowAutoRegister(e.target.checked)}
                              />
                           </label>
                           <label className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl cursor-pointer hover:bg-slate-100/70 transition-all border border-transparent hover:border-slate-100">
                              <div className="flex items-center gap-4">
                                 <Smartphone className="w-6 h-6 text-indigo-600" />
                                 <span className="font-bold text-slate-700">{language === 'ar' ? "تفعيل تطبيق الهاتف" : "Enable Mobile App"}</span>
                              </div>

                              <input 
                                type="checkbox" 
                                className="w-6 h-6 accent-indigo-600 rounded-lg" 
                                checked={enableMobileApp} 
                                onChange={(e) => setEnableMobileApp(e.target.checked)}
                              />
                           </label>
                        </div>
                     </section>
                   </div>
                 )}

                 {/* TAB 2: Visual Identity */}
                 {activeTab === "visual" && (
                   <div className="space-y-6 text-right">
                      <h3 className="text-xl font-black text-slate-800 mb-8 border-b border-slate-50 pb-6 flex items-center gap-2">
                        <Palette className="w-6 h-6 text-indigo-500" />
                        {language === 'ar' ? "الهوية البصرية للمنصة" : "Visual Identity"}
                      </h3>
                      <p className="text-slate-400 font-medium">{language === 'ar' ? "سيتم ربط حزم تخصيص الألوان الافتراضية والشعار قريباً مع روتين Dokploy لتهيئة مظهر مخصص لكل عميل." : "Default color themes and logos will soon be connected with Dokploy routine to setup a custom look for each client."}</p>
                      <div className="grid grid-cols-3 gap-4 mt-6">
                        {["#4f46e5", "#059669", "#dc2626"].map((color) => (
                          <div key={color} className="p-6 rounded-3xl border border-slate-100 flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full border border-slate-200" style={{ backgroundColor: color }}></div>
                            <span className="text-xs font-mono font-bold text-slate-500 uppercase">{color}</span>
                          </div>
                        ))}
                      </div>
                   </div>
                 )}

                 {/* TAB 3: Security & Privacy (SUPER ADMIN CREDENTIALS EDITOR) */}
                 {activeTab === "security" && (
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
                            {/* Password Input */}
                            <div className="flex flex-col gap-3">
                               <label className="text-sm font-bold text-slate-500">{language === 'ar' ? "كلمة المرور الجديدة" : "New Password"}</label>
                               <div className="relative">
                                 <input 
                                   type="password" 
                                   className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-12 pl-6 py-4 outline-none font-bold text-slate-800 focus:border-indigo-500 transition-colors text-center font-mono"
                                   placeholder={language === 'ar' ? "اتركها فارغة لإبقائها كما هي" : "Leave blank to keep unchanged"}
                                   value={securityData.password}
                                   onChange={e => setSecurityData({ ...securityData, password: e.target.value })}
                                 />
                                 <Key className="w-5 h-5 text-slate-400 absolute right-4 top-4" />
                               </div>
                            </div>

                            {/* Confirm Password Input */}
                            <div className="flex flex-col gap-3">
                               <label className="text-sm font-bold text-slate-500">{language === 'ar' ? "تأكيد كلمة المرور" : "Confirm Password"}</label>
                               <div className="relative">
                                 <input 
                                   type="password" 
                                   className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-12 pl-6 py-4 outline-none font-bold text-slate-800 focus:border-indigo-500 transition-colors text-center font-mono"
                                   placeholder={language === 'ar' ? "تأكيد كلمة المرور" : "Confirm password"}
                                   value={securityData.confirmPassword}
                                   onChange={e => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                                 />
                                 <Key className="w-5 h-5 text-slate-400 absolute right-4 top-4" />
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
                 )}

                 {/* TAB 4: Email Notifications */}
                 {activeTab === "notifications" && (
                   <div className="space-y-6 text-right">
                      <h3 className="text-xl font-black text-slate-800 mb-8 border-b border-slate-50 pb-6 flex items-center gap-2">
                        <Bell className="w-6 h-6 text-indigo-500" />
                        {language === 'ar' ? "التنبيهات البريدية والإشعارات" : "Email Notifications & Alerts"}
                      </h3>
                      <p className="text-slate-400 font-medium">{language === 'ar' ? "إرسال التنبيهات البريدية التلقائية لأولياء الأمور والطلاب متصلة بنظام مهام Cron الخاص بالمنصة." : "Send automatic email notifications to parents and students connected to the platform's Cron task system."}</p>
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between mt-4">
                        <span className="font-bold text-slate-700">{language === 'ar' ? "تنبيه بالبريد الإلكتروني عند إضافة امتحان جديد" : "Email alert when a new exam is added"}</span>
                        <input type="checkbox" className="w-6 h-6 accent-indigo-600" defaultChecked />
                      </div>
                   </div>
                 )}

                 {/* TAB 5: Database Settings */}
                 {activeTab === "database" && (
                   <div className="space-y-6 text-right">
                      <h3 className="text-xl font-black text-slate-800 mb-8 border-b border-slate-50 pb-6 flex items-center gap-2">
                        <Database className="w-6 h-6 text-indigo-500" />
                        {language === 'ar' ? "إدارة قواعد البيانات والصيانة" : "Database Management & Maintenance"}
                      </h3>
                      <p className="text-slate-400 font-medium">{language === 'ar' ? "إجراء النسخ الاحتياطي التلقائي وفحص الجداول وتحديث الهياكل عبر Prisma." : "Perform automatic backups, check tables, and update schemas via Prisma."}</p>
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 font-mono text-xs text-slate-500 mt-4 leading-relaxed">
                        DATABASE_STATUS: Connected<br />
                        DIALECT: PostgreSQL<br />
                        MIGRATIONS_APPLIED: db push clean boot
                      </div>
                   </div>
                 )}

              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
