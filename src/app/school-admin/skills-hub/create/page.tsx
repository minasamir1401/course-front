"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from '@/lib/api';
import { useNotification } from "@/context/NotificationContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  ArrowLeft, Save, Layers
} from "lucide-react";

export default function CreateSchoolSkillClusterPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const { showToast } = useNotification();

  const [isLoading, setIsLoading] = useState(false);
  
  const [clusterData, setClusterData] = useState({
    name: "",
    description: "",
    subject: "",
    grade: "",
    isCentral: false,
    schoolId: ""
  });

  const GRADES = [
    "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي",
    "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
    "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
  ];

  const SUBJECTS = [
    "اللغة العربية", "القراءة", "اللغة الإنجليزية", "اللغة الفرنسية", "اللغة الألمانية", "اللغة الإيطالية",
    "الرياضيات", "العلوم", "الفيزياء", "الكيمياء", "الأحياء", "الجيولوجيا", "الميكانيكا",
    "التاريخ", "الجغرافيا", "الفلسفة", "علم النفس", "الاقتصاد", "الإحصاء",
    "التربية الدينية", "التربية الوطنية", "الحاسب الآلي",
    "SAT Math", "SAT English"
  ];

  const isGrade123 = (grade: string) => [
    "الصف الأول الابتدائي",
    "الصف الثاني الابتدائي",
    "الصف الثالث الابتدائي"
  ].includes(grade);

  useEffect(() => {
    const token = localStorage.getItem("school_admin_token");
    if (!token) {
      router.push("/school-admin/login");
    }
  }, [router]);

  const handleSaveCluster = async () => {
    if (!clusterData.name || !clusterData.subject || !clusterData.grade) {
      showToast(language === 'ar' ? "يرجى تعبئة كافة الحقول الإلزامية." : "Please fill all required fields.", "error");
      return;
    }

    if (clusterData.subject === "العلوم" && isGrade123(clusterData.grade)) {
      showToast(
        language === 'ar' 
          ? "مادة العلوم غير متاحة للصفوف الأول والثاني والثالث الابتدائي." 
          : "Science is not available for Grade 1, 2, and 3 Primary.", 
        "error"
      );
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem("school_admin_token");
      const res = await fetch(`${API_URL}/skills-hub/clusters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...clusterData,
          isCentral: false
        })
      });

      if (!res.ok) {
        throw new Error("Failed to create skill cluster");
      }

      const data = await res.json();
      showToast(language === 'ar' ? "تم إنشاء المحور المهاراتي بنجاح!" : "Skill Cluster created successfully!", "success");
      
      // Redirect to edit page to add lessons
      router.push(`/school-admin/skills-hub/edit?id=${data.cluster.id}`);
      
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
                   onClick={() => router.push("/school-admin/skills-hub")}
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
                       {GRADES.filter(grade => !(clusterData.subject === "العلوم" && isGrade123(grade))).map(grade => (
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
                        {SUBJECTS.filter(subject => !(subject === "العلوم" && isGrade123(clusterData.grade))).map(subject => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                    </select>
                 </div>
              </div>

           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
