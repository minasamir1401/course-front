"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL, getFullImageUrl } from '@/lib/api';
import { useNotification } from "@/context/NotificationContext";
import SuperAdminSidebar from "@/components/SuperAdminSidebar";
import {
  ArrowLeft, Plus, Trash2, Video, FileText,
  HelpCircle, BookOpen, Save, Layers, Edit2, X,
  ChevronDown, ChevronUp, Play, Layout, Target,
  CheckCircle2, AlertCircle, Upload, Download, Settings,
  Eye, Monitor, ListOrdered, FileJson, Clock
} from "lucide-react";
import * as XLSX from 'xlsx';
import RichTextEditor from "@/components/RichTextEditor";
import { compressImage } from "@/lib/image-utils";


export default function EditCoursePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useNotification();
  const courseId = searchParams.get('id');
  const schoolIdParam = searchParams.get('schoolId');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);

  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    coverImage: "",
    grades: ["الصف الأول الثانوي"] as string[],
    subject: "",
    country: "مصر",
    isCentral: false,
    schoolId: schoolIdParam || ""
  });

  const [lessons, setLessons] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [activeContentTab, setActiveContentTab] = useState<'lessons' | 'quizzes' | 'assignments'>('lessons');
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLessonIndex, setEditingLessonIndex] = useState<number | null>(null);

  // Collapsible panel state
  const [courseSettingsCollapsed, setCourseSettingsCollapsed] = useState(false);

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
    slides: [{ id: Date.now(), title: "المقدمة", content: "" }],
    questions: [],
    attachments: []
  });

  // UI States for Lesson Modal
  const [activeTab, setActiveTab] = useState<'info' | 'slides' | 'exercises' | 'attachments' | 'scheduling'>('info');
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [tempQuestion, setTempQuestion] = useState<any>({
    text: "", type: "MCQ", options: ["", "", "", ""],
    correctAnswer: "", points: 1, skill: "General", level: "Medium",
    learningOutcome: "", explanation: "", correctAnswers: [], attempts: 1
  });

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

  useEffect(() => {
    const token = localStorage.getItem("super_admin_token");
    if (!token) {
      router.push("/super-admin/login");
      return;
    }
    fetchSchools(token);
    if (courseId) {
      fetchCourseData(token, courseId);
    }
  }, [courseId]);

  const fetchSchools = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/schools`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSchools(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch schools");
    }
  };

  const fetchCourseData = async (token: string, id: string) => {
    try {
      const res = await fetch(`${API_URL}/courses/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        let parsedGrades = ["الصف الأول الثانوي"];
        try {
          if (data.grades && typeof data.grades === 'string') {
            parsedGrades = JSON.parse(data.grades);
          } else if (Array.isArray(data.grades)) {
            parsedGrades = data.grades;
          } else if (data.grade) {
            parsedGrades = [data.grade];
          }
        } catch (e) {
          parsedGrades = data.grade ? [data.grade] : ["الصف الأول الثانوي"];
        }

        setCourseData({
          title: data.title,
          description: data.description || "",
          coverImage: data.coverImage || "",
          grades: parsedGrades,
          subject: data.subject || "",
          country: data.country || "مصر",
          isCentral: data.isCentral,
          schoolId: data.schoolId || ""
        });
        
        setExams(data.exams || []);

        setLessons(data.lessons.map((l: any) => {
          let parsedQuestions = [];
          let parsedAttachments = [];
          let parsedSlides = [];

          try {
            parsedQuestions = typeof l.questions === 'string' ? JSON.parse(l.questions) : (l.questions || []);
          } catch (e) { parsedQuestions = []; }

          try {
            parsedAttachments = typeof l.attachments === 'string' ? JSON.parse(l.attachments) : (l.attachments || []);
          } catch (e) { parsedAttachments = []; }

          try {
            parsedSlides = typeof l.slides === 'string' ? JSON.parse(l.slides) : (l.slides || []);
          } catch (e) { parsedSlides = [{ id: Date.now(), title: "المقدمة", content: "" }]; }

          return {
            ...l,
            isVisible: l.isVisible !== undefined ? l.isVisible : true,
            publishDate: l.publishDate ? new Date(l.publishDate).toISOString().slice(0, 16) : "",
            cutOffDate: l.cutOffDate ? new Date(l.cutOffDate).toISOString().slice(0, 16) : "",
            questions: Array.isArray(parsedQuestions) ? parsedQuestions : [],
            attachments: Array.isArray(parsedAttachments) ? parsedAttachments : [],
            slides: Array.isArray(parsedSlides) && parsedSlides.length ? parsedSlides : [{ id: Date.now(), title: "المقدمة", content: "" }]
          };
        }));
      }
    } catch (error) {
      showToast("خطأ في الاتصال", "error");
    } finally {
      setIsLoading(false);
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
      title: "", videoUrl: "", summary: "", notes: "", standards: "", indicators: "", learningOutcomes: "",
      isVisible: true, publishDate: "", cutOffDate: "",
      slides: [{ id: Date.now(), title: "المقدمة", content: "" }],
      questions: [], attachments: []
    });
    setActiveTab('info');
    setIsLessonModalOpen(true);
  };

  const openEditLessonModal = (index: number) => {
    setEditingLessonIndex(index);
    const lessonToEdit = { ...lessons[index] };
    if (!lessonToEdit.slides || lessonToEdit.slides.length === 0) lessonToEdit.slides = [{ id: Date.now(), title: "المقدمة", content: "" }];
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
  const handleExcelUpload = (type: 'questions' | 'metadata') => {
    showToast("هذه الميزة تم تعطيلها من قبل المسؤول", "info");
  };

  const addSlide = () => {
    setCurrentLesson({
      ...currentLesson,
      slides: [...(currentLesson.slides || []), { id: Date.now(), title: `شريحة جديدة ${(currentLesson.slides?.length || 0) + 1}`, content: "" }]
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

  const handleAddQuestion = () => {
    setTempQuestion({
      text: "", type: "MCQ", options: ["", "", "", ""],
      correctAnswer: "", points: 1, skill: "General", level: "Medium",
      learningOutcome: "", explanation: "", correctAnswers: [], attempts: 1
    });
    setEditingQuestionIndex(null);
    setShowQuestionForm(true);
  };

  const handleEditQuestion = (index: number) => {
    setTempQuestion({ ...currentLesson.questions[index] });
    setEditingQuestionIndex(index);
    setShowQuestionForm(true);
  };

  const handleSaveQuestion = () => {
    if (!tempQuestion.text) {
      showToast("يرجى إدخال نص السؤال", "error");
      return;
    }
    const newQuestions = [...currentLesson.questions];
    if (editingQuestionIndex !== null) {
      newQuestions[editingQuestionIndex] = tempQuestion;
    } else {
      newQuestions.push(tempQuestion);
    }
    setCurrentLesson({ ...currentLesson, questions: newQuestions });
    setShowQuestionForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseData.title) {
      showToast("يرجى إدخال عنوان الكورس", "error");
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("super_admin_token");

    try {
      const res = await fetch(`${API_URL}/school/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...courseData,
          lessons: lessons.map(l => ({
            ...l,
            attachments: JSON.stringify(l.attachments || []),
            slides: JSON.stringify(l.slides || []),
            questions: JSON.stringify(l.questions || [])
          }))
        })
      });

      if (res.ok) {
        showToast("تم تحديث الكورس بنجاح", 'success');
        router.push(`/super-admin/courses`);
      } else {
        const data = await res.json();
        showToast(data.error || "فشل تحديث الكورس", 'error');
      }
    } catch (error) {
      showToast("خطأ في الاتصال بالخادم", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الكورس نهائياً؟")) return;
    const token = localStorage.getItem("super_admin_token");
    try {
      const res = await fetch(`${API_URL}/school/courses/${courseId}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("تم حذف الكورس بنجاح", 'success');
        router.back();
      }
    } catch (error) { showToast("خطأ في الاتصال", "error"); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900" dir="rtl">
      <SuperAdminSidebar />

      <main className="lg:mr-64 p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
        {isLessonModalOpen ? (
          <div className="max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white border border-slate-200 w-full rounded-[40px] shadow-2xl overflow-hidden">
              <div className="bg-indigo-600 p-8 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <Edit2 className="w-8 h-8" />
                    {editingLessonIndex !== null ? `تعديل الدرس: ${currentLesson.title}` : "إضافة درس جديد"}
                  </h3>
                  <p className="text-indigo-100/60 mt-1 font-bold">قم بتحديث محتوى الدرس والأنشطة التفاعلية</p>
                </div>
                <button onClick={() => setIsLessonModalOpen(false)} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex border-b border-slate-100 bg-slate-50">
                {[
                  { id: 'info', label: 'البيانات الأساسية', icon: BookOpen },
                  { id: 'scheduling', label: 'الجدولة والظهور', icon: Clock },
                  { id: 'slides', label: 'محتوى الشرح', icon: Layout },
                  { id: 'exercises', label: 'التدريبات', icon: HelpCircle },
                  { id: 'attachments', label: 'المرفقات', icon: FileText },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-5 flex items-center justify-center gap-3 font-black text-sm transition-all ${activeTab === tab.id ? 'text-indigo-600 bg-white border-b-2 border-indigo-600 shadow-[0_4px_20px_-10px_rgba(79,70,229,0.4)]' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                      }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-8 sm:p-12 overflow-y-auto max-h-[70vh] custom-scrollbar bg-white">
                {activeTab === 'info' && (
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase mb-3 block tracking-widest">عنوان الدرس</label>
                        <input
                          type="text"
                          placeholder="مثال: مقدمة في علم الفيزياء"
                          value={currentLesson.title || ""}
                          onChange={(e) => setCurrentLesson({ ...currentLesson, title: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 text-lg font-bold outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase mb-3 block tracking-widest">رابط الفيديو (YouTube)</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="https://youtube.com/watch?v=..."
                            value={currentLesson.videoUrl || ""}
                            onChange={(e) => setCurrentLesson({ ...currentLesson, videoUrl: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 text-lg font-bold outline-none focus:border-indigo-600 focus:bg-white transition-all text-left pl-12 shadow-sm"
                            dir="ltr"
                          />
                          <Video className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-8 rounded-[35px] space-y-8">
                      <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                           <Target className="w-5 h-5 text-white" />
                        </div>
                        المعايير والمخرجات الأكاديمية
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">المعايير (Standards)</label>
                          <input
                            list="standards-list"
                            value={currentLesson.standards || ""}
                            onChange={(e) => setCurrentLesson({ ...currentLesson, standards: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all shadow-sm"
                            placeholder="اختر أو اكتب معياراً..."
                          />
                          <datalist id="standards-list">
                            <option value="معايير وزارة التربية والتعليم" />
                            <option value="المعايير الدولية (IGCSE)" />
                            <option value="المعايير الأمريكية (SAT)" />
                          </datalist>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">المؤشرات (Indicators)</label>
                          <input
                            list="indicators-list"
                            value={currentLesson.indicators || ""}
                            onChange={(e) => setCurrentLesson({ ...currentLesson, indicators: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all shadow-sm"
                            placeholder="اختر أو اكتب مؤشراً..."
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">نواتج التعلم (Outcomes)</label>
                          <input
                            list="outcomes-list"
                            value={currentLesson.learningOutcomes || ""}
                            onChange={(e) => setCurrentLesson({ ...currentLesson, learningOutcomes: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all shadow-sm"
                            placeholder="اختر أو اكتب ناتجاً..."
                          />
                        </div>
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

                {activeTab === 'slides' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xl font-black text-slate-900">شرائح المحتوى</h4>
                      <button onClick={addSlide} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all"><Plus className="w-5 h-5" /> إضافة شريحة</button>
                    </div>
                    {currentLesson.slides.map((slide: any, sIdx: number) => (
                      <div key={slide.id} className="bg-white border border-slate-200 rounded-[30px] overflow-hidden group hover:border-indigo-200 transition-all shadow-sm">
                        <div className="bg-slate-50 p-4 flex justify-between items-center border-b border-slate-100">
                          <div className="flex items-center gap-4">
                            <span className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-white">{sIdx + 1}</span>
                            <input type="text" value={slide.title} onChange={(e) => updateSlide(sIdx, 'title', e.target.value)} className="bg-transparent text-slate-900 font-black outline-none border-b border-transparent focus:border-indigo-600 px-2 py-1" />
                          </div>
                          <button onClick={() => removeSlide(sIdx)} className="text-red-500 hover:text-red-700 p-2"><Trash2 className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6">
                          <RichTextEditor value={slide.content} onChange={(val) => updateSlide(sIdx, 'content', val)} className="!bg-white !border-slate-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'exercises' && (
                  <div className="space-y-8">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xl font-black text-slate-900">تدريبات الدرس</h4>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => showToast("جاري فتح بنك الأسئلة المركزي...", "info")} 
                            className="bg-orange-50 text-orange-600 px-6 py-2.5 rounded-xl font-black flex items-center gap-2 hover:bg-orange-600 hover:text-white transition-all border border-orange-100"
                          >
                            <BookOpen className="w-5 h-5" /> بنك الأسئلة
                          </button>
                          <button onClick={handleAddQuestion} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all"><Plus className="w-5 h-5" /> إضافة سؤال</button>
                        </div>
                      </div>

                    {showQuestionForm && (
                      <div className="bg-white border-2 border-indigo-600 rounded-[35px] p-8 space-y-8 animate-in zoom-in-95 duration-300 shadow-xl">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">نوع السؤال</label>
                            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600" value={tempQuestion.type} onChange={(e) => setTempQuestion({ ...tempQuestion, type: e.target.value, options: e.target.value === "TRUE_FALSE" ? ["صحيح", "خطأ", "", ""] : ["", "", "", ""] })}>
                              {QUESTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">المستوى</label>
                            <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600" value={tempQuestion.level} onChange={(e) => setTempQuestion({ ...tempQuestion, level: e.target.value })}>
                              <option value="Easy">سهل</option><option value="Medium">متوسط</option><option value="Hard">صعب</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">الدرجة</label>
                            <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600" value={tempQuestion.points} onChange={(e) => setTempQuestion({ ...tempQuestion, points: parseInt(e.target.value) })} placeholder="الدرجة" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">ناتج التعلم (LO)</label>
                            <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600" value={tempQuestion.learningOutcome} onChange={(e) => setTempQuestion({ ...tempQuestion, learningOutcome: e.target.value })} placeholder="ناتج التعلم" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">المحاولات</label>
                            <input type="number" min="1" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600" value={tempQuestion.attempts || 1} onChange={(e) => setTempQuestion({ ...tempQuestion, attempts: parseInt(e.target.value) })} />
                          </div>
                        </div>
                        <RichTextEditor value={tempQuestion.text} onChange={(val) => setTempQuestion({ ...tempQuestion, text: val })} placeholder="نص السؤال..." className="!bg-white !border-slate-100" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {tempQuestion.type !== "TRUE_FALSE" ? tempQuestion.options.map((opt: string, oIdx: number) => (
                            <div key={oIdx} className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${tempQuestion.correctAnswer === opt && opt !== "" ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-transparent'}`}>
                              <div onClick={() => setTempQuestion({ ...tempQuestion, correctAnswer: opt })} className={`w-7 h-7 rounded-full border-4 cursor-pointer flex items-center justify-center ${tempQuestion.correctAnswer === opt && opt !== "" ? 'bg-emerald-500 border-white' : 'bg-white border-slate-200'}`}>{tempQuestion.correctAnswer === opt && opt !== "" && <CheckCircle2 className="w-4 h-4 text-white" />}</div>
                              <input type="text" value={opt} onChange={(e) => { const opts = [...tempQuestion.options]; opts[oIdx] = e.target.value; setTempQuestion({ ...tempQuestion, options: opts }); }} className="bg-transparent flex-1 outline-none text-slate-900 font-bold" placeholder={`الخيار ${oIdx + 1}`} />
                            </div>
                          )) : ["صحيح", "خطأ"].map((opt, oIdx) => (
                            <div key={oIdx} className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${tempQuestion.correctAnswer === opt ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-transparent'}`}>
                              <div onClick={() => setTempQuestion({ ...tempQuestion, correctAnswer: opt })} className={`w-7 h-7 rounded-full border-4 cursor-pointer flex items-center justify-center ${tempQuestion.correctAnswer === opt ? 'bg-emerald-500 border-white' : 'bg-white border-slate-200'}`}>{tempQuestion.correctAnswer === opt && <CheckCircle2 className="w-4 h-4 text-white" />}</div>
                              <span className="text-slate-900 font-bold">{opt}</span>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">تفسير الإجابة (Explanation)</label>
                          <textarea
                            value={tempQuestion.explanation}
                            onChange={(e) => setTempQuestion({ ...tempQuestion, explanation: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all resize-none h-24"
                            placeholder="اشرح للطالب سبب كون هذه الإجابة هي الصحيحة..."
                          />
                        </div>
                        <div className="flex justify-end gap-4">
                          <button onClick={() => setShowQuestionForm(false)} className="px-8 py-3 rounded-2xl bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 transition-all">إلغاء</button>
                          <button onClick={handleSaveQuestion} className="px-10 py-3 rounded-2xl bg-indigo-600 text-white font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all">حفظ السؤال</button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {currentLesson.questions.map((q: any, index: number) => (
                        <div key={index} className="bg-white border border-slate-100 rounded-3xl p-6 flex justify-between items-center group hover:border-indigo-200 transition-all shadow-sm">
                          <div className="flex items-center gap-6 overflow-hidden">
                            <span className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-600 font-black border border-slate-100">{index + 1}</span>
                            <div className="text-slate-900 font-bold truncate max-w-xl" dangerouslySetInnerHTML={{ __html: q.text.replace(/<[^>]*>?/gm, '').substring(0, 80) + '...' }} />
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditQuestion(index)} className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"><Edit2 className="w-5 h-5" /></button>
                            <button onClick={() => { const nq = [...currentLesson.questions]; nq.splice(index, 1); setCurrentLesson({ ...currentLesson, questions: nq }); }} className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'attachments' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xl font-black text-slate-900">الملفات المرفقة</h4>
                      <button onClick={() => setCurrentLesson({ ...currentLesson, attachments: [...(currentLesson.attachments || []), { name: "", url: "", type: "PDF" }] })} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg"><Plus className="w-5 h-5" /> إضافة ملف</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(currentLesson.attachments || []).map((att: any, attIdx: number) => (
                        <div key={attIdx} className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 hover:border-indigo-100 transition-all shadow-sm">
                          <div className="flex justify-between items-start">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><FileText className="w-6 h-6" /></div>
                            <button onClick={() => { const atts = [...currentLesson.attachments]; atts.splice(attIdx, 1); setCurrentLesson({ ...currentLesson, attachments: atts }); }} className="text-red-500 hover:text-red-700 p-2 transition-colors"><Trash2 size={20} /></button>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">اسم الملف</label>
                            <input type="text" value={att.name} onChange={(e) => { const atts = [...currentLesson.attachments]; atts[attIdx].name = e.target.value; setCurrentLesson({ ...currentLesson, attachments: atts }); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold text-sm outline-none focus:border-indigo-600" placeholder="مثال: كتاب الفيزياء الأساسي" />
                          </div>
                          <div className="flex gap-3">
                            <div className="w-32 space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">النوع</label>
                              <select value={att.type} onChange={(e) => { const atts = [...currentLesson.attachments]; atts[attIdx].type = e.target.value; setCurrentLesson({ ...currentLesson, attachments: atts }); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold text-xs outline-none focus:border-indigo-600"><option value="PDF">PDF</option><option value="PPT">PPT</option><option value="IMAGE">IMAGE</option></select>
                            </div>
                            <div className="flex-1 space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1 text-left" dir="ltr">URL</label>
                              <input type="text" value={att.url} onChange={(e) => { const atts = [...currentLesson.attachments]; atts[attIdx].url = e.target.value; setCurrentLesson({ ...currentLesson, attachments: atts }); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-600 text-xs outline-none text-left font-mono focus:border-indigo-600" dir="ltr" placeholder="https://..." />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
                <button onClick={() => setIsLessonModalOpen(false)} className="px-10 py-4 rounded-2xl bg-white border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all">إلغاء</button>
                <button onClick={saveLesson} className="px-12 py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 flex items-center gap-3 transition-all">تحديث وحفظ الدرس <CheckCircle2 className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-6 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-6">
                <button onClick={() => router.back()} className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 border border-slate-100 hover:border-indigo-100 transition-all"><ArrowLeft className="w-7 h-7" /></button>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">تعديل الكورس</h1>
                  <p className="text-slate-400 text-lg mt-1 font-bold">تحديث محتوى وهيكل الكورس التعليمي</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleDeleteCourse} className="bg-red-50 text-red-600 px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-red-600 hover:text-white transition-all border border-red-100"><Trash2 size={20} /> حذف</button>
                <button onClick={handleSubmit} disabled={isSubmitting} className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 hover:scale-105 shadow-xl shadow-indigo-600/20 disabled:opacity-50 transition-all">{isSubmitting ? "جاري الحفظ..." : "حفظ التعديلات"}<Save className="w-6 h-6" /></button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-4 space-y-8">
                {/* Course Settings Panel — Collapsible */}
                <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
                    <span className="font-black text-slate-800 flex items-center gap-2 text-sm">
                      <Settings className="w-4 h-4 text-indigo-600" /> إعدادات الكورس
                    </span>
                    <button
                      onClick={() => setCourseSettingsCollapsed(prev => !prev)}
                      className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-1.5"
                    >
                      {courseSettingsCollapsed
                        ? <><Edit2 className="w-3 h-3" />تعديل</>
                        : <><CheckCircle2 className="w-3 h-3" />حفظ</>}
                    </button>
                  </div>

                  {courseSettingsCollapsed ? (
                    <div className="px-6 py-4 space-y-4">
                      {courseData.coverImage && (
                        <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-100 mb-2">
                           <img src={getFullImageUrl(courseData.coverImage) || ""} className="w-full h-full object-cover" alt="Cover" />
                        </div>
                      )}
                      <div className="flex flex-col gap-1.5">
                        <p className="font-black text-slate-800 text-sm truncate">{courseData.title || '—'}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-lg text-xs font-black">{courseData.grade}</span>
                          {courseData.subject && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black">{courseData.subject}</span>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 space-y-5">
                      {/* Cover Image Upload */}
                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">صورة الغلاف</label>
                        <div className="relative group cursor-pointer">
                          {courseData.coverImage ? (
                            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-slate-100 group-hover:border-indigo-400 transition-all">
                              <img src={getFullImageUrl(courseData.coverImage) || ""} className="w-full h-full object-cover" alt="Cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                                 <button onClick={() => setCourseData({...courseData, coverImage: ""})} className="p-2 bg-red-500 text-white rounded-xl hover:scale-110 transition-all"><Trash2 className="w-5 h-5" /></button>
                                 <label className="p-2 bg-indigo-600 text-white rounded-xl hover:scale-110 transition-all cursor-pointer">
                                    <Upload className="w-5 h-5" />
                                    <input type="file" className="hidden" accept="image/*" onChange={async (e: any) => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (re) => {
                                          const res = re.target?.result as string;
                                          if(confirm("تأكيد تحديث صورة الغلاف؟")) {
                                             setCourseData({...courseData, coverImage: res});
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
                              <span className="text-xs font-black text-slate-400 group-hover:text-indigo-600">اضغط لرفع غلاف الكورس</span>
                              <input type="file" className="hidden" accept="image/*" onChange={async (e: any) => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (re) => {
                                          const res = re.target?.result as string;
                                          if(confirm("تأكيد اعتماد هذه الصورة كغلاف؟")) {
                                             setCourseData({...courseData, coverImage: res});
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
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">عنوان الكورس</label>
                        <input type="text" value={courseData.title} onChange={(e) => setCourseData({ ...courseData, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">وصف الكورس</label>
                        <textarea value={courseData.description} onChange={(e) => setCourseData({ ...courseData, description: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 min-h-[100px] resize-none transition-all text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">الدولة</label>
                        <select 
                          value={courseData.country}
                          onChange={(e) => setCourseData({...courseData, country: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all text-sm appearance-none"
                        >
                          <option value="مصر">مصر</option>
                          <option value="السعودية">السعودية</option>
                          <option value="الإمارات">الإمارات</option>
                          <option value="الكويت">الكويت</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">المراحل الدراسية</label>
                        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                           {GRADES.map(g => (
                             <button
                               key={g}
                               type="button"
                               onClick={() => {
                                  const cur = courseData.grades;
                                  setCourseData({...courseData, grades: cur.includes(g) ? cur.filter(x => x !== g) : [...cur, g]});
                               }}
                               className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${courseData.grades.includes(g) ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}
                             >
                               {g}
                             </button>
                           ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">المادة</label>
                        <input type="text" value={courseData.subject} onChange={(e) => setCourseData({ ...courseData, subject: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all text-sm" />
                      </div>
                      <button onClick={() => setCourseSettingsCollapsed(true)} className="w-full py-3 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> حفظ الإعدادات
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-8 space-y-8">
                {/* Content Navigation Tabs */}
                <div className="bg-white p-2 rounded-[30px] border border-slate-100 shadow-sm flex gap-2">
                   {[
                     { id: 'lessons', label: 'الدروس والمحاضرات', icon: Layers, color: 'indigo' },
                     { id: 'quizzes', label: 'الاختبارات القصيرة', icon: HelpCircle, color: 'orange' },
                     { id: 'assignments', label: 'التكليفات والمهام', icon: FileText, color: 'emerald' },
                   ].map(tab => (
                     <button
                       key={tab.id}
                       onClick={() => setActiveContentTab(tab.id as any)}
                       className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black transition-all ${
                         activeContentTab === tab.id 
                         ? `bg-${tab.color}-600 text-white shadow-lg shadow-${tab.color}-600/20` 
                         : 'text-slate-400 hover:bg-slate-50'
                       }`}
                     >
                       <tab.icon className="w-5 h-5" />
                       {tab.label}
                     </button>
                   ))}
                </div>

                <div className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
                    {activeContentTab === 'lessons' && <><Layers className="w-8 h-8 text-indigo-600" /> الدروس والمحاضرات</>}
                    {activeContentTab === 'quizzes' && <><HelpCircle className="w-8 h-8 text-orange-500" /> الاختبارات والتقييمات</>}
                    {activeContentTab === 'assignments' && <><FileText className="w-8 h-8 text-emerald-500" /> التكليفات الدراسية</>}
                  </h3>
                  <button 
                    onClick={() => {
                      if (activeContentTab === 'lessons') openAddLessonModal();
                      else showToast("سيتم تفعيل إنشاء الاختبارات/التكليفات قريباً", "info");
                    }} 
                    className={`px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl text-white ${
                      activeContentTab === 'lessons' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' :
                      activeContentTab === 'quizzes' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20' :
                      'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                    }`}
                  >
                    <Plus size={24} /> 
                    إضافة {activeContentTab === 'lessons' ? 'درس' : activeContentTab === 'quizzes' ? 'اختبار' : 'تكليف'}
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {activeContentTab === 'lessons' ? (
                    lessons.length === 0 ? (
                      <div className="bg-white border-2 border-dashed border-slate-200 rounded-[40px] p-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                            <BookOpen className="w-10 h-10" />
                        </div>
                        <p className="font-black text-xl">لا يوجد دروس في هذا الكورس بعد</p>
                        <button onClick={openAddLessonModal} className="text-indigo-600 font-bold hover:underline">أضف درسك الأول الآن</button>
                      </div>
                    ) : (
                      lessons.map((lesson, index) => (
                        <div key={index} className="bg-white border border-slate-100 rounded-[30px] p-5 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-indigo-200 transition-all group relative overflow-hidden shadow-sm hover:shadow-xl">
                          <div className="absolute top-0 right-0 w-1.5 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-all"></div>
                          
                          <div className="flex items-center gap-6 flex-1 w-full md:w-auto">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-2xl border border-indigo-100 shadow-inner group-hover:scale-105 transition-all shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <h3 className="font-black text-slate-900 text-xl truncate group-hover:text-indigo-600 transition-colors">
                                {lesson.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 mt-2">
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${lesson.isVisible ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                    {lesson.isVisible ? <Eye className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                    {lesson.isVisible ? 'مرئي للطلاب' : 'مخفي عن الطلاب'}
                                </div>
                                {lesson.publishDate && (
                                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase">
                                      <Clock className="w-3 h-3" />
                                      مجدول: {new Date(lesson.publishDate).toLocaleDateString('ar-EG')}
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-400 text-[10px] font-black uppercase">
                                    <Monitor className="w-3 h-3" />
                                    {lesson.slides?.length || 0} شرائح
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                            <div className="h-8 w-[1px] bg-slate-100 mx-2 hidden md:block"></div>
                            <button 
                              onClick={() => openEditLessonModal(index)} 
                              className="flex items-center gap-2 bg-blue-50 text-blue-600 px-5 py-3 rounded-2xl font-black text-sm hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                            >
                              <Edit2 size={18} />
                              تعديل الدرس
                            </button>
                            <button 
                              onClick={() => handleRemoveLesson(index)} 
                              className="p-3 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all border border-red-50"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      ))
                    )
                  ) : (
                    <div className="bg-white border border-slate-100 rounded-[40px] p-12 flex flex-col items-center justify-center text-center gap-6">
                       <div className={`w-24 h-24 rounded-[35px] flex items-center justify-center ${activeContentTab === 'quizzes' ? 'bg-orange-50 text-orange-500' : 'bg-emerald-50 text-emerald-500'}`}>
                          {activeContentTab === 'quizzes' ? <HelpCircle className="w-12 h-12" /> : <FileText className="w-12 h-12" />}
                       </div>
                       <div>
                         <h4 className="text-2xl font-black text-slate-900 mb-2">
                           {activeContentTab === 'quizzes' ? 'إدارة الاختبارات' : 'إدارة التكليفات'}
                         </h4>
                         <p className="text-slate-400 font-bold max-w-md">
                           يمكنك ربط هذا الكورس بأسئلة من بنك الأسئلة المركزي وتعيينها كـ {activeContentTab === 'quizzes' ? 'اختبارات' : 'تكليفات'} للطلاب.
                         </p>
                       </div>
                       
                       <div className="w-full max-w-2xl space-y-3">
                          {exams.filter(e => activeContentTab === 'quizzes' ? e.type !== 'ASSIGNMENT' : e.type === 'ASSIGNMENT').length === 0 ? (
                            <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl text-slate-400 font-bold">
                               لا يوجد {activeContentTab === 'quizzes' ? 'اختبارات' : 'تكليفات'} مرتبطة بهذا الكورس حالياً.
                            </div>
                          ) : (
                            exams.filter(e => activeContentTab === 'quizzes' ? e.type !== 'ASSIGNMENT' : e.type === 'ASSIGNMENT').map((exam, idx) => (
                              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-900 font-black border border-slate-100">
                                       {idx + 1}
                                    </div>
                                    <div className="text-right">
                                       <div className="font-black text-slate-900">{exam.title}</div>
                                       <div className="text-[10px] text-slate-400 font-bold flex gap-2">
                                          <span>{exam._count?.questions || 0} سؤال</span>
                                          <span>•</span>
                                          <span>{exam.duration} دقيقة</span>
                                       </div>
                                    </div>
                                 </div>
                                 <button className="p-2 text-slate-400 hover:text-indigo-600 transition-all"><Edit2 size={16} /></button>
                              </div>
                            ))
                          )}
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
