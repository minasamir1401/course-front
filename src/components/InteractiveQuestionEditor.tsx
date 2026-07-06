"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, HelpCircle, Sparkles, Info } from "lucide-react";
import GeoGebraWidget from "./GeoGebraWidget";

interface EditorProps {
  question: any;
  onChange: (updatedQ: any) => void;
  language: string;
}

// Safely parse JSON
const parseJson = (str: any, fallback: any = {}) => {
  try {
    if (str === undefined || str === null) return fallback;
    let parsed = str;
    if (typeof str === "string") {
      const trimmed = str.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[") || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
        try {
          parsed = JSON.parse(trimmed);
        } catch {
          parsed = trimmed;
        }
      } else {
        return fallback;
      }
    }
    if (typeof parsed !== "object" || parsed === null) {
      // If it parsed into a plain string/number/boolean, return it
      return parsed;
    }
    if (fallback && !Array.isArray(fallback) && Array.isArray(parsed)) {
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
};

const guides: Record<string, { title: string; desc: string; example: string; steps: string }> = {
  MCQ: {
    title: "اختيار من متعدد (MCQ)",
    desc: "سؤال تقليدي وسهل، بتكتب فيه سؤال وشوية خيارات للطالب، وهو بيختار إجابة واحدة بس هي اللي صح.",
    example: "السؤال: 'مين هو عميد الأدب العربي؟' -> الخيارات: [طه حسين، نجيب محفوظ، عباس العقاد] -> الإجابة الصح: طه حسين.",
    steps: "اكتب خيارات الإجابة في الحقول تحت، وعلم على الدائرة الصغيرة اللي جنب الإجابة الصح عشان السيستم يعرفها."
  },
  TRUE_FALSE: {
    title: "صح أم خطأ (True/False)",
    desc: "عبارة أو معلومة واضحة، والطالب بيحدد إذا كانت المعلومة دي صحيحة (صواب) ولا خاطئة (خطأ).",
    example: "السؤال: 'أكلة الكشري من أشهر الأكلات الشعبية في مصر.' -> الإجابة الصح: صح.",
    steps: "اختار الإجابة الصحيحة مباشرة تحت سواء كانت 'صح' أو 'خطأ'."
  },
  MULTI_SELECT: {
    title: "اختيارات متعددة (Multi-Select)",
    desc: "سؤال شبه الاختيار من متعدد، بس هنا مسموح للطالب يختار أكتر من إجابة صحيحة في نفس الوقت.",
    example: "السؤال: 'مين من المحافظات دي بتطل على البحر الأحمر؟' -> الخيارات: [الغردقة، الإسكندرية، السويس، مطروح] -> الإجابات الصح: [الغردقة، السويس].",
    steps: "اكتب كل الخيارات المتاحة، وعلم على مربعات الصح (Checkbox) لكل الإجابات المظبوطة."
  },
  MATCHING: {
    title: "سؤال التوصيل (Matching)",
    desc: "لعبة توصيل كلاسيكية، بتعمل عمودين (يمين وشمال)، والطالب بيوصل كل كلمة أو صورة باللي يناسبها.",
    example: "التوصيل بين المحافظة والرمز بتاعها: (الجيزة ↔ الأهرامات)، (الإسكندرية ↔ قلعة قايتباي)، (الأقصر ↔ معبد الكرنك).",
    steps: "اكتب الكلمة اليمين في خانة 'العنصر الأيمن'، واكتب الكلمة المطابقة ليها في خانة 'العنصر المقابل'، واضغط 'إضافة الزوج'. كرر ده لكل العناصر."
  },
  DRAG_DROP_FILL: {
    title: "سحب الفراغات (Drag & Drop Fill)",
    desc: "بتكتب جملة كاملة وتحدد الفراغات برموز خاصة، وتحت بتكتب الكلمات اللي الطالب هيسحبها ويحطها في الفراغ المناسب.",
    example: "الجملة: 'تبنى الأهرامات في محافظة [slot0] بينما يقع السد العالي في [slot1].' -> الكلمات الصح: [slot0 ↔ الجيزة]، [slot1 ↔ أسوان].",
    steps: "اكتب جملتك وحط الرمز [slot0] للفراغ الأول و [slot1] للفراغ الثاني وهكذا. بعد كده ضيف الكلمات الاختيارية تحت، وحدد الكلمة الصح لكل فراغ."
  },
  GROUP_SORTING: {
    title: "تصنيف المجموعات (Group Sorting)",
    desc: "بتعمل مجموعتين أو أكتر (تصنيفات)، وبتديله كروت متلخبطة، والطالب مطلوب منه يسحب كل كارت للمجموعة الصح بتاعته.",
    example: "المجموعات: [أكلات حلوة، أكلات حادقة] -> الكروت: (بسبوسة ↔ أكلات حلوة)، (كشري ↔ أكلات حادقة)، (كنافة ↔ أكلات حلوة).",
    steps: "اكتب اسم المجموعة واضغط 'إضافة مجموعة'. بعدين اكتب اسم الكارت واختار مجموعته واضغط 'إضافة بطاقة'."
  },
  NUMBER_LINE: {
    title: "خط الأعداد (Number Line)",
    desc: "خط أعداد تفاعلي ومرسوم، بتحدد بدايته ونهايته ونقطة معينة الطالب بيحرك المؤشر عشان يقف عليها.",
    example: "تمثيل الكسور: البداية: 0، النهاية: 1، الخطوة: 0.25 (ربع) -> الإجابة المطلوبة: 0.5 (النصف).",
    steps: "حدد بداية الخط ونهايته ومقدار التقسيم (الخطوة)، واكتب الرقم الصحيح اللي الطالب لازم يقف عنده."
  },
  CLOCK: {
    title: "عقارب الساعة (Clock)",
    desc: "ساعة دائرية تفاعلية بعقارب حقيقية (ساعات ودقائق)، الطالب بيسحب العقارب بإيده عشان يظبط الوقت المطلوب منه.",
    example: "السؤال: 'اظبط عقارب الساعة على ميعاد الفطار الساعة 7 وربع الصبح.' -> الإجابة الصح: 07:15.",
    steps: "اختر الساعة والدقائق المظبوطة من القوائم تحت، ودي هتكون الإجابة اللي الطالب لازم يظبط عقاربه عليها."
  },
  MIND_MAP: {
    title: "خريطة مفاهيم (Mind Map)",
    desc: "خريطة شجرية متفرعة بتعرض تسلسل الأفكار، بتسيب فيها عقد أو مفاهيم فارغة والطالب بيسحب الكلمة الصح لمكانها في الشجرة.",
    example: "العقدة الرئيسية: 'أقسام الكلمة' يتفرع منها: ['اسم' (فراغ)، 'فعل' (فراغ)، 'حرف' (فراغ)].",
    steps: "اكتب اسم المفهوم واختار المفهوم الأب بتاعه، ولو عايزه يظهر كفراغ للطالب علم على 'فراغ يقوم الطالب بسحبه' واضغط إضافة."
  },
  VIDEO_CHECKPOINT: {
    title: "فيديو تفاعلي (Video Checkpoint)",
    desc: "بتعرض فيديو تعليمي، وعند ثانية معينة الفيديو بيقف إجباري ويظهر سؤال اختيار من متعدد يختبر فهم الطالب قبل ما يكمل.",
    example: "فيديو بيشرح الأهرامات، وعند الثانية 30 يقف ويسأل: 'مين بنا الهرم الأكبر؟' -> الاختيارات: [خوفو، خفرع، منكاورع] -> الإجابة الصح: خوفو.",
    steps: "حط رابط الفيديو، واكتب زمن الوقف بالثواني، وضيف السؤال والاختيارات وحدد الإجابة الصح واضغط إضافة."
  },
  SWIPE_SORT: {
    title: "سحب سريع لليمين/اليسار (Swipe Sort)",
    desc: "لعبة كروت سريعة شبه تندر! بيظهر كارت في النص، والطالب بيسحبه يمين لو ينتمي للمجموعة اليمين، أو شمال لو ينتمي للمجموعة الشمال.",
    example: "فرز السلوكيات: يمين (سلوك ممتاز) ↔ مساعدة المحتاج، شمال (سلوك خاطئ) ↔ إلقاء القمامة في الشارع.",
    steps: "اكتب اسم المجموعة اليمين والمجموعة الشمال. بعد كده اكتب الكلمات وحدد اتجاه السحب الصح لكل كلمة."
  },
  MAZE: {
    title: "المتاهة التعليمية (Maze)",
    desc: "لعبة أركيد ممتعة، الطالب بيتحكم بشخصية بتتحرك جوه متاهة وبيحاول يوصل للإجابة الصحيحة ويهرب من الوحوش اللي بتطارده.",
    example: "السؤال: 'حاصل ضرب 4 × 3 يساوي كم؟' -> الإجابة الصح: 12. الإجابات الغلط لتشتيت الطالب: [7، 16، 9].",
    steps: "اكتب السؤال، وحدد الإجابة الصحيحة، وضيف شوية إجابات خاطئة تتوزع في ممرات المتاهة لتصعيب اللعبة."
  },
  WORD_SEARCH: {
    title: "البحث عن الكلمات (Word Search)",
    desc: "جدول مليان حروف متلخبطة، والطالب بيحاول يجمع الكلمات المطلوبة منه بتوصيل الحروف جنب بعضها بالطول أو العرض.",
    example: "السؤال: 'ابحث عن أسماء فواكه صيفية.' -> الكلمات المطلوبة: [مانجو، بطيخ، تين].",
    steps: "اكتب الكلمات المطلوبة واضغط إضافة، والسيستم هيعمل جدول الحروف ويلخبطها تلقائياً."
  },
  GEOGEBRA: {
    title: "أداة جيوجيبرا (GeoGebra)",
    desc: "أداة هندسية ورياضية تفاعلية ممتازة لرسم الأشكال الهندسية، الدوال البيانية، وقياس الزوايا والمساحات.",
    example: "رسم وتحديد أضلاع المثلث القائم أو رسم الدالة التربيعية ص = س².",
    steps: "حط معرف الأداة (Material ID) من موقع GeoGebra عشان تظهر للطالب في الامتحان تفاعلياً."
  },
  FLASH_CARD: {
    title: "البطاقات التعليمية (Flash Cards)",
    desc: "كروت بوجهين، الطالب بيقرأ الكلمة أو السؤال على الوش، ويضغط على الكارت عشان يتقلب ويشوف الإجابة أو المعنى على الضهر لتعزيز الحفظ.",
    example: "وش الكارت: 'الفسطاط' -> ضهر الكارت: 'أول عاصمة إسلامية لمصر بناها عمرو بن العاص'.",
    steps: "اكتب الكلمة أو السؤال للوجه الأمامي، والمعنى أو الحل للوجه الخلفي واضغط إضافة."
  },
  MEMORY_GAME: {
    title: "لعبة الذاكرة (Memory Game)",
    desc: "كروت مقلوبة على الشاشة، الطالب بيقلب كارتين كارتين ويحاول يطابق الكروت اللي ليها نفس المعنى أو الكلمة وجمعها.",
    example: "الكارت الأول: 'كتاب'، الكارت المطابق ليه: 'كتب' (مفرد وجمع). أو (مصر ↔ القاهرة).",
    steps: "اكتب الكلمة الأولى وجنبها الكلمة المطابقة ليها واضغط 'إضافة زوج'، واللعبة هتلخبطهم وتخفيهم تلقائياً."
  },
  WORD_SCRAMBLE: {
    title: "ترتيب الحروف (Word Scramble)",
    desc: "كلمة حروفها متلخبطة على الشاشة، والطالب مطلوب منه يرتب الحروف ورا بعضها بشكل صحيح عشان يجمع الكلمة.",
    example: "الحروف المتلخبطة: [ق - ه - ر - ا - ة] -> الترتيب الصحيح: القاهرة.",
    steps: "اكتب الكلمة الصحيحة مظبوطة ومرتبة، واللعبة هتلخبط الحروف للطالب تلقائياً."
  },
  SENTENCE_REORDER: {
    title: "ترتيب الجملة (Sentence Reorder)",
    desc: "جملة مفيدة كلماتها متلخبطة، والطالب بيسحب الكلمات ويرتبها جنب بعضها عشان يركب الجملة بشكل صح.",
    example: "الكلمات المتلخبطة: [مصر، الدنيا، أم، هي] -> الترتيب الصحيح: مصر هي أم الدنيا.",
    steps: "اكتب الجملة كاملة ومرتبة بشكل صحيح، والسيستم هيقسم الكلمات ويلخبطها للطالب تلقائياً."
  },
  MATH_EQUATION: {
    title: "معادلة حسابية (Math Equation)",
    desc: "سؤال رياضيات بيحتاج إدخال إجابة دقيقة بصيغة رياضية، وبنوفر للطالب كيبورد رموز رياضية تفاعلية (جذور، كسور، أسس).",
    example: "السؤال: 'حل المعادلة: س + ٣ = ٧' -> الإجابة الصح: س = ٤ (أو 4).",
    steps: "اكتب السؤال الرياضي، وحدد صيغة الإجابة الصحيحة بدقة في خانة الحل."
  },
  SEQUENCE_ORDER: {
    title: "ترتيب التسلسل (Sequence Order)",
    desc: "مجموعة من الخطوات، الأحداث التاريخية، أو الأرقام، وطلب من الطالب ترتيبها من البداية للنهاية.",
    example: "خطوات عمل الشاي الكشري: (1. ضع الشاي والسكر في الكوب، 2. صب الماء المغلي، 3. قلب جيداً).",
    steps: "اكتب الخطوات بالترتيب الصحيح من فوق لتحت، والسيستم هيلخبطهم للطالب وهو هيرتبهم."
  },
  CROSSWORD: {
    title: "الكلمات المتقاطعة (Crossword)",
    desc: "مربعات متقاطعة كلاسيكية، بيظهر للطالب تلميحات رأسية وأفقية وهو بيملا المربعات بالحروف لتكوين الكلمات.",
    example: "أفقي 1: 'عاصمة مصر' (القاهرة)، رأسي 2: 'أطول نهر في العالم' (النيل).",
    steps: "اكتب الكلمة الصحيحة، والتلميح بتاعها، وحدد اتجاهها (أفقي أو رأسي) واضغط إضافة."
  },
  COUNT_OBJECTS: {
    title: "عد العناصر (Count Objects)",
    desc: "سؤال تفاعلي بيعرض مجموعة صور لعناصر مكررة (تفاح، كور، أهرامات)، والطالب بيعدها ويكتب الرقم المظبوط.",
    example: "صورة فيها 5 أهرامات صغيرة -> السؤال: 'عد الأهرامات في الصورة' -> الإجابة الصح: 5.",
    steps: "ارفع الصورة أو حدد نوع العناصر وعددها، واكتب الرقم الصحيح كإجابة."
  },
  IMAGE_LABEL: {
    title: "تسمية الصورة (Image Labeling)",
    desc: "بتجيب صورة (زي خريطة أو رسمة جهاز في العلوم)، وتحط نقط معينة عليها، والطالب بيسحب الكلمة الصح لكل نقطة في الصورة.",
    example: "خريطة جمهورية مصر العربية: (نقطة فوق ↔ البحر المتوسط)، (نقطة يمين ↔ البحر الأحمر).",
    steps: "ارفع الصورة، وعلم على الأماكن المحددة بالإحداثيات، واكتب الاسم الصح لكل مكان."
  },
  COLOR_MATCH: {
    title: "تطابق الألوان (Color Match)",
    desc: "لعبة بصرية لمطابقة العناصر أو الكرات الملونة حسب لون السلة أو الهدف لتنمية الذكاء البصري للأطفال.",
    example: "سحب الكرات الحمراء لسلة الفراولة، والكرات الصفراء لسلة الموز.",
    steps: "حدد الألوان المتاحة والربط الصحيح بين العناصر وألوانها لتوليد اللعبة."
  }
};

function GameGuide({ type }: { type: string }) {
  const guide = guides[type];
  if (!guide) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50/75 via-sky-50/40 to-white rounded-3xl border border-indigo-100/60 p-5 shadow-sm space-y-4 text-right animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-start gap-3 justify-start">
        <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h4 className="font-black text-sm text-indigo-950 flex items-center gap-2">
            <span>دليل ومثال محرر: {guide.title}</span>
          </h4>
          <p className="text-xs font-bold text-indigo-900/85 leading-relaxed">
            {guide.desc}
          </p>
        </div>
      </div>
      
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-indigo-50/70 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-indigo-700 font-black">
          <Info className="w-4 h-4" />
          <span>مثال توضيحي (مصري بسيط):</span>
        </div>
        <p className="font-bold text-slate-700 leading-relaxed">
          {guide.example}
        </p>
        
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
          <span className="font-black text-indigo-950 block">خطوات العمل في هذا المحرر:</span>
          <p className="font-bold text-slate-500 leading-relaxed">
            {guide.steps}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function InteractiveQuestionEditor({ question, onChange, language }: EditorProps) {
  const updateQuestionData = (optionsObj: any, correctAnswerVal: any) => {
    onChange({
      ...question,
      options: typeof optionsObj === "string" ? optionsObj : JSON.stringify(optionsObj),
      correctAnswer: typeof correctAnswerVal === "string" ? correctAnswerVal : JSON.stringify(correctAnswerVal)
    });
  };

  const renderEditor = () => {
    switch (question.type) {
      case "MCQ":
        return <McqEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "TRUE_FALSE":
        return <TrueFalseEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "MULTI_SELECT":
        return <MultiSelectEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "MATCHING":
        return <MatchingEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "DRAG_DROP_FILL":
        return <DragDropFillEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "GROUP_SORTING":
        return <GroupSortingEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "CLOCK":
        return <ClockEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "MIND_MAP":
        return <MindMapEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "VIDEO_CHECKPOINT":
        return <VideoCheckpointEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "NUMBER_LINE":
        return <NumberLineEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "SWIPE_SORT":
        return <SwipeSortEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "MAZE":
        return <MazeEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "WORD_SEARCH":
        return <WordSearchEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "GEOGEBRA":
        return <GeoGebraEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "FLASH_CARD":
        return <FlashCardEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "MEMORY_GAME":
        return <MemoryGameEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "WORD_SCRAMBLE":
        return <WordScrambleEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "SENTENCE_REORDER":
        return <SentenceReorderEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "MATH_EQUATION":
        return <MathEquationEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "SEQUENCE_ORDER":
        return <SequenceOrderEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "CROSSWORD":
        return <CrosswordEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "COUNT_OBJECTS":
        return <CountObjectsEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "IMAGE_LABEL":
        return <ImageLabelEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      case "COLOR_MATCH":
        return <ColorMatchEditor question={question} updateQuestionData={updateQuestionData} language={language} />;
      default:
        return (
          <div className="p-4 text-center text-slate-400 font-bold w-full max-w-full">
            {language === "ar" ? "يرجى تحديد نوع نشاط متاح باليمين للبدء بالتحرير المرئي." : "Please select an available activity type to start visual editing."}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full text-right" dir="rtl">
      <GameGuide type={question.type} />
      <div className="pt-6 border-t border-slate-100">
        <div key={`${question.type}-${question.id || question.title || 'new'}`}>
          {renderEditor()}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 📝 1. MCQ (اختيار من متعدد)
// -------------------------------------------------------------
// -------------------------------------------------------------
// 📝 1. MCQ (اختيار من متعدد)
// -------------------------------------------------------------
function McqEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { choices: ["", "", "", ""] });
  const choices = Array.isArray(opts?.choices) ? opts.choices : ["", "", "", ""];
  const correctVal = question.correctAnswer || "";

  const handleChoiceChange = (idx: number, val: string) => {
    const nextChoices = [...choices];
    nextChoices[idx] = val;
    updateQuestionData({ choices: nextChoices }, correctVal);
  };

  const addChoiceField = () => {
    updateQuestionData({ choices: [...choices, ""] }, correctVal);
  };

  const removeChoiceField = (idx: number) => {
    if (choices.length <= 2) return;
    const targetVal = choices[idx];
    const nextChoices = choices.filter((_: any, i: number) => i !== idx);
    const nextCorrect = correctVal === targetVal ? "" : correctVal;
    updateQuestionData({ choices: nextChoices }, nextCorrect);
  };

  return (
    <div className="space-y-4 text-right w-full max-w-full overflow-hidden" dir="rtl">
      <div className="flex justify-between items-center">
        <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">
          {language === 'ar' ? "خيارات الإجابة (اختيار من متعدد MCQ):" : "Answer Choices (Multiple Choice MCQ):"}
        </h5>
        <button
          type="button"
          onClick={addChoiceField}
          className="text-xs font-black text-indigo-650 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{language === 'ar' ? "إضافة خيار" : "Add Option"}</span>
        </button>
      </div>

      <div className="space-y-3">
        {choices.map((c: string, idx: number) => {
          const isCorrect = correctVal === c && c !== "";
          return (
            <div 
              key={idx} 
              className={`flex gap-3 items-center w-full p-3 rounded-2xl border transition-all duration-200 ${
                isCorrect 
                  ? "bg-indigo-50/40 border-indigo-300 shadow-sm" 
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <input
                type="radio"
                name={`mcq-correct-${question.id || 'new'}`}
                checked={isCorrect}
                disabled={c === ""}
                onChange={() => updateQuestionData({ choices }, c)}
                className="w-5 h-5 accent-indigo-600 cursor-pointer shrink-0"
              />
              <input
                type="text"
                placeholder={language === 'ar' ? `اكتب الخيار ${idx + 1}...` : `Option ${idx + 1}...`}
                className="flex-1 min-w-0 bg-transparent border-none outline-none font-bold text-slate-800 text-xs py-1"
                value={c}
                onChange={(e) => handleChoiceChange(idx, e.target.value)}
              />
              {choices.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeChoiceField(idx)}
                  className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-white rounded-lg transition-all shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>{language === 'ar' ? "اكتب خيارات السؤال وحدد الدائرة للإجابة الصحيحة (تنبيه: يجب ألا تكون فارغة لتحديدها)." : "Type the options and select the radio button for the correct answer (Note: cannot select empty option)."}</span>
      </p>
    </div>
  );
}

// -------------------------------------------------------------
// 📝 2. TRUE_FALSE (صح أم خطأ)
// -------------------------------------------------------------
function TrueFalseEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const correctVal = question.correctAnswer || "صح";
  const isTrueVal = (v: any) => ["صح", "صحيح", "صواب", "true", "1"].includes(String(v || "").trim().toLowerCase()) || String(v) === "True";
  const isFalseVal = (v: any) => ["خطأ", "false", "0", "غير صحيح"].includes(String(v || "").trim().toLowerCase()) || String(v) === "False";

  const setCorrect = (val: string) => {
    updateQuestionData({ choices: ["صح", "خطأ"] }, val);
  };

  const isTrue = isTrueVal(correctVal);
  const isFalse = isFalseVal(correctVal);

  return (
    <div className="space-y-4 text-right w-full max-w-full overflow-hidden" dir="rtl">
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
        <span>{language === 'ar' ? "حدد الإجابة الصحيحة للنشاط:" : "Select the Correct Answer:"}</span>
      </h5>
      <div className="grid grid-cols-2 gap-4 py-2">
        <button
          type="button"
          onClick={() => setCorrect("صح")}
          className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
            isTrue 
              ? "bg-emerald-50/70 border-emerald-500 shadow-md shadow-emerald-500/10 text-emerald-700" 
              : "bg-slate-50/50 border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300"
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${isTrue ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <span className="font-black text-sm">{language === 'ar' ? "صح (صواب)" : "True"}</span>
        </button>

        <button
          type="button"
          onClick={() => setCorrect("خطأ")}
          className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
            isFalse 
              ? "bg-rose-50/70 border-rose-500 shadow-md shadow-rose-500/10 text-rose-700" 
              : "bg-slate-50/50 border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300"
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${isFalse ? "bg-rose-500 text-white" : "bg-slate-200 text-slate-400"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <span className="font-black text-sm">{language === 'ar' ? "خطأ (خاطئ)" : "False"}</span>
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 📝 3. MULTI_SELECT (اختيارات متعددة)
// -------------------------------------------------------------
function MultiSelectEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { choices: ["", "", "", ""] });
  const choices = Array.isArray(opts?.choices) ? opts.choices : ["", "", "", ""];
  const rawCorrect = parseJson(question.correctAnswer, []);
  const correctList = Array.isArray(rawCorrect) ? rawCorrect : [rawCorrect];

  const handleChoiceChange = (idx: number, val: string) => {
    const nextChoices = [...choices];
    nextChoices[idx] = val;
    updateQuestionData({ choices: nextChoices }, correctList);
  };

  const addChoiceField = () => {
    updateQuestionData({ choices: [...choices, ""] }, correctList);
  };

  const removeChoiceField = (idx: number) => {
    if (choices.length <= 2) return;
    const targetVal = choices[idx];
    const nextChoices = choices.filter((_: any, i: number) => i !== idx);
    const nextCorrect = correctList.filter(x => x !== targetVal);
    updateQuestionData({ choices: nextChoices }, nextCorrect);
  };

  const handleCheckChange = (c: string, checked: boolean) => {
    let nextCorrect = [...correctList];
    if (checked) {
      if (!nextCorrect.includes(c)) nextCorrect.push(c);
    } else {
      nextCorrect = nextCorrect.filter((x) => x !== c);
    }
    updateQuestionData({ choices }, nextCorrect);
  };

  return (
    <div className="space-y-4 text-right w-full max-w-full overflow-hidden" dir="rtl">
      <div className="flex justify-between items-center">
        <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">
          {language === 'ar' ? "خيارات الإجابة (اختيار متعدد Checkboxes):" : "Answer Choices (Multi-Select Checkboxes):"}
        </h5>
        <button
          type="button"
          onClick={addChoiceField}
          className="text-xs font-black text-indigo-650 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{language === 'ar' ? "إضافة خيار" : "Add Option"}</span>
        </button>
      </div>

      <div className="space-y-3">
        {choices.map((c: string, idx: number) => {
          const isCorrect = correctList.includes(c) && c !== "";
          return (
            <div 
              key={idx} 
              className={`flex gap-3 items-center w-full p-3 rounded-2xl border transition-all duration-200 ${
                isCorrect 
                  ? "bg-indigo-50/40 border-indigo-300 shadow-sm" 
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <input
                type="checkbox"
                checked={isCorrect}
                disabled={c === ""}
                onChange={(e) => handleCheckChange(c, e.target.checked)}
                className="w-5 h-5 accent-indigo-650 cursor-pointer rounded shrink-0"
              />
              <input
                type="text"
                placeholder={language === 'ar' ? `اكتب الخيار ${idx + 1}...` : `Option ${idx + 1}...`}
                className="flex-1 min-w-0 bg-transparent border-none outline-none font-bold text-slate-800 text-xs py-1"
                value={c}
                onChange={(e) => handleChoiceChange(idx, e.target.value)}
              />
              {choices.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeChoiceField(idx)}
                  className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-white rounded-lg transition-all shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>{language === 'ar' ? "يمكنك تفعيل أكثر من إجابة صحيحة بالضغط على مربعات الصح." : "You can select multiple correct options by checking the checkboxes."}</span>
      </p>
    </div>
  );
}

// -------------------------------------------------------------
// 🤝 4. MATCHING (توصيل)
// -------------------------------------------------------------
function MatchingEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { left: [], right: [] });
  const left = Array.isArray(opts?.left) ? opts.left : [];
  const right = Array.isArray(opts?.right) ? opts.right : [];
  const correctMap = parseJson(question.correctAnswer, {});

  const [leftInput, setLeftInput] = useState("");
  const [rightInput, setRightInput] = useState("");

  const addPair = () => {
    if (!leftInput.trim() || !rightInput.trim()) return;
    
    const newLeft = [...left, leftInput.trim()];
    const newRight = [...right, rightInput.trim()];
    const newCorrect = { ...correctMap, [leftInput.trim()]: rightInput.trim() };

    updateQuestionData({ left: newLeft, right: newRight }, newCorrect);
    setLeftInput("");
    setRightInput("");
  };

  const removePair = (leftKey: string) => {
    const rightVal = correctMap[leftKey];
    const newLeft = left.filter((l: string) => l !== leftKey);
    const newRight = right.filter((r: string) => r !== rightVal);
    const newCorrect = { ...correctMap };
    delete newCorrect[leftKey];

    updateQuestionData({ left: newLeft, right: newRight }, newCorrect);
  };

  return (
    <div className="space-y-4 text-right w-full max-w-full overflow-hidden" dir="rtl">
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">
        {language === 'ar' ? "تعديل عناصر التوصيل والربط:" : "Edit Matching Elements:"}
      </h5>
      
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{language === 'ar' ? "العنصر الأيمن" : "Right Side Element"}</label>
            <input
              type="text"
              placeholder={language === 'ar' ? "مثال: الكلمة..." : "e.g. Word..."}
              className="w-full bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs font-bold focus:border-indigo-500 outline-none transition-all"
              value={leftInput}
              onChange={(e) => setLeftInput(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{language === 'ar' ? "العنصر الأيسر المطابق" : "Matching Left Element"}</label>
            <input
              type="text"
              placeholder={language === 'ar' ? "مثال: التعريف أو الصورة..." : "e.g. Definition or Image URL..."}
              className="w-full bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs font-bold focus:border-indigo-500 outline-none transition-all"
              value={rightInput}
              onChange={(e) => setRightInput(e.target.value)}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={addPair}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-755 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/10 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ar' ? "إضافة زوج مطابق" : "Add Match Pair"}</span>
        </button>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto">
        {Object.keys(correctMap).length === 0 ? (
          <div className="text-center p-6 text-slate-400 text-xs font-bold bg-white border border-slate-150 rounded-2xl">
            {language === 'ar' ? "لا توجد أزواج توصيل مضافة بعد. أضف أزواجاً في الأعلى للبدء." : "No matching pairs added yet. Add some above to start."}
          </div>
        ) : (
          Object.keys(correctMap).map((leftKey, idx) => (
            <div key={leftKey} className="p-3 bg-white hover:border-indigo-200 rounded-xl border border-slate-200 flex justify-between items-center text-xs w-full gap-3 shadow-sm transition-all">
              <span className="w-6 h-6 rounded bg-slate-100 text-slate-500 font-black flex items-center justify-center shrink-0">{idx + 1}</span>
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <span className="font-black text-slate-800 truncate">{leftKey}</span>
                <span className="text-indigo-500 font-bold text-[10px] shrink-0">↔</span>
                <span className="font-bold text-slate-600 truncate">{correctMap[leftKey]}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black text-[10px] border border-emerald-200 shrink-0">
                  ✅ {language === 'ar' ? "مطابق صحيح" : "Correct Match"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removePair(leftKey)}
                className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-lg transition-all shrink-0 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 📥 5. DRAG_DROP_FILL (سحب الفراغات)
// -------------------------------------------------------------
function DragDropFillEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { sentence: "", choices: [] });
  const choices = Array.isArray(opts?.choices) ? opts.choices : [];
  const rawCorrect = parseJson(question.correctAnswer, []);
  const correctList = Array.isArray(rawCorrect) ? rawCorrect : (rawCorrect ? [rawCorrect] : []);

  const [sentence, setSentence] = useState(opts.sentence || "");
  const [choiceInput, setChoiceInput] = useState("");
  const [choicesList, setChoicesList] = useState<string[]>(choices);
  const [correctAnswerSlots, setCorrectAnswerSlots] = useState<string[]>(correctList);

  useEffect(() => {
    setSentence(opts.sentence || "");
    setChoicesList(Array.isArray(opts?.choices) ? opts.choices : []);
    const updatedRaw = parseJson(question.correctAnswer, []);
    setCorrectAnswerSlots(Array.isArray(updatedRaw) ? updatedRaw : (updatedRaw ? [updatedRaw] : []));
  }, [question.options, question.correctAnswer]);

  const saveChanges = (newSentence: string, newChoices: string[], newCorrect: string[]) => {
    updateQuestionData({ sentence: newSentence, choices: newChoices }, newCorrect);
  };

  const addChoice = () => {
    if (!choiceInput.trim() || choicesList.includes(choiceInput.trim())) return;
    const updatedChoices = [...choicesList, choiceInput.trim()];
    setChoicesList(updatedChoices);
    setChoiceInput("");
    saveChanges(sentence, updatedChoices, correctAnswerSlots);
  };

  const removeChoice = (word: string) => {
    const updatedChoices = choicesList.filter((c) => c !== word);
    setChoicesList(updatedChoices);
    const updatedSlots = correctAnswerSlots.map((s) => (s === word ? "" : s));
    setCorrectAnswerSlots(updatedSlots);
    saveChanges(sentence, updatedChoices, updatedSlots);
  };

  const handleSlotMapChange = (slotIdx: number, val: string) => {
    const updatedSlots = [...correctAnswerSlots];
    updatedSlots[slotIdx] = val;
    setCorrectAnswerSlots(updatedSlots);
    saveChanges(sentence, choicesList, updatedSlots);
  };

  const insertSlotToken = (token: string) => {
    const el = document.getElementById("sentence-textarea") as HTMLTextAreaElement;
    if (!el) {
      const newSentence = sentence + " " + token;
      setSentence(newSentence);
      saveChanges(newSentence, choicesList, correctAnswerSlots);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const before = text.substring(0, start);
    const after  = text.substring(end, text.length);
    const newText = before + token + after;
    setSentence(newText);
    saveChanges(newText, choicesList, correctAnswerSlots);
    
    setTimeout(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + token.length;
    }, 10);
  };

  const slotsCount = (sentence.match(/\[slot\d+\]/g) || []).length;

  return (
    <div className="space-y-6 text-right w-full max-w-full overflow-hidden" dir="rtl">
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">
        {language === 'ar' ? "محرر سحب وإفلات الفراغات (Drag & Drop):" : "Drag & Drop Fill in the Blanks Editor:"}
      </h5>
      
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-black text-slate-400 leading-relaxed">
            {language === 'ar' ? "اكتب النص الكامل ثم أدرج رمز الفراغ في الموضع المطلوب:" : "Type the text and insert slots where blanks should appear:"}
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {Array.from({ length: Math.min(8, slotsCount + 1) }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => insertSlotToken(`[slot${i}]`)}
                className="text-[9px] font-black bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-1 rounded transition-all cursor-pointer"
              >
                {language === 'ar' ? `+ فراغ [slot${i}]` : `+ Slot ${i}`}
              </button>
            ))}
          </div>
        </div>
        <textarea
          id="sentence-textarea"
          className="w-full bg-white border border-slate-250 rounded-2xl p-4 text-xs font-bold text-right focus:border-indigo-500 outline-none transition-all resize-none"
          rows={3}
          value={sentence}
          onChange={(e) => {
            setSentence(e.target.value);
            saveChanges(e.target.value, choicesList, correctAnswerSlots);
          }}
          placeholder={language === 'ar' ? "مثال: تقع أهرامات الجيزة في محافظة [slot0] بينما يقع معبد أبو سمبل في محافظة [slot1]." : "e.g. The pyramids are in [slot0] while Luxor Temple is in [slot1]."}
        />
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-400 block">{language === 'ar' ? "خيارات الكلمات المتاحة للسحب:" : "Available Word Choices to Drag:"}</label>
        <div className="flex gap-2 w-full">
          <input
            type="text"
            placeholder={language === 'ar' ? "اكتب كلمة الخيار الجديدة..." : "Write choice word..."}
            className="flex-1 bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs font-bold focus:border-indigo-500 outline-none transition-all"
            value={choiceInput}
            onChange={(e) => setChoiceInput(e.target.value)}
            onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addChoice(); } }}
          />
          <button
            type="button"
            onClick={addChoice}
            className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-650/10 transition-all cursor-pointer shrink-0"
          >
            {language === 'ar' ? "إضافة كلمة" : "Add Word"}
          </button>
        </div>
        
        <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-100 rounded-xl max-h-36 overflow-y-auto">
          {choicesList.length === 0 ? (
            <span className="text-[10px] text-slate-400 font-bold">{language === 'ar' ? "لا توجد كلمات سحب مضافة. أضف كلمات في الحقل أعلاه." : "No drag choices added yet. Add some above."}</span>
          ) : (
            choicesList.map((c, i) => (
              <div key={i} className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-2 text-xs font-bold shadow-sm">
                <span className="text-slate-800">{c}</span>
                <button type="button" onClick={() => removeChoice(c)} className="text-rose-500 hover:text-rose-700 font-black cursor-pointer text-sm">×</button>
              </div>
            ))
          )}
        </div>
      </div>

      {slotsCount > 0 && (
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <h6 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === 'ar' ? "حدد الكلمة الصحيحة لكل فراغ من النص:" : "Define the Correct Word for each Slot:"}</span>
          </h6>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: slotsCount }).map((_, slotIdx) => (
              <div key={slotIdx} className="p-3 bg-indigo-50/30 border border-indigo-100 rounded-xl flex items-center gap-3 justify-between">
                <span className="font-black text-slate-700 text-xs shrink-0">
                  {language === 'ar' ? `الفراغ [slot${slotIdx}]` : `Slot [slot${slotIdx}]`}:
                </span>
                <select
                  className="bg-white border border-slate-250 rounded-lg px-3 py-1.5 font-bold text-xs flex-1 outline-none"
                  value={correctAnswerSlots[slotIdx] || ""}
                  onChange={(e) => handleSlotMapChange(slotIdx, e.target.value)}
                >
                  <option value="">{language === 'ar' ? "-- اختر الحل --" : "-- Select --"}</option>
                  {choicesList.map((c, idx) => (
                    <option key={idx} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 🗂️ 6. GROUP_SORTING (تصنيف المجموعات)
// -------------------------------------------------------------
function GroupSortingEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { groups: [], items: [] });
  const groups = Array.isArray(opts?.groups) ? opts.groups : [];
  const items = Array.isArray(opts?.items) ? opts.items : [];
  const correctMap = parseJson(question.correctAnswer, {});

  const [groupInput, setGroupInput] = useState("");
  const [itemInput, setItemInput] = useState("");
  const [targetGroup, setTargetGroup] = useState("");

  const addGroup = () => {
    if (!groupInput.trim() || groups.includes(groupInput.trim())) return;
    const updatedGroups = [...groups, groupInput.trim()];
    updateQuestionData({ groups: updatedGroups, items }, correctMap);
    setGroupInput("");
  };

  const removeGroup = (grp: string) => {
    const updatedGroups = groups.filter((g: string) => g !== grp);
    const newCorrect = { ...correctMap };
    Object.keys(newCorrect).forEach((k) => {
      if (newCorrect[k] === grp) delete newCorrect[k];
    });
    updateQuestionData({ groups: updatedGroups, items }, newCorrect);
  };

  const addItem = () => {
    if (!itemInput.trim() || items.includes(itemInput.trim()) || !targetGroup) return;
    const updatedItems = [...items, itemInput.trim()];
    const newCorrect = { ...correctMap, [itemInput.trim()]: targetGroup };
    updateQuestionData({ groups, items: updatedItems }, newCorrect);
    setItemInput("");
    setTargetGroup("");
  };

  const removeItem = (item: string) => {
    const updatedItems = items.filter((i: string) => i !== item);
    const newCorrect = { ...correctMap };
    delete newCorrect[item];
    updateQuestionData({ groups, items: updatedItems }, newCorrect);
  };

  const groupColors = [
    { bg: "bg-indigo-50/70 border-indigo-200 text-indigo-900", label: "indigo" },
    { bg: "bg-emerald-50/70 border-emerald-200 text-emerald-900", label: "emerald" },
    { bg: "bg-amber-50/70 border-amber-200 text-amber-900", label: "amber" },
    { bg: "bg-rose-50/70 border-rose-200 text-rose-900", label: "rose" },
    { bg: "bg-sky-50/70 border-sky-200 text-sky-900", label: "sky" },
    { bg: "bg-purple-50/70 border-purple-200 text-purple-900", label: "purple" }
  ];

  return (
    <div className="space-y-6 text-right w-full max-w-full overflow-hidden" dir="rtl">
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">
        {language === 'ar' ? "محرر تصنيف المجموعات (Group Sorting):" : "Group Sorting Editor:"}
      </h5>

      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{language === 'ar' ? "المجموعات / التصنيفات المتاحة:" : "Available Groups / Classifications:"}</label>
        <div className="flex gap-2 w-full">
          <input
            type="text"
            placeholder={language === 'ar' ? "اسم مجموعة جديدة (مثل: ثدييات)..." : "New group name (e.g. Mammals)..."}
            className="flex-1 bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs font-bold focus:border-indigo-500 outline-none transition-all"
            value={groupInput}
            onChange={(e) => setGroupInput(e.target.value)}
            onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addGroup(); } }}
          />
          <button
            type="button"
            onClick={addGroup}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer shrink-0"
          >
            {language === 'ar' ? "إضافة مجموعة" : "Add Group"}
          </button>
        </div>
      </div>

      {groups.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{language === 'ar' ? "إضافة كارت عنصر جديد للمجموعات:" : "Add New Item Card to Groups:"}</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder={language === 'ar' ? "اسم العنصر (مثل: أسد)..." : "Item text (e.g. Lion)..."}
              className="md:col-span-1 bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs font-bold focus:border-indigo-500 outline-none transition-all"
              value={itemInput}
              onChange={(e) => setItemInput(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addItem(); } }}
            />
            <select
              className="md:col-span-1 bg-white border border-slate-250 rounded-xl px-3 py-2.5 text-xs font-bold outline-none"
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value)}
            >
              <option value="">{language === 'ar' ? "اختر المجموعة المقابلة..." : "Select Group..."}</option>
              {groups.map((g: string, idx: number) => (
                <option key={idx} value={g}>{g}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={addItem}
              className="md:col-span-1 py-2.5 bg-indigo-600 hover:bg-indigo-755 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
            >
              {language === 'ar' ? "إضافة بطاقة" : "Add Card"}
            </button>
          </div>
        </div>
      )}

      {groups.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">{language === 'ar' ? "الهيكل العام للمجموعات والعناصر:" : "Group & Items Breakdown Structure:"}</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map((grp: string, index: number) => {
              const color = groupColors[index % groupColors.length];
              const grpItems = items.filter((item: any) => correctMap[item] === grp);

              return (
                <div key={grp} className={`rounded-2xl border-2 p-4 flex flex-col min-h-[140px] shadow-sm ${color.bg}`}>
                  <div className="flex justify-between items-center border-b border-black/5 pb-2 mb-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm">{grp}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] shadow-xs">
                        ✅ {language === 'ar' ? "تصنيف صحيح" : "Correct Category"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeGroup(grp)}
                      className="text-slate-400 hover:text-rose-500 p-1 hover:bg-white rounded transition-all shrink-0 cursor-pointer font-black"
                      title={language === 'ar' ? "حذف المجموعة وكل عناصرها" : "Delete group and all its items"}
                    >
                      &times;
                    </button>
                  </div>
                  <div className="flex-1 space-y-2">
                    {grpItems.length === 0 ? (
                      <span className="text-[10px] font-bold text-slate-400/80 italic block text-center py-4">{language === 'ar' ? "مجموعة فارغة. أضف بطاقات." : "Empty group. Add items."}</span>
                    ) : (
                      grpItems.map((item: any) => (
                        <div key={item} className="bg-white/90 border border-emerald-300 p-2 rounded-xl flex justify-between items-center text-xs shadow-sm">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-emerald-600 font-black">✔</span>
                            <span className="font-bold text-slate-800 truncate">{item}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item)}
                            className="text-slate-400 hover:text-rose-500 p-1 hover:bg-slate-50 rounded transition-all shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 🕰️ 7. CLOCK (عقارب الساعة التفاعلية)
// -------------------------------------------------------------
function ClockEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  let timeStr = "12:00";
  if (typeof question.correctAnswer === "string") {
    const t = question.correctAnswer.trim();
    if (t.startsWith("{")) {
      try {
        const p = JSON.parse(t);
        timeStr = p.time || `${String(p.hour || 12).padStart(2, "0")}:${String(p.minute || 0).padStart(2, "0")}`;
      } catch {}
    } else {
      timeStr = t;
    }
  } else if (typeof question.correctAnswer === "object" && question.correctAnswer) {
    timeStr = question.correctAnswer.time || `${String(question.correctAnswer.hour || 12).padStart(2, "0")}:${String(question.correctAnswer.minute || 0).padStart(2, "0")}`;
  }
  const parts = timeStr.split(":");
  const hour = parseInt(parts[0]) || 12;
  const minute = parseInt(parts[1]) || 0;

  const handleClockChange = (field: "hour" | "minute", val: number) => {
    const nextHour = field === "hour" ? val : hour;
    const nextMinute = field === "minute" ? val : minute;
    const timeStr = `${String(nextHour).padStart(2, "0")}:${String(nextMinute).padStart(2, "0")}`;
    updateQuestionData({ minuteStep: 5 }, timeStr);
  };

  return (
    <div className="space-y-4 text-right w-full max-w-full overflow-hidden" dir="rtl">
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">تحديد وقت عقارب الساعة:</h5>
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex flex-col gap-1 min-w-[100px] flex-1">
          <span className="text-[10px] font-black text-slate-400">الساعة:</span>
          <select
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-xs"
            value={hour}
            onChange={(e) => handleClockChange("hour", parseInt(e.target.value))}
          >
            {Array.from({ length: 12 }).map((_, idx) => (
              <option key={idx} value={idx + 1}>{idx + 1}</option>
            ))}
          </select>
        </div>
        <span className="text-2xl font-black text-slate-300 shrink-0 pt-4">:</span>
        <div className="flex flex-col gap-1 min-w-[100px] flex-1">
          <span className="text-[10px] font-black text-slate-400">الدقيقة:</span>
          <select
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-xs"
            value={minute}
            onChange={(e) => handleClockChange("minute", parseInt(e.target.value))}
          >
            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
              <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🗺️ 8. MIND_MAP (خريطة المفاهيم)
// -------------------------------------------------------------
function MindMapEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { nodes: [] });
  const nodes = Array.isArray(opts?.nodes) ? opts.nodes : [];
  const correctMap = parseJson(question.correctAnswer, {});

  const [nodeLabel, setNodeLabel] = useState("");
  const [nodeParent, setNodeParent] = useState("");
  const [nodeIsBlank, setNodeIsBlank] = useState(false);

  const addNode = () => {
    if (!nodeLabel.trim()) return;
    const newId = String(nodes.length + 1);
    const newNode = {
      id: newId,
      label: nodeLabel.trim(),
      parent: nodeParent || null,
      isBlank: nodeIsBlank
    };
    const updatedNodes = [...nodes, newNode];
    const newCorrect = { ...correctMap };
    if (nodeIsBlank) {
      newCorrect[newId] = nodeLabel.trim();
    }
    updateQuestionData({ nodes: updatedNodes }, newCorrect);
    setNodeLabel("");
    setNodeParent("");
    setNodeIsBlank(false);
  };

  const removeNode = (id: string) => {
    const updatedNodes = nodes.filter((n: any) => n.id !== id);
    const newCorrect = { ...correctMap };
    delete newCorrect[id];
    updateQuestionData({ nodes: updatedNodes }, newCorrect);
  };

  return (
    <div className="space-y-6 text-right w-full max-w-full overflow-hidden" dir="rtl">
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">
        خريطة المفاهيم الشجرية (Tree Mind Map):
      </h5>
      <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-2xl text-xs text-indigo-900 leading-relaxed font-bold">
        <span>💡 هيكلة الشجرة: قم بإنشاء عقدة رئيسية (Root) بدون أب، ثم أضف المفاهيم الفرعية تحتها لإنشاء تسلسل شجري (Tree Structure) منظم وواضح للطالب!</span>
      </div>
      <div className="flex flex-col gap-3.5 w-full">
        <div className="flex flex-col gap-1 w-full">
          <span className="text-[10px] font-black text-slate-400">
            نص المفهوم / العقدة:
          </span>
          <input
            type="text"
            placeholder="مثال: الاسم"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            value={nodeLabel}
            onChange={(e) => setNodeLabel(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1 w-full">
          <span className="text-[10px] font-black text-slate-400">
            المفهوم الأب الرئيسي:
          </span>
          <select
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            value={nodeParent}
            onChange={(e) => setNodeParent(e.target.value)}
          >
            <option value="">بدون - عقدة رئيسية (Root)</option>
            {nodes.map((n: any) => (
              <option key={n.id} value={n.id}>{n.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-600 flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={nodeIsBlank}
              onChange={(e) => setNodeIsBlank(e.target.checked)}
              className="w-4 h-4 accent-indigo-650"
            />
            <span>فراغ يقوم الطالب بسحبه</span>
          </label>
          <button
            type="button"
            onClick={addNode}
            className="w-full py-2 bg-slate-950 text-white rounded-xl text-xs font-black cursor-pointer"
          >
            إضافة العقدة
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {nodes.map((n: any) => (
          <div key={n.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs gap-2 min-w-0">
            <span className="font-bold text-slate-700 truncate min-w-0">
              {n.label} {n.parent ? `(الأب: #${n.parent})` : "(رئيسي)"} {n.isBlank && <span className="text-indigo-600 font-black">[فراغ]</span>}
            </span>
            <button type="button" onClick={() => removeNode(n.id)} className="text-rose-500 hover:text-rose-700 cursor-pointer shrink-0">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// ⏸️ 9. VIDEO_CHECKPOINT (فيديو تفاعلي)
// -------------------------------------------------------------
function VideoCheckpointEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
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
    <div className="space-y-6 text-right w-full max-w-full overflow-hidden" dir="rtl">
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
// -------------------------------------------------------------
function NumberLineEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { min: 0, max: 10, step: 1, labels: ["0", "5", "10"] });
  const labels = Array.isArray(opts?.labels) ? opts.labels : ["0", "5", "10"];
  const correctVal = question.correctAnswer || "5";

  const [min, setMin] = useState<number>(opts.min ?? 0);
  const [max, setMax] = useState<number>(opts.max ?? 10);
  const [step, setStep] = useState<number>(opts.step ?? 1);
  const [labelsText, setLabelsText] = useState<string>(labels.join(", "));
  const [correctAnswer, setCorrectAnswer] = useState<string>(correctVal);

  const saveChanges = (newMin: number, newMax: number, newStep: number, labelStr: string, correct: string) => {
    const labelsArr = labelStr
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    updateQuestionData({ min: newMin, max: newMax, step: newStep, labels: labelsArr }, correct);
  };

  const handleAutoGenerateLabels = () => {
    const newLabels: string[] = [];
    const diff = max - min;
    if (diff <= 0 || step <= 0) return;
    const maxLabelsCount = 5; // Limiting count for narrow viewports
    const calcStep = diff / (maxLabelsCount - 1);
    for (let i = 0; i < maxLabelsCount; i++) {
      const val = min + i * calcStep;
      newLabels.push(String(Math.round(val * 100) / 100));
    }
    const labelStr = newLabels.join(", ");
    setLabelsText(labelStr);
    saveChanges(min, max, step, labelStr, correctAnswer);
  };

  return (
    <div className="space-y-6 text-right w-full max-w-full overflow-hidden" dir="rtl">
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">
        محرر خط الأعداد (Number Line):
      </h5>

      <div className="flex flex-col gap-3 w-full">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400">الحد الأدنى (Min):</span>
          <input
            type="number"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            value={min}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              setMin(val);
              saveChanges(val, max, step, labelsText, correctAnswer);
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400">الحد الأقصى (Max):</span>
          <input
            type="number"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            value={max}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              setMax(val);
              saveChanges(min, val, step, labelsText, correctAnswer);
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400">الخطوة (Step):</span>
          <input
            type="number"
            step="0.01"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            value={step}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 1;
              setStep(val);
              saveChanges(min, max, val, labelsText, correctAnswer);
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 w-full">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-400">العناوين (مفصولة بفاصلة):</span>
          <button
            type="button"
            onClick={handleAutoGenerateLabels}
            className="text-[10px] font-black text-indigo-600 hover:underline cursor-pointer"
          >
            توليد تلقائي
          </button>
        </div>
        <input
          type="text"
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold w-full"
          value={labelsText}
          onChange={(e) => {
            setLabelsText(e.target.value);
            saveChanges(min, max, step, e.target.value, correctAnswer);
          }}
          placeholder="مثال: 0, 5, 10"
        />
      </div>

      <div className="space-y-2 pt-3 border-t border-slate-100 w-full">
        <div className="flex justify-between text-xs font-black text-slate-400">
          <span>الإجابة الصحيحة:</span>
          <span className="text-indigo-650 text-sm font-black">{correctAnswer}</span>
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={parseFloat(correctAnswer) || min}
            onChange={(e) => {
              setCorrectAnswer(e.target.value);
              saveChanges(min, max, step, labelsText, e.target.value);
            }}
            className="w-full accent-indigo-655 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
          <input
            type="number"
            step={step}
            value={correctAnswer}
            onChange={(e) => {
              setCorrectAnswer(e.target.value);
              saveChanges(min, max, step, labelsText, e.target.value);
            }}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-center"
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🔄 11. SWIPE_SORT (فرز البطاقات بالـ Swipe)
// -------------------------------------------------------------
function SwipeSortEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { leftGroup: "Left Group", rightGroup: "Right Group", items: [] });
  const items = Array.isArray(opts?.items) ? opts.items : [];
  const correctMap = parseJson(question.correctAnswer, {});

  const [leftGroup, setLeftGroup] = useState(opts.leftGroup || "Left Group");
  const [rightGroup, setRightGroup] = useState(opts.rightGroup || "Right Group");
  const [cardText, setCardText] = useState("");
  const [cardDirection, setCardDirection] = useState<"left" | "right">("left");

  const saveChanges = (leftGrp: string, rightGrp: string, itemsList: string[], correct: any) => {
    updateQuestionData({ leftGroup: leftGrp, rightGroup: rightGrp, items: itemsList }, correct);
  };

  const addCard = () => {
    if (!cardText.trim() || items.includes(cardText.trim())) return;
    const newItems = [...items, cardText.trim()];
    const newCorrect = { ...correctMap, [cardText.trim()]: cardDirection };
    saveChanges(leftGroup, rightGroup, newItems, newCorrect);
    setCardText("");
  };

  const removeCard = (item: string) => {
    const newItems = items.filter((i: string) => i !== item);
    const newCorrect = { ...correctMap };
    delete newCorrect[item];
    saveChanges(leftGroup, rightGroup, newItems, newCorrect);
  };

  return (
    <div className="space-y-6 text-right w-full max-w-full overflow-hidden" dir="rtl">
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">
        محرر فرز بطاقات السحب (Swipe Sort):
      </h5>

      <div className="flex flex-col gap-3 w-full">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400">المجموعة اليسرى (← يسار):</span>
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            value={leftGroup}
            onChange={(e) => {
              setLeftGroup(e.target.value);
              saveChanges(e.target.value, rightGroup, items, correctMap);
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400">المجموعة اليمنى (يمين →):</span>
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            value={rightGroup}
            onChange={(e) => {
              setRightGroup(e.target.value);
              saveChanges(leftGroup, e.target.value, items, correctMap);
            }}
          />
        </div>
      </div>

      <div className="space-y-3 pt-3 border-t border-slate-100">
        <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إضافة بطاقة جديدة:</h6>
        <div className="flex flex-col gap-2 w-full">
          <input
            type="text"
            placeholder="اكتب النص للبطاقة..."
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            value={cardText}
            onChange={(e) => setCardText(e.target.value)}
          />
          <select
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold min-h-[34px]"
            value={cardDirection}
            onChange={(e) => setCardDirection(e.target.value as "left" | "right")}
          >
            <option value="left">{leftGroup}</option>
            <option value="right">{rightGroup}</option>
          </select>
          <button
            type="button"
            onClick={addCard}
            className="w-full py-2 bg-slate-950 text-white rounded-xl text-xs font-black cursor-pointer"
          >
            إضافة بطاقة
          </button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-slate-100 max-h-60 overflow-y-auto">
          <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">البطاقات المضافة وتصنيفاتها:</h6>
          <div className="flex flex-col gap-3">
            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-150 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-rose-500 uppercase">{leftGroup} (←)</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black text-[9px] border border-emerald-200">
                  ✅ {language === 'ar' ? "فرز يسار صحيح" : "Correct Left Sort"}
                </span>
              </div>
              <div className="space-y-1">
                {items
                  .filter((item: string) => correctMap[item] === "left")
                  .map((item: string) => (
                    <div key={item} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-emerald-200 text-xs font-bold gap-2 shadow-2xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-emerald-600 font-black">✔</span>
                        <span className="truncate">{item}</span>
                      </div>
                      <button type="button" onClick={() => removeCard(item)} className="text-rose-500 hover:text-rose-700 cursor-pointer shrink-0">×</button>
                    </div>
                  ))}
              </div>
            </div>
            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-150 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-emerald-500 uppercase">{rightGroup} (→)</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black text-[9px] border border-emerald-200">
                  ✅ {language === 'ar' ? "فرز يمين صحيح" : "Correct Right Sort"}
                </span>
              </div>
              <div className="space-y-1">
                {items
                  .filter((item: string) => correctMap[item] === "right")
                  .map((item: string) => (
                    <div key={item} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-emerald-200 text-xs font-bold gap-2 shadow-2xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-emerald-600 font-black">✔</span>
                        <span className="truncate">{item}</span>
                      </div>
                      <button type="button" onClick={() => removeCard(item)} className="text-rose-500 hover:text-rose-700 cursor-pointer shrink-0">×</button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to generate word search grid (8x8)
function generateWordSearchGrid(words: string[]): string[][] {
  const size = 8;
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(""));
  const isArabic = words.some((w) => /[\u0600-\u06FF]/.test(w));
  const arLetters = ["ا", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "هـ", "و", "ي"];
  const enLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const getRandomLetter = () => isArabic ? arLetters[Math.floor(Math.random() * arLetters.length)] : enLetters[Math.floor(Math.random() * enLetters.length)];
  const directions = [[0, 1], [1, 0], [1, 1]];

  for (const rawWord of words) {
    const word = rawWord.trim().toUpperCase();
    if (!word) continue;
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 100) {
      attempts++;
      const dirIdx = Math.floor(Math.random() * directions.length);
      const [dr, dc] = directions[dirIdx];
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      if (r + dr * (word.length - 1) >= size || c + dc * (word.length - 1) >= size) continue;
      let fits = true;
      for (let i = 0; i < word.length; i++) {
        const currR = r + dr * i;
        const currC = c + dc * i;
        if (currR >= size || currC >= size) { fits = false; break; }
        const letterAtCell = grid[currR][currC];
        if (letterAtCell !== "" && letterAtCell !== word[i]) { fits = false; break; }
      }
      if (fits) {
        for (let i = 0; i < word.length; i++) { grid[r + dr * i][c + dc * i] = word[i]; }
        placed = true;
      }
    }
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === "") grid[r][c] = getRandomLetter();
    }
  }
  return grid;
}

// -------------------------------------------------------------
// 🧩 12. WORD_SEARCH (البحث عن الكلمات)
// -------------------------------------------------------------
function WordSearchEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { grid: [], words: [] });
  const words = Array.isArray(opts?.words) ? opts.words : [];
  const grid = Array.isArray(opts?.grid) ? opts.grid : [];

  const [wordInput, setWordInput] = useState("");
  const [wordsList, setWordsList] = useState<string[]>(words);
  const [gridData, setGridData] = useState<string[][]>(grid);

  const saveChanges = (newWords: string[], newGrid: string[][]) => {
    updateQuestionData({ grid: newGrid, words: newWords }, newWords);
  };

  useEffect(() => {
    const loadedWords = Array.isArray(opts?.words) ? opts.words : [];
    setWordsList(loadedWords);
    if (Array.isArray(opts?.grid) && opts.grid.length > 0) {
      setGridData(opts.grid);
    } else if (loadedWords.length > 0) {
      const generated = generateWordSearchGrid(loadedWords);
      setGridData(generated);
      saveChanges(loadedWords, generated);
    } else {
      setGridData([]);
    }
  }, [question.options]);

  const addWord = () => {
    const cleaned = wordInput.trim().toUpperCase();
    if (!cleaned || wordsList.includes(cleaned)) return;
    const newWords = [...wordsList, cleaned];
    const newGrid = generateWordSearchGrid(newWords);
    setWordsList(newWords);
    setGridData(newGrid);
    saveChanges(newWords, newGrid);
    setWordInput("");
  };

  const removeWord = (word: string) => {
    const newWords = wordsList.filter((w) => w !== word);
    const newGrid = generateWordSearchGrid(newWords);
    setWordsList(newWords);
    setGridData(newGrid);
    saveChanges(newWords, newGrid);
  };

  const handleRegenerate = () => {
    const newGrid = generateWordSearchGrid(wordsList);
    setGridData(newGrid);
    saveChanges(wordsList, newGrid);
  };

  return (
    <div className="space-y-6 text-right w-full max-w-full overflow-hidden" dir="rtl">
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">
        محرر الكلمات المتقاطعة والبحث عن الكلمات (Word Search):
      </h5>
      <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-2xl text-xs text-indigo-900 leading-relaxed font-bold">
        <span>💡 فكرة النشاط: الطالب يختار الكلمة الهدف من الأسفل، ثم يضغط على الحروف المتتالية داخل الشبكة لتحديدها وشطبها!</span>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <input
          type="text"
          placeholder="أدخل كلمة مخفية (مثال: تفاحة)..."
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
          value={wordInput}
          onChange={(e) => setWordInput(e.target.value)}
        />
        <button
          type="button"
          onClick={addWord}
          className="w-full py-2 bg-slate-950 text-white rounded-xl text-xs font-black cursor-pointer animate-none"
        >
          إضافة كلمة وتحديث الشبكة
        </button>
      </div>

      {wordsList.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {wordsList.map((w, idx) => (
              <div key={idx} className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1.5 text-xs font-bold truncate max-w-full">
                <span className="truncate">{w}</span>
                <button type="button" onClick={() => removeWord(w)} className="text-rose-500 hover:text-rose-700 cursor-pointer shrink-0">×</button>
              </div>
            ))}
          </div>

          {gridData.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-100 w-full max-w-full">
              <div className="flex flex-col gap-1">
                <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">الشبكة المولدة (8x8):</h6>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="text-[10px] font-black text-indigo-600 hover:underline cursor-pointer text-right"
                >
                  توليد حروف عشوائية جديدة
                </button>
              </div>
              <div className="w-full overflow-x-auto pb-2">
                <div className="bg-slate-50 p-3 border border-slate-150 rounded-2xl flex flex-col gap-1.5 w-fit mx-auto shadow-inner">
                  {gridData.map((row, r) => (
                    <div key={r} className="flex gap-1.5">
                      {row.map((letter, c) => (
                        <div key={c} className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-slate-700 text-xs shadow-sm uppercase shrink-0">
                          {letter}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 🗺️ 13. MAZE (مسار المتاهة التعليمي)
// -------------------------------------------------------------
function MazeEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const defaultGrid = Array.from({ length: 5 }, () => Array(5).fill(1));
  const opts = parseJson(question.options, { mazeGrid: defaultGrid, start: [0, 0], end: [4, 4], labels: {} });
  const gridData = Array.isArray(opts?.mazeGrid) ? opts.mazeGrid : defaultGrid;
  const correctVal = parseJson(question.correctAnswer, []);

  const [grid, setGrid] = useState<number[][]>(gridData);
  const [start, setStart] = useState<number[]>(opts.start || [0, 0]);
  const [end, setEnd] = useState<number[]>(opts.end || [4, 4]);
  const [path, setPath] = useState<string[]>(Array.isArray(correctVal) ? correctVal : []);
  const [labels, setLabels] = useState<Record<string, string>>(opts.labels || {});
  const [mode, setMode] = useState<"WALL" | "START" | "END" | "PATH" | "LABEL">("WALL");

  useEffect(() => {
    const loadedGrid = Array.isArray(opts?.mazeGrid) && opts.mazeGrid.length > 0 ? opts.mazeGrid : defaultGrid;
    setGrid(loadedGrid);
    setStart(opts.start || [0, 0]);
    setEnd(opts.end || [4, 4]);
    setPath(Array.isArray(correctVal) ? correctVal : []);
    setLabels(opts.labels || {});
  }, [question.options, question.correctAnswer]);

  const saveChanges = (newGrid: number[][], newStart: number[], newEnd: number[], newPath: string[], nextLabels = labels) => {
    updateQuestionData({ mazeGrid: newGrid, start: newStart, end: newEnd, labels: nextLabels }, newPath);
  };

  const handleCellClick = (r: number, c: number) => {
    const updatedGrid = grid.map((row) => [...row]);
    if (mode === "WALL") {
      if ((r === start[0] && c === start[1]) || (r === end[0] && c === end[1])) return;
      updatedGrid[r][c] = updatedGrid[r][c] === 1 ? 0 : 1;
      const coordStr = `${r},${c}`;
      const updatedPath = path.filter((p) => p !== coordStr);
      setGrid(updatedGrid);
      setPath(updatedPath);
      saveChanges(updatedGrid, start, end, updatedPath);
    } else if (mode === "START") {
      updatedGrid[r][c] = 1;
      setStart([r, c]);
      setGrid(updatedGrid);
      const updatedPath = [`${r},${c}`];
      setPath(updatedPath);
      saveChanges(updatedGrid, [r, c], end, updatedPath);
    } else if (mode === "END") {
      updatedGrid[r][c] = 1;
      setEnd([r, c]);
      setGrid(updatedGrid);
      saveChanges(updatedGrid, start, [r, c], path);
    } else if (mode === "PATH") {
      const coordStr = `${r},${c}`;
      if (grid[r][c] === 0) return;
      if (path.includes(coordStr)) {
        const idx = path.indexOf(coordStr);
        const updatedPath = path.slice(0, idx + 1);
        setPath(updatedPath);
        saveChanges(grid, start, end, updatedPath);
      } else {
        if (path.length > 0) {
          const last = path[path.length - 1].split(",").map(Number);
          const dist = Math.abs(r - last[0]) + Math.abs(c - last[1]);
          if (dist !== 1) return;
        } else {
          if (r !== start[0] || c !== start[1]) return;
        }
        const updatedPath = [...path, coordStr];
        setPath(updatedPath);
        saveChanges(grid, start, end, updatedPath);
      }
    }
  };

  const handleLabelChange = (r: number, c: number, val: string) => {
    const nextLabels = { ...labels, [`${r},${c}`]: val };
    setLabels(nextLabels);
    saveChanges(grid, start, end, path, nextLabels);
  };

  const handleResetPath = () => {
    const updatedPath = [`${start[0]},${start[1]}`];
    setPath(updatedPath);
    saveChanges(grid, start, end, updatedPath);
  };

  return (
    <div className="space-y-6 text-right w-full max-w-full overflow-hidden" dir="rtl">
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">
        محرر مسار المتاهة التعليمي (Maze Path):
      </h5>
      <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-900 leading-relaxed font-bold space-y-1">
        <div className="flex items-center gap-1.5 font-black text-amber-950 text-sm">
          <span>💡 فكرة النشاط وكيفية إعداده:</span>
        </div>
        <p>المتاهة التعليمية هي لعبة تفاعلية يقوم فيها الطالب بالوصول من <b>نقطة البداية 🟢</b> إلى <b>نقطة النهاية 🔴</b> من خلال تتبع مسار الإجابات الصحيحة (مثلاً: تتبع مضاعفات العدد 5، أو تتبع الكلمات التي تبدأ بحرف اللام).</p>
        <ul className="list-disc list-inside space-y-0.5 text-[11px] pt-1 text-amber-800">
          <li><b>1. رسم الجدران ⬛:</b> حدد المربعات التي تمثل حوائط مغلقة لا يمكن للطالب المرور منها.</li>
          <li><b>2. تحديد البداية 🟢 والنهاية 🔴:</b> اختر نقطة انطلاق ونقطة خروج الطالب.</li>
          <li><b>3. رسم المسار الصحيح 🟡:</b> اضغط على المربعات المتتالية لرسم ممر الحل.</li>
          <li><b>4. كتابة النصوص ✍️:</b> اضغط على زر "كتابة نصوص الخلايا" واكتب محتوى كل خلية (أرقام أو كلمات) ليرشد الطالب.</li>
        </ul>
      </div>
      <div className="flex flex-col gap-2 w-full">
        <button
          type="button"
          onClick={() => setMode("WALL")}
          className={`w-full py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${mode === "WALL" ? "bg-slate-800 text-white border-slate-900 animate-none" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 animate-none"}`}
        >
          رسم الجدران / الممرات
        </button>
        <button
          type="button"
          onClick={() => setMode("START")}
          className={`w-full py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${mode === "START" ? "bg-indigo-650 text-white border-indigo-700 animate-none" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 animate-none"}`}
        >
          تحديد البداية (Start)
        </button>
        <button
          type="button"
          onClick={() => setMode("END")}
          className={`w-full py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${mode === "END" ? "bg-emerald-600 text-white border-emerald-700 animate-none" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 animate-none"}`}
        >
          تحديد المخرج (End)
        </button>
        <button
          type="button"
          onClick={() => setMode("PATH")}
          className={`w-full py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${mode === "PATH" ? "bg-violet-600 text-white border-violet-750 animate-none" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 animate-none"}`}
        >
          رسم مسار الحل النموذجي
        </button>
        <button
          type="button"
          onClick={() => setMode("LABEL")}
          className={`w-full py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${mode === "LABEL" ? "bg-amber-600 text-white border-amber-700 animate-none" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 animate-none"}`}
        >
          كتابة نصوص الخلايا (Labels)
        </button>
      </div>

      <div className="flex flex-col items-center gap-4 w-full">
        <div className="text-xs text-slate-500 font-bold bg-slate-50/50 px-3 py-2 rounded-xl border border-slate-150 w-full text-center leading-relaxed">
          {mode === "WALL" && "💡 انقر على الخلايا لتغييرها بين جدران أو ممرات."}
          {mode === "START" && "💡 انقر على خلية لتحديدها كنقطة بداية."}
          {mode === "END" && "💡 انقر على خلية لتحديدها كمخرج."}
          {mode === "PATH" && "💡 انقر على الممرات المجاورة بالتتابع لرسم مسار الحل."}
          {mode === "LABEL" && "✍️ اكتب النصوص أو الأرقام المناسبة في المربعات مباشرة."}
        </div>

        <div className="w-full overflow-x-auto pb-2 flex justify-center">
          <div className="flex flex-col gap-1.5 border-2 border-slate-200 p-3 bg-slate-150 rounded-2xl w-fit">
            {grid.map((row, rIdx) => (
              <div key={rIdx} className="flex gap-1.5">
                {row.map((val, cIdx) => {
                  const coordStr = `${rIdx},${cIdx}`;
                  const isWall = val === 0;
                  const isStart = start[0] === rIdx && start[1] === cIdx;
                  const isEnd = end[0] === rIdx && end[1] === cIdx;
                  const isPathSelected = path.includes(coordStr);
                  const pathIndex = path.indexOf(coordStr);

                  return (
                    <button
                      key={cIdx}
                      type="button"
                      onClick={() => mode !== "LABEL" && handleCellClick(rIdx, cIdx)}
                      className={`w-14 h-14 rounded-lg border transition-all flex flex-col items-center justify-center font-black text-[10px] relative shrink-0 ${isWall ? "bg-slate-800 border-slate-900 text-slate-400" : isStart ? "bg-indigo-650 border-indigo-750 text-white shadow-sm" : isEnd ? "bg-emerald-500 border-emerald-600 text-white shadow-sm" : isPathSelected ? "bg-violet-100 border-violet-400 text-violet-850" : "bg-white border-slate-200"}`}
                    >
                      {mode === "LABEL" && !isWall ? (
                        <input
                          type="text"
                          value={labels[coordStr] || ""}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleLabelChange(rIdx, cIdx, e.target.value)}
                          placeholder="..."
                          className="w-full h-full text-center bg-transparent border-0 font-bold text-xs outline-none text-slate-800"
                        />
                      ) : (
                        <>
                          {isStart && <span>بداية</span>}
                          {isEnd && <span>مخرج</span>}
                          {labels[coordStr] && <span className="text-[10px] text-slate-500 font-bold">{labels[coordStr]}</span>}
                          {!isStart && !isEnd && isPathSelected && (
                            <span className="absolute bottom-0.5 right-0.5 text-[8px] text-slate-400">{pathIndex + 1}</span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {mode === "PATH" && path.length > 0 && (
          <div className="flex flex-col gap-1.5 items-center text-xs w-full max-w-full">
            <span className="font-bold text-slate-500 truncate max-w-full">المسار: {path.join(" ➔ ")}</span>
            <button type="button" onClick={handleResetPath} className="text-xs text-rose-500 font-bold hover:underline cursor-pointer">مسح المسار</button>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 📐 14. GEOGEBRA (جيوجيبرا)
// -------------------------------------------------------------
function GeoGebraEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { materialId: "", width: 800, height: 500, iframeUrl: "" });
  const correctVal = question.correctAnswer || "";
  const [inputValue, setInputValue] = useState(opts.iframeUrl || (opts.materialId ? `https://www.geogebra.org/material/iframe/id/${opts.materialId}` : ""));

  const extractId = (urlOrId: string) => {
    if (!urlOrId) return "";
    const cleanUrl = urlOrId.trim();
    const ggbmMatch = cleanUrl.match(/ggbm\.at\/([a-zA-Z0-9]+)/i);
    if (ggbmMatch) return ggbmMatch[1];
    
    const geoMatch = cleanUrl.match(/geogebra\.org\/(?:[a-zA-Z0-9_\-\/]*\/)?(?:id\/)?([a-zA-Z0-9]+)/i);
    if (geoMatch) {
      const id = geoMatch[1];
      const keywords = ["classic", "calculator", "geometry", "3d", "notes", "applet", "evaluator", "material", "show", "edit", "m"];
      if (!keywords.includes(id.toLowerCase())) {
        return id;
      }
    }
    
    if (/^[a-zA-Z0-9]+$/.test(cleanUrl)) {
      return cleanUrl;
    }
    return "";
  };

  const getCleanGeoGebraUrl = (urlOrId: string) => {
    if (!urlOrId) return "";
    const id = extractId(urlOrId);
    if (id) {
      return `https://www.geogebra.org/material/iframe/id/${id}/width/800/height/500/border/888888/sfsb/true/smb/false/stb/false/stbh/false/ai/false/asb/false/sri/true/rc/false/ld/false/sdz/false/ctl/false`;
    }
    return urlOrId;
  };

  const saveGeogebra = (rawInput: string, correct: string) => {
    setInputValue(rawInput);
    let extractedUrl = "";
    if (rawInput.trim().startsWith("<iframe")) {
      const match = rawInput.match(/src="([^"]+)"/i);
      extractedUrl = match ? match[1] : rawInput.trim();
    } else {
      extractedUrl = rawInput.trim();
    }
    const cleanUrl = getCleanGeoGebraUrl(extractedUrl);
    const id = extractId(extractedUrl);
    updateQuestionData({ materialId: id || "", width: opts.width || 800, height: opts.height || 500, iframeUrl: cleanUrl }, correct.trim());
  };

  return (
    <div className="space-y-6 text-right w-full max-w-full overflow-hidden" dir="rtl">
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">إعدادات جيوجيبرا (GeoGebra):</h5>
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400">أيفريم أو رابط جيوجيبرا:</span>
          <textarea
            rows={3}
            placeholder="ضع كود أيفريم أو رابط الحاسبة هنا..."
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-right"
            value={inputValue}
            onChange={(e) => saveGeogebra(e.target.value, correctVal)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400">الإجابة النموذجية الصحيحة:</span>
          <input
            type="text"
            placeholder="اكتب القيمة أو الحل الصحيح..."
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            value={correctVal}
            onChange={(e) => saveGeogebra(inputValue, e.target.value)}
          />
        </div>
      </div>

      {opts.iframeUrl && (
        <div className="space-y-2 pt-3 border-t border-slate-100 w-full">
          <span className="text-[10px] font-black text-slate-400 block font-bold">معاينة لوحة جيوجيبرا:</span>
          <div className="w-full aspect-[16/10] rounded-2xl overflow-hidden border border-slate-200 bg-white">
            <GeoGebraWidget materialId={opts.materialId || ""} iframeUrl={opts.iframeUrl} w={opts.width} h={opts.height} />
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 🎴 15. FLASH_CARD (البطاقات التعليمية)
// -------------------------------------------------------------
function FlashCardEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { front: "", back: "" });

  const handleChange = (field: "front" | "back", val: string) => {
    const nextOpts = { ...opts, [field]: val };
    updateQuestionData(nextOpts, nextOpts.back);
  };

  return (
    <div className="space-y-4 text-right w-full max-w-full overflow-hidden" dir="rtl">
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">محرر البطاقات التعليمية (Flash Card):</h5>
      <div className="space-y-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400">الوجه الأمامي (السؤال):</span>
          <textarea
            rows={2}
            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-right"
            value={opts.front || ""}
            onChange={(e) => handleChange("front", e.target.value)}
            placeholder="مثال: ما هو ناتج 6 ضرب 7؟"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400">الوجه الخلفي (الحل):</span>
          <textarea
            rows={2}
            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-right"
            value={opts.back || ""}
            onChange={(e) => handleChange("back", e.target.value)}
            placeholder="مثال: 42"
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🧠 16. MEMORY_GAME (لعبة الذاكرة)
// -------------------------------------------------------------
function MemoryGameEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { pairs: [] });
  const pairs = Array.isArray(opts?.pairs) ? opts.pairs : [];
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");

  const addPair = () => {
    if (!left.trim() || !right.trim()) return;
    const nextPairs = [...pairs, { left: left.trim(), right: right.trim() }];
    updateQuestionData({ pairs: nextPairs }, nextPairs);
    setLeft("");
    setRight("");
  };

  const removePair = (idx: number) => {
    const nextPairs = pairs.filter((_: any, i: number) => i !== idx);
    updateQuestionData({ pairs: nextPairs }, nextPairs);
  };

  return (
    <div className="space-y-4 text-right w-full max-w-full overflow-hidden" dir="rtl">
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">لعبة الذاكرة (Memory Matches):</h5>
      <div className="flex flex-col gap-2 w-full">
        <input
          type="text"
          placeholder="الكارت الأول..."
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
          value={left}
          onChange={(e) => setLeft(e.target.value)}
        />
        <input
          type="text"
          placeholder="الكارت المطابق الثاني..."
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
          value={right}
          onChange={(e) => setRight(e.target.value)}
        />
        <button
          type="button"
          onClick={addPair}
          className="w-full py-2 bg-slate-950 text-white rounded-xl text-xs font-black"
        >
          إضافة الزوج المتطابق
        </button>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {pairs.map((p: any, idx: number) => (
          <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs gap-2 min-w-0">
            <span className="font-bold text-slate-700 truncate min-w-0">{p.left} ↔ {p.right}</span>
            <button type="button" onClick={() => removePair(idx)} className="text-rose-500 hover:text-rose-700">
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🔠 17. WORD_SCRAMBLE (ترتيب الحروف)
// -------------------------------------------------------------
function WordScrambleEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const correctVal = question.correctAnswer || "";

  return (
    <div className="space-y-4 text-right w-full max-w-full overflow-hidden" dir="rtl">
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">ترتيب الحروف (Word Scramble):</h5>
      <div className="flex flex-col gap-1 w-full">
        <span className="text-[10px] font-black text-slate-400 font-bold">الكلمة الصحيحة:</span>
        <input
          type="text"
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-right"
          value={correctVal}
          onChange={(e) => updateQuestionData({ word: e.target.value.trim().toUpperCase() }, e.target.value.trim().toUpperCase())}
          placeholder="مثال: قطار"
        />
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🔤 18. SENTENCE_REORDER (ترتيب الجملة)
// -------------------------------------------------------------
function SentenceReorderEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const correctVal = question.correctAnswer || "";

  return (
    <div className="space-y-4 text-right w-full max-w-full overflow-hidden" dir="rtl">
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">ترتيب كلمات الجملة (Sentence Reorder):</h5>
      <div className="flex flex-col gap-1 w-full">
        <span className="text-[10px] font-black text-slate-400 font-bold">الجملة بالترتيب الصحيح (مفصولة بمسافات):</span>
        <textarea
          rows={3}
          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-right"
          value={correctVal}
          onChange={(e) => {
            const sentence = e.target.value;
            const words = sentence.split(" ").map(w => w.trim()).filter(w => w.length > 0);
            updateQuestionData({ words }, sentence);
          }}
          placeholder="مثال: السماء تمطر بغزارة في فصل الشتاء"
        />
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 📐 19. MATH_EQUATION (معادلة حسابية)
// -------------------------------------------------------------
function MathEquationEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { equation: "" });
  const correctVal = question.correctAnswer || "";

  return (
    <div className="space-y-4 text-right w-full max-w-full overflow-hidden" dir="rtl">
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">حل المعادلة الحسابية (Math Equation):</h5>
      <div className="space-y-3 w-full">
        <div className="flex flex-col gap-1 w-full">
          <span className="text-[10px] font-black text-slate-400">صيغة المعادلة الحسابية:</span>
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-center"
            value={opts.equation || ""}
            onChange={(e) => updateQuestionData({ equation: e.target.value }, correctVal)}
            placeholder="مثال: 3x + 5 = 20"
          />
        </div>
        <div className="flex flex-col gap-1 w-full">
          <span className="text-[10px] font-black text-slate-400 font-bold">القيمة الصحيحة لـ x:</span>
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-center"
            value={correctVal}
            onChange={(e) => updateQuestionData(opts, e.target.value.trim())}
            placeholder="مثال: 5"
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🔢 20. SEQUENCE_ORDER (ترتيب التسلسل)
// -------------------------------------------------------------
function SequenceOrderEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { items: [] });
  const items = Array.isArray(opts?.items) ? opts.items : [];
  const [itemInput, setItemInput] = useState("");

  const addItem = () => {
    if (!itemInput.trim()) return;
    const nextItems = [...items, itemInput.trim()];
    updateQuestionData({ items: nextItems }, nextItems);
    setItemInput("");
  };

  const removeItem = (idx: number) => {
    const nextItems = items.filter((_: any, i: number) => i !== idx);
    updateQuestionData({ items: nextItems }, nextItems);
  };

  return (
    <div className="space-y-4 text-right w-full max-w-full overflow-hidden" dir="rtl">
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">ترتيب التسلسل التصاعدي/التنازلي:</h5>
      <div className="flex flex-col gap-2 w-full">
        <input
          type="text"
          placeholder="أدخل العنصر بالترتيب الصحيح..."
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
          value={itemInput}
          onChange={(e) => setItemInput(e.target.value)}
        />
        <button
          type="button"
          onClick={addItem}
          className="w-full py-2 bg-slate-950 text-white rounded-xl text-xs font-black"
        >
          إضافة
        </button>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {items.map((item: string, idx: number) => (
          <div key={idx} className="p-2.5 bg-white rounded-xl border border-emerald-200 flex justify-between items-center text-xs gap-2 min-w-0 shadow-2xs">
            <div className="flex items-center gap-2 truncate min-w-0">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shrink-0 text-[10px]">{idx + 1}</span>
              <span className="font-bold text-slate-800 truncate min-w-0">{item}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black text-[9px] border border-emerald-200 shrink-0">
                ✅ {language === 'ar' ? `الترتيب ${idx + 1} الصحيح` : `Correct Step ${idx + 1}`}
              </span>
            </div>
            <button type="button" onClick={() => removeItem(idx)} className="text-rose-500 hover:text-rose-700 shrink-0">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-400 font-bold">
        💡 أدخل العناصر بالترتيب الصحيح، وسيبعثرها النظام للطلبة تلقائياً.
      </p>
    </div>
  );
}

// -------------------------------------------------------------
// 🔠 21. CROSSWORD (الكلمات المتقاطعة)
// -------------------------------------------------------------
function CrosswordEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { words: [] });
  const words = Array.isArray(opts?.words) ? opts.words : [];
  const [word, setWord] = useState("");
  const [clue, setClue] = useState("");

  const addPair = () => {
    if (!word.trim() || !clue.trim()) return;
    const nextWords = [...words, { word: word.trim().toUpperCase(), clue: clue.trim() }];
    updateQuestionData({ words: nextWords }, nextWords);
    setWord("");
    setClue("");
  };

  const removePair = (idx: number) => {
    const nextWords = words.filter((_: any, i: number) => i !== idx);
    updateQuestionData({ words: nextWords }, nextWords);
  };

  return (
    <div className="space-y-4 text-right w-full max-w-full overflow-hidden" dir="rtl">
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">الكلمات المتقاطعة (Crossword):</h5>
      <div className="flex flex-col gap-2 w-full">
        <input
          type="text"
          placeholder="الكلمة (مثل: أسد)..."
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
          value={word}
          onChange={(e) => setWord(e.target.value)}
        />
        <input
          type="text"
          placeholder="التلميح والسؤال..."
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
          value={clue}
          onChange={(e) => setClue(e.target.value)}
        />
        <button
          type="button"
          onClick={addPair}
          className="w-full py-2 bg-slate-950 text-white rounded-xl text-xs font-black"
        >
          إضافة
        </button>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {words.map((item: any, idx: number) => (
          <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs gap-2 min-w-0">
            <span className="font-bold text-slate-700 truncate min-w-0">{item.word} ➔ {item.clue}</span>
            <button type="button" onClick={() => removePair(idx)} className="text-rose-500 hover:text-rose-700">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🔢 22. COUNT_OBJECTS (عد العناصر)
// -------------------------------------------------------------
function CountObjectsEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { itemImage: "", itemName: "" });
  const correctVal = question.correctAnswer || "1";

  const handleChange = (field: "itemImage" | "itemName", val: string) => {
    updateQuestionData({ ...opts, [field]: val }, correctVal);
  };

  return (
    <div className="space-y-4 text-right w-full max-w-full overflow-hidden" dir="rtl">
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">لعبة عد العناصر والمطابقة العددية:</h5>
      <div className="space-y-3 w-full">
        <div className="flex flex-col gap-1 w-full">
          <span className="text-[10px] font-black text-slate-400">رابط صورة العنصر:</span>
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            value={opts.itemImage || ""}
            onChange={(e) => handleChange("itemImage", e.target.value)}
            placeholder="https://example.com/apple.png"
          />
        </div>
        <div className="flex flex-col gap-1 w-full">
          <span className="text-[10px] font-black text-slate-400">اسم العنصر:</span>
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            value={opts.itemName || ""}
            onChange={(e) => handleChange("itemName", e.target.value)}
            placeholder="تفاحة"
          />
        </div>
        <div className="flex flex-col gap-1 w-full">
          <span className="text-[10px] font-black text-slate-400 font-bold">العدد الإجمالي المطلوب:</span>
          <input
            type="number"
            min="1"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-center font-bold"
            value={correctVal}
            onChange={(e) => updateQuestionData(opts, e.target.value)}
            placeholder="5"
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🖼️ 23. IMAGE_LABEL (تسمية أجزاء الصورة)
// -------------------------------------------------------------
function ImageLabelEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { imageUrl: "", labels: [] });
  const labels = Array.isArray(opts?.labels) ? opts.labels : [];
  const [label, setLabel] = useState("");
  const [xPercent, setXPercent] = useState("50");
  const [yPercent, setYPercent] = useState("50");

  const addLabel = () => {
    if (!label.trim()) return;
    const nextLabels = [...labels, { text: label.trim(), x: parseFloat(xPercent) || 50, y: parseFloat(yPercent) || 50 }];
    updateQuestionData({ imageUrl: opts.imageUrl, labels: nextLabels }, nextLabels);
    setLabel("");
  };

  const removeLabel = (idx: number) => {
    const nextLabels = labels.filter((_: any, i: number) => i !== idx);
    updateQuestionData({ imageUrl: opts.imageUrl, labels: nextLabels }, nextLabels);
  };

  return (
    <div className="space-y-4 text-right w-full max-w-full overflow-hidden" dir="rtl">
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">تسمية أجزاء ومحتويات الصورة:</h5>
      <div className="space-y-3 w-full">
        <div className="flex flex-col gap-1 w-full">
          <span className="text-[10px] font-black text-slate-400 font-bold">رابط الصورة الخلفية:</span>
          <input
            type="text"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            value={opts.imageUrl || ""}
            onChange={(e) => updateQuestionData({ imageUrl: e.target.value, labels }, labels)}
            placeholder="https://example.com/anatomy.jpg"
          />
        </div>

        <div className="bg-slate-50 p-3.5 border border-slate-150 rounded-xl space-y-3 w-full">
          <span className="text-[10px] font-black text-slate-400 block font-bold">إضافة علامة تسمية جديدة:</span>
          <div className="flex flex-col gap-2 w-full">
            <input
              type="text"
              placeholder="اسم التسمية..."
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <input
              type="number"
              placeholder="X (0-100)%"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
              value={xPercent}
              onChange={(e) => setXPercent(e.target.value)}
            />
            <input
              type="number"
              placeholder="Y (0-100)%"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
              value={yPercent}
              onChange={(e) => setYPercent(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={addLabel}
            className="w-full py-2 bg-slate-950 text-white rounded-xl text-xs font-black cursor-pointer"
          >
            إضافة علامة تسمية
          </button>
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto">
          {labels.map((item: any, idx: number) => (
            <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs gap-2 min-w-0">
              <span className="font-bold text-slate-700 truncate min-w-0">{item.text} (X: {item.x}%, Y: {item.y}%)</span>
              <button type="button" onClick={() => removeLabel(idx)} className="text-rose-500 hover:text-rose-700">
                <Trash2 className="w-4.5 h-4.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 🎨 24. COLOR_MATCH (تطابق الألوان)
// -------------------------------------------------------------
function ColorMatchEditor({ question, updateQuestionData, language }: { question: any; updateQuestionData: any; language: string }) {
  const opts = parseJson(question.options, { pairs: [] });
  const pairs = Array.isArray(opts?.pairs) ? opts.pairs : [];
  const [item, setItem] = useState("");
  const [color, setColor] = useState("");

  const addPair = () => {
    if (!item.trim() || !color.trim()) return;
    const nextPairs = [...pairs, { item: item.trim(), color: color.trim() }];
    updateQuestionData({ pairs: nextPairs }, nextPairs);
    setItem("");
    setColor("");
  };

  const removePair = (idx: number) => {
    const nextPairs = pairs.filter((_: any, i: number) => i !== idx);
    updateQuestionData({ pairs: nextPairs }, nextPairs);
  };

  return (
    <div className="space-y-4 text-right w-full max-w-full overflow-hidden" dir="rtl">
      <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest">تطابق الألوان والمفاهيم البصرية:</h5>
      <div className="flex flex-col gap-2 w-full">
        <input
          type="text"
          placeholder="العنصر (مثل: موزة)..."
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
          value={item}
          onChange={(e) => setItem(e.target.value)}
        />
        <input
          type="text"
          placeholder="اللون الصحيح لها (مثل: أصفر)..."
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <button
          type="button"
          onClick={addPair}
          className="w-full py-2 bg-slate-950 text-white rounded-xl text-xs font-black"
        >
          إضافة
        </button>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {pairs.map((p: any, idx: number) => (
          <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs gap-2 min-w-0">
            <span className="font-bold text-slate-700 truncate min-w-0">{p.item} ➔ {p.color}</span>
            <button type="button" onClick={() => removePair(idx)} className="text-rose-500 hover:text-rose-700">
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
