"use client";
import { parseLessonMetadataRows } from "@/lib/lessonMetadataExcel";

import BilingualMetadataEditor from "@/components/BilingualMetadataEditor";
import React from "react";
import { Upload, Download, Target, Video } from "lucide-react";
import * as XLSX from "xlsx";
import { buildCourseMetadataTemplateRows } from '@/lib/examExcelTemplates';

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
  const latestLesson = React.useRef(currentLesson);
  React.useEffect(() => { latestLesson.current = currentLesson; }, [currentLesson]);

  const handleMetadataExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast(language === "ar" ? "الحد الأقصى 5 ميجابايت" : "Maximum file size: 5 MB", "error"); e.target.value = ""; return; }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        if (latestLesson.current !== currentLesson) throw new Error(language === "ar" ? "تغير الدرس أثناء قراءة الملف. أعد الاستيراد." : "The lesson changed while reading the file. Import again.");
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        if (rows.length < 2) {
          showToast(language === 'ar' ? "الملف فارغ أو لا يحتوي على صفوف بيانات" : "File is empty or does not contain data rows", "error");
          return;
        }

        const metadata = parseLessonMetadataRows(rows, currentLesson.title);
        setCurrentLesson((prev: any) => ({ ...prev, ...metadata }));

        showToast(language === 'ar' ? 'تم استيراد البيانات باللغتين' : 'Bilingual metadata imported', 'success');
      } catch (err: any) {
        console.error(err);
        showToast(err.message || (language === 'ar' ? 'تعذرت قراءة الملف' : 'Could not read workbook'), 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const downloadMetadataTemplate = () => {
    const wsData = buildCourseMetadataTemplateRows(language);
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
        <input type="file" ref={metadataExcelRef} accept=".xlsx,.xls" className="hidden" onChange={handleMetadataExcelChange} />
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => handleExcelUpload('metadata')} className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700 shadow-sm hover:bg-emerald-100"><Upload size={16} />{language === 'ar' ? 'استيراد Metadata' : 'Import metadata'}</button>
          <button type="button" onClick={downloadMetadataTemplate} className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-3 text-sm font-bold text-indigo-700 shadow-sm hover:bg-indigo-100"><Download size={16} />{language === 'ar' ? 'قالب Excel باللغتين' : 'Bilingual Excel template'}</button>
        </div>
        <p className="text-xs text-slate-500">{language === 'ar' ? 'اكتب عنوان هذا الدرس في القالب لربط المعايير به.' : 'Use this lesson’s title in the template to match its metadata.'}</p>
        <BilingualMetadataEditor value={currentLesson} fields={['domain', 'standards', 'indicators', 'learningOutcomes']} language={language} onChange={patch => setCurrentLesson((prev: any) => ({ ...prev, ...patch }))} />
      </div>
    </div>
  );
};
