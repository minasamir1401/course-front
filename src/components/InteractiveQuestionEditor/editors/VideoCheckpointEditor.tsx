"use client";
import React, { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, Sparkles, Info, X } from 'lucide-react';
import GeoGebraWidget from "../../GeoGebraWidget";
import MathInput from "../../MathInput";
import { getOptionLetter } from "@/lib/utils";
import { parseJson } from "../utils";

export default function VideoCheckpointEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { videoUrl: "", checkpoints: [] });
  const checkpoints = Array.isArray(opts?.checkpoints) ? opts.checkpoints : [];
  const correctMap = parseJson(question.correctAnswer, {});

  const [videoUrl, setVideoUrl] = useState(opts.videoUrl || "");
  const [checkpointsList, setCheckpointsList] = useState<any[]>(checkpoints);
  const [timeInput, setTimeInput] = useState("");
  const [questionInput, setQuestionInput] = useState("");
  const [choiceInput, setChoiceInput] = useState("");
  const [choices, setChoices] = useState<string[]>([]);
  const [correctChoice, setCorrectChoice] = useState("");

  useEffect(() => {
    setVideoUrl(opts.videoUrl || "");
    setCheckpointsList(Array.isArray(opts?.checkpoints) ? opts.checkpoints : []);
  }, [question.options]);

  const saveChanges = (newUrl: string, newCheckpoints: any[], newCorrectMap: any) => {
    updateQuestionData({ videoUrl: newUrl, checkpoints: newCheckpoints }, newCorrectMap);
  };

  const addChoice = () => {
    if (!choiceInput.trim() || choices.includes(choiceInput.trim())) return;
    setChoices([...choices, choiceInput.trim()]);
    if (!correctChoice) setCorrectChoice(choiceInput.trim());
    setChoiceInput("");
  };

  const removeChoice = (c: string) => {
    const updated = choices.filter((choice) => choice !== c);
    setChoices(updated);
    if (correctChoice === c) {
      setCorrectChoice(updated[0] || "");
    }
  };

  const addCheckpoint = () => {
    const timeSec = parseInt(timeInput);
    if (isNaN(timeSec) || !questionInput.trim() || choices.length === 0 || !correctChoice) return;
    const newCheckpoint = {
      time: timeSec,
      question: questionInput.trim(),
      choices: choices
    };
    const updatedCheckpoints = [...checkpointsList, newCheckpoint].sort((a, b) => a.time - b.time);
    const updatedCorrectMap = { ...correctMap, [String(timeSec)]: correctChoice };
    setCheckpointsList(updatedCheckpoints);
    saveChanges(videoUrl, updatedCheckpoints, updatedCorrectMap);
    setTimeInput("");
    setQuestionInput("");
    setChoices([]);
    setCorrectChoice("");
  };

  const removeCheckpoint = (timeSec: number) => {
    const updatedCheckpoints = checkpointsList.filter((c) => c.time !== timeSec);
    const updatedCorrectMap = { ...correctMap };
    delete updatedCorrectMap[String(timeSec)];
    setCheckpointsList(updatedCheckpoints);
    saveChanges(videoUrl, updatedCheckpoints, updatedCorrectMap);
  };

  return (
    <div className={`space-y-6 ${language === 'ar' ? 'text-right' : 'text-left'} w-full max-w-full overflow-hidden`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">
        محرر أسئلة الفيديو التفاعلية (Video Checkpoint):
      </h5>

      <div className="flex flex-col gap-1 w-full">
        <label className="text-[10px] font-black text-slate-400">
          رابط الفيديو (YouTube أو رابط مباشر):
        </label>
        <input
          type="text"
          placeholder="ضع رابط الفيديو هنا..."
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold w-full text-right"
          value={videoUrl}
          onChange={(e) => {
            setVideoUrl(e.target.value);
            saveChanges(e.target.value, checkpointsList, correctMap);
          }}
        />
      </div>

      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-4 w-full">
        <h6 className="text-xs font-black text-slate-700">
          إضافة سؤال تفاعلي جديد عند توقيت معين:
        </h6>
        
        <div className="flex flex-col gap-3 w-full">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-slate-400 font-bold">
              توقيت ظهور السؤال (بالثواني):
            </span>
            <input
              type="number"
              min="0"
              placeholder="مثال: 15"
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-right"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-slate-400 font-bold">
              نص السؤال:
            </span>
            <input
              type="text"
              placeholder="اكتب السؤال التفاعلي..."
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-right"
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-[10px] font-black text-slate-400 block font-bold">
            خيارات الإجابة لهذا السؤال:
          </span>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="اكتب خياراً واضغط إضافة..."
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-right"
              value={choiceInput}
              onChange={(e) => setChoiceInput(e.target.value)}
            />
            <button
              type="button"
              onClick={addChoice}
              className="w-full py-2 bg-slate-950 text-white rounded-xl text-xs font-black cursor-pointer"
            >
              إضافة خيار
            </button>
          </div>

          <div className="flex flex-wrap gap-1">
            {choices.map((c, idx) => (
              <div key={idx} className="bg-white px-2 py-1 rounded-lg border border-slate-200 flex items-center gap-1 text-xs font-bold truncate max-w-full">
                <span className="truncate">{c}</span>
                <button type="button" onClick={() => removeChoice(c)} className="text-rose-500 hover:text-rose-700 cursor-pointer">×</button>
              </div>
            ))}
          </div>

          {choices.length > 0 && (
            <div className="flex flex-col gap-1.5 text-xs w-full">
              <span className="font-bold text-slate-500">
                حدد الإجابة الصحيحة:
              </span>
              <select
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-xs"
                value={correctChoice}
                onChange={(e) => setCorrectChoice(e.target.value)}
              >
                {choices.map((c, idx) => (
                  <option key={idx} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={addCheckpoint}
          className="w-full py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-black cursor-pointer"
        >
          إضافة السؤال إلى الفيديو
        </button>
      </div>

      {checkpointsList.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-slate-100 max-h-56 overflow-y-auto">
          <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">
            الأسئلة التفاعلية المضافة حالياً:
          </h6>
          <div className="space-y-2">
            {checkpointsList.map((c, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-start text-xs gap-2 min-w-0">
                <div className="space-y-1.5 text-right flex-1 min-w-0">
                  <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded font-black text-[9px]">
                    ثانية {c.time}
                  </span>
                  <p className="font-black text-slate-800 text-xs mt-1 truncate">{c.question}</p>
                </div>
                <button type="button" onClick={() => removeCheckpoint(c.time)} className="text-rose-500 hover:text-rose-700 cursor-pointer shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 📐 10. NUMBER_LINE (خط الأعداد)