"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, Sparkles, Info, X } from 'lucide-react';
import GeoGebraWidget from "../../GeoGebraWidget";
import MathInput from "../../MathInput";
import { getOptionLetter } from "@/lib/utils";
import { parseJson } from "../utils";

export default function GeoGebraEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { materialId: "", width: 800, height: 500, iframeUrl: "" });
  const correctVal = question.correctAnswer || "";
  const [inputValue, setInputValue] = useState(opts.iframeUrl || (opts.materialId ? `https://www.geogebra.org/material/iframe/id/${opts.materialId}` : ""));

  const extractId = (urlOrId: string) => {
    if (!urlOrId) return "";
    const cleanUrl = urlOrId.trim();
    const urlWithoutQuery = cleanUrl.split('?')[0].split('#')[0];
    const ggbmMatch = cleanUrl.match(/ggbm\.at\/([a-zA-Z0-9]+)/i);
    if (ggbmMatch) return ggbmMatch[1];
    
    const pathMatch = urlWithoutQuery.match(/geogebra\.org\/(.+)/i);
    if (pathMatch) {
      const keywords = ["classic", "calculator", "geometry", "3d", "notes", "applet", "evaluator", "material", "show", "edit", "m", "iframe", "id", "width", "height", "border", "sfsb", "smb", "stb", "stbh", "ai", "asb", "sri", "rc", "ld", "sdz", "ctl"];
      const segments = pathMatch[1].split('/').filter(Boolean);
      for (let i = segments.length - 1; i >= 0; i--) {
        const seg = segments[i];
        if (keywords.includes(seg.toLowerCase())) continue;
        if (/^\d+$/.test(seg)) continue;
        if (['true', 'false'].includes(seg.toLowerCase())) continue;
        if (/^[a-zA-Z0-9]+$/.test(seg) && seg.length >= 3) return seg;
      }
    }
    
    if (/^[a-zA-Z0-9]+$/.test(cleanUrl) && cleanUrl.length >= 3) {
      return cleanUrl;
    }
    return "";
  };

  const getCleanGeoGebraUrl = (urlOrId: string) => {
    if (!urlOrId) return "";
    const id = extractId(urlOrId);
    if (id) {
      return `https://www.geogebra.org/material/iframe/id/${id}/width/800/height/500/border/888888/sfsb/true/smb/false/stb/false/stbh/false/ai/false/asb/false/sri/true/rc/false/ld/false/sdz/false/ctl/false`;
    }
    return urlOrId;
  };

  const saveGeogebra = (rawInput: string, correct: string) => {
    setInputValue(rawInput);
    let extractedUrl = "";
    if (rawInput.trim().startsWith("<iframe")) {
      const match = rawInput.match(/src="([^"]+)"/i);
      extractedUrl = match ? match[1] : rawInput.trim();
    } else {
      extractedUrl = rawInput.trim();
    }
    const cleanUrl = getCleanGeoGebraUrl(extractedUrl);
    const id = extractId(extractedUrl);
    updateQuestionData({ materialId: id || "", width: opts.width || 800, height: opts.height || 500, iframeUrl: cleanUrl }, correct.trim());
  };

  return (
    <div className={`space-y-6 ${language === 'ar' ? 'text-right' : 'text-left'} w-full max-w-full overflow-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">إعدادات جيوجيبرا (GeoGebra):</h5>
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400">أيفريم أو رابط جيوجيبرا:</span>
          <textarea
            rows={3}
            placeholder="ضع كود أيفريم أو رابط الحاسبة هنا..."
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-right"
            value={inputValue}
            onChange={(e) => saveGeogebra(e.target.value, correctVal)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400">الإجابة النموذجية الصحيحة:</span>
          <input
            type="text"
            placeholder="اكتب القيمة أو الحل الصحيح..."
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            value={correctVal}
            onChange={(e) => saveGeogebra(inputValue, e.target.value)}
          />
        </div>
      </div>

      {opts.iframeUrl && (
        <div className="space-y-2 pt-3 border-t border-slate-100 w-full">
          <span className="text-[10px] font-black text-slate-400 block font-bold">معاينة لوحة جيوجيبرا:</span>
          <div className="w-full aspect-[16/10] rounded-2xl overflow-hidden border border-slate-200 bg-white">
            <GeoGebraWidget materialId={opts.materialId || ""} iframeUrl={opts.iframeUrl} w={opts.width} h={opts.height} />
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 🎴 15. FLASH_CARD (البطاقات التعليمية)