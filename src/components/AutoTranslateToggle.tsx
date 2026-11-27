"use client";

import React, { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import {
  AUTO_TRANSLATE_EVENT,
  AUTO_TRANSLATE_STORAGE_KEY,
  getAutoTranslateEnabled,
  setAutoTranslateEnabled,
} from "@/lib/autoTranslatePreference";

export function useAutoTranslatePreference(): [boolean, (next: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean>(() => getAutoTranslateEnabled());

  useEffect(() => {
    setEnabled(getAutoTranslateEnabled());

    const handleCustom = (event: Event) => {
      const detail = (event as CustomEvent<boolean>).detail;
      setEnabled(typeof detail === "boolean" ? detail : getAutoTranslateEnabled());
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === AUTO_TRANSLATE_STORAGE_KEY) {
        setEnabled(getAutoTranslateEnabled());
      }
    };

    window.addEventListener(AUTO_TRANSLATE_EVENT, handleCustom);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(AUTO_TRANSLATE_EVENT, handleCustom);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const update = (next: boolean) => {
    setAutoTranslateEnabled(next);
    setEnabled(Boolean(next));
  };

  return [enabled, update];
}

interface AutoTranslateToggleProps {
  language: string;
  className?: string;
  compact?: boolean;
}

export const AutoTranslateToggle: React.FC<AutoTranslateToggleProps> = ({
  language,
  className = "",
  compact = false,
}) => {
  const [enabled, setEnabled] = useAutoTranslatePreference();
  const isAr = language === "ar";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => setEnabled(!enabled)}
      title={
        isAr
          ? "ترجمة المحتوى الإنجليزي تلقائياً للعربية عند إضافة أو تعديل أو حفظ الشرائح والأسئلة"
          : "Automatically translate English content to Arabic when adding, editing, or saving slides and questions"
      }
      className={`inline-flex items-center gap-2 rounded-xl border font-black transition-all cursor-pointer select-none shadow-xs ${
        compact ? "px-3 py-1.5 text-[11px]" : "px-3.5 py-2 text-xs"
      } ${
        enabled
          ? "bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100"
          : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200/70"
      } ${className}`}
    >
      <Languages className={`w-3.5 h-3.5 shrink-0 ${enabled ? "text-indigo-600" : "text-slate-400"}`} />
      <span className="whitespace-nowrap">
        {isAr ? "الترجمة التلقائية للعربية" : "Auto-Translate"}
      </span>
      <span
        className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-colors ${
          enabled
            ? "bg-indigo-600 text-white"
            : "bg-slate-300 text-slate-700"
        }`}
      >
        {isAr ? (enabled ? "مفعّل" : "متوقف") : enabled ? "ON" : "OFF"}
      </span>
    </button>
  );
};

export default AutoTranslateToggle;
