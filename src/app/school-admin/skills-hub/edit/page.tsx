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
  ArrowLeft, ArrowRight, Save, BookOpen, Layers, Monitor, Plus, Edit2, Trash2, 
  ChevronDown, ChevronUp, Settings, ListOrdered, CheckCircle2, Sparkles,
  Upload, Download, Play, Clock, X, Info, BrainCircuit, Star, StarOff, RefreshCw
} from "lucide-react";
import InteractiveQuestionEditor from "@/components/InteractiveQuestionEditor";
import InteractiveQuestionRenderer from "@/components/InteractiveQuestionRenderer";

export default function EditSchoolSkillClusterPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useNotification();
  const clusterId = searchParams.get('id');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);
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
  const metadataExcelRef = React.useRef<HTMLInputElement>(null);

  // Student Preview Play Modal States
  const [previewActivity, setPreviewActivity] = useState<any>(null);
  const [previewAnswer, setPreviewAnswer] = useState<string>("");
  const [previewIsSubmitting, setPreviewIsSubmitting] = useState(false);
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [previewStartTime, setPreviewStartTime] = useState<number>(0);
  const [previewHintsUsed, setPreviewHintsUsed] = useState<number>(0);
  const [previewAttemptCount, setPreviewAttemptCount] = useState<number>(1);
  const [previewHelperModal, setPreviewHelperModal] = useState<{ type: "hint" | "tip" | "keyInsight" | null; content: string }>({
    type: null,
    content: ""
  });
  const [previewActivitiesList, setPreviewActivitiesList] = useState<any[]>([]);

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
      router.push("/school-admin/skills-hub");
      return;
    }

    const token = localStorage.getItem("school_admin_token");
    const storedUser = localStorage.getItem("school_admin_user");
    if (!token) {
      router.push("/school-admin/login");
      return;
    }
    
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setSchoolId(u.schoolId);
      } catch (e) {
        console.error(e);
      }
    }

    setMounted(true);
    fetchClusterData();
  }, [clusterId]);

  const translateText = (val: any, lang: string = "ar") => {
    if (!val) return "";
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        if (parsed && typeof parsed === "object") {
          return parsed[lang] || parsed["ar"] || parsed["en"] || "";
        }
      } catch {}
      return val;
    }
    if (typeof val === "object" && val !== null) {
      return val[lang] || val["ar"] || val["en"] || "";
    }
    return String(val);
  };

  const getCleanDescription = (desc: string | null) => {
    if (!desc) return "";
    const trimmed = desc.trim();
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        return parsed.description || "";
      } catch {}
    }
    return desc;
  };

  const getLessonMetadata = (lesson: any) => {
    if (!lesson || !lesson.description) return { description: "", standards: [], indicators: [], outcomes: [] };
    const desc = lesson.description.trim();
    if (desc.startsWith("{")) {
      try {
        const parsed = JSON.parse(desc);
        return {
          description: parsed.description || "",
          standards: parsed.standards || [],
          indicators: parsed.indicators || [],
          outcomes: parsed.outcomes || []
        };
      } catch {}
    }
    return {
      description: lesson.description,
      standards: [],
      indicators: [],
      outcomes: []
    };
  };

  const fetchClusterData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("school_admin_token");
      
      const res = await fetch(`${API_URL}/skills-hub/clusters`, { headers: { "Authorization": `Bearer ${token}` } });
      if (res.status === 400 || res.status === 401) {
        localStorage.removeItem("school_admin_token");
        router.push("/school-admin/login");
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
        router.push("/school-admin/skills-hub");
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
      const token = localStorage.getItem("school_admin_token");
      const res = await fetch(`${API_URL}/skills-hub/clusters/${clusterId}/lessons`, { headers: { "Authorization": `Bearer ${token}` } });
      const data = await res.json();
      setLessons(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching lessons", error);
    }
  };

  const fetchActivities = async (lessonId: string) => {
    try {
      const token = localStorage.getItem("school_admin_token");
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
      const token = localStorage.getItem("school_admin_token");
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
    const metadata = getLessonMetadata(lesson);
    setEditingLesson({ 
      id: lesson.id,
      name: lesson.name,
      order: lesson.order,
      description: metadata.description,
      standards: metadata.standards,
      indicators: metadata.indicators,
      outcomes: metadata.outcomes
    });
    setIsLessonModalOpen(true);
  };

  const handleSaveLesson = async () => {
    if (!editingLesson.name) {
      showToast(language === 'ar' ? "اسم الدرس مطلوب" : "Lesson name required", "error");
      return;
    }
    
    try {
      const token = localStorage.getItem("school_admin_token");
      const isEdit = !!editingLesson.id;
      const url = isEdit ? `${API_URL}/skills-hub/lessons/${editingLesson.id}` : `${API_URL}/skills-hub/lessons`;
      
      const finalDescription = JSON.stringify({
        description: editingLesson.description || "",
        standards: editingLesson.standards || [],
        indicators: editingLesson.indicators || [],
        outcomes: editingLesson.outcomes || []
      });

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ 
          clusterId,
          name: editingLesson.name,
          order: Number(editingLesson.order) || 0,
          description: finalDescription
        })
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
      const token = localStorage.getItem("school_admin_token");
      const res = await fetch(`${API_URL}/skills-hub/lessons/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        showToast(language === 'ar' ? "تم الحذف" : "Deleted", "success");
        fetchLessons();
      }
    } catch (e) {
      showToast(language === 'ar' ? "فشل الحذف" : "Delete failed", "error");
    }
  };

  const saveLessonMetadata = async (lessonId: string, updatedMetadata: any) => {
    const token = localStorage.getItem("school_admin_token");
    if (!token) return;
    
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    const updatedDescription = JSON.stringify(updatedMetadata);
    try {
      const res = await fetch(`${API_URL}/skills-hub/lessons/${lessonId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: lesson.name,
          description: updatedDescription,
          order: lesson.order
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLessons(prev => prev.map(l => l.id === lessonId ? data.lesson : l));
        return data.lesson;
      }
    } catch (err) {
      console.error("Error saving lesson metadata:", err);
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
      dok: "2",
      estimatedTime: 60,
      standard: "", indicator: "", learningOutcome: "",
      hint: "", tip: "", explanation: "", keyInsight: ""
    });
    setIsActivityModalOpen(true);
  };

  const openEditActivity = (activity: any) => {
    setEditingActivity({ 
      ...activity,
      options: typeof activity.options === 'string' ? JSON.parse(activity.options) : activity.options,
      correctAnswer: typeof activity.correctAnswer === 'string' ? JSON.parse(activity.correctAnswer) : activity.correctAnswer
    });
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = async () => {
    if (!editingActivity.title || !editingActivity.type) {
      showToast(language === 'ar' ? "عنوان السؤال ونوعه مطلوبان" : "Title and type are required", "error");
      return;
    }
    
    try {
      const token = localStorage.getItem("school_admin_token");
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
      const token = localStorage.getItem("school_admin_token");
      const res = await fetch(`${API_URL}/skills-hub/activities/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        showToast(language === 'ar' ? "تم الحذف" : "Deleted", "success");
        fetchActivities(lessonId);
      }
    } catch (e) {
      showToast(language === 'ar' ? "فشل الحذف" : "Delete failed", "error");
    }
  };

  // EXCEL HANDLERS FOR ACTIVITIES
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
        const token = localStorage.getItem("school_admin_token");

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
          const dok = ["1", "2", "3"].includes(dokRaw.replace("DOK ", "")) ? dokRaw.replace("DOK ", "") : "2";
          
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

  // EXCEL HANDLERS FOR LESSON METADATA (STANDARDS & OUTCOMES)
  const downloadMetadataTemplate = (lesson: any) => {
    const wsData = [
      ["Sub-Skill Title", "Standard", "Indicator", "Outcome"],
      [lesson?.name || "Sub-skill", "MATH.3.A.1", "MATH.IND.1", "Understanding tens and ones"],
      [lesson?.name || "Sub-skill", "MATH.3.A.2", "MATH.IND.2", "Time telling accurately"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Metadata Template");
    XLSX.writeFile(wb, "skills_metadata_template.xlsx");
    showToast(language === 'ar' ? "تم تحميل نموذج المعايير" : "Standards template downloaded", "success");
  };

  const handleMetadataExcelChange = async (e: React.ChangeEvent<HTMLInputElement>, lesson: any) => {
    const file = e.target.files?.[0];
    if (!file || !lesson) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        if (rows.length < 2) {
          showToast(language === 'ar' ? "ملف Excel فارغ" : "Excel file is empty", "error");
          return;
        }

        const headers = (rows[0] as string[]).map((h) => String(h).trim().toLowerCase());
        const stdIdx = headers.findIndex(h => h.includes("standard") || h.includes("معيار") || h.includes("المعايير"));
        const indIdx = headers.findIndex(h => h.includes("indicator") || h.includes("مؤشر") || h.includes("المؤشرات"));
        const loIdx = headers.findIndex(h => h.includes("outcome") || h.includes("ناتج") || h.includes("مخرج") || h.includes("النواتج") || h.includes("المخرجات"));
        const titleIdx = headers.findIndex(h => h.includes("title") || h.includes("درس") || h.includes("المهارة"));

        if (stdIdx === -1 && indIdx === -1 && loIdx === -1) {
          showToast(language === 'ar' ? "أعمدة غير متطابقة" : "No matching columns", "error");
          return;
        }

        const dataRows = rows.slice(1).filter(r => r.some(c => String(c).trim() !== ""));
        let filteredRows = dataRows;
        
        if (titleIdx >= 0 && lesson.name) {
          const lessonNameLower = lesson.name.trim().toLowerCase();
          filteredRows = dataRows.filter(r => {
            const rowTitle = String(r[titleIdx] ?? "").trim().toLowerCase();
            return rowTitle && (lessonNameLower.includes(rowTitle) || rowTitle.includes(lessonNameLower));
          });
        }

        if (filteredRows.length === 0) {
          showToast(language === 'ar' ? "لم يتم العثور على بيانات مطابقة" : "No matching data rows", "error");
          return;
        }

        const standardsList = filteredRows.map(r => stdIdx >= 0 ? String(r[stdIdx] ?? "").trim() : "").filter(Boolean);
        const indicatorsList = filteredRows.map(r => indIdx >= 0 ? String(r[indIdx] ?? "").trim() : "").filter(Boolean);
        const outcomesList = filteredRows.map(r => loIdx >= 0 ? String(r[loIdx] ?? "").trim() : "").filter(Boolean);

        const existingMetadata = getLessonMetadata(lesson);
        const nextStandards = Array.from(new Set([...existingMetadata.standards, ...standardsList]));
        const nextIndicators = Array.from(new Set([...existingMetadata.indicators, ...indicatorsList]));
        const nextOutcomes = Array.from(new Set([...existingMetadata.outcomes, ...outcomesList]));

        await saveLessonMetadata(lesson.id, {
          description: existingMetadata.description,
          standards: nextStandards,
          indicators: nextIndicators,
          outcomes: nextOutcomes
        });

        showToast(language === 'ar' ? "تم استيراد المعايير والمؤشرات بنجاح" : "Standards imported successfully", "success");
      } catch (err) {
        console.error("Error importing metadata:", err);
        showToast(language === 'ar' ? "خطأ في قراءة الملف" : "Error reading file", "error");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  // STUDENT PREVIEW PLAY HANDLERS
  const startPreviewActivity = async (act: any, activitiesList?: any[]) => {
    const token = localStorage.getItem("school_admin_token");
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/skills-hub/activities/${act.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const activity = await res.json();
        setPreviewActivity(activity);
        setPreviewAnswer("");
        setPreviewStartTime(Date.now());
        setPreviewHintsUsed(0);
        setPreviewAttemptCount(1);
        setPreviewResult(null);
        if (activitiesList) {
          setPreviewActivitiesList(activitiesList);
        } else {
          const list = activitiesData[act.lessonId] || [];
          setPreviewActivitiesList(list);
        }
      }
    } catch (err) {
      console.error("Error loading activity for preview:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const startPreviewLesson = async (lessonId: string) => {
    const token = localStorage.getItem("school_admin_token");
    if (!token) return;
    try {
      setIsLoading(true);
      let lessonActivities = activitiesData[lessonId];
      if (!lessonActivities) {
        const res = await fetch(`${API_URL}/skills-hub/lessons/${lessonId}/activities`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          lessonActivities = Array.isArray(data) ? data : [];
          setActivitiesData(prev => ({ ...prev, [lessonId]: lessonActivities }));
        }
      }
      if (lessonActivities && lessonActivities.length > 0) {
        await startPreviewActivity(lessonActivities[0], lessonActivities);
      } else {
        showToast(language === 'ar' ? "لا توجد أسئلة في هذا الدرس لمعاينتها." : "No activities in this lesson to preview.", "error");
      }
    } catch (err) {
      console.error("Error starting lesson preview:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentPreviewIdx = previewActivitiesList.findIndex((act: any) => act.id === previewActivity?.id);
  const hasPreviewNext = currentPreviewIdx !== -1 && currentPreviewIdx < previewActivitiesList.length - 1;
  const hasPreviewPrev = currentPreviewIdx > 0;

  const handlePreviewNext = () => {
    if (hasPreviewNext) {
      startPreviewActivity(previewActivitiesList[currentPreviewIdx + 1], previewActivitiesList);
    }
  };

  const handlePreviewPrev = () => {
    if (hasPreviewPrev) {
      startPreviewActivity(previewActivitiesList[currentPreviewIdx - 1], previewActivitiesList);
    }
  };

  const submitPreviewAnswer = async () => {
    const token = localStorage.getItem("school_admin_token");
    if (!token || !previewActivity || previewIsSubmitting) return;
    setPreviewIsSubmitting(true);
    const timeTaken = Math.round((Date.now() - previewStartTime) / 1000);
    
    try {
      const res = await fetch(`${API_URL}/skills-hub/activities/${previewActivity.id}/attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          selectedAnswer: previewAnswer,
          timeTaken,
          hintsUsed: previewHintsUsed,
          attemptCount: previewAttemptCount
        })
      });
      
      if (res.ok) {
        const result = await res.json();
        setPreviewResult(result);
      } else {
        const errData = await res.json();
        showToast(errData.error || (language === 'ar' ? "خطأ في الإرسال" : "Submission failed"), "error");
      }
    } catch (err) {
      console.error("Error submitting preview attempt:", err);
    } finally {
      setPreviewIsSubmitting(false);
    }
  };

  const handlePreviewRetry = () => {
    setPreviewResult(null);
    setPreviewAnswer("");
    setPreviewStartTime(Date.now());
    setPreviewAttemptCount(prev => prev + 1);
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

  const canModify = !clusterData.isCentral && (clusterData.schoolId === schoolId || !clusterData.schoolId);

  return (
    <DashboardLayout>
      {/* Hidden File Input for Excel Upload of Activities */}
      <input 
        type="file" 
        ref={excelInputRef} 
        style={{ display: 'none' }} 
        accept=".xlsx,.xls" 
        onChange={handleExcelUpload} 
      />

      {/* Hidden File Input for Excel Import of Lesson Metadata */}
      <input
        type="file"
        ref={metadataExcelRef}
        style={{ display: "none" }}
        accept=".xlsx,.xls"
        onChange={(e) => {
          const lesson = lessons.find(l => l.id === uploadingLessonId);
          handleMetadataExcelChange(e, lesson);
        }}
      />

      <div className="space-y-6 sm:space-y-10" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Header Section */}
        <div className="relative bg-white rounded-[20px] sm:rounded-[50px] p-4 sm:p-12 overflow-hidden shadow-sm border border-slate-100">
           <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-6 sm:gap-10">
              <div className={`flex flex-col sm:flex-row items-center gap-4 sm:gap-8 ${language === 'ar' ? 'text-right sm:items-start' : 'text-left sm:items-start'}`}>
                 <button 
                   onClick={() => router.push('/school-admin/skills-hub')}
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
                    <p className="text-slate-500 text-[10px] sm:text-lg font-medium max-w-xl">
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
                   disabled={!canModify}
                   className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white transition-all outline-none font-bold text-slate-700 disabled:opacity-60"
                 />
              </div>

              <div className="space-y-3">
                 <label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    {language === 'ar' ? "الوصف" : "Description"}
                 </label>
                 <textarea 
                   value={clusterData.description} onChange={(e) => setClusterData({ ...clusterData, description: e.target.value })}
                   disabled={!canModify}
                   rows={3} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white transition-all outline-none font-bold text-slate-700 resize-none disabled:opacity-60"
                 />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <label className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       {language === 'ar' ? "المرحلة / الصف" : "Grade"} <span className="text-red-500">*</span>
                    </label>
                    <select 
                      value={clusterData.grade} onChange={(e) => setClusterData({ ...clusterData, grade: e.target.value })}
                      disabled={!canModify}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white transition-all outline-none font-bold text-slate-700 appearance-none disabled:opacity-60"
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
                      disabled={!canModify}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white transition-all outline-none font-bold text-slate-700 appearance-none disabled:opacity-60"
                    >
                       <option value="">{language === 'ar' ? "اختر..." : "Select..."}</option>
                       {SUBJECTS.map(subject => <option key={subject} value={subject}>{subject}</option>)}
                    </select>
                 </div>
              </div>

              {canModify && (
                <div className="pt-6 border-t border-slate-100 flex justify-end">
                   <button 
                     onClick={handleUpdateCluster} disabled={isSaving}
                     className="bg-slate-900 text-white px-8 py-4 rounded-xl font-black flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
                   >
                     <Save className="w-5 h-5" />
                     {language === 'ar' ? "تحديث المحور" : "Update Cluster"}
                   </button>
                </div>
              )}
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
               {canModify && (
                 <button 
                   onClick={openAddLesson}
                   className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                 >
                    <Plus className="w-5 h-5" />
                    {language === 'ar' ? "درس جديد" : "New Lesson"}
                 </button>
               )}
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
                              <p className="text-slate-500 text-sm font-bold line-clamp-1">{getCleanDescription(lesson.description) || (language === 'ar' ? "لا يوجد وصف" : "No description")}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                           {(lesson._count?.activities || 0) > 0 && (
                             <button
                               onClick={() => startPreviewLesson(lesson.id)}
                               className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-sm transition-all"
                               title={language === 'ar' ? "معاينة الاختبار كامل" : "Preview Full Test"}
                             >
                               <Play className="w-4 h-4 fill-current text-white" />
                               <span className="hidden md:inline">{language === 'ar' ? "معاينة الاختبار كامل" : "Preview Full Test"}</span>
                             </button>
                           )}
                           <button 
                             onClick={() => toggleLessonExpand(lesson.id)}
                             className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-100 transition-all"
                           >
                              {expandedLessonId === lesson.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              {language === 'ar' ? "الأنشطة" : "Activities"} 
                              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-xs">{lesson._count?.activities || 0}</span>
                           </button>
                           {canModify && (
                             <>
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
                             </>
                           )}
                        </div>
                     </div>

                     {/* Expanded Activities Section */}
                     {expandedLessonId === lesson.id && (
                        <div className="bg-slate-50/50 p-4 sm:p-6 animate-in slide-in-from-top-2 duration-200">
                           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                              <h4 className="font-black text-slate-700 text-sm">{language === 'ar' ? "الأنشطة التفاعلية (أسئلة)" : "Interactive Activities (Questions)"}</h4>
                              <div className="flex items-center gap-2 flex-wrap">
                                {canModify && (
                                  <>
                                    <button 
                                      onClick={() => {
                                        setUploadingLessonId(lesson.id);
                                        excelInputRef.current?.click();
                                      }}
                                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                    >
                                      <Upload className="w-4 h-4" />
                                      {language === 'ar' ? 'استيراد الأنشطة' : 'Import Activities'}
                                    </button>
                                    <button 
                                      onClick={downloadTemplate}
                                      className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-4 py-2 rounded-lg font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                    >
                                      <Download className="w-4 h-4" />
                                      {language === 'ar' ? 'نموذج الأنشطة' : 'Activities Template'}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setUploadingLessonId(lesson.id);
                                        metadataExcelRef.current?.click();
                                      }}
                                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                    >
                                      <Upload className="w-4 h-4" />
                                      {language === 'ar' ? 'استيراد معايير Excel' : 'Import Standards'}
                                    </button>
                                    <button
                                      onClick={() => downloadMetadataTemplate(lesson)}
                                      className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-4 py-2 rounded-lg font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                    >
                                      <Download className="w-4 h-4" />
                                      {language === 'ar' ? 'نموذج المعايير' : 'Standards Template'}
                                    </button>
                                    <button 
                                      onClick={() => openAddActivity(lesson.id)}
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                    >
                                      <Plus className="w-4 h-4" />
                                      {language === 'ar' ? "إضافة نشاط" : "Add Activity"}
                                    </button>
                                  </>
                                )}
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
                                             <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded">{activity.points} XP</span>
                                             <span className="bg-purple-50 text-purple-600 text-[10px] font-black px-2 py-0.5 rounded">DOK {activity.dok || "2"}</span>
                                           </div>
                                           <h5 className="font-black text-slate-800 text-sm truncate">{activity.title}</h5>
                                        </div>
                                     </div>
                                     <div className="flex items-center gap-2 shrink-0">
                                        <button 
                                          onClick={() => startPreviewActivity(activity, activitiesData[lesson.id])}
                                          className="text-slate-400 hover:text-sky-650 p-2 hover:bg-sky-50 rounded-lg transition-all"
                                          title={language === 'ar' ? "معاينة الطالب" : "Student Preview"}
                                        >
                                           <Play className="w-4 h-4 fill-current" />
                                        </button>
                                        {canModify && (
                                          <>
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
                                          </>
                                        )}
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

                {/* Additional Metadata */}
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
                  <select value={editingActivity.dok || "2"} onChange={(e) => setEditingActivity({...editingActivity, dok: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none">
                    <option value="1">DOK 1</option>
                    <option value="2">DOK 2</option>
                    <option value="3">DOK 3</option>
                  </select>
                </div>
              </div>

              {/* Scope & Sequence Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                
                {/* Standard Select */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "المعيار (Standard)" : "Standard"}</label>
                  <select
                    value={editingActivity.standard || ""}
                    onChange={async (e) => {
                      const val = e.target.value;
                      const lesson = lessons.find(l => l.id === editingActivity.lessonId);
                      const lessonMetadata = getLessonMetadata(lesson);
                      
                      if (val === "add_custom") {
                        const newVal = prompt(language === 'ar' ? "أدخل معيار مخصص جديد:" : "Enter custom standard:");
                        if (newVal && newVal.trim()) {
                          const trimmed = newVal.trim();
                          const updatedMetadata = {
                            ...lessonMetadata,
                            standards: Array.from(new Set([...lessonMetadata.standards, trimmed]))
                          };
                          await saveLessonMetadata(editingActivity.lessonId, updatedMetadata);
                          setEditingActivity({ ...editingActivity, standard: trimmed });
                        }
                      } else {
                        setEditingActivity({ ...editingActivity, standard: val });
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                  >
                    <option value="">{language === 'ar' ? '-- اختر المعيار --' : '-- Select Standard --'}</option>
                    {getLessonMetadata(lessons.find(l => l.id === editingActivity.lessonId)).standards.map((std: string) => (
                      <option key={std} value={std}>{std}</option>
                    ))}
                    {editingActivity.standard && !getLessonMetadata(lessons.find(l => l.id === editingActivity.lessonId)).standards.includes(editingActivity.standard) && (
                      <option value={editingActivity.standard}>{editingActivity.standard}</option>
                    )}
                    <option value="add_custom" className="text-indigo-600 font-bold">
                      {language === 'ar' ? '+ إضافة معيار مخصص...' : '+ Add Custom Standard...'}
                    </option>
                  </select>
                </div>

                {/* Indicator Select */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "المؤشر (Indicator)" : "Indicator"}</label>
                  <select
                    value={editingActivity.indicator || ""}
                    onChange={async (e) => {
                      const val = e.target.value;
                      const lesson = lessons.find(l => l.id === editingActivity.lessonId);
                      const lessonMetadata = getLessonMetadata(lesson);
                      
                      if (val === "add_custom") {
                        const newVal = prompt(language === 'ar' ? "أدخل مؤشر مخصص جديد:" : "Enter custom indicator:");
                        if (newVal && newVal.trim()) {
                          const trimmed = newVal.trim();
                          const updatedMetadata = {
                            ...lessonMetadata,
                            indicators: Array.from(new Set([...lessonMetadata.indicators, trimmed]))
                          };
                          await saveLessonMetadata(editingActivity.lessonId, updatedMetadata);
                          setEditingActivity({ ...editingActivity, indicator: trimmed });
                        }
                      } else {
                        setEditingActivity({ ...editingActivity, indicator: val });
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                  >
                    <option value="">{language === 'ar' ? '-- اختر المؤشر --' : '-- Select Indicator --'}</option>
                    {getLessonMetadata(lessons.find(l => l.id === editingActivity.lessonId)).indicators.map((ind: string) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                    {editingActivity.indicator && !getLessonMetadata(lessons.find(l => l.id === editingActivity.lessonId)).indicators.includes(editingActivity.indicator) && (
                      <option value={editingActivity.indicator}>{editingActivity.indicator}</option>
                    )}
                    <option value="add_custom" className="text-indigo-600 font-bold">
                      {language === 'ar' ? '+ إضافة مؤشر مخصص...' : '+ Add Custom Indicator...'}
                    </option>
                  </select>
                </div>

                {/* Learning Outcome Select */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "مخرجات التعلم (Learning Outcome)" : "Learning Outcome"}</label>
                  <select
                    value={editingActivity.learningOutcome || ""}
                    onChange={async (e) => {
                      const val = e.target.value;
                      const lesson = lessons.find(l => l.id === editingActivity.lessonId);
                      const lessonMetadata = getLessonMetadata(lesson);
                      
                      if (val === "add_custom") {
                        const newVal = prompt(language === 'ar' ? "أدخل مخرج تعلم مخصص جديد:" : "Enter custom learning outcome:");
                        if (newVal && newVal.trim()) {
                          const trimmed = newVal.trim();
                          const updatedMetadata = {
                            ...lessonMetadata,
                            outcomes: Array.from(new Set([...lessonMetadata.outcomes, trimmed]))
                          };
                          await saveLessonMetadata(editingActivity.lessonId, updatedMetadata);
                          setEditingActivity({ ...editingActivity, learningOutcome: trimmed });
                        }
                      } else {
                        setEditingActivity({ ...editingActivity, learningOutcome: val });
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                  >
                    <option value="">{language === 'ar' ? '-- اختر مخرج التعلم --' : '-- Select Learning Outcome --'}</option>
                    {getLessonMetadata(lessons.find(l => l.id === editingActivity.lessonId)).outcomes.map((out: string) => (
                      <option key={out} value={out}>{out}</option>
                    ))}
                    {editingActivity.learningOutcome && !getLessonMetadata(lessons.find(l => l.id === editingActivity.lessonId)).outcomes.includes(editingActivity.learningOutcome) && (
                      <option value={editingActivity.learningOutcome}>{editingActivity.learningOutcome}</option>
                    )}
                    <option value="add_custom" className="text-indigo-600 font-bold">
                      {language === 'ar' ? '+ إضافة مخرج مخصص...' : '+ Add Custom Outcome...'}
                    </option>
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

              {/* Helpers & Aids */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b pb-2">{language === 'ar' ? "مساعدات التعلم والتغذية الراجعة" : "Learning Aids & Feedback"}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 block">{language === 'ar' ? "تلميح للطالب (Hint)" : "Student Hint"}</label>
                    <textarea 
                      value={editingActivity.hint || ""} onChange={(e) => setEditingActivity({...editingActivity, hint: e.target.value})}
                      rows={2} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 block">{language === 'ar' ? "نصيحة ذكية (Tip)" : "Smart Tip"}</label>
                    <textarea 
                      value={editingActivity.tip || ""} onChange={(e) => setEditingActivity({...editingActivity, tip: e.target.value})}
                      rows={2} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 block">{language === 'ar' ? "شرح الإجابة المفصل (Answer Explanation)" : "Detailed Explanation"}</label>
                    <textarea 
                      value={editingActivity.explanation || ""} onChange={(e) => setEditingActivity({...editingActivity, explanation: e.target.value})}
                      rows={2} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 block">{language === 'ar' ? "فكرة جوهرية (Key Insight)" : "Key Insight"}</label>
                    <textarea 
                      value={editingActivity.keyInsight || ""} onChange={(e) => setEditingActivity({...editingActivity, keyInsight: e.target.value})}
                      rows={2} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none resize-none"
                    />
                  </div>
                </div>
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

      {/* Student Preview Play Modal */}
      {mounted && previewActivity && createPortal(
        <div className="fixed inset-0 z-[150] bg-slate-900/65 backdrop-blur-md flex items-center justify-center p-0 md:p-6 overflow-y-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 w-full max-w-5xl md:rounded-[40px] shadow-2xl flex flex-col min-h-screen md:min-h-[85vh] md:max-h-[90vh] overflow-y-auto md:overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200">
            
            {/* Game Player Header */}
            <div className="bg-gradient-to-r from-indigo-700 to-violet-850 p-6 text-white flex justify-between items-center shadow-md">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300 floating animate-pulse" />
                  <span className="text-[10px] font-black tracking-widest uppercase">
                    {language === 'ar' ? 'معاينة الطالب' : 'Student Preview'}
                  </span>
                  {previewActivitiesList.length > 1 && (
                    <span className="bg-white/20 px-2.5 py-0.5 rounded text-xs font-black">
                      {currentPreviewIdx + 1} / {previewActivitiesList.length}
                    </span>
                  )}
                </div>
                <h3 className="text-lg md:text-xl font-black truncate max-w-xl">{translateText(previewActivity.title, language)}</h3>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-black">
                  <Clock className="w-4 h-4 text-indigo-200" />
                  <span>{language === 'ar' ? `الزمن المقدر: ${previewActivity.estimatedTime} ثانية` : `Estimated: ${previewActivity.estimatedTime}s`}</span>
                </div>
                <button
                  onClick={() => setPreviewActivity(null)}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition-colors border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Game Player Body */}
            <div className="flex-1 md:overflow-y-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
              
              {/* Right: Helpers Panel */}
              <div className="w-full lg:w-64 space-y-4 shrink-0">
                <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-indigo-500" />
                    {language === 'ar' ? 'تلميحات ومساعدات التعلم' : 'Hints & Learning Aids'}
                  </h4>
                  
                  {/* Hint Button */}
                  <button
                    onClick={() => {
                      setPreviewHintsUsed(prev => prev + 1);
                      setPreviewHelperModal({
                        type: "hint",
                        content: translateText(previewActivity.hint, language) || (language === 'ar' ? "لا يوجد تلميح مسجل لهذا النشاط." : "No hint recorded for this activity.")
                      });
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-amber-100 bg-amber-50/50 hover:bg-amber-50 hover:scale-[1.02] text-amber-800 font-black text-sm transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2">{language === 'ar' ? '💡 فكرة للمساعدة' : '💡 Help Hint'}</span>
                    {language === 'ar' ? <ArrowLeft className="w-4 h-4 text-amber-500" /> : <ArrowRight className="w-4 h-4 text-amber-500" />}
                  </button>

                  {/* Tip Button */}
                  <button
                    onClick={() => {
                      setPreviewHelperModal({
                        type: "tip",
                        content: translateText(previewActivity.tip, language) || (language === 'ar' ? "لا توجد نصيحة ذكية مسجلة." : "No smart tip recorded.")
                      });
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 hover:scale-[1.02] text-emerald-800 font-black text-sm transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2">{language === 'ar' ? '🧠 نصيحة ذكية' : '🧠 Smart Tip'}</span>
                    {language === 'ar' ? <ArrowLeft className="w-4 h-4 text-emerald-500" /> : <ArrowRight className="w-4 h-4 text-emerald-500" />}
                  </button>

                  {/* Key Insight Button */}
                  <button
                    onClick={() => {
                      setPreviewHelperModal({
                        type: "keyInsight",
                        content: translateText(previewActivity.keyInsight, language) || (language === 'ar' ? "لا توجد فكرة جوهرية مسجلة." : "No key insight recorded.")
                      });
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 hover:scale-[1.02] text-indigo-800 font-black text-sm transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2">{language === 'ar' ? '📘 فكرة جوهرية' : '📘 Key Insight'}</span>
                    {language === 'ar' ? <ArrowLeft className="w-4 h-4 text-indigo-500" /> : <ArrowRight className="w-4 h-4 text-indigo-500" />}
                  </button>
                </div>
                
                {/* Metadata display */}
                <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-3 text-xs font-bold text-slate-500">
                  {previewActivity.standard && <p>{language === 'ar' ? '🔍 المعيار: ' : '🔍 Standard: '}<span className="text-slate-800 font-black">{previewActivity.standard}</span></p>}
                  {previewActivity.indicator && <p>{language === 'ar' ? '🎯 المؤشر: ' : '🎯 Indicator: '}<span className="text-slate-800 font-black">{previewActivity.indicator}</span></p>}
                  <p>{language === 'ar' ? '🏆 النقاط: ' : '🏆 Points: '}<span className="text-indigo-600 font-black">{previewActivity.points} {language === 'ar' ? 'نقطة' : 'XP'}</span></p>
                </div>
              </div>

              {/* Left: Interactive Workspace */}
              <div className="flex-1 bg-white rounded-3xl border border-slate-150 p-6 md:p-8 flex flex-col justify-between shadow-sm min-h-[400px]">
                
                {/* Renderer */}
                <div className="space-y-6 flex-1">
                  <InteractiveQuestionRenderer
                    question={previewActivity}
                    value={previewAnswer}
                    onChange={setPreviewAnswer}
                    language={language}
                  />
                </div>

                {/* Submission Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
                  <button
                    onClick={() => setPreviewActivity(null)}
                    className="px-6 py-3.5 rounded-2xl bg-slate-50/80 border-2 border-slate-200/60 text-slate-900 hover:bg-slate-100 font-black text-sm transition-all active:scale-95 w-full sm:w-auto cursor-pointer"
                  >
                    {language === 'ar' ? 'إغلاق المعاينة' : 'Close Preview'}
                  </button>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-center">
                    <button
                      type="button"
                      onClick={handlePreviewPrev}
                      disabled={!hasPreviewPrev}
                      className={`px-5 py-3.5 rounded-2xl border-2 font-black text-sm transition-all active:scale-95 flex items-center gap-2 w-full sm:w-auto justify-center ${
                        hasPreviewPrev
                          ? "bg-slate-50/80 border-2 border-slate-200/60 text-slate-900 hover:bg-slate-100 cursor-pointer"
                          : "bg-slate-50/30 border-2 border-slate-200/20 text-slate-350 cursor-not-allowed"
                      }`}
                    >
                      {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                      <span>{language === 'ar' ? 'السابق' : 'Previous'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePreviewNext}
                      disabled={!hasPreviewNext}
                      className={`px-5 py-3.5 rounded-2xl border-2 font-black text-sm transition-all active:scale-95 flex items-center gap-2 w-full sm:w-auto justify-center ${
                        hasPreviewNext
                          ? "bg-slate-50/80 border-2 border-slate-200/60 text-slate-900 hover:bg-slate-100 cursor-pointer"
                          : "bg-slate-50/30 border-2 border-slate-200/20 text-slate-350 cursor-not-allowed"
                      }`}
                    >
                      <span>{language === 'ar' ? 'التالي' : 'Next'}</span>
                      {language === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    onClick={submitPreviewAnswer}
                    disabled={!previewAnswer || previewIsSubmitting}
                    className={`px-10 py-3.5 rounded-2xl font-black text-sm transition-all flex items-center gap-2 active:scale-95 w-full sm:w-auto justify-center cursor-pointer ${
                      !previewAnswer || previewIsSubmitting
                        ? "bg-sky-200/40 text-slate-400 cursor-not-allowed border border-sky-300/10 shadow-none"
                        : "bg-sky-500 text-slate-950 hover:bg-sky-650 shadow-xl shadow-sky-200/40 border border-sky-500/20"
                    }`}
                  >
                    {previewIsSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {language === 'ar' ? 'جاري التقييم...' : 'Evaluating...'}
                      </>
                    ) : (
                      <>
                        <span>{language === 'ar' ? 'أرسل الحل للتصحيح' : 'Submit for review'}</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* PREVIEW ATTEMPT RESULT POPUP MODAL (Inside Player) */}
            {previewResult && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[160] overflow-y-auto">
                <div className="bg-white w-full max-w-lg rounded-[36px] shadow-2xl p-8 border border-slate-100 text-center space-y-6 animate-in zoom-in-95 duration-200 animate-none">
                  
                  {/* Stars animation */}
                  <div className="space-y-4">
                    <div className="flex justify-center gap-3">
                      {[1, 2, 3].map(index => {
                        const isFilled = index <= previewResult.stars;
                        return isFilled ? (
                          <Star key={index} className="w-16 h-16 fill-amber-400 text-amber-400 drop-shadow-md scale-[1.1] animate-pulse" />
                        ) : (
                          <StarOff key={index} className="w-16 h-16 text-slate-200" />
                        );
                      })}
                    </div>
                    
                    <h4 className={`text-2xl font-black ${
                      previewResult.isCorrect ? "text-emerald-600" : "text-rose-600"
                    }`}>
                      {previewResult.isCorrect ? (
                        previewResult.stars === 3 
                          ? (language === 'ar' ? "ممتاز! حل مثالي ورائع 🏆" : "Excellent! Perfect solution 🏆") 
                          : previewResult.stars === 2
                          ? (language === 'ar' ? "رائع! إجابة صحيحة ⭐⭐" : "Great! Correct ⭐⭐")
                          : (language === 'ar' ? "جيد! تم الحل ⭐" : "Good! Solved ⭐")
                      ) : (
                        (language === 'ar' ? "حاول مرة أخرى! ❌" : "Try again! ❌")
                      )}
                    </h4>

                    {previewResult.explanation && (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 text-slate-600 text-sm font-bold text-start space-y-1">
                        <span className="text-xs text-slate-400 font-black uppercase tracking-wider block">{language === 'ar' ? "شرح وتفسير الإجابة:" : "Explanation:"}</span>
                        <p>{translateText(previewResult.explanation, language)}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center gap-3">
                    {!previewResult.isCorrect && (
                      <button
                        onClick={handlePreviewRetry}
                        className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-sm transition-all active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer"
                      >
                        {language === 'ar' ? "حاول مجدداً" : "Retry"}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setPreviewResult(null);
                        setPreviewActivity(null);
                      }}
                      className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg shadow-slate-900/10 cursor-pointer"
                    >
                      {language === 'ar' ? "إغلاق نافذة المعاينة" : "Close Workspace"}
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>,
        document.body
      )}

      {/* Helper Modal Popup inside play preview */}
      {mounted && previewHelperModal.type && createPortal(
        <div className="fixed inset-0 z-[170] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-6 border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-500" />
              {previewHelperModal.type === "hint" && (language === 'ar' ? "💡 فكرة للمساعدة (Hint)" : "💡 Hint")}
              {previewHelperModal.type === "tip" && (language === 'ar' ? "🧠 نصيحة ذكية (Tip)" : "🧠 Smart Tip")}
              {previewHelperModal.type === "keyInsight" && (language === 'ar' ? "📘 فكرة جوهرية (Key Insight)" : "📘 Key Insight")}
            </h4>
            <p className="text-slate-600 text-sm font-bold leading-relaxed">{previewHelperModal.content}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setPreviewHelperModal({ type: null, content: "" })}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
              >
                {language === 'ar' ? "حسناً" : "Close"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </DashboardLayout>
  );
}
