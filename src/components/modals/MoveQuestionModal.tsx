"use client";

import React, { useState, useEffect } from "react";
import { API_URL } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { X, ArrowRightLeft, Search, BookOpen, CheckCircle2, Loader2 } from "lucide-react";

interface MoveQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: string;
  questionText: string;
  currentExamId: string;
  onSuccess: (movedQuestionId: string) => void;
}

export default function MoveQuestionModal({
  isOpen,
  onClose,
  questionId,
  questionText,
  currentExamId,
  onSuccess
}: MoveQuestionModalProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { showToast } = useNotification();

  const [exams, setExams] = useState<any[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");

  const [modules, setModules] = useState<any[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedSubExamId, setSelectedSubExamId] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchExams();
      setSearch("");
      setSelectedExamId("");
      setModules([]);
      setSelectedModuleId("");
      setSelectedSubExamId("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedExamId) {
      fetchExamModules(selectedExamId);
      setSelectedModuleId("");
      setSelectedSubExamId("");
    } else {
      setModules([]);
      setSelectedModuleId("");
      setSelectedSubExamId("");
    }
  }, [selectedExamId]);

  const getAuthToken = () => {
    if (typeof window === "undefined") return "";
    return (
      localStorage.getItem("super_admin_token") ||
      localStorage.getItem("school_admin_token") ||
      localStorage.getItem("teacher_token") ||
      localStorage.getItem("token") ||
      ""
    );
  };

  const fetchExams = async () => {
    setLoadingExams(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/exams?limit=200`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        const rawList = Array.isArray(data) ? data : (data.exams || []);
        setExams(rawList);
      } else {
        showToast(data.error || (isAr ? "فشل جلب الاختبارات" : "Failed to fetch exams"), "error");
      }
    } catch (err) {
      console.error(err);
      showToast(isAr ? "خطأ في الاتصال بالخادم" : "Connection error", "error");
    } finally {
      setLoadingExams(false);
    }
  };

  const fetchExamModules = async (examId: string) => {
    setLoadingModules(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/exams/${examId}?includeQuestions=false`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.modules) {
        setModules(Array.isArray(data.modules) ? data.modules : []);
      } else {
        setModules([]);
      }
    } catch (err) {
      console.error(err);
      setModules([]);
    } finally {
      setLoadingModules(false);
    }
  };

  const handleMove = async () => {
    if (!selectedExamId) {
      showToast(isAr ? "يرجى تحديد الاختبار المستهدف أولاً" : "Please select a target exam first", "error");
      return;
    }

    setSubmitting(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/exams/${currentExamId}/questions/${questionId}/move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetExamId: selectedExamId,
          targetModuleId: selectedModuleId || null,
          targetSubExamId: selectedSubExamId || null
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(isAr ? "تم نقل السؤال بنجاح" : "Question moved successfully", "success");
        onSuccess(questionId);
        onClose();
      } else {
        showToast(data.error || (isAr ? "فشل نقل السؤال" : "Failed to move question"), "error");
      }
    } catch (err) {
      console.error(err);
      showToast(isAr ? "حدث خطأ أثناء نقل السؤال" : "An error occurred while moving the question", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredExams = exams.filter(e =>
    (e.title || "").toLowerCase().includes(search.toLowerCase())
  );

  const activeModule = modules.find(m => m.id === selectedModuleId);
  const availableSubExams = activeModule ? (activeModule.subExams || []) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">
                {isAr ? "نقل السؤال إلى اختبار آخر" : "Move Question to Another Exam"}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                {questionText?.replace(/<[^>]*>/g, '') || (isAr ? "السؤال المحدد" : "Selected question")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Step 1: Select Target Exam */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600">
              {isAr ? "1. اختر الاختبار المستهدف:" : "1. Select Target Exam:"}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? "ابحث عن اختبار..." : "Search for an exam..."}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-9 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="border border-slate-100 rounded-2xl max-h-48 overflow-y-auto divide-y divide-slate-50 bg-white">
              {loadingExams ? (
                <div className="p-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>{isAr ? "جاري تحميل الاختبارات..." : "Loading exams..."}</span>
                </div>
              ) : filteredExams.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  {isAr ? "لا توجد اختبارات متاحة" : "No exams found"}
                </div>
              ) : (
                filteredExams.map((e) => {
                  const isSelected = selectedExamId === e.id;
                  const isCurrent = currentExamId === e.id;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setSelectedExamId(e.id)}
                      className={`w-full text-start px-4 py-3 text-xs transition-colors flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-indigo-50/70 text-indigo-700 font-bold"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <BookOpen className={`w-4 h-4 shrink-0 ${isSelected ? "text-indigo-600" : "text-slate-400"}`} />
                        <span className="truncate">{e.title}</span>
                        {isCurrent && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full shrink-0 font-normal">
                            {isAr ? "الاختبار الحالي" : "Current Exam"}
                          </span>
                        )}
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Step 2: Target Module (Optional) */}
          {selectedExamId && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <label className="text-xs font-bold text-slate-600 flex items-center justify-between">
                <span>{isAr ? "2. اختر الموديول (اختياري):" : "2. Select Module (Optional):"}</span>
                {loadingModules && <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />}
              </label>
              <select
                value={selectedModuleId}
                onChange={(e) => {
                  setSelectedModuleId(e.target.value);
                  setSelectedSubExamId("");
                }}
                disabled={loadingModules}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-60"
              >
                <option value="">{isAr ? "-- بدون موديول (سؤال مستقل) --" : "-- No Module (Standalone Question) --"}</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Step 3: Target Sub-Exam (Optional) */}
          {selectedModuleId && availableSubExams.length > 0 && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <label className="text-xs font-bold text-slate-600">
                {isAr ? "3. اختر القسم / الاختبار الفرعي (اختياري):" : "3. Select Sub-Exam (Optional):"}
              </label>
              <select
                value={selectedSubExamId}
                onChange={(e) => setSelectedSubExamId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="">{isAr ? "-- داخل الموديول مباشرة --" : "-- Direct in Module --"}</option>
                {availableSubExams.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-60"
          >
            {isAr ? "إلغاء" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleMove}
            disabled={!selectedExamId || submitting}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isAr ? "جاري النقل..." : "Moving..."}</span>
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4" />
                <span>{isAr ? "تأكيد نقل السؤال" : "Confirm Move"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
