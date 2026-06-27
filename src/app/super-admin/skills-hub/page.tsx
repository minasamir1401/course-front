"use client";

import React, { useEffect, useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles, Plus, Trash2, Edit, ChevronDown, ChevronUp,
  ArrowRight, ArrowLeft, Save, CheckCircle2, AlertCircle, X,
  Folder, BookOpen, FileText, Info, HelpCircle, Layers, Settings, Globe, School
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import InteractiveQuestionEditor from "@/components/InteractiveQuestionEditor";

export default function SuperAdminSkillsHubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get("action");
  const { language } = useLanguage();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [subject, setSubject] = useState<string>("الرياضيات");
  const [grade, setGrade] = useState<string>("الصف الثالث الابتدائي");

  // Data Lists
  const [clusters, setClusters] = useState<any[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  
  // Schools List
  const [schools, setSchools] = useState<any[]>([]);

  // Active Modes
  const [activeTab, setActiveTab] = useState<"list" | "activity-form">("list");
  const [editingActivity, setEditingActivity] = useState<any>(null);

  // Modal States
  const [clusterModal, setClusterModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });
  const [lessonModal, setLessonModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });

  // Activity Form States
  const [activityForm, setActivityForm] = useState<any>({
    titleAr: "",
    titleEn: "",
    type: "MCQ",
    options: "[]",
    correctAnswer: "",
    points: 10,
    difficulty: "Medium",
    dok: "2",
    estimatedTime: 60,
    standard: "",
    indicator: "",
    learningOutcomeAr: "",
    learningOutcomeEn: "",
    hintAr: "",
    hintEn: "",
    tipAr: "",
    tipEn: "",
    explanationAr: "",
    explanationEn: "",
    keyInsightAr: "",
    keyInsightEn: ""
  });

  // Auto-Save States & Refs
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const autoSaveTimeoutRef = useRef<any>(null);
  const isFirstLoadRef = useRef<boolean>(true);

  const GRADES_LIST = [
    "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي",
    "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
    "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
  ];

  // Helper State Modifiers
  const updateActivityForm = (key: string, val: any) => {
    setActivityForm((prev: any) => ({ ...prev, [key]: val }));
  };

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

  const getGradeLabel = (g: string) => {
    if (language === "ar") return g;
    const map: Record<string, string> = {
      "الصف الأول الابتدائي": "Grade 1 Primary",
      "الصف الثاني الابتدائي": "Grade 2 Primary",
      "الصف الثالث الابتدائي": "Grade 3 Primary",
      "الصف الرابع الابتدائي": "Grade 4 Primary",
      "الصف الخامس الابتدائي": "Grade 5 Primary",
      "الصف السادس الابتدائي": "Grade 6 Primary",
      "الصف الأول الإعدادي": "Grade 7 Preparatory",
      "الصف الثاني الإعدادي": "Grade 8 Preparatory",
      "الصف الثالث الإعدادي": "Grade 9 Preparatory",
      "الصف الأول الثانوي": "Grade 10 Secondary",
      "الصف الثاني الثانوي": "Grade 11 Secondary",
      "الصف الثالث الثانوي": "Grade 12 Secondary"
    };
    return map[g] || g;
  };

  const updateClusterModalData = (key: string, val: any) => {
    setClusterModal((prev: any) => ({
      ...prev,
      data: { ...prev.data, [key]: val }
    }));
  };

  const updateLessonModalData = (key: string, val: any) => {
    setLessonModal((prev: any) => ({
      ...prev,
      data: { ...prev.data, [key]: val }
    }));
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("super_admin_token");
    if (!storedToken) {
      router.push("/super-admin/login");
      return;
    }
    setToken(storedToken);
    fetchClusters(storedToken, subject, grade);
    fetchSchools(storedToken);
  }, [router, subject, grade]);

  useEffect(() => {
    if (action === "add-cluster" && token) {
      setClusterModal({ open: true, data: { name: "", description: "", isCentral: true, schoolId: "" } });
    }
  }, [action, token]);

  // Fetch Clusters
  const fetchClusters = async (authToken: string, currentSubject: string, currentGrade: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/skills-hub/clusters?subject=${encodeURIComponent(currentSubject)}&grade=${encodeURIComponent(currentGrade)}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setClusters(data);
      }
    } catch (err) {
      console.error("Error fetching clusters:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Schools
  const fetchSchools = async (authToken: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/schools?limit=100`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSchools(data.schools || []);
      }
    } catch (err) {
      console.error("Error fetching schools:", err);
    }
  };

  // Fetch Lessons for a Cluster
  const fetchLessons = async (clusterId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/skills-hub/clusters/${clusterId}/lessons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLessons(data);
        setSelectedLesson(null);
        setActivities([]);
      }
    } catch (err) {
      console.error("Error fetching lessons:", err);
    }
  };

  // Fetch Activities for a Lesson
  const fetchActivities = async (lessonId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/skills-hub/lessons/${lessonId}/activities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error("Error fetching activities:", err);
    }
  };

  // Select Cluster
  const handleSelectCluster = (cluster: any) => {
    setSelectedCluster(cluster);
    fetchLessons(cluster.id);
  };

  // Select Lesson
  const handleSelectLesson = (lesson: any) => {
    setSelectedLesson(lesson);
    fetchActivities(lesson.id);
  };

  // Cluster Create / Update
  const handleSaveCluster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const isEdit = !!clusterModal.data?.id;
    const url = isEdit
      ? `${API_URL}/skills-hub/clusters/${clusterModal.data.id}`
      : `${API_URL}/skills-hub/clusters`;
    const method = isEdit ? "PUT" : "POST";

    const payload = {
      name: clusterModal.data.name,
      description: clusterModal.data.description,
      subject,
      grade,
      isCentral: !!clusterModal.data.isCentral,
      schoolId: clusterModal.data.isCentral ? null : (clusterModal.data.schoolId || null)
    };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setClusterModal({ open: false, data: null });
        fetchClusters(token, subject, grade);
        if (isEdit && selectedCluster?.id === clusterModal.data.id) {
          setSelectedCluster(null);
          setLessons([]);
          setSelectedLesson(null);
          setActivities([]);
        }
      }
    } catch (err) {
      console.error("Error saving cluster:", err);
    }
  };

  // Delete Cluster
  const handleDeleteCluster = async (id: string) => {
    if (!token || !confirm("هل أنت متأكد من حذف هذا المحور المهاراتي بالكامل؟ سيتم حذف جميع المهارات والأنشطة التابعة له.")) return;
    try {
      const res = await fetch(`${API_URL}/skills-hub/clusters/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchClusters(token, subject, grade);
        if (selectedCluster?.id === id) {
          setSelectedCluster(null);
          setLessons([]);
          setSelectedLesson(null);
          setActivities([]);
        }
      }
    } catch (err) {
      console.error("Error deleting cluster:", err);
    }
  };

  // Lesson Create / Update
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCluster) return;
    const isEdit = !!lessonModal.data?.id;
    const url = isEdit
      ? `${API_URL}/skills-hub/lessons/${lessonModal.data.id}`
      : `${API_URL}/skills-hub/lessons`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          clusterId: selectedCluster.id,
          name: lessonModal.data.name,
          description: lessonModal.data.description,
          order: Number(lessonModal.data.order) || 0
        })
      });

      if (res.ok) {
        setLessonModal({ open: false, data: null });
        fetchLessons(selectedCluster.id);
      }
    } catch (err) {
      console.error("Error saving lesson:", err);
    }
  };

  // Delete Lesson
  const handleDeleteLesson = async (id: string) => {
    if (!token || !confirm("هل أنت متأكد من حذف هذه المهارة الفرعية؟ سيتم حذف الأنشطة التابعة لها.")) return;
    try {
      const res = await fetch(`${API_URL}/skills-hub/lessons/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchLessons(selectedCluster.id);
        if (selectedLesson?.id === id) {
          setSelectedLesson(null);
          setActivities([]);
        }
      }
    } catch (err) {
      console.error("Error deleting lesson:", err);
    }
  };

  const getFieldVal = (val: string | null, lang: "ar" | "en") => {
    if (!val) return "";
    try {
      const parsed = JSON.parse(val);
      if (parsed && typeof parsed === "object") {
        return parsed[lang] || "";
      }
    } catch {}
    return lang === "ar" ? val : "";
  };

  // Create Activity Handler
  const handleOpenActivityCreate = () => {
    if (!selectedLesson) return;
    setEditingActivity(null);
    isFirstLoadRef.current = true;
    setAutoSaveStatus("idle");
    setActivityForm({
      titleAr: "",
      titleEn: "",
      type: "MCQ",
      options: JSON.stringify({ choices: ["", "", "", ""] }),
      correctAnswer: "",
      points: 10,
      difficulty: "Medium",
      dok: "2",
      estimatedTime: 60,
      standard: "",
      indicator: "",
      learningOutcomeAr: "",
      learningOutcomeEn: "",
      hintAr: "",
      hintEn: "",
      tipAr: "",
      tipEn: "",
      explanationAr: "",
      explanationEn: "",
      keyInsightAr: "",
      keyInsightEn: ""
    });
    setActiveTab("activity-form");
  };

  // Edit Activity Handler
  const handleOpenActivityEdit = (act: any) => {
    setEditingActivity(act);
    isFirstLoadRef.current = true;
    setAutoSaveStatus("idle");
    setActivityForm({
      titleAr: getFieldVal(act.title, "ar"),
      titleEn: getFieldVal(act.title, "en"),
      type: act.type,
      options: typeof act.options === "string" ? act.options : JSON.stringify(act.options),
      correctAnswer: typeof act.correctAnswer === "string" ? act.correctAnswer : JSON.stringify(act.correctAnswer),
      points: act.points,
      difficulty: act.difficulty,
      dok: act.dok || "2",
      estimatedTime: act.estimatedTime,
      standard: act.standard || "",
      indicator: act.indicator || "",
      learningOutcomeAr: getFieldVal(act.learningOutcome, "ar"),
      learningOutcomeEn: getFieldVal(act.learningOutcome, "en"),
      hintAr: getFieldVal(act.hint, "ar"),
      hintEn: getFieldVal(act.hint, "en"),
      tipAr: getFieldVal(act.tip, "ar"),
      tipEn: getFieldVal(act.tip, "en"),
      explanationAr: getFieldVal(act.explanation, "ar"),
      explanationEn: getFieldVal(act.explanation, "en"),
      keyInsightAr: getFieldVal(act.keyInsight, "ar"),
      keyInsightEn: getFieldVal(act.keyInsight, "en")
    });
    setActiveTab("activity-form");
  };

  // Submit Activity
  const handleSaveActivity = async () => {
    if (!token || !selectedLesson) return;
    const isEdit = !!editingActivity;
    const url = isEdit
      ? `${API_URL}/skills-hub/activities/${editingActivity.id}`
      : `${API_URL}/skills-hub/activities`;
    const method = isEdit ? "PUT" : "POST";

    const payload = {
      lessonId: selectedLesson.id,
      ...activityForm,
      title: JSON.stringify({ ar: activityForm.titleAr, en: activityForm.titleEn }),
      hint: JSON.stringify({ ar: activityForm.hintAr, en: activityForm.hintEn }),
      tip: JSON.stringify({ ar: activityForm.tipAr, en: activityForm.tipEn }),
      explanation: JSON.stringify({ ar: activityForm.explanationAr, en: activityForm.explanationEn }),
      keyInsight: JSON.stringify({ ar: activityForm.keyInsightAr, en: activityForm.keyInsightEn }),
      learningOutcome: JSON.stringify({ ar: activityForm.learningOutcomeAr, en: activityForm.learningOutcomeEn }),
      options: typeof activityForm.options === "string" ? activityForm.options : JSON.stringify(activityForm.options),
      correctAnswer: typeof activityForm.correctAnswer === "string" ? activityForm.correctAnswer : JSON.stringify(activityForm.correctAnswer)
    };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setActiveTab("list");
        fetchActivities(selectedLesson.id);
      } else {
        const err = await res.json();
        alert(err.error || "حدث خطأ أثناء حفظ النشاط");
      }
    } catch (err) {
      console.error("Error saving activity:", err);
    }
  };

  // Auto-Save Effect Hook
  useEffect(() => {
    if (activeTab !== "activity-form" || !token || !selectedLesson) return;
    
    // Avoid saving on initial load
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      return;
    }

    setAutoSaveStatus("saving");
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const isEdit = !!editingActivity;
        const url = isEdit
          ? `${API_URL}/skills-hub/activities/${editingActivity.id}`
          : `${API_URL}/skills-hub/activities`;
        const method = isEdit ? "PUT" : "POST";

        const payload = {
          lessonId: selectedLesson.id,
          ...activityForm,
          title: JSON.stringify({ ar: activityForm.titleAr, en: activityForm.titleEn }),
          hint: JSON.stringify({ ar: activityForm.hintAr, en: activityForm.hintEn }),
          tip: JSON.stringify({ ar: activityForm.tipAr, en: activityForm.tipEn }),
          explanation: JSON.stringify({ ar: activityForm.explanationAr, en: activityForm.explanationEn }),
          keyInsight: JSON.stringify({ ar: activityForm.keyInsightAr, en: activityForm.keyInsightEn }),
          learningOutcome: JSON.stringify({ ar: activityForm.learningOutcomeAr, en: activityForm.learningOutcomeEn }),
          options: typeof activityForm.options === "string" ? activityForm.options : JSON.stringify(activityForm.options),
          correctAnswer: typeof activityForm.correctAnswer === "string" ? activityForm.correctAnswer : JSON.stringify(activityForm.correctAnswer)
        };

        const res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          if (!isEdit && data.activity) {
            setEditingActivity(data.activity);
          }
          setAutoSaveStatus("saved");
          fetchActivities(selectedLesson.id);
        } else {
          setAutoSaveStatus("error");
        }
      } catch (err) {
        console.error("Auto-save failed:", err);
        setAutoSaveStatus("error");
      }
    }, 1500);

    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [activityForm]);

  const handleSeedDemoActivities = async () => {
    if (!token || !selectedLesson) return;
    if (!confirm("هل أنت متأكد من توليد 24 نشاطاً تجريبياً (مثال لكل نوع) في هذه المهارة الفرعية؟")) return;
    
    const demoActivities = [
      {
        title: "تحدي اختيار من متعدد - عواصم الدول",
        type: "MCQ",
        options: { choices: ["القاهرة", "الرياض", "المنامة", "عمان"] },
        correctAnswer: "القاهرة",
        points: 10,
        difficulty: "Easy"
      },
      {
        title: "صح أم خطأ - كوكب الأرض",
        type: "TRUE_FALSE",
        options: { choices: ["صح", "خطأ"] },
        correctAnswer: "صح",
        points: 10,
        difficulty: "Easy"
      },
      {
        title: "اختيارات متعددة - الأعداد الأولية أصغر من 10",
        type: "MULTI_SELECT",
        options: { choices: ["2", "3", "4", "5"] },
        correctAnswer: ["2", "3", "5"],
        points: 15,
        difficulty: "Medium"
      },
      {
        title: "توصيل المفاهيم - عواصم وقارات",
        type: "MATCHING",
        options: { left: ["مصر", "فرنسا", "اليابان"], right: ["القاهرة", "باريس", "طوكيو"] },
        correctAnswer: { "مصر": "القاهرة", "فرنسا": "باريس", "اليابان": "طوكيو" },
        points: 15,
        difficulty: "Medium"
      },
      {
        title: "سحب الفراغات - الاتجاهات الأساسية",
        type: "DRAG_DROP_FILL",
        options: { sentence: "تشرق الشمس من [slot0] وتغرب من [slot1].", choices: ["الشرق", "الغرب", "الشمال", "الجنوب"] },
        correctAnswer: ["الشرق", "الغرب"],
        points: 15,
        difficulty: "Medium"
      },
      {
        title: "تصنيف المجموعات - كائنات حية وأشياء جامدة",
        type: "GROUP_SORTING",
        options: { groups: ["حيوان", "نبات"], items: ["أسد", "تفاحة", "نمر", "شجرة موز"] },
        correctAnswer: { "أسد": "حيوان", "تفاحة": "نبات", "نمر": "حيوان", "شجرة موز": "نبات" },
        points: 20,
        difficulty: "Hard"
      },
      {
        title: "قراءة عقارب الساعة - الخامسة والنصف",
        type: "CLOCK",
        options: { minuteStep: 5 },
        correctAnswer: "05:30",
        points: 10,
        difficulty: "Easy"
      },
      {
        title: "خريطة المفاهيم - أركان الإسلام",
        type: "MIND_MAP",
        options: { nodes: [{ id: "1", label: "أركان الإسلام", parent: null, isBlank: false }, { id: "2", label: "شهادة أن لا إله إلا الله", parent: "1", isBlank: true }, { id: "3", label: "إقام الصلاة", parent: "1", isBlank: true }] },
        correctAnswer: { "2": "شهادة أن لا إله إلا الله", "3": "إقام الصلاة" },
        points: 20,
        difficulty: "Hard"
      },
      {
        title: "فيديو تفاعلي - رحلة في الكون الفسيح",
        type: "VIDEO_CHECKPOINT",
        options: { videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", checkpoints: [{ time: 10, question: "ما هو الكوكب الأقرب للشمس؟", choices: ["عطارد", "الزهرة", "الأرض"] }] },
        correctAnswer: { "10": "عطارد" },
        points: 20,
        difficulty: "Medium"
      },
      {
        title: "خط الأعداد - تحديد المنتصف بين 0 و 20",
        type: "NUMBER_LINE",
        options: { min: 0, max: 20, step: 2, labels: ["0", "10", "20"] },
        correctAnswer: "10",
        points: 10,
        difficulty: "Easy"
      },
      {
        title: "فرز سريع - الأعداد الزوجية والفردية",
        type: "SWIPE_SORT",
        options: { leftGroup: "فردي", rightGroup: "زوجي", items: ["3", "8", "15", "22"] },
        correctAnswer: { "3": "left", "8": "right", "15": "left", "22": "right" },
        points: 15,
        difficulty: "Medium"
      },
      {
        title: "المتاهة التعليمية - مسار الأرقام الصحيح",
        type: "MAZE",
        options: { mazeGrid: [[1,1,0,0,0],[0,1,1,0,0],[0,0,1,1,0],[0,0,0,1,1],[0,0,0,0,1]], start: [0, 0], end: [4, 4] },
        correctAnswer: ["0,0", "0,1", "1,1", "1,2", "2,2", "2,3", "3,3", "3,4", "4,4"],
        points: 20,
        difficulty: "Hard"
      },
      {
        title: "البحث عن الكلمات - الفواكه اللذيذة",
        type: "WORD_SEARCH",
        options: { grid: [["ت", "ف", "ا", "ح", "خ", "ص", "ض", "ط"], ["م", "و", "ز", "ع", "غ", "ف", "ق", "ك"], ["ا", "ل", "ل", "هـ", "و", "ي", "ب", "ت"], ["ج", "ح", "خ", "د", "ذ", "ر", "ز", "س"], ["ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف"], ["ق", "ك", "ل", "م", "ن", "هـ", "و", "ي"], ["ا", "ب", "ت", "ث", "ج", "ح", "خ", "د"], ["ذ", "ر", "ز", "س", "ش", "ص", "ض", "ط"]], words: ["تفاح", "موز"] },
        correctAnswer: ["تفاح", "موز"],
        points: 15,
        difficulty: "Medium"
      },
      {
        title: "جيوجيبرا - رسم مثلث قائم الزاوية",
        type: "GEOGEBRA",
        options: { materialId: "m9b7v5cx", width: 800, height: 500, iframeUrl: "https://www.geogebra.org/material/iframe/id/m9b7v5cx" },
        correctAnswer: "90",
        points: 20,
        difficulty: "Hard"
      },
      {
        title: "البطاقة التعليمية - عاصمة جمهورية مصر العربية",
        type: "FLASH_CARD",
        options: { front: "ما هي عاصمة مصر؟", back: "القاهرة" },
        correctAnswer: "القاهرة",
        points: 10,
        difficulty: "Easy"
      },
      {
        title: "لعبة الذاكرة - مرادفات الكلمات العربية",
        type: "MEMORY_GAME",
        options: { pairs: [{ left: "سعيد", right: "مبتهج" }, { left: "حزين", right: "كئيب" }] },
        correctAnswer: [{ left: "سعيد", right: "مبتهج" }, { left: "حزين", right: "كئيب" }],
        points: 15,
        difficulty: "Medium"
      },
      {
        title: "ترتيب حروف الكلمة - مدرسة",
        type: "WORD_SCRAMBLE",
        options: { word: "مدرسة" },
        correctAnswer: "مدرسة",
        points: 10,
        difficulty: "Easy"
      },
      {
        title: "ترتيب الكلمات لتكوين جملة صحيحة",
        type: "SENTENCE_REORDER",
        options: { words: ["العلم", "نور", "والجهل", "ظلام"] },
        correctAnswer: "العلم نور والجهل ظلام",
        points: 15,
        difficulty: "Medium"
      },
      {
        title: "معادلة حسابية - حساب قيمة x",
        type: "MATH_EQUATION",
        options: { equation: "3x + 6 = 15" },
        correctAnswer: "3",
        points: 15,
        difficulty: "Medium"
      },
      {
        title: "ترتيب تسلسل دورة حياة الفراشة",
        type: "SEQUENCE_ORDER",
        options: { items: ["بيضة", "يرقة", "شرنقة", "فراشة كاملة"] },
        correctAnswer: ["بيضة", "يرقة", "شرنقة", "فراشة كاملة"],
        points: 15,
        difficulty: "Medium"
      },
      {
        title: "الكلمات المتقاطعة - لغز حيوانات الغابة",
        type: "CROSSWORD",
        options: { words: [{ word: "أسد", clue: "ملك الغابة" }, { word: "فيل", clue: "أضخم حيوان بري" }] },
        correctAnswer: [{ word: "أسد", clue: "ملك الغابة" }, { word: "فيل", clue: "أضخم حيوان بري" }],
        points: 20,
        difficulty: "Hard"
      },
      {
        title: "عد العناصر - كم عدد التفاحات الحمراء؟",
        type: "COUNT_OBJECTS",
        options: { itemImage: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200", itemName: "تفاحة" },
        correctAnswer: "5",
        points: 10,
        difficulty: "Easy"
      },
      {
        title: "تسمية أجزاء زهرة النبات على الصورة",
        type: "IMAGE_LABEL",
        options: { imageUrl: "https://images.unsplash.com/photo-1507290439931-a8e02da4b8e0?w=600", labels: [{ text: "الأوراق", x: 30, y: 70 }, { text: "البتلات", x: 50, y: 30 }] },
        correctAnswer: [{ text: "الأوراق", x: 30, y: 70 }, { text: "البتلات", x: 50, y: 30 }],
        points: 20,
        difficulty: "Hard"
      },
      {
        title: "تطابق الألوان - الفواكه والألوان المناسبة",
        type: "COLOR_MATCH",
        options: { pairs: [{ item: "فراولة", color: "أحمر" }, { item: "موز", color: "أصفر" }] },
        correctAnswer: [{ item: "فراولة", color: "أحمر" }, { item: "موز", color: "أصفر" }],
        points: 15,
        difficulty: "Medium"
      }
    ];

    try {
      for (const act of demoActivities) {
        const payload = {
          lessonId: selectedLesson.id,
          title: act.title,
          type: act.type,
          options: JSON.stringify(act.options),
          correctAnswer: JSON.stringify(act.correctAnswer),
          points: act.points,
          difficulty: act.difficulty,
          dok: "2",
          estimatedTime: 60,
          standard: "",
          indicator: "",
          learningOutcome: "",
          hint: "",
          tip: "",
          explanation: "",
          keyInsight: ""
        };

        await fetch(`${API_URL}/skills-hub/activities`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }
      fetchActivities(selectedLesson.id);
      alert("تم توليد الـ 24 نشاطاً تجريبياً بنجاح! يمكنك الآن استعراضها وتعديلها.");
    } catch (err) {
      console.error("Error seeding demo activities:", err);
      alert("حدث خطأ أثناء توليد الأنشطة التجريبية.");
    }
  };

  // Delete Activity
  const handleDeleteActivity = async (id: string) => {
    if (!token || !confirm("هل أنت متأكد من حذف هذا النشاط التفاعلي؟")) return;
    try {
      const res = await fetch(`${API_URL}/skills-hub/activities/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchActivities(selectedLesson.id);
      }
    } catch (err) {
      console.error("Error deleting activity:", err);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-24 px-4 overflow-x-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="space-y-2 text-right">
            <div className="flex items-center gap-2 text-slate-800 font-black">
              <Sparkles className="w-5 h-5 text-indigo-650 floating" />
              <span>{language === 'ar' ? 'لوحة الإشراف العام للـ Super Admin' : 'Super Admin General Panel'}</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight">
              {language === 'ar' ? 'إدارة مكتبة المهارات المركزية والخاصة' : 'Central & Scoped Skills Library'}
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              {language === 'ar' ? 'أضف محاور، مهارات، وأنشطة تعليمية تفاعلية مركزية للكل أو مخصصة لمدارس معينة بالتفصيل.' : 'Add clusters, skills, and interactive learning activities centrally or school-specific.'}
            </p>
          </div>
          
          {/* Main filters inside header */}
          {activeTab === "list" && (
            <div className="flex flex-wrap gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
              {/* Subject Select */}
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-black outline-none focus:border-indigo-500"
              >
                <option value="الرياضيات">{language === 'ar' ? '📐 الرياضيات' : '📐 Mathematics'}</option>
                <option value="القراءة">{language === 'ar' ? '📚 القراءة' : '📚 Reading'}</option>
                <option value="العلوم">{language === 'ar' ? '🔬 العلوم' : '🔬 Science'}</option>
              </select>

              {/* Grade Select */}
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-black outline-none focus:border-indigo-500"
              >
                {GRADES_LIST.map((g) => (
                  <option key={g} value={g}>{getGradeLabel(g)}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ── LIST TAB VIEW ── */}
        {activeTab === "list" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 1. Skill Clusters Column (Left 1/3) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                  <Folder className="w-5 h-5 text-indigo-500" />
                  {language === 'ar' ? 'المحاور (Clusters)' : 'Skill Clusters'}
                </h3>
                <button
                  onClick={() => setClusterModal({ open: true, data: { name: "", description: "", isCentral: true, schoolId: "" } })}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-black text-xs flex items-center gap-1 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  {language === 'ar' ? 'أضف محور' : 'Add Cluster'}
                </button>
              </div>

              {isLoading ? (
                <div className="text-center py-12 text-slate-400 font-bold">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
              ) : clusters.length > 0 ? (
                <div className="space-y-3">
                  {clusters.map((cluster) => {
                    const isSelected = selectedCluster?.id === cluster.id;
                    return (
                      <div
                        key={cluster.id}
                        onClick={() => handleSelectCluster(cluster)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-50/20 shadow-sm"
                            : "border-slate-100 bg-slate-50/50 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-black text-slate-800 text-sm flex-1">{translateText(cluster.name, language)}</h4>
                          <div className="flex gap-1 shrink-0 mr-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setClusterModal({ open: true, data: cluster });
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white transition-all"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCluster(cluster.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {cluster.description && (
                          <p className="text-slate-400 text-xs font-bold mt-1 line-clamp-1">{translateText(cluster.description, language)}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-400 font-bold">
                          <span>{cluster._count?.skills || 0} {language === 'ar' ? 'مهارات فرعية' : 'Sub-skills'}</span>
                          {cluster.isCentral ? (
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-100 flex items-center gap-1">
                              <Globe className="w-3 h-3" /> {language === 'ar' ? 'مركزي' : 'Central'}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 max-w-[140px] truncate flex items-center gap-1" title={cluster.school?.name}>
                              <School className="w-3 h-3" /> {cluster.school?.name || (language === 'ar' ? "مدرسة خاصة" : "Private School")}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 font-bold">{language === 'ar' ? 'لا توجد محاور مسجلة في هذا الصف والمادة.' : 'No clusters registered for this subject & grade.'}</div>
              )}
            </div>

            {/* 2. Skill Lessons Column (Middle 1/3) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-500" />
                  {language === 'ar' ? 'المهارات الفرعية (Skills)' : 'Sub-Skills (Lessons)'}
                </h3>
                {selectedCluster && (
                  <button
                    onClick={() => setLessonModal({ open: true, data: { name: "", description: "", order: lessons.length } })}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-black text-xs flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    {language === 'ar' ? 'أضف مهارة' : 'Add Skill'}
                  </button>
                )}
              </div>

              {!selectedCluster ? (
                <div className="text-center py-20 text-slate-400 font-bold">
                  {language === 'ar' ? 'الرجاء اختيار محور مهاراتي أولاً لعرض مهاراته.' : 'Please select a skill cluster first to load sub-skills.'}
                </div>
              ) : lessons.length > 0 ? (
                <div className="space-y-3">
                  {lessons.map((lesson) => {
                    const isSelected = selectedLesson?.id === lesson.id;
                    return (
                      <div
                        key={lesson.id}
                        onClick={() => handleSelectLesson(lesson)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/20 shadow-sm"
                            : "border-slate-100 bg-slate-50/50 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-black text-slate-800 text-sm flex-1">{translateText(lesson.name, language)}</h4>
                          <div className="flex gap-1 shrink-0 mr-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setLessonModal({ open: true, data: lesson });
                              }}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-white transition-all"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLesson(lesson.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {lesson.description && (
                          <p className="text-slate-400 text-xs font-bold mt-1 line-clamp-1">{translateText(lesson.description, language)}</p>
                        )}
                        <span className="text-[10px] text-slate-400 font-bold mt-3 block">
                          {lesson._count?.activities || 0} {language === 'ar' ? 'أنشطة تفاعلية' : 'Interactive Activities'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 font-bold">{language === 'ar' ? 'لا توجد مهارات مسجلة في هذا المحور.' : 'No sub-skills registered in this cluster.'}</div>
              )}
            </div>

            {/* 3. Interactive Activities Column (Right 1/3) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-500" />
                  {language === 'ar' ? 'الأنشطة (Activities)' : 'Interactive Activities'}
                </h3>
                {selectedLesson && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSeedDemoActivities}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-black text-xs flex items-center gap-1 transition-all cursor-pointer"
                    >
                      {language === 'ar' ? '🌱  توليد 24 نشاطاً تجريبياً' : '🌱 Seed 24 Demo Activities'}
                    </button>
                    <button
                      onClick={handleOpenActivityCreate}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-black text-xs flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      {language === 'ar' ? 'أضف نشاطاً' : 'Add Activity'}
                    </button>
                  </div>
                )}
              </div>

              {!selectedLesson ? (
                <div className="text-center py-20 text-slate-400 font-bold">
                  {language === 'ar' ? 'الرجاء اختيار مهارة فرعية لعرض أنشطتها.' : 'Please select a sub-skill to show activities.'}
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="font-black text-slate-800 text-sm">{translateText(activity.title, language)}</h4>
                          <span className="px-2 py-0.5 bg-purple-50 border border-purple-100 text-purple-700 text-[9px] font-black rounded uppercase block w-fit">
                            {activity.type}
                          </span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenActivityEdit(activity)}
                            className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-white transition-all animate-none"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteActivity(activity.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-all animate-none"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-400 font-bold">
                        <span>XP: {activity.points}</span>
                        <span>•</span>
                        <span>{activity.difficulty === "Easy" ? (language === 'ar' ? "سهل" : "Easy") : activity.difficulty === "Hard" ? (language === 'ar' ? "صعب" : "Hard") : (language === 'ar' ? "متوسط" : "Medium")}</span>
                        <span>•</span>
                        <span>{activity.estimatedTime} {language === 'ar' ? 'ث' : 's'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 font-bold">{language === 'ar' ? 'لا توجد أنشطة مسجلة في هذه المهارة.' : 'No activities registered in this skill.'}</div>
              )}
            </div>

          </div>
        )}

        {/* ── ACTIVITY CREATOR/EDITOR FORM ── */}
        {activeTab === "activity-form" && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-8 animate-in zoom-in-95 duration-200" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            
            {/* Form Header */}
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-4">
                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  {editingActivity 
                    ? (language === 'ar' ? "تعديل النشاط التفاعلي" : "Edit Interactive Activity") 
                    : (language === 'ar' ? "إنشاء نشاط تفاعلي جديد" : "Create New Interactive Activity")}
                </h3>
                {autoSaveStatus === "saving" && (
                  <span className="px-3 py-1 bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-black rounded-lg flex items-center gap-1 animate-pulse">
                    ⏱️ {language === 'ar' ? 'جاري الحفظ تلقائياً...' : 'Autosaving...'}
                  </span>
                )}
                {autoSaveStatus === "saved" && (
                  <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg flex items-center gap-1">
                    ✅ {language === 'ar' ? 'تم الحفظ تلقائياً' : 'Autosaved'}
                  </span>
                )}
                {autoSaveStatus === "error" && (
                  <span className="px-3 py-1 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black rounded-lg flex items-center gap-1">
                    ❌ {language === 'ar' ? 'فشل الحفظ' : 'Autosave failed'}
                  </span>
                )}
              </div>
              <button
                onClick={() => setActiveTab("list")}
                className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Form Left/Middle Form Inputs */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Base Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase block">{language === 'ar' ? 'عنوان النشاط / السؤال (عربي)' : 'Activity Title / Question (Arabic)'}</label>
                    <input
                      type="text"
                      value={activityForm.titleAr}
                      onChange={(e) => updateActivityForm("titleAr", e.target.value)}
                      className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                      placeholder={language === 'ar' ? 'مثال: قراءة الساعة ومطابقة العقارب' : 'e.g., Reading clock hands'}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase block">{language === 'ar' ? 'عنوان النشاط / السؤال (English)' : 'Activity Title / Question (English)'}</label>
                    <input
                      type="text"
                      value={activityForm.titleEn}
                      onChange={(e) => updateActivityForm("titleEn", e.target.value)}
                      className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 text-left font-sans"
                      placeholder="Example: Reading Clock Hands"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase block">{language === 'ar' ? 'نوع النشاط' : 'Activity Type'}</label>
                    <select
                      value={activityForm.type}
                      onChange={(e) => updateActivityForm("type", e.target.value)}
                      className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-black outline-none focus:border-indigo-500"
                    >
                      <option value="MCQ">{language === 'ar' ? 'اختيار من متعدد (MCQ)' : 'Multiple Choice (MCQ)'}</option>
                      <option value="TRUE_FALSE">{language === 'ar' ? 'صح أم خطأ (True/False)' : 'True / False'}</option>
                      <option value="MULTI_SELECT">{language === 'ar' ? 'اختيارات متعددة (Multi-Select)' : 'Multiple Select (Multi-Select)'}</option>
                      <option value="MATCHING">{language === 'ar' ? 'سؤال التوصيل (Matching)' : 'Matching elements'}</option>
                      <option value="DRAG_DROP_FILL">{language === 'ar' ? 'سحب الفراغات (Drag & Drop Fill)' : 'Drag & Drop Fill'}</option>
                      <option value="GROUP_SORTING">{language === 'ar' ? 'تصنيف المجموعات (Group Sorting)' : 'Group Sorting'}</option>
                      <option value="NUMBER_LINE">{language === 'ar' ? 'خط الأعداد (Number Line)' : 'Number Line'}</option>
                      <option value="CLOCK">{language === 'ar' ? 'عقارب الساعة (Clock)' : 'Interactive Clock'}</option>
                      <option value="MIND_MAP">{language === 'ar' ? 'خريطة مفاهيم (Mind Map)' : 'Concept Mind Map'}</option>
                      <option value="VIDEO_CHECKPOINT">{language === 'ar' ? 'فيديو تفاعلي (Video Checkpoint)' : 'Interactive Video Checkpoint'}</option>
                      <option value="SWIPE_SORT">{language === 'ar' ? 'سحب سريع لليمين/اليسار (Swipe Sort)' : 'Swipe Sort'}</option>
                      <option value="MAZE">{language === 'ar' ? 'المتاهة التعليمية (Maze)' : 'Educational Maze'}</option>
                      <option value="WORD_SEARCH">{language === 'ar' ? 'البحث عن الكلمات (Word Search)' : 'Word Search'}</option>
                      <option value="GEOGEBRA">{language === 'ar' ? 'جيوجيبرا (GeoGebra)' : 'GeoGebra Widget'}</option>
                      <option value="FLASH_CARD">{language === 'ar' ? 'البطاقات التعليمية (Flash Cards)' : 'Flash Cards'}</option>
                      <option value="MEMORY_GAME">{language === 'ar' ? 'لعبة الذاكرة (Memory Game)' : 'Memory Game'}</option>
                      <option value="WORD_SCRAMBLE">{language === 'ar' ? 'ترتيب الحروف (Word Scramble)' : 'Word Scramble'}</option>
                      <option value="SENTENCE_REORDER">{language === 'ar' ? 'ترتيب الجملة (Sentence Reorder)' : 'Sentence Reorder'}</option>
                      <option value="MATH_EQUATION">{language === 'ar' ? 'معادلة حسابية (Math Equation)' : 'Math Equation'}</option>
                      <option value="SEQUENCE_ORDER">{language === 'ar' ? 'ترتيب التسلسل (Sequence Order)' : 'Sequence Order'}</option>
                      <option value="CROSSWORD">{language === 'ar' ? 'الكلمات المتقاطعة (Crossword)' : 'Crossword'}</option>
                      <option value="COUNT_OBJECTS">{language === 'ar' ? 'عد العناصر (Count Objects)' : 'Count Objects'}</option>
                      <option value="IMAGE_LABEL">{language === 'ar' ? 'تسمية الصورة (Image Labeling)' : 'Image Labeling'}</option>
                      <option value="COLOR_MATCH">{language === 'ar' ? 'تطابق الألوان (Color Match)' : 'Color Match'}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase block">{language === 'ar' ? 'نقاط الخبرة XP' : 'Experience Points (XP)'}</label>
                    <input
                      type="number"
                      value={activityForm.points}
                      onChange={(e) => updateActivityForm("points", parseInt(e.target.value) || 10)}
                      className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase block">{language === 'ar' ? 'الزمن التقديري (ثواني)' : 'Estimated Time (Seconds)'}</label>
                    <input
                      type="number"
                      value={activityForm.estimatedTime}
                      onChange={(e) => updateActivityForm("estimatedTime", parseInt(e.target.value) || 60)}
                      className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase block">{language === 'ar' ? 'مستوى الصعوبة' : 'Difficulty Level'}</label>
                    <select
                      value={activityForm.difficulty}
                      onChange={(e) => updateActivityForm("difficulty", e.target.value)}
                      className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-black outline-none focus:border-indigo-500"
                    >
                      <option value="Easy">{language === 'ar' ? 'سهل' : 'Easy'}</option>
                      <option value="Medium">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
                      <option value="Hard">{language === 'ar' ? 'صعب' : 'Hard'}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase block">{language === 'ar' ? 'مستوى DOK' : 'DOK Level'}</label>
                    <select
                      value={activityForm.dok || ""}
                      onChange={(e) => updateActivityForm("dok", e.target.value)}
                      className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-black outline-none focus:border-indigo-500"
                    >
                      <option value="1">{language === 'ar' ? 'DOK 1: التذكر واستدعاء المعرفة' : 'DOK 1: Recall & Reproduction'}</option>
                      <option value="2">{language === 'ar' ? 'DOK 2: التطبيق والربط الذهني' : 'DOK 2: Skills & Concepts'}</option>
                      <option value="3">{language === 'ar' ? 'DOK 3: التفكير النقدي وحل المشكلات' : 'DOK 3: Strategic Thinking'}</option>
                    </select>
                  </div>
                </div>

                {/* 2. Educational Metadata & Standards */}
                <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    {language === 'ar' ? 'المعايير والمخرجات (Scope & Sequence Metadata)' : 'Standards & Outcomes (Scope & Sequence Metadata)'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase block">{language === 'ar' ? 'المعيار (Standard)' : 'Standard'}</label>
                      <input
                        type="text"
                        value={activityForm.standard}
                        onChange={(e) => updateActivityForm("standard", e.target.value)}
                        className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                        placeholder="مثل: MA-3-1"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase block">{language === 'ar' ? 'المؤشر (Indicator)' : 'Indicator'}</label>
                      <input
                        type="text"
                        value={activityForm.indicator}
                        onChange={(e) => updateActivityForm("indicator", e.target.value)}
                        className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                        placeholder="مثل: IND-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase block">{language === 'ar' ? 'مخرجات التعلم (عربي)' : 'Learning Outcome (Arabic)'}</label>
                      <input
                        type="text"
                        value={activityForm.learningOutcomeAr}
                        onChange={(e) => updateActivityForm("learningOutcomeAr", e.target.value)}
                        className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                        placeholder="مثل: التعرف على عقارب الساعات"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase block">{language === 'ar' ? 'Learning Outcome (English)' : 'Learning Outcome (English)'}</label>
                      <input
                        type="text"
                        value={activityForm.learningOutcomeEn}
                        onChange={(e) => updateActivityForm("learningOutcomeEn", e.target.value)}
                        className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 text-left font-sans"
                        placeholder="Example: Read clock hands"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Educational Helper Modals (Hint, Tip, Explanation, Insight) */}
                <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    {language === 'ar' ? 'مساعدات التعلم والتغذية الراجعة' : 'Learning Aids & Feedback Insights'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase block">{language === 'ar' ? 'تلميح للطالب (عربي)' : 'Student Hint (Arabic)'}</label>
                      <textarea
                        value={activityForm.hintAr}
                        onChange={(e) => updateActivityForm("hintAr", e.target.value)}
                        rows={2}
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                        placeholder="يظهر للطالب عند طلبه المساعدة."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase block">{language === 'ar' ? 'Hint (English)' : 'Hint (English)'}</label>
                      <textarea
                        value={activityForm.hintEn}
                        onChange={(e) => updateActivityForm("hintEn", e.target.value)}
                        rows={2}
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 text-left font-sans"
                        placeholder="Shown when help is requested."
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase block">{language === 'ar' ? 'نصيحة ذكية (عربي)' : 'Smart Tip (Arabic)'}</label>
                      <textarea
                        value={activityForm.tipAr}
                        onChange={(e) => updateActivityForm("tipAr", e.target.value)}
                        rows={2}
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                        placeholder="نصيحة تعزز الفكرة الرياضية."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase block">{language === 'ar' ? 'Smart Tip (English)' : 'Smart Tip (English)'}</label>
                      <textarea
                        value={activityForm.tipEn}
                        onChange={(e) => updateActivityForm("tipEn", e.target.value)}
                        rows={2}
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 text-left font-sans"
                        placeholder="Smart tip for reinforcing concepts."
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase block">{language === 'ar' ? 'شرح الإجابة المفصل (عربي)' : 'Detailed Solution Explanation (Arabic)'}</label>
                      <textarea
                        value={activityForm.explanationAr}
                        onChange={(e) => updateActivityForm("explanationAr", e.target.value)}
                        rows={3}
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                        placeholder="شرح كامل للحل يظهر للطالب بعد إنهاء النشاط."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase block">{language === 'ar' ? 'Explanation (English)' : 'Explanation (English)'}</label>
                      <textarea
                        value={activityForm.explanationEn}
                        onChange={(e) => updateActivityForm("explanationEn", e.target.value)}
                        rows={3}
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 text-left font-sans"
                        placeholder="Detailed answer explanation shown after playing."
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase block">{language === 'ar' ? 'فكرة جوهرية (عربي)' : 'Key Insight (Arabic)'}</label>
                      <textarea
                        value={activityForm.keyInsightAr}
                        onChange={(e) => updateActivityForm("keyInsightAr", e.target.value)}
                        rows={3}
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                        placeholder="الدرس المستخلص من اللعبة أو النشاط."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase block">{language === 'ar' ? 'Key Insight (English)' : 'Key Insight (English)'}</label>
                      <textarea
                        value={activityForm.keyInsightEn}
                        onChange={(e) => updateActivityForm("keyInsightEn", e.target.value)}
                        rows={3}
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 text-left font-sans"
                        placeholder="The core take-away from this interactive game."
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* 3. Interactive Options Editor (Right 1/3) */}
              <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-500 animate-none" />
                  {language === 'ar' ? 'خيارات اللعبة والإجابة الصحيحة' : 'Game Options & Correct Answer'}
                </h4>
                
                <div className="bg-white rounded-2xl border border-slate-200 p-4 min-h-[300px]">
                  <InteractiveQuestionEditor
                    question={{
                      type: activityForm.type,
                      options: activityForm.options,
                      correctAnswer: activityForm.correctAnswer,
                      text: activityForm.titleAr // Pass title as text
                    }}
                    language={language}
                    onChange={(updated) => {
                      setActivityForm((prev: any) => ({
                        ...prev,
                        options: typeof updated.options === "string" ? updated.options : JSON.stringify(updated.options),
                        correctAnswer: typeof updated.correctAnswer === "string" ? updated.correctAnswer : JSON.stringify(updated.correctAnswer)
                      }));
                    }}
                  />
                </div>
              </div>

            </div>

            {/* Save Actions */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-6">
              <button
                onClick={() => setActiveTab("list")}
                className="px-6 py-3.5 rounded-2xl border-2 border-slate-200 hover:bg-slate-50 text-slate-500 font-black text-sm transition-all active:scale-95 animate-none"
              >
                {language === 'ar' ? 'إلغاء وتراجع' : 'Cancel & Return'}
              </button>
              
              <button
                onClick={handleSaveActivity}
                className="px-10 py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-black text-sm flex items-center gap-2 active:scale-95 shadow-md border border-slate-800 transition-all animate-none"
              >
                <span>{language === 'ar' ? 'حفظ النشاط تفاوضياً' : 'Save Activity'}</span>
                <Save className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* ── MODALS (Add/Edit Cluster) ── */}
        {clusterModal.open && (
          <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <form
              onSubmit={handleSaveCluster}
              className={`bg-white w-full max-w-md rounded-[32px] shadow-2xl p-6 border border-slate-100 space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'} animate-in zoom-in-95 duration-200`}
            >
              <div className="flex justify-between items-center border-b pb-3">
                <h4 className="font-black text-lg text-slate-800">
                  {clusterModal.data?.id 
                    ? (language === 'ar' ? "تعديل محور مهاراتي" : "Edit Skill Cluster") 
                    : (language === 'ar' ? "إضافة محور مهاراتي جديد" : "Add New Skill Cluster")}
                </h4>
                <button
                  type="button"
                  onClick={() => setClusterModal({ open: false, data: null })}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-450 block">{language === 'ar' ? 'نوع المحور' : 'Cluster Type'}</label>
                  <select
                    value={clusterModal.data?.isCentral ? "central" : "school"}
                    onChange={(e) => {
                      const isCentral = e.target.value === "central";
                      setClusterModal((prev: any) => ({
                        ...prev,
                        data: {
                          ...prev.data,
                          isCentral,
                          schoolId: isCentral ? "" : (schools[0]?.id || "")
                        }
                      }));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                  >
                    <option value="central">{language === 'ar' ? '🌍 مركزي (لكافة المدارس)' : '🌍 Central (All Schools)'}</option>
                    <option value="school">{language === 'ar' ? '🏫 مدرسة معينة' : '🏫 Specific School'}</option>
                  </select>
                </div>

                {!clusterModal.data?.isCentral && (
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-450 block">{language === 'ar' ? 'اختر المدرسة المستهدفة' : 'Select Target School'}</label>
                    <select
                      value={clusterModal.data?.schoolId || ""}
                      onChange={(e) => updateClusterModalData("schoolId", e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                    >
                      <option value="">{language === 'ar' ? '-- اختر مدرسة --' : '-- Select School --'}</option>
                      {schools.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-450 block">{language === 'ar' ? 'اسم المحور' : 'Cluster Name'}</label>
                  <input
                    type="text"
                    required
                    value={clusterModal.data?.name || ""}
                    onChange={(e) => updateClusterModalData("name", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                    placeholder={language === 'ar' ? 'مثال: العمليات والجمع والطرح' : 'e.g., Arithmetic Operations'}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-450 block">{language === 'ar' ? 'وصف مختصر' : 'Short Description'}</label>
                  <textarea
                    value={clusterModal.data?.description || ""}
                    onChange={(e) => updateClusterModalData("description", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                    placeholder={language === 'ar' ? 'تنمية مهارات الحساب الذهني...' : 'Developing mental arithmetic skills...'}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl font-black text-sm transition-colors shadow-sm"
                >
                  {language === 'ar' ? 'حفظ البيانات' : 'Save Data'}
                </button>
                <button
                  type="button"
                  onClick={() => setClusterModal({ open: false, data: null })}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-xl font-black text-sm transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── MODALS (Add/Edit Lesson) ── */}
        {lessonModal.open && (
          <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <form
              onSubmit={handleSaveLesson}
              className={`bg-white w-full max-w-md rounded-[32px] shadow-2xl p-6 border border-slate-100 space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'} animate-in zoom-in-95 duration-200`}
            >
              <div className="flex justify-between items-center border-b pb-3">
                <h4 className="font-black text-lg text-slate-800">
                  {lessonModal.open && lessonModal.data?.id 
                    ? (language === 'ar' ? "تعديل مهارة فرعية" : "Edit Sub-Skill") 
                    : (language === 'ar' ? "إضافة مهارة فرعية جديدة" : "Add New Sub-Skill")}
                </h4>
                <button
                  type="button"
                  onClick={() => setLessonModal({ open: false, data: null })}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-450 block">{language === 'ar' ? 'اسم المهارة' : 'Sub-Skill Name'}</label>
                  <input
                    type="text"
                    required
                    value={lessonModal.data?.name || ""}
                    onChange={(e) => updateLessonModalData("name", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                    placeholder={language === 'ar' ? 'مثال: الجمع بتكوين العشرات' : 'e.g., Addition by making tens'}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-450 block">{language === 'ar' ? 'تفاصيل المهارة' : 'Sub-Skill Description'}</label>
                  <textarea
                    value={lessonModal.data?.description || ""}
                    onChange={(e) => updateLessonModalData("description", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                    placeholder={language === 'ar' ? 'أهداف التعلم المراد تحقيقها...' : 'Learning objectives to be achieved...'}
                    rows={3}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-450 block">{language === 'ar' ? 'ترتيب المهارة' : 'Sub-Skill Order'}</label>
                  <input
                    type="number"
                    value={lessonModal.data?.order || 0}
                    onChange={(e) => updateLessonModalData("order", parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-slate-900 text-white rounded-xl font-black text-sm transition-colors shadow-sm"
                >
                  {language === 'ar' ? 'حفظ البيانات' : 'Save Data'}
                </button>
                <button
                  type="button"
                  onClick={() => setLessonModal({ open: false, data: null })}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-xl font-black text-sm transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
