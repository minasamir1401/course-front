"use client";

import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Database, Plus, Trash2, Download, Upload, RefreshCw, 
  Calendar, HardDrive, ShieldAlert, CheckCircle, AlertTriangle, 
  FileJson, Loader2, ArrowLeft, ShieldCheck, HelpCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { API_URL } from "@/lib/api";

interface BackupFile {
  name: string;
  size: number;
  createdAt: string;
  version?: string;
}

export default function BackupsPage() {
  const router = useRouter();
  const { showToast } = useNotification();
  const { t, language } = useLanguage();
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Restore confirmation states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDoubleConfirmModal, setShowDoubleConfirmModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupFile | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("super_admin_token") || localStorage.getItem("token");
    if (!token) {
      router.push("/super-admin/login");
      return;
    }
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("super_admin_token") || localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/backup/list`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        // The API returns { backups: [...] } or an array
        const list = Array.isArray(data) ? data : (data.backups || []);
        setBackups(list);
      } else {
        showToast(language === 'ar' ? "فشل في تحميل قائمة النسخ الاحتياطية" : "Failed to load backups list", "error");
      }
    } catch (e) {
      console.error(e);
      showToast(language === 'ar' ? "حدث خطأ في الاتصال بالخادم" : "Server communication error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const token = localStorage.getItem("super_admin_token") || localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/backup/create`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        showToast(language === 'ar' ? "تم إنشاء النسخة الاحتياطية بنجاح" : "Backup created successfully", "success");
        fetchBackups();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || (language === 'ar' ? "فشل في إنشاء النسخة الاحتياطية" : "Failed to create backup"), "error");
      }
    } catch (e) {
      console.error(e);
      showToast(language === 'ar' ? "فشل الاتصال بالخادم" : "Server communication failure", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadBackup = async (filename: string) => {
    try {
      const token = localStorage.getItem("super_admin_token") || localStorage.getItem("token");
      // Open download in a new window/tab, passing the auth token in query param
      window.open(`${API_URL}/admin/backup/download/${filename}?token=${token}`, '_blank');
      showToast(language === 'ar' ? "بدء تحميل ملف النسخة الاحتياطية" : "Starting backup download", "success");
    } catch (e) {
      console.error(e);
      showToast(language === 'ar' ? "فشل تحميل الملف" : "Failed to download file", "error");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      showToast(language === 'ar' ? "يجب اختيار ملف بصيغة JSON فقط" : "Only JSON backup files are allowed", "error");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("super_admin_token") || localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/backup/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        showToast(language === 'ar' ? "تم رفع النسخة الاحتياطية بنجاح" : "Backup uploaded successfully", "success");
        fetchBackups();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || (language === 'ar' ? "فشل رفع النسخة الاحتياطية" : "Failed to upload backup"), "error");
      }
    } catch (e) {
      console.error(e);
      showToast(language === 'ar' ? "فشل الاتصال بالخادم" : "Server communication error", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const startRestoreFlow = (backup: BackupFile) => {
    setSelectedBackup(backup);
    setShowConfirmModal(true);
  };

  const proceedToDoubleConfirm = () => {
    setShowConfirmModal(false);
    setShowDoubleConfirmModal(true);
    setConfirmText("");
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;
    if (confirmText.toLowerCase() !== "restore") {
      showToast(language === 'ar' ? "الرجاء كتابة كلمة RESTORE للتأكيد" : "Please type RESTORE to confirm", "error");
      return;
    }

    setRestoring(true);
    setShowDoubleConfirmModal(false);

    try {
      const token = localStorage.getItem("super_admin_token") || localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/backup/restore`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          filename: selectedBackup.name
        })
      });

      if (res.ok) {
        showToast(
          language === 'ar' 
            ? "تم استعادة قاعدة البيانات بالكامل بنجاح! جاري تحديث الصفحة..." 
            : "Database fully restored successfully! Reloading page...", 
          "success"
        );
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || (language === 'ar' ? "فشل استعادة البيانات" : "Failed to restore database"), "error");
      }
    } catch (e) {
      console.error(e);
      showToast(language === 'ar' ? "فشل الاتصال بالخادم" : "Server communication failure", "error");
    } finally {
      setRestoring(false);
      setSelectedBackup(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 space-y-10" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-8 md:p-12 rounded-[40px] shadow-2xl relative overflow-hidden border border-slate-700/50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.15),transparent)] pointer-events-none"></div>
          <div className="space-y-3 z-10">
            <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-4">
              <Database className="w-10 h-10 text-indigo-400 animate-pulse" />
              <span>{language === 'ar' ? "النسخ الاحتياطي والاستعادة" : "System Backup & Restore"}</span>
            </h1>
            <p className="text-slate-300 font-bold max-w-xl text-sm leading-relaxed">
              {language === 'ar' 
                ? "قم بإدارة وحماية بيانات النظام بالكامل. يمكنك إنشاء نسخ احتياطية شاملة لقاعدة البيانات، تحميلها، أو استعادتها بأمان تام مع تأكيد ثنائي لحمايتها."
                : "Manage and safeguard complete system data. Create comprehensive database checkpoints, download files, or securely restore records with multi-factor confirmation modals."}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 z-10 shrink-0">
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".json" 
              onChange={handleFileUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || creating || restoring}
              className="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white font-bold px-6 py-4 rounded-2xl flex items-center gap-3 transition-all cursor-pointer backdrop-blur-md shadow-md text-sm active:scale-95 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin text-slate-300" /> : <Upload className="w-5 h-5 text-indigo-400" />}
              <span>{language === 'ar' ? "رفع نسخة احتياطية" : "Upload JSON Backup"}</span>
            </button>
            <button 
              onClick={handleCreateBackup}
              disabled={creating || uploading || restoring}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-4 rounded-2xl flex items-center gap-3 transition-all cursor-pointer shadow-lg shadow-indigo-500/20 text-sm active:scale-95 disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              <span>{language === 'ar' ? "إنشاء نسخة جديدة" : "Create New Backup"}</span>
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Backups List Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <HardDrive className="w-6 h-6 text-indigo-600" />
                <span>{language === 'ar' ? "ملفات النسخ المتوفرة" : "Available System Backups"} ({backups.length})</span>
              </h3>
              <button 
                onClick={fetchBackups} 
                className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer border border-slate-100 bg-white"
                title={language === 'ar' ? "تحديث القائمة" : "Refresh List"}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="bg-white rounded-[35px] border border-slate-100 p-24 flex flex-col justify-center items-center gap-4 shadow-sm">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <span className="text-slate-400 font-bold">{language === 'ar' ? "جاري تحميل قائمة النسخ..." : "Fetching backups list..."}</span>
              </div>
            ) : backups.length === 0 ? (
              <div className="bg-white rounded-[35px] border-4 border-dashed border-slate-100 p-24 flex flex-col justify-center items-center text-center gap-6 shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-[25px] flex items-center justify-center text-slate-200">
                  <Database className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-800 mb-2">{language === 'ar' ? "لا يوجد أي نسخ احتياطية بعد" : "No backups found"}</h4>
                  <p className="text-slate-400 text-sm font-bold max-w-sm">
                    {language === 'ar' 
                      ? "ابدأ بإنشاء أول نسخة احتياطية لحماية بيانات النظام بالكامل والرجوع إليها عند الحاجة."
                      : "Create your first system checkpoint to safeguard application data and enable secure rollback capability."}
                  </p>
                </div>
                <button 
                  onClick={handleCreateBackup}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-3.5 rounded-2xl flex items-center gap-2.5 transition-all cursor-pointer shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  <span>{language === 'ar' ? "إنشاء أول نسخة الآن" : "Create Checkpoint"}</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {backups.map((backup) => (
                  <div 
                    key={backup.name} 
                    className="bg-white hover:bg-slate-50/50 border border-slate-100 rounded-[28px] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center gap-5 w-full sm:w-auto">
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[20px] flex items-center justify-center shrink-0">
                        <FileJson className="w-7 h-7" />
                      </div>
                      <div className="space-y-1.5 min-w-0">
                        <h4 className="text-lg font-black text-slate-800 truncate" title={backup.name}>{backup.name}</h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 font-bold text-xs">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(backup.createdAt)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <HardDrive className="w-3.5 h-3.5" />
                            {formatSize(backup.size)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-4 sm:pt-0">
                      <button
                        onClick={() => handleDownloadBackup(backup.name)}
                        className="bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 p-3.5 rounded-xl transition-all cursor-pointer border border-transparent"
                        title={language === 'ar' ? "تحميل ملف النسخة" : "Download File"}
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => startRestoreFlow(backup)}
                        disabled={restoring}
                        className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 font-black px-5 py-3 rounded-xl transition-all cursor-pointer border border-indigo-100 text-sm active:scale-95 disabled:opacity-50"
                      >
                        {language === 'ar' ? "استعادة البيانات" : "Restore Database"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security Advisory Panel */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-800 px-2">{language === 'ar' ? "إرشادات الأمان" : "Security & Safety Guide"}</h3>
            <div className="bg-gradient-to-b from-amber-50 to-orange-50 border border-amber-200 rounded-[35px] p-8 space-y-6 shadow-sm">
              <div className="flex items-center gap-4 text-amber-700">
                <ShieldAlert className="w-8 h-8 shrink-0" />
                <h4 className="text-lg font-black">{language === 'ar' ? "تنبيه أمان هام" : "Critical Safety Alert"}</h4>
              </div>
              <ul className="space-y-4 text-slate-600 text-sm font-semibold leading-relaxed list-disc list-inside">
                <li>
                  {language === 'ar' 
                    ? "تؤثر عملية استعادة البيانات بالكامل على جميع المعايير، المدارس، الحسابات، الطلاب، ومحتويات الاختبارات." 
                    : "Database restoration replaces the current state completely, impacting all schools, accounts, and courses."}
                </li>
                <li>
                  {language === 'ar' 
                    ? "يتم تدوين وحفظ النسخ الاحتياطية المرفوعة يدوياً بصيغة JSON آمنة ومستقلة." 
                    : "Manually uploaded JSON backup checkpoints are parsed and validated strictly before execution."}
                </li>
                <li>
                  {language === 'ar' 
                    ? "ننصح بإنشاء نسخة احتياطية جديدة للنظام بالكامل قبل محاولة استعادة أي نسخة قديمة لتفادي الفقد العشوائي للبيانات الحالية."
                    : "We highly recommend capturing a fresh checkpoint before applying any restore operation to avoid accidental data loss."}
                </li>
              </ul>
              <div className="pt-4 border-t border-amber-200/50 flex items-center gap-3 text-amber-800 text-xs font-black">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span>{language === 'ar' ? "محمي بنظام تأكيد الهوية المزدوج" : "Multi-factor modal security active"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 1. First Confirmation Modal */}
        {showConfirmModal && selectedBackup && (
          <div className="fixed inset-0 bg-[#0f0f1d]/70 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
            <div className="bg-white rounded-[35px] border border-slate-100 w-full max-w-xl p-8 md:p-10 shadow-2xl relative space-y-8 animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-4 text-rose-600 bg-rose-50 p-6 rounded-[25px] border border-rose-100">
                <AlertTriangle className="w-10 h-10 shrink-0" />
                <div>
                  <h4 className="text-xl font-black">{language === 'ar' ? "تأكيد استعادة البيانات" : "Restore Database Checkpoint?"}</h4>
                  <p className="text-rose-700/60 font-semibold text-xs mt-1">{language === 'ar' ? "تحذير: هذا الإجراء سيقوم باستبدال قاعدة البيانات الحالية" : "Warning: This action will overwrite active data"}</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-slate-600 font-bold text-sm leading-relaxed">
                  {language === 'ar' 
                    ? `هل أنت متأكد من رغبتك في استعادة قاعدة البيانات بالكامل باستخدام ملف النسخة الاحتياطية:` 
                    : `Are you absolutely sure you want to restore the entire system state using this checkpoint:`}
                </p>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl font-mono text-xs font-bold text-slate-700 break-all select-all">
                  {selectedBackup.name}
                </div>
                <p className="text-slate-400 font-medium text-xs leading-relaxed">
                  {language === 'ar'
                    ? "سيتوقف النظام لبضع ثوانٍ لإعادة تطبيق وتحديث الجداول وحقول البيانات وإعادة تشغيل العلاقات."
                    : "The system tables, fields, and indices will be completely re-synced under the hood."}
                </p>
              </div>
              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-4 rounded-2xl transition-all cursor-pointer text-sm border border-slate-200/50"
                >
                  {language === 'ar' ? "إلغاء الأمر" : "Cancel"}
                </button>
                <button
                  onClick={proceedToDoubleConfirm}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all cursor-pointer text-sm shadow-lg shadow-indigo-100"
                >
                  {language === 'ar' ? "متابعة الاستعادة" : "Proceed"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Double Confirmation Modal */}
        {showDoubleConfirmModal && selectedBackup && (
          <div className="fixed inset-0 bg-[#0f0f1d]/85 backdrop-blur-lg flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
            <div className="bg-white rounded-[35px] border border-rose-200 w-full max-w-xl p-8 md:p-10 shadow-2xl relative space-y-8 animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-4 text-rose-600 bg-rose-50 p-6 rounded-[25px] border border-rose-100">
                <ShieldAlert className="w-12 h-12 shrink-0 animate-bounce" />
                <div>
                  <h4 className="text-xl font-black">{language === 'ar' ? "حماية أمان مشددة" : "High Security Confirmation Required"}</h4>
                  <p className="text-rose-700/60 font-semibold text-xs mt-1">{language === 'ar' ? "يرجى تأكيد رغبتك النهائية للتطبيق" : "Confirm database wipe & rollback"}</p>
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-slate-600 font-bold text-sm leading-relaxed">
                  {language === 'ar' 
                    ? `لتأكيد هذه العملية الخطيرة، يرجى كتابة الكلمة "restore" باللغة الإنجليزية في المربع أدناه:` 
                    : `To confirm this destructive action, please type the word "restore" in the box below:`}
                </label>
                <input 
                  type="text" 
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="restore"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-mono text-center text-lg outline-none focus:border-rose-500 focus:bg-white text-slate-800"
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setShowDoubleConfirmModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-4 rounded-2xl transition-all cursor-pointer text-sm border border-slate-200/50"
                >
                  {language === 'ar' ? "إلغاء التراجع" : "Cancel Restore"}
                </button>
                <button
                  onClick={handleRestoreBackup}
                  disabled={confirmText.toLowerCase() !== "restore" || restoring}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-black py-4 rounded-2xl transition-all cursor-pointer text-sm shadow-lg shadow-rose-100"
                >
                  {restoring ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (language === 'ar' ? "تأكيد واستعادة الآن" : "Yes, Restore Now")}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
