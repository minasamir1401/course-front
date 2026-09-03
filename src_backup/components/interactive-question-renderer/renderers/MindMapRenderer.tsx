"use client";

import React, { useState } from "react";
import { parseJson, translateText } from "../utils";

export default function MindMapRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { nodes: [] });
  const nodes = Array.isArray(opts?.nodes) ? opts.nodes : [];
  const mapAnswers = parseJson(value, {});

  const [activeWord, setActiveWord] = useState<string | null>(null);

  const handleNodeClick = (nodeId: string, node: any) => {
    if (!node.isBlank) return;
    if (activeWord) {
      const nextAnswers = { ...mapAnswers, [nodeId]: activeWord };
      onChange(JSON.stringify(nextAnswers));
      setActiveWord(null);
    } else {
      const nextAnswers = { ...mapAnswers };
      delete nextAnswers[nodeId];
      onChange(JSON.stringify(nextAnswers));
    }
  };

  const blanksList = nodes.filter((n: any) => n.isBlank).map((n: any) => n.label);
  const rootNodes = nodes.filter((n: any) => !n.parent);

  const renderTreeNode = (node: any) => {
    const children = nodes.filter((n: any) => n.parent === node.id);
    const isBlank = node.isBlank;
    const nodeAns = mapAnswers[node.id];
    
    const isRoot = !node.parent;
    const nodeClass = isBlank
      ? (nodeAns
        ? "bg-emerald-50 border-emerald-300 text-emerald-800 scale-105 shadow-md shadow-emerald-100/60"
        : "border-dashed border-2 border-indigo-300 bg-indigo-50/50 text-indigo-400 animate-pulse")
      : (isRoot
        ? "premium-gradient-primary text-white shadow-xl scale-105 border-none"
        : "bg-white border-2 border-slate-200 text-slate-800 shadow-sm");

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Node card */}
        <div
          data-node-id={node.id}
          onClick={() => handleNodeClick(node.id, node)}
          className={`px-5 py-3.5 rounded-2xl transition-all cursor-pointer font-black text-sm min-w-[140px] max-w-[200px] text-center z-20 border ${nodeClass}`}
        >
          {isBlank ? (translateText(nodeAns, language) || "?") : translateText(node.label, language)}
        </div>

        {/* Children rendering */}
        {children.length > 0 && (
          <div className="flex flex-col items-center w-full">
            {/* Vertical connector from parent */}
            <div className="w-0.5 h-4 bg-slate-350" />
            
            {/* Row of children */}
            <div className="flex justify-center gap-8 w-full">
              {children.map((child: any, idx: number) => {
                const isFirst = idx === 0;
                const isLast = idx === children.length - 1;
                return (
                  <div key={child.id} className="relative flex flex-col items-center pt-4">
                    {/* Horizontal connecting line */}
                    {children.length > 1 && (
                      <div className={`absolute top-0 h-0.5 bg-slate-350 ${
                        isFirst ? 'left-1/2 right-0' : isLast ? 'left-0 right-1/2' : 'left-0 right-0'
                      }`} />
                    )}
                    {/* Vertical connector down to child card */}
                    <div className="absolute top-0 w-0.5 h-4 bg-slate-350 left-1/2 -translate-x-1/2" />
                    {renderTreeNode(child)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 relative w-full overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap justify-center gap-12 py-6 relative z-20 w-full overflow-x-auto pb-6">
        {rootNodes.map(renderTreeNode)}
      </div>

      {blanksList.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <span className="text-xs font-black text-slate-400 block uppercase">
            {language === "ar" ? "الخيارات المتاحة (اضغط على الخيار ثم اضغط على الفراغ):" : "Available choices (click choice then blank):"}
          </span>
          <div className="flex flex-wrap gap-2.5">
            {blanksList.map((word: any, i: number) => {
              const isPlaced = Object.values(mapAnswers).includes(word);
              const isSelected = activeWord === word;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveWord(isSelected ? null : word)}
                  className={`px-5 py-3 rounded-2xl border-2 transition-all font-black text-xs cursor-pointer ${isPlaced ? "opacity-30 cursor-not-allowed bg-slate-100 border-slate-200" : isSelected ? "bg-sky-200 border-sky-300 text-slate-900" : "bg-white border-slate-200 hover:border-slate-400"}`}
                >
                  {translateText(word, language)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
