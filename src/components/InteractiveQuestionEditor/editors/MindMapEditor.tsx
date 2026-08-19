"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, Sparkles, Info, X } from 'lucide-react';
import GeoGebraWidget from "../../GeoGebraWidget";
import MathInput from "../../MathInput";
import { getOptionLetter } from "@/lib/utils";
import { parseJson } from "../utils";

export default function MindMapEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { nodes: [] });
  const nodes = Array.isArray(opts?.nodes) ? opts.nodes : [];
  const correctMap = parseJson(question.correctAnswer, {});

  const [nodeLabel, setNodeLabel] = useState("");
  const [nodeParent, setNodeParent] = useState("");
  const [nodeIsBlank, setNodeIsBlank] = useState(false);

  const addNode = () => {
    if (!nodeLabel.trim()) return;
    const newId = String(nodes.length + 1);
    const newNode = {
      id: newId,
      label: nodeLabel.trim(),
      parent: nodeParent || null,
      isBlank: nodeIsBlank
    };
    const updatedNodes = [...nodes, newNode];
    const newCorrect = { ...correctMap };
    if (nodeIsBlank) {
      newCorrect[newId] = nodeLabel.trim();
    }
    updateQuestionData({ nodes: updatedNodes }, newCorrect);
    setNodeLabel("");
    setNodeParent("");
    setNodeIsBlank(false);
  };

  const removeNode = (id: string) => {
    const updatedNodes = nodes.filter((n: any) => n.id !== id);
    const newCorrect = { ...correctMap };
    delete newCorrect[id];
    updateQuestionData({ nodes: updatedNodes }, newCorrect);
  };

  return (
    <div className={`space-y-6 ${language === 'ar' ? 'text-right' : 'text-left'} w-full max-w-full overflow-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">
        خريطة المفاهيم الشجرية (Tree Mind Map):
      </h5>
      <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-2xl text-xs text-indigo-900 leading-relaxed font-bold">
        <span>💡 هيكلة الشجرة: قم بإنشاء عقدة رئيسية (Root) بدون أب، ثم أضف المفاهيم الفرعية تحتها لإنشاء تسلسل شجري (Tree Structure) منظم وواضح للطالب!</span>
      </div>
      <div className="flex flex-col gap-3.5 w-full">
        <div className="flex flex-col gap-1 w-full">
          <span className="text-[10px] font-black text-slate-400">
            نص المفهوم / العقدة:
          </span>
          <input
            type="text"
            placeholder="مثال: الاسم"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            value={nodeLabel}
            onChange={(e) => setNodeLabel(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1 w-full">
          <span className="text-[10px] font-black text-slate-400">
            المفهوم الأب الرئيسي:
          </span>
          <select
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            value={nodeParent}
            onChange={(e) => setNodeParent(e.target.value)}
          >
            <option value="">بدون - عقدة رئيسية (Root)</option>
            {nodes.map((n: any) => (
              <option key={n.id} value={n.id}>{n.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-600 flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={nodeIsBlank}
              onChange={(e) => setNodeIsBlank(e.target.checked)}
              className="w-4 h-4 accent-indigo-500"
            />
            <span>فراغ يقوم الطالب بسحبه</span>
          </label>
          <button
            type="button"
            onClick={addNode}
            className="w-full py-2 bg-slate-950 text-white rounded-xl text-xs font-black cursor-pointer"
          >
            إضافة العقدة
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {nodes.map((n: any) => (
          <div key={n.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs gap-2 min-w-0">
            <span className="font-bold text-slate-700 truncate min-w-0">
              {n.label} {n.parent ? `(الأب: #${n.parent})` : "(رئيسي)"} {n.isBlank && <span className="text-indigo-600 font-black">[فراغ]</span>}
            </span>
            <button type="button" onClick={() => removeNode(n.id)} className="text-rose-500 hover:text-rose-700 cursor-pointer shrink-0">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// ⏸️ 9. VIDEO_CHECKPOINT (فيديو تفاعلي)