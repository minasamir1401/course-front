"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Edit2, HelpCircle, Plus, Settings } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";

export default function ExamModulePortal({ state, moduleId, language, role }: any) {
  const router = useRouter();
  const { showToast } = useNotification();
  const examModule = (state.modules || []).find((item: any) => item.id === moduleId);
  const [showSettings, setShowSettings] = useState(false);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  if (!examModule) return <div className="rounded-[32px] bg-white p-12 text-center font-black text-slate-500">{language === "ar" ? "الموديول غير موجود" : "Module not found"}</div>;

  const tokenKey = role === "SCHOOL_ADMIN" ? "school_admin_token" : "super_admin_token";
  const exams = examModule.subExams || [];
  const questions = exams.reduce((total: number, exam: any) => total + (exam.questions?.length || exam.questionsCount || exam._count?.questions || 0), 0);

  const createExam = async () => {
    if (!title.trim()) {
      showToast(language === "ar" ? "اكتب اسم الاختبار أولًا" : "Enter the exam name first", "error");
      titleInputRef.current?.focus();
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/exams/${state.createdIdRef.current}/modules/${moduleId}/exams`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem(tokenKey) || ""}` },
        body: JSON.stringify({ title: title.trim() })
      });
      if (!res.ok) throw new Error("create failed");
      const created = await res.json();
      state.setModules((currentModules: any[]) => currentModules.map((currentModule: any) =>
        currentModule.id === moduleId
          ? { ...currentModule, subExams: [...(currentModule.subExams || []), created] }
          : currentModule,
      ));
      setTitle("");
      showToast(language === "ar" ? "تم إنشاء الاختبار" : "Exam created successfully", "success");
    } catch (error) {
      console.error(error);
      showToast(language === "ar" ? "تعذر إنشاء الاختبار" : "Failed to create exam", "error");
    } finally {
      setCreating(false);
    }
  };

  return <div className="space-y-8" dir={language === "ar" ? "rtl" : "ltr"}>
    <div className="rounded-[36px] bg-white border border-slate-100 shadow-sm p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-500">←</button>
        <div><div className="text-xs font-black text-indigo-600 uppercase tracking-widest">{language === "ar" ? "بوابة Module الاختبارات" : "Exam Module Portal"}</div><h1 className="text-3xl font-black text-slate-900 mt-1">{examModule.title}</h1><p className="text-slate-400 font-bold mt-1">{examModule.description || (language === "ar" ? "أنشئ الاختبارات داخل هذا الموديول فقط" : "Create exams inside this module only")}</p></div>
      </div>
      <button onClick={() => setShowSettings(v => !v)} className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-5 py-3 text-sm font-black text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"><Settings className="w-4 h-4" />{language === "ar" ? "إظهار إعدادات الموديول" : "Show Module Settings"}</button>
    </div>

    {showSettings && <div className="rounded-[30px] bg-indigo-50/60 border border-indigo-100 p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-black text-slate-600"><div>{language === "ar" ? "المدة" : "Duration"}: {examModule.duration || "—"}</div><div>{language === "ar" ? "درجة النجاح" : "Passing score"}: {examModule.passingScore || "—"}</div><div>{language === "ar" ? "حالة النشر" : "Visibility"}: {examModule.isVisible === false ? "Hidden" : "Visible"}</div></div>}

    <div className="rounded-[36px] bg-white border border-slate-100 shadow-sm p-7">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6"><div><h2 className="text-2xl font-black text-slate-900">{language === "ar" ? "الاختبارات" : "Exams"}</h2><p className="text-slate-400 font-bold mt-1">{exams.length} {language === "ar" ? "اختبارات" : "exams"} · {questions} {language === "ar" ? "سؤال" : "questions"}</p></div><div className="flex gap-2 w-full md:w-auto"><input ref={titleInputRef} value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === "Enter") createExam(); }} placeholder={language === "ar" ? "اسم الاختبار الجديد" : "New exam name"} className="min-w-0 flex-1 md:w-56 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:border-indigo-500" /><button disabled={creating} onClick={createExam} className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-white font-black disabled:opacity-50"><Plus className="w-5 h-5" />{language === "ar" ? "إنشاء اختبار" : "Create Exam"}</button></div></div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{exams.map((exam: any, index: number) => <div key={exam.id || index} className="rounded-3xl border border-slate-100 bg-slate-50 p-5"><div className="flex items-start justify-between gap-3"><div className="w-12 h-12 rounded-2xl bg-white text-indigo-600 flex items-center justify-center"><BookOpen className="w-6 h-6" /></div><button onClick={() => router.push(`${role === "SCHOOL_ADMIN" ? "/school-admin" : "/super-admin"}/exams/edit/${state.createdIdRef.current}?moduleId=${encodeURIComponent(moduleId)}&subExamId=${encodeURIComponent(exam.id)}`)} className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-indigo-600 flex items-center justify-center"><Edit2 className="w-4 h-4" /></button></div><h3 className="mt-5 text-xl font-black text-slate-900 truncate">{exam.title}</h3><div className="mt-3 flex items-center gap-2 text-xs font-black text-slate-400"><HelpCircle className="w-4 h-4 text-amber-500" />{exam.questions?.length || exam.questionsCount || exam._count?.questions || 0} {language === "ar" ? "سؤال" : "questions"}</div></div>)}</div>
      {exams.length === 0 && <div className="rounded-3xl border-2 border-dashed border-slate-200 py-16 text-center text-slate-400 font-black">{language === "ar" ? "لا توجد اختبارات بعد. أنشئ أول اختبار من هنا." : "No exams yet. Create the first exam here."}</div>}
    </div>
  </div>;
}
