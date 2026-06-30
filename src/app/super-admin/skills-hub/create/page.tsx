"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL } from '@/lib/api';
import { useNotification } from "@/context/NotificationContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  ArrowLeft, Save, BookOpen, Layers, Target, CheckCircle2, AlertCircle
} from "lucide-react";

export default function CreateSkillClusterPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useNotification();
  const schoolIdParam = searchParams.get('schoolId');

  const [isLoading, setIsLoading] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  const [clusterData, setClusterData] = useState({
    name: "",
    description: "",
    subject: "",
    grade: "",
    isCentral: !schoolIdParam,
    schoolId: schoolIdParam || ""
  });

  const GRADES = [
    "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي",
    "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
    "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
  ];

  const SUBJECTS = [
    "اللغة العربية", "اللغة الإنجليزية", "اللغة الفرنسية", "اللغة الألمانية", "اللغة الإيطالية",
    "الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "الجيولوجيا", "الميكانيكا",
    "التاريخ", "الجغرافيا", "الفلسفة", "علم النفس", "الاقتصاد", "الإحصاء",
    "التربية الدينية", "التربية الوطنية", "الحاسب الآلي",
    "SAT Math", "SAT English"
  ];

  useEffect(() => {
    const token = localStorage.getItem("super_admin_token");
    if (!token) {
      router.push("/super-admin/login");
      return;
    }
    
    // Check if user is SUPER_ADMIN
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setIsSuperAdmin(payload.role === 'SUPER_ADMIN');
    } catch (e) {
      console.error("Invalid token");
    }

    fetchSchools(token);
  }, []);

  const fetchSchools = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/schools`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 400 || res.status === 401) {
        localStorage.removeItem("super_admin_token");
        router.push("/super-admin/login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setSchools(Array.isArray(data) ? data : (data.schools || []));
      }
    } catch (error) {
      console.error("Failed to fetch schools");
    }
  };

  const handleSaveCluster = async () => {
    if (!clusterData.name || !clusterData.subject || !clusterData.grade) {
      showToast(language === 'ar' ? "يرجى تعبئة كافة الحقول الإلزامية." : "Please fill all required fields.", "error");
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem("super_admin_token");
      const res = await fetch(`${API_URL}/skills-hub/clusters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...clusterData,
          schoolId: clusterData.isCentral ? null : clusterData.schoolId
        })
      });

      if (!res.ok) {
        throw new Error("Failed to create skill cluster");
      }

      const data = await res.json();
      showToast(language === 'ar' ? "تم إنشاء المحور المهاراتي بنجاح!" : "Skill Cluster created successfully!", "success");
      
      // Redirect to edit page to add lessons
      router.push(`/super-admin/skills-hub/edit?id=${data.cluster.id}`);
      
    } catch (error) {
      console.error(error);
      showToast(language === 'ar' ? "حدث خطأ أثناء حفظ البيانات." : "Error saving data.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-10" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Header Section */}
        <div className="relative bg-white rounded-[20px] sm:rounded-[50px] p-4 sm:p-12 overflow-hidden shadow-sm border border-slate-100">
           <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-6 sm:gap-10">
              <div className={`flex flex-col sm:flex-row items-center gap-4 sm:gap-8 ${language === 'ar' ? 'text-right sm:items-start' : 'text-left sm:items-start'}`}>
                 <button 
                   onClick={() => router.back()}
                   className="w-10 h-10 sm:w-14 h-14 bg-slate-50 text-slate-500 hover:text-slate-900 rounded-full flex items-center justify-center transition-all shrink-0 hover:bg-slate-100"
                 >
                   <ArrowLeft className={`w-5 h-5 sm:w-6 h-6 ${language === 'ar' ? 'rotate-180' : ''}`} />
                 </button>
                 <div className="w-12 h-12 sm:w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl sm:rounded-[35px] flex items-center justify-center shadow-xl sm:shadow-2xl shadow-amber-500/20 transform -rotate-3 shrink-0">
                    <Layers className="w-6 h-6 sm:w-12 h-12 text-white" />
                 </div>
                 <div>
                    <h1 className="text-lg sm:text-4xl font-black text-slate-900 mb-1 sm:mb-3 tracking-tight">
                       {language === 'ar' ? "إنشاء محور مهاراتي" : "Create Skill Cluster"}
                    </h1>
                    <p className="text-slate-500 text-[10px] sm:text-lg font-medium max-w-xl leading-relaxed opacity-80">
                       {language === 'ar' ? "أدخل البيانات الأساسية للمحور للبدء في إضافة الدروس والأنشطة." : "Enter basic cluster details to start adding lessons and activities."}
                    </p>
                 </div>
              </div>

              <button 
                onClick={handleSaveCluster}
                disabled={isLoading}
                className="group bg-slate-900 text-white px-6 sm:px-12 py-3 sm:py-5 rounded-xl sm:rounded-[22px] font-black text-xs sm:text-xl shadow-xl shadow-slate-900/10 hover:scale-105 transition-all flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center disabled:opacity-50 disabled:hover:scale-100"
              >
                {isLoading ? (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4 sm:w-6 h-6 group-hover:-translate-y-1 transition-transform" />
                )}
                {language === 'ar' ? "حفظ ومتابعة" : "Save & Continue"}
              </button>
           </div>
           <div className="absolute top-0 right-0 w-1/3 h-full bg-amber-500/5 blur-[120px] rounded-full -mr-20"></div>
        </div>

        <div className="bg-white rounded-[24px] sm:rounded-[40px] border border-slate-100 shadow-sm overflow-hidden p-6 sm:p-10">
           <div className="space-y-8 max-w-4xl">
              
              {/* Cluster Name */}
              <div className="space-y-3">
                 <label className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    {language === 'ar' ? "اسم المحور المهاراتي" : "Cluster Name"}
                    <span className="text-red-500">*</span>
                 </label>
                 <input 
                   type="text"
                   value={clusterData.name}
                   onChange={(e) => setClusterData({ ...clusterData, name: e.target.value })}
                   placeholder={language === 'ar' ? "مثال: مهارات الفهم والاستيعاب" : "e.g. Reading Comprehension Skills"}
                   className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
                 />
              </div>

              {/* Description */}
              <div className="space-y-3">
                 <label className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    {language === 'ar' ? "الوصف" : "Description"}
                 </label>
                 <textarea 
                   value={clusterData.description}
                   onChange={(e) => setClusterData({ ...clusterData, description: e.target.value })}
                   placeholder={language === 'ar' ? "وصف مختصر للمحور..." : "Short description..."}
                   rows={3}
                   className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white transition-all outline-none font-bold text-slate-700 resize-none"
                 />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Grade Selection */}
                 <div className="space-y-3">
                    <label className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       {language === 'ar' ? "المرحلة / الصف الدراسي" : "Grade"}
                       <span className="text-red-500">*</span>
                    </label>
                    <select 
                      value={clusterData.grade}
                      onChange={(e) => setClusterData({ ...clusterData, grade: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white transition-all outline-none font-bold text-slate-700 appearance-none"
                    >
                       <option value="">{language === 'ar' ? "اختر الصف الدراسي..." : "Select Grade..."}</option>
                       {GRADES.map(grade => (
                         <option key={grade} value={grade}>{grade}</option>
                       ))}
                    </select>
                 </div>

                 {/* Subject Selection */}
                 <div className="space-y-3">
                    <label className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       {language === 'ar' ? "المادة الدراسية" : "Subject"}
                       <span className="text-red-500">*</span>
                    </label>
                    <select 
                      value={clusterData.subject}
                      onChange={(e) => setClusterData({ ...clusterData, subject: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white transition-all outline-none font-bold text-slate-700 appearance-none"
                    >
                       <option value="">{language === 'ar' ? "اختر المادة..." : "Select Subject..."}</option>
                       {SUBJECTS.map(subject => (
                         <option key={subject} value={subject}>{subject}</option>
                       ))}
                    </select>
                 </div>
              </div>

              {/* Visibility & School (Only for Super Admin) */}
              {isSuperAdmin && (
                <div className="pt-6 border-t border-slate-100 space-y-6">
                   <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-200">
                      <div>
                         <h4 className="font-black text-slate-900">{language === 'ar' ? "نشر كـ محور مركزي" : "Publish as Central Cluster"}</h4>
                         <p className="text-sm font-bold text-slate-500 mt-1">{language === 'ar' ? "متاح لجميع المدارس، أو لمدارس محددة فقط." : "Available to all schools, or restrict to specific schools."}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input 
                          type="checkbox" 
                          checked={clusterData.isCentral}
                          onChange={(e) => setClusterData({ ...clusterData, isCentral: e.target.checked, schoolId: e.target.checked ? "" : clusterData.schoolId })}
                          className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                   </div>
                   
                   {!clusterData.isCentral && (
                     <div className="space-y-3 p-6 bg-amber-50/50 rounded-2xl border border-amber-100">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                           {language === 'ar' ? "تخصيص لمدرسة محددة" : "Assign to School"}
                           <span className="text-red-500">*</span>
                        </label>
                        <select 
                          value={clusterData.schoolId}
                          onChange={(e) => setClusterData({ ...clusterData, schoolId: e.target.value })}
                          className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-transparent focus:border-amber-500 transition-all outline-none font-bold text-slate-700 appearance-none"
                        >
                           <option value="">{language === 'ar' ? "اختر المدرسة..." : "Select School..."}</option>
                           {schools.map(s => (
                             <option key={s.id} value={s.id}>{s.name}</option>
                           ))}
                        </select>
                     </div>
                   )}
                </div>
              )}

           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
