"use client";

import React, { useEffect, useState } from "react";
import { offlineSync, OfflineSyncState } from "@/lib/offlineSync";
import { WifiOff, Loader2, AlertTriangle } from "lucide-react";

interface OfflineBannerProps { language?: string }

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ language = "ar" }) => {
  const [state, setState] = useState<OfflineSyncState>(() => offlineSync.getState());
  const [exportError, setExportError] = useState(false);
  useEffect(() => offlineSync.subscribe(setState), []);
  const arabic = language === "ar";
  const exportPending = () => {
    try {
      const data = offlineSync.getPending().map(({ headers: _headers, ...entry }) => entry);
      const url = URL.createObjectURL(new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), changes: data }, null, 2)], { type: "application/json" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `pending-changes-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportError(false);
    } catch { setExportError(true); }
  };

  if (state.isOnline && state.pendingCount === 0 && !state.isSyncing && !state.lastError && !exportError) return null;
  return (
    <div role="status" className="fixed top-0 left-0 right-0 z-[9999] flex flex-wrap items-center justify-center gap-3 px-4 py-3 text-sm font-bold shadow-lg bg-slate-900 text-slate-100" dir={arabic ? "rtl" : "ltr"}>
      {!state.isOnline ? <WifiOff className="w-4 h-4 text-rose-400 shrink-0" /> : state.isSyncing ? <Loader2 className="w-4 h-4 animate-spin text-blue-300" /> : <AlertTriangle className="w-4 h-4 text-amber-300" />}
      <span>{!state.isOnline ? (arabic ? "لا يوجد اتصال بالإنترنت" : "No internet connection") : state.isSyncing ? (arabic ? "جارٍ التحقق من التغييرات ومزامنتها" : "Checking and syncing pending changes") : (arabic ? "تغييرات معلقة تحتاج متابعة" : "Pending changes need attention")}</span>
      {state.pendingCount > 0 && <span>{arabic ? `${state.pendingCount} تغيير معلق؛ قد تحتاج بعض التغييرات إلى مراجعة` : `${state.pendingCount} pending changes; some may require review`}</span>}
      {state.lastError && <span className="text-amber-200">{state.lastError}</span>}
      {exportError && <span role="alert">{arabic ? "تعذر تنزيل النسخة. لا تغلق الصفحة." : "Download failed. Keep this page open."}</span>}
      {state.pendingCount > 0 && <button type="button" onClick={exportPending} className="rounded-full border border-amber-400 px-3 py-1 text-xs text-amber-200">{arabic ? "تنزيل نسخة من التغييرات" : "Download pending changes"}</button>}
      {state.isOnline && state.pendingCount > 0 && <button type="button" disabled={state.isSyncing} onClick={() => void offlineSync.flush()} className="rounded-full border border-slate-400 px-3 py-1 text-xs disabled:opacity-50">{arabic ? "إعادة محاولة التغييرات المؤهلة" : "Retry eligible changes"}</button>}
    </div>
  );
};
export default OfflineBanner;
