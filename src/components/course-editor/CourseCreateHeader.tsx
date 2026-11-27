"use client";

import React from "react";
import { ArrowLeft, Download, Save } from "lucide-react";
import { offlineSync } from "@/lib/offlineSync";
import { useNotification } from "@/context/NotificationContext";
import AutoTranslateToggle from "@/components/AutoTranslateToggle";

interface CourseCreateHeaderProps {
  language: string;
  title: string;
  subtitle: string;
  saveLabel: string;
  savingLabel: string;
  isAutoSaveEnabled: boolean;
  setIsAutoSaveEnabled: (value: boolean) => void;
  lastAutoSave: Date | null;
  createdId: string | null;
  isLoading: boolean;
  onBack: () => void;
  onSave: () => void;
}

export const CourseCreateHeader: React.FC<CourseCreateHeaderProps> = ({
  language,
  title,
  subtitle,
  saveLabel,
  savingLabel,
  isAutoSaveEnabled,
  setIsAutoSaveEnabled,
  lastAutoSave,
  createdId,
  isLoading,
  onBack,
  onSave,
}) => {
  const { showToast } = useNotification();
  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={onBack}
            className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 border border-slate-100 hover:border-indigo-100 transition-all"
          >
            <ArrowLeft className={`w-7 h-7 ${language === "en" ? "rotate-180" : ""}`} />
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {title}
            </h1>
            <p className="text-slate-400 text-lg mt-1 font-bold">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center shrink-0">
          <AutoTranslateToggle language={language} compact />
          <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200 shrink-0">
            <span className="text-sm font-bold text-slate-600 whitespace-nowrap">
              {language === "ar" ? "الحفظ التلقائي" : "Auto-Save"}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isAutoSaveEnabled}
                onChange={(e) => setIsAutoSaveEnabled(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 shrink-0"></div>
            </label>
          </div>

          {lastAutoSave && (
            <span className="text-xs text-emerald-600 font-bold whitespace-nowrap">
              {language === "ar" ? "تم الحفظ:" : "Saved:"}{" "}
              {lastAutoSave.toLocaleTimeString(undefined, { timeZone: "Africa/Cairo" })}
            </span>
          )}

          {!lastAutoSave && createdId && (
            <span className="text-xs text-slate-400 font-bold whitespace-nowrap">
              {language === "ar" ? "محفوظ كمسودة" : "Saved draft"}
            </span>
          )}

          <button
            type="button"
            onClick={async () => {
              try {
                const summary = await offlineSync.downloadBrowserWorkspaceBackup();
                showToast(
                  language === "ar"
                    ? `تم تصدير مسودات المتصفح (${summary.editorDraftsCount} مسودة، ${summary.pendingSavesCount} حفظ معلق)`
                    : `Exported browser drafts (${summary.editorDraftsCount} drafts, ${summary.pendingSavesCount} pending saves)`,
                  "success"
                );
              } catch {
                showToast(language === "ar" ? "تعذر تصدير مسودات المتصفح" : "Failed to export browser drafts", "error");
              }
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-4 rounded-2xl font-bold flex items-center gap-2 border border-slate-200 transition-all whitespace-nowrap shrink-0"
            title={language === "ar" ? "تصدير مسودات IndexedDB و localStorage" : "Export IndexedDB and localStorage drafts"}
          >
            <Download className="w-5 h-5" />
            <span>{language === "ar" ? "تصدير مسودات المتصفح" : "Export Browser Drafts"}</span>
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={isLoading}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:scale-[1.02] shadow-xl shadow-indigo-600/20 disabled:opacity-50 transition-all whitespace-nowrap shrink-0"
          >
            <span>{isLoading ? savingLabel : saveLabel}</span>
            <Save className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
