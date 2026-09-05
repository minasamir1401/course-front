"use client";

import React, { useState } from "react";
import { ArrowRightLeft, FolderInput, Plus, X, Layers, ArrowUpRight, FolderTree } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";

interface MoveModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
  moduleToMove: any;
  parentExam: any;
  allExams: any[];
  language: string;
  role: "SCHOOL_ADMIN" | "SUPER_ADMIN";
}

export default function MoveModuleModal({
  isOpen,
  onClose,
  onSuccess,
  moduleToMove,
  parentExam,
  allExams,
  language,
  role,
}: MoveModuleModalProps) {
  const { showToast } = useNotification();
  const isAr = language === "ar";
  const tokenKey = role === "SCHOOL_ADMIN" ? "school_admin_token" : "super_admin_token";

  // Operation type: "entire_module" (Move Module by name) | "sub_exams_only" (Move sub-exams)
  const [operationType, setOperationType] = useState<"entire_module" | "sub_exams_only">("entire_module");

  // For entire_module:
  // "as_sub_module" (Move into another module) | "to_exam_root" (Move to another exam) | "promote_root" (Promote to root)
  const isCurrentlySubModule = Boolean(moduleToMove?.parentModuleId);
  const [entireMoveDestination, setEntireMoveDestination] = useState<"as_sub_module" | "to_exam_root" | "promote_root">("as_sub_module");
  const [targetParentModuleId, setTargetParentModuleId] = useState("");
  const [targetExamIdForEntire, setTargetExamIdForEntire] = useState(parentExam?.id || "");

  // For sub_exams_only:
  const [subExamsMode, setSubExamsMode] = useState<"existing" | "new">("existing");
  const [targetSubExamsModuleId, setTargetSubExamsModuleId] = useState("");
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [targetExamIdForNew, setTargetExamIdForNew] = useState(parentExam?.id || "");

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !moduleToMove || !parentExam) return null;

  // Flatten available target modules across all exams (excluding current module and its sub-modules)
  const descendantIds = new Set<string>([String(moduleToMove.id)]);
  const addDescendants = (mod: any) => {
    if (Array.isArray(mod.subModules)) {
      for (const sm of mod.subModules) {
        descendantIds.add(String(sm.id));
        addDescendants(sm);
      }
    }
  };
  addDescendants(moduleToMove);

  const availableTargetModules: Array<{
    id: string;
    title: string;
    examId: string;
    examTitle: string;
    isCurrentExam: boolean;
  }> = [];

  for (const ex of allExams || []) {
    const isCur = String(ex.id) === String(parentExam.id);
    const exTitle = ex.title || (isAr ? "اختبار بدون عنوان" : "Untitled Exam");
    
    // Recursive collector for available modules
    const collectModules = (mods: any[]) => {
      for (const m of mods || []) {
        if (!descendantIds.has(String(m.id))) {
          availableTargetModules.push({
            id: String(m.id),
            title: m.title || (isAr ? "موديول بدون عنوان" : "Untitled Module"),
            examId: String(ex.id),
            examTitle: exTitle,
            isCurrentExam: isCur,
          });
          if (Array.isArray(m.subModules)) {
            collectModules(m.subModules);
          }
        }
      }
    };
    collectModules(ex.modules || []);
  }

  const handleConfirmMoveEntireModule = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem(tokenKey) || localStorage.getItem("token") || "";
      let payload: any = {};

      if (entireMoveDestination === "promote_root") {
        payload = { moveToRoot: true };
      } else if (entireMoveDestination === "as_sub_module") {
        if (!targetParentModuleId) {
          showToast(isAr ? "يرجى تحديد الموديول المستهدف" : "Please select the target module", "error");
          setIsSubmitting(false);
          return;
        }
        const targetMod = availableTargetModules.find((m) => m.id === targetParentModuleId);
        payload = {
          targetParentModuleId,
          targetExamId: targetMod?.examId || parentExam.id,
        };
      } else if (entireMoveDestination === "to_exam_root") {
        if (!targetExamIdForEntire) {
          showToast(isAr ? "يرجى تحديد الامتحان المستهدف" : "Please select the target exam", "error");
          setIsSubmitting(false);
          return;
        }
        payload = {
          targetExamId: targetExamIdForEntire,
          moveToRoot: true,
        };
      }

      const res = await fetch(
        `${API_URL}/exams/${parentExam.id}/modules/${moduleToMove.id}/move-module`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || (isAr ? "تعذر نقل الموديول" : "Failed to move module"));
      }

      showToast(
        data.message || (isAr ? "تم نقل الموديول بنجاح!" : "Module moved successfully!"),
        "success"
      );
      onClose();
      await onSuccess();
    } catch (error: any) {
      console.error("Error moving module:", error);
      showToast(error?.message || (isAr ? "حدث خطأ أثناء نقل الموديول" : "Error moving module"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmMoveSubExamsOnly = async () => {
    if (subExamsMode === "existing" && !targetSubExamsModuleId) {
      showToast(isAr ? "يرجى اختيار الموديول المستهدف" : "Please select the target module", "error");
      return;
    }
    if (subExamsMode === "new" && !newModuleTitle.trim()) {
      showToast(isAr ? "يرجى إدخال اسم الموديول الجديد" : "Please enter the new module name", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem(tokenKey) || localStorage.getItem("token") || "";
      const payload =
        subExamsMode === "new"
          ? {
              newModuleTitle: newModuleTitle.trim(),
              targetExamId: targetExamIdForNew || parentExam.id,
            }
          : {
              targetModuleId: targetSubExamsModuleId,
            };

      const res = await fetch(
        `${API_URL}/exams/${parentExam.id}/modules/${moduleToMove.id}/exams/move-all`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || (isAr ? "تعذر نقل الاختبارات الفرعية" : "Failed to move sub-exams"));
      }

      showToast(
        isAr
          ? `تم نقل الاختبارات الفرعية (${data.movedSubExamsCount ?? ""} اختبار) بنجاح!`
          : `Sub-exams moved successfully!`,
        "success"
      );
      onClose();
      await onSuccess();
    } catch (error: any) {
      console.error(error);
      showToast(error?.message || (isAr ? "تعذر نقل الاختبارات الفرعية" : "Failed to move sub-exams"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const subExamsCount = moduleToMove.examsCount || (moduleToMove.subExams || []).length || 0;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${isAr ? "lg:pr-72" : "lg:pl-72"}`}>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[36px] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200/60 p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {isAr ? "خيارات نقل الموديول" : "Module Move Options"}
              </h3>
              <p className="text-xs font-bold text-slate-400">
                {isAr ? "نقل الموديول بالكامل بكل ما فيه أو نقل الاختبارات الفرعية" : "Move the entire module or just transfer sub-exams"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-700 flex items-center justify-center border border-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Module Info Badge */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FolderTree className="w-5 h-5 text-indigo-600" />
            <div>
              <span className="text-[11px] font-bold text-indigo-700 block">
                {isAr ? "الموديول المحدد للنقل:" : "Selected Module to Move:"}
              </span>
              <span className="text-sm font-black text-indigo-950">{moduleToMove.title}</span>
            </div>
          </div>
          <span className="text-xs font-bold bg-white px-2.5 py-1 rounded-xl text-indigo-700 shadow-xs border border-indigo-100">
            {subExamsCount} {isAr ? "اختبار" : "exams"}
          </span>
        </div>

        {/* Top-Level Mode Selector: Entire Module vs Sub-Exams Only */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setOperationType("entire_module")}
            className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              operationType === "entire_module"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{isAr ? "نقل الموديول بالكامل" : "Move Entire Module"}</span>
          </button>
          <button
            type="button"
            onClick={() => setOperationType("sub_exams_only")}
            disabled={subExamsCount === 0}
            className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              operationType === "sub_exams_only"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
            }`}
            title={subExamsCount === 0 ? (isAr ? "لا توجد اختبارات فرعية لنقلها" : "No sub-exams to move") : undefined}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>{isAr ? "نقل الاختبارات الفرعية فقط" : "Move Sub-Exams Only"}</span>
          </button>
        </div>

        {/* Operation 1: Entire Module Options */}
        {operationType === "entire_module" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
              {isAr ? "وجهة نقل الموديول:" : "Target Destination:"}
            </label>

            <div className={`grid ${isCurrentlySubModule ? "grid-cols-3" : "grid-cols-2"} gap-2.5`}>
              <button
                type="button"
                onClick={() => setEntireMoveDestination("as_sub_module")}
                disabled={availableTargetModules.length === 0}
                className={`p-3 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1.5 text-center ${
                  entireMoveDestination === "as_sub_module"
                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                <FolderInput className="w-5 h-5" />
                <span>{isAr ? "داخل موديول آخر (فرعي)" : "Inside Module (Sub-Module)"}</span>
              </button>

              <button
                type="button"
                onClick={() => setEntireMoveDestination("to_exam_root")}
                disabled={allExams.filter((e) => String(e.id) !== String(parentExam.id)).length === 0}
                className={`p-3 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1.5 text-center ${
                  entireMoveDestination === "to_exam_root"
                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                <ArrowUpRight className="w-5 h-5" />
                <span>{isAr ? "إلى امتحان آخر (رئيسي)" : "To Another Exam (Root)"}</span>
              </button>

              {isCurrentlySubModule && (
                <button
                  type="button"
                  onClick={() => setEntireMoveDestination("promote_root")}
                  className={`p-3 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1.5 text-center ${
                    entireMoveDestination === "promote_root"
                      ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Layers className="w-5 h-5" />
                  <span>{isAr ? "ترقية لموديول رئيسي" : "Promote to Main Module"}</span>
                </button>
              )}
            </div>

            {/* Destination Specific Dropdowns */}
            {entireMoveDestination === "as_sub_module" && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700 block">
                  {isAr ? "حدد الموديول الأب الذي سيحتوي هذا الموديول:" : "Select Parent Module:"}
                </label>
                <select
                  value={targetParentModuleId}
                  onChange={(e) => setTargetParentModuleId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-indigo-600 transition-all"
                >
                  <option value="">
                    {isAr ? "-- اختر الموديول الأب --" : "-- Select Parent Module --"}
                  </option>
                  {availableTargetModules.filter((m) => m.isCurrentExam).length > 0 && (
                    <optgroup
                      label={
                        isAr
                          ? `هذا الامتحان (${parentExam?.title || "الحالي"})`
                          : `Current Exam (${parentExam?.title || "Current"})`
                      }
                    >
                      {availableTargetModules
                        .filter((m) => m.isCurrentExam)
                        .map((mod) => (
                          <option key={mod.id} value={mod.id}>
                            {mod.title}
                          </option>
                        ))}
                    </optgroup>
                  )}
                  {Array.from(
                    new Set(availableTargetModules.filter((m) => !m.isCurrentExam).map((m) => m.examId))
                  ).map((examId) => {
                    const examItems = availableTargetModules.filter((m) => m.examId === examId);
                    const examTitle = examItems[0]?.examTitle || examId;
                    return (
                      <optgroup key={examId} label={examTitle}>
                        {examItems.map((mod) => (
                          <option key={mod.id} value={mod.id}>
                            {mod.title}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>
            )}

            {entireMoveDestination === "to_exam_root" && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700 block">
                  {isAr ? "حدد الامتحان الذي سينتقل إليه الموديول:" : "Select Target Exam:"}
                </label>
                <select
                  value={targetExamIdForEntire}
                  onChange={(e) => setTargetExamIdForEntire(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-indigo-600 transition-all"
                >
                  <option value="">
                    {isAr ? "-- اختر الامتحان المستهدف --" : "-- Select Target Exam --"}
                  </option>
                  {allExams
                    .filter((e) => String(e.id) !== String(parentExam.id))
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.title || (isAr ? "امتحان بدون عنوان" : "Untitled Exam")}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {entireMoveDestination === "promote_root" && (
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-800 font-bold leading-relaxed">
                {isAr
                  ? "سيتم إخراج هذا الموديول ليصبح موديولاً رئيسياً مستقلاً في نفس الامتحان، مع الاحتفاظ بجميع اختباراته وأسئلته."
                  : "This module will be elevated to become a main root module in the same exam, retaining all its exams and questions."}
              </div>
            )}
          </div>
        )}

        {/* Operation 2: Move Sub-Exams Only */}
        {operationType === "sub_exams_only" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
              {isAr ? "اختر وجهة نقل الاختبارات الفرعية:" : "Select Sub-Exams Destination:"}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSubExamsMode("existing")}
                disabled={availableTargetModules.length === 0}
                className={`p-3.5 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1.5 ${
                  subExamsMode === "existing"
                    ? "border-purple-600 bg-purple-50/50 text-purple-700 shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                <FolderInput className="w-5 h-5" />
                <span>{isAr ? "موديول موجود" : "Existing Module"}</span>
                <span className="text-[10px] text-purple-600 font-bold">
                  ({availableTargetModules.length} {isAr ? "متاح" : "available"})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSubExamsMode("new")}
                className={`p-3.5 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1.5 ${
                  subExamsMode === "new"
                    ? "border-purple-600 bg-purple-50/50 text-purple-700 shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Plus className="w-5 h-5" />
                <span>{isAr ? "إنشاء موديول جديد" : "Create New Module"}</span>
              </button>
            </div>

            {subExamsMode === "existing" ? (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700 block">
                  {isAr ? "حدد الموديول المستهدف لاستقبال الاختبارات:" : "Target Module for sub-exams:"}
                </label>
                <select
                  value={targetSubExamsModuleId}
                  onChange={(e) => setTargetSubExamsModuleId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-purple-600 transition-all"
                >
                  <option value="">
                    {isAr ? "-- اختر الموديول المستهدف --" : "-- Select Target Module --"}
                  </option>
                  {availableTargetModules.filter((m) => m.isCurrentExam).length > 0 && (
                    <optgroup
                      label={
                        isAr
                          ? `هذا الامتحان (${parentExam?.title || "الحالي"})`
                          : `Current Exam (${parentExam?.title || "Current"})`
                      }
                    >
                      {availableTargetModules
                        .filter((m) => m.isCurrentExam)
                        .map((mod) => (
                          <option key={mod.id} value={mod.id}>
                            {mod.title}
                          </option>
                        ))}
                    </optgroup>
                  )}
                  {Array.from(
                    new Set(availableTargetModules.filter((m) => !m.isCurrentExam).map((m) => m.examId))
                  ).map((examId) => {
                    const examItems = availableTargetModules.filter((m) => m.examId === examId);
                    const examTitle = examItems[0]?.examTitle || examId;
                    return (
                      <optgroup key={examId} label={examTitle}>
                        {examItems.map((mod) => (
                          <option key={mod.id} value={mod.id}>
                            {mod.title}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {allExams.length > 1 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      {isAr ? "الامتحان التابع له الموديول الجديد:" : "Target Exam:"}
                    </label>
                    <select
                      value={targetExamIdForNew}
                      onChange={(e) => setTargetExamIdForNew(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-purple-600 transition-all"
                    >
                      <option value={parentExam?.id}>
                        {isAr
                          ? `هذا الامتحان (${parentExam?.title || "الحالي"})`
                          : `Current Exam (${parentExam?.title || "Current"})`}
                      </option>
                      {allExams
                        .filter((e) => String(e.id) !== String(parentExam?.id))
                        .map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.title || (isAr ? "امتحان بدون عنوان" : "Untitled Exam")}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    {isAr ? "اسم الموديول الجديد:" : "New Module Name:"}
                  </label>
                  <input
                    type="text"
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    placeholder={isAr ? "مثال: موديول 2 - المراجعة" : "e.g., Module 2 - Review"}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-purple-600 transition-all"
                    autoFocus
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {isAr ? "إلغاء" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={
              operationType === "entire_module"
                ? handleConfirmMoveEntireModule
                : handleConfirmMoveSubExamsOnly
            }
            disabled={isSubmitting}
            className={`px-6 py-3 rounded-2xl font-black text-sm text-white shadow-lg transition-all disabled:opacity-50 ${
              operationType === "entire_module"
                ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                : "bg-purple-600 hover:bg-purple-700 shadow-purple-200"
            }`}
          >
            {isSubmitting
              ? isAr
                ? "جارٍ النقل..."
                : "Moving..."
              : operationType === "entire_module"
              ? isAr
                ? "تأكيد نقل الموديول بالكامل"
                : "Confirm Move Module"
              : isAr
              ? "تأكيد نقل الاختبارات"
              : "Confirm Move Sub-Exams"}
          </button>
        </div>
      </div>
    </div>
  );
}
