"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { X, Copy, Search, BookOpen, Layers, CheckSquare, Square } from "lucide-react";

interface CopySlidesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceLessonId: string;
  sourceSlides: any[];
  onSuccess: () => void;
  itemType?: 'slides' | 'questions' | 'assignments';
}

export default function CopySlidesModal({ isOpen, onClose, sourceLessonId, sourceSlides, onSuccess, itemType = 'slides' }: CopySlidesModalProps) {
  const { language } = useLanguage();
  const { showToast } = useNotification();
  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [selectedSlideIndices, setSelectedSlideIndices] = useState<number[]>([]);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCourses();
      setCourseSearch("");
      setSelectedCourseId("");
      setSelectedLessonId("");
      // Select all by default
      setSelectedSlideIndices(sourceSlides.map((_, i) => i));
    }
  }, [isOpen, sourceSlides]);

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
      const res = await fetch(`${API_URL}/school/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.lessons) {
        setLessons(data.lessons.filter((l: any) => l.id !== sourceLessonId));
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
    if (selectedSlideIndices.length === 0) {
      showToast(language === "ar" ? "الرجاء تحديد شريحة واحدة على الأقل" : "Please select at least one slide", "error");
      return;
    }
    setCopying(true);
    try {
      const token = localStorage.getItem("super_admin_token") || localStorage.getItem("school_admin_token");
      const res = await fetch(`${API_URL}/lessons/${sourceLessonId}/copy-slides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          targetLessonId: selectedLessonId,
          slideIndices: selectedSlideIndices,
          itemType
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

  const toggleSlideSelection = (index: number) => {
    setSelectedSlideIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const toggleAll = () => {
    if (selectedSlideIndices.length === sourceSlides.length) {
      setSelectedSlideIndices([]);
    } else {
      setSelectedSlideIndices(sourceSlides.map((_, i) => i));
    }
  };

  if (!isOpen) return null;

  const filteredCourses = courses.filter((c) => 
    (c.title || "").toLowerCase().includes(courseSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Copy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {language === "ar" ? "تصدير المحتوى لدرس آخر" : "Export Content to another Lesson"}
              </h2>
              <p className="text-sm font-bold text-slate-500 mt-1">
                {language === "ar" ? "اختر المحتوى والكورس والدرس الوجهة" : "Select items, course and target lesson"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Side: Select Slides */}
          <div className="w-full md:w-1/2 p-6 border-r border-slate-100 flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="font-black text-slate-700">{language === "ar" ? "تحديد العناصر" : "Select Items"}</h3>
              <button onClick={toggleAll} className="text-indigo-600 text-sm font-bold hover:underline">
                {selectedSlideIndices.length === sourceSlides.length 
                  ? (language === "ar" ? "إلغاء تحديد الكل" : "Deselect All") 
                  : (language === "ar" ? "تحديد الكل" : "Select All")}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {sourceSlides.length === 0 ? (
                <div className="p-4 text-center text-slate-400 font-bold">{language === "ar" ? "لا توجد عناصر" : "No items available"}</div>
              ) : (
                sourceSlides.map((slide, index) => {
                  const isSelected = selectedSlideIndices.includes(index);
                  const title = slide.title || slide.text || (slide.type === 'TEXT' ? (language === 'ar' ? 'محتوى نصي' : 'Text Content') : (language === 'ar' ? 'سؤال مدمج' : 'Embedded Question'));
                  return (
                    <div 
                      key={index} 
                      onClick={() => toggleSlideSelection(index)}
                      className={`p-3 border-2 rounded-xl flex items-center gap-3 cursor-pointer transition-colors ${isSelected ? "border-indigo-600 bg-indigo-50" : "border-slate-100 hover:border-slate-300"}`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${isSelected ? "bg-indigo-600" : "border-2 border-slate-300"}`}>
                        {isSelected && <CheckSquare className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="font-bold text-sm text-slate-800 line-clamp-1">{index + 1}. {title}</div>
                        <div className="text-xs text-slate-500 line-clamp-1">{slide.content ? slide.content.replace(/<[^>]*>?/gm, '') : ''}</div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Side: Select Course & Lesson */}
          <div className="w-full md:w-1/2 p-6 flex flex-col h-full overflow-hidden bg-slate-50">
            <h3 className="font-black text-slate-700 mb-4 shrink-0">{language === "ar" ? "الوجهة" : "Destination"}</h3>
            
            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
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
                <label className="text-xs font-black text-slate-500 uppercase">{language === "ar" ? "2. اختر الدرس" : "2. Select Lesson"}</label>
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
            disabled={!selectedLessonId || selectedSlideIndices.length === 0 || copying}
            className="px-8 py-3 rounded-xl font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            {copying ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : <Copy className="w-5 h-5" />}
            {language === "ar" ? `تصدير (${selectedSlideIndices.length}) عنصر` : `Export (${selectedSlideIndices.length}) Items`}
          </button>
        </div>
      </div>
    </div>
  );
}
