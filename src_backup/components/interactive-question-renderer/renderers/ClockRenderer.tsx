"use client";

import React, { useState, useRef } from "react";
import { parseJson } from "../utils";

export default function ClockRenderer({ question, value, onChange, language }: any) {
  let timeStr = "12:00";
  const valToParse = value || question?.correctAnswer || "12:00";
  if (typeof valToParse === "string") {
    const t = valToParse.trim();
    if (t.startsWith("{")) {
      try {
        const p = JSON.parse(t);
        timeStr = p.time || `${String(p.hour || 12).padStart(2, "0")}:${String(p.minute || 0).padStart(2, "0")}`;
      } catch {}
    } else {
      timeStr = t;
    }
  } else if (typeof valToParse === "object" && valToParse) {
    timeStr = valToParse.time || `${String(valToParse.hour || 12).padStart(2, "0")}:${String(valToParse.minute || 0).padStart(2, "0")}`;
  }
  const parts = timeStr.split(":");
  const hour = parseInt(parts[0]) || 12;
  const minute = parseInt(parts[1]) || 0;

  const clockRef = useRef<HTMLDivElement>(null);
  const [activeHand, setActiveHand] = useState<"hour" | "minute" | null>(null);

  const updateTime = (field: "hour" | "minute", val: number) => {
    const nextH = field === "hour" ? val : hour;
    const nextM = field === "minute" ? val : minute;
    onChange(`${String(nextH).padStart(2, "0")}:${String(nextM).padStart(2, "0")}`);
  };

  const handlePointerInteraction = (clientX: number, clientY: number) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    let targetHand = activeHand;
    if (!targetHand) {
      targetHand = distance < rect.width * 0.3 ? "hour" : "minute";
    }

    if (targetHand === "hour") {
      let h = Math.round(angle / 30);
      if (h === 0) h = 12;
      updateTime("hour", h);
    } else {
      let mVal = Math.round(angle / 6);
      if (mVal === 60) mVal = 0;
      updateTime("minute", mVal);
    }
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    const selected = dist < rect.width * 0.3 ? "hour" : "minute";
    setActiveHand(selected);
    handlePointerInteraction(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeHand) return;
    handlePointerInteraction(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    setActiveHand(null);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const dx = touch.clientX - (rect.left + rect.width / 2);
    const dy = touch.clientY - (rect.top + rect.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    const selected = dist < rect.width * 0.3 ? "hour" : "minute";
    setActiveHand(selected);
    handlePointerInteraction(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!activeHand || e.touches.length === 0) return;
    const touch = e.touches[0];
    handlePointerInteraction(touch.clientX, touch.clientY);
  };

  return (
    <div className={`space-y-6 w-full max-w-full select-none ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h4 className="text-base font-black text-slate-800 text-center">
        {language === "ar" ? "اضغط واسحب عقارب الساعة مباشرة لتعديل الوقت:" : "Click and drag clock hands directly to set time:"}
      </h4>
      
      <div className="flex justify-center">
        <div
          ref={clockRef}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handlePointerUp}
          className="w-60 h-60 rounded-full border-4 border-slate-900 bg-white relative flex items-center justify-center shadow-xl cursor-crosshair"
        >
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = ((i + 1) * 30 * Math.PI) / 180;
            const x = 50 + 40 * Math.sin(angle);
            const y = 50 - 40 * Math.cos(angle);
            return (
              <span key={i} className="absolute text-xs font-black text-slate-500" style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}>
                {i + 1}
              </span>
            );
          })}
          
          <div
            className="w-2 h-14 bg-blue-900 absolute bottom-1/2 left-1/2 origin-bottom rounded-full shadow-sm"
            style={{ transform: `translate(-50%, 0) rotate(${(hour % 12) * 30 + minute * 0.5}deg)` }}
          />
          <div
            className="w-1 h-20 bg-blue-600 absolute bottom-1/2 left-1/2 origin-bottom rounded-full shadow-sm"
            style={{ transform: `translate(-50%, 0) rotate(${minute * 6}deg)` }}
          />
          <div className="w-4 h-4 rounded-full bg-sky-500 absolute border-2 border-white shadow" />
        </div>
      </div>

      <div className="text-center">
        <span className="text-3xl font-black text-slate-950 bg-sky-100 border border-sky-300 px-6 py-3.5 rounded-2xl tracking-widest shadow-lg">
          {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
