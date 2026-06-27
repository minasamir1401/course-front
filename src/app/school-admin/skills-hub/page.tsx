"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles, Plus, Trash2, Edit, ChevronDown, ChevronUp,
  ArrowRight, ArrowLeft, Save, CheckCircle2, AlertCircle, X,
  Folder, BookOpen, FileText, Info, HelpCircle, Layers, Settings
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import InteractiveQuestionEditor from "@/components/InteractiveQuestionEditor";

export default function SchoolAdminSkillsHubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get("action");
  const { language } = useLanguage();
  const [token, setToken] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
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

  // Active Modes
  const [activeTab, setActiveTab] = useState<"list" | "activity-form">("list");
  const [editingActivity, setEditingActivity] = useState<any>(null);

  // Modal States
  const [clusterModal, setClusterModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });
  const [lessonModal, setLessonModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });

  // Activity Form States
  const [activityForm, setActivityForm] = useState<any>({
    title: "",
    type: "MCQ",
    options: "[]",
    correctAnswer: "",
    points: 10,
    difficulty: "Medium",
    dok: "2",
    estimatedTime: 60,
    standard: "",
    indicator: "",
    learningOutcome: "",
    hint: "",
    tip: "",
    explanation: "",
    keyInsight: ""
  });

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
    const storedToken = localStorage.getItem("school_admin_token");
    const storedUser = localStorage.getItem("school_admin_user");
    if (!storedToken) {
      router.push("/school-admin/login");
      return;
    }
    setToken(storedToken);
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setSchoolId(u.schoolId);
      } catch {}
    }
    fetchClusters(storedToken, subject, grade);
  }, [router, subject, grade]);

  useEffect(() => {
    if (action === "add-cluster" && token) {
      setClusterModal({ open: true, data: { name: "", description: "" } });
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

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: clusterModal.data.name,
          description: clusterModal.data.description,
          subject,
          grade
        })
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

  // Create Activity Handler
  const handleOpenActivityCreate = () => {
    if (!selectedLesson) return;
    setEditingActivity(null);
    setActivityForm({
      title: "",
      type: "MCQ",
      options: JSON.stringify({ choices: ["", "", "", ""] }),
      correctAnswer: "",
      points: 10,
      difficulty: "Medium",
      dok: "2",
      estimatedTime: 60,
      standard: "",
      indicator: "",
      learningOutcome: "",
      hint: "",
      tip: "",
      explanation: "",
      keyInsight: ""
    });
    setActiveTab("activity-form");
  };

  // Edit Activity Handler
  const handleOpenActivityEdit = (act: any) => {
    setEditingActivity(act);
    setActivityForm({
      title: act.title,
      type: act.type,
      options: typeof act.options === "string" ? act.options : JSON.stringify(act.options),
      correctAnswer: typeof act.correctAnswer === "string" ? act.correctAnswer : JSON.stringify(act.correctAnswer),
      points: act.points,
      difficulty: act.difficulty,
      dok: act.dok || "2",
      estimatedTime: act.estimatedTime,
      standard: act.standard || "",
      indicator: act.indicator || "",
      learningOutcome: act.learningOutcome || "",
      hint: act.hint || "",
      tip: act.tip || "",
      explanation: act.explanation || "",
      keyInsight: act.keyInsight || ""
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
      // Pass clean strings for prisma options
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
      <div className="max-w-7xl mx-auto space-y-8 pb-24 px-4 overflow-x-hidden" dir="rtl">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="space-y-2 text-right">
            <div className="flex items-center gap-2 text-indigo-600 font-black">
              <Sparkles className="w-5 h-5 floating" />
              <span>لوحة الإشراف والتعديل</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight">
              إدارة مكتبة المهارات التفاعلية
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              أضف محاور، مهارات، وأنشطة تعليمية تفاعلية مخصصة لطلاب مدرستك ومطابقة للـ Scope & Sequence.
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
                <option value="الرياضيات">📐 الرياضيات</option>
                <option value="القراءة">📚 القراءة</option>
                <option value="العلوم">🔬 العلوم</option>
              </select>

              {/* Grade Select */}
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-black outline-none focus:border-indigo-500"
              >
                {GRADES_LIST.map((g) => (
                  <option key={g} value={g}>{g}</option>
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
                  المحاور (Clusters)
                </h3>
                <button
                  onClick={() => setClusterModal({ open: true, data: { name: "", description: "" } })}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-black text-xs flex items-center gap-1 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  أضف محور
                </button>
              </div>

              {isLoading ? (
                <div className="text-center py-12 text-slate-400 font-bold">جاري التحميل...</div>
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
                          <h4 className="font-black text-slate-800 text-sm flex-1">{cluster.name}</h4>
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
                          <p className="text-slate-400 text-xs font-bold mt-1 line-clamp-1">{cluster.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-400 font-bold">
                          <span>{cluster._count?.skills || 0} مهارات فرعية</span>
                          {cluster.isCentral && (
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-100">
                              مركزي
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 font-bold">لا توجد محاور مسجلة في هذا الصف والمادة.</div>
              )}
            </div>

            {/* 2. Skill Lessons Column (Middle 1/3) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-500" />
                  المهارات الفرعية (Skills)
                </h3>
                {selectedCluster && (
                  <button
                    onClick={() => setLessonModal({ open: true, data: { name: "", description: "", order: lessons.length } })}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-black text-xs flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    أضف مهارة
                  </button>
                )}
              </div>

              {!selectedCluster ? (
                <div className="text-center py-20 text-slate-400 font-bold">
                  الرجاء اختيار محور مهاراتي أولاً لعرض مهاراته.
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
                          <h4 className="font-black text-slate-800 text-sm flex-1">{lesson.name}</h4>
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
                          <p className="text-slate-400 text-xs font-bold mt-1 line-clamp-1">{lesson.description}</p>
                        )}
                        <span className="text-[10px] text-slate-400 font-bold mt-3 block">
                          {lesson._count?.activities || 0} أنشطة تفاعلية
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 font-bold">لا توجد مهارات مسجلة في هذا المحور.</div>
              )}
            </div>

            {/* 3. Interactive Activities Column (Right 1/3) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-500" />
                  الأنشطة (Activities)
                </h3>
                {selectedLesson && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSeedDemoActivities}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-black text-xs flex items-center gap-1 transition-all cursor-pointer"
                    >
                      🌱 توليد 24 نشاطاً تجريبياً
                    </button>
                    <button
                      onClick={handleOpenActivityCreate}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-black text-xs flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      أضف نشاطاً
                    </button>
                  </div>
                )}
              </div>

              {!selectedLesson ? (
                <div className="text-center py-20 text-slate-400 font-bold">
                  الرجاء اختيار مهارة فرعية لعرض أنشطتها.
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
                          <h4 className="font-black text-slate-800 text-sm">{activity.title}</h4>
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
                        <span>{activity.difficulty === "Easy" ? "سهل" : activity.difficulty === "Hard" ? "صعب" : "متوسط"}</span>
                        <span>•</span>
                        <span>{activity.estimatedTime} ث</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 font-bold">لا توجد أنشطة مسجلة في هذه المهارة.</div>
              )}
            </div>

          </div>
        )}

        {/* ── ACTIVITY CREATOR/EDITOR FORM ── */}
        {activeTab === "activity-form" && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-8 animate-in zoom-in-95 duration-200">
            
            {/* Form Header */}
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                {editingActivity ? "تعديل النشاط التفاعلي" : "إنشاء نشاط تفاعلي جديد"}
              </h3>
              <button
                onClick={() => setActiveTab("list")}
                className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* 1. Interactive Options Editor (Left/Middle 2/3) */}
              <div className="lg:col-span-2 bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-500 animate-none" />
                  خيارات اللعبة والإجابة الصحيحة
                </h4>
                
                <div className="bg-white rounded-2xl border border-slate-200 p-4 min-h-[300px]">
                  <InteractiveQuestionEditor
                    question={{
                      type: activityForm.type,
                      options: activityForm.options,
                      correctAnswer: activityForm.correctAnswer,
                      text: activityForm.title // Pass title as text
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

              {/* 2. Form Side Inputs (Right 1/3) */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Base Fields */}
                <div className="grid grid-cols-1 gap-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase block">عنوان النشاط / السؤال</label>
                    <input
                      type="text"
                      value={activityForm.title}
                      onChange={(e) => updateActivityForm("title", e.target.value)}
                      className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                      placeholder="مثال: قراءة الساعة ومطابقة العقارب"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase block">نوع النشاط</label>
                    <select
                      value={activityForm.type}
                      onChange={(e) => updateActivityForm("type", e.target.value)}
                      className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-black outline-none focus:border-indigo-500"
                    >
                      <option value="MCQ">اختيار من متعدد (MCQ)</option>
                      <option value="TRUE_FALSE">صح أم خطأ (True/False)</option>
                      <option value="MULTI_SELECT">اختيارات متعددة (Multi-Select)</option>
                      <option value="MATCHING">سؤال التوصيل (Matching)</option>
                      <option value="DRAG_DROP_FILL">سحب الفراغات (Drag & Drop Fill)</option>
                      <option value="GROUP_SORTING">تصنيف المجموعات (Group Sorting)</option>
                      <option value="NUMBER_LINE">خط الأعداد (Number Line)</option>
                      <option value="CLOCK">عقارب الساعة (Clock)</option>
                      <option value="MIND_MAP">خريطة مفاهيم (Mind Map)</option>
                      <option value="VIDEO_CHECKPOINT">فيديو تفاعلي (Video Checkpoint)</option>
                      <option value="SWIPE_SORT">سحب سريع لليمين/اليسار (Swipe Sort)</option>
                      <option value="MAZE">المتاهة التعليمية (Maze)</option>
                      <option value="WORD_SEARCH">البحث عن الكلمات (Word Search)</option>
                      <option value="GEOGEBRA">جيوجيبرا (GeoGebra)</option>
                      <option value="FLASH_CARD">البطاقات التعليمية (Flash Cards)</option>
                      <option value="MEMORY_GAME">لعبة الذاكرة (Memory Game)</option>
                      <option value="WORD_SCRAMBLE">ترتيب الحروف (Word Scramble)</option>
                      <option value="SENTENCE_REORDER">ترتيب الجملة (Sentence Reorder)</option>
                      <option value="MATH_EQUATION">معادلة حسابية (Math Equation)</option>
                      <option value="SEQUENCE_ORDER">ترتيب التسلسل (Sequence Order)</option>
                      <option value="CROSSWORD">الكلمات المتقاطعة (Crossword)</option>
                      <option value="COUNT_OBJECTS">عد العناصر (Count Objects)</option>
                      <option value="IMAGE_LABEL">تسمية الصورة (Image Labeling)</option>
                      <option value="COLOR_MATCH">تطابق الألوان (Color Match)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase block">نقاط الخبرة XP</label>
                    <input
                      type="number"
                      value={activityForm.points}
                      onChange={(e) => updateActivityForm("points", parseInt(e.target.value) || 10)}
                      className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase block">الزمن التقديري (ثواني)</label>
                    <input
                      type="number"
                      value={activityForm.estimatedTime}
                      onChange={(e) => updateActivityForm("estimatedTime", parseInt(e.target.value) || 60)}
                      className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase block">مستوى الصعوبة</label>
                    <select
                      value={activityForm.difficulty}
                      onChange={(e) => updateActivityForm("difficulty", e.target.value)}
                      className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-black outline-none focus:border-indigo-500"
                    >
                      <option value="Easy">سهل</option>
                      <option value="Medium">متوسط</option>
                      <option value="Hard">صعب</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase block">مستوى DOK</label>
                    <select
                      value={activityForm.dok || ""}
                      onChange={(e) => updateActivityForm("dok", e.target.value)}
                      className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-black outline-none focus:border-indigo-500"
                    >
                      <option value="1">DOK 1: التذكر واستدعاء المعرفة</option>
                      <option value="2">DOK 2: التطبيق والربط الذهني</option>
                      <option value="3">DOK 3: التفكير النقدي وحل المشكلات</option>
                    </select>
                  </div>
                </div>

                {/* Educational Metadata & Standards */}
                <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    المعايير والمخرجات (Scope & Sequence Metadata)
                  </h4>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase block">المعيار (Standard)</label>
                      <input
                        type="text"
                        value={activityForm.standard}
                        onChange={(e) => updateActivityForm("standard", e.target.value)}
                        className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                        placeholder="مثل: MA-3-1"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase block">المؤشر (Indicator)</label>
                      <input
                        type="text"
                        value={activityForm.indicator}
                        onChange={(e) => updateActivityForm("indicator", e.target.value)}
                        className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                        placeholder="مثل: IND-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase block">مخرجات التعلم (Learning Outcome)</label>
                      <input
                        type="text"
                        value={activityForm.learningOutcome}
                        onChange={(e) => updateActivityForm("learningOutcome", e.target.value)}
                        className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                        placeholder="مثل: التعرف على عقارب الساعات"
                      />
                    </div>
                  </div>
                </div>

                {/* Educational Helper Modals (Hint, Tip, Explanation, Insight) */}
                <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    مساعدات التعلم والتغذية الراجعة
                  </h4>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase block">تلميح للطالب (Hint)</label>
                      <textarea
                        value={activityForm.hint}
                        onChange={(e) => updateActivityForm("hint", e.target.value)}
                        rows={2}
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                        placeholder="يظهر للطالب عند طلبه المساعدة."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase block">نصيحة ذكية (Tip)</label>
                      <textarea
                        value={activityForm.tip}
                        onChange={(e) => updateActivityForm("tip", e.target.value)}
                        rows={2}
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                        placeholder="نصيحة تعزز الفكرة الرياضية."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase block">شرح الإجابة المفصل (Answer Explanation)</label>
                      <textarea
                        value={activityForm.explanation}
                        onChange={(e) => updateActivityForm("explanation", e.target.value)}
                        rows={3}
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                        placeholder="شرح كامل للحل يظهر للطالب بعد إنهاء النشاط."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase block">فكرة جوهرية (Key Insight)</label>
                      <textarea
                        value={activityForm.keyInsight}
                        onChange={(e) => updateActivityForm("keyInsight", e.target.value)}
                        rows={3}
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                        placeholder="الدرس المستخلص من اللعبة أو النشاط."
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Save Actions */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-6">
              <button
                onClick={() => setActiveTab("list")}
                className="px-6 py-3.5 rounded-2xl border-2 border-slate-200 hover:bg-slate-50 text-slate-500 font-black text-sm transition-all active:scale-95 animate-none"
              >
                إلغاء العودة
              </button>
              
              <button
                onClick={handleSaveActivity}
                className="px-10 py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-black text-sm flex items-center gap-2 active:scale-95 shadow-md border border-slate-800 transition-all animate-none"
              >
                <span>حفظ النشاط تفاعلياً</span>
                <Save className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* ── MODALS (Add/Edit Cluster) ── */}
        {clusterModal.open && (
          <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <form
              onSubmit={handleSaveCluster}
              className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-6 border border-slate-100 space-y-4 text-right animate-in zoom-in-95 duration-200"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <h4 className="font-black text-lg text-slate-800">
                  {clusterModal.open && clusterModal.data?.id ? "تعديل محور مهاراتي" : "إضافة محور مهاراتي جديد"}
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
                  <label className="text-xs font-black text-slate-450 block">اسم المحور</label>
                  <input
                    type="text"
                    required
                    value={clusterModal.data?.name || ""}
                    onChange={(e) => updateClusterModalData("name", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                    placeholder="مثال: العمليات والجمع والطرح"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-450 block">وصف مختصر</label>
                  <textarea
                    value={clusterModal.data?.description || ""}
                    onChange={(e) => updateClusterModalData("description", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                    placeholder="تنمية مهارات الحساب الذهني..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl font-black text-sm transition-colors shadow-sm"
                >
                  حفظ البيانات
                </button>
                <button
                  type="button"
                  onClick={() => setClusterModal({ open: false, data: null })}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-xl font-black text-sm transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── MODALS (Add/Edit Lesson) ── */}
        {lessonModal.open && (
          <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <form
              onSubmit={handleSaveLesson}
              className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-6 border border-slate-100 space-y-4 text-right animate-in zoom-in-95 duration-200"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <h4 className="font-black text-lg text-slate-800">
                  {lessonModal.open && lessonModal.data?.id ? "تعديل مهارة فرعية" : "إضافة مهارة فرعية جديدة"}
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
                  <label className="text-xs font-black text-slate-450 block">اسم المهارة</label>
                  <input
                    type="text"
                    required
                    value={lessonModal.data?.name || ""}
                    onChange={(e) => updateLessonModalData("name", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                    placeholder="مثال: الجمع بتكوين العشرات"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-450 block">تفاصيل المهارة</label>
                  <textarea
                    value={lessonModal.data?.description || ""}
                    onChange={(e) => updateLessonModalData("description", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                    placeholder="أهداف التعلم المراد تحقيقها..."
                    rows={3}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-450 block">ترتيب المهارة</label>
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
                  حفظ البيانات
                </button>
                <button
                  type="button"
                  onClick={() => setLessonModal({ open: false, data: null })}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-xl font-black text-sm transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
