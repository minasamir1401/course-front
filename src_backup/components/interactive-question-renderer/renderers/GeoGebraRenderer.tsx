"use client";

import React from "react";
import GeoGebraWidget from "../../GeoGebraWidget";
import QuestionHeader from "../QuestionHeader";
import { parseJson } from "../utils";

export default function GeoGebraRenderer({ question, value, onChange, language }: any) {
  const opts = parseJson(question.options, { materialId: "", width: 800, height: 500, iframeUrl: "" });
  const materialId = opts.materialId || "";
  const w = opts.width || 800;
  const h = opts.height || 500;
  const iframeUrl = opts.iframeUrl || "";

  return (
    <div className="flex flex-col gap-6 w-full max-w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Question Header */}
      <QuestionHeader question={question} language={language} opts={opts} />

      {/* Graph On Top */}
      <div className="w-full min-h-[350px] lg:min-h-[450px] rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        {iframeUrl && (
          <GeoGebraWidget materialId={materialId} iframeUrl={iframeUrl} w={w} h={h} />
        )}
        {!iframeUrl && materialId && (
          <GeoGebraWidget materialId={materialId} iframeUrl={`https://www.geogebra.org/material/iframe/id/${materialId}`} w={w} h={h} />
        )}
        {!iframeUrl && !materialId && (
          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-sm p-8">
            {language === "ar" ? "لم يتم تحديد مادة GeoGebra" : "No GeoGebra material specified"}
          </div>
        )}
      </div>
    </div>
  );
}
