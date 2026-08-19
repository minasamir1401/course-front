"use client";

import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface LessonSchedulingTabProps {
  currentLesson: any;
  setCurrentLesson: (lesson: any) => void;
  language: string;
}

export const LessonSchedulingTab: React.FC<LessonSchedulingTabProps> = ({
  currentLesson,
  setCurrentLesson,
  language
}) => {
  return (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="bg-indigo-50/50 border border-indigo-100 p-8 rounded-[35px] flex items-center justify-between">
                       <div className="space-y-1 text-right">
                          <h4 className="text-xl font-black text-indigo-900">{language === 'ar' ? "حالة ظهور الدرس" : "Lesson Visibility"}</h4>
                          <p className="text-indigo-600/60 font-bold text-sm">{language === 'ar' ? "تحكم في ما إذا كان الطالب يستطيع رؤية هذا الدرس حالياً" : "Control whether the student can see this lesson currently"}</p>
                       </div>
                       <button 
                        onClick={() => setCurrentLesson({...currentLesson, isVisible: !currentLesson.isVisible})}
                        className={`w-20 h-10 rounded-full relative transition-all duration-300 ${currentLesson.isVisible ? 'bg-indigo-600' : 'bg-slate-300'}`}
                       >
                          <div className={`absolute top-1 w-8 h-8 bg-white rounded-full transition-all duration-300 ${currentLesson.isVisible ? 'right-11' : 'right-1'}`}></div>
                       </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm space-y-4 text-right">
                          <div className="flex items-center gap-3 text-emerald-600">
                             <CheckCircle2 className="w-6 h-6" />
                             <label className="text-sm font-black uppercase tracking-widest">{language === 'ar' ? "تاريخ النشر (Publish Date)" : "Publish Date"}</label>
                          </div>
                          <p className="text-slate-400 text-xs font-bold">{language === 'ar' ? "لن يظهر الدرس للطالب قبل هذا التاريخ حتى لو كان وضع \"الظهور\" مفعلاً" : "The lesson will not appear to the student before this date even if Visibility is enabled"}</p>
                          <input 
                            type="datetime-local"
                            value={currentLesson.publishDate || ""}
                            onChange={(e) => setCurrentLesson({...currentLesson, publishDate: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all text-right"
                          />
                       </div>

                       <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm space-y-4 text-right">
                          <div className="flex items-center gap-3 text-red-500">
                             <AlertCircle className="w-6 h-6" />
                             <label className="text-sm font-black uppercase tracking-widest">{language === 'ar' ? "تاريخ الانتهاء (Cut-off Date)" : "Cut-off Date"}</label>
                          </div>
                          <p className="text-slate-400 text-xs font-bold">{language === 'ar' ? "سيختفي الدرس من واجهة الطالب تلقائياً بعد هذا التاريخ" : "The lesson will automatically disappear from the student interface after this date"}</p>
                          <input 
                            type="datetime-local"
                            value={currentLesson.cutOffDate || ""}
                            onChange={(e) => setCurrentLesson({...currentLesson, cutOffDate: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-bold text-slate-700 outline-none focus:border-red-500 transition-all text-right"
                          />
                       </div>
                    </div>
                  </div>
  );
};
