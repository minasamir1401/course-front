"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { API_URL } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { Activity, AlertTriangle, Bell, BookOpen, Building2, ChevronRight, Code2, Database, Layers, ShieldAlert, Server, Table2, Users, ClipboardList, FileText, Bug, RefreshCw, Search, CheckCircle2, RotateCcw } from 'lucide-react';

type DiagnosticsPayload = {
  ok?: boolean;
  server?: {
    uptime?: number;
    timestamp?: string;
    nodeEnv?: string;
    memory?: Record<string, number>;
  };
  counts?: Record<string, number>;
  samples?: Record<string, any[]>;
  logs?: Array<{ id: number; level: string; message: string; timestamp: string }>;
  errors?: Array<{ id: number; level: string; message: string; timestamp: string }>;
  error?: string;
  details?: string;
};

const FE_STORAGE_KEY = "admin_frontend_errors";

const formatBytes = (value?: number) => {
  if (!value) return "0 MB";
  const mb = value / 1024 / 1024;
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
};

const formatDate = (value?: string | Date) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('ar-EG', { timeZone: 'Africa/Cairo', dateStyle: 'short', timeStyle: 'medium' });
};

const readFrontendErrors = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function SuperAdminMonitorPage() {
  const { language } = useLanguage();
  const [data, setData] = useState<DiagnosticsPayload | null>(null);
  const [frontendErrors, setFrontendErrors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSample, setActiveSample] = useState("lessons");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState("");
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [daysFilter, setDaysFilter] = useState<number | null>(null);
  const [frontendDaysFilter, setFrontendDaysFilter] = useState<number | null>(null);
  const [showBackendErrorsOnly, setShowBackendErrorsOnly] = useState(false);
  const [showFrontendErrorsOnly, setShowFrontendErrorsOnly] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery || searchQuery.length < 2) return;
    setIsSearching(true);
    setRestoreMessage("");
    try {
      const authToken = localStorage.getItem("super_admin_token");
      const res = await fetch(`${API_URL}/admin/backup/search-lesson?query=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Search failed");
      setSearchResults(json.results || []);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRestore = async (filename: string, lessonId: string) => {
    if (!confirm(language === 'ar' ? "هل أنت متأكد من استعادة هذا الدرس؟ سيتم استبدال النسخة الحالية إن وجدت." : "Are you sure you want to restore this lesson?")) return;
    setIsRestoring(true);
    setRestoreMessage("");
    try {
      const authToken = localStorage.getItem("super_admin_token");
      const res = await fetch(`${API_URL}/admin/backup/restore-lesson`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}` 
        },
        body: JSON.stringify({ filename, lessonId })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Restore failed");
      setRestoreMessage(language === 'ar' ? "تمت الاستعادة بنجاح!" : "Restored successfully!");
      loadData(false); // refresh data
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  const loadData = async (silent = false) => {
    if (typeof window === "undefined") return;
    const authToken = localStorage.getItem("super_admin_token");
    if (!authToken) {
      setError(language === 'ar' ? "يلزم تسجيل دخول الأدمن" : "Super admin login required");
      if (!silent) setIsLoading(false);
      return;
    }

    if (!silent) setIsLoading(true);
    if (!silent) setError("");
    try {
      // increase limit to get more logs to filter by days
      const res = await fetch(`${API_URL}/admin/diagnostics?limit=50`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.details || json.error || "Failed to load diagnostics");
      setData(json);
      setFrontendErrors(readFrontendErrors());
    } catch (err: any) {
      if (!silent) setError(err.message || "Failed to load monitor data");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const feInterval = window.setInterval(() => {
      setFrontendErrors(readFrontendErrors());
    }, 2000);
    return () => window.clearInterval(feInterval);
  }, []);

  useEffect(() => {
    if (!isAutoRefresh) return;
    const refreshInterval = window.setInterval(() => {
      loadData(true);
    }, 10000);
    return () => window.clearInterval(refreshInterval);
  }, [isAutoRefresh]);

  const counts = data?.counts || {};
  const samples = data?.samples || {};
  const sampleEntries = Object.keys(samples);

  const currentSampleRows = samples[activeSample] || [];

  const cards = [
    { label: language === 'ar' ? "المدارس" : "Schools", value: counts.schools ?? 0, icon: Building2, color: "indigo" },
    { label: language === 'ar' ? "المستخدمون" : "Users", value: counts.users ?? 0, icon: Users, color: "blue" },
    { label: language === 'ar' ? "الدروس" : "Lessons", value: counts.lessons ?? 0, icon: BookOpen, color: "emerald" },
    { label: language === 'ar' ? "الاختبارات" : "Exams", value: counts.exams ?? 0, icon: ClipboardList, color: "amber" },
    { label: language === 'ar' ? "الشرائح" : "Blocks", value: counts.lessonBlocks ?? 0, icon: Layers, color: "violet" },
    { label: language === 'ar' ? "الأخطاء" : "Errors", value: data?.errors?.length ?? 0, icon: AlertTriangle, color: "rose" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="relative overflow-hidden rounded-[32px] bg-white border border-slate-100 shadow-sm p-6 sm:p-8">
          <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black">
                <Server className="w-4 h-4" />
                {language === 'ar' ? "مركز المراقبة" : "Monitor Center"}
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
                {language === 'ar' ? "مراقبة النظام والبيانات" : "System & Database Monitor"}
              </h1>
              <p className="text-slate-500 font-medium max-w-2xl leading-relaxed">
                {language === 'ar'
                  ? "هنا تشوف ملخص الداتا بيز، عينات السجلات الأخيرة، لوجات الباكند، وأخطاء الفرونت التي تم التقاطها من المتصفح."
                  : "View database summaries, recent records, backend logs, and frontend errors captured from the browser."}
              </p>
            </div>

            <div className="flex gap-3 flex-wrap items-center">
              <label className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 cursor-pointer shadow-sm hover:bg-slate-50 transition-all">
                <input 
                  type="checkbox" 
                  checked={isAutoRefresh} 
                  onChange={(e) => setIsAutoRefresh(e.target.checked)} 
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" 
                />
                <span className="text-sm font-bold text-slate-700">{language === 'ar' ? "تحديث تلقائي" : "Auto Refresh"}</span>
              </label>
              <button
                onClick={() => loadData()}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white font-black hover:scale-[1.02] transition-all shadow-md"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {language === 'ar' ? "تحديث" : "Refresh"}
              </button>
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-50 text-emerald-700 font-black">
                <Activity className="w-4 h-4" />
                {data?.server?.nodeEnv || "development"}
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-indigo-50 to-transparent pointer-events-none" />
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-[24px] p-5 font-bold flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-white border border-slate-100 rounded-[28px] p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{card.label}</p>
                    <div className="text-3xl font-black text-slate-900">{isLoading && !data ? "..." : card.value}</div>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${toneClasses[card.color].bg} ${toneClasses[card.color].text}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <SectionCard title={language === 'ar' ? "معلومات الخادم" : "Server Info"} icon={Server}>
            <DetailRow label={language === 'ar' ? "الوقت" : "Timestamp"} value={formatDate(data?.server?.timestamp)} />
            <DetailRow label="Uptime" value={`${Math.floor((data?.server?.uptime || 0) / 60)} min`} />
            <DetailRow label="Memory RSS" value={formatBytes(data?.server?.memory?.rss)} />
            <DetailRow label="Heap Used" value={formatBytes(data?.server?.memory?.heapUsed)} />
            <DetailRow label="Heap Total" value={formatBytes(data?.server?.memory?.heapTotal)} />
          </SectionCard>

          <SectionCard title={language === 'ar' ? "ملخص قاعدة البيانات" : "Database Summary"} icon={Database}>
            {Object.entries(counts).map(([key, value]) => (
              <DetailRow key={key} label={key} value={String(value)} />
            ))}
          </SectionCard>

          <SectionCard title={language === 'ar' ? "المسارات السريعة" : "Quick Links"} icon={Bell}>
            <a href="/super-admin/backups" className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 font-bold hover:bg-slate-100 transition-all">
              <span>{language === 'ar' ? "النسخ الاحتياطية" : "Backups"}</span>
              <ChevronRight className="w-4 h-4" />
            </a>
            <a href="/super-admin/schools" className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 font-bold hover:bg-slate-100 transition-all">
              <span>{language === 'ar' ? "المدارس" : "Schools"}</span>
              <ChevronRight className="w-4 h-4" />
            </a>
            <a href="/super-admin/users" className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 font-bold hover:bg-slate-100 transition-all">
              <span>{language === 'ar' ? "المستخدمون" : "Users"}</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <SectionCard title={language === 'ar' ? "أداة استعادة الدروس المفقودة" : "Lesson Recovery Tool"} icon={Search}>
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={language === 'ar' ? "اكتب اسم الدرس للبحث في النسخ الاحتياطية..." : "Type lesson name to search in backups..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching || searchQuery.length < 2}
                  className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSearching ? "..." : (language === 'ar' ? "بحث" : "Search")}
                </button>
              </div>

              {restoreMessage && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {restoreMessage}
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="flex flex-col gap-2 max-h-[300px] overflow-auto pr-2">
                  {searchResults.map((res, i) => (
                    <div key={i} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                      <div className="flex-1 overflow-hidden">
                        <div className="truncate font-bold text-slate-900">{res.lessonTitle}</div>
                        <div className="truncate text-xs text-slate-500">{res.courseTitle}</div>
                        <div className="mt-1 text-[10px] font-bold tracking-wider text-indigo-500 uppercase">
                          {formatDate(res.backupDate)} - {res.backupFilename}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRestore(res.backupFilename, res.lessonId)}
                        disabled={isRestoring}
                        className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-xs font-black text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {language === 'ar' ? "استعادة" : "Restore"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {searchResults.length === 0 && searchQuery && !isSearching && (
                 <div className="text-center text-sm font-medium text-slate-400 py-4">
                   {language === 'ar' ? "لم يتم العثور على أي دروس بهذا الاسم في آخر 10 نسخ احتياطية." : "No lessons found with this name in the last 10 backups."}
                 </div>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SectionCard 
            title={language === 'ar' ? "لوجات الباكند" : "Backend Logs"} 
            icon={Code2}
            action={
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={showBackendErrorsOnly} onChange={(e) => setShowBackendErrorsOnly(e.target.checked)} className="w-3 h-3 rounded text-rose-600 focus:ring-rose-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{language === 'ar' ? "أخطاء فقط" : "Errors"}</span>
                </label>
                <select 
                  className="text-[11px] font-bold bg-slate-50 border-slate-200 rounded-lg px-2 py-1 text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={daysFilter || ""}
                  onChange={(e) => setDaysFilter(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">{language === 'ar' ? "كل الأيام" : "All Time"}</option>
                  <option value="1">{language === 'ar' ? "آخر 24 ساعة" : "24h"}</option>
                  <option value="3">{language === 'ar' ? "آخر 3 أيام" : "3 Days"}</option>
                  <option value="7">{language === 'ar' ? "آخر 7 أيام" : "7 Days"}</option>
                </select>
              </div>
            }
          >
            <LogList entries={(data?.logs || []).filter(log => {
              if (showBackendErrorsOnly && log.level !== 'error') return false;
              if (daysFilter === null) return true;
              const logDate = new Date(log.timestamp);
              const cutoff = new Date();
              cutoff.setDate(cutoff.getDate() - daysFilter);
              return logDate >= cutoff;
            })} />
          </SectionCard>

          <SectionCard 
            title={language === 'ar' ? "أخطاء الفرونت" : "Frontend Errors"} 
            icon={Bug}
            action={
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={showFrontendErrorsOnly} onChange={(e) => setShowFrontendErrorsOnly(e.target.checked)} className="w-3 h-3 rounded text-rose-600 focus:ring-rose-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{language === 'ar' ? "أخطاء فقط" : "Errors"}</span>
                </label>
                <select 
                  className="text-[11px] font-bold bg-slate-50 border-slate-200 rounded-lg px-2 py-1 text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={frontendDaysFilter || ""}
                  onChange={(e) => setFrontendDaysFilter(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">{language === 'ar' ? "كل الأيام" : "All Time"}</option>
                  <option value="1">{language === 'ar' ? "آخر 24 ساعة" : "24h"}</option>
                  <option value="3">{language === 'ar' ? "آخر 3 أيام" : "3 Days"}</option>
                  <option value="7">{language === 'ar' ? "آخر 7 أيام" : "7 Days"}</option>
                </select>
              </div>
            }
          >
            <LogList entries={frontendErrors.filter(log => {
              if (showFrontendErrorsOnly) {
                const msg = String(log.message || log).toLowerCase();
                const isError = log.level === 'error' || msg.includes('error') || msg.includes('failed') || msg.includes('typeerror');
                if (!isError) return false;
              }
              if (frontendDaysFilter === null) return true;
              const logDate = new Date(log.timestamp);
              const cutoff = new Date();
              cutoff.setDate(cutoff.getDate() - frontendDaysFilter);
              return logDate >= cutoff;
            })} emptyText={language === 'ar' ? "لا توجد أخطاء مسجلة محليًا" : "No local frontend errors captured"} />
          </SectionCard>
        </div>

        <SectionCard
          title={language === 'ar' ? "العينات الأخيرة من الجداول" : "Recent Table Samples"}
          icon={Table2}
        >
          <div className="flex flex-wrap gap-2 mb-5">
            {sampleEntries.map((key) => (
              <button
                key={key}
                onClick={() => setActiveSample(key)}
                className={`px-4 py-2 rounded-full text-sm font-black transition-all ${activeSample === key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                {key}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-[24px] border border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-[0.2em]">
                <tr>
                  <th className="px-4 py-3 text-start">{language === 'ar' ? "السجل" : "Record"}</th>
                  <th className="px-4 py-3 text-start">{language === 'ar' ? "البيانات" : "Data"}</th>
                </tr>
              </thead>
              <tbody>
                {(currentSampleRows || []).map((row, index) => (
                  <tr key={index} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-3 font-black text-slate-900 w-1/4">
                      {row.title || row.name || row.username || row.filename || row.id || index}
                      <div className="text-xs font-medium text-slate-400 mt-1">{row.updatedAt || row.createdAt || row.timestamp ? formatDate(row.updatedAt || row.createdAt || row.timestamp) : ""}</div>
                    </td>
                    <td className="px-4 py-3">
                      <pre className="whitespace-pre-wrap break-words text-[11px] leading-6 text-slate-600 bg-slate-50 rounded-2xl p-4">{JSON.stringify(row, null, 2)}</pre>
                    </td>
                  </tr>
                ))}
                {!currentSampleRows.length && (
                  <tr>
                    <td colSpan={2} className="px-4 py-10 text-center text-slate-400 font-bold">
                      {isLoading ? "..." : (language === 'ar' ? "لا توجد بيانات" : "No data available")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title={language === 'ar' ? "النسخ الاحتياطية" : "Backups"} icon={FileText}>
          <div className="overflow-x-auto rounded-[24px] border border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-[0.2em]">
                <tr>
                  <th className="px-4 py-3 text-start">{language === 'ar' ? "الاسم" : "Name"}</th>
                  <th className="px-4 py-3 text-start">{language === 'ar' ? "الحجم" : "Size"}</th>
                  <th className="px-4 py-3 text-start">{language === 'ar' ? "التاريخ" : "Created"}</th>
                </tr>
              </thead>
              <tbody>
                {(samples.backupFiles || []).map((file: any) => (
                  <tr key={file.filename} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-bold text-slate-900">{file.filename}</td>
                    <td className="px-4 py-3 text-slate-500">{file.size}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(file.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}

const toneClasses: Record<string, { bg: string; text: string }> = {
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  violet: { bg: "bg-violet-50", text: "text-violet-600" },
  rose: { bg: "bg-rose-50", text: "text-rose-600" },
};

function SectionCard({ title, icon: Icon, children, action }: { title: string; icon: any; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-100 rounded-[30px] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-black text-slate-900">{title}</h2>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
      <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</span>
      <span className="text-sm font-bold text-slate-900 text-end break-all">{value ?? "-"}</span>
    </div>
  );
}

function LogList({ entries, emptyText }: { entries: any[]; emptyText?: string }) {
  if (!entries?.length) {
    return <div className="text-sm font-bold text-slate-400 rounded-2xl bg-slate-50 px-4 py-5">{emptyText || "No data yet"}</div>;
  }

  return (
    <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
      {entries.map((entry, index) => (
        <div key={entry.id ?? index} className="rounded-2xl border border-slate-100 p-4 bg-slate-50/70">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-full ${entry.level === 'error' ? 'bg-rose-100 text-rose-600' : entry.level === 'warn' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {entry.level || "info"}
            </span>
            <span className="text-[11px] font-bold text-slate-400">{formatDate(entry.timestamp)}</span>
          </div>
          <div className="text-sm font-medium text-slate-700 whitespace-pre-wrap break-words">{entry.message || JSON.stringify(entry)}</div>
        </div>
      ))}
    </div>
  );
}
