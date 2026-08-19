"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from '@/lib/api';
import { useNotification } from "@/context/NotificationContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, Save, Layers, CheckCircle2 } from 'lucide-react';

export default function CreateSchoolSkillClusterPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const { showToast } = useNotification();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  
  const [clusterData, setClusterData] = useState({
    name: "",
    description: "",
    subject: "",
    isCentral: false
  });

  const CANONICAL_GRADES = [
    "KG 1", "KG 2",
    "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي",
    "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
    "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
  ];

  const GRADE_LABELS: Record<string, { ar: string; en: string }> = {
    "KG 1": { ar: "KG 1", en: "KG 1" },
    "KG 2": { ar: "KG 2", en: "KG 2" },
    "الصف الأول الابتدائي": { ar: "الصف الأول الابتدائي", en: "Grade 1 Elementary" },
    "الصف الثاني الابتدائي": { ar: "الصف الثاني الابتدائي", en: "Grade 2 Elementary" },
    "الصف الثالث الابتدائي": { ar: "الصف الثالث الابتدائي", en: "Grade 3 Elementary" },
    "الصف الرابع الابتدائي": { ar: "الصف الرابع الابتدائي", en: "Grade 4 Elementary" },
    "الصف الخامس الابتدائي": { ar: "الصف الخامس الابتدائي", en: "Grade 5 Elementary" },
    "الصف السادس الابتدائي": { ar: "الصف السادس الابتدائي", en: "Grade 6 Elementary" },
    "الصف الأول الإعدادي": { ar: "الصف الأول الإعدادي", en: "Grade 1 Middle School" },
    "الصف الثاني الإعدادي": { ar: "الصف الثاني الإعدادي", en: "Grade 2 Middle School" },
    "الصف الثالث الإعدادي": { ar: "الصف الثالث الإعدادي", en: "Grade 3 Middle School" },
    "الصف الأول الثانوي": { ar: "الصف الأول الثانوي", en: "Grade 1 High School" },
    "الصف الثاني الثانوي": { ar: "الصف الثاني الثانوي", en: "Grade 2 High School" },
    "الصف الثالث الثانوي": { ar: "الصف الثالث الثانوي", en: "Grade 3 High School" },
  };

  const getGradeDisplay = (g: string) => GRADE_LABELS[g]?.[language === 'ar' ? 'ar' : 'en'] || g;

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
  ].some(gr => grade.includes(gr));

  useEffect(() => {
    const token = localStorage.getItem("school_admin_token");
    if (!token) {
      router.push("/school-admin/login");
    }
  }, [router]);

  const handleSaveCluster = async () => {
    if (!clusterData.name || !clusterData.subject || selectedGrades.length === 0) {
      showToast(language === 'ar' ? "يرجى تعبئة كافة الحقول الإلزامية واختيار صف واحد على الأقل." : "Please fill all required fields and select at least one grade.", "error");
      return;
    }

    if (clusterData.subject === "العلوم" && selectedGrades.some(g => isGrade123(g))) {
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
          grades: selectedGrades,
          grade: selectedGrades[0],
          isCentral: false
        })
      });

      if (!res.ok) {
        throw new Error("Failed to create skill cluster");
      }

      const data = await res.json();
      showToast(language === 'ar' ? "تم إنشاء المحور المهاراتي بنجاح!" : "Skill Cluster created successfully!", "success");
      
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

              {/* Grades Multi-Selection */}
              <div className="space-y-3">
                 <div className="flex items-center justify-between">
                    <label className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       {language === 'ar' ? "المراحل / الصفوف الدراسية (تحديد متعدد)" : "Grade Levels (Multi-Select)"}
                       <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedGrades.length === CANONICAL_GRADES.length) {
                          setSelectedGrades([]);
                        } else {
                          setSelectedGrades([...CANONICAL_GRADES]);
                        }
                      }}
                      className="text-xs font-black text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
                    >
                      {selectedGrades.length === CANONICAL_GRADES.length
                        ? (language === 'ar' ? "إلغاء تحديد الكل" : "Unselect All")
                        : (language === 'ar' ? "تحديد الكل" : "Select All")}
                    </button>
                 </div>

                 <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 max-h-[220px] overflow-y-auto custom-scrollbar flex flex-wrap gap-2">
                    {CANONICAL_GRADES.map(g => {
                      const isSelected = selectedGrades.includes(g);
                      return (
                        <label
                          key={g}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? "bg-amber-50 border-amber-400 text-amber-900 shadow-sm"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedGrades([...selectedGrades, g]);
                              } else {
                                setSelectedGrades(selectedGrades.filter(item => item !== g));
                              }
                            }}
                          />
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                          <span className="text-xs sm:text-sm font-bold">{getGradeDisplay(g)}</span>
                        </label>
                      );
                    })}
                 </div>
              </div>

           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
