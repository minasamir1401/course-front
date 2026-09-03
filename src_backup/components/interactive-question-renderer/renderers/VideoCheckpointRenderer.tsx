"use client";

import React, { useState } from "react";
import VideoPlayer from "../../VideoPlayer";
import { parseJson, translateText } from "../utils";

export default function VideoCheckpointRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { videoUrl: "", checkpoints: [] });
  const videoUrl = opts.videoUrl || "";
  const checkpoints = Array.isArray(opts?.checkpoints) ? opts.checkpoints : [];
  const stateData = parseJson(value, { answeredCheckpoints: {} });
  const answered = stateData.answeredCheckpoints || {};

  const [currentAnswers, setCurrentAnswers] = useState<Record<string, string>>(answered);

  const handleSelectAnswer = (timeKey: string, val: string) => {
    const nextAns = { ...currentAnswers, [timeKey]: val };
    setCurrentAnswers(nextAns);
    onChange(JSON.stringify({ answeredCheckpoints: nextAns }));
  };

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h4 className="text-lg font-black text-slate-800">{translateText(question.title, language)}</h4>
      {videoUrl ? (
        <div className="w-full aspect-video rounded-3xl overflow-hidden border border-slate-200 bg-black relative shadow-lg">
          <VideoPlayer url={videoUrl} />
        </div>
      ) : (
        <div className="w-full aspect-video rounded-3xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
          <span className="text-slate-400 font-bold text-sm">{language === 'ar' ? 'لا يوجد رابط فيديو صالح' : 'No valid video URL'}</span>
        </div>
      )}
      <div className="space-y-4">
        <span className="text-xs font-black text-slate-400 block uppercase">
          {language === "ar" ? "الأسئلة التفاعلية المرفقة بالفيديو:" : "Interactive questions attached to the video:"}
        </span>
        <div className="space-y-4">
          {checkpoints.map((cp: any, idx: number) => {
            const timeKey = String(cp.time);
            const selectedVal = currentAnswers[timeKey] || "";
            return (
              <div key={idx} className="bg-slate-50 p-5 rounded-3xl border border-slate-150 space-y-4">
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-900 text-white text-[10px] font-black rounded-lg">
                  {language === "ar" ? `ثانية ${cp.time}` : `${cp.time}s`}
                </span>
                <p className="font-black text-slate-800 text-sm">{translateText(cp.question, language)}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {(cp.choices || []).map((ch: any) => {
                    const isSelected = selectedVal === ch;
                    return (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => handleSelectAnswer(timeKey, ch)}
                        className={`p-3.5 rounded-2xl border-2 transition-all font-bold text-xs cursor-pointer ${
                          language === 'ar' ? 'text-right' : 'text-left'
                        } ${isSelected ? "bg-slate-950 border-slate-950 text-white" : "bg-white border-slate-200 hover:border-slate-400"}`}
                      >
                        {translateText(ch, language)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
