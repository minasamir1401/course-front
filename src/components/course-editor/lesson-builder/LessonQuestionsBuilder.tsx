"use client";

import { normalizeDok } from '@/lib/examQuestionMetadata';
import React, { useState } from "react";
import { 
  Plus, Trash2, HelpCircle, Upload, Download, Edit2, CheckCircle2, 
  Lightbulb, TriangleAlert, ChevronDown, ChevronUp, Save, X, BookOpen, Target, FileText, Copy, Languages, Loader2,
  Image as ImageIcon
} from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import { getOptionLetter, cleanOptionText } from "@/lib/utils";
import { useNotification } from "@/context/NotificationContext";
import MathInput from "@/components/MathInput";
import { normalizeAnswerGlobal } from "@/components/LessonSubComponents";
import HtmlRenderer from "@/components/HtmlRenderer";
import { parseJson } from "./parseJson";
import { getSectionStylePresets } from "./constants";
import CopySlidesModal from "@/components/modals/CopySlidesModal";
import { useCourseEditor } from "../CourseEditorContext";
import * as XLSX from "xlsx";
import { QuestionExcelExportButton } from '@/components/QuestionExcelExportButton';
import { translateBatch } from '@/lib/translationService';
interface LessonQuestionsBuilderProps {
  source: 'assignments' | 'questions';
  currentLesson: any;
  setCurrentLesson: (lesson: any) => void;
  language: string;
  assignmentsExcelRef: React.RefObject<HTMLInputElement | null>;
  questionsExcelRef: React.RefObject<HTMLInputElement | null>;
  handleAssignmentsExcelChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleQuestionsExcelChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExcelUpload: (type: 'questions' | 'metadata' | 'assignments') => void;
  downloadQuestionsTemplate: (type: 'questions' | 'assignments') => void;
  showQuestionForm: boolean;
  setShowQuestionForm: (show: boolean) => void;
  editingQuestionIndex: number | null;
  setEditingQuestionIndex: (idx: number | null) => void;
  tempQuestion: any;
  setTempQuestion: (q: any) => void;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
}

