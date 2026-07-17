"use client";

import React, { useState, useRef } from "react";
import { X, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportExcelModal({ isOpen, onClose, onSuccess }: Props) {
  const { language } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem("super_admin_token") || localStorage.getItem("school_admin_token");
      const res = await fetch(`${API_URL}/school/import/template`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to download template");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "course_import_template.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || "Failed to download template");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("super_admin_token") || localStorage.getItem("school_admin_token");
      const res = await fetch(`${API_URL}/school/import/excel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setSuccess(data.message || "Import successful!");
      setTimeout(() => {
        onSuccess();
        onClose();
        setFile(null);
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {language === 'ar' ? "استيراد الكورسات والدروس" : "Import Courses & Lessons"}
              </h2>
              <p className="text-sm font-medium text-slate-500 mt-1">
                {language === 'ar' ? "رفع الكورسات دفعة واحدة عن طريق Excel" : "Bulk upload courses via Excel"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Instructions */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-indigo-500" />
              {language === 'ar' ? "كيفية الاستخدام؟" : "How to use?"}
            </h3>
            <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
              <li>{language === 'ar' ? "قم بتحميل نموذج الإكسيل أدناه وقم بتعبئته." : "Download the Excel template below and fill it out."}</li>
              <li>{language === 'ar' ? "عمود 'Course Title' مطلوب. إذا كان اسم الكورس موجوداً، ستُضاف الدروس له، وإلا سيُنشأ كورس جديد." : "The 'Course Title' is required. Existing courses will get new lessons, new names will create new courses."}</li>
              <li>{language === 'ar' ? "يمكنك كتابة نص عادي في أعمدة الواجبات والاختبارات، وسيقوم النظام بتحويلها تلقائياً، أو استخدم JSON." : "You can write plain text in assignments/questions columns and the system will auto-format them."}</li>
            </ul>
            <button 
              onClick={handleDownloadTemplate}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 font-bold rounded-xl hover:bg-indigo-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              {language === 'ar' ? "تحميل نموذج Excel" : "Download Excel Template"}
            </button>
          </div>

          {/* Upload Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${file ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'}`}
          >
            <input 
              type="file" 
              accept=".xlsx,.xls,.csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${file ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
              <Upload className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-slate-900 mb-1">
              {file ? file.name : (language === 'ar' ? "اختر ملف إكسيل" : "Select an Excel file")}
            </h4>
            <p className="text-sm font-medium text-slate-500">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : (language === 'ar' ? "انقر لاختيار الملف (.xlsx)" : "Click to browse (.xlsx)")}
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 text-sm font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl p-4 text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              {success}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-3xl">
          <button 
            onClick={onClose}
            disabled={isUploading}
            className="px-6 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {language === 'ar' ? "إلغاء" : "Cancel"}
          </button>
          <button 
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:bg-slate-300"
          >
            {isUploading && <Loader2 className="w-5 h-5 animate-spin" />}
            {language === 'ar' ? "بدء الاستيراد" : "Start Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
