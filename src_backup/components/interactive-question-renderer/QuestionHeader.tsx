import React from "react";
import { Award } from 'lucide-react';
import HtmlRenderer from "../HtmlRenderer";
import { translateText } from "./utils";

export default function QuestionHeader({ question, language, opts }: any) {
  return (
    <div className="flex flex-col mb-4 gap-3">
      <div className="flex justify-between items-start gap-4">
        {opts?.questionText ? (
          <HtmlRenderer html={translateText(question.title, language)} tag="div" className="text-xs font-black text-slate-400 uppercase tracking-widest leading-snug" />
        ) : (
          <HtmlRenderer html={translateText(question.title, language)} tag="div" className="text-xl md:text-2xl font-black text-slate-900 leading-snug" />
        )}
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-xl font-black text-[10px] shrink-0 select-none shadow-sm animate-pulse">
          <Award className="w-3.5 h-3.5 text-amber-500" />
          <span>+10 XP</span>
        </div>
      </div>
      {opts?.questionText && (
        <div className="prose prose-lg max-w-none text-slate-900 font-bold text-xl md:text-2xl bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-[20px] p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 leading-relaxed">
          <HtmlRenderer html={translateText(opts.questionText, language)} />
        </div>
      )}
    </div>
  );
}