export const LessonQuestionsBuilder: React.FC<LessonQuestionsBuilderProps> = ({
  source,
  currentLesson,
  setCurrentLesson,
  language,
  assignmentsExcelRef,
  questionsExcelRef,
  handleAssignmentsExcelChange,
  handleQuestionsExcelChange,
  handleExcelUpload,
  downloadQuestionsTemplate,
  showQuestionForm,
  setShowQuestionForm,
  editingQuestionIndex,
  setEditingQuestionIndex,
  tempQuestion,
  setTempQuestion,
  openDropdownId,
  setOpenDropdownId
}) => {
  const { showToast } = useNotification();
  const { availableMetadata } = useCourseEditor() as any;
  const [expandedQuestionIndex, setExpandedQuestionIndex] = useState<number | null>(null);
  const [isQuestionStandardOpen, setIsQuestionStandardOpen] = useState(false);
  const [isQuestionIndicatorOpen, setIsQuestionIndicatorOpen] = useState(false);
  const [isQuestionOutcomeOpen, setIsQuestionOutcomeOpen] = useState(false);
  const [showQuestionMetadata, setShowQuestionMetadata] = useState(false);
  const [showQuestionSections, setShowQuestionSections] = useState(false);
  const [questionSource, setQuestionSource] = useState<'assignments' | 'questions'>(source);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  
  const [adminRole, setAdminRole] = useState<string | null>(null);
  React.useEffect(() => {
    setAdminRole(localStorage.getItem('admin_role'));
  }, []);
  const isSuperAdmin = adminRole === 'SUPER_ADMIN';

  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const [questionActiveLang, setQuestionActiveLang] = useState<'ar' | 'en'>('ar');
  const [cardPreviewLang, setCardPreviewLang] = useState<Record<number, 'ar' | 'en'>>({});
  const [isTranslatingQuestion, setIsTranslatingQuestion] = useState(false);

  const lastActiveQKeyRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!showQuestionForm || !tempQuestion) {
      lastActiveQKeyRef.current = null;
      return;
    }
    const qKey = `${editingQuestionIndex ?? 'new'}-${tempQuestion?.id ?? ''}`;
    if (lastActiveQKeyRef.current === qKey) return;
    lastActiveQKeyRef.current = qKey;

    const clean = (str?: string | null) => String(str || '').replace(/<[^>]*>/g, '').trim();
    const hasArabic = (str?: string | null) => /[\u0600-\u06FF]/.test(clean(str));
    const hasEnglish = (str?: string | null) => /[a-zA-Z]/.test(clean(str));

    const textClean = clean(tempQuestion.text);
    const textEnClean = clean(tempQuestion.textEn);
    const optsClean = Array.isArray(tempQuestion.options) ? tempQuestion.options.map(clean).join(' ') : '';
    const optsEnClean = Array.isArray(tempQuestion.optionsEn) ? tempQuestion.optionsEn.map(clean).join(' ') : '';

    const allAr = `${textClean} ${optsClean}`;
    const allEn = `${textEnClean} ${optsEnClean}`;

    const hasAr = hasArabic(allAr);
    const hasEn = hasEnglish(allEn) || (hasEnglish(allAr) && !hasAr);

    if (hasEn && !hasAr) {
      setQuestionActiveLang('en');
    } else if (hasAr && !hasEn) {
      setQuestionActiveLang('ar');
    } else if (hasArabic(textClean)) {
      setQuestionActiveLang('ar');
    } else if (hasEnglish(textClean) && !hasArabic(textClean)) {
      setQuestionActiveLang('en');
    } else if (language === 'en') {
      setQuestionActiveLang('en');
    } else {
      setQuestionActiveLang('ar');
    }
  }, [showQuestionForm, editingQuestionIndex, tempQuestion?.id, language]);

  const extractFirstImage = (question: any): string | null => {
    if (!question) return null;
    if (question.imageUrl && typeof question.imageUrl === 'string' && question.imageUrl.trim()) {
      return question.imageUrl.trim();
    }
    const match = (question.text || '').match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match && match[1]) return match[1];
    const matchEn = (question.textEn || '').match(/<img[^>]+src=["']([^"']+)["']/i);
    if (matchEn && matchEn[1]) return matchEn[1];
    return null;
  };

  const handleAutoTranslateQuestion = async () => {
    if (!tempQuestion) return;
    setIsTranslatingQuestion(true);
    try {
      const from = questionActiveLang;
      const to = from === 'ar' ? 'en' : 'ar';

      const isBaseEnOnly = tempQuestion.text && /[a-zA-Z]/.test(tempQuestion.text) && !/[\u0600-\u06FF]/.test(tempQuestion.text);
      const srcText = from === 'ar'
        ? (tempQuestion.text || '')
        : (tempQuestion.textEn || (isBaseEnOnly ? tempQuestion.text : ''));
      const srcExplanation = from === 'ar'
        ? (tempQuestion.explanation || '')
        : (tempQuestion.explanationEn || tempQuestion.explanation || '');

      const baseLength = Math.max((tempQuestion.options || []).length, (tempQuestion.optionsEn || []).length, 4);
      const srcOpts = from === 'ar'
        ? Array.from({ length: baseLength }, (_, i) => String(tempQuestion.options?.[i] || ''))
        : Array.from({ length: baseLength }, (_, i) => String(tempQuestion.optionsEn?.[i] || tempQuestion.options?.[i] || ''));

      const sectionsList = tempQuestion.sections || [];
      const srcSections = sectionsList.map((sec: any) =>
        from === 'ar' ? (sec.content || '') : (sec.contentEn || sec.content || '')
      );

      const srcDomain = from === 'ar' ? (tempQuestion.domain || '') : (tempQuestion.domainEn || tempQuestion.domain || '');
      const srcOutcome = from === 'ar' ? (tempQuestion.standard || tempQuestion.learningOutcome || '') : (tempQuestion.standardEn || tempQuestion.learningOutcomeEn || tempQuestion.standard || '');
      const srcIndicator = from === 'ar' ? (tempQuestion.indicator || '') : (tempQuestion.indicatorEn || tempQuestion.indicator || '');
      const srcSkill = from === 'ar' ? (tempQuestion.skill || '') : (tempQuestion.skillEn || tempQuestion.skill || '');
      const srcSubskill = from === 'ar' ? (tempQuestion.subskill || '') : (tempQuestion.subskillEn || tempQuestion.subskill || '');
      const srcMicroSkill = from === 'ar' ? (tempQuestion.microSkill || '') : (tempQuestion.microSkillEn || tempQuestion.microSkill || '');
      const srcErrorPattern = from === 'ar' ? (tempQuestion.errorPattern || '') : (tempQuestion.errorPatternEn || tempQuestion.errorPattern || '');

      const textsToTranslate = [
        srcText || '',
        srcExplanation || '',
        ...srcOpts,
        ...srcSections,
        srcDomain,
        srcOutcome,
        srcIndicator,
        srcSkill,
        srcSubskill,
        srcMicroSkill,
        srcErrorPattern
      ];

      const translations = await translateBatch(textsToTranslate, from, to);

      let cursor = 0;
      const trText = translations[cursor++] || '';
      const trExplanation = translations[cursor++] || '';

      const trOpts = translations.slice(cursor, cursor + srcOpts.length);
      cursor += srcOpts.length;

      const trSections = translations.slice(cursor, cursor + srcSections.length);
      cursor += srcSections.length;

      const trDomain = translations[cursor++] || '';
      const trOutcome = translations[cursor++] || '';
      const trIndicator = translations[cursor++] || '';
      const trSkill = translations[cursor++] || '';
      const trSubskill = translations[cursor++] || '';
      const trMicroSkill = translations[cursor++] || '';
      const trErrorPattern = translations[cursor++] || '';

      const updated = { ...tempQuestion };
      if (to === 'en') {
        if (trText) updated.textEn = trText;
        if (trExplanation) updated.explanationEn = trExplanation;
        updated.optionsEn = trOpts;

        if (sectionsList.length > 0) {
          updated.sections = sectionsList.map((sec: any, i: number) => ({
            ...sec,
            contentEn: trSections[i] || sec.contentEn || sec.content || ''
          }));
          if (!updated.explanationEn && trSections[0]) {
            updated.explanationEn = trSections[0];
          }
        } else if (trExplanation) {
          updated.sections = [{ id: Date.now(), type: 'EXPLANATION', content: srcExplanation || '', contentEn: trExplanation }];
        }

        if (trDomain) updated.domainEn = trDomain;
        if (trOutcome) {
          updated.standardEn = trOutcome;
          updated.learningOutcomeEn = trOutcome;
        }
        if (trIndicator) updated.indicatorEn = trIndicator;
        if (trSkill) updated.skillEn = trSkill;
        if (trSubskill) updated.subskillEn = trSubskill;
        if (trMicroSkill) updated.microSkillEn = trMicroSkill;
        if (trErrorPattern) updated.errorPatternEn = trErrorPattern;

        if (tempQuestion.correctAnswerIndex !== undefined && tempQuestion.correctAnswerIndex !== null) {
          if (trOpts[tempQuestion.correctAnswerIndex]) {
            updated.correctAnswerEn = trOpts[tempQuestion.correctAnswerIndex];
          }
        } else if (tempQuestion.correctAnswer) {
          const arOpts = tempQuestion.options || [];
          const matchedIdx = arOpts.findIndex((o: string) => String(o).trim() === String(tempQuestion.correctAnswer).trim());
          if (matchedIdx !== -1 && trOpts[matchedIdx]) {
            updated.correctAnswerEn = trOpts[matchedIdx];
            updated.correctAnswerIndex = matchedIdx;
          }
        }
        setQuestionActiveLang('en');
      } else {
        if (trText) updated.text = trText;
        if (trExplanation) updated.explanation = trExplanation;
        updated.options = trOpts;

        if (sectionsList.length > 0) {
          updated.sections = sectionsList.map((sec: any, i: number) => ({
            ...sec,
            content: trSections[i] || sec.content || sec.contentEn || ''
          }));
          if (!updated.explanation && trSections[0]) {
            updated.explanation = trSections[0];
          }
        } else if (trExplanation) {
          updated.sections = [{ id: Date.now(), type: 'EXPLANATION', content: trExplanation, contentEn: srcExplanation || '' }];
        }

        if (trDomain) updated.domain = trDomain;
        if (trOutcome) {
          updated.standard = trOutcome;
          updated.learningOutcome = trOutcome;
        }
        if (trIndicator) updated.indicator = trIndicator;
        if (trSkill) updated.skill = trSkill;
        if (trSubskill) updated.subskill = trSubskill;
        if (trMicroSkill) updated.microSkill = trMicroSkill;
        if (trErrorPattern) updated.errorPattern = trErrorPattern;

        if (tempQuestion.correctAnswerIndex !== undefined && tempQuestion.correctAnswerIndex !== null) {
          if (trOpts[tempQuestion.correctAnswerIndex]) {
            updated.correctAnswer = trOpts[tempQuestion.correctAnswerIndex];
          }
        } else if (tempQuestion.correctAnswerEn || tempQuestion.correctAnswer) {
          const enOpts = tempQuestion.optionsEn || [];
          const target = tempQuestion.correctAnswerEn || tempQuestion.correctAnswer;
          const matchedIdx = enOpts.findIndex((o: string) => String(o).trim() === String(target).trim());
          if (matchedIdx !== -1 && trOpts[matchedIdx]) {
            updated.correctAnswer = trOpts[matchedIdx];
            updated.correctAnswerIndex = matchedIdx;
          }
        }
        setQuestionActiveLang('ar');
      }

      setTempQuestion(updated);
      showToast(language === 'ar' ? 'تمت الترجمة الفورية لكامل السؤال والميتا داتا بنجاح' : 'Question and metadata translated successfully', 'success');
    } catch (err: any) {
      console.error('Auto translate question error:', err);
      showToast(err.message || (language === 'ar' ? 'فشلت الترجمة التلقائية' : 'Auto translation failed'), 'error');
    } finally {
      setIsTranslatingQuestion(false);
    }
  };

  const DEFAULT_SKILLS = [
    "Problem Solving", "Reasoning", "Number Sense", "Algebraic Thinking", "Geometry", "Data Analysis",
    "Observation", "Investigation", "Scientific Reasoning", "Data Interpretation", "Experiment Design",
    "Main Idea", "Inference", "Vocabulary in Context", "Author's Purpose", "Supporting Details"
  ];

  const allExistingSkills = Array.from(new Set([
    ...DEFAULT_SKILLS,
    ...customSkills,
    ...(currentLesson.slides || []).map((s: any) => s.skill),
    ...(currentLesson.assignments || []).map((a: any) => a.skill),
    ...(currentLesson.questions || []).map((q: any) => q.skill)
  ].filter(Boolean)));

  const QUESTION_TYPES = [
    { id: "MCQ", label: language === 'ar' ? "اختيار من متعدد" : "Multiple Choice" },
    { id: "TRUE_FALSE", label: language === 'ar' ? "صح وخطأ" : "True / False" },
    { id: "MULTI_SELECT", label: language === 'ar' ? "اختيار متعدد" : "Multi Select" }
  ];

  const SECTION_STYLE_PRESETS: any = getSectionStylePresets(language);

  const handleAddQuestionForSource = (source: 'assignments' | 'questions') => {
    setTempQuestion({
      id: Date.now() + Math.random(),
      text: "",
      type: "MCQ",
      label: "MCQ",
      options: ["", "", "", ""],
      correctAnswer: "",
      correctAnswers: [],
      points: 1,
      xpPoints: 10,
      skill: "Problem Solving",
      level: "On Level",
      standard: "",
      indicator: "",
      learningOutcome: "",
      videoUrl: "",
      sections: [],
      attempts: 1
    });
    setEditingQuestionIndex(null);
    setQuestionSource(source);
    setShowQuestionMetadata(false);
    setShowQuestionSections(false);
    setShowQuestionForm(true);
  };

  const handleEditQuestionForSource = (source: 'assignments' | 'questions', index: number) => {
    const list = currentLesson[source] || [];
    const item = { ...list[index] };
    if (!item.options) item.options = ["", "", "", ""];
    if (!item.sections) item.sections = [];
    if (!item.type) item.type = item.label || "MCQ";
    const outcome = item.standard || item.learningOutcome || "";
    item.standard = outcome;
    item.learningOutcome = outcome;
    if (item.dok) item.dok = normalizeDok(item.dok) || item.dok;

    const hasArabic = (str?: string | null) => /[\u0600-\u06FF]/.test(String(str || ''));
    const hasEnglish = (str?: string | null) => /[a-zA-Z]/.test(String(str || ''));

    if (!item.textEn && item.text && hasEnglish(item.text) && !hasArabic(item.text)) {
      item.textEn = item.text;
    }
    if ((!item.optionsEn || item.optionsEn.length === 0) && Array.isArray(item.options) && item.options.some((o: any) => hasEnglish(o) && !hasArabic(o))) {
      item.optionsEn = [...item.options];
    }
    if (!item.explanationEn && item.explanation && hasEnglish(item.explanation) && !hasArabic(item.explanation)) {
      item.explanationEn = item.explanation;
    }
    if (Array.isArray(item.sections)) {
      item.sections = item.sections.map((s: any) => ({
        ...s,
        contentEn: s.contentEn || (hasEnglish(s.content) && !hasArabic(s.content) ? s.content : '')
      }));
    }

    setTempQuestion(item);
    setEditingQuestionIndex(index);
    setQuestionSource(source);
    setShowQuestionMetadata(false);
    setShowQuestionSections(false);
    const isEn = Boolean(item.textEn && (!item.text || item.text === item.textEn)) || (hasEnglish(item.text) && !hasArabic(item.text));
    setQuestionActiveLang(isEn ? 'en' : 'ar');
    setShowQuestionForm(true);
  };

  const handleSaveQuestionForSource = (source: 'assignments' | 'questions') => {
    if (!tempQuestion.text && tempQuestion.textEn) {
      tempQuestion.text = tempQuestion.textEn;
    }
    if ((!tempQuestion.options || tempQuestion.options.length === 0 || tempQuestion.options.every((o: any) => !o)) && tempQuestion.optionsEn?.length) {
      tempQuestion.options = [...tempQuestion.optionsEn];
    }
    if (!tempQuestion.explanation && tempQuestion.explanationEn) {
      tempQuestion.explanation = tempQuestion.explanationEn;
    }
    if ((!tempQuestion.optionsEn || tempQuestion.optionsEn.length === 0) && tempQuestion.options?.length) {
      tempQuestion.optionsEn = [...tempQuestion.options];
    }
    if (!tempQuestion.textEn && tempQuestion.text && /[a-zA-Z]/.test(tempQuestion.text) && !/[\u0600-\u06FF]/.test(tempQuestion.text)) {
      tempQuestion.textEn = tempQuestion.text;
    }

    if (!tempQuestion.text && !tempQuestion.textEn) {
      showToast(language === 'ar' ? "يرجى إدخال نص السؤال" : "Please enter question text", "error");
      return;
    }

    if (tempQuestion.type !== 'TEXT') {
      if (tempQuestion.type === 'TRUE_FALSE') {
        if (!tempQuestion.correctAnswer) {
          showToast(language === 'ar' ? "يرجى تحديد الإجابة الصحيحة" : "Please select the correct answer", "error");
          return;
        }
      } else if (tempQuestion.type === 'MULTI_SELECT') {
        const validAnswers = (tempQuestion.correctAnswers || []).filter(Boolean);
        if (validAnswers.length === 0) {
          showToast(language === 'ar' ? "يرجى اختيار إجابة صحيحة واحدة على الأقل" : "Please select at least one correct answer", "error");
          return;
        }
      } else {
        if (!tempQuestion.correctAnswer) {
          showToast(language === 'ar' ? "يرجى اختيار الإجابة الصحيحة" : "Please select the correct answer", "error");
          return;
        }
      }
    }

    const outcome = tempQuestion.standard || tempQuestion.learningOutcome || "";
    const itemToSave = {
      ...tempQuestion,
      text: tempQuestion.text || tempQuestion.textEn || "",
      textEn: tempQuestion.textEn || "",
      optionsEn: tempQuestion.optionsEn || [],
      explanationEn: tempQuestion.explanationEn || "",
      standard: outcome,
      learningOutcome: outcome,
      dok: normalizeDok(tempQuestion.dok) || tempQuestion.dok || "",
      label: tempQuestion.type // Ensure label is synced with type
    };

    setCurrentLesson((prev: any) => {
      const newList = [...(prev[source] || [])];
      if (editingQuestionIndex !== null) {
        newList[editingQuestionIndex] = itemToSave;
      } else {
        newList.push(itemToSave);
      }
      return { ...prev, [source]: newList };
    });
    setShowQuestionForm(false);
    setEditingQuestionIndex(null);
    showToast(language === 'ar' ? "تم حفظ السؤال في القائمة بنجاح" : "Question saved to list successfully", "success");
  };

  const removeQuestionForSource = (source: 'assignments' | 'questions', index: number) => {
    if (!confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا السؤال؟" : "Are you sure you want to delete this question?")) return;
    setCurrentLesson((prev: any) => {
      const newList = [...(prev[source] || [])];
      newList.splice(index, 1);
      return { ...prev, [source]: newList };
    });
    setExpandedQuestionIndex((expanded) => expanded === index ? null : (expanded !== null && expanded > index ? expanded - 1 : expanded));
    if (editingQuestionIndex === index) {
      setEditingQuestionIndex(null);
      setShowQuestionForm(false);
    } else if (editingQuestionIndex !== null && editingQuestionIndex > index) {
      setEditingQuestionIndex(editingQuestionIndex - 1);
    }
    showToast(language === 'ar' ? "تم حذف السؤال" : "Question deleted", "info");
  };

  const moveQuestionForSource = (source: 'assignments' | 'questions', index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= (currentLesson[source] || []).length) return;
    setCurrentLesson((prev: any) => {
      const newList = [...(prev[source] || [])];
      if (targetIndex >= newList.length) return prev;
      [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
      return { ...prev, [source]: newList };
    });
    setExpandedQuestionIndex((expanded) => expanded === index ? targetIndex : (expanded === targetIndex ? index : expanded));
    if (editingQuestionIndex === index) setEditingQuestionIndex(targetIndex);
    else if (editingQuestionIndex === targetIndex) setEditingQuestionIndex(index);
  };

  const updateCurrentQuestionField = (field: string, value: any) => {
    setTempQuestion((prev: any) => {
      const updated: any = { ...prev, [field]: value };
      if (field === 'standard') {
        updated.learningOutcome = value;
      } else if (field === 'learningOutcome') {
        updated.standard = value;
      } else if (field === 'dok') {
        updated.dok = normalizeDok(value) || value;
      }
      return updated;
    });
  };

  const updateQuestionOption = (oIdx: number, value: string) => {
    setTempQuestion((prev: any) => {
      const baseLength = Math.max((prev.options || []).length, 4);
      const newOpts = Array.from({ length: baseLength }, (_, i) => String(prev.options?.[i] || ''));
      const oldVal = newOpts[oIdx];
      newOpts[oIdx] = value;
      const updated: any = { ...prev, options: newOpts };
      if (prev.type === 'MULTI_SELECT') {
        const answers = prev.correctAnswers || [];
        if (answers.includes(oldVal)) {
          updated.correctAnswers = Array.isArray(answers) ? answers.map((a: string) => a === oldVal ? value : a) : [];
        }
      } else {
        if (prev.correctAnswer === oldVal || prev.correctAnswerIndex === oIdx) {
          updated.correctAnswer = value;
        }
      }
      return updated;
    });
  };

  const toggleQuestionCorrectAnswer = (oIdx: number) => {
    setTempQuestion((prev: any) => {
      const baseLength = Math.max(
        (prev.options || []).length,
        (prev.optionsEn || []).length,
        4
      );
      const currentOptsAr = Array.from({ length: baseLength }, (_, i) => String(prev.options?.[i] || ''));
      const currentOptsEn = Array.from({ length: baseLength }, (_, i) => String(prev.optionsEn?.[i] || ''));

      const arOpt = currentOptsAr[oIdx] || '';
      const enOpt = currentOptsEn[oIdx] || '';

      const updated = { ...prev };
      updated.correctAnswerIndex = oIdx;

      if (prev.type === 'MULTI_SELECT') {
        const answers = prev.correctAnswers || [];
        const indices = prev.correctAnswerIndices || [];
        const answersEn = prev.correctAnswersEn || [];

        const isCurrentlySelected =
          indices.includes(oIdx) ||
          (arOpt && answers.includes(arOpt)) ||
          (enOpt && (answers.includes(enOpt) || answersEn.includes(enOpt)));

        if (isCurrentlySelected) {
          updated.correctAnswerIndices = indices.filter((i: number) => i !== oIdx);
          if (arOpt) updated.correctAnswers = answers.filter((a: string) => a !== arOpt);
          if (enOpt) updated.correctAnswersEn = answersEn.filter((a: string) => a !== enOpt);
        } else {
          updated.correctAnswerIndices = [...indices.filter((i: number) => i !== oIdx), oIdx];
          if (arOpt) updated.correctAnswers = [...answers.filter((a: string) => a !== arOpt), arOpt];
          if (enOpt) updated.correctAnswersEn = [...answersEn.filter((a: string) => a !== enOpt), enOpt];
        }
      } else {
        updated.correctAnswer = arOpt || enOpt || '';
        if (enOpt) updated.correctAnswerEn = enOpt;
        if (arOpt) updated.correctAnswer = arOpt;
      }
      return updated;
    });
  };

  const isQuestionCorrectAnswer = (opt: string) => {
    if (!opt && typeof opt !== 'string') return false;
    const clean = String(opt).trim();
    if (!clean) return false;

    if (tempQuestion.type === 'TRUE_FALSE') {
      return normalizeAnswerGlobal(tempQuestion.correctAnswer) === normalizeAnswerGlobal(clean) ||
             normalizeAnswerGlobal(tempQuestion.correctAnswerEn) === normalizeAnswerGlobal(clean);
    }

    if (tempQuestion.type === 'MULTI_SELECT') {
      const answers = (tempQuestion.correctAnswers || []).map((a: any) => String(a).trim());
      const answersEn = (tempQuestion.correctAnswersEn || []).map((a: any) => String(a).trim());
      return answers.includes(clean) || answersEn.includes(clean);
    }

    const curAns = String(tempQuestion.correctAnswer || '').trim();
    const curAnsEn = String(tempQuestion.correctAnswerEn || '').trim();
    return curAns === clean || curAnsEn === clean;
  };

  const addQuestionSection = (secType: string) => {
    setTempQuestion((prev: any) => {
      const sections = [...(prev.sections || [])];
      sections.push({ id: Date.now() + Math.random(), type: secType, content: "" });
      return { ...prev, sections };
    });
  };

  const updateQuestionSectionContent = (idx: number, value: string) => {
    setTempQuestion((prev: any) => {
      const sections = [...(prev.sections || [])];
      sections[idx] = { ...sections[idx], content: value };
      return { ...prev, sections };
    });
  };

  const removeQuestionSection = (idx: number) => {
    setTempQuestion((prev: any) => {
      const sections = [...(prev.sections || [])];
      sections.splice(idx, 1);
      return { ...prev, sections };
    });
  };

  // State to track which question is expanded in the list
  
  const renderMetadataDropdown = (
    label: string,
    currentValue: string,
    field: 'standard' | 'indicator' | 'learningOutcome',
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    lessonField: 'standards' | 'indicators' | 'learningOutcomes'
  ) => {
    const list = (currentLesson[lessonField] || "").split("\n").filter(Boolean);
    const selectPlaceholder = language === 'ar' ? `اختر ${label}...` : `Select ${label}...`;
    const addCustomLabel = language === 'ar' ? `+ إضافة ${label} مخصص...` : `+ Add Custom ${label}...`;
    const promptEnterLabel = language === 'ar' ? `أدخل ${label} المخصص الجديد:` : `Enter new custom ${label}:`;
    const promptEditLabel = language === 'ar' ? `تعديل ${label} المخصص:` : `Edit custom ${label}:`;
    const confirmDeleteLabel = language === 'ar' ? `هل أنت متأكد من حذف هذا ${label}؟` : `Are you sure you want to delete this ${label}?`;

    return (
      <div className="flex flex-col gap-2 relative">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        <div className="relative flex items-center">
          <input
            type="text"
            value={currentValue}
            onChange={(e) => updateCurrentQuestionField(field, e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={selectPlaceholder}
            className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-slate-700 font-bold text-xs outline-none min-h-[34px] focus:border-indigo-600 transition-all text-right"
            dir="auto"
          />
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              if (field === 'standard') {
                setIsQuestionIndicatorOpen(false);
                setIsQuestionOutcomeOpen(false);
              } else if (field === 'indicator') {
                setIsQuestionStandardOpen(false);
                setIsQuestionOutcomeOpen(false);
              } else {
                setIsQuestionStandardOpen(false);
                setIsQuestionIndicatorOpen(false);
              }
            }}
            className="absolute left-0 top-0 bottom-0 px-3 flex items-center justify-center text-slate-400 hover:text-indigo-600"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
        
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
            <div className="absolute top-full left-0 z-50 w-72 mt-1 bg-white border border-slate-150 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150" dir="rtl">
              {list.map((opt: string) => (
                <div key={opt} className="flex items-center justify-between gap-2 px-2.5 py-1.5 hover:bg-slate-50 rounded-xl transition-all">
                  <button
                    type="button"
                    onClick={() => {
                      updateCurrentQuestionField(field, opt);
                      setIsOpen(false);
                    }}
                    className="flex-1 text-right font-bold text-slate-700 text-xs truncate"
                  >
                    {opt}
                  </button>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const newVal = prompt(promptEditLabel, opt);
                        if (newVal !== null && newVal.trim()) {
                          const newList = list.map((x: string) => x === opt ? newVal.trim() : x);
                          setCurrentLesson({ ...currentLesson, [lessonField]: newList.join("\n") });
                          if (tempQuestion[field] === opt) {
                            updateCurrentQuestionField(field, newVal.trim());
                          }
                        }
                      }}
                      className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(confirmDeleteLabel)) {
                          const newList = list.filter((x: string) => x !== opt);
                          setCurrentLesson({ ...currentLesson, [lessonField]: newList.join("\n") });
                          if (tempQuestion[field] === opt) {
                            updateCurrentQuestionField(field, "");
                          }
                        }
                      }}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newVal = prompt(promptEnterLabel);
                  if (newVal && newVal.trim()) {
                    const list = (currentLesson[lessonField] || "").split("\n").filter(Boolean);
                    if (!list.includes(newVal.trim())) {
                      const newList = [...list, newVal.trim()];
                      setCurrentLesson({ ...currentLesson, [lessonField]: newList.join("\n") });
                      updateCurrentQuestionField(field, newVal.trim());
                      setIsOpen(false);
                    }
                  }
                }}
                className="w-full text-center py-2 text-indigo-600 font-black text-xs hover:bg-indigo-50 border-t border-dashed border-slate-100 rounded-b-xl flex items-center justify-center gap-1 mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{addCustomLabel}</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

    const list = currentLesson[source] || [];
    const headerLabel = source === 'assignments' 
      ? (language === 'ar' ? 'واجبات وتكليفات الدرس (Assignments)' : 'Lesson Assignments')
      : (language === 'ar' ? 'تدريبات وتقييمات الدرس (Quiz Me)' : 'Quiz Me Practice');
    
    const headerDesc = source === 'assignments'
      ? (language === 'ar' ? 'قم بإضافة التكليفات التطبيقية والواجبات المنزلية للطلاب' : 'Add application homework and assignments for students')
      : (language === 'ar' ? 'قم بإضافة أسئلة تدريبية تفاعلية لتقييم فهم واستيعاب الطالب' : 'Add interactive practice questions to test student understanding');

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <input 
          type="file" 
          ref={source === 'assignments' ? assignmentsExcelRef : questionsExcelRef} 
          style={{ display: 'none' }} 
          accept=".xlsx,.xls" 
          onChange={source === 'assignments' ? handleAssignmentsExcelChange : handleQuestionsExcelChange} 
        />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <HelpCircle className="w-6 h-6 text-indigo-600" />
              {headerLabel}
            </h4>
            <p className="text-slate-400 text-sm font-bold mt-1">{headerDesc}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <QuestionExcelExportButton questions={currentLesson[source] || []} language={language} />
            <button 
              type="button"
              onClick={() => handleExcelUpload(source === 'assignments' ? 'assignments' : 'questions')}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-5 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm text-xs"
            >
              <Upload className="w-4 h-4" />
              {language === 'ar' ? 'استيراد Excel' : 'Import Excel'}
            </button>
            <button 
              type="button"
              onClick={() => downloadQuestionsTemplate(source === 'assignments' ? 'assignments' : 'questions')}
              className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-5 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm text-xs"
            >
              <Download className="w-4 h-4" />
              {language === 'ar' ? 'تحميل نموذج' : 'Template'}
            </button>
            <button 
              type="button"
              onClick={() => handleAddQuestionForSource(source)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              {language === 'ar' ? '+ إضافة سؤال' : '+ Add Question'}
            </button>
            {isSuperAdmin && (
              <button 
                type="button"
                onClick={() => setIsCopyModalOpen(true)}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-5 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm text-xs"
              >
                <Copy className="w-4 h-4" />
                {language === 'ar' ? 'تصدير الأسئلة' : 'Export Questions'}
              </button>
            )}
          </div>
        </div>

        {/* Saved Questions Cards List */}
        {!showQuestionForm && (
          <div className="space-y-4">
            {list.length === 0 ? (
              <div className="bg-white rounded-[35px] border-4 border-dashed border-slate-100 p-16 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                  <HelpCircle className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-800 mb-1">{language === 'ar' ? 'لا يوجد أسئلة مضافة' : 'No questions added yet'}</h4>
                  <p className="text-slate-400 font-bold text-xs max-w-sm">{language === 'ar' ? 'ابدأ بإضافة سؤال جديد أو استيراده من ملف إكسيل' : 'Start by adding a new question or importing from Excel'}</p>
                </div>
                <button 
                  type="button"
                  onClick={() => handleAddQuestionForSource(source)}
                  className="bg-indigo-50 text-indigo-600 px-8 py-3.5 rounded-2xl font-black transition-all hover:bg-indigo-100 cursor-pointer text-xs"
                >
                  {language === 'ar' ? '+ إضافة أول سؤال' : '+ Add First Question'}
                </button>
              </div>
            ) : (
              list.map((q: any, index: number) => (
                <div key={q.id ?? index} className="bg-white rounded-2xl sm:rounded-[30px] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                  <div className="px-3 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 overflow-hidden">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <button type="button" onClick={() => moveQuestionForSource(source, index, 'UP')} disabled={index === 0} className="text-slate-300 hover:text-indigo-600 disabled:opacity-20 transition-colors"><ChevronUp className="w-4 h-4" /></button>
                        <span className="w-8 h-8 min-w-8 shrink-0 whitespace-nowrap tabular-nums bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-xs">{index + 1}</span>
                        <button type="button" onClick={() => moveQuestionForSource(source, index, 'DOWN')} disabled={index === list.length - 1} className="text-slate-300 hover:text-indigo-600 disabled:opacity-20 transition-colors"><ChevronDown className="w-4 h-4" /></button>
                      </div>
                      {(() => {
                        const img = extractFirstImage(q);
                        if (!img) return null;
                        return (
                          <div className="w-14 h-14 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shrink-0 flex items-center justify-center">
                            <img src={img} alt="Question image" className="w-full h-full object-cover" />
                          </div>
                        );
                      })()}
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                            {QUESTION_TYPES.find(t => t.id === q.type)?.label || q.type}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase">
                            {q.level || "Medium"} {q.dok ? `• ${q.dok}` : ''} • {q.points || 1} {language === 'ar' ? 'درجة' : 'pts'}
                          </span>
                          {q.standard && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{q.standard}</span>}
                        </div>
                        <div 
                          className="text-slate-700 font-bold truncate text-sm"
                          dangerouslySetInnerHTML={{ __html: (q.text || "").replace(/<[^>]*>?/gm, '').substring(0, 120) + '...' }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 shrink-0">
                      <button 
                        type="button"
                        onClick={() => setExpandedQuestionIndex(expandedQuestionIndex === index ? null : index)}
                        className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-100 hover:text-indigo-600 transition-all"
                        title="Expand"
                      >
                        {expandedQuestionIndex === index ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleEditQuestionForSource(source, index)}
                        className="w-10 h-10 bg-blue-50 text-blue-400 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => removeQuestionForSource(source, index)}
                        className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>


                  {/* Question details collapsible view */}
                  {expandedQuestionIndex === index && (() => {
                    const qPreviewLang = cardPreviewLang[index] || questionActiveLang || 'ar';
                    const isCardEn = qPreviewLang === 'en';
                    const activeQText = (isCardEn && q.textEn) ? q.textEn : (q.text || q.textEn || '');
                    const rawArOpts = Array.isArray(q.options) ? q.options : [];
                    const rawEnOpts = Array.isArray(q.optionsEn) ? q.optionsEn : [];
                    const activeQOpts = (isCardEn && rawEnOpts.length > 0) ? rawEnOpts : rawArOpts;
                    const hasEnContent = Boolean(q.textEn) || rawEnOpts.length > 0 || Boolean(q.explanationEn);
                    const cardSectionPresets: Record<string, any> = getSectionStylePresets(qPreviewLang);

                    return (
                    <div className="px-8 pb-8 pt-4 border-t border-slate-50 bg-slate-50/30 animate-in slide-in-from-top-2 duration-300">
                      {hasEnContent && (
                        <div className="flex justify-end mb-4">
                          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-black shadow-xs">
                            <span className="text-[10px] text-slate-400 px-2">{language === 'ar' ? 'لغة المعاينة:' : 'Preview Language:'}</span>
                            <button
                              type="button"
                              onClick={() => setCardPreviewLang(prev => ({ ...prev, [index]: 'ar' }))}
                              className={`px-3 py-1 rounded-lg transition-all ${
                                !isCardEn ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              العربية
                            </button>
                            <button
                              type="button"
                              onClick={() => setCardPreviewLang(prev => ({ ...prev, [index]: 'en' }))}
                              className={`px-3 py-1 rounded-lg transition-all ${
                                isCardEn ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              English
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          {(() => {
                            const img = extractFirstImage(q);
                            if (!img) return null;
                            return (
                              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isCardEn ? 'Question Image:' : 'الصورة المرفقة بالسؤال:'}</span>
                                <div className="rounded-xl overflow-hidden border border-slate-100 max-h-60 flex items-center justify-center bg-slate-50">
                                  <img src={img} alt="Question preview" className="max-h-60 w-auto object-contain" />
                                </div>
                              </div>
                            );
                          })()}
                          <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">{isCardEn ? 'Question Content:' : 'نص السؤال / المحتوى:'}</h5>
                          <HtmlRenderer html={activeQText} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-sm font-bold" />
                          
                          {(isCardEn ? (q.learningOutcomeEn || q.learningOutcome) : q.learningOutcome) && (
                            <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-150 w-fit text-xs font-bold">
                              <Target className="w-4 h-4" />
                              <span>{isCardEn ? (q.learningOutcomeEn || q.learningOutcome) : q.learningOutcome}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          {q.type !== 'TEXT' && (
                            <>
                              <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">{isCardEn ? 'Question Preview:' : 'معاينة السؤال:'}</h5>
                              {['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(q.type) ? (
                                <div className="space-y-2">
                                  {Array.isArray(activeQOpts) && activeQOpts.filter(Boolean).map((opt: string, oIdx: number) => {
                                    const arOpt = rawArOpts[oIdx];
                                    const isCorrect = q.type === 'MULTI_SELECT'
                                      ? ((q.correctAnswers || []).includes(opt) || (arOpt && (q.correctAnswers || []).includes(arOpt)))
                                      : (q.correctAnswer === opt || (arOpt && q.correctAnswer === arOpt));
                                    return (
                                      <div key={oIdx} className={`p-3 rounded-xl border flex items-center gap-3 text-xs font-bold transition-all ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-slate-100 text-slate-600'}`}>
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-100'}`}>
                                          {isCorrect ? '✓' : ''}
                                        </div>
                                        <span className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-[10px] text-indigo-600 shrink-0">
                                          {getOptionLetter(oIdx, qPreviewLang)}
                                        </span>
                                        <HtmlRenderer html={cleanOptionText(opt)} tag="span" className="flex-1 break-words whitespace-normal min-w-0 !leading-relaxed" />
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : q.type === 'FLASH_CARD' ? (
                                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs space-y-2 font-bold text-right" dir={isCardEn ? 'ltr' : 'rtl'}>
                                  <p className="text-slate-800"><span className="text-indigo-600">{isCardEn ? 'Front (Question):' : 'الوجه الأمامي (السؤال):'}</span> {parseJson(isCardEn ? (q.optionsEn || q.options) : q.options, {front: ""}).front || activeQText}</p>
                                  <p className="text-slate-800"><span className="text-indigo-600">{isCardEn ? 'Back (Answer):' : 'الوجه الخلفي (الإجابة):'}</span> {parseJson(isCardEn ? (q.optionsEn || q.options) : q.options, {back: ""}).back || (isCardEn ? (q.correctAnswerEn || q.correctAnswer) : q.correctAnswer)}</p>
                                </div>
                              ) : (
                                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs space-y-1.5 font-bold text-right" dir={isCardEn ? 'ltr' : 'rtl'}>
                                  <p className="text-slate-400">{isCardEn ? `Activity Type: ${q.type}` : `نوع النشاط: ${q.type}`}</p>
                                  <p className="text-slate-800"><span className="text-emerald-600">✓ {isCardEn ? 'Correct Answer:' : 'الإجابة النموذجية:'}</span> {isCardEn ? (q.correctAnswerEn || q.correctAnswer) : (typeof q.correctAnswer === 'object' ? JSON.stringify(q.correctAnswer) : String(q.correctAnswer || ""))}</p>
                                </div>
                              )}
                            </>
                          )}

                          {q.sections && q.sections.length > 0 && (
                            <div className="space-y-3 pt-2">
                              <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">{isCardEn ? 'Explanations & Notes:' : 'تفسيرات وملاحظات إضافية:'}</h5>
                              <div className="space-y-2">
                                {(Array.isArray(q.sections) ? q.sections : []).map((sec: any, secIdx: number) => {
                                  const preset = cardSectionPresets[sec.type] || cardSectionPresets.EXPLANATION;
                                  const SectionIcon = preset.icon;
                                  const secContent = isCardEn ? (sec.contentEn || sec.textEn || sec.content) : (sec.content || sec.textEn);
                                  return (
                                    <div key={secIdx} className={`p-4 rounded-xl border ${preset.container} text-xs`}>
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1 mb-1.5 ${preset.badge}`}>
                                        <SectionIcon className="w-3 h-3" />
                                        {preset.label}
                                      </span>
                                      <HtmlRenderer html={secContent} className="text-slate-700 font-bold font-sans" />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })()}
                </div>
              ))
            )}
          </div>
        )}

        {/* Premium Save Slide Form inside card list view */}
        {showQuestionForm && (
          <div className="bg-white rounded-[40px] border-2 border-indigo-500 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-indigo-600 px-8 py-5 flex justify-between items-center">
              <h4 className="text-white font-black flex items-center gap-3">
                <Plus className="w-5 h-5" />
                {editingQuestionIndex !== null 
                  ? (language === 'ar' ? `تعديل السؤال #${editingQuestionIndex + 1}` : `Edit Question #${editingQuestionIndex + 1}`) 
                  : (language === 'ar' ? 'إضافة سؤال تفاعلي جديد' : 'Add New Question')}
              </h4>
              <button 
                type="button"
                onClick={() => setShowQuestionForm(false)}
                className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 md:p-12 space-y-8">
              {/* Unified Metadata Toggle */}
              <div 
                className="flex items-center justify-between bg-slate-50 border border-slate-200 px-6 py-4 rounded-[20px] cursor-pointer hover:bg-slate-100 transition-all" 
                onClick={() => setShowQuestionMetadata(!showQuestionMetadata)}
              >
                <h5 className="text-sm font-black text-slate-700 flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-500" />
                  {language === 'ar' ? 'إعدادات متقدمة (المعيار، المؤشر، مستوى الصعوبة...)' : 'Advanced Settings (Standard, Indicator, Difficulty...)'}
                </h5>
                {showQuestionMetadata ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </div>

              {/* Unified Metadata & Configuration Grid */}
              {showQuestionMetadata && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50 border border-slate-200 rounded-[30px] shadow-sm mb-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'نوع السؤال' : 'Question Type'}</label>
                    <select 
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-black text-xs outline-none min-h-[34px]"
                      value={tempQuestion.type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        const updated = { ...tempQuestion, type: newType };
                        if (newType === "TRUE_FALSE") {
                          updated.options = ["True", "False", "", ""];
                          updated.correctAnswer = "True";
                        } else if (tempQuestion.type === "TRUE_FALSE") {
                          updated.options = ["", "", "", ""];
                          updated.correctAnswer = "";
                        }
                        setTempQuestion(updated);
                      }}
                    >
                      {QUESTION_TYPES.map(type => (
                        <option key={type.id} value={type.id}>{type.label}</option>
                      ))}
                    </select>
                  </div>

              {/* ── Question Metadata ── */}
              <div className="flex justify-between items-center mb-4 mt-6">
                <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest">
                  {language === 'ar' ? 'بيانات الميتا داتا' : 'Metadata Fields'}
                </h4>
                <button 
                  onClick={() => {
                    const metadataMap = [
                      { key: 'course', labelAr: 'الدرس', labelEn: 'Lesson' },
                      { key: 'section', labelAr: 'القسم', labelEn: 'Section' },
                      { key: 'domain', labelAr: 'المجال', labelEn: 'Domain' },
                      { key: 'standard', labelAr: 'المعيار', labelEn: 'Standard' },
                      { key: 'indicator', labelAr: 'المؤشرات', labelEn: 'Indicators' },
                      { key: 'skill', labelAr: 'المهارة', labelEn: 'Skill' },
                      { key: 'subskill', labelAr: 'المهارة الفرعية', labelEn: 'Subskill' },
                      { key: 'microSkill', labelAr: 'المهارة الدقيقة', labelEn: 'Micro Skill' },
                      { key: 'level', labelAr: 'الصعوبة', labelEn: 'Difficulty' },
                      { key: 'dok', labelAr: 'عمق المعرفة (DOK)', labelEn: 'DOK' },
                      { key: 'cognitive', labelAr: 'المستوى المعرفي', labelEn: 'Cognitive' },
                      { key: 'errorPattern', labelAr: 'نمط الخطأ', labelEn: 'Error Pattern' },
                      { key: 'estimatedTime', labelAr: 'الوقت المقدر', labelEn: 'Estimated Time' },
                    ];
                    const data: any = {};
                    metadataMap.forEach(field => {
                      data[language === 'ar' ? field.labelAr : field.labelEn] = tempQuestion[field.key] || "";
                    });
                    const worksheet = XLSX.utils.json_to_sheet([data]);
                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, "Metadata Template");
                    XLSX.writeFile(workbook, "Metadata_Template.xlsx");
                  }}
                  className="flex items-center gap-2 bg-green-50 text-green-600 hover:bg-green-100 px-4 py-2 rounded-xl text-xs font-bold transition-colors border border-green-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  {language === 'ar' ? 'تحميل قالب الميتا داتا' : 'Download Metadata Template'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 bg-slate-50 border border-slate-100 rounded-[24px]">
                {[
                  { key: 'course', labelAr: 'الدرس', labelEn: 'Lesson' },
                  { key: 'section', labelAr: 'القسم', labelEn: 'Section' },
                  { key: 'domain', labelAr: 'المجال', labelEn: 'Domain' },
                  { key: 'standard', labelAr: 'نواتج التعلم', labelEn: 'Learning Outcomes' },
                  { key: 'indicator', labelAr: 'المؤشرات', labelEn: 'Indicators' },
                  { key: 'skill', labelAr: 'المهارة', labelEn: 'Skill', defaultValue: 'General' },
                  { key: 'subskill', labelAr: 'المهارة الفرعية', labelEn: 'Subskill' },
                  { key: 'microSkill', labelAr: 'المهارة الدقيقة', labelEn: 'Micro Skill' },
                  { key: 'level', labelAr: 'الصعوبة', labelEn: 'Difficulty', defaultValue: 'Medium' },
                  { key: 'dok', labelAr: 'عمق المعرفة (DOK)', labelEn: 'DOK' },
                  { key: 'cognitive', labelAr: 'المستوى المعرفي', labelEn: 'Cognitive' },
                  { key: 'errorPattern', labelAr: 'نمط الخطأ', labelEn: 'Error Pattern' },
                  { key: 'estimatedTime', labelAr: 'الوقت المقدر', labelEn: 'Estimated Time' },
                ].map((field) => {
                  const activeFieldKey = questionActiveLang === 'en' && ['domain', 'standard', 'learningOutcome', 'indicator', 'skill', 'subskill', 'microSkill', 'errorPattern'].includes(field.key)
                    ? `${field.key}En`
                    : field.key;

                  const currentVal = field.key === 'standard'
                    ? (questionActiveLang === 'en' ? (tempQuestion.standardEn || tempQuestion.learningOutcomeEn || '') : (tempQuestion.standard || tempQuestion.learningOutcome || ''))
                    : field.key === 'dok'
                    ? (normalizeDok(tempQuestion.dok) || tempQuestion.dok || '')
                    : (tempQuestion[activeFieldKey] || (questionActiveLang === 'ar' ? field.defaultValue : '') || '');

                  return (
                    <div key={field.key} className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{language === 'ar' ? field.labelAr : field.labelEn}</label>
                      {field.key === 'dok' ? (
                        <select
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-indigo-600 font-bold appearance-none"
                          value={normalizeDok(tempQuestion.dok) || tempQuestion.dok || ""}
                          onChange={(e) => updateCurrentQuestionField('dok', normalizeDok(e.target.value) || e.target.value)}
                        >
                          <option value="">{language === 'ar' ? 'اختر...' : 'Select...'}</option>
                          <option value="DOK 1">DOK 1</option>
                          <option value="DOK 2">DOK 2</option>
                          <option value="DOK 3">DOK 3</option>
                          <option value="DOK 4">DOK 4</option>
                          {(() => {
                            const val = normalizeDok(tempQuestion.dok) || tempQuestion.dok;
                            if (val && !['DOK 1', 'DOK 2', 'DOK 3', 'DOK 4'].includes(val)) {
                              return <option value={val}>{val}</option>;
                            }
                            return null;
                          })()}
                        </select>
                      ) : field.key === 'cognitive' ? (
                        <select
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-indigo-600 font-bold appearance-none"
                          value={tempQuestion.cognitive || ""}
                          onChange={(e) => updateCurrentQuestionField('cognitive', e.target.value)}
                        >
                          <option value="">{language === 'ar' ? 'اختر...' : 'Select...'}</option>
                          <option value="Knowledge">Knowledge</option>
                          <option value="Application">Application</option>
                          <option value="Reasoning">Reasoning</option>
                          {tempQuestion.cognitive && !['Knowledge', 'Application', 'Reasoning'].includes(tempQuestion.cognitive) && (
                            <option value={tempQuestion.cognitive}>{tempQuestion.cognitive}</option>
                          )}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-indigo-600 font-bold"
                          placeholder={language === 'ar' ? field.labelAr : field.labelEn}
                          value={currentVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrentQuestionField(activeFieldKey, val);
                            if (field.key === 'standard') {
                              updateCurrentQuestionField(questionActiveLang === 'en' ? 'learningOutcomeEn' : 'learningOutcome', val);
                            }
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'النقاط / الدرجة' : 'Points'}</label>
                    <input 
                      type="number"
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-xs outline-none min-h-[34px]"
                      value={tempQuestion.points !== undefined ? tempQuestion.points : 1}
                      onChange={(e) => updateCurrentQuestionField("points", parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'نقاط XP' : 'XP Points'}</label>
                    <input 
                      type="number"
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-xs outline-none min-h-[34px]"
                      value={tempQuestion.xpPoints !== undefined ? tempQuestion.xpPoints : 10}
                      onChange={(e) => updateCurrentQuestionField("xpPoints", parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'رابط فيديو اختياري للسؤال' : 'Optional Video Link'}</label>
                    <input 
                      type="url"
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 min-h-[34px]"
                      value={tempQuestion.videoUrl || ""}
                      onChange={(e) => updateCurrentQuestionField("videoUrl", e.target.value)}
                      placeholder="YouTube or Vimeo link..."
                    />
                  </div>
                </div>
              )}
              {/* Question Image Attachment / URL Uploader */}
              <div className="flex flex-col gap-3 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <span>{language === 'ar' ? 'صورة السؤال (تظهر في البطاقات والمعاينة وفي كل مكان)' : 'Question Image (Shows in Cards, Preview & Everywhere)'}</span>
                  </label>
                  {tempQuestion.imageUrl && (
                    <button
                      type="button"
                      onClick={() => updateCurrentQuestionField('imageUrl', '')}
                      className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {language === 'ar' ? 'حذف الصورة' : 'Remove Image'}
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <div className="flex-1 w-full">
                    <input
                      type="url"
                      placeholder={language === 'ar' ? 'أدخل رابط الصورة المباشر (URL)...' : 'Paste direct image URL...'}
                      value={tempQuestion.imageUrl || ''}
                      onChange={(e) => updateCurrentQuestionField('imageUrl', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <label className="shrink-0 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-600 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all">
                    <Upload className="w-4 h-4" />
                    <span>{language === 'ar' ? 'رفع صورة من الجهاز' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const result = event.target?.result as string;
                            if (result) {
                              updateCurrentQuestionField('imageUrl', result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {(() => {
                  const img = extractFirstImage(tempQuestion);
                  if (!img) return null;
                  return (
                    <div className="mt-2 p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 shrink-0 flex items-center justify-center">
                        <img src={img} alt="Question Preview" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          {language === 'ar' ? 'تم التعرف على صورة السؤال وتفعيلها' : 'Question image is active'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold truncate max-w-xs sm:max-w-md">
                          {img.startsWith('data:') ? (language === 'ar' ? 'صورة مرفوعة محلياً' : 'Locally uploaded image') : img}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Language Switcher Bar */}
              <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex-wrap gap-2">
                <span className="text-xs font-black text-slate-600 px-3">
                  {language === 'ar' ? 'لغة تحرير السؤال الحالي:' : 'Current Editing Language:'}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQuestionActiveLang('en')}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${questionActiveLang === 'en' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-white'}`}
                    >
                      English (EN)
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionActiveLang('ar')}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${questionActiveLang === 'ar' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-white'}`}
                    >
                      العربية (Arabic)
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isTranslatingQuestion}
                    onClick={handleAutoTranslateQuestion}
                    className="px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {isTranslatingQuestion ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Languages className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isTranslatingQuestion
                        ? (language === 'ar' ? 'جارٍ الترجمة...' : 'Translating...')
                        : (questionActiveLang === 'ar'
                            ? (language === 'ar' ? 'ترجمة فورية للإنجليزية' : 'Translate to English')
                            : (language === 'ar' ? 'ترجمة فورية للعربية' : 'Translate to Arabic'))}
                    </span>
                  </button>
                </div>
              </div>

              {/* Rich Text Editor for Question Text */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                    <span>
                      {questionActiveLang === 'ar'
                        ? (language === 'ar' ? 'نص السؤال الرئيسي (بالعربية)' : 'Question Prompt (Arabic)')
                        : (language === 'ar' ? 'نص السؤال بالإنجليزية (English Prompt)' : 'Question Prompt (English)')}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                      {questionActiveLang === 'ar' ? 'العربية' : 'English'}
                    </span>
                  </label>
                  {questionActiveLang === 'ar' && tempQuestion.textEn && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      English version added
                    </span>
                  )}
                  {questionActiveLang === 'en' && tempQuestion.text && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      تمت إضافة النسخة العربية
                    </span>
                  )}
                </div>
                <RichTextEditor
                  value={(questionActiveLang === 'ar' 
                    ? (tempQuestion.text && /[\u0600-\u06FF]/.test(tempQuestion.text) ? tempQuestion.text : '')
                    : (tempQuestion.textEn || (tempQuestion.text && /[a-zA-Z]/.test(tempQuestion.text) && !/[\u0600-\u06FF]/.test(tempQuestion.text) ? tempQuestion.text : ''))
                  ) || ""}
                  onChange={(value) => {
                    if (questionActiveLang === 'ar') {
                      updateCurrentQuestionField("text", value);
                    } else {
                      const syncBase = !tempQuestion.text || (!/[\u0600-\u06FF]/.test(tempQuestion.text) && tempQuestion.text === (tempQuestion.textEn || ''));
                      setTempQuestion((prev: any) => ({
                        ...prev,
                        textEn: value,
                        ...(syncBase ? { text: value } : {})
                      }));
                    }
                  }}
                  placeholder={questionActiveLang === 'ar' ? "اكتب نص السؤال بالعربية هنا..." : "Write the question prompt in English here..."}
                />
              </div>

              {/* Explanations & dynamic blocks inside form */}
              <div 
                className="flex items-center justify-between bg-slate-50 border border-slate-200 px-6 py-4 rounded-[20px] cursor-pointer hover:bg-slate-100 transition-all border-t mt-6" 
                onClick={() => setShowQuestionSections(!showQuestionSections)}
              >
                <h5 className="text-sm font-black text-slate-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  {language === 'ar' ? 'أقسام إضافية ديناميكية وتفسيرات' : 'Dynamic Sections & Explanations'}
                </h5>
                {showQuestionSections ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </div>

              {showQuestionSections && (
                <div className="flex flex-col gap-5 border-t border-slate-100 pt-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">{language === 'ar' ? 'تفسيرات الإجابة والكتل المساعدة' : 'Answer Explanations & Content Blocks'}</label>
                      <p className="text-xs text-slate-400 font-bold">{language === 'ar' ? 'تظهر للطالب بعد تسليم الإجابة أو عند طلب المساعدة وتدعم الشرح الإنجليزي والعربي' : 'Shown to students after submission or as hints'}</p>
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenDropdownId(openDropdownId === 'new-q-sec' ? null : 'new-q-sec')}
                        className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{language === 'ar' ? 'إضافة قسم / تفسير' : 'Add Section / Explanation'}</span>
                      </button>
                      {openDropdownId === 'new-q-sec' && (
                        <div className="absolute left-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                          {['FEEDBACK', 'HINT', 'EXPLANATION', 'TIP', 'WARNING', 'KEY_INSIGHT'].map(secType => {
                            const preset = SECTION_STYLE_PRESETS[secType] || SECTION_STYLE_PRESETS.EXPLANATION;
                            const IconComp = preset.icon;
                            return (
                              <button
                                key={secType}
                                type="button"
                                onClick={() => {
                                  addQuestionSection(secType);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-right px-3 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                              >
                                <IconComp className="w-4 h-4 text-slate-400" />
                                <span>{language === 'ar' ? preset.label : (preset.labelEn || preset.label)}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {(tempQuestion.sections || []).map((sec: any, idx: number) => {
                      const preset = SECTION_STYLE_PRESETS[sec.type] || SECTION_STYLE_PRESETS.EXPLANATION;
                      const IconComponent = preset.icon;
                      const secVal = questionActiveLang === 'ar'
                        ? (sec.content || "")
                        : (sec.contentEn || (sec.content && /[a-zA-Z]/.test(sec.content) && !/[\u0600-\u06FF]/.test(sec.content) ? sec.content : "") || "");

                      return (
                        <div key={idx} className={`p-6 rounded-3xl border-2 flex flex-col gap-4 relative group ${preset.container}`}>
                          <div className="flex justify-between items-center">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${preset.badge}`}>
                              <IconComponent className="w-3.5 h-3.5" />
                              {language === 'ar' ? preset.label : (preset.labelEn || preset.label)}
                            </span>
                            <button 
                              type="button"
                              onClick={() => removeQuestionSection(idx)} 
                              className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <RichTextEditor 
                            value={secVal}
                            onChange={(value) => {
                              const sections = [...(tempQuestion.sections || [])];
                              if (questionActiveLang === 'ar') {
                                sections[idx] = { ...sections[idx], content: value };
                                setTempQuestion((prev: any) => ({ ...prev, sections, explanation: value }));
                              } else {
                                const syncBase = !sections[idx].content || (!/[\u0600-\u06FF]/.test(sections[idx].content) && sections[idx].content === (sections[idx].contentEn || ''));
                                sections[idx] = { 
                                  ...sections[idx], 
                                  contentEn: value,
                                  ...(syncBase ? { content: value } : {})
                                };
                                setTempQuestion((prev: any) => ({ 
                                  ...prev, 
                                  sections, 
                                  explanationEn: value,
                                  ...(syncBase ? { explanation: value } : {})
                                }));
                              }
                            }}
                            placeholder={questionActiveLang === 'ar' ? "اكتب محتوى التفسير هنا..." : "Write explanation block content here..."}
                            className="!bg-white !border-slate-200"
                          />
                        </div>
                      );
                    })}
                    {(tempQuestion.sections || []).length === 0 && (
                      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs font-bold">
                        {language === 'ar' ? 'لا يوجد أي شرائح تفسيرية مضافة بعد. انقر على زر إضافة شريحة مساعدة لإضافة تفسير.' : 'No explanations or content blocks added yet. Click Add Block to add an explanation.'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Options & Choices block */}
              {tempQuestion.type !== "TEXT" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                  {tempQuestion.type === "TRUE_FALSE" ? (
                    <div className="grid grid-cols-2 gap-6 mt-4 col-span-2">
                      <div className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${isQuestionCorrectAnswer(language === 'ar' ? "صحيح" : "True") ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                        <div 
                          className={`w-8 h-8 rounded-full border-4 cursor-pointer flex items-center justify-center transition-all ${isQuestionCorrectAnswer(language === 'ar' ? "صحيح" : "True") ? 'bg-emerald-500 border-emerald-200 scale-110' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                          onClick={() => updateCurrentQuestionField('correctAnswer', language === 'ar' ? "صحيح" : "True")}
                        >
                          {isQuestionCorrectAnswer(language === 'ar' ? "صحيح" : "True") && <CheckCircle2 className="w-5 h-5 text-white" />}
                        </div>
                        <span className="font-black text-xl text-slate-700">{questionActiveLang === 'ar' ? "صحيح" : "True"}</span>
                      </div>

                      <div className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${isQuestionCorrectAnswer(language === 'ar' ? "خطأ" : "False") ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                        <div 
                          className={`w-8 h-8 rounded-full border-4 cursor-pointer flex items-center justify-center transition-all ${isQuestionCorrectAnswer(language === 'ar' ? "خطأ" : "False") ? 'bg-emerald-500 border-emerald-200 scale-110' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                          onClick={() => updateCurrentQuestionField('correctAnswer', language === 'ar' ? "خطأ" : "False")}
                        >
                          {isQuestionCorrectAnswer(language === 'ar' ? "خطأ" : "False") && <CheckCircle2 className="w-5 h-5 text-white" />}
                        </div>
                        <span className="font-black text-xl text-slate-700">{questionActiveLang === 'ar' ? "خطأ" : "False"}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {(() => {
                        const baseLength = Math.max((tempQuestion.options || []).length, (tempQuestion.optionsEn || []).length, 4);
                        const isArOptsEnglish = (tempQuestion.options || []).some((o: string) => /[a-zA-Z]/.test(o)) && !(tempQuestion.options || []).some((o: string) => /[\u0600-\u06FF]/.test(o));
                        const currentOptsAr = Array.from({ length: baseLength }, (_, i) => {
                          const val = String(tempQuestion.options?.[i] || '');
                          return /[\u0600-\u06FF]/.test(val) ? val : '';
                        });
                        const currentOptsEn = Array.from({ length: baseLength }, (_, i) => {
                          const enVal = String(tempQuestion.optionsEn?.[i] || '');
                          if (enVal) return enVal;
                          const arVal = String(tempQuestion.options?.[i] || '');
                          if (isArOptsEnglish) return arVal;
                          return '';
                        });
                        const activeOpts = questionActiveLang === 'ar' ? currentOptsAr : currentOptsEn;

                        return activeOpts.map((opt: string, oIndex: number) => {
                          const arOpt = currentOptsAr[oIndex];
                          const enOpt = currentOptsEn[oIndex];

                          const isOptionCorrect = Boolean(
                            (tempQuestion.correctAnswerIndex !== undefined && tempQuestion.correctAnswerIndex === oIndex) ||
                            (tempQuestion.correctAnswerIndices && tempQuestion.correctAnswerIndices.includes(oIndex)) ||
                            (tempQuestion.type === 'MULTI_SELECT' && (
                              (opt && isQuestionCorrectAnswer(opt)) ||
                              (arOpt && (tempQuestion.correctAnswers || []).includes(arOpt)) ||
                              (enOpt && (tempQuestion.correctAnswers || []).includes(enOpt)) ||
                              (enOpt && (tempQuestion.correctAnswersEn || []).includes(enOpt))
                            )) ||
                            (tempQuestion.type !== 'MULTI_SELECT' && Boolean(
                              (opt && isQuestionCorrectAnswer(opt)) ||
                              (arOpt && isQuestionCorrectAnswer(arOpt)) ||
                              (enOpt && isQuestionCorrectAnswer(enOpt)) ||
                              (tempQuestion.correctAnswer && (
                                (arOpt && tempQuestion.correctAnswer.trim() === arOpt.trim()) ||
                                (enOpt && tempQuestion.correctAnswer.trim() === enOpt.trim())
                              )) ||
                              (tempQuestion.correctAnswerEn && (
                                (arOpt && tempQuestion.correctAnswerEn.trim() === arOpt.trim()) ||
                                (enOpt && tempQuestion.correctAnswerEn.trim() === enOpt.trim())
                              ))
                            ))
                          );

                          return (
                            <div key={oIndex} className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${isOptionCorrect ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                              <div 
                                onClick={() => toggleQuestionCorrectAnswer(oIndex)}
                                className={`w-8 h-8 rounded-full border-4 cursor-pointer flex items-center justify-center transition-all ${isOptionCorrect ? 'bg-emerald-500 border-emerald-200 scale-110' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                              >
                                {isOptionCorrect && <CheckCircle2 className="w-5 h-5 text-white" />}
                              </div>
                              <span 
                                onClick={() => toggleQuestionCorrectAnswer(oIndex)}
                                className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-xs text-indigo-600 shrink-0 select-none cursor-pointer hover:bg-indigo-100 transition-colors"
                              >
                                {getOptionLetter(oIndex, questionActiveLang)}
                              </span>
                              <MathInput 
                                value={opt}
                                onChange={(val) => {
                                  if (questionActiveLang === 'ar') {
                                    updateQuestionOption(oIndex, val);
                                  } else {
                                    const updatedEn = [...currentOptsEn];
                                    updatedEn[oIndex] = val;
                                    const updatedAr = [...currentOptsAr];
                                    const syncBase = !updatedAr[oIndex] || (!/[\u0600-\u06FF]/.test(updatedAr[oIndex]) && updatedAr[oIndex] === (currentOptsEn[oIndex] || ''));
                                    if (syncBase) {
                                      updatedAr[oIndex] = val;
                                    }
                                    setTempQuestion((prev: any) => ({
                                      ...prev,
                                      optionsEn: updatedEn,
                                      ...(syncBase ? { options: updatedAr } : {})
                                    }));
                                    if (tempQuestion.correctAnswerIndex === oIndex || (!tempQuestion.correctAnswer && !currentOptsAr[oIndex])) {
                                      updateCurrentQuestionField("correctAnswer", val);
                                      updateCurrentQuestionField("correctAnswerEn", val);
                                    } else if (tempQuestion.correctAnswerIndex === oIndex) {
                                      updateCurrentQuestionField("correctAnswerEn", val);
                                    }
                                  }
                                }}
                                placeholder={questionActiveLang === 'ar' ? `الخيار ${oIndex + 1} (بدون أ، ب، ج)` : `Option ${oIndex + 1} in English (no A, B, C)`}
                                className="bg-transparent flex-1 font-bold text-slate-700 placeholder:text-slate-300 text-sm"
                              />
                              {baseLength > 2 && (
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    const newOptions = [...currentOptsAr];
                                    newOptions.splice(oIndex, 1);
                                    const newOptsEn = [...currentOptsEn];
                                    newOptsEn.splice(oIndex, 1);
                                    setTempQuestion({ ...tempQuestion, options: newOptions, optionsEn: newOptsEn });
                                  }} 
                                  className="text-red-400 hover:text-red-600 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          );
                        });
                      })()}
                      <div 
                        onClick={() => {
                          const currentOptsAr = [...(tempQuestion.options || ["", "", "", ""]), ""];
                          const currentOptsEn = [...(tempQuestion.optionsEn || Array((tempQuestion.options || []).length).fill("")), ""];
                          setTempQuestion({ ...tempQuestion, options: currentOptsAr, optionsEn: currentOptsEn });
                        }} 
                        className="flex items-center justify-center gap-2 p-5 rounded-[22px] border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer text-indigo-600 font-bold text-sm"
                      >
                        <Plus className="w-5 h-5" />
                        {language === 'ar' ? 'إضافة خيار' : 'Add Option'}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowQuestionForm(false)}
                  className="px-8 py-4 rounded-2xl font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {questionActiveLang === 'en' ? 'Cancel' : (language === 'ar' ? 'إلغاء' : 'Cancel')}
                </button>
                <button 
                  type="button"
                  onClick={() => handleSaveQuestionForSource(source)}
                  className="px-10 py-4 rounded-2xl font-black bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{questionActiveLang === 'en' ? 'Save Question to List' : (language === 'ar' ? 'حفظ السؤال في القائمة' : 'Save Question to List')}</span>
                  <Save className="w-5 h-5 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        )}
        <CopySlidesModal 
          isOpen={isCopyModalOpen}
          onClose={() => setIsCopyModalOpen(false)}
          sourceLessonId={currentLesson.id}
          sourceSlides={list}
          onSuccess={() => {}}
          itemType={source}
        />
      </div>
    );
};
