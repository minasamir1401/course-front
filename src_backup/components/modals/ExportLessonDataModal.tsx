"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { X, Copy, Search, BookOpen, CheckSquare, Target, Clock, Layout, FileText, HelpCircle } from "lucide-react";

interface ExportLessonDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceLesson: any;
  onSuccess: () => void;
}

export default function ExportLessonDataModal({ isOpen, onClose, sourceLesson, onSuccess }: ExportLessonDataModalProps) {
  const { language } = useLanguage();
  const { showToast } = useNotification();
  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [copying, setCopying] = useState(false);

  const [selectedSlideIndices, setSelectedSlideIndices] = useState<number[]>([]);
  const [selectedAssignmentIndices, setSelectedAssignmentIndices] = useState<number[]>([]);
  const [selectedQuestionIndices, setSelectedQuestionIndices] = useState<number[]>([]);
  const [copyMetadata, setCopyMetadata] = useState(true);
  const [copyScheduling, setCopyScheduling] = useState(true);

  const [activeTab, setActiveTab] = useState<'METADATA' | 'SLIDES' | 'ASSIGNMENTS' | 'QUESTIONS'>('METADATA');

  useEffect(() => {
    if (isOpen) {
      fetchCourses();
      setCourseSearch("");
      setSelectedCourseId("");
      setSelectedLessonId("");
      // Select all by default
      setSelectedSlideIndices((sourceLesson.slides || []).map((_: any, i: number) => i));
      setSelectedAssignmentIndices((sourceLesson.assignments || []).map((_: any, i: number) => i));
      setSelectedQuestionIndices((sourceLesson.questions || []).map((_: any, i: number) => i));
      setCopyMetadata(true);
      setCopyScheduling(true);
      setActiveTab('METADATA');
    }
  }, [isOpen, sourceLesson]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchLessons(selectedCourseId);
    } else {
      setLessons([]);
      setSelectedLessonId("");
    }
  }, [selectedCourseId]);

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const token = localStorage.getItem("super_admin_token") || localStorage.getItem("school_admin_token");
      const res = await fetch(`${API_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCourses(Array.isArray(data) ? data : data.courses || []);
      } else {
        showToast(data.error || "Failed to fetch courses", "error");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchLessons = async (courseId: string) => {
    setLoadingLessons(true);
    try {
      const token = localStorage.getItem("super_admin_token") || localStorage.getItem("school_admin_token");
      const res = await fetch(`${API_URL}/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.lessons) {
        setLessons(data.lessons.filter((l: any) => l.id !== sourceLesson.id));
      } else {
        setLessons([]);
      }
    } catch (err) {
      console.error(err);
      setLessons([]);
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleCopy = async () => {
    if (!selectedLessonId) return;
    
    const hasSelections = copyMetadata || copyScheduling || 
      selectedSlideIndices.length > 0 || 
      selectedAssignmentIndices.length > 0 || 
      selectedQuestionIndices.length > 0;

    if (!hasSelections) {
      showToast(language === "ar" ? "الرجاء تحديد شيء واحد على الأقل للنسخ" : "Please select at least one item to copy", "error");
      return;
    }

    setCopying(true);
    try {
      const token = localStorage.getItem("super_admin_token") || localStorage.getItem("school_admin_token");
      const res = await fetch(`${API_URL}/lessons/${sourceLesson.id}/export-sections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          targetLessonId: selectedLessonId,
          sections: {
            metadata: copyMetadata,
            scheduling: copyScheduling,
            slideIndices: selectedSlideIndices,
            assignmentIndices: selectedAssignmentIndices,
            questionIndices: selectedQuestionIndices
          }
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(language === "ar" ? "تم التصدير بنجاح" : "Exported successfully", "success");
        onSuccess();
        onClose();
      } else {
        showToast(data.error || (language === "ar" ? "فشل التصدير" : "Export failed"), "error");
      }
    } catch (err: any) {
      showToast(err.message || "An error occurred", "error");
    } finally {
      setCopying(false);
    }
  };

  const toggleSelection = (index: number, type: 'slides' | 'assignments' | 'questions') => {
    if (type === 'slides') {
      setSelectedSlideIndices(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
    } else if (type === 'assignments') {
      setSelectedAssignmentIndices(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
    } else if (type === 'questions') {
      setSelectedQuestionIndices(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
    }
  };

  const toggleAll = (type: 'slides' | 'assignments' | 'questions') => {
    if (type === 'slides') {
      if (selectedSlideIndices.length === (sourceLesson.slides || []).length) {
        setSelectedSlideIndices([]);
      } else {
        setSelectedSlideIndices((sourceLesson.slides || []).map((_: any, i: number) => i));
      }
    } else if (type === 'assignments') {
      if (selectedAssignmentIndices.length === (sourceLesson.assignments || []).length) {
        setSelectedAssignmentIndices([]);
      } else {
        setSelectedAssignmentIndices((sourceLesson.assignments || []).map((_: any, i: number) => i));
      }
    } else if (type === 'questions') {
      if (selectedQuestionIndices.length === (sourceLesson.questions || []).length) {
        setSelectedQuestionIndices([]);
      } else {
        setSelectedQuestionIndices((sourceLesson.questions || []).map((_: any, i: number) => i));
      }
    }
  };

  if (!isOpen) return null;

  const filteredCourses = courses.filter((c) => 
    (c.title || "").toLowerCase().includes(courseSearch.toLowerCase())
  );

  const renderItemList = (type: 'slides' | 'assignments' | 'questions', items: any[], selectedIndices: number[]) => {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h3 className="font-black text-slate-700">
            {type === 'slides' ? (language === "ar" ? "تحديد شرائح الشرح" : "Select Slides") :
             type === 'assignments' ? (language === "ar" ? "تحديد الواجبات" : "Select Assignments") :
             (language === "ar" ? "تحديد الأسئلة" : "Select Questions")}
          </h3>
          <button onClick={() => toggleAll(type)} className="text-indigo-600 text-sm font-bold hover:underline">
            {selectedIndices.length === items.length 
              ? (language === "ar" ? "إلغاء تحديد الكل" : "Deselect All") 
              : (language === "ar" ? "تحديد الكل" : "Select All")}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-2 pb-10">
          {items.length === 0 ? (
            <div className="p-4 text-center text-slate-400 font-bold">{language === "ar" ? "لا توجد عناصر" : "No items available"}</div>
          ) : (
            items.map((item, index) => {
              const isSelected = selectedIndices.includes(index);
              const rawTitle = item.title || item.text || (item.type === 'TEXT' ? (language === 'ar' ? 'محتوى نصي' : 'Text Content') : (language === 'ar' ? 'سؤال مدمج' : 'Embedded Question'));
              const title = typeof rawTitle === 'string' ? rawTitle.replace(/<[^>]*>?/gm, '').trim() : rawTitle;
              const preview = item.content || item.text || "";
              
              return (
                <div 
                  key={index} 
                  onClick={() => toggleSelection(index, type)}
                  className={`p-3 border-2 rounded-xl flex items-center gap-3 cursor-pointer transition-colors ${isSelected ? "border-indigo-600 bg-indigo-50" : "border-slate-100 hover:border-slate-300"}`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${isSelected ? "bg-indigo-600" : "border-2 border-slate-300"}`}>
                    {isSelected && <CheckSquare className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-800 truncate">{index + 1}. {title || (language === 'ar' ? 'بدون عنوان' : 'Untitled')}</div>
                    <div className="text-xs text-slate-500 truncate mt-1">{preview.replace(/<[^>]*>?/gm, '').trim()}</div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Copy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {language === "ar" ? "تصدير المحتوى لدرس آخر (متقدم)" : "Export Content to another Lesson (Advanced)"}
              </h2>
              <p className="text-sm font-bold text-slate-500 mt-1">
                {language === "ar" ? "حدد الأقسام التي تريد نقلها والعناصر المطلوبة" : "Select sections and items to transfer"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col md:flex-row">
          {/* Left Side: Select Content */}
          <div className="w-full md:w-3/5 p-4 md:p-6 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col flex-1 min-h-0 overflow-hidden">
            
            {/* Tabs for different sections */}
            <div className="flex flex-wrap gap-2 mb-4 md:mb-6 border-b border-slate-100 pb-4 shrink-0">
              <button 
                onClick={() => setActiveTab('METADATA')}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'METADATA' ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
              >
                <Target className="w-4 h-4" /> {language === 'ar' ? 'الإعدادات والجدولة' : 'Settings & Schedule'}
              </button>
              <button 
                onClick={() => setActiveTab('SLIDES')}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'SLIDES' ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
              >
                <Layout className="w-4 h-4" /> {language === 'ar' ? 'محتوى الشرح' : 'Slides'}
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{(sourceLesson.slides || []).length}</span>
              </button>
              <button 
                onClick={() => setActiveTab('ASSIGNMENTS')}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'ASSIGNMENTS' ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
              >
                <FileText className="w-4 h-4" /> {language === 'ar' ? 'الواجبات' : 'Assignments'}
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{(sourceLesson.assignments || []).length}</span>
              </button>
              <button 
                onClick={() => setActiveTab('QUESTIONS')}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'QUESTIONS' ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
              >
                <HelpCircle className="w-4 h-4" /> {language === 'ar' ? 'التدريبات' : 'Quizzes'}
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{(sourceLesson.questions || []).length}</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'METADATA' && (
                <div className="space-y-4">
                  <div 
                    onClick={() => setCopyMetadata(!copyMetadata)}
                    className={`p-4 border-2 rounded-xl flex items-center gap-4 cursor-pointer transition-colors ${copyMetadata ? "border-indigo-600 bg-indigo-50" : "border-slate-100 hover:border-slate-300"}`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${copyMetadata ? "bg-indigo-600" : "border-2 border-slate-300"}`}>
                      {copyMetadata && <CheckSquare className="w-4 h-4 text-white" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{language === 'ar' ? 'نسخ الأهداف والبيانات (Metadata)' : 'Copy Goals & Data'}</h4>
                      <p className="text-xs text-slate-500 mt-1">{language === 'ar' ? 'يشمل نواتج التعلم، المعايير، المؤشرات، والملخص' : 'Includes learning outcomes, standards, indicators, and summary'}</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => setCopyScheduling(!copyScheduling)}
                    className={`p-4 border-2 rounded-xl flex items-center gap-4 cursor-pointer transition-colors ${copyScheduling ? "border-indigo-600 bg-indigo-50" : "border-slate-100 hover:border-slate-300"}`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${copyScheduling ? "bg-indigo-600" : "border-2 border-slate-300"}`}>
                      {copyScheduling && <CheckSquare className="w-4 h-4 text-white" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{language === 'ar' ? 'نسخ إعدادات الجدولة والظهور' : 'Copy Scheduling & Visibility'}</h4>
                      <p className="text-xs text-slate-500 mt-1">{language === 'ar' ? 'يشمل حالة النشر وإعدادات التقطير (Drip)' : 'Includes visibility status and drip settings'}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'SLIDES' && renderItemList('slides', sourceLesson.slides || [], selectedSlideIndices)}
              {activeTab === 'ASSIGNMENTS' && renderItemList('assignments', sourceLesson.assignments || [], selectedAssignmentIndices)}
              {activeTab === 'QUESTIONS' && renderItemList('questions', sourceLesson.questions || [], selectedQuestionIndices)}
            </div>

          </div>

          {/* Right Side: Select Destination */}
          <div className="w-full md:w-2/5 p-4 md:p-6 flex flex-col flex-1 min-h-0 bg-slate-50/50">
            <h3 className="font-black text-slate-700 mb-4 shrink-0 flex items-center gap-2">{language === "ar" ? "الوجهة" : "Destination"}</h3>
            
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 pb-10">
              {/* Course Selection */}
              <div>
                <label className="text-xs font-black text-slate-500 uppercase">{language === "ar" ? "1. اختر الكورس" : "1. Select Course"}</label>
                <div className="mt-2 relative">
                  <Search className={`absolute ${language === "ar" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                  <input
                    type="text"
                    placeholder={language === "ar" ? "ابحث عن كورس..." : "Search course..."}
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className={`w-full bg-white border border-slate-200 rounded-xl py-2 ${language === "ar" ? "pr-10 pl-3" : "pl-10 pr-3"} font-bold text-slate-700 focus:outline-none focus:border-indigo-600 transition-all text-sm`}
                  />
                </div>
                <div className="mt-2 bg-white border border-slate-200 rounded-xl max-h-40 overflow-y-auto divide-y divide-slate-100">
                  {loadingCourses ? (
                    <div className="p-4 text-center text-slate-400 text-sm font-bold">{language === "ar" ? "جاري التحميل..." : "Loading..."}</div>
                  ) : filteredCourses.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-sm font-bold">{language === "ar" ? "لا توجد كورسات" : "No courses found"}</div>
                  ) : (
                    filteredCourses.map((course) => (
                      <button
                        key={course.id}
                        onClick={() => setSelectedCourseId(course.id)}
                        className={`w-full text-start px-4 py-2 flex items-center gap-2 transition-colors ${selectedCourseId === course.id ? "bg-indigo-50" : "hover:bg-slate-50"}`}
                      >
                        <BookOpen className={`w-4 h-4 ${selectedCourseId === course.id ? "text-indigo-600" : "text-slate-400"}`} />
                        <span className={`font-bold line-clamp-1 text-sm ${selectedCourseId === course.id ? "text-indigo-700" : "text-slate-600"}`}>{course.title}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Lesson Selection */}
              <div className={!selectedCourseId ? "opacity-50 pointer-events-none" : ""}>
                <label className="text-xs font-black text-slate-500 uppercase">{language === "ar" ? "2. اختر الدرس الوجهة" : "2. Select Destination Lesson"}</label>
                <div className="mt-2 bg-white border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {!selectedCourseId ? (
                    <div className="p-4 text-center text-slate-400 text-sm font-bold">{language === "ar" ? "اختر كورس أولاً" : "Select a course first"}</div>
                  ) : loadingLessons ? (
                    <div className="p-4 text-center text-slate-400 text-sm font-bold">{language === "ar" ? "جاري التحميل..." : "Loading..."}</div>
                  ) : lessons.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-sm font-bold">{language === "ar" ? "لا توجد دروس أخرى في هذا الكورس" : "No other lessons in this course"}</div>
                  ) : (
                    lessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => setSelectedLessonId(lesson.id)}
                        className={`w-full text-start px-4 py-3 flex items-center gap-3 transition-colors ${selectedLessonId === lesson.id ? "bg-indigo-50" : "hover:bg-slate-50"}`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedLessonId === lesson.id ? "border-indigo-600" : "border-slate-300"}`}>
                          {selectedLessonId === lesson.id && <div className="w-2 h-2 bg-indigo-600 rounded-full" />}
                        </div>
                        <span className={`font-bold line-clamp-2 text-sm ${selectedLessonId === lesson.id ? "text-indigo-700" : "text-slate-700"}`}>{lesson.title}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {language === "ar" ? "إلغاء" : "Cancel"}
          </button>
          <button
            onClick={handleCopy}
            disabled={!selectedLessonId || copying || (!copyMetadata && !copyScheduling && selectedSlideIndices.length === 0 && selectedAssignmentIndices.length === 0 && selectedQuestionIndices.length === 0)}
            className="px-8 py-3 rounded-xl font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            {copying ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : <Copy className="w-5 h-5" />}
            {language === "ar" ? `تصدير البيانات المحددة` : `Export Selected Data`}
          </button>
        </div>
      </div>
    </div>
  );
}
