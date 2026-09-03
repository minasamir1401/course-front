"use client";

import React, { useState } from "react";
import { Edit2, Plus, Trash2, FileJson, Upload, Download, Search, ChevronDown, Target, BookOpen, Video } from "lucide-react";
import * as XLSX from "xlsx";
import { useCourseEditor } from "../CourseEditorContext";

interface LessonInfoTabProps {
  currentLesson: any;
  setCurrentLesson: (lesson: any) => void;
  language: string;
  showToast: (message: string, type: "success" | "error" | "info") => void;
  metadataExcelRef: React.RefObject<HTMLInputElement | null>;
  handleExcelUpload: (source: 'metadata') => void;
}

export const LessonInfoTab: React.FC<LessonInfoTabProps> = ({
  currentLesson,
  setCurrentLesson,
  language,
  showToast,
  metadataExcelRef,
  handleExcelUpload
}) => {
  const { lessons = [], availableMetadata } = useCourseEditor() as any;
  const t = (key: string) => key;
  const [isStandardDropdownOpen, setIsStandardDropdownOpen] = useState(false);
  const [isIndicatorDropdownOpen, setIsIndicatorDropdownOpen] = useState(false);
  const [isOutcomeDropdownOpen, setIsOutcomeDropdownOpen] = useState(false);

  const handleMetadataExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        if (rows.length < 2) {
          showToast(language === 'ar' ? "الملف فارغ أو لا يحتوي على صفوف بيانات" : "File is empty or does not contain data rows", "error");
          return;
        }

        const headers = (rows[0] as string[]).map((h) => String(h).trim().toLowerCase());

        const stdIdx = headers.findIndex(h => h.includes("standard") || h.includes("معيار") || h.includes("المعايير"));
        const indIdx = headers.findIndex(h => h.includes("indicator") || h.includes("مؤشر") || h.includes("المؤشرات"));
        const loIdx = headers.findIndex(h => h.includes("outcome") || h.includes("ناتج") || h.includes("مخرج") || h.includes("النواتج") || h.includes("المخرجات"));
        const domainIdx = headers.findIndex(h => h.includes("domain") || h.includes("مجال") || h.includes("المجال"));
        const lessonIdx = headers.findIndex(h => h.includes("lesson") || h.includes("درس") || h.includes("الدرس"));

        if (stdIdx === -1 && indIdx === -1 && loIdx === -1 && domainIdx === -1) {
          showToast(language === 'ar' ? "لم يتم العثور على أعمدة متوافقة (المعايير، المؤشرات، المخرجات، المجال)" : "No matching columns found (Standards, Indicators, Outcomes, Domain)", "error");
          return;
        }

        let standardVal = "";
        let indicatorVal = "";
        let outcomeVal = "";
        let domainVal = "";

        const dataRows = rows.slice(1).filter(r => r.some(c => String(c).trim() !== ""));

        let filteredRows = dataRows;
        if (lessonIdx >= 0 && currentLesson.title) {
          const currentLessonTitleLower = currentLesson.title.trim().toLowerCase();
          const matchingRows = dataRows.filter(r => {
            const rowLesson = String(r[lessonIdx] ?? "").trim().toLowerCase();
            return rowLesson && (currentLessonTitleLower.includes(rowLesson) || rowLesson.includes(currentLessonTitleLower));
          });
          if (matchingRows.length > 0) {
            filteredRows = matchingRows;
          }
        }

        if (filteredRows.length > 0) {
          const standardsList = filteredRows.map(r => stdIdx >= 0 ? String(r[stdIdx] ?? "").trim() : "").filter(Boolean);
          const indicatorsList = filteredRows.map(r => indIdx >= 0 ? String(r[indIdx] ?? "").trim() : "").filter(Boolean);
          const outcomesList = filteredRows.map(r => loIdx >= 0 ? String(r[loIdx] ?? "").trim() : "").filter(Boolean);
          const domainList = filteredRows.map(r => domainIdx >= 0 ? String(r[domainIdx] ?? "").trim() : "").filter(Boolean);

          standardVal = standardsList.join("\n");
          indicatorVal = indicatorsList.join("\n");
          outcomeVal = outcomesList.join("\n");
          domainVal = domainList[0] || "";
        }

        setCurrentLesson((prev: any) => ({
          ...prev,
          standards: standardVal || prev.standards,
          indicators: indicatorVal || prev.indicators,
          learningOutcomes: outcomeVal || prev.learningOutcomes,
          domain: domainVal || prev.domain
        }));

        showToast(t('courseCreate.excelMetadataSuccess') || "Standards, indicator and domain successfully imported from Excel", "success");
      } catch (err) {
        console.error(err);
        showToast(t('courseCreate.excelMetadataError') || "Error reading Excel file", "error");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const downloadMetadataTemplate = () => {
    const wsData = [
      ["Lesson Title", "Standard", "Indicator", "Outcome", "Domain"],
      ["مقدمة في الفيزياء", "Standard 1: Understanding & Comprehension", "Indicator 1: Identifies Basic Concepts", "Outcome 1: Student will be able to...", "الفيزياء"],
      ["مقدمة في الفيزياء", "Standard 2: Application & Analysis", "Indicator 2: Applies Mathematical Laws", "Outcome 2: Student will distinguish between...", "الفيزياء"],
      ["الحركة الموجية", "Standard 3: Critical Thinking", "Indicator 3: Infers Relationships", "Outcome 3: Student will analyze...", "الفيزياء"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Metadata Template");
    XLSX.writeFile(wb, "course_metadata_template.xlsx");
    showToast(language === 'ar' ? "تم تحميل نموذج المعايير بنجاح" : "Metadata template downloaded successfully", "success");
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="text-xs font-black text-slate-400 uppercase mb-3 block tracking-widest">{language === 'ar' ? "عنوان الدرس" : "Lesson Title"}</label>
          <input
            type="text"
            placeholder={language === 'ar' ? "مثال: مقدمة في علم الفيزياء" : "e.g. Introduction to Physics"}
            value={currentLesson.title || ""}
            onChange={(e) => setCurrentLesson({ ...currentLesson, title: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 text-lg font-bold outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-sm"
          />
        </div>
        <div>
          <label className="text-xs font-black text-slate-400 uppercase mb-3 block tracking-widest">{language === 'ar' ? "رابط الفيديو (YouTube)" : "Video Link (YouTube)"}</label>
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
          {language === 'ar' ? "الأهداف الأكاديمية والمعايير" : "Academic Standards & Outcomes"}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{language === 'ar' ? "المجال" : "Domain"}</label>
            <select
              value={currentLesson.domain || ""}
              onChange={(e) => setCurrentLesson({ ...currentLesson, domain: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 text-sm outline-none focus:border-indigo-600 appearance-none shadow-sm font-bold"
            >
              <option value="">{t('courseCreate.selectDomain') || "Select Domain..."}</option>
              {availableMetadata.domains?.map((domainName: string) => (
                <option key={domainName} value={domainName}>{domainName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{language === 'ar' ? "المعايير" : "Standards"}</label>
            <select
              value={currentLesson.standards || ""}
              onChange={(e) => setCurrentLesson({ ...currentLesson, standards: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 text-sm outline-none focus:border-indigo-600 appearance-none shadow-sm font-bold truncate"
            >
              <option value="">{t('courseCreate.selectStandard') || "Select Standard..."}</option>
              {availableMetadata.standards?.map((standardName: string) => (
                <option key={standardName} value={standardName}>{standardName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{language === 'ar' ? "المؤشرات" : "Indicators"}</label>
            <select
              value={currentLesson.indicators || ""}
              onChange={(e) => setCurrentLesson({ ...currentLesson, indicators: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 text-sm outline-none focus:border-indigo-600 appearance-none shadow-sm font-bold truncate"
            >
              <option value="">{t('courseCreate.selectIndicator') || "Select Indicator..."}</option>
              {availableMetadata.indicators?.map((indicatorName: string) => (
                <option key={indicatorName} value={indicatorName}>{indicatorName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{language === 'ar' ? "نواتج التعلم (LOs)" : "Learning Outcomes (LOs)"}</label>
            <select
              value={currentLesson.learningOutcomes || ""}
              onChange={(e) => setCurrentLesson({ ...currentLesson, learningOutcomes: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 text-sm outline-none focus:border-indigo-600 appearance-none shadow-sm font-bold truncate"
            >
              <option value="">{t('courseCreate.selectOutcome') || "Select Learning Outcome..."}</option>
              {availableMetadata.outcomes?.map((outcomeName: string) => (
                <option key={outcomeName} value={outcomeName}>{outcomeName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
