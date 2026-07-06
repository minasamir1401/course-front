"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2, ClipboardList, FileText, HelpCircle, Plus, Save, Trash2 } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";

type ContentType = "Quiz" | "Assignment";

type ContentItem = {
  text: string;
  type: "TEXT" | "MCQ" | "TRUE_FALSE" | "MULTI_SELECT";
  options: string[];
  correctAnswer: string;
  correctAnswers: string[];
  points: number;
  skill: string;
  level: string;
  dok: string;
};

type Props = {
  courseId: string;
  type: ContentType;
  language: string;
  onCancel: () => void;
  onSaved: () => void;
};

const createEmptyItem = (type: ContentType): ContentItem => ({
  text: "",
  type: type === "Quiz" ? "MCQ" : "TEXT",
  options: ["", "", "", ""],
  correctAnswer: "",
  correctAnswers: [],
  points: type === "Quiz" ? 1 : 5,
  skill: type === "Quiz" ? "General" : "Homework",
  level: "Medium",
  dok: "",
});

export default function CourseInlineContentCreator({ courseId, type, language, onCancel, onSaved }: Props) {
  const { showToast } = useNotification();
  const isQuiz = type === "Quiz";
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState({
    title: "",
    description: "",
    subject: "اللغة العربية",
    duration: isQuiz ? 30 : 120,
    passingScore: 50,
    attemptsAllowed: 1,
    startDate: "",
    endDate: "",
    resultVisibility: isQuiz ? "SHOW_ANSWERS" : "SHOW_SCORE",
  });
  const [items, setItems] = useState<ContentItem[]>([]);
  const [currentItem, setCurrentItem] = useState<ContentItem>(createEmptyItem(type));

  const labels = {
    title: isQuiz ? "إنشاء اختبار داخل الكورس" : "إنشاء تكليف داخل الكورس",
    subtitle: isQuiz
      ? "واجهة مستقلة للاختبارات داخل محتوى الكورس بدون فتح صفحة خارجية."
      : "واجهة مستقلة للتكليفات داخل محتوى الكورس بدون فتح صفحة خارجية.",
    itemTitle: isQuiz ? "إضافة سؤال" : "إضافة بند تكليف",
    save: isQuiz ? "حفظ الاختبار" : "حفظ التكليف",
    itemPlaceholder: isQuiz ? "نص السؤال أو الشريحة" : "اكتب المطلوب من الطالب",
    empty: isQuiz ? "لا توجد أسئلة بعد" : "لا توجد بنود تكليف بعد",
    addItem: isQuiz ? "إضافة السؤال للقائمة" : "إضافة البند للقائمة",
    titlePlaceholder: isQuiz ? "عنوان الاختبار" : "عنوان التكليف",
    descriptionPlaceholder: isQuiz ? "وصف مختصر" : "تعليمات التكليف",
    saved: isQuiz ? "تم إنشاء الاختبار وربطه بالكورس" : "تم إنشاء التكليف وربطه بالكورس",
  };

  const Icon = isQuiz ? HelpCircle : ClipboardList;

  const updateOption = (index: number, value: string) => {
    const nextOptions = [...currentItem.options];
    const previousValue = nextOptions[index];
    nextOptions[index] = value;

    setCurrentItem({
      ...currentItem,
      options: nextOptions,
      correctAnswer: currentItem.correctAnswer === previousValue ? value : currentItem.correctAnswer,
      correctAnswers: currentItem.correctAnswers.map(answer => answer === previousValue ? value : answer),
    });
  };

  const toggleCorrectAnswer = (option: string) => {
    if (!option.trim()) return;

    if (currentItem.type === "MULTI_SELECT") {
      setCurrentItem({
        ...currentItem,
        correctAnswers: currentItem.correctAnswers.includes(option)
          ? currentItem.correctAnswers.filter(answer => answer !== option)
          : [...currentItem.correctAnswers, option],
      });
      return;
    }

    setCurrentItem({ ...currentItem, correctAnswer: option });
  };

  const addItem = () => {
    if (!currentItem.text.trim()) {
      showToast(isQuiz ? "يرجى كتابة نص السؤال أولاً (Question text is necessary) ⚠️" : "يرجى كتابة وصف التكليف أولاً ⚠️", "error");
      return;
    }

    if (currentItem.type !== "TEXT") {
      const options = currentItem.type === "TRUE_FALSE" ? ["صحيح", "خطأ"] : currentItem.options.filter(Boolean);
      const hasCorrectAnswer = currentItem.type === "MULTI_SELECT" ? currentItem.correctAnswers.length > 0 : Boolean(currentItem.correctAnswer);

      if (options.length < 2) {
        showToast("يرجى إضافة خيارين على الأقل لهذا السؤال ⚠️", "error");
        return;
      }

      if (!hasCorrectAnswer) {
        showToast("يرجى تحديد الإجابة الصحيحة بالضغط على علامة الصح بجانب الخيار الصحيح ⚠️", "error");
        return;
      }
    }

    const itemToSave = currentItem.type === "TRUE_FALSE"
      ? { ...currentItem, options: ["صحيح", "خطأ", "", ""] }
      : currentItem;

    setItems([...items, itemToSave]);
    setCurrentItem(createEmptyItem(type));
    showToast(isQuiz ? "تمت إضافة السؤال بنجاح ✅" : "تمت إضافة بند التكليف بنجاح ✅", "success");
  };

  const saveContent = async () => {
    if (!info.title.trim()) {
      showToast(isQuiz ? "يرجى كتابة عنوان الاختبار أولاً (Title is required) ⚠️" : "يرجى كتابة عنوان التكليف أولاً ⚠️", "error");
      return;
    }

    if (items.length === 0) {
      showToast(isQuiz ? "يرجى إضافة سؤال واحد على الأقل قبل الحفظ ⚠️" : "يرجى إضافة بند تكليف واحد على الأقل قبل الحفظ ⚠️", "error");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("super_admin_token");
      const payload = {
        title: info.title,
        description: info.description,
        type,
        courseId,
        isCentral: true,
        category: info.subject,
        subjects: [info.subject],
        duration: info.duration,
        passingScore: info.passingScore,
        attemptsAllowed: info.attemptsAllowed,
        startDate: info.startDate || null,
        endDate: info.endDate || null,
        resultVisibility: info.resultVisibility,
        showAnswers: info.resultVisibility === "SHOW_ANSWERS",
        status: "PUBLISHED",
        questions: items.map((item, index) => ({
          ...item,
          options: item.type === "TRUE_FALSE" ? ["صحيح", "خطأ"] : item.options.filter(Boolean),
          points: item.type === "TEXT" && isQuiz ? 0 : item.points,
          order: index,
          explanation: "[]",
        })),
      };

      const res = await fetch(`${API_URL}/exams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || (isQuiz ? "فشل إنشاء الاختبار" : "فشل إنشاء التكليف"));
      }

      showToast(labels.saved, "success");
      onSaved();
    } catch (error: any) {
      showToast(error.message || "حدث خطأ أثناء الحفظ", "error");
    } finally {
      setSaving(false);
    }
  };

  const answerOptions = currentItem.type === "TRUE_FALSE" ? ["صحيح", "خطأ"] : currentItem.options;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className={`rounded-[40px] p-8 text-white shadow-2xl ${isQuiz ? "bg-gradient-to-br from-orange-500 to-amber-500 shadow-orange-500/20" : "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20"}`}>
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center border border-white/20">
              <Icon className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-3xl font-black">{labels.title}</h3>
              <p className="font-bold text-white/80 mt-1">{labels.subtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={onCancel} disabled={saving} className="px-6 py-4 rounded-2xl bg-white/15 hover:bg-white/25 transition-all font-black flex items-center gap-2 disabled:opacity-60">
              <ArrowRight className="w-5 h-5" /> رجوع للمحتوى
            </button>
            <button onClick={saveContent} disabled={saving} className="px-8 py-4 rounded-2xl bg-slate-950 hover:bg-slate-800 transition-all font-black flex items-center gap-2 disabled:opacity-60">
              <Save className="w-5 h-5" /> {saving ? "جاري الحفظ..." : labels.save}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 bg-white rounded-[34px] border border-slate-100 shadow-sm p-7 space-y-5">
          <h4 className="text-xl font-black text-slate-900 flex items-center gap-2"><FileText className={`w-5 h-5 ${isQuiz ? "text-orange-500" : "text-emerald-500"}`} /> البيانات الأساسية</h4>
          <input value={info.title} onChange={(e) => setInfo({ ...info, title: e.target.value })} placeholder={labels.titlePlaceholder} className={`w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold outline-none ${isQuiz ? "focus:border-orange-500" : "focus:border-emerald-500"}`} />
          <textarea value={info.description} onChange={(e) => setInfo({ ...info, description: e.target.value })} placeholder={labels.descriptionPlaceholder} rows={4} className={`w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold outline-none resize-none ${isQuiz ? "focus:border-orange-500" : "focus:border-emerald-500"}`} />
          <input value={info.subject} onChange={(e) => setInfo({ ...info, subject: e.target.value })} placeholder="المادة" className={`w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold outline-none ${isQuiz ? "focus:border-orange-500" : "focus:border-emerald-500"}`} />
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-2 text-xs font-black text-slate-400">المدة بالدقائق<input type="number" min={1} value={info.duration} onChange={(e) => setInfo({ ...info, duration: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-800 outline-none" /></label>
            <label className="space-y-2 text-xs font-black text-slate-400">درجة النجاح<input type="number" min={0} max={100} value={info.passingScore} onChange={(e) => setInfo({ ...info, passingScore: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-800 outline-none" /></label>
          </div>
          <label className="space-y-2 text-xs font-black text-slate-400 block">المحاولات<input type="number" min={1} value={info.attemptsAllowed} onChange={(e) => setInfo({ ...info, attemptsAllowed: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-800 outline-none" /></label>
          <label className="space-y-2 text-xs font-black text-slate-400 block">تاريخ البداية<input type="datetime-local" value={info.startDate} onChange={(e) => setInfo({ ...info, startDate: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-800 outline-none" /></label>
          <label className="space-y-2 text-xs font-black text-slate-400 block">تاريخ النهاية<input type="datetime-local" value={info.endDate} onChange={(e) => setInfo({ ...info, endDate: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-800 outline-none" /></label>
        </div>

        <div className="xl:col-span-8 space-y-6">
          <div className="bg-white rounded-[34px] border border-slate-100 shadow-sm p-7 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h4 className="text-xl font-black text-slate-900 flex items-center gap-2"><Plus className={`w-5 h-5 ${isQuiz ? "text-orange-500" : "text-emerald-500"}`} /> {labels.itemTitle}</h4>
              <span className={`px-4 py-2 rounded-full text-xs font-black ${isQuiz ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"}`}>{items.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select value={currentItem.type} onChange={(e) => setCurrentItem({ ...createEmptyItem(type), type: e.target.value as ContentItem["type"] })} className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-bold outline-none">
                <option value="TEXT">شريحة/تعليمات</option>
                <option value="MCQ">اختيار من متعدد</option>
                <option value="TRUE_FALSE">صح وخطأ</option>
                {isQuiz && <option value="MULTI_SELECT">اختيار متعدد الإجابات</option>}
              </select>
              <input value={currentItem.skill} onChange={(e) => setCurrentItem({ ...currentItem, skill: e.target.value })} placeholder="المهارة" className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-bold outline-none" />
              <select value={currentItem.dok || ""} onChange={(e) => setCurrentItem({ ...currentItem, dok: e.target.value })} className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-bold outline-none">
                <option value="">اختر DOK</option>
                <option value="DOK 1">DOK 1</option>
                <option value="DOK 2">DOK 2</option>
                <option value="DOK 3">DOK 3</option>
                <option value="DOK 4">DOK 4</option>
              </select>
              <input type="number" min={0} value={currentItem.points} onChange={(e) => setCurrentItem({ ...currentItem, points: Number(e.target.value) })} placeholder="الدرجة" className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-bold outline-none" />
            </div>
            <textarea value={currentItem.text} onChange={(e) => setCurrentItem({ ...currentItem, text: e.target.value })} placeholder={labels.itemPlaceholder} rows={5} className={`w-full bg-slate-50 border border-slate-100 rounded-3xl px-5 py-4 font-bold outline-none resize-none ${isQuiz ? "focus:border-orange-500" : "focus:border-emerald-500"}`} />
            {currentItem.type !== "TEXT" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {answerOptions.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <button type="button" onClick={() => toggleCorrectAnswer(option)} className={`w-12 rounded-2xl border font-black ${currentItem.correctAnswer === option || currentItem.correctAnswers.includes(option) ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-slate-300 border-slate-200"}`}>
                      <CheckCircle2 className="w-5 h-5 mx-auto" />
                    </button>
                    <input disabled={currentItem.type === "TRUE_FALSE"} value={option} onChange={(e) => updateOption(index, e.target.value)} placeholder={`اختيار ${index + 1}`} className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-bold outline-none disabled:text-slate-700" />
                  </div>
                ))}
              </div>
            )}
            <button onClick={addItem} className={`w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${isQuiz ? "bg-orange-500 hover:bg-orange-600 text-black" : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}>
              <Plus className="w-5 h-5" /> {labels.addItem}
            </button>
          </div>

          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[34px] p-12 text-center text-slate-400 font-black">{labels.empty}</div>
            ) : items.map((item, index) => (
              <div key={index} className="bg-white border border-slate-100 rounded-3xl p-5 flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${isQuiz ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"}`}>{index + 1}</div>
                  <div className="min-w-0">
                    <div className="font-black text-slate-900 truncate">{item.text}</div>
                    <div className="text-xs font-bold text-slate-400 mt-1">{item.type} {item.dok ? `• ${item.dok}` : ""} • {item.points} درجة</div>
                  </div>
                </div>
                <button onClick={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))} className="p-3 rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
