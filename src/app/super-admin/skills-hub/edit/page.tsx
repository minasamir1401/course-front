"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL } from '@/lib/api';
import { useNotification } from "@/context/NotificationContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import { 
  ArrowLeft, Save, BookOpen, Layers, Monitor, Plus, Edit2, Trash2, 
  ChevronDown, ChevronUp, Settings, ListOrdered, CheckCircle2, Sparkles,
  Upload, Download
} from "lucide-react";
import InteractiveQuestionEditor from "@/components/InteractiveQuestionEditor";

export default function EditSkillClusterPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useNotification();
  const clusterId = searchParams.get('id');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'lessons'>('info');
  
  const [clusterData, setClusterData] = useState<any>({
    id: "", name: "", description: "", subject: "", grade: "", isCentral: false, schoolId: ""
  });

  const [lessons, setLessons] = useState<any[]>([]);
  
  // Lesson Modal State
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);

  // Activities State
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [activitiesData, setActivitiesData] = useState<Record<string, any[]>>({});
  
  // Activity Modal State
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);

  // Excel Upload State
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null);
  const excelInputRef = React.useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);

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
    if (!clusterId) {
      router.push("/super-admin/skills-hub");
      return;
    }

    const token = localStorage.getItem("super_admin_token");
    if (!token) {
      router.push("/super-admin/login");
      return;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setIsSuperAdmin(payload.role === 'SUPER_ADMIN');
    } catch (e) {
      console.error("Invalid token");
    }

    setMounted(true);
    fetchSchools(token);
    fetchClusterData();
  }, [clusterId]);

  const fetchSchools = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/schools`, { headers: { "Authorization": `Bearer ${token}` } });
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

  const fetchClusterData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("super_admin_token");
      
      // Fetch clusters and find ours (since there's no single cluster GET endpoint)
      const res = await fetch(`${API_URL}/skills-hub/clusters`, { headers: { "Authorization": `Bearer ${token}` } });
      if (res.status === 400 || res.status === 401) {
        localStorage.removeItem("super_admin_token");
        router.push("/super-admin/login");
        return;
      }
      const data = await res.json();
      const clusters = Array.isArray(data) ? data : [];
      const current = clusters.find((c: any) => c.id === clusterId);
      
      if (current) {
        setClusterData({
          id: current.id,
          name: current.name || "",
          description: current.description || "",
          subject: current.subject || "",
          grade: current.grade || "",
          isCentral: current.isCentral || false,
          schoolId: current.schoolId || ""
        });
      } else {
        showToast(language === 'ar' ? "المحور غير موجود" : "Cluster not found", "error");
        router.push("/super-admin/skills-hub");
      }

      fetchLessons();
    } catch (error) {
      console.error(error);
      showToast(language === 'ar' ? "فشل تحميل البيانات" : "Failed to load data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLessons = async () => {
    try {
      const token = localStorage.getItem("super_admin_token");
      const res = await fetch(`${API_URL}/skills-hub/clusters/${clusterId}/lessons`, { headers: { "Authorization": `Bearer ${token}` } });
      const data = await res.json();
      setLessons(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching lessons", error);
    }
  };

  const fetchActivities = async (lessonId: string) => {
    try {
      const token = localStorage.getItem("super_admin_token");
      const res = await fetch(`${API_URL}/skills-hub/lessons/${lessonId}/activities`, { headers: { "Authorization": `Bearer ${token}` } });
      const data = await res.json();
      setActivitiesData(prev => ({ ...prev, [lessonId]: Array.isArray(data) ? data : [] }));
    } catch (error) {
      console.error("Error fetching activities", error);
    }
  };

  const toggleLessonExpand = (lessonId: string) => {
    if (expandedLessonId === lessonId) {
      setExpandedLessonId(null);
    } else {
      setExpandedLessonId(lessonId);
      if (!activitiesData[lessonId]) {
        fetchActivities(lessonId);
      }
    }
  };

  const handleUpdateCluster = async () => {
    if (!clusterData.name || !clusterData.subject || !clusterData.grade) {
      showToast(language === 'ar' ? "يرجى تعبئة كافة الحقول الإلزامية." : "Please fill all required fields.", "error");
      return;
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem("super_admin_token");
      const res = await fetch(`${API_URL}/skills-hub/clusters/${clusterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          ...clusterData,
          schoolId: clusterData.isCentral ? null : clusterData.schoolId
        })
      });

      if (!res.ok) throw new Error("Failed to update skill cluster");
      showToast(language === 'ar' ? "تم تحديث المحور المهاراتي بنجاح!" : "Skill Cluster updated successfully!", "success");
    } catch (error) {
      console.error(error);
      showToast(language === 'ar' ? "حدث خطأ أثناء التحديث." : "Error updating data.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // LESSON HANDLERS
  const openAddLesson = () => {
    setEditingLesson({ name: "", description: "", order: lessons.length });
    setIsLessonModalOpen(true);
  };

  const openEditLesson = (lesson: any) => {
    setEditingLesson({ ...lesson });
    setIsLessonModalOpen(true);
  };

  const handleSaveLesson = async () => {
    if (!editingLesson.name) {
      showToast(language === 'ar' ? "اسم الدرس مطلوب" : "Lesson name required", "error");
      return;
    }
    
    try {
      const token = localStorage.getItem("super_admin_token");
      const isEdit = !!editingLesson.id;
      const url = isEdit ? `${API_URL}/skills-hub/lessons/${editingLesson.id}` : `${API_URL}/skills-hub/lessons`;
      
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ ...editingLesson, clusterId })
      });
      
      if (res.ok) {
        showToast(language === 'ar' ? "تم حفظ الدرس بنجاح" : "Lesson saved successfully", "success");
        setIsLessonModalOpen(false);
        fetchLessons();
      } else {
        throw new Error("Save failed");
      }
    } catch (e) {
      showToast(language === 'ar' ? "خطأ في حفظ الدرس" : "Error saving lesson", "error");
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!window.confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا الدرس بالكامل؟" : "Are you sure you want to delete this lesson?")) return;
    try {
      const token = localStorage.getItem("super_admin_token");
      const res = await fetch(`${API_URL}/skills-hub/lessons/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        showToast(language === 'ar' ? "تم الحذف" : "Deleted", "success");
        fetchLessons();
      }
    } catch (e) {
      showToast(language === 'ar' ? "فشل الحذف" : "Delete failed", "error");
    }
  };

  // ACTIVITY HANDLERS
  const openAddActivity = (lessonId: string) => {
    setEditingActivity({
      lessonId,
      title: "",
      type: "MCQ",
      options: { choices: ["", "", "", ""] },
      correctAnswer: "",
      points: 10,
      difficulty: "Medium",
      dok: "",
      estimatedTime: 60,
      standard: "", indicator: "", learningOutcome: "",
      explanation: ""
    });
    setIsActivityModalOpen(true);
  };

  const openEditActivity = (activity: any) => {
    setEditingActivity({ ...activity });
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = async () => {
    if (!editingActivity.title || !editingActivity.type) {
      showToast(language === 'ar' ? "عنوان السؤال ونوعه مطلوبان" : "Title and type are required", "error");
      return;
    }
    
    try {
      const token = localStorage.getItem("super_admin_token");
      const isEdit = !!editingActivity.id;
      const url = isEdit ? `${API_URL}/skills-hub/activities/${editingActivity.id}` : `${API_URL}/skills-hub/activities`;
      
      const payload = { ...editingActivity };
      if (typeof payload.options === 'object') payload.options = JSON.stringify(payload.options);
      if (typeof payload.correctAnswer === 'object') payload.correctAnswer = JSON.stringify(payload.correctAnswer);

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        showToast(language === 'ar' ? "تم حفظ النشاط بنجاح" : "Activity saved successfully", "success");
        setIsActivityModalOpen(false);
        fetchActivities(editingActivity.lessonId);
      } else {
        throw new Error("Save failed");
      }
    } catch (e) {
      showToast(language === 'ar' ? "خطأ في حفظ النشاط" : "Error saving activity", "error");
    }
  };

  const handleDeleteActivity = async (id: string, lessonId: string) => {
    if (!window.confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا النشاط؟" : "Are you sure you want to delete this activity?")) return;
    try {
      const token = localStorage.getItem("super_admin_token");
      const res = await fetch(`${API_URL}/skills-hub/activities/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        showToast(language === 'ar' ? "تم الحذف" : "Deleted", "success");
        fetchActivities(lessonId);
      }
    } catch (e) {
      showToast(language === 'ar' ? "فشل الحذف" : "Delete failed", "error");
    }
  };

  // EXCEL HANDLERS
  const downloadTemplate = () => {
    const wsData = [
      [
        language === 'ar' ? "نص السؤال" : "Question Text",
        language === 'ar' ? "نوع السؤال" : "Question Type",
        language === 'ar' ? "الخيار 1" : "Option 1",
        language === 'ar' ? "الخيار 2" : "Option 2",
        language === 'ar' ? "الخيار 3" : "Option 3",
        language === 'ar' ? "الخيار 4" : "Option 4",
        language === 'ar' ? "الخيار 5" : "Option 5",
        language === 'ar' ? "الإجابة الصحيحة" : "Correct Answer",
        language === 'ar' ? "الإجابات الصحيحة المتعددة" : "Correct Answers",
        language === 'ar' ? "الدرجة" : "Points",
        language === 'ar' ? "مستوى الصعوبة" : "Difficulty Level",
        "DOK",
        language === 'ar' ? "التفسير" : "Explanation"
      ],
      [
        language === 'ar' ? "ما هو ناتج 5 + 5؟" : "What is 5 + 5?",
        "MCQ",
        "8", "9", "10", "11", "",
        "10", "", "10", "Easy", "DOK 1",
        language === 'ar' ? "لأن 5 زائد 5 يساوي 10" : "Because 5 + 5 = 10"
      ]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "activities_template.xlsx");
    showToast(language === 'ar' ? "تم تحميل النموذج" : "Template downloaded", "success");
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingLessonId) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        
        if (rows.length < 2) {
          showToast(language === 'ar' ? "الملف فارغ" : "Empty file", "error");
          return;
        }

        const headers = rows[0].map(h => String(h).trim().toLowerCase());
        const textIdx = headers.findIndex(h => h.includes("question") || h.includes("السؤال") || h.includes("نص السؤال"));
        const typeIdx = headers.findIndex(h => h.includes("type") || h.includes("نوع"));
        const opt1Idx = headers.findIndex(h => h.includes("option 1") || h.includes("الخيار 1") || h.includes("أول"));
        const opt2Idx = headers.findIndex(h => h.includes("option 2") || h.includes("الخيار 2") || h.includes("ثاني"));
        const opt3Idx = headers.findIndex(h => h.includes("option 3") || h.includes("الخيار 3") || h.includes("ثالث"));
        const opt4Idx = headers.findIndex(h => h.includes("option 4") || h.includes("الخيار 4") || h.includes("رابع"));
        const correctIdx = headers.findIndex(h => h.includes("correct answer") || h.includes("الإجابة الصحيحة"));
        const pointsIdx = headers.findIndex(h => h.includes("points") || h.includes("الدرجة") || h.includes("النقاط"));
        const diffIdx = headers.findIndex(h => h.includes("difficulty") || h.includes("صعوبة") || h.includes("الصعوبة"));
        const dokIdx = headers.findIndex(h => h.includes("dok"));
        const expIdx = headers.findIndex(h => h.includes("explanation") || h.includes("تفسير") || h.includes("شرح"));

        let successCount = 0;
        const token = localStorage.getItem("super_admin_token");

        setIsSaving(true);
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.every(c => String(c).trim() === "")) continue;

          const title = textIdx >= 0 ? String(row[textIdx] ?? "").trim() : "";
          if (!title) continue;

          let type = "MCQ";
          const rawType = typeIdx >= 0 ? String(row[typeIdx] ?? "").trim().toUpperCase() : "";
          if (rawType.includes("TRUE") || rawType.includes("صح") || rawType.includes("T/F")) type = "TRUE_FALSE";
          else if (rawType.includes("MULTI") || rawType.includes("تحديد") || rawType.includes("متعدد")) type = "MULTI_SELECT";

          const optionsList = [];
          if (opt1Idx >= 0 && row[opt1Idx] !== "") optionsList.push(String(row[opt1Idx]).trim());
          if (opt2Idx >= 0 && row[opt2Idx] !== "") optionsList.push(String(row[opt2Idx]).trim());
          if (opt3Idx >= 0 && row[opt3Idx] !== "") optionsList.push(String(row[opt3Idx]).trim());
          if (opt4Idx >= 0 && row[opt4Idx] !== "") optionsList.push(String(row[opt4Idx]).trim());
          if (optionsList.length === 0 && type !== 'TRUE_FALSE') optionsList.push("Option 1", "Option 2");

          let optionsStr = JSON.stringify({ choices: optionsList });
          let correctStr = correctIdx >= 0 ? String(row[correctIdx] ?? "").trim() : "";
          
          if (type === 'TRUE_FALSE') {
            optionsStr = JSON.stringify(["صح", "خطأ"]);
          } else if (type === 'MULTI_SELECT') {
            optionsStr = JSON.stringify(optionsList);
            correctStr = JSON.stringify(correctStr.split(",").map(s => s.trim()));
          } else {
            optionsStr = JSON.stringify({ choices: optionsList });
          }

          const points = pointsIdx >= 0 ? (parseInt(String(row[pointsIdx])) || 10) : 10;
          let difficulty = diffIdx >= 0 ? String(row[diffIdx] ?? "").trim() : "Medium";
          if (difficulty.includes("سهل") || difficulty.toLowerCase().includes("easy")) difficulty = "Easy";
          if (difficulty.includes("صعب") || difficulty.toLowerCase().includes("hard")) difficulty = "Hard";
          
          const dokRaw = dokIdx >= 0 ? String(row[dokIdx] ?? "").trim() : "";
          const dok = ["DOK 1", "DOK 2", "DOK 3", "DOK 4"].includes(dokRaw) ? dokRaw : "";
          
          const explanation = expIdx >= 0 ? String(row[expIdx] ?? "").trim() : "";

          const payload = {
            lessonId: uploadingLessonId,
            title,
            type,
            options: optionsStr,
            correctAnswer: correctStr,
            points,
            difficulty,
            dok,
            estimatedTime: 60,
            explanation
          };

          const res = await fetch(`${API_URL}/skills-hub/activities`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(payload)
          });

          if (res.ok) successCount++;
        }

        showToast(
          language === 'ar' ? `تم استيراد ${successCount} نشاط بنجاح` : `Imported ${successCount} activities`,
          "success"
        );
        fetchActivities(uploadingLessonId);
      } catch (err) {
        console.error(err);
        showToast(language === 'ar' ? "خطأ في قراءة الملف" : "Error reading file", "error");
      } finally {
        setIsSaving(false);
        setUploadingLessonId(null);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Hidden File Input for Excel */}
      <input 
        type="file" 
        ref={excelInputRef} 
        style={{ display: 'none' }} 
        accept=".xlsx,.xls" 
        onChange={handleExcelUpload} 
      />

      <div className="space-y-6 sm:space-y-10" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Header Section */}
        <div className="relative bg-white rounded-[20px] sm:rounded-[50px] p-4 sm:p-12 overflow-hidden shadow-sm border border-slate-100">
           <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-6 sm:gap-10">
              <div className={`flex flex-col sm:flex-row items-center gap-4 sm:gap-8 ${language === 'ar' ? 'text-right sm:items-start' : 'text-left sm:items-start'}`}>
                 <button 
                   onClick={() => router.push('/super-admin/skills-hub')}
                   className="w-10 h-10 sm:w-14 h-14 bg-slate-50 text-slate-500 hover:text-slate-900 rounded-full flex items-center justify-center transition-all shrink-0 hover:bg-slate-100"
                 >
                   <ArrowLeft className={`w-5 h-5 sm:w-6 h-6 ${language === 'ar' ? 'rotate-180' : ''}`} />
                 </button>
                 <div className="w-12 h-12 sm:w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl sm:rounded-[35px] flex items-center justify-center shadow-xl sm:shadow-2xl shadow-amber-500/20 transform -rotate-3 shrink-0">
                    <Edit2 className="w-6 h-6 sm:w-12 h-12 text-white" />
                 </div>
                 <div>
                    <h1 className="text-lg sm:text-4xl font-black text-slate-900 mb-1 sm:mb-3 tracking-tight">
                       {clusterData.name}
                    </h1>
                    <p className="text-slate-500 text-[10px] sm:text-lg font-bold max-w-xl">
                       {language === 'ar' ? "تعديل إعدادات المحور وإدارة الدروس والأنشطة المرتبطة به." : "Edit cluster settings and manage its lessons and activities."}
                    </p>
                 </div>
              </div>
           </div>
           <div className="absolute top-0 right-0 w-1/3 h-full bg-amber-500/5 blur-[120px] rounded-full -mr-20"></div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 sm:gap-4 p-2 bg-white rounded-2xl sm:rounded-full shadow-sm border border-slate-100">
           {[
             { id: 'info', icon: Settings, label: language === 'ar' ? "الإعدادات" : "Settings" },
             { id: 'lessons', icon: ListOrdered, label: language === 'ar' ? "الدروس (المهارات الفرعية)" : "Lessons" }
           ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-full font-black text-xs sm:text-sm transition-all whitespace-nowrap ${
                 activeTab === tab.id 
                 ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" 
                 : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900"
               }`}
             >
               <tab.icon className="w-4 h-4 sm:w-5 h-5" />
               {tab.label}
             </button>
           ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <div className="bg-white rounded-[24px] sm:rounded-[40px] border border-slate-100 shadow-sm overflow-hidden p-6 sm:p-10 animate-in fade-in duration-300">
            <div className="space-y-8 max-w-4xl">
              <div className="space-y-3">
                 <label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    {language === 'ar' ? "اسم المحور المهاراتي" : "Cluster Name"} <span className="text-red-500">*</span>
                 </label>
                 <input 
                   type="text" value={clusterData.name} onChange={(e) => setClusterData({ ...clusterData, name: e.target.value })}
                   className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
                 />
              </div>

              <div className="space-y-3">
                 <label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    {language === 'ar' ? "الوصف" : "Description"}
                 </label>
                 <textarea 
                   value={clusterData.description} onChange={(e) => setClusterData({ ...clusterData, description: e.target.value })}
                   rows={3} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white transition-all outline-none font-bold text-slate-700 resize-none"
                 />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       {language === 'ar' ? "المرحلة / الصف" : "Grade"} <span className="text-red-500">*</span>
                    </label>
                    <select 
                      value={clusterData.grade} onChange={(e) => setClusterData({ ...clusterData, grade: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white transition-all outline-none font-bold text-slate-700 appearance-none"
                    >
                       <option value="">{language === 'ar' ? "اختر..." : "Select..."}</option>
                       {GRADES.map(grade => <option key={grade} value={grade}>{grade}</option>)}
                    </select>
                 </div>

                 <div className="space-y-3">
                    <label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       {language === 'ar' ? "المادة" : "Subject"} <span className="text-red-500">*</span>
                    </label>
                    <select 
                      value={clusterData.subject} onChange={(e) => setClusterData({ ...clusterData, subject: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white transition-all outline-none font-bold text-slate-700 appearance-none"
                    >
                       <option value="">{language === 'ar' ? "اختر..." : "Select..."}</option>
                       {SUBJECTS.map(subject => <option key={subject} value={subject}>{subject}</option>)}
                    </select>
                 </div>
              </div>

              {isSuperAdmin && (
                <div className="pt-6 border-t border-slate-100 space-y-6">
                   <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-200">
                      <div>
                         <h4 className="font-black text-slate-900">{language === 'ar' ? "محور مركزي" : "Central Cluster"}</h4>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={clusterData.isCentral} onChange={(e) => setClusterData({ ...clusterData, isCentral: e.target.checked, schoolId: e.target.checked ? "" : clusterData.schoolId })} className="sr-only peer" />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                   </div>
                   
                   {!clusterData.isCentral && (
                     <div className="space-y-3">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-widest">{language === 'ar' ? "المدرسة" : "School"}</label>
                        <select 
                          value={clusterData.schoolId} onChange={(e) => setClusterData({ ...clusterData, schoolId: e.target.value })}
                          className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white transition-all outline-none font-bold text-slate-700"
                        >
                           <option value="">{language === 'ar' ? "اختر المدرسة..." : "Select School..."}</option>
                           {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                     </div>
                   )}
                </div>
              )}

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                 <button 
                   onClick={handleUpdateCluster} disabled={isSaving}
                   className="bg-slate-900 text-white px-8 py-4 rounded-xl font-black flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
                 >
                   <Save className="w-5 h-5" />
                   {language === 'ar' ? "تحديث المحور" : "Update Cluster"}
                 </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lessons' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
               <div>
                  <h2 className="text-xl font-black text-slate-900">{language === 'ar' ? "الدروس (المهارات الفرعية)" : "Skill Lessons"}</h2>
                  <p className="text-slate-500 text-sm font-bold mt-1">{language === 'ar' ? "أضف ورتب الدروس التي تندرج تحت هذا المحور." : "Add and arrange lessons under this cluster."}</p>
               </div>
               <button 
                 onClick={openAddLesson}
                 className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
               >
                  <Plus className="w-5 h-5" />
                  {language === 'ar' ? "درس جديد" : "New Lesson"}
               </button>
            </div>

            <div className="space-y-4">
              {lessons.length === 0 ? (
                 <div className="bg-white border-2 border-dashed border-slate-200 rounded-[24px] p-12 text-center">
                    <Monitor className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold">{language === 'ar' ? "لا يوجد دروس بعد. ابدأ بإضافة درس جديد." : "No lessons yet. Start by adding one."}</p>
                 </div>
              ) : (
                lessons.map((lesson) => (
                  <div key={lesson.id} className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                     {/* Lesson Header Row */}
                     <div className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50">
                        <div className="flex items-center gap-4 flex-1">
                           <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center font-black text-lg shrink-0">
                              {lesson.order || 0}
                           </div>
                           <div>
                              <h3 className="text-lg font-black text-slate-900">{lesson.name}</h3>
                              <p className="text-slate-500 text-sm font-bold line-clamp-1">{lesson.description || (language === 'ar' ? "لا يوجد وصف" : "No description")}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                           <button 
                             onClick={() => toggleLessonExpand(lesson.id)}
                             className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-100 transition-all"
                           >
                              {expandedLessonId === lesson.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              {language === 'ar' ? "الأنشطة" : "Activities"} 
                              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-xs">{lesson._count?.activities || 0}</span>
                           </button>
                           <button 
                             onClick={() => openEditLesson(lesson)}
                             className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-100 transition-all"
                           >
                              <Edit2 className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => handleDeleteLesson(lesson.id)}
                             className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center hover:bg-rose-100 transition-all"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                     </div>

                     {/* Expanded Activities Section */}
                     {expandedLessonId === lesson.id && (
                        <div className="bg-slate-50/50 p-4 sm:p-6 animate-in slide-in-from-top-2 duration-200">
                           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                              <h4 className="font-black text-slate-700 text-sm">{language === 'ar' ? "الأنشطة التفاعلية (أسئلة)" : "Interactive Activities (Questions)"}</h4>
                              <div className="flex items-center gap-2 flex-wrap">
                                <button 
                                  onClick={() => {
                                    setUploadingLessonId(lesson.id);
                                    excelInputRef.current?.click();
                                  }}
                                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                >
                                  <Upload className="w-4 h-4" />
                                  {language === 'ar' ? 'استيراد' : 'Import'}
                                </button>
                                <button 
                                  onClick={downloadTemplate}
                                  className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-4 py-2 rounded-lg font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                >
                                  <Download className="w-4 h-4" />
                                  {language === 'ar' ? 'نموذج' : 'Template'}
                                </button>
                                <button 
                                  onClick={() => openAddActivity(lesson.id)}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                >
                                  <Plus className="w-4 h-4" />
                                  {language === 'ar' ? "إضافة نشاط" : "Add Activity"}
                                </button>
                              </div>
                           </div>

                           <div className="space-y-3">
                              {!activitiesData[lesson.id] ? (
                                <div className="text-center p-4 text-slate-400 font-bold text-sm animate-pulse">Loading...</div>
                              ) : activitiesData[lesson.id]?.length === 0 ? (
                                <div className="text-center p-6 bg-white border border-slate-200 rounded-xl text-slate-400 font-bold text-sm">
                                  {language === 'ar' ? "لا توجد أنشطة في هذا الدرس." : "No activities in this lesson."}
                                </div>
                              ) : (
                                activitiesData[lesson.id].map((activity, idx) => (
                                  <div key={activity.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-indigo-300 transition-all shadow-sm">
                                     <div className="flex items-center gap-3 w-full">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0">
                                          {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                           <div className="flex items-center gap-2 mb-1">
                                             <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">{activity.type}</span>
                                             <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded">{activity.points} pts</span>
                                           </div>
                                           <h5 className="font-black text-slate-800 text-sm truncate">{activity.title}</h5>
                                        </div>
                                     </div>
                                     <div className="flex items-center gap-2 shrink-0">
                                        <button 
                                          onClick={() => openEditActivity(activity)}
                                          className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-all"
                                        >
                                           <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteActivity(activity.id, lesson.id)}
                                          className="text-slate-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-lg transition-all"
                                        >
                                           <Trash2 className="w-4 h-4" />
                                        </button>
                                     </div>
                                  </div>
                                ))
                              )}
                           </div>
                        </div>
                     )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ----------------- MODALS ----------------- */}

      {/* Lesson Modal */}
      {mounted && isLessonModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900">
                {editingLesson?.id ? (language === 'ar' ? 'تعديل الدرس' : 'Edit Lesson') : (language === 'ar' ? 'إضافة درس جديد' : 'Add New Lesson')}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase">{language === 'ar' ? "اسم الدرس" : "Lesson Name"}</label>
                <input 
                  type="text" value={editingLesson?.name || ""} onChange={(e) => setEditingLesson({...editingLesson, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-amber-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase">{language === 'ar' ? "وصف مختصر (اختياري)" : "Description (Optional)"}</label>
                <textarea 
                  value={editingLesson?.description || ""} onChange={(e) => setEditingLesson({...editingLesson, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-amber-500 outline-none resize-none" rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase">{language === 'ar' ? "الترتيب" : "Order"}</label>
                <input 
                  type="number" value={editingLesson?.order || 0} onChange={(e) => setEditingLesson({...editingLesson, order: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-amber-500 outline-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button onClick={() => setIsLessonModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-all">{language === 'ar' ? "إلغاء" : "Cancel"}</button>
              <button onClick={handleSaveLesson} className="px-6 py-2.5 rounded-xl font-black text-white bg-amber-500 hover:bg-amber-600 shadow-md transition-all">{language === 'ar' ? "حفظ الدرس" : "Save Lesson"}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Activity Modal */}
      {mounted && isActivityModalOpen && editingActivity && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 bg-slate-900/60 backdrop-blur-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="bg-white rounded-[24px] w-full max-w-5xl max-h-full flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/30 shrink-0">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                {editingActivity.id ? (language === 'ar' ? 'تعديل النشاط التفاعلي' : 'Edit Interactive Activity') : (language === 'ar' ? 'إنشاء نشاط تفاعلي' : 'Create Interactive Activity')}
              </h3>
              <button onClick={() => setIsActivityModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">
                &times;
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 bg-slate-50/20">
              
              {/* Top Settings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "نص السؤال / العنوان الرئيسي" : "Question Text / Main Title"} <span className="text-red-500">*</span></label>
                  <input 
                    type="text" value={editingActivity.title} onChange={(e) => setEditingActivity({...editingActivity, title: e.target.value})}
                    placeholder={language === 'ar' ? "اكتب نص السؤال هنا..." : "Write question text..."}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "نوع النشاط التفاعلي" : "Activity Type"} <span className="text-red-500">*</span></label>
                  <select 
                    value={editingActivity.type} 
                    onChange={(e) => {
                      const newType = e.target.value;
                      let defaultOptions: any = ["", "", "", ""];
                      let defaultCorrect = "";
                      
                      if (newType === 'TRUE_FALSE') { defaultOptions = ["صح", "خطأ"]; defaultCorrect = "صح"; }
                      else if (newType === 'MULTI_SELECT') { defaultOptions = ["", "", "", ""]; defaultCorrect = JSON.stringify([]); }
                      else if (newType === 'MATCHING') { defaultOptions = { left: [], right: [] }; defaultCorrect = JSON.stringify({}); }
                      else if (newType === 'DRAG_DROP_FILL') { defaultOptions = { sentence: "", choices: [] }; defaultCorrect = JSON.stringify([]); }
                      else if (newType === 'GROUP_SORTING') { defaultOptions = { groups: [], items: [] }; defaultCorrect = JSON.stringify({}); }
                      else if (newType === 'CLOCK') { defaultOptions = { minuteStep: 5 }; defaultCorrect = "12:00"; }
                      else if (newType === 'MIND_MAP') { defaultOptions = { nodes: [] }; defaultCorrect = JSON.stringify({}); }
                      else if (newType === 'VIDEO_CHECKPOINT') { defaultOptions = { videoUrl: "", checkpoints: [] }; defaultCorrect = JSON.stringify({}); }
                      else { defaultOptions = { choices: ["", "", "", ""] }; defaultCorrect = ""; }

                      setEditingActivity({
                        ...editingActivity, 
                        type: newType,
                        options: defaultOptions,
                        correctAnswer: defaultCorrect
                      });
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-700 focus:border-indigo-500 focus:bg-white outline-none"
                  >
                     <option value="MCQ">{language === 'ar' ? 'اختيار من متعدد (MCQ)' : 'Multiple Choice (MCQ)'}</option>
                     <option value="TRUE_FALSE">{language === 'ar' ? 'صح / خطأ (T/F)' : 'True / False (T/F)'}</option>
                     <option value="MULTI_SELECT">{language === 'ar' ? 'اختيار متعدد (تحديد)' : 'Multi-select (Checkboxes)'}</option>
                     <option value="MATCHING">{language === 'ar' ? 'سؤال التوصيل (Matching)' : 'Matching Elements'}</option>
                     <option value="DRAG_DROP_FILL">{language === 'ar' ? 'سحب الفراغات (Drag & Drop)' : 'Drag & Drop Fill'}</option>
                     <option value="GROUP_SORTING">{language === 'ar' ? 'تصنيف المجموعات' : 'Group Sorting'}</option>
                     <option value="NUMBER_LINE">{language === 'ar' ? 'خط الأعداد' : 'Number Line'}</option>
                     <option value="CLOCK">{language === 'ar' ? 'عقارب الساعة' : 'Interactive Clock'}</option>
                     <option value="MIND_MAP">{language === 'ar' ? 'خريطة مفاهيم' : 'Concept Mind Map'}</option>
                     <option value="VIDEO_CHECKPOINT">{language === 'ar' ? 'فيديو تفاعلي' : 'Interactive Video'}</option>
                     <option value="SWIPE_SORT">{language === 'ar' ? 'سحب سريع (Swipe)' : 'Swipe Sort'}</option>
                     <option value="MAZE">{language === 'ar' ? 'المتاهة (Maze)' : 'Educational Maze'}</option>
                     <option value="WORD_SEARCH">{language === 'ar' ? 'البحث عن الكلمات' : 'Word Search'}</option>
                     <option value="GEOGEBRA">{language === 'ar' ? 'جيوجيبرا (GeoGebra)' : 'GeoGebra Widget'}</option>
                     <option value="FLASH_CARD">{language === 'ar' ? 'بطاقات (Flash Cards)' : 'Flash Cards'}</option>
                     <option value="MEMORY_GAME">{language === 'ar' ? 'لعبة الذاكرة' : 'Memory Game'}</option>
                     <option value="WORD_SCRAMBLE">{language === 'ar' ? 'ترتيب الحروف' : 'Word Scramble'}</option>
                     <option value="SENTENCE_REORDER">{language === 'ar' ? 'ترتيب الجملة' : 'Sentence Reorder'}</option>
                     <option value="MATH_EQUATION">{language === 'ar' ? 'معادلة رياضية' : 'Math Equation'}</option>
                     <option value="SEQUENCE_ORDER">{language === 'ar' ? 'ترتيب التسلسل' : 'Sequence Order'}</option>
                     <option value="CROSSWORD">{language === 'ar' ? 'كلمات متقاطعة' : 'Crossword'}</option>
                     <option value="COUNT_OBJECTS">{language === 'ar' ? 'عد العناصر' : 'Count Objects'}</option>
                     <option value="IMAGE_LABEL">{language === 'ar' ? 'تسمية الصورة' : 'Image Labeling'}</option>
                     <option value="COLOR_MATCH">{language === 'ar' ? 'تطابق الألوان' : 'Color Match'}</option>
                  </select>
                </div>

                {/* Additional Metadata row */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "النقاط (الدرجة)" : "Points"}</label>
                  <input 
                    type="number" value={editingActivity.points} onChange={(e) => setEditingActivity({...editingActivity, points: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "الصعوبة" : "Difficulty"}</label>
                  <select value={editingActivity.difficulty} onChange={(e) => setEditingActivity({...editingActivity, difficulty: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none">
                    <option value="Easy">{language === 'ar' ? 'سهل' : 'Easy'}</option>
                    <option value="Medium">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
                    <option value="Hard">{language === 'ar' ? 'صعب' : 'Hard'}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "عمق المعرفة (DOK)" : "DOK"}</label>
                  <select value={editingActivity.dok || ""} onChange={(e) => setEditingActivity({...editingActivity, dok: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none">
                    <option value="">{language === 'ar' ? 'لا يوجد' : 'None'}</option>
                    <option value="DOK 1">DOK 1</option>
                    <option value="DOK 2">DOK 2</option>
                    <option value="DOK 3">DOK 3</option>
                    <option value="DOK 4">DOK 4</option>
                  </select>
                </div>
              </div>

              {/* Core Interactive Editor */}
              <div className="bg-white border border-indigo-100 rounded-[24px] shadow-sm p-6 overflow-hidden">
                 <InteractiveQuestionEditor 
                   question={editingActivity}
                   onChange={(updatedQ) => setEditingActivity(updatedQ)}
                   language={language}
                 />
              </div>

              {/* Explanation (Optional) */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 block">{language === 'ar' ? "التفسير (يظهر بعد الإجابة - اختياري)" : "Explanation (Shows after answering - Optional)"}</label>
                <textarea 
                  value={editingActivity.explanation || ""} onChange={(e) => setEditingActivity({...editingActivity, explanation: e.target.value})}
                  rows={3}
                  placeholder={language === 'ar' ? "اكتب شرحاً يوضح سبب الإجابة الصحيحة للطالب..." : "Explain why the answer is correct..."}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none resize-none"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-100 flex justify-end gap-3 bg-white shrink-0">
              <button onClick={() => setIsActivityModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">{language === 'ar' ? "إلغاء" : "Cancel"}</button>
              <button onClick={handleSaveActivity} className="px-8 py-3 rounded-xl font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all">
                <CheckCircle2 className="w-5 h-5" />
                {language === 'ar' ? "حفظ النشاط" : "Save Activity"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </DashboardLayout>
  );
}
