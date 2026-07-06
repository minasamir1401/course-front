"use client";

import React, { useRef, useState, useCallback } from "react";
import { X, Download, Upload, CheckCircle, AlertCircle, Loader2, FileSpreadsheet, Users } from "lucide-react";
import * as XLSX from "xlsx";
import { API_URL } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

interface BulkStudentImportProps {
  onClose: () => void;
  onSuccess: (count: number) => void;
  schoolId?: string;
}

interface ParsedStudent {
  name: string;
  username: string;
  password?: string;
  grade?: string;
  phone?: string;
  email?: string;
  _valid: boolean;
  _error?: string;
}

export default function BulkStudentImport({ onClose, onSuccess, schoolId }: BulkStudentImportProps) {
  const { t, language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; failed: number; errors: any[] } | null>(null);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");

  // --- Download blank template ---
  const downloadTemplate = () => {
    const wsData = [
      ["name", "username", "password", "grade", "phone", "email"],
      ["محمد أحمد", "m.ahmed", "Pass@123", "الثاني المتوسط", "0501234567", ""],
      ["سارة علي", "s.ali", "Pass@123", "الأول الثانوي", "", "sara@example.com"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 25 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "students_template.xlsx");
  };

  // --- Parse excel file ---
  const parseFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      if (rows.length < 2) return;

      const headers = (rows[0] as string[]).map((h) => String(h).trim().toLowerCase());
      const nameIdx = headers.indexOf("name");
      const usernameIdx = headers.indexOf("username");
      const passwordIdx = headers.indexOf("password");
      const gradeIdx = headers.indexOf("grade");
      const phoneIdx = headers.indexOf("phone");
      const emailIdx = headers.indexOf("email");

      const parsed: ParsedStudent[] = rows.slice(1)
        .filter((row) => row.some((cell) => String(cell).trim() !== ""))
        .map((row) => {
          const name = String(row[nameIdx] ?? "").trim();
          const username = String(row[usernameIdx] ?? "").trim();
          const password = String(row[passwordIdx] ?? "").trim() || undefined;
          const grade = gradeIdx >= 0 ? String(row[gradeIdx] ?? "").trim() || undefined : undefined;
          const phone = phoneIdx >= 0 ? String(row[phoneIdx] ?? "").trim() || undefined : undefined;
          const email = emailIdx >= 0 ? String(row[emailIdx] ?? "").trim() || undefined : undefined;

          let valid = true;
          let error: string | undefined;
          if (!name) { valid = false; error = "Name is required"; }
          else if (!username) { valid = false; error = "Username is required"; }

          return { name, username, password, grade, phone, email, _valid: valid, _error: error };
        });

      setParsedData(parsed);
      setStep("preview");
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
      parseFile(file);
    }
  }, [parseFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  // --- Execute import ---
  const handleImport = async () => {
    const validRows = parsedData.filter(r => r._valid);
    if (validRows.length === 0) return;

    setImporting(true);
    const token = localStorage.getItem("super_admin_token") || localStorage.getItem("lms_token") || "";
    try {
      const body = {
        users: validRows.map(({ _valid, _error, ...rest }) => ({
          ...rest,
          ...(schoolId ? { schoolId } : {})
        }))
      };
      const res = await fetch(`${API_URL}/admin/users/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      setImportResult({ created: data.created || 0, failed: data.failed || 0, errors: data.errors || [] });
      setStep("done");
      if (data.created > 0) onSuccess(data.created);
    } catch (err) {
      setImportResult({ created: 0, failed: validRows.length, errors: [{ error: "Network error" }] });
      setStep("done");
    }
    setImporting(false);
  };

  const validCount = parsedData.filter(r => r._valid).length;
  const invalidCount = parsedData.filter(r => !r._valid).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Modal */}
      <div
        className="relative w-full max-w-3xl bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        style={{ animation: 'slideUpFade 0.35s ease' }}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center shadow-lg">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">{t('superAdmin.bulkImport.title')}</h2>
              <p className="text-sm text-slate-500">{t('superAdmin.bulkImport.subtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-8 py-4 flex items-center gap-3 border-b border-slate-50">
          {["upload", "preview", "done"].map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 transition-all ${step === s ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all
                  ${step === s ? 'bg-indigo-600 border-indigo-600 text-white' :
                    ["upload", "preview", "done"].indexOf(step) > i
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-white border-slate-200 text-slate-400'}`}>
                  {["upload", "preview", "done"].indexOf(step) > i ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-bold hidden sm:block ${step === s ? 'text-slate-900' : 'text-slate-400'}`}>
                  {s === "upload" ? t('superAdmin.bulkImport.dropzone') :
                    s === "preview" ? t('superAdmin.bulkImport.previewTitle') : "Done"}
                </span>
              </div>
              {i < 2 && <div className="flex-1 h-0.5 bg-slate-100 rounded-full" />}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div className="p-8 max-h-[60vh] overflow-y-auto">

          {/* STEP 1: UPLOAD */}
          {step === "upload" && (
            <div className="space-y-6">
              {/* Download template button */}
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-3 w-full px-6 py-4 rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <Download className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="text-right flex-1">
                  <p className="font-black text-sm">{t('superAdmin.bulkImport.downloadTemplate')}</p>
                  <p className="text-[10px] text-indigo-500 font-bold">{t('superAdmin.bulkImport.dropzoneAccept')}</p>
                </div>
              </button>

              {/* Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300
                  ${isDragging
                    ? "border-indigo-500 bg-indigo-50 scale-[1.01] shadow-lg"
                    : "border-slate-200 bg-slate-50/60 hover:border-indigo-400 hover:bg-indigo-50/40"
                  }`}
              >
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all ${isDragging ? 'bg-indigo-600 shadow-xl shadow-indigo-200' : 'bg-white border border-slate-200 shadow-sm'}`}>
                  <Upload className={`w-10 h-10 transition-colors ${isDragging ? 'text-white' : 'text-slate-400'}`} />
                </div>
                <div className="text-center">
                  <p className="text-base font-black text-slate-700">{t('superAdmin.bulkImport.dropzone')}</p>
                  <p className="text-sm text-slate-400 font-bold mt-1">{t('superAdmin.bulkImport.dropzoneOr')}</p>
                  <p className="text-[10px] text-slate-400 mt-2">{t('superAdmin.bulkImport.dropzoneAccept')}</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW */}
          {step === "preview" && (
            <div className="space-y-6">
              {/* Summary row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                  <p className="text-2xl font-black text-slate-900">{parsedData.length}</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-1">{t('superAdmin.bulkImport.previewCount')}</p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-4 text-center border border-emerald-100">
                  <p className="text-2xl font-black text-emerald-600">{validCount}</p>
                  <p className="text-[10px] font-bold text-emerald-500 mt-1">{t('superAdmin.bulkImport.validRow')}</p>
                </div>
                <div className={`${invalidCount > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'} rounded-2xl p-4 text-center border`}>
                  <p className={`text-2xl font-black ${invalidCount > 0 ? 'text-red-600' : 'text-slate-300'}`}>{invalidCount}</p>
                  <p className={`text-[10px] font-bold mt-1 ${invalidCount > 0 ? 'text-red-500' : 'text-slate-300'}`}>{t('superAdmin.bulkImport.errorRow')}</p>
                </div>
              </div>

              {/* Data table preview */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-black text-slate-600">{fileName}</span>
                </div>
                <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
                  <table className="w-full text-sm" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 font-black text-slate-500 text-[11px]">#</th>
                        <th className="px-4 py-3 font-black text-slate-500 text-[11px]">{t('superAdmin.bulkImport.colName')}</th>
                        <th className="px-4 py-3 font-black text-slate-500 text-[11px]">{t('superAdmin.bulkImport.colUsername')}</th>
                        <th className="px-4 py-3 font-black text-slate-500 text-[11px]">{t('superAdmin.bulkImport.colGrade')}</th>
                        <th className="px-4 py-3 font-black text-slate-500 text-[11px]">{t('superAdmin.bulkImport.colStatus')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {parsedData.map((row, i) => (
                        <tr key={i} className={row._valid ? 'hover:bg-slate-50' : 'bg-red-50/60'}>
                          <td className="px-4 py-2.5 text-slate-400 font-bold text-xs">{i + 1}</td>
                          <td className="px-4 py-2.5 font-bold text-slate-800">{row.name || <span className="text-red-400 text-xs">—</span>}</td>
                          <td className="px-4 py-2.5 text-slate-600 font-mono text-xs">{row.username || <span className="text-red-400">—</span>}</td>
                          <td className="px-4 py-2.5 text-slate-500 text-xs">{row.grade || "—"}</td>
                          <td className="px-4 py-2.5">
                            {row._valid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">
                                <CheckCircle2 className="w-3 h-3" /> {t('superAdmin.bulkImport.validRow')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-black" title={row._error}>
                                <AlertCircle className="w-3 h-3" /> {row._error || t('superAdmin.bulkImport.errorRow')}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DONE */}
          {step === "done" && importResult && (
            <div className="text-center space-y-6 py-4">
              <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl
                ${importResult.created > 0 ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200' : 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-200'}`}>
                {importResult.created > 0
                  ? <CheckCircle2 className="w-12 h-12 text-white" />
                  : <AlertCircle className="w-12 h-12 text-white" />
                }
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  {importResult.created > 0
                    ? t('superAdmin.bulkImport.importSuccess').replace('{n}', String(importResult.created))
                    : t('superAdmin.bulkImport.importErrors').replace('{n}', String(importResult.failed))}
                </h3>
                {importResult.failed > 0 && (
                  <p className="text-sm text-slate-500">{t('superAdmin.bulkImport.importErrors').replace('{n}', String(importResult.failed))}</p>
                )}
              </div>

              {/* Error details */}
              {importResult.errors.length > 0 && (
                <div className="border border-red-100 bg-red-50 rounded-2xl p-4 text-right space-y-2 max-h-40 overflow-y-auto">
                  {importResult.errors.map((e, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-red-700">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{e.row?.name || e.row?.username || "Row"}: {e.error}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/40">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-100 transition-all"
          >
            {t('superAdmin.bulkImport.cancel')}
          </button>

          <div className="flex items-center gap-3">
            {step === "preview" && (
              <button
                onClick={() => { setStep("upload"); setParsedData([]); }}
                className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-100 transition-all"
              >
                ← Back
              </button>
            )}

            {step === "preview" && validCount > 0 && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-3 px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black text-sm hover:scale-105 transition-all shadow-xl shadow-indigo-200 disabled:opacity-60 disabled:scale-100"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('superAdmin.bulkImport.importing')}
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    {t('superAdmin.bulkImport.confirmImport')} ({validCount})
                  </>
                )}
              </button>
            )}

            {step === "done" && (
              <button
                onClick={onClose}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black text-sm hover:scale-105 transition-all shadow-xl shadow-indigo-200"
              >
                Done ✓
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(40px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
