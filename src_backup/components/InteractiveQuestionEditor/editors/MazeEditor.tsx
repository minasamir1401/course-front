"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, Sparkles, Info, X } from 'lucide-react';
import GeoGebraWidget from "../../GeoGebraWidget";
import MathInput from "../../MathInput";
import { getOptionLetter } from "@/lib/utils";
import { parseJson } from "../utils";

export default function MazeEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const defaultGrid = Array.from({ length: 5 }, () => Array(5).fill(1));
  const opts = parseJson(question.options, { mazeGrid: defaultGrid, start: [0, 0], end: [4, 4], labels: {} });
  const gridData = Array.isArray(opts?.mazeGrid) ? opts.mazeGrid : defaultGrid;
  const correctVal = parseJson(question.correctAnswer, []);

  const [grid, setGrid] = useState<number[][]>(gridData);
  const [start, setStart] = useState<number[]>(opts.start || [0, 0]);
  const [end, setEnd] = useState<number[]>(opts.end || [4, 4]);
  const [path, setPath] = useState<string[]>(Array.isArray(correctVal) ? correctVal : []);
  const [labels, setLabels] = useState<Record<string, string>>(opts.labels || {});
  const [mode, setMode] = useState<"WALL" | "START" | "END" | "PATH" | "LABEL">("WALL");

  useEffect(() => {
    const loadedGrid = Array.isArray(opts?.mazeGrid) && opts.mazeGrid.length > 0 ? opts.mazeGrid : defaultGrid;
    setGrid(loadedGrid);
    setStart(opts.start || [0, 0]);
    setEnd(opts.end || [4, 4]);
    setPath(Array.isArray(correctVal) ? correctVal : []);
    setLabels(opts.labels || {});
  }, [question.options, question.correctAnswer]);

  const saveChanges = (newGrid: number[][], newStart: number[], newEnd: number[], newPath: string[], nextLabels = labels) => {
    updateQuestionData({ mazeGrid: newGrid, start: newStart, end: newEnd, labels: nextLabels }, newPath);
  };

  const handleCellClick = (r: number, c: number) => {
    const updatedGrid = grid.map((row) => [...row]);
    if (mode === "WALL") {
      if ((r === start[0] && c === start[1]) || (r === end[0] && c === end[1])) return;
      updatedGrid[r][c] = updatedGrid[r][c] === 1 ? 0 : 1;
      const coordStr = `${r},${c}`;
      const updatedPath = path.filter((p) => p !== coordStr);
      setGrid(updatedGrid);
      setPath(updatedPath);
      saveChanges(updatedGrid, start, end, updatedPath);
    } else if (mode === "START") {
      updatedGrid[r][c] = 1;
      setStart([r, c]);
      setGrid(updatedGrid);
      const updatedPath = [`${r},${c}`];
      setPath(updatedPath);
      saveChanges(updatedGrid, [r, c], end, updatedPath);
    } else if (mode === "END") {
      updatedGrid[r][c] = 1;
      setEnd([r, c]);
      setGrid(updatedGrid);
      saveChanges(updatedGrid, start, [r, c], path);
    } else if (mode === "PATH") {
      const coordStr = `${r},${c}`;
      if (grid[r][c] === 0) return;
      if (path.includes(coordStr)) {
        const idx = path.indexOf(coordStr);
        const updatedPath = path.slice(0, idx + 1);
        setPath(updatedPath);
        saveChanges(grid, start, end, updatedPath);
      } else {
        if (path.length > 0) {
          const last = path[path.length - 1].split(",").map(Number);
          const dist = Math.abs(r - last[0]) + Math.abs(c - last[1]);
          if (dist !== 1) return;
        } else {
          if (r !== start[0] || c !== start[1]) return;
        }
        const updatedPath = [...path, coordStr];
        setPath(updatedPath);
        saveChanges(grid, start, end, updatedPath);
      }
    }
  };

  const handleLabelChange = (r: number, c: number, val: string) => {
    const nextLabels = { ...labels, [`${r},${c}`]: val };
    setLabels(nextLabels);
    saveChanges(grid, start, end, path, nextLabels);
  };

  const handleResetPath = () => {
    const updatedPath = [`${start[0]},${start[1]}`];
    setPath(updatedPath);
    saveChanges(grid, start, end, updatedPath);
  };

  return (
    <div className={`space-y-6 ${language === 'ar' ? 'text-right' : 'text-left'} w-full max-w-full overflow-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">
        محرر مسار المتاهة التعليمي (Maze Path):
      </h5>
      <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-900 leading-relaxed font-bold space-y-1">
        <div className="flex items-center gap-1.5 font-black text-amber-950 text-sm">
          <span>💡 فكرة النشاط وكيفية إعداده:</span>
        </div>
        <p>المتاهة التعليمية هي لعبة تفاعلية يقوم فيها الطالب بالوصول من <b>نقطة البداية 🟢</b> إلى <b>نقطة النهاية 🔴</b> من خلال تتبع مسار الإجابات الصحيحة (مثلاً: تتبع مضاعفات العدد 5، أو تتبع الكلمات التي تبدأ بحرف اللام).</p>
        <ul className="list-disc list-inside space-y-0.5 text-[11px] pt-1 text-amber-800">
          <li><b>1. رسم الجدران ⬛:</b> حدد المربعات التي تمثل حوائط مغلقة لا يمكن للطالب المرور منها.</li>
          <li><b>2. تحديد البداية 🟢 والنهاية 🔴:</b> اختر نقطة انطلاق ونقطة خروج الطالب.</li>
          <li><b>3. رسم المسار الصحيح 🟡:</b> اضغط على المربعات المتتالية لرسم ممر الحل.</li>
          <li><b>4. كتابة النصوص ✍️:</b> اضغط على زر "كتابة نصوص الخلايا" واكتب محتوى كل خلية (أرقام أو كلمات) ليرشد الطالب.</li>
        </ul>
      </div>
      <div className="flex flex-col gap-2 w-full">
        <button
          type="button"
          onClick={() => setMode("WALL")}
          className={`w-full py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${mode === "WALL" ? "bg-slate-800 text-white border-slate-900 animate-none" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 animate-none"}`}
        >
          رسم الجدران / الممرات
        </button>
        <button
          type="button"
          onClick={() => setMode("START")}
          className={`w-full py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${mode === "START" ? "bg-indigo-500 text-white border-indigo-700 animate-none" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 animate-none"}`}
        >
          تحديد البداية (Start)
        </button>
        <button
          type="button"
          onClick={() => setMode("END")}
          className={`w-full py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${mode === "END" ? "bg-emerald-600 text-white border-emerald-700 animate-none" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 animate-none"}`}
        >
          تحديد المخرج (End)
        </button>
        <button
          type="button"
          onClick={() => setMode("PATH")}
          className={`w-full py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${mode === "PATH" ? "bg-violet-600 text-white border-violet-750 animate-none" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 animate-none"}`}
        >
          رسم مسار الحل النموذجي
        </button>
        <button
          type="button"
          onClick={() => setMode("LABEL")}
          className={`w-full py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${mode === "LABEL" ? "bg-amber-600 text-white border-amber-700 animate-none" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 animate-none"}`}
        >
          كتابة نصوص الخلايا (Labels)
        </button>
      </div>

      <div className="flex flex-col items-center gap-4 w-full">
        <div className="text-xs text-slate-500 font-bold bg-slate-50/50 px-3 py-2 rounded-xl border border-slate-150 w-full text-center leading-relaxed">
          {mode === "WALL" && "💡 انقر على الخلايا لتغييرها بين جدران أو ممرات."}
          {mode === "START" && "💡 انقر على خلية لتحديدها كنقطة بداية."}
          {mode === "END" && "💡 انقر على خلية لتحديدها كمخرج."}
          {mode === "PATH" && "💡 انقر على الممرات المجاورة بالتتابع لرسم مسار الحل."}
          {mode === "LABEL" && "✍️ اكتب النصوص أو الأرقام المناسبة في المربعات مباشرة."}
        </div>

        <div className="w-full overflow-x-auto pb-2 flex justify-center">
          <div className="flex flex-col gap-1.5 border-2 border-slate-200 p-3 bg-slate-150 rounded-2xl w-fit">
            {grid.map((row, rIdx) => (
              <div key={rIdx} className="flex gap-1.5">
                {row.map((val, cIdx) => {
                  const coordStr = `${rIdx},${cIdx}`;
                  const isWall = val === 0;
                  const isStart = start[0] === rIdx && start[1] === cIdx;
                  const isEnd = end[0] === rIdx && end[1] === cIdx;
                  const isPathSelected = path.includes(coordStr);
                  const pathIndex = path.indexOf(coordStr);

                  return (
                    <button
                      key={cIdx}
                      type="button"
                      onClick={() => mode !== "LABEL" && handleCellClick(rIdx, cIdx)}
                      className={`w-14 h-14 rounded-lg border transition-all flex flex-col items-center justify-center font-black text-[10px] relative shrink-0 ${isWall ? "bg-slate-800 border-slate-900 text-slate-400" : isStart ? "bg-indigo-500 border-indigo-700 text-white shadow-sm" : isEnd ? "bg-emerald-500 border-emerald-600 text-white shadow-sm" : isPathSelected ? "bg-violet-100 border-violet-400 text-violet-850" : "bg-white border-slate-200"}`}
                    >
                      {mode === "LABEL" && !isWall ? (
                        <input
                          type="text"
                          value={labels[coordStr] || ""}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleLabelChange(rIdx, cIdx, e.target.value)}
                          placeholder="..."
                          className="w-full h-full text-center bg-transparent border-0 font-bold text-xs outline-none text-slate-800"
                        />
                      ) : (
                        <>
                          {isStart && <span>بداية</span>}
                          {isEnd && <span>مخرج</span>}
                          {labels[coordStr] && <span className="text-[10px] text-slate-500 font-bold">{labels[coordStr]}</span>}
                          {!isStart && !isEnd && isPathSelected && (
                            <span className="absolute bottom-0.5 right-0.5 text-[8px] text-slate-400">{pathIndex + 1}</span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {mode === "PATH" && path.length > 0 && (
          <div className="flex flex-col gap-1.5 items-center text-xs w-full max-w-full">
            <span className="font-bold text-slate-500 truncate max-w-full">المسار: {path.join(" ➔ ")}</span>
            <button type="button" onClick={handleResetPath} className="text-xs text-rose-500 font-bold hover:underline cursor-pointer">مسح المسار</button>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 📐 14. GEOGEBRA (جيوجيبرا)