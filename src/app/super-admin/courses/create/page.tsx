"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL } from '@/lib/api';
import { useNotification } from "@/context/NotificationContext";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  ArrowLeft, Plus, Trash2, Video, FileText, 
  HelpCircle, BookOpen, Save, Layers, Edit2, X,
  ChevronDown, ChevronUp, Play, Layout, Target, 
  CheckCircle2, AlertCircle, Upload, Download, Settings,
  Eye, Monitor, ListOrdered, FileJson, FileDown, Clock
} from "lucide-react";
import * as XLSX from 'xlsx';
import RichTextEditor from "@/components/RichTextEditor";
import { compressImage } from "@/lib/image-utils";


export default function CreateCoursePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useNotification();
  const schoolIdParam = searchParams.get('schoolId');

  const [isLoading, setIsLoading] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    coverImage: "",
    grades: [] as string[],
    subjects: [] as string[],
    country: "مصر",
    isCentral: !schoolIdParam,
    schoolIds: (schoolIdParam ? [schoolIdParam] : []) as string[]
  });

  const [lessons, setLessons] = useState<any[]>([]);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLessonIndex, setEditingLessonIndex] = useState<number | null>(null);

  // Lesson State
  const [currentLesson, setCurrentLesson] = useState<any>({
    title: "",
    videoUrl: "",
    summary: "",
    notes: "",
    standards: "",
    indicators: "",
    learningOutcomes: "",
    isVisible: true,
    publishDate: "",
    cutOffDate: "",
    slides: [
      { id: Date.now(), title: "المقدمة", content: "" }
    ],
    questions: [],
    assignments: [], // New Assignments section
    attachments: []
  });

  // UI States for Lesson Modal
  const [activeTab, setActiveTab] = useState<'info' | 'slides' | 'assignments' | 'exercises' | 'attachments' | 'scheduling'>('info');
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionSource, setQuestionSource] = useState<'assignments' | 'exercises'>('exercises');
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [tempQuestion, setTempQuestion] = useState<any>({
    text: "", type: "MCQ", options: ["", "", "", ""],
    correctAnswer: "", points: 1, skill: "General", level: "Medium",
    learningOutcome: "", standard: "", indicator: "", 
    explanation: "", correctAnswers: [], attempts: 1
  });

  const STANDARDS = [
    "المعيار 1: الفهم الأساسي",
    "المعيار 2: القدرة على التحليل",
    "المعيار 3: التطبيق العملي",
    "المعيار 4: التفكير الإبداعي"
  ];

  const INDICATORS = [
    "المؤشر 1.1: تعريف المصطلحات",
    "المؤشر 1.2: شرح المفاهيم",
    "المؤشر 2.1: مقارنة النتائج",
    "المؤشر 3.1: حل المسائل"
  ];

  const LEARNING_OUTCOMES = [
    "LO1: أن يعدد الطالب خصائص...",
    "LO2: أن يحلل الطالب العلاقة بين...",
    "LO3: أن يطبق القوانين في...",
    "LO4: أن يستنتج الطالب..."
  ];

  const GRADES = [
    "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي",
    "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
    "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
  ];

  const QUESTION_TYPES = [
    { id: "MCQ", label: "اختيار من متعدد" },
    { id: "TRUE_FALSE", label: "صح وخطأ" },
    { id: "MULTI_SELECT", label: "اختيار متعدد" }
  ];

  const CATEGORIES = [
    "اللغة العربية", "اللغة الإنجليزية", "اللغة الفرنسية", "اللغة الألمانية", "اللغة الإيطالية",
    "الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "الجيولوجيا", "الميكانيكا",
    "التاريخ", "الجغرافيا", "الفلسفة", "علم النفس", "الاقتصاد", "الإحصاء",
    "التربية الدينية", "التربية الوطنية", "الحاسب الآلي",
    "SAT Math", "SAT English"
  ];

  const SKILLS = ["General", "Critical Thinking", "Problem Solving", "Analysis", "Application"];

  const toggleCourseSubject = (subject: string) => {
    const current = courseData.subjects || [];
    const next = current.includes(subject)
      ? current.filter((s) => s !== subject)
      : [...current, subject];
    setCourseData({ ...courseData, subjects: next });
  };

  const toggleCourseSchool = (id: string) => {
    const current = courseData.schoolIds || [];
    const next = current.includes(id) ? current.filter((sid) => sid !== id) : [...current, id];
    setCourseData({ ...courseData, schoolIds: next, isCentral: next.length === 0 });
  };

  const selectAllSchools = () => {
    if (!schools.length) return;
    if ((courseData.schoolIds || []).length === schools.length) {
      setCourseData({ ...courseData, schoolIds: [], isCentral: true });
    } else {
      setCourseData({ ...courseData, schoolIds: schools.map((s) => s.id), isCentral: false });
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("super_admin_token");
    if (!token) {
      router.push("/super-admin/login");
      return;
    }
    fetchSchools(token);
  }, []);

  const fetchSchools = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/schools`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSchools(Array.isArray(data) ? data : (data.schools || []));
      }
    } catch (error) {
      console.error("Failed to fetch schools");
    }
  };

  const handleRemoveLesson = (index: number) => {
    const newLessons = [...lessons];
    newLessons.splice(index, 1);
    setLessons(newLessons);
  };

  const openAddLessonModal = () => {
    setEditingLessonIndex(null);
    setCurrentLesson({
      title: "",
      videoUrl: "",
      summary: "",
      notes: "",
      standards: "",
      indicators: "",
      learningOutcomes: "",
      isVisible: true,
      publishDate: "",
      cutOffDate: "",
      slides: [{ id: Date.now(), title: "المقدمة", content: "" }],
      questions: [],
      assignments: [],
      attachments: []
    });
    setActiveTab('info');
    setIsLessonModalOpen(true);
  };

  const openEditLessonModal = (index: number) => {
    setEditingLessonIndex(index);
    const lessonToEdit = { ...lessons[index] };
    if (!lessonToEdit.slides) lessonToEdit.slides = [{ id: Date.now(), title: "المقدمة", content: "" }];
    if (!lessonToEdit.questions) lessonToEdit.questions = [];
    setCurrentLesson(lessonToEdit);
    setActiveTab('info');
    setIsLessonModalOpen(true);
  };

  const saveLesson = () => {
    if (!currentLesson.title) {
      showToast("يجب إدخال عنوان الدرس", "error");
      return;
    }
    const newLessons = [...lessons];
    if (editingLessonIndex !== null) {
      newLessons[editingLessonIndex] = currentLesson;
    } else {
      newLessons.push(currentLesson);
    }
    setLessons(newLessons);
    setIsLessonModalOpen(false);
  };

  // Excel Upload hidden as requested
  // Excel Upload for metadata
  const handleExcelUpload = (type: 'questions' | 'metadata' | 'assignments') => {
    if (type === 'metadata') {
       // Mock implementation for metadata excel upload
       showToast("تم رفع المعايير والمخرجات من Excel بنجاح (بيانات وهمية)", "success");
       setCurrentLesson({
         ...currentLesson,
         standards: "معيار المنهج المطور 2024",
         indicators: "مؤشر القياس العالمي - المستوى الرابع",
         learningOutcomes: "إتقان مهارات التفكير العليا"
       });
    } else {
       showToast("هذه الميزة قيد التطوير", "info");
    }
  };

  const addSlide = () => {
    setCurrentLesson({
      ...currentLesson,
      slides: [...currentLesson.slides, { id: Date.now(), title: `شريحة جديدة ${currentLesson.slides.length + 1}`, content: "" }]
    });
  };

  const updateSlide = (index: number, field: string, value: any) => {
    const newSlides = [...currentLesson.slides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setCurrentLesson({ ...currentLesson, slides: newSlides });
  };

  const removeSlide = (index: number) => {
    if (currentLesson.slides.length === 1) return;
    const newSlides = [...currentLesson.slides];
    newSlides.splice(index, 1);
    setCurrentLesson({ ...currentLesson, slides: newSlides });
  };

  // Advanced Question Logic
  const handleAddQuestion = (source: 'assignments' | 'exercises') => {
    setTempQuestion({
      text: "", type: "MCQ", options: ["", "", "", ""],
      correctAnswer: "", points: 1, skill: "General", level: "Medium",
      learningOutcome: "", standard: "", indicator: "",
      explanation: "", correctAnswers: [], attempts: 1
    });
    setQuestionSource(source);
    setEditingQuestionIndex(null);
    setShowQuestionForm(true);
  };

  const handleEditQuestion = (source: 'assignments' | 'exercises', index: number) => {
    const questions = source === 'assignments' ? currentLesson.assignments : currentLesson.questions;
    setTempQuestion({ ...questions[index] });
    setQuestionSource(source);
    setEditingQuestionIndex(index);
    setShowQuestionForm(true);
  };

  const handleSaveQuestion = () => {
    if (!tempQuestion.text) {
      showToast("يرجى إدخال نص السؤال", "error");
      return;
    }

    if (questionSource === 'assignments') {
      const newAssignments = [...(currentLesson.assignments || [])];
      if (editingQuestionIndex !== null) {
        newAssignments[editingQuestionIndex] = tempQuestion;
      } else {
        newAssignments.push(tempQuestion);
      }
      setCurrentLesson({ ...currentLesson, assignments: newAssignments });
    } else {
      const newQuestions = [...(currentLesson.questions || [])];
      if (editingQuestionIndex !== null) {
        newQuestions[editingQuestionIndex] = tempQuestion;
      } else {
        newQuestions.push(tempQuestion);
      }
      setCurrentLesson({ ...currentLesson, questions: newQuestions });
    }

    setShowQuestionForm(false);
  };



  const removeQuestion = (index: number) => {
    const newQuestions = [...currentLesson.questions];
    newQuestions.splice(index, 1);
    setCurrentLesson({ ...currentLesson, questions: newQuestions });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseData.title) {
      showToast("يرجى إدخال عنوان الكورس", "error");
      return;
    }
    if (!courseData.subjects || courseData.subjects.length === 0) {
      showToast("يرجى اختيار المادة / التخصص", "error");
      return;
    }
    
    setIsLoading(true);
    const token = localStorage.getItem("super_admin_token");
    
    try {
      const lessonsPayload = lessons.map((l) => ({
        ...l,
        attachments: JSON.stringify(l.attachments || []),
        slides: JSON.stringify(l.slides || []),
        questions: JSON.stringify(l.questions || []),
        assignments: JSON.stringify(l.assignments || [])
      }));

      const subjectString = courseData.subjects.join(", ");
      const targetSchoolIds = courseData.schoolIds || [];

      const createOne = async (schoolId: string | null) => {
        const res = await fetch(`${API_URL}/school/courses`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: courseData.title,
            description: courseData.description,
            coverImage: courseData.coverImage,
            grades: courseData.grades,
            subject: subjectString,
            country: courseData.country,
            isCentral: !schoolId,
            schoolId: schoolId || "",
            lessons: lessonsPayload
          })
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "فشل إنشاء الكورس");
        }
      };

      if (targetSchoolIds.length === 0) {
        await createOne(null);
        showToast("تم إنشاء الكورس المركزي بنجاح", "success");
      } else if (targetSchoolIds.length === 1) {
        await createOne(targetSchoolIds[0]);
        showToast("تم إنشاء الكورس بنجاح", "success");
      } else {
        let created = 0;
        for (const sid of targetSchoolIds) {
          await createOne(sid);
          created += 1;
        }
        showToast(`تم إنشاء الكورس وإسناده إلى ${created} مدارس`, "success");
      }

      router.push(`/super-admin/courses`);
    } catch (error) {
      showToast("خطأ في الاتصال بالخادم", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div dir="rtl">
        {isLessonModalOpen ? (
          <div className="max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white border border-slate-200 w-full rounded-[40px] shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="bg-slate-900 p-8 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <Monitor className="w-8 h-8" />
                    {editingLessonIndex !== null ? `تعديل الدرس: ${currentLesson.title}` : "تصميم درس جديد"}
                  </h3>
                  <p className="text-slate-400 mt-1 font-bold">قم ببناء محتوى الدرس والأهداف والتدريبات</p>
                </div>
                <button onClick={() => setIsLessonModalOpen(false)} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex border-b border-slate-100 bg-slate-50/50">
                {[
                  { id: 'info', label: 'الأهداف والبيانات', icon: Target },
                  { id: 'scheduling', label: 'الجدولة والظهور', icon: Clock },
                  { id: 'slides', label: 'محتوى الشرح (Slides)', icon: Layout },
                  { id: 'assignments', label: 'التكاليف (Assignments)', icon: FileText },
                  { id: 'exercises', label: 'التدريبات (Quiz Me)', icon: HelpCircle },
                  { id: 'attachments', label: 'المرفقات', icon: FileDown },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-5 flex items-center justify-center gap-3 font-black text-sm transition-all ${
                      activeTab === tab.id ? 'text-indigo-600 bg-white border-b-2 border-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-8 sm:p-12 overflow-y-auto max-h-[70vh] custom-scrollbar">
                {activeTab === 'info' && (
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">عنوان الدرس</label>
                        <input 
                          type="text" 
                          value={currentLesson.title}
                          onChange={(e) => setCurrentLesson({...currentLesson, title: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 text-lg font-bold outline-none focus:border-indigo-600 transition-all shadow-sm"
                          placeholder="مثال: القوة والحركة في بعد واحد"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">رابط الفيديو (YouTube)</label>
                        <input 
                          type="text" 
                          value={currentLesson.videoUrl}
                          onChange={(e) => setCurrentLesson({...currentLesson, videoUrl: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 text-lg font-bold outline-none focus:border-rose-600 transition-all text-left"
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-[35px] border border-slate-100 space-y-8">
                       <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                          <Target className="w-6 h-6 text-indigo-600" />
                          الأهداف والمعايير الأكاديمية
                       </h4>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest">المعايير (Standards)</label>
                          <select 
                            value={currentLesson.standards}
                            onChange={(e) => setCurrentLesson({...currentLesson, standards: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 text-sm outline-none focus:border-indigo-600 appearance-none"
                          >
                            <option value="">اختر المعيار...</option>
                            <option value="معيار 1: الفهم والاستيعاب">معيار 1: الفهم والاستيعاب</option>
                            <option value="معيار 2: التطبيق والتحليل">معيار 2: التطبيق والتحليل</option>
                            <option value="معيار 3: التفكير النقدي">معيار 3: التفكير النقدي</option>
                          </select>
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">المؤشرات (Indicators)</label>
                          <select 
                            value={currentLesson.indicators}
                            onChange={(e) => setCurrentLesson({...currentLesson, indicators: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 text-sm outline-none focus:border-indigo-600 appearance-none"
                          >
                            <option value="">اختر المؤشر...</option>
                            <option value="مؤشر 1: يحدد المفاهيم الأساسية">مؤشر 1: يحدد المفاهيم الأساسية</option>
                            <option value="مؤشر 2: يطبق القوانين الرياضية">مؤشر 2: يطبق القوانين الرياضية</option>
                            <option value="مؤشر 3: يستنتج العلاقات">مؤشر 3: يستنتج العلاقات</option>
                          </select>
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">نواتج التعلم (LOs)</label>
                          <select 
                            value={currentLesson.learningOutcomes}
                            onChange={(e) => setCurrentLesson({...currentLesson, learningOutcomes: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 text-sm outline-none focus:border-indigo-600 appearance-none"
                          >
                            <option value="">اختر ناتج التعلم...</option>
                            <option value="ناتج 1: أن يكون الطالب قادراً على...">ناتج 1: أن يكون الطالب قادراً على...</option>
                            <option value="ناتج 2: أن يميز الطالب بين...">ناتج 2: أن يميز الطالب بين...</option>
                            <option value="ناتج 3: أن يحلل الطالب...">ناتج 3: أن يحلل الطالب...</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-center mt-6">
                        <button 
                          onClick={() => handleExcelUpload('metadata')}
                          className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all font-black text-xs"
                        >
                          <Upload className="w-4 h-4" />
                          رفع المعايير من Excel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'scheduling' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="bg-indigo-50/50 border border-indigo-100 p-8 rounded-[35px] flex items-center justify-between">
                       <div className="space-y-1">
                          <h4 className="text-xl font-black text-indigo-900">حالة ظهور الدرس</h4>
                          <p className="text-indigo-600/60 font-bold text-sm">تحكم في ما إذا كان الطالب يستطيع رؤية هذا الدرس حالياً</p>
                       </div>
                       <button 
                        onClick={() => setCurrentLesson({...currentLesson, isVisible: !currentLesson.isVisible})}
                        className={`w-20 h-10 rounded-full relative transition-all duration-300 ${currentLesson.isVisible ? 'bg-indigo-600' : 'bg-slate-300'}`}
                       >
                          <div className={`absolute top-1 w-8 h-8 bg-white rounded-full transition-all duration-300 ${currentLesson.isVisible ? 'right-11' : 'right-1'}`}></div>
                       </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm space-y-4">
                          <div className="flex items-center gap-3 text-emerald-600">
                             <CheckCircle2 className="w-6 h-6" />
                             <label className="text-sm font-black uppercase tracking-widest">تاريخ النشر (Publish Date)</label>
                          </div>
                          <p className="text-slate-400 text-xs font-bold">لن يظهر الدرس للطالب قبل هذا التاريخ حتى لو كان وضع "الظهور" مفعلاً</p>
                          <input 
                            type="datetime-local"
                            value={currentLesson.publishDate || ""}
                            onChange={(e) => setCurrentLesson({...currentLesson, publishDate: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all"
                          />
                       </div>

                       <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm space-y-4">
                          <div className="flex items-center gap-3 text-red-500">
                             <AlertCircle className="w-6 h-6" />
                             <label className="text-sm font-black uppercase tracking-widest">تاريخ الانتهاء (Cut-off Date)</label>
                          </div>
                          <p className="text-slate-400 text-xs font-bold">سيختفي الدرس من واجهة الطالب تلقائياً بعد هذا التاريخ</p>
                          <input 
                            type="datetime-local"
                            value={currentLesson.cutOffDate || ""}
                            onChange={(e) => setCurrentLesson({...currentLesson, cutOffDate: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-bold text-slate-700 outline-none focus:border-red-500 transition-all"
                          />
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'assignments' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h4 className="text-xl font-black text-slate-900">تكاليف الدرس (Assignments)</h4>
                        <p className="text-slate-400 text-sm font-bold">مهام تطبيقية متقدمة (نظام MCQ وتفسير إجابة)</p>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleAddQuestion('assignments')}
                          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          إضافة تكليف
                        </button>
                      </div>
                    </div>

                    {showQuestionForm && questionSource === 'assignments' && (
                       <div className="bg-slate-50 border-2 border-indigo-600 rounded-[35px] p-8 space-y-8 animate-in zoom-in-95 duration-300 mb-10">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                            <h5 className="text-lg font-black text-slate-900 flex items-center gap-3">
                              <Edit2 className="w-6 h-6 text-indigo-600" />
                              {editingQuestionIndex !== null ? "تعديل التكليف" : "إضافة تكليف جديد"}
                            </h5>
                            <button onClick={() => setShowQuestionForm(false)} className="text-slate-400 hover:text-slate-900"><X className="w-6 h-6" /></button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المعيار (Standard)</label>
                              <select 
                                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600"
                                value={tempQuestion.standard}
                                onChange={(e) => setTempQuestion({...tempQuestion, standard: e.target.value})}
                              >
                                <option value="">اختر المعيار...</option>
                                {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المؤشر (Indicator)</label>
                              <select 
                                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600"
                                value={tempQuestion.indicator}
                                onChange={(e) => setTempQuestion({...tempQuestion, indicator: e.target.value})}
                              >
                                <option value="">اختر المؤشر...</option>
                                {INDICATORS.map(i => <option key={i} value={i}>{i}</option>)}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ناتج التعلم (LO)</label>
                              <select 
                                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600"
                                value={tempQuestion.learningOutcome}
                                onChange={(e) => setTempQuestion({...tempQuestion, learningOutcome: e.target.value})}
                              >
                                <option value="">اختر ناتج التعلم...</option>
                                {LEARNING_OUTCOMES.map(lo => <option key={lo} value={lo}>{lo}</option>)}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">نوع السؤال</label>
                              <select 
                                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600"
                                value={tempQuestion.type}
                                onChange={(e) => setTempQuestion({...tempQuestion, type: e.target.value, options: e.target.value === "TRUE_FALSE" ? ["صحيح", "خطأ", "", ""] : ["", "", "", ""]})}
                              >
                                {QUESTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المستوى</label>
                              <select 
                                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600"
                                value={tempQuestion.level}
                                onChange={(e) => setTempQuestion({...tempQuestion, level: e.target.value})}
                              >
                                <option value="Easy">سهل</option>
                                <option value="Medium">متوسط</option>
                                <option value="Hard">صعب</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الدرجة</label>
                              <input 
                                type="number"
                                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600"
                                value={tempQuestion.points}
                                onChange={(e) => setTempQuestion({...tempQuestion, points: parseInt(e.target.value)})}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المحاولات</label>
                              <input 
                                type="number"
                                min="1"
                                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600"
                                value={tempQuestion.attempts || 1}
                                onChange={(e) => setTempQuestion({...tempQuestion, attempts: parseInt(e.target.value)})}
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">نص التكليف</label>
                            <RichTextEditor 
                              value={tempQuestion.text}
                              onChange={(val) => setTempQuestion({...tempQuestion, text: val})}
                              placeholder="اكتب تفاصيل التكليف هنا..."
                            />
                         </div>

                         {/* Answer Options for Assignment */}
                         <div className="space-y-3">
                           <label className="text-xs font-black text-slate-400 uppercase tracking-widest">خيارات الإجابة</label>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {tempQuestion.type !== "TRUE_FALSE" ? (
                               <>
                                 {tempQuestion.options.map((opt: string, oIdx: number) => {
                                   const isSelected = tempQuestion.type === "MULTI_SELECT"
                                     ? tempQuestion.correctAnswers?.includes(opt)
                                     : tempQuestion.correctAnswer === opt;
                                   return (
                                     <div key={oIdx} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${isSelected && opt !== "" ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                                       <div
                                         onClick={() => {
                                           if (tempQuestion.type === "MULTI_SELECT") {
                                             const answers = tempQuestion.correctAnswers || [];
                                             if (answers.includes(opt)) {
                                               setTempQuestion({...tempQuestion, correctAnswers: answers.filter((a: string) => a !== opt)});
                                             } else if (opt !== "") {
                                               setTempQuestion({...tempQuestion, correctAnswers: [...answers, opt]});
                                             }
                                           } else {
                                             setTempQuestion({...tempQuestion, correctAnswer: opt});
                                           }
                                         }}
                                         className={`w-7 h-7 rounded-full border-4 cursor-pointer flex items-center justify-center shrink-0 ${isSelected && opt !== "" ? 'bg-emerald-500 border-emerald-200' : 'bg-slate-100 border-white'}`}
                                       >
                                         {isSelected && opt !== "" && <CheckCircle2 className="w-4 h-4 text-white" />}
                                       </div>
                                       <input
                                         type="text"
                                         value={opt}
                                         onChange={(e) => {
                                           const opts = [...tempQuestion.options];
                                           opts[oIdx] = e.target.value;
                                           setTempQuestion({...tempQuestion, options: opts});
                                         }}
                                         className="bg-transparent flex-1 outline-none font-bold text-slate-900"
                                         placeholder={`الخيار ${oIdx + 1}`}
                                       />
                                       {tempQuestion.options.length > 2 && (
                                         <button onClick={() => {
                                           const opts = [...tempQuestion.options];
                                           opts.splice(oIdx, 1);
                                           setTempQuestion({...tempQuestion, options: opts});
                                         }} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                       )}
                                     </div>
                                   );
                                 })}
                                 <div className="flex items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer text-indigo-600 font-bold" onClick={() => setTempQuestion({...tempQuestion, options: [...tempQuestion.options, ""]})}>
                                   <Plus className="w-5 h-5 ml-2" />
                                   إضافة خيار
                                 </div>
                               </>
                             ) : (
                               ["صحيح", "خطأ"].map((opt, oIdx) => (
                                 <div key={oIdx} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${tempQuestion.correctAnswer === opt ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                                   onClick={() => setTempQuestion({...tempQuestion, correctAnswer: opt})}
                                 >
                                   <div className={`w-7 h-7 rounded-full border-4 flex items-center justify-center ${tempQuestion.correctAnswer === opt ? 'bg-emerald-500 border-emerald-200' : 'bg-slate-100 border-white'}`}>
                                     {tempQuestion.correctAnswer === opt && <CheckCircle2 className="w-4 h-4 text-white" />}
                                   </div>
                                   <span className="font-bold text-slate-900">{opt}</span>
                                 </div>
                               ))
                             )}
                           </div>
                         </div>

                         <div className="space-y-3">
                           <label className="text-xs font-black text-slate-400 uppercase tracking-widest">تفسير الإجابة (Explanation)</label>
                           <textarea
                             value={tempQuestion.explanation || ""}
                             onChange={(e) => setTempQuestion({...tempQuestion, explanation: e.target.value})}
                             className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-900 text-sm min-h-[80px] outline-none focus:border-indigo-600"
                             placeholder="اشرح لماذا هذه الإجابة صحيحة..."
                           />
                         </div>

                         <div className="flex justify-end gap-4">
                           <button onClick={() => setShowQuestionForm(false)} className="px-8 py-3 rounded-2xl bg-slate-100 text-slate-500 font-bold">إلغاء</button>
                           <button onClick={handleSaveQuestion} className="px-10 py-3 rounded-2xl bg-indigo-600 text-white font-black shadow-xl shadow-indigo-900/20">حفظ التكليف</button>
                         </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {(currentLesson.assignments || []).map((q: any, index: number) => (
                        <div key={index} className="bg-white border border-slate-100 rounded-3xl p-6 flex justify-between items-center hover:bg-slate-100 transition-all group shadow-sm">
                          <div className="flex items-center gap-6 overflow-hidden">
                            <span className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black">{index + 1}</span>
                            <div className="text-slate-700 font-bold truncate max-w-xl" dangerouslySetInnerHTML={{ __html: q.text.replace(/<[^>]*>?/gm, '').substring(0, 80) + '...' }} />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setTempQuestion(q); setEditingQuestionIndex(index); setShowQuestionForm(true); }} className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"><Edit2 className="w-5 h-5" /></button>
                            <button onClick={() => {
                               const arr = [...currentLesson.assignments];
                               arr.splice(index, 1);
                               setCurrentLesson({...currentLesson, assignments: arr});
                            }} className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'slides' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <Layout className="w-6 h-6 text-indigo-600" />
                        شرائح المحتوى والشرح
                      </h4>
                      <button 
                        onClick={addSlide}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all shadow-lg"
                      >
                        <Plus className="w-5 h-5" />
                        إضافة شريحة
                      </button>
                    </div>

                    <div className="space-y-6">
                      {currentLesson.slides.map((slide: any, sIdx: number) => (
                        <div key={slide.id} className="bg-slate-50 border border-slate-100 rounded-[30px] overflow-hidden group">
                          <div className="bg-slate-100/50 p-4 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <span className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg">{sIdx + 1}</span>
                              <input 
                                type="text"
                                value={slide.title}
                                onChange={(e) => updateSlide(sIdx, 'title', e.target.value)}
                                className="bg-transparent text-slate-900 font-black outline-none border-b border-transparent focus:border-indigo-600 px-2 py-1"
                                placeholder="عنوان الشريحة"
                              />
                            </div>
                            <button 
                              onClick={() => removeSlide(sIdx)}
                              className="text-red-500 hover:text-red-600 p-2 hover:bg-red-500/10 rounded-xl transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="p-6">
                            <RichTextEditor 
                              value={slide.content}
                              onChange={(val) => updateSlide(sIdx, 'content', val)}
                              placeholder="ابدأ بكتابة محتوى الشرح، يمكنك إضافة صور ومعادلات..."
                              className="!bg-white !border-slate-100"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'exercises' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h4 className="text-xl font-black text-slate-900">تدريبات الدرس</h4>
                        <p className="text-slate-400 text-sm font-bold">تمارين تفاعلية تظهر للطالب أثناء دراسة المحتوى</p>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => showToast("جاري فتح بنك الأسئلة المركزي...", "info")} 
                          className="bg-orange-50 text-orange-600 px-6 py-2.5 rounded-xl font-black flex items-center gap-2 hover:bg-orange-600 hover:text-white transition-all border border-orange-100"
                        >
                          <BookOpen className="w-5 h-5" /> بنك الأسئلة
                        </button>
                        <button 
                          onClick={() => handleAddQuestion('exercises')}
                          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          إضافة سؤال
                        </button>
                      </div>
                    </div>

                    {showQuestionForm && (
                      <div className="bg-slate-50 border-2 border-indigo-600 rounded-[35px] p-8 space-y-8 animate-in zoom-in-95 duration-300 mb-10">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                          <h5 className="text-lg font-black text-slate-900 flex items-center gap-3">
                            <Edit2 className="w-6 h-6 text-indigo-600" />
                            {editingQuestionIndex !== null ? "تعديل السؤال" : "إضافة سؤال جديد للتدريبات"}
                          </h5>
                          <button onClick={() => setShowQuestionForm(false)} className="text-slate-400 hover:text-slate-900"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المعيار (Standard)</label>
                            <select 
                              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 appearance-none"
                              value={tempQuestion.standard}
                              onChange={(e) => setTempQuestion({...tempQuestion, standard: e.target.value})}
                            >
                              <option value="">اختر المعيار...</option>
                              {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المؤشر (Indicator)</label>
                            <select 
                              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 appearance-none"
                              value={tempQuestion.indicator}
                              onChange={(e) => setTempQuestion({...tempQuestion, indicator: e.target.value})}
                            >
                              <option value="">اختر المؤشر...</option>
                              {INDICATORS.map(i => <option key={i} value={i}>{i}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ناتج التعلم (LO)</label>
                            <select 
                              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 appearance-none"
                              value={tempQuestion.learningOutcome}
                              onChange={(e) => setTempQuestion({...tempQuestion, learningOutcome: e.target.value})}
                            >
                              <option value="">اختر ناتج التعلم...</option>
                              {LEARNING_OUTCOMES.map(lo => <option key={lo} value={lo}>{lo}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">نوع السؤال</label>
                            <select 
                              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600"
                              value={tempQuestion.type}
                              onChange={(e) => setTempQuestion({...tempQuestion, type: e.target.value, options: e.target.value === "TRUE_FALSE" ? ["صحيح", "خطأ", "", ""] : ["", "", "", ""]})}
                            >
                              {QUESTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المستوى</label>
                            <select 
                              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600"
                              value={tempQuestion.level}
                              onChange={(e) => setTempQuestion({...tempQuestion, level: e.target.value})}
                            >
                              <option value="Easy">سهل</option>
                              <option value="Medium">متوسط</option>
                              <option value="Hard">صعب</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الدرجة</label>
                            <input 
                              type="number"
                              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600"
                              value={tempQuestion.points}
                              onChange={(e) => setTempQuestion({...tempQuestion, points: parseInt(e.target.value)})}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المحاولات</label>
                            <input 
                              type="number"
                              min="1"
                              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600"
                              value={tempQuestion.attempts || 1}
                              onChange={(e) => setTempQuestion({...tempQuestion, attempts: parseInt(e.target.value)})}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">نص السؤال</label>
                          <RichTextEditor 
                            value={tempQuestion.text}
                            onChange={(val) => setTempQuestion({...tempQuestion, text: val})}
                            placeholder="اكتب السؤال هنا..."
                            className="!bg-white !border-slate-100"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">تفسير الإجابة (Explanation)</label>
                          <textarea 
                            value={tempQuestion.explanation}
                            onChange={(e) => setTempQuestion({...tempQuestion, explanation: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-900 text-sm min-h-[80px] outline-none focus:border-indigo-600"
                            placeholder="اشرح لماذا هذه الإجابة صحيحة..."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {tempQuestion.type !== "TRUE_FALSE" ? (
                            <>
                              {tempQuestion.options.map((opt: string, oIdx: number) => {
                                const isSelected = tempQuestion.type === "MULTI_SELECT" 
                                  ? tempQuestion.correctAnswers?.includes(opt) 
                                  : tempQuestion.correctAnswer === opt;
                                return (
                                  <div key={oIdx} className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${isSelected && opt !== "" ? 'bg-emerald-50 border-emerald-600' : 'bg-slate-50 border-slate-100'}`}>
                                    <div 
                                      onClick={() => {
                                        if (tempQuestion.type === "MULTI_SELECT") {
                                          const answers = tempQuestion.correctAnswers || [];
                                          if (answers.includes(opt)) {
                                            setTempQuestion({...tempQuestion, correctAnswers: answers.filter((a: string) => a !== opt)});
                                          } else if (opt !== "") {
                                            setTempQuestion({...tempQuestion, correctAnswers: [...answers, opt]});
                                          }
                                        } else {
                                          setTempQuestion({...tempQuestion, correctAnswer: opt});
                                        }
                                      }}
                                      className={`w-7 h-7 rounded-full border-4 cursor-pointer flex items-center justify-center ${isSelected && opt !== "" ? 'bg-white border-emerald-400' : 'bg-slate-200 border-white'}`}
                                    >
                                      {isSelected && opt !== "" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                    </div>
                                    <input 
                                      type="text"
                                      value={opt}
                                      onChange={(e) => {
                                        const opts = [...tempQuestion.options];
                                        opts[oIdx] = e.target.value;
                                        setTempQuestion({...tempQuestion, options: opts});
                                      }}
                                      className={`bg-transparent flex-1 outline-none font-bold ${isSelected && opt !== "" ? 'text-slate-900' : 'text-slate-900'}`}
                                      placeholder={`الخيار ${oIdx + 1}`}
                                    />
                                    {tempQuestion.options.length > 2 && (
                                      <button onClick={() => {
                                          const opts = [...tempQuestion.options];
                                          opts.splice(oIdx, 1);
                                          setTempQuestion({...tempQuestion, options: opts});
                                      }} className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                                    )}
                                  </div>
                                );
                              })}
                              <div className="flex items-center justify-center p-5 rounded-[22px] border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer text-indigo-600 font-bold" onClick={() => setTempQuestion({...tempQuestion, options: [...tempQuestion.options, ""]})}>
                                <Plus className="w-5 h-5 ml-2" />
                                إضافة خيار
                              </div>
                            </>
                          ) : (
                            ["صحيح", "خطأ"].map((opt, oIdx) => (
                              <div key={oIdx} className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${tempQuestion.correctAnswer === opt ? 'bg-emerald-600 border-emerald-700' : 'bg-slate-50 border-slate-100'}`}>
                                <div 
                                  onClick={() => setTempQuestion({...tempQuestion, correctAnswer: opt})}
                                  className={`w-7 h-7 rounded-full border-4 cursor-pointer flex items-center justify-center ${tempQuestion.correctAnswer === opt ? 'bg-white border-emerald-400' : 'bg-slate-200 border-white'}`}
                                >
                                  {tempQuestion.correctAnswer === opt && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                </div>
                                <span className={`font-bold ${tempQuestion.correctAnswer === opt ? 'text-white' : 'text-slate-900'}`}>{opt}</span>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="flex justify-end gap-4">
                          <button onClick={() => setShowQuestionForm(false)} className="px-8 py-3 rounded-2xl bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 transition-all">إلغاء</button>
                          <button onClick={handleSaveQuestion} className="px-10 py-3 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/20">حفظ السؤال</button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {currentLesson.questions.map((q: any, index: number) => (
                        <div key={index} className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex justify-between items-center hover:bg-slate-100 transition-all group shadow-sm">
                          <div className="flex items-center gap-6 overflow-hidden">
                            <span className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-indigo-600 font-black shadow-sm">{index + 1}</span>
                            <div className="overflow-hidden">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">{q.type}</span>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">{q.level} • {q.points} pts</span>
                                {q.standard && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{q.standard}</span>}
                              </div>
                              <div className="text-slate-700 font-bold truncate max-w-xl" dangerouslySetInnerHTML={{ __html: q.text.replace(/<[^>]*>?/gm, '').substring(0, 80) + '...' }} />
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditQuestion('exercises', index)} className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"><Edit2 className="w-5 h-5" /></button>
                            <button onClick={() => removeQuestion(index)} className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        </div>
                      ))}
                      {currentLesson.questions.length === 0 && !showQuestionForm && (
                        <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-[40px]">
                           <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                           <p className="text-slate-400 font-bold">لا يوجد أسئلة لهذا الدرس حتى الآن.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'attachments' && (
                  <div className="space-y-8">
                     <div className="flex justify-between items-center mb-6">
                        <h4 className="text-xl font-black text-slate-900">الملفات والمرفقات</h4>
                        <button 
                          onClick={() => setCurrentLesson({...currentLesson, attachments: [...(currentLesson.attachments || []), { name: "", url: "", type: "PDF" }]})}
                          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          إضافة ملف
                        </button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(currentLesson.attachments || []).map((att: any, attIdx: number) => (
                          <div key={attIdx} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
                            <div className="flex justify-between items-start">
                              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                                <FileText className="w-6 h-6" />
                              </div>
                              <button 
                                onClick={() => {
                                  const atts = [...currentLesson.attachments];
                                  atts.splice(attIdx, 1);
                                  setCurrentLesson({...currentLesson, attachments: atts});
                                }}
                                className="text-red-500 hover:text-red-600 p-2"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                            <div className="space-y-4">
                              <input 
                                type="text"
                                value={att.name}
                                onChange={(e) => {
                                  const atts = [...currentLesson.attachments];
                                  atts[attIdx].name = e.target.value;
                                  setCurrentLesson({...currentLesson, attachments: atts});
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-sm outline-none focus:border-indigo-600"
                                placeholder="اسم الملف"
                              />
                              <div className="flex gap-3">
                                <select 
                                  value={att.type}
                                  onChange={(e) => {
                                    const atts = [...currentLesson.attachments];
                                    atts[attIdx].type = e.target.value;
                                    setCurrentLesson({...currentLesson, attachments: atts});
                                  }}
                                  className="w-32 bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-xs outline-none focus:border-indigo-600"
                                >
                                  <option value="PDF">PDF</option>
                                  <option value="PPT">PPT</option>
                                  <option value="DOC">DOC</option>
                                  <option value="XLS">XLS</option>
                                  <option value="IMAGE">IMAGE</option>
                                </select>
                                <input 
                                  type="text"
                                  value={att.url}
                                  onChange={(e) => {
                                    const atts = [...currentLesson.attachments];
                                    atts[attIdx].url = e.target.value;
                                    setCurrentLesson({...currentLesson, attachments: atts});
                                  }}
                                  className="flex-1 bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-xs outline-none text-left font-mono focus:border-indigo-600"
                                  placeholder="رابط الملف الخارجي (URL)"
                                  dir="ltr"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                     </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
                <button 
                  onClick={() => setIsLessonModalOpen(false)}
                  className="px-10 py-4 rounded-2xl bg-white border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all"
                >
                  إلغاء التغييرات
                </button>
                <button 
                  onClick={saveLesson}
                  className="px-12 py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/20 flex items-center gap-3"
                >
                  تأكيد وحفظ الدرس
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-6 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-6">
                <button onClick={() => router.back()} className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-slate-100">
                  <ArrowLeft className="w-7 h-7" />
                </button>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900">إنشاء كورس تعليمي</h1>
                  <p className="text-slate-400 text-lg mt-1 font-bold">صمم تجربة تعلم متكاملة لطلابك</p>
                </div>
              </div>
              <button 
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-12 py-5 rounded-[22px] font-black flex items-center gap-3 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all disabled:opacity-50"
              >
                {isLoading ? "جاري النشر..." : "حفظ ونشر الكورس"}
                <Save className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Left Side: Course Settings */}
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-600/10 transition-all"></div>
                  <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3 relative z-10">
                    <Settings className="w-6 h-6 text-indigo-600" />
                    إعدادات الكورس
                  </h2>
                  
                  <div className="space-y-6 relative z-10">
                    {/* Cover Image Upload */}
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">صورة الغلاف</label>
                      <div className="relative group cursor-pointer">
                        {courseData.coverImage ? (
                          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-slate-100 group-hover:border-indigo-400 transition-all">
                            <img src={courseData.coverImage} className="w-full h-full object-cover" alt="Cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                                <button onClick={() => setCourseData({...courseData, coverImage: ""})} className="p-2 bg-red-500 text-white rounded-xl hover:scale-110 transition-all shadow-lg"><Trash2 className="w-5 h-5" /></button>
                                <label className="p-2 bg-indigo-600 text-white rounded-xl hover:scale-110 transition-all cursor-pointer shadow-lg">
                                  <Upload className="w-5 h-5" />
                                  <input type="file" className="hidden" accept="image/*" onChange={async (e: any) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (re) => {
                                        const result = re.target?.result as string;
                                        if(confirm("هل تريد اعتماد هذه الصورة كغلاف؟")) {
                                           setCourseData({...courseData, coverImage: result});
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }} />
                                </label>
                            </div>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center aspect-video w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all group cursor-pointer">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm mb-3">
                              <Upload className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 group-hover:text-indigo-600">رفع غلاف الكورس</span>
                            <input type="file" className="hidden" accept="image/*" onChange={async (e: any) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                       const reader = new FileReader();
                                       reader.onload = (re) => {
                                          const result = re.target?.result as string;
                                          if(confirm("هل تريد اعتماد هذه الصورة كغلاف؟")) {
                                             setCourseData({...courseData, coverImage: result});
                                          }
                                       };
                                       reader.readAsDataURL(file);
                                    }
                                  }} />
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">عنوان الكورس</label>
                      <input 
                        type="text" 
                        value={courseData.title}
                        onChange={(e) => setCourseData({...courseData, title: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all"
                        placeholder="مثال: الرياضيات المتقدمة"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">وصف الكورس</label>
                      <textarea 
                        value={courseData.description}
                        onChange={(e) => setCourseData({...courseData, description: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all min-h-[120px] resize-none"
                        placeholder="نبذة مختصرة عن أهداف الكورس..."
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">الدولة</label>
                        <select 
                          value={courseData.country}
                          onChange={(e) => setCourseData({...courseData, country: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all appearance-none"
                        >
                          <option value="مصر">مصر</option>
                          <option value="السعودية">السعودية</option>
                          <option value="الإمارات">الإمارات</option>
                          <option value="الكويت">الكويت</option>
                          <option value="قطر">قطر</option>
                          <option value="عمان">عمان</option>
                          <option value="البحرين">البحرين</option>
                          <option value="الأردن">الأردن</option>
                        </select>
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">المراحل الدراسية</label>
                        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 max-h-[250px] overflow-y-auto custom-scrollbar">
                          {GRADES.map(g => (
                            <label key={g} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${courseData.grades.includes(g) ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-transparent hover:border-slate-200'}`}>
                              <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${courseData.grades.includes(g) ? 'bg-indigo-600 text-white' : 'bg-slate-100 border border-slate-200'}`}>
                                {courseData.grades.includes(g) && <CheckCircle2 className="w-4 h-4" />}
                              </div>
                              <span className={`text-sm font-bold ${courseData.grades.includes(g) ? 'text-indigo-900' : 'text-slate-600'}`}>{g}</span>
                              <input type="checkbox" className="hidden" checked={courseData.grades.includes(g)} onChange={(e) => {
                                if(e.target.checked) setCourseData({...courseData, grades: [...courseData.grades, g]});
                                else setCourseData({...courseData, grades: courseData.grades.filter(gr => gr !== g)});
                              }} />
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">المادة / التخصص <span className="text-red-500">*</span></label>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-[200px] overflow-y-auto custom-scrollbar flex flex-wrap gap-2">
                          {CATEGORIES.map((cat) => (
                            <label
                              key={cat}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                                courseData.subjects.includes(cat)
                                  ? "bg-indigo-50 border-indigo-500 text-indigo-900"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={courseData.subjects.includes(cat)}
                                onChange={() => toggleCourseSubject(cat)}
                              />
                              <div
                                className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                                  courseData.subjects.includes(cat)
                                    ? "bg-indigo-600 text-white"
                                    : "bg-slate-100 border border-slate-200"
                                }`}
                              >
                                {courseData.subjects.includes(cat) && <CheckCircle2 className="w-3 h-3" />}
                              </div>
                              <span className="text-xs font-black">{cat}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold">يمكن اختيار أكثر من مادة وسيتم حفظها كوسوم داخل نفس الكورس.</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">إسناد الكورس للمدرسة</label>
                      {schools.length === 0 ? (
                        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-500 font-bold text-sm">
                          لا توجد مدارس مضافة
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-center px-2 mb-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">اختر المدارس (اختياري):</span>
                            <button
                              type="button"
                              onClick={selectAllSchools}
                              className="text-[10px] font-black text-indigo-600 hover:underline"
                            >
                              {(courseData.schoolIds || []).length === schools.length ? "إلغاء الكل" : "تحديد كافة المدارس"}
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-[250px] overflow-y-auto custom-scrollbar">
                            {schools.map((s) => (
                              <label
                                key={s.id}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                  (courseData.schoolIds || []).includes(s.id)
                                    ? "bg-indigo-50 border-indigo-500"
                                    : "bg-white border-transparent hover:border-slate-200"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={(courseData.schoolIds || []).includes(s.id)}
                                  onChange={() => toggleCourseSchool(s.id)}
                                />
                                <div
                                  className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                                    (courseData.schoolIds || []).includes(s.id)
                                      ? "bg-indigo-600 text-white"
                                      : "bg-slate-100 border border-slate-200"
                                  }`}
                                >
                                  {(courseData.schoolIds || []).includes(s.id) && <CheckCircle2 className="w-3 h-3" />}
                                </div>
                                <span className="text-xs font-bold text-slate-700">{s.name}</span>
                              </label>
                            ))}
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold">
                            لو ما اخترتش مدارس: الكورس يبقى مركزي. لو اخترت أكثر من مدرسة: النظام هيعمل نسخة من نفس الكورس لكل مدرسة.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[40px] flex items-center gap-6">
                   <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                      <ListOrdered className="w-8 h-8" />
                   </div>
                   <div>
                      <h4 className="text-xl font-black text-slate-900">محتوى الكورس</h4>
                      <p className="text-indigo-600 font-bold">{lessons.length} دروس مكتملة حتى الآن</p>
                   </div>
                </div>
              </div>

              {/* Right Side: Lessons Management */}
              <div className="lg:col-span-8 space-y-8">
                <div className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
                    <Layers className="w-8 h-8 text-indigo-600" />
                    هيكل الدروس والمحاضرات
                  </h3>
                  <button 
                    onClick={openAddLessonModal}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl shadow-indigo-600/20"
                  >
                    <Plus className="w-6 h-6" />
                    إضافة درس جديد
                  </button>
                </div>

                {lessons.length === 0 ? (
                  <div className="bg-white border-4 border-dashed border-slate-100 rounded-[50px] p-24 text-center group cursor-pointer hover:border-indigo-500/20 transition-all" onClick={openAddLessonModal}>
                    <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-all">
                      <Monitor className="w-12 h-12 text-slate-300 group-hover:text-indigo-600" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-3">ابدأ ببناء كورس أحلامك!</h3>
                    <p className="text-slate-400 font-bold max-w-sm mx-auto mb-10 leading-relaxed text-lg">لم يتم إضافة أي دروس بعد. قم بإضافة دروس تتضمن فيديو، شرائح شرح، وتدريبات تفاعلية.</p>
                    <button className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-xl shadow-indigo-600/20">
                      إضافة الدرس الأول الآن
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {lessons.map((lesson, index) => (
                      <div key={index} className="bg-white border border-slate-100 rounded-[40px] p-8 hover:border-indigo-500/30 transition-all group relative overflow-hidden shadow-sm hover:shadow-xl">
                        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-all"></div>
                        <div className="flex justify-between items-start mb-6">
                          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-2xl border border-indigo-100">
                            {index + 1}
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => openEditLessonModal(index)}
                              className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all border border-blue-100"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleRemoveLesson(index)}
                              className="w-12 h-12 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all border border-red-100"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        <h3 className="font-black text-slate-900 text-2xl mb-4 truncate leading-tight group-hover:text-indigo-600 transition-colors">{lesson.title || "درس بدون عنوان"}</h3>
                        <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-400">
                          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <Monitor className={`w-4 h-4 ${lesson.slides?.length ? 'text-indigo-600' : 'text-slate-300'}`} />
                            {lesson.slides?.length || 0} شرائح شرح
                          </div>
                          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <HelpCircle className={`w-4 h-4 ${lesson.questions?.length ? 'text-amber-500' : 'text-slate-300'}`} />
                            {lesson.questions?.length || 0} تدريبات
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
