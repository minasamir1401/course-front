"use client";

import React from "react";
import HtmlRenderer from "../../HtmlRenderer";
import MathInput from "../../MathInput";
import { parseJson, translateText } from "../utils";

export default function MathEquationRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { equation: "" });
  const equation = translateText(opts.equation, language);

  return (
    <div className={`space-y-6 w-full max-w-full ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h4 className="text-base font-black text-slate-800 text-center">
        {language === "ar" ? "أوجد قيمة المتغير x لحل المعادلة:" : "Solve the equation for x:"}
      </h4>
      
      <div className="text-center py-6">
        <HtmlRenderer 
          html={equation} 
          tag="span" 
          className="text-3xl font-black text-slate-800 border-b-4 border-slate-900 pb-2 px-6 inline-block" 
        />
      </div>

      <div className="w-full max-w-xs mx-auto space-y-2">
        <label className="text-xs font-bold text-slate-500 block text-center">
          {language === "ar" ? "الجواب (قيمة x):" : "Answer (x value):"}
        </label>
        <MathInput
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-center font-bold text-sm"
          value={value || ""}
          onChange={(val: any) => onChange(val)}
          placeholder={language === "ar" ? "قيمة x = ..." : "x = ..."}
        />
      </div>
    </div>
  );
}
