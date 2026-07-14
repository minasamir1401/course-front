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
  const { lessons = [] } = useCourseEditor() as any;
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
      ["مقدمة في الفيزياء", "معيار 1: الفهم والاستيعاب", "مؤشر 1: يحدد المفاهيم الأساسية", "ناتج 1: أن يكون الطالب قادراً على...", "الفيزياء"],
      ["مقدمة في الفيزياء", "معيار 2: التطبيق والتحليل", "مؤشر 2: يطبق القوانين الرياضية", "ناتج 2: أن يميز الطالب بين...", "الفيزياء"],
      ["الحركة الموجية", "معيار 3: التفكير النقدي", "مؤشر 3: يستنتج العلاقات", "ناتج 3: أن يحلل الطالب...", "الفيزياء"]
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
                        {language === 'ar' ? "المعايير والمخرجات الأكاديمية" : "Academic Standards & Outcomes"}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{language === 'ar' ? "المجال (Domain)" : "Domain"}</label>
                          <div className="flex gap-2">
                            <select
                              value={currentLesson.domain || ""}
                              onChange={(e) => {
                                if (e.target.value === "__NEW__") {
                                  const newDomain = prompt(language === 'ar' ? "أدخل اسم المجال الجديد:" : "Enter new domain name:");
                                  if (newDomain && newDomain.trim()) {
                                    setCurrentLesson({ ...currentLesson, domain: newDomain.trim() });
                                  }
                                } else {
                                  setCurrentLesson({ ...currentLesson, domain: e.target.value });
                                }
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all shadow-sm appearance-none"
                            >
                              <option value="">{language === 'ar' ? "اختر المجال..." : "Select Domain..."}</option>
                              {Array.from(new Set(lessons.map((l: any) => l.domain).filter(Boolean))).map((domainName: any) => (
                                <option key={domainName} value={domainName}>{domainName}</option>
                              ))}
                              <option value="__NEW__" className="text-indigo-600 font-bold">{language === 'ar' ? "+ إضافة مجال جديد..." : "+ Add New Domain..."}</option>
                            </select>
                            {currentLesson.domain && (
                              <div className="flex gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newVal = prompt(language === 'ar' ? "تعديل المجال:" : "Edit Domain:", currentLesson.domain);
                                    if (newVal !== null && newVal.trim()) {
                                      setCurrentLesson({...currentLesson, domain: newVal.trim()});
                                      showToast(language === 'ar' ? "تم تعديل المجال بنجاح" : "Domain updated successfully", "success");
                                    }
                                  }}
                                  className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl border border-indigo-100 flex items-center justify-center transition-all"
                                  title={language === 'ar' ? "تعديل المجال" : "Edit Domain"}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCurrentLesson({...currentLesson, domain: ""});
                                    showToast(language === 'ar' ? "تم إزالة المجال" : "Domain cleared", "info");
                                  }}
                                  className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-100 flex items-center justify-center transition-all"
                                  title={language === 'ar' ? "حذف المجال" : "Clear Domain"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3 relative">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{language === 'ar' ? "المعايير (Standards)" : "Standards"}</label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setIsStandardDropdownOpen(!isStandardDropdownOpen);
                                setIsIndicatorDropdownOpen(false);
                                setIsOutcomeDropdownOpen(false);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 flex justify-between items-center shadow-sm text-right cursor-pointer"
                            >
                              <span className="truncate">
                                {(() => {
                                  const selected = (currentLesson.standards || "").split("\n").filter(Boolean);
                                  if (selected.length === 0) return language === 'ar' ? "اختر المعيار..." : "Select Standard...";
                                  return language === 'ar' 
                                    ? `تم تحديد (${selected.length}) معايير` 
                                    : `Selected (${selected.length}) standards`;
                                })()}
                              </span>
                              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isStandardDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isStandardDropdownOpen && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsStandardDropdownOpen(false)}></div>
                                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-72 overflow-y-auto p-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                  {[
                                    language === 'ar' ? "معيار 1: الفهم والاستيعاب" : "Standard 1: Understanding & Comprehension",
                                    language === 'ar' ? "معيار 2: التطبيق والتحليل" : "Standard 2: Application & Analysis",
                                    language === 'ar' ? "معيار 3: التفكير النقدي" : "Standard 3: Critical Thinking"
                                  ].map((option) => {
                                    const selected = (currentLesson.standards || "").split("\n").filter(Boolean);
                                    const isSelected = selected.includes(option);
                                    return (
                                      <label key={option} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors text-slate-700 font-bold text-xs">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => {
                                            let nextList = [...selected];
                                            if (isSelected) {
                                              nextList = nextList.filter((x: string) => x !== option);
                                            } else {
                                              nextList.push(option);
                                            }
                                            setCurrentLesson({...currentLesson, standards: nextList.join("\n")});
                                          }}
                                          className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                                        />
                                        <span className="flex-1 text-right">{option}</span>
                                      </label>
                                    );
                                  })}

                                  {(() => {
                                    const selected = (currentLesson.standards || "").split("\n").filter(Boolean);
                                    const defaultOptions = [
                                      language === 'ar' ? "معيار 1: الفهم والاستيعاب" : "Standard 1: Understanding & Comprehension",
                                      language === 'ar' ? "معيار 2: التطبيق والتحليل" : "Standard 2: Application & Analysis",
                                      language === 'ar' ? "معيار 3: التفكير النقدي" : "Standard 3: Critical Thinking",
                                      "معيار 1: الفهم والاستيعاب",
                                      "معيار 2: التطبيق والتحليل",
                                      "معيار 3: التفكير النقدي"
                                    ];
                                    const customOpts = selected.filter((x: string) => !defaultOptions.includes(x));
                                    return customOpts.map((option: string) => (
                                      <div key={option} className="flex items-center justify-between gap-2 px-3 py-1 hover:bg-slate-50 rounded-xl text-slate-700 font-bold text-xs">
                                        <label className="flex items-center gap-3 flex-1 cursor-pointer py-1.5">
                                          <input
                                            type="checkbox"
                                            checked={true}
                                            onChange={() => {
                                              const nextList = selected.filter((x: string) => x !== option);
                                              setCurrentLesson({...currentLesson, standards: nextList.join("\n")});
                                            }}
                                            className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                                          />
                                          <span className="flex-1 text-right truncate" title={option}>{option}</span>
                                        </label>
                                        <div className="flex gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newVal = prompt(language === 'ar' ? "تعديل المعيار المخصص:" : "Edit Custom Standard:", option);
                                              if (newVal !== null && newVal.trim()) {
                                                const nextList = selected.map((x: string) => x === option ? newVal.trim() : x);
                                                setCurrentLesson({...currentLesson, standards: nextList.join("\n")});
                                                showToast(language === 'ar' ? "تم التعديل بنجاح" : "Updated successfully", "success");
                                              }
                                            }}
                                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-all"
                                            title={language === 'ar' ? "تعديل" : "Edit"}
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const nextList = selected.filter((x: string) => x !== option);
                                              setCurrentLesson({...currentLesson, standards: nextList.join("\n")});
                                              showToast(language === 'ar' ? "تم إزالة المعيار" : "Standard removed", "info");
                                            }}
                                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all"
                                            title={language === 'ar' ? "حذف" : "Delete"}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ));
                                  })()}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newVal = prompt(language === 'ar' ? "أدخل المعيار المخصص الجديد:" : "Enter new custom standard:");
                                      if (newVal && newVal.trim()) {
                                        const selected = (currentLesson.standards || "").split("\n").filter(Boolean);
                                        if (!selected.includes(newVal.trim())) {
                                          const nextList = [...selected, newVal.trim()];
                                          setCurrentLesson({...currentLesson, standards: nextList.join("\n")});
                                          showToast(language === 'ar' ? "تم الإضافة بنجاح" : "Added successfully", "success");
                                        }
                                      }
                                    }}
                                    className="w-full text-right px-3 py-2 hover:bg-indigo-50/50 hover:text-indigo-600 rounded-xl cursor-pointer transition-all text-indigo-600 font-black text-xs border border-dashed border-indigo-100 mt-2 flex items-center justify-center gap-1.5"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>{language === 'ar' ? "+ إضافة معيار مخصص..." : "+ Add Custom Standard..."}</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>


                        </div>

                        <div className="space-y-3 relative">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{language === 'ar' ? "المؤشرات (Indicators)" : "Indicators"}</label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setIsIndicatorDropdownOpen(!isIndicatorDropdownOpen);
                                setIsOutcomeDropdownOpen(false);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 flex justify-between items-center shadow-sm text-right cursor-pointer"
                            >
                              <span className="truncate">
                                {(() => {
                                  const selected = (currentLesson.indicators || "").split("\n").filter(Boolean);
                                  if (selected.length === 0) return language === 'ar' ? "اختر المؤشر..." : "Select Indicator...";
                                  return language === 'ar' 
                                    ? `تم تحديد (${selected.length}) مؤشرات` 
                                    : `Selected (${selected.length}) indicators`;
                                })()}
                              </span>
                              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isIndicatorDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isIndicatorDropdownOpen && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsIndicatorDropdownOpen(false)}></div>
                                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-72 overflow-y-auto p-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                  {[
                                    language === 'ar' ? "مؤشر 1: يحدد المفاهيم الأساسية" : "Indicator 1: Identifies basic concepts",
                                    language === 'ar' ? "مؤشر 2: يطبق القوانين الرياضية" : "Indicator 2: Applies mathematical laws",
                                    language === 'ar' ? "مؤشر 3: يستنتج العلاقات" : "Indicator 3: Deduces relationships"
                                  ].map((option) => {
                                    const selected = (currentLesson.indicators || "").split("\n").filter(Boolean);
                                    const isSelected = selected.includes(option);
                                    return (
                                      <label key={option} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors text-slate-700 font-bold text-xs">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => {
                                            let nextList = [...selected];
                                            if (isSelected) {
                                              nextList = nextList.filter((x: string) => x !== option);
                                            } else {
                                              nextList.push(option);
                                            }
                                            setCurrentLesson({...currentLesson, indicators: nextList.join("\n")});
                                          }}
                                          className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                                        />
                                        <span className="flex-1 text-right">{option}</span>
                                      </label>
                                    );
                                  })}

                                  {(() => {
                                    const selected = (currentLesson.indicators || "").split("\n").filter(Boolean);
                                    const defaultOptions = [
                                      "مؤشر 1: يحدد المفاهيم الأساسية",
                                      "مؤشر 2: يطبق القوانين الرياضية",
                                      "مؤشر 3: يستنتج العلاقات",
                                      language === 'ar' ? "مؤشر 1: يحدد المفاهيم الأساسية" : "Indicator 1: Identifies basic concepts",
                                      language === 'ar' ? "مؤشر 2: يطبق القوانين الرياضية" : "Indicator 2: Applies mathematical laws",
                                      language === 'ar' ? "مؤشر 3: يستنتج العلاقات" : "Indicator 3: Deduces relationships"
                                    ];
                                    const customOpts = selected.filter((x: string) => !defaultOptions.includes(x));
                                    return customOpts.map((option: string) => (
                                      <div key={option} className="flex items-center justify-between gap-2 px-3 py-1 hover:bg-slate-50 rounded-xl text-slate-700 font-bold text-xs">
                                        <label className="flex items-center gap-3 flex-1 cursor-pointer py-1.5">
                                          <input
                                            type="checkbox"
                                            checked={true}
                                            onChange={() => {
                                              const nextList = selected.filter((x: string) => x !== option);
                                              setCurrentLesson({...currentLesson, indicators: nextList.join("\n")});
                                            }}
                                            className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                                          />
                                          <span className="flex-1 text-right truncate" title={option}>{option}</span>
                                        </label>
                                        <div className="flex gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newVal = prompt(language === 'ar' ? "تعديل المؤشر المخصص:" : "Edit Custom Indicator:", option);
                                              if (newVal !== null && newVal.trim()) {
                                                const nextList = selected.map((x: string) => x === option ? newVal.trim() : x);
                                                setCurrentLesson({...currentLesson, indicators: nextList.join("\n")});
                                                showToast(language === 'ar' ? "تم التعديل بنجاح" : "Updated successfully", "success");
                                              }
                                            }}
                                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-all"
                                            title={language === 'ar' ? "تعديل" : "Edit"}
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const nextList = selected.filter((x: string) => x !== option);
                                              setCurrentLesson({...currentLesson, indicators: nextList.join("\n")});
                                              showToast(language === 'ar' ? "تم إزالة المؤشر" : "Indicator removed", "info");
                                            }}
                                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all"
                                            title={language === 'ar' ? "حذف" : "Delete"}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ));
                                  })()}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newVal = prompt(language === 'ar' ? "أدخل المؤشر المخصص الجديد:" : "Enter new custom indicator:");
                                      if (newVal && newVal.trim()) {
                                        const selected = (currentLesson.indicators || "").split("\n").filter(Boolean);
                                        if (!selected.includes(newVal.trim())) {
                                          const nextList = [...selected, newVal.trim()];
                                          setCurrentLesson({...currentLesson, indicators: nextList.join("\n")});
                                          showToast(language === 'ar' ? "تم الإضافة بنجاح" : "Added successfully", "success");
                                        }
                                      }
                                    }}
                                    className="w-full text-right px-3 py-2 hover:bg-indigo-50/50 hover:text-indigo-600 rounded-xl cursor-pointer transition-all text-indigo-600 font-black text-xs border border-dashed border-indigo-100 mt-2 flex items-center justify-center gap-1.5"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>{language === 'ar' ? "+ إضافة مؤشر مخصص..." : "+ Add Custom Indicator..."}</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>


                        </div>

                        <div className="space-y-3 relative">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{language === 'ar' ? "نواتج التعلم (Outcomes)" : "Learning Outcomes"}</label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setIsOutcomeDropdownOpen(!isOutcomeDropdownOpen);
                                setIsIndicatorDropdownOpen(false);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 flex justify-between items-center shadow-sm text-right cursor-pointer"
                            >
                              <span className="truncate">
                                {(() => {
                                  const selected = (currentLesson.learningOutcomes || "").split("\n").filter(Boolean);
                                  if (selected.length === 0) return language === 'ar' ? "اختر ناتج التعلم..." : "Select Learning Outcome...";
                                  return language === 'ar' 
                                    ? `تم تحديد (${selected.length}) نواتج تعلم` 
                                    : `Selected (${selected.length}) outcomes`;
                                })()}
                              </span>
                              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOutcomeDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isOutcomeDropdownOpen && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsOutcomeDropdownOpen(false)}></div>
                                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-72 overflow-y-auto p-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                  {[
                                    language === 'ar' ? "ناتج 1: أن يكون الطالب قادراً على..." : "Outcome 1: Student should be able to...",
                                    language === 'ar' ? "ناتج 2: أن يميز الطالب بين..." : "Outcome 2: Student should distinguish between...",
                                    language === 'ar' ? "ناتج 3: أن يحلل الطالب..." : "Outcome 3: Student should analyze..."
                                  ].map((option) => {
                                    const selected = (currentLesson.learningOutcomes || "").split("\n").filter(Boolean);
                                    const isSelected = selected.includes(option);
                                    return (
                                      <label key={option} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors text-slate-700 font-bold text-xs">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => {
                                            let nextList = [...selected];
                                            if (isSelected) {
                                              nextList = nextList.filter((x: string) => x !== option);
                                            } else {
                                              nextList.push(option);
                                            }
                                            setCurrentLesson({...currentLesson, learningOutcomes: nextList.join("\n")});
                                          }}
                                          className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                                        />
                                        <span className="flex-1 text-right">{option}</span>
                                      </label>
                                    );
                                  })}

                                  {(() => {
                                    const selected = (currentLesson.learningOutcomes || "").split("\n").filter(Boolean);
                                    const defaultOptions = [
                                      "ناتج 1: أن يكون الطالب قادراً على...",
                                      "ناتج 2: أن يميز الطالب بين...",
                                      "ناتج 3: أن يحلل الطالب...",
                                      language === 'ar' ? "ناتج 1: أن يكون الطالب قادراً على..." : "Outcome 1: Student should be able to...",
                                      language === 'ar' ? "ناتج 2: أن يميز الطالب بين..." : "Outcome 2: Student should distinguish between...",
                                      language === 'ar' ? "ناتج 3: أن يحلل الطالب..." : "Outcome 3: Student should analyze..."
                                    ];
                                    const customOpts = selected.filter((x: string) => !defaultOptions.includes(x));
                                    return customOpts.map((option: string) => (
                                      <div key={option} className="flex items-center justify-between gap-2 px-3 py-1 hover:bg-slate-50 rounded-xl text-slate-700 font-bold text-xs">
                                        <label className="flex items-center gap-3 flex-1 cursor-pointer py-1.5">
                                          <input
                                            type="checkbox"
                                            checked={true}
                                            onChange={() => {
                                              const nextList = selected.filter((x: string) => x !== option);
                                              setCurrentLesson({...currentLesson, learningOutcomes: nextList.join("\n")});
                                            }}
                                            className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                                          />
                                          <span className="flex-1 text-right truncate" title={option}>{option}</span>
                                        </label>
                                        <div className="flex gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newVal = prompt(language === 'ar' ? "تعديل ناتج التعلم المخصص:" : "Edit Custom Outcome:", option);
                                              if (newVal !== null && newVal.trim()) {
                                                const nextList = selected.map((x: string) => x === option ? newVal.trim() : x);
                                                setCurrentLesson({...currentLesson, learningOutcomes: nextList.join("\n")});
                                                showToast(language === 'ar' ? "تم التعديل بنجاح" : "Updated successfully", "success");
                                              }
                                            }}
                                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-all"
                                            title={language === 'ar' ? "تعديل" : "Edit"}
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const nextList = selected.filter((x: string) => x !== option);
                                              setCurrentLesson({...currentLesson, learningOutcomes: nextList.join("\n")});
                                              showToast(language === 'ar' ? "تم إزالة ناتج التعلم" : "Learning outcome removed", "info");
                                            }}
                                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all"
                                            title={language === 'ar' ? "حذف" : "Delete"}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ));
                                  })()}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newVal = prompt(language === 'ar' ? "أدخل ناتج التعلم المخصص الجديد:" : "Enter new custom learning outcome:");
                                      if (newVal && newVal.trim()) {
                                        const selected = (currentLesson.learningOutcomes || "").split("\n").filter(Boolean);
                                        if (!selected.includes(newVal.trim())) {
                                          const nextList = [...selected, newVal.trim()];
                                          setCurrentLesson({...currentLesson, learningOutcomes: nextList.join("\n")});
                                          showToast(language === 'ar' ? "تم الإضافة بنجاح" : "Added successfully", "success");
                                        }
                                      }
                                    }}
                                    className="w-full text-right px-3 py-2 hover:bg-indigo-50/50 hover:text-indigo-600 rounded-xl cursor-pointer transition-all text-indigo-600 font-black text-xs border border-dashed border-indigo-100 mt-2 flex items-center justify-center gap-1.5"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>{language === 'ar' ? "+ إضافة ناتج مخصص..." : "+ Add Custom Outcome..."}</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3 relative">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{language === 'ar' ? "المؤشرات (Indicators)" : "Indicators"}</label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setIsIndicatorDropdownOpen(!isIndicatorDropdownOpen);
                                setIsOutcomeDropdownOpen(false);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 flex justify-between items-center shadow-sm text-right cursor-pointer"
                            >
                              <span className="truncate">
                                {(() => {
                                  const selected = (currentLesson.indicators || "").split("\n").filter(Boolean);
                                  if (selected.length === 0) return language === 'ar' ? "اختر المؤشر..." : "Select Indicator...";
                                  return language === 'ar' 
                                    ? `تم تحديد (${selected.length}) مؤشرات` 
                                    : `Selected (${selected.length}) indicators`;
                                })()}
                              </span>
                              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isIndicatorDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isIndicatorDropdownOpen && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsIndicatorDropdownOpen(false)}></div>
                                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-72 overflow-y-auto p-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                  {[
                                    language === 'ar' ? "مؤشر 1: يحدد المفاهيم الأساسية" : "Indicator 1: Identifies basic concepts",
                                    language === 'ar' ? "مؤشر 2: يطبق القوانين الرياضية" : "Indicator 2: Applies mathematical laws",
                                    language === 'ar' ? "مؤشر 3: يستنتج العلاقات" : "Indicator 3: Deduces relationships"
                                  ].map((option) => {
                                    const selected = (currentLesson.indicators || "").split("\n").filter(Boolean);
                                    const isSelected = selected.includes(option);
                                    return (
                                      <label key={option} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors text-slate-700 font-bold text-xs">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => {
                                            let nextList = [...selected];
                                            if (isSelected) {
                                              nextList = nextList.filter((x: string) => x !== option);
                                            } else {
                                              nextList.push(option);
                                            }
                                            setCurrentLesson({...currentLesson, indicators: nextList.join("\n")});
                                          }}
                                          className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                                        />
                                        <span className="flex-1 text-right">{option}</span>
                                      </label>
                                    );
                                  })}

                                  {(() => {
                                    const selected = (currentLesson.indicators || "").split("\n").filter(Boolean);
                                    const defaultOptions = [
                                      "مؤشر 1: يحدد المفاهيم الأساسية",
                                      "مؤشر 2: يطبق القوانين الرياضية",
                                      "مؤشر 3: يستنتج العلاقات",
                                      language === 'ar' ? "مؤشر 1: يحدد المفاهيم الأساسية" : "Indicator 1: Identifies basic concepts",
                                      language === 'ar' ? "مؤشر 2: يطبق القوانين الرياضية" : "Indicator 2: Applies mathematical laws",
                                      language === 'ar' ? "مؤشر 3: يستنتج العلاقات" : "Indicator 3: Deduces relationships"
                                    ];
                                    const customOpts = selected.filter((x: string) => !defaultOptions.includes(x));
                                    return customOpts.map((option: string) => (
                                      <div key={option} className="flex items-center justify-between gap-2 px-3 py-1 hover:bg-slate-50 rounded-xl text-slate-700 font-bold text-xs">
                                        <label className="flex items-center gap-3 flex-1 cursor-pointer py-1.5">
                                          <input
                                            type="checkbox"
                                            checked={true}
                                            onChange={() => {
                                              const nextList = selected.filter((x: string) => x !== option);
                                              setCurrentLesson({...currentLesson, indicators: nextList.join("\n")});
                                            }}
                                            className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                                          />
                                          <span className="flex-1 text-right truncate" title={option}>{option}</span>
                                        </label>
                                        <div className="flex gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newVal = prompt(language === 'ar' ? "تعديل المؤشر المخصص:" : "Edit Custom Indicator:", option);
                                              if (newVal !== null && newVal.trim()) {
                                                const nextList = selected.map((x: string) => x === option ? newVal.trim() : x);
                                                setCurrentLesson({...currentLesson, indicators: nextList.join("\n")});
                                                showToast(language === 'ar' ? "تم التعديل بنجاح" : "Updated successfully", "success");
                                              }
                                            }}
                                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-all"
                                            title={language === 'ar' ? "تعديل" : "Edit"}
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const nextList = selected.filter((x: string) => x !== option);
                                              setCurrentLesson({...currentLesson, indicators: nextList.join("\n")});
                                              showToast(language === 'ar' ? "تم إزالة المؤشر" : "Indicator removed", "info");
                                            }}
                                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all"
                                            title={language === 'ar' ? "حذف" : "Delete"}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ));
                                  })()}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newVal = prompt(language === 'ar' ? "أدخل المؤشر المخصص الجديد:" : "Enter new custom indicator:");
                                      if (newVal && newVal.trim()) {
                                        const selected = (currentLesson.indicators || "").split("\n").filter(Boolean);
                                        if (!selected.includes(newVal.trim())) {
                                          const nextList = [...selected, newVal.trim()];
                                          setCurrentLesson({...currentLesson, indicators: nextList.join("\n")});
                                          showToast(language === 'ar' ? "تم الإضافة بنجاح" : "Added successfully", "success");
                                        }
                                      }
                                    }}
                                    className="w-full text-right px-3 py-2 hover:bg-indigo-50/50 hover:text-indigo-600 rounded-xl cursor-pointer transition-all text-indigo-600 font-black text-xs border border-dashed border-indigo-100 mt-2 flex items-center justify-center gap-1.5"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>{language === 'ar' ? "+ إضافة مؤشر مخصص..." : "+ Add Custom Indicator..."}</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>


                        </div>

                        <div className="space-y-3 relative">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{language === 'ar' ? "نواتج التعلم (Outcomes)" : "Learning Outcomes"}</label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => {
                                setIsOutcomeDropdownOpen(!isOutcomeDropdownOpen);
                                setIsIndicatorDropdownOpen(false);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 flex justify-between items-center shadow-sm text-right cursor-pointer"
                            >
                              <span className="truncate">
                                {(() => {
                                  const selected = (currentLesson.learningOutcomes || "").split("\n").filter(Boolean);
                                  if (selected.length === 0) return language === 'ar' ? "اختر ناتج التعلم..." : "Select Learning Outcome...";
                                  return language === 'ar' 
                                    ? `تم تحديد (${selected.length}) نواتج تعلم` 
                                    : `Selected (${selected.length}) outcomes`;
                                })()}
                              </span>
                              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOutcomeDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isOutcomeDropdownOpen && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsOutcomeDropdownOpen(false)}></div>
                                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-72 overflow-y-auto p-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                  {[
                                    language === 'ar' ? "ناتج 1: أن يكون الطالب قادراً على..." : "Outcome 1: Student should be able to...",
                                    language === 'ar' ? "ناتج 2: أن يميز الطالب بين..." : "Outcome 2: Student should distinguish between...",
                                    language === 'ar' ? "ناتج 3: أن يحلل الطالب..." : "Outcome 3: Student should analyze..."
                                  ].map((option) => {
                                    const selected = (currentLesson.learningOutcomes || "").split("\n").filter(Boolean);
                                    const isSelected = selected.includes(option);
                                    return (
                                      <label key={option} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors text-slate-700 font-bold text-xs">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => {
                                            let nextList = [...selected];
                                            if (isSelected) {
                                              nextList = nextList.filter((x: string) => x !== option);
                                            } else {
                                              nextList.push(option);
                                            }
                                            setCurrentLesson({...currentLesson, learningOutcomes: nextList.join("\n")});
                                          }}
                                          className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                                        />
                                        <span className="flex-1 text-right">{option}</span>
                                      </label>
                                    );
                                  })}

                                  {(() => {
                                    const selected = (currentLesson.learningOutcomes || "").split("\n").filter(Boolean);
                                    const defaultOptions = [
                                      "ناتج 1: أن يكون الطالب قادراً على...",
                                      "ناتج 2: أن يميز الطالب بين...",
                                      "ناتج 3: أن يحلل الطالب...",
                                      language === 'ar' ? "ناتج 1: أن يكون الطالب قادراً على..." : "Outcome 1: Student should be able to...",
                                      language === 'ar' ? "ناتج 2: أن يميز الطالب بين..." : "Outcome 2: Student should distinguish between...",
                                      language === 'ar' ? "ناتج 3: أن يحلل الطالب..." : "Outcome 3: Student should analyze..."
                                    ];
                                    const customOpts = selected.filter((x: string) => !defaultOptions.includes(x));
                                    return customOpts.map((option: string) => (
                                      <div key={option} className="flex items-center justify-between gap-2 px-3 py-1 hover:bg-slate-50 rounded-xl text-slate-700 font-bold text-xs">
                                        <label className="flex items-center gap-3 flex-1 cursor-pointer py-1.5">
                                          <input
                                            type="checkbox"
                                            checked={true}
                                            onChange={() => {
                                              const nextList = selected.filter((x: string) => x !== option);
                                              setCurrentLesson({...currentLesson, learningOutcomes: nextList.join("\n")});
                                            }}
                                            className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                                          />
                                          <span className="flex-1 text-right truncate" title={option}>{option}</span>
                                        </label>
                                        <div className="flex gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newVal = prompt(language === 'ar' ? "تعديل ناتج التعلم المخصص:" : "Edit Custom Outcome:", option);
                                              if (newVal !== null && newVal.trim()) {
                                                const nextList = selected.map((x: string) => x === option ? newVal.trim() : x);
                                                setCurrentLesson({...currentLesson, learningOutcomes: nextList.join("\n")});
                                                showToast(language === 'ar' ? "تم التعديل بنجاح" : "Updated successfully", "success");
                                              }
                                            }}
                                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-all"
                                            title={language === 'ar' ? "تعديل" : "Edit"}
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const nextList = selected.filter((x: string) => x !== option);
                                              setCurrentLesson({...currentLesson, learningOutcomes: nextList.join("\n")});
                                              showToast(language === 'ar' ? "تم إزالة ناتج التعلم" : "Learning outcome removed", "info");
                                            }}
                                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all"
                                            title={language === 'ar' ? "حذف" : "Delete"}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ));
                                  })()}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newVal = prompt(language === 'ar' ? "أدخل ناتج التعلم المخصص الجديد:" : "Enter new custom learning outcome:");
                                      if (newVal && newVal.trim()) {
                                        const selected = (currentLesson.learningOutcomes || "").split("\n").filter(Boolean);
                                        if (!selected.includes(newVal.trim())) {
                                          const nextList = [...selected, newVal.trim()];
                                          setCurrentLesson({...currentLesson, learningOutcomes: nextList.join("\n")});
                                          showToast(language === 'ar' ? "تم الإضافة بنجاح" : "Added successfully", "success");
                                        }
                                      }
                                    }}
                                    className="w-full text-right px-3 py-2 hover:bg-indigo-50/50 hover:text-indigo-600 rounded-xl cursor-pointer transition-all text-indigo-600 font-black text-xs border border-dashed border-indigo-100 mt-2 flex items-center justify-center gap-1.5"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>{language === 'ar' ? "+ إضافة ناتج مخصص..." : "+ Add Custom Outcome..."}</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>


                        </div>
                      </div>

                      <div className="flex justify-center items-center gap-4 mt-6">
                        <input 
                          type="file" 
                          ref={metadataExcelRef} 
                          style={{ display: 'none' }} 
                          accept=".xlsx,.xls" 
                          onChange={handleMetadataExcelChange} 
                        />
                        <button 
                          type="button"
                          onClick={() => handleExcelUpload('metadata')}
                          className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-6 py-2.5 rounded-xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all font-black text-xs cursor-pointer shadow-sm"
                        >
                          <Upload className="w-4 h-4" />
                          {language === 'ar' ? "رفع المعايير من Excel" : "Upload standards from Excel"}
                        </button>
                        <button 
                          type="button"
                          onClick={downloadMetadataTemplate}
                          className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-6 py-2.5 rounded-xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all font-black text-xs cursor-pointer shadow-sm"
                        >
                          <Download className="w-4 h-4" />
                          {language === 'ar' ? "تحميل نموذج Excel الاسترشادي" : "Download guide Excel template"}
                        </button>
                      </div>
                    </div>
                  </div>
  );
};
