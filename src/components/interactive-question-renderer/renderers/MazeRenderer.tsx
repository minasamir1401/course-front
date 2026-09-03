"use client";

import React from "react";
import { parseJson, translateText } from "../utils";

export default function MazeRenderer({ question, value, onChange, language }: any) {
  const defaultGrid = Array.from({ length: 5 }, () => Array(5).fill(1));
  const opts = parseJson(question.options, { mazeGrid: defaultGrid, start: [0, 0], end: [4, 4], labels: {} });
  const grid = Array.isArray(opts?.mazeGrid) ? opts.mazeGrid : defaultGrid;
  const start = opts.start || [0, 0];
  const end = opts.end || [4, 4];
  const labels = opts.labels || {};
  
  const currentPath = parseJson(value, []);

  const handleCellClick = (r: number, c: number) => {
    if (grid[r][c] === 0) return; // Wall
    const coordStr = `${r},${c}`;
    if (currentPath.includes(coordStr)) {
      const idx = currentPath.indexOf(coordStr);
      const nextPath = currentPath.slice(0, idx + 1);
      onChange(JSON.stringify(nextPath));
    } else {
      if (currentPath.length > 0) {
        const last = currentPath[currentPath.length - 1].split(",").map(Number);
        const dist = Math.abs(r - last[0]) + Math.abs(c - last[1]);
        if (dist !== 1) return; // Must be adjacent
      } else {
        if (r !== start[0] || c !== start[1]) return; // Must start at start coord
      }
      const nextPath = [...currentPath, coordStr];
      onChange(JSON.stringify(nextPath));
    }
  };

  const handleReset = () => {
    onChange(JSON.stringify([`${start[0]},${start[1]}`]));
  };

  const isAtEnd = currentPath.length > 0 && currentPath[currentPath.length - 1] === `${end[0]},${end[1]}`;

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h4 className="text-lg font-black text-slate-800">{translateText(question.title, language)}</h4>
      {isAtEnd && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
          <span className="font-black text-emerald-700 text-sm">🎉 {language === 'ar' ? 'وصلت للمخرج! أحسنت!' : 'You reached the exit! Well done!'}</span>
        </div>
      )}
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-500">
          {language === "ar" ? "ارسم مساراً من البداية حتى المخرج بالتتبع الصحيح:" : "Draw a path from start to end by tracking correctly:"}
        </span>
        <button type="button" onClick={handleReset} className="text-xs text-rose-500 font-bold hover:underline">
          {language === "ar" ? "إعادة تعيين" : "Reset"}
        </button>
      </div>

      <div className="w-full overflow-x-auto pb-2 flex justify-center">
        <div className="flex flex-col gap-1.5 border-2 border-slate-200 p-3 bg-slate-100 rounded-2xl w-fit">
          {grid.map((row: any[], rIdx: number) => (
            <div key={rIdx} className="flex gap-1.5">
              {row.map((val: number, cIdx: number) => {
                const coordStr = `${rIdx},${cIdx}`;
                const isWall = val === 0;
                const isStart = start[0] === rIdx && start[1] === cIdx;
                const isEnd = end[0] === rIdx && end[1] === cIdx;
                const isPath = currentPath.includes(coordStr);
                const pathIndex = currentPath.indexOf(coordStr);
                const label = labels[coordStr] || "";

                return (
                  <button
                    key={cIdx}
                    type="button"
                    onClick={() => handleCellClick(rIdx, cIdx)}
                    disabled={isWall}
                    className={`w-12 h-12 rounded-lg border transition-all flex flex-col items-center justify-center font-black text-xs relative shrink-0 ${isWall ? "bg-slate-800 border-slate-900 text-slate-400 cursor-not-allowed" : isStart ? "bg-slate-950 border-slate-950 text-white" : isEnd ? "bg-emerald-650 border-emerald-700 text-white" : isPath ? "bg-indigo-600 border-indigo-500 text-white" : "bg-white border-slate-200 hover:border-slate-350"}`}
                  >
                    {isStart && <span className="text-[7px] absolute top-0.5 opacity-80">{language === "ar" ? "البداية" : "Start"}</span>}
                    {isEnd && <span className="text-[7px] absolute top-0.5 opacity-80">{language === "ar" ? "المخرج" : "Exit"}</span>}
                    {label && <span className={`${isStart || isEnd ? "pt-2 text-[9px]" : "text-xs"}`}>{label}</span>}
                    {!isStart && !isEnd && isPath && <span className="absolute bottom-0.5 right-0.5 text-[7px] text-slate-350">{pathIndex + 1}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
