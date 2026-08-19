"use client";

import React, { useEffect, useState } from "react";
import { offlineSync, OfflineSyncState } from "@/lib/offlineSync";
import { WifiOff, Wifi, CloudUpload, CheckCircle, Loader2, AlertTriangle } from "lucide-react";

interface OfflineBannerProps {
  language?: string;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ language = "ar" }) => {
  const [state, setState] = useState<OfflineSyncState>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    pendingCount: 0,
    isSyncing: false,
    lastSyncedAt: null,
    lastError: null,
  });

  // Brief "just synced" flash
  const [justSynced, setJustSynced] = useState(false);

  useEffect(() => {
    const unsubscribe = offlineSync.subscribe((newState) => {
      // Detect transition from pending → 0 (all synced)
      setState((prev) => {
        if (prev.pendingCount > 0 && newState.pendingCount === 0 && newState.isOnline) {
          setJustSynced(true);
          setTimeout(() => setJustSynced(false), 4000);
        }
        return newState;
      });
    });
    return unsubscribe;
  }, []);

  // Nothing to show when fully online with no pending saves and no flash
  if (state.isOnline && state.pendingCount === 0 && !state.isSyncing && !justSynced) {
    return null;
  }

  // ── Offline state ────────────────────────────────────────────────────────────
  if (!state.isOnline) {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-3 px-4 py-3 text-sm font-bold shadow-lg"
        style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "#f8fafc" }}
      >
        <WifiOff className="w-4 h-4 text-rose-400 shrink-0" />
        <span>
          {language === "ar"
            ? "لا يوجد اتصال بالإنترنت"
            : "No internet connection"}
        </span>
        {state.pendingCount > 0 && (
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full px-3 py-0.5 text-xs font-black">
            {language === "ar"
              ? `${state.pendingCount} تغيير${state.pendingCount > 1 ? "ات" : ""} بانتظار الرفع`
              : `${state.pendingCount} unsaved change${state.pendingCount > 1 ? "s" : ""}`}
          </span>
        )}
        <span className="text-slate-400 text-xs">
          {language === "ar"
            ? "• سيتم رفع المحتوى تلقائياً عند عودة الاتصال"
            : "• Content will upload automatically when connection returns"}
        </span>
      </div>
    );
  }

  // ── Online but syncing pending saves ─────────────────────────────────────────
  if (state.isOnline && state.isSyncing) {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-3 px-4 py-3 text-sm font-bold shadow-lg"
        style={{ background: "linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)", color: "#f8fafc" }}
      >
        <Loader2 className="w-4 h-4 text-blue-300 animate-spin shrink-0" />
        <span>
          {language === "ar"
            ? `جاري رفع ${state.pendingCount} تغيير${state.pendingCount > 1 ? "ات" : ""} محفوظة محلياً...`
            : `Uploading ${state.pendingCount} locally saved change${state.pendingCount > 1 ? "s" : ""}...`}
        </span>
        <CloudUpload className="w-4 h-4 text-blue-300" />
      </div>
    );
  }

  // ── Online, pending saves waiting (server down or slow) ───────────────────────
  if (state.isOnline && state.pendingCount > 0) {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-3 px-4 py-3 text-sm font-bold shadow-lg"
        style={{ background: "linear-gradient(135deg, #92400e 0%, #78350f 100%)", color: "#fef9c3" }}
      >
        <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
        <span>
          {language === "ar"
            ? `${state.pendingCount} تغيير${state.pendingCount > 1 ? "ات" : ""} محفوظة محلياً – سيتم رفعها تلقائياً`
            : `${state.pendingCount} change${state.pendingCount > 1 ? "s" : ""} saved locally – will upload automatically`}
        </span>
        <button
          onClick={() => offlineSync.flush()}
          className="bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-200 px-3 py-1 rounded-full text-xs cursor-pointer transition-all"
        >
          {language === "ar" ? "رفع الآن" : "Upload Now"}
        </button>
      </div>
    );
  }

  // ── Just synced flash ─────────────────────────────────────────────────────────
  if (justSynced) {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-3 px-4 py-3 text-sm font-bold shadow-lg transition-all"
        style={{ background: "linear-gradient(135deg, #065f46 0%, #064e3b 100%)", color: "#d1fae5" }}
      >
        <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
        <span>
          {language === "ar"
            ? "تم رفع جميع التغييرات بنجاح ✅"
            : "All changes uploaded successfully ✅"}
        </span>
        <Wifi className="w-4 h-4 text-emerald-300" />
      </div>
    );
  }

  return null;
};

export default OfflineBanner;
