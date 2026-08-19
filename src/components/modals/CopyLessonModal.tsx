"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { X, Copy, Search, BookOpen, AlertCircle } from "lucide-react";

interface CopyLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  lessonTitle: string;
  onSuccess: () => void;
}

export default function CopyLessonModal({ isOpen, onClose, lessonId, lessonTitle, onSuccess }: CopyLessonModalProps) {
  const { language } = useLanguage();
  const { showToast } = useNotification();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCourses();
      setSearch("");
      setSelectedCourseId("");
    }
  }, [isOpen]);

  const fetchCourses = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!selectedCourseId) return;
    setCopying(true);
    try {
      const token = localStorage.getItem("super_admin_token") || localStorage.getItem("school_admin_token");
      const res = await fetch(`${API_URL}/lessons/${lessonId}/copy-to-course`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ targetCourseId: selectedCourseId })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(language === "ar" ? "تم نسخ الدرس بنجاح" : "Lesson copied successfully", "success");
        onSuccess();
        onClose();
      } else {
        showToast(data.error || (language === "ar" ? "فشل النسخ" : "Copy failed"), "error");
      }
    } catch (err: any) {
      showToast(err.message || "An error occurred", "error");
    } finally {
      setCopying(false);
    }
  };

  if (!isOpen) return null;

  const filteredCourses = courses.filter((c) => 
    (c.title || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Copy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {language === "ar" ? "نسخ الدرس" : "Copy Lesson"}
              </h2>
              <p className="text-sm font-bold text-slate-500 mt-1 line-clamp-1 max-w-[200px]" title={lessonTitle}>
                {lessonTitle}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto">
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-4">
              <AlertCircle className="w-6 h-6 text-blue-600 shrink-0" />
              <p className="text-sm font-bold text-blue-800 leading-relaxed">
                {language === "ar" 
                  ? "سيتم نسخ الدرس بالكامل (بما في ذلك الشرائح، الأسئلة، والمرفقات) إلى الكورس الوجهة المختار." 
                  : "The entire lesson (including slides, questions, and attachments) will be copied to the selected destination course."}
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-black text-slate-700">
                {language === "ar" ? "الكورس الوجهة" : "Destination Course"}
              </label>
              
              <div className="relative">
                <Search className={`absolute ${language === "ar" ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400`} />
                <input
                  type="text"
                  placeholder={language === "ar" ? "ابحث عن كورس..." : "Search course..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 ${language === "ar" ? "pr-12 pl-4" : "pl-12 pr-4"} font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all`}
                />
              </div>

              <div className="mt-4 border-2 border-slate-100 rounded-2xl bg-slate-50 max-h-60 overflow-y-auto flex flex-col divide-y divide-slate-100">
                {loading ? (
                  <div className="p-6 text-center text-slate-400 font-bold flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    {language === "ar" ? "جاري التحميل..." : "Loading..."}
                  </div>
                ) : filteredCourses.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 font-bold flex flex-col items-center gap-2">
                    <BookOpen className="w-8 h-8 opacity-50" />
                    {language === "ar" ? "لا توجد كورسات" : "No courses found"}
                  </div>
                ) : (
                  filteredCourses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => setSelectedCourseId(course.id)}
                      className={`w-full text-start p-4 flex items-center gap-3 transition-colors ${selectedCourseId === course.id ? "bg-indigo-50" : "hover:bg-white"}`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedCourseId === course.id ? "border-indigo-600" : "border-slate-300"}`}>
                        {selectedCourseId === course.id && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                      </div>
                      <span className={`font-bold line-clamp-2 text-sm ${selectedCourseId === course.id ? "text-indigo-700" : "text-slate-700"}`}>
                        {course.title}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            {language === "ar" ? "إلغاء" : "Cancel"}
          </button>
          <button
            onClick={handleCopy}
            disabled={!selectedCourseId || copying}
            className="px-8 py-3 rounded-xl font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            {copying ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : <Copy className="w-5 h-5" />}
            {language === "ar" ? "نسخ الآن" : "Copy Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
