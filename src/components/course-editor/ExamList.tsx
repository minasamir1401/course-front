"use client";

import React from "react";
import { useCourseEditor } from "./CourseEditorContext";
import { HelpCircle, FileText, Plus, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const ExamList: React.FC = () => {
  const { language } = useLanguage();
  const {
    exams,
    openBankModal,
    isBankModalOpen,
    setIsBankModalOpen,
    bankItems,
    linkExamToCourse,
  } = useCourseEditor();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
          <HelpCircle className="w-8 h-8 text-indigo-600" />
          {language === "ar" ? "الامتحانات والتقييمات المرتبطة" : "Linked Exams & Quizzes"}
        </h3>
        <button
          onClick={openBankModal}
          className="px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 text-white"
        >
          <Plus size={24} />
          {language === "ar" ? "ربط امتحان" : "Link Exam"}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {exams.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[40px] p-12 flex flex-col items-center justify-center text-slate-400 gap-4">
            <HelpCircle className="w-12 h-12" />
            <p className="font-black text-lg">{language === "ar" ? "لا توجد امتحانات مرتبطة بهذا الكورس بعد" : "No exams linked to this course yet"}</p>
          </div>
        ) : (
          exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white border border-slate-100 rounded-[30px] p-5 flex items-center justify-between gap-6 hover:border-indigo-200 transition-all group shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <FileText size={22} />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-lg">{exam.title}</h4>
                  <p className="text-xs text-slate-400 font-bold mt-1">
                    {exam.type === "ASSIGNMENT" ? (language === "ar" ? "تكليف" : "Assignment") : language === "ar" ? "اختبار" : "Quiz"}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isBankModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900">{language === "ar" ? "بنك الأسئلة المركزي" : "Central Question Bank"}</h3>
                <p className="text-slate-400 text-xs font-bold mt-1">
                  {language === "ar" ? "اختر المحتوى الذي ترغب في ربطه بهذا الكورس" : "Select content you want to link to this course"}
                </p>
              </div>
              <button onClick={() => setIsBankModalOpen(false)} className="p-3 hover:bg-slate-200 rounded-2xl transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
              {bankItems.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-bold">
                  {language === "ar" ? "لا توجد عناصر متاحة في البنك المركزي حالياً." : "No items currently available in the central bank."}
                </div>
              ) : (
                bankItems.map((item) => (
                  <div key={item.id} className="p-5 border border-slate-100 rounded-3xl flex items-center justify-between hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          item.type === "ASSIGNMENT" ? "bg-emerald-50 text-emerald-500" : "bg-orange-50 text-orange-500"
                        }`}
                      >
                        {item.type === "ASSIGNMENT" ? <FileText size={20} /> : <HelpCircle size={20} />}
                      </div>
                      <div className="text-right">
                        <div className="font-black text-slate-900">{item.title}</div>
                        <div className="text-[10px] text-slate-400 font-bold mt-1 flex gap-3">
                          <span>{item.type === "ASSIGNMENT" ? (language === "ar" ? "تكليف" : "Assignment") : language === "ar" ? "اختبار" : "Quiz"}</span>
                          <span>•</span>
                          <span>
                            {item._count?.questions || 0} {language === "ar" ? "سؤال" : "questions"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        linkExamToCourse(item.id);
                        setIsBankModalOpen(false);
                      }}
                      className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                      {language === "ar" ? "ربط الآن" : "Link Now"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
