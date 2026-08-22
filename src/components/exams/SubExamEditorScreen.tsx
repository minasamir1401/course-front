"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { ArrowLeft, Calendar, Eye, HelpCircle, Save, Settings } from "lucide-react";

type Props = {
  backHref: string;
  examHref: string;
  currentModule: any;
  activeSubExamIndex: number;
  setCurrentModule: (value: any) => void;
  renderQuestionsBuilder: (source: "questions" | "assignments") => ReactElement;
  handleSubmit: (event: any) => void;
  isLoading: boolean;
  isResolving?: boolean;
  language: string;
};

export default function SubExamEditorScreen({
  backHref,
  examHref,
  currentModule,
  activeSubExamIndex,
  setCurrentModule,
  renderQuestionsBuilder,
  handleSubmit,
  isLoading,
  isResolving,
  language,
}: Props) {
  const subExam = currentModule?.subExams?.[activeSubExamIndex];

  if (isResolving) {
    return (
      <div className="rounded-[32px] bg-white p-12 text-center font-black text-slate-500">
        {language === "ar" ? "جارٍ تحميل بيانات الاختبار..." : "Loading exam data..."}
      </div>
    );
  }

  if (!subExam) {
    return (
      <div className="rounded-[32px] bg-white p-12 text-center font-black text-slate-500">
        {language === "ar" ? "الاختبار غير موجود" : "Exam not found"}
      </div>
    );
  }

  const updateSubExam = (updates: Record<string, any>) => {
    const nextSubExams = [...(currentModule.subExams || [])];
    nextSubExams[activeSubExamIndex] = {
      ...nextSubExams[activeSubExamIndex],
      ...updates,
    };

    setCurrentModule({
      ...currentModule,
      subExams: nextSubExams,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-10" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-6 rounded-[40px] border border-slate-100 bg-white p-8 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-5">
          <Link
            href={backHref}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-400 transition-all hover:bg-indigo-50 hover:text-indigo-600"
          >
            <ArrowLeft className="h-7 w-7" />
          </Link>
          <div className="space-y-2">
            <div className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600">
              {language === "ar" ? "تحرير اختبار" : "Edit Exam"}
            </div>
            <h1 className="text-3xl font-black text-slate-900">
              {subExam.title || (language === "ar" ? "اختبار بدون عنوان" : "Untitled Exam")}
            </h1>
            <p className="text-sm font-bold text-slate-400">
              {language === "ar"
                ? "كل ما في هذه الصفحة يخص الاختبار فقط: الاسم، التواريخ، المحاولات، والأسئلة."
                : "Everything here belongs to the exam only: title, dates, attempts, and questions."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={examHref}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-3 text-sm font-black text-indigo-600 transition-all hover:bg-indigo-100"
          >
            <Eye className="h-4 w-4" />
            {language === "ar" ? "معاينة الطالب" : "Student Preview"}
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-black text-white transition-all hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isLoading ? (language === "ar" ? "جارٍ الحفظ..." : "Saving...") : (language === "ar" ? "حفظ الاختبار" : "Save Exam")}
          </button>
        </div>
      </div>

      <div className="rounded-[36px] border border-slate-100 bg-white p-7 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <Settings className="h-5 w-5 text-indigo-600" />
          <h2 className="text-2xl font-black text-slate-900">
            {language === "ar" ? "إعدادات الاختبار" : "Exam Settings"}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
              {language === "ar" ? "اسم الاختبار" : "Exam Title"}
            </label>
            <input
              type="text"
              value={subExam.title || ""}
              onChange={(event) => updateSubExam({ title: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-900 outline-none transition-all focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
              {language === "ar" ? "المدة بالدقائق" : "Duration (mins)"}
            </label>
            <input
              type="number"
              value={subExam.duration || ""}
              onChange={(event) => updateSubExam({ duration: event.target.value ? Number(event.target.value) : undefined })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-900 outline-none transition-all focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
              {language === "ar" ? "درجة النجاح" : "Passing Score"}
            </label>
            <input
              type="number"
              value={subExam.passingScore || ""}
              onChange={(event) => updateSubExam({ passingScore: event.target.value ? Number(event.target.value) : undefined })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-900 outline-none transition-all focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
              {language === "ar" ? "المحاولات المسموحة" : "Attempts Allowed"}
            </label>
            <input
              type="number"
              value={subExam.attemptsAllowed || ""}
              onChange={(event) => updateSubExam({ attemptsAllowed: event.target.value ? Number(event.target.value) : undefined })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-900 outline-none transition-all focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
              {language === "ar" ? "تاريخ النشر" : "Publish Date"}
            </label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="datetime-local"
                value={subExam.publishDate || ""}
                onChange={(event) => updateSubExam({ publishDate: event.target.value || undefined })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 font-bold text-slate-900 outline-none transition-all focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
              {language === "ar" ? "تاريخ الإغلاق" : "Cut-off Date"}
            </label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="datetime-local"
                value={subExam.cutOffDate || ""}
                onChange={(event) => updateSubExam({ cutOffDate: event.target.value || undefined })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 font-bold text-slate-900 outline-none transition-all focus:border-red-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[36px] border border-slate-100 bg-white p-7 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <HelpCircle className="h-5 w-5 text-amber-500" />
          <h2 className="text-2xl font-black text-slate-900">
            {language === "ar" ? "أسئلة الاختبار" : "Exam Questions"}
          </h2>
        </div>
        {renderQuestionsBuilder("questions")}
      </div>
    </form>
  );
}
