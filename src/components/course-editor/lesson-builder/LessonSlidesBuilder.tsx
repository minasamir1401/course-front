"use client";

import React, { useState, useMemo } from "react";
import { Plus, Upload, Download, Layout, Copy } from "lucide-react";
import { useLessonBlocks } from "./useLessonBlocks";
import { getSectionStylePresets } from "./constants";
import { useCourseEditor } from "../CourseEditorContext";
import CopySlidesModal from "@/components/modals/CopySlidesModal";
import { translateBatch } from "@/lib/translationService";
import { useNotification } from "@/context/NotificationContext";
import { SlideCard } from "./SlideCard";

interface LessonSlidesBuilderProps {
  source: 'slides' | 'assignments' | 'questions';
  currentLesson: any;
  setCurrentLesson: (lesson: any) => void;
  language: string;
  assignmentsExcelRef: React.RefObject<HTMLInputElement | null>;
  questionsExcelRef: React.RefObject<HTMLInputElement | null>;
  handleAssignmentsExcelChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleQuestionsExcelChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExcelUpload: (type: 'questions' | 'metadata' | 'assignments') => void;
  downloadQuestionsTemplate: (type: 'questions' | 'assignments') => void;
}

export const LessonSlidesBuilder: React.FC<LessonSlidesBuilderProps> = ({
  source,
  currentLesson,
  setCurrentLesson,
  language,
  assignmentsExcelRef,
  questionsExcelRef,
  handleAssignmentsExcelChange,
  handleQuestionsExcelChange,
  handleExcelUpload,
  downloadQuestionsTemplate
}) => {
  const { showToast } = useNotification();
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [openMetadataFor, setOpenMetadataFor] = useState<number | null>(null);
  const [openSectionsFor, setOpenSectionsFor] = useState<number | null>(null);
  const [slideLanguages, setSlideLanguages] = useState<Record<string | number, 'ar' | 'en'>>({});
  const [translatingSlide, setTranslatingSlide] = useState<Record<string | number, boolean>>({});
  const [expandedSlides, setExpandedSlides] = useState<Record<string | number, boolean>>(() => ({
    0: true
  }));

  const { role } = useCourseEditor();
  const isSuperAdmin = role === "SUPER_ADMIN";

  const [customSkills, setCustomSkills] = useState<string[]>([]);

  const DEFAULT_SKILLS = useMemo(() => [
    "Problem Solving", "Reasoning", "Number Sense", "Algebraic Thinking", "Geometry", "Data Analysis",
    "Observation", "Investigation", "Scientific Reasoning", "Data Interpretation", "Experiment Design",
    "Main Idea", "Inference", "Vocabulary in Context", "Author's Purpose", "Supporting Details"
  ], []);

  const allExistingSkills = useMemo(() => Array.from(new Set([
    ...DEFAULT_SKILLS,
    ...customSkills,
    ...(currentLesson?.slides || []).map((s: any) => s.skill),
    ...(currentLesson?.assignments || []).map((a: any) => a.skill),
    ...(currentLesson?.questions || []).map((q: any) => q.skill)
  ].filter(Boolean))), [DEFAULT_SKILLS, customSkills, currentLesson?.slides, currentLesson?.assignments, currentLesson?.questions]);

  const SECTION_STYLE_PRESETS: any = useMemo(() => getSectionStylePresets(language), [language]);

  const {
    addBlock,
    insertBlockAt,
    moveBlock,
    updateBlock,
    updateBlockFields,
    updateBlockTypeAndReset,
    removeBlock,
    addSection,
    updateSection,
    removeSection
  } = useLessonBlocks(setCurrentLesson);

  const list = currentLesson?.[source] || [];

  const isSlideExpanded = (block: any, sIdx: number) => {
    const key = block?.id ?? sIdx;
    if (expandedSlides[key] !== undefined) return expandedSlides[key];
    if (expandedSlides[sIdx] !== undefined) return expandedSlides[sIdx];
    if (list.length <= 1) return true;
    return sIdx === 0;
  };

  const toggleSlideExpand = (block: any, sIdx: number) => {
    const key = block?.id ?? sIdx;
    setExpandedSlides(prev => {
      const current = prev[key] !== undefined ? prev[key] : (prev[sIdx] !== undefined ? prev[sIdx] : sIdx === 0);
      return { ...prev, [key]: !current, [sIdx]: !current };
    });
  };

  const handleExpandAll = () => {
    const next: Record<string | number, boolean> = {};
    list.forEach((b: any, idx: number) => {
      const k = b?.id ?? idx;
      next[k] = true;
      next[idx] = true;
    });
    setExpandedSlides(next);
  };

  const handleCollapseAll = () => {
    const next: Record<string | number, boolean> = {};
    list.forEach((b: any, idx: number) => {
      const k = b?.id ?? idx;
      next[k] = false;
      next[idx] = false;
    });
    setExpandedSlides(next);
  };

  const duplicateSlide = (index: number) => {
    setCurrentLesson((prev: any) => {
      const currentList = prev[source] || [];
      const itemToCopy = currentList[index];
      if (!itemToCopy) return prev;

      const newItem = JSON.parse(JSON.stringify(itemToCopy));
      newItem.id = Date.now() + Math.random();

      const newList = [...currentList];
      newList.splice(index + 1, 0, newItem);
      return { ...prev, [source]: newList };
    });
    setExpandedSlides(prev => ({ ...prev, [index + 1]: true }));
  };

  const handleAddBlock = (type: 'TEXT' | 'QUESTION') => {
    addBlock(source, type);
    setExpandedSlides(prev => ({ ...prev, [list.length]: true }));
  };

  const handleInsertBlockAt = (targetSource: any, index: number, type: 'TEXT' | 'QUESTION') => {
    insertBlockAt(targetSource || source, index, type);
    setExpandedSlides(prev => ({ ...prev, [index]: true }));
  };

  const cleanHtml = (str?: string) => String(str || '').replace(/<[^>]*>/g, '').trim();

  const isEnglishOnly = (str?: string) => {
    const clean = cleanHtml(str);
    return /[a-zA-Z]/.test(clean) && !/[\u0600-\u06FF]/.test(clean);
  };

  const hasArabicChars = (str?: string) => /[\u0600-\u06FF]/.test(cleanHtml(str));

  const detectSlideLanguage = (block: any): 'ar' | 'en' => {
    if (!block) return language === 'en' ? 'en' : 'ar';

    const body = cleanHtml(block.content || block.text || '');
    const bodyEn = cleanHtml(block.contentEn || block.textEn || '');
    const titleClean = cleanHtml(block.title);
    const titleEnClean = cleanHtml(block.titleEn);
    const optsJoined = Array.isArray(block.options) ? block.options.map(cleanHtml).join(' ') : '';
    const optsEnJoined = Array.isArray(block.optionsEn) ? block.optionsEn.map(cleanHtml).join(' ') : '';

    const allAr = `${body} ${titleClean} ${optsJoined}`;
    const allEn = `${bodyEn} ${titleEnClean} ${optsEnJoined}`;

    const hasAr = hasArabicChars(allAr);
    const hasEn = isEnglishOnly(allEn) || (isEnglishOnly(allAr) && !hasAr);

    if (hasEn && !hasAr) return 'en';
    if (hasAr && !hasEn) return 'ar';

    if (hasArabicChars(body)) return 'ar';
    if (isEnglishOnly(body)) return 'en';

    const isDefaultTitle = !titleClean || titleClean === 'محتوى جديد' || titleClean === 'سؤال جديد' || titleClean === 'New Content' || titleClean === 'New Question';
    if (!isDefaultTitle) {
      if (hasArabicChars(titleClean)) return 'ar';
      if (isEnglishOnly(titleClean)) return 'en';
    }

    return language === 'en' ? 'en' : 'ar';
  };

  const getSlideLang = (block: any, sIdx: number): 'ar' | 'en' => {
    const key = block?.id ?? sIdx;
    return slideLanguages[key] || slideLanguages[sIdx] || detectSlideLanguage(block);
  };

  const setSlideLang = (sKey: string | number, lang: 'ar' | 'en') => {
    setSlideLanguages(prev => ({ ...prev, [sKey]: lang }));
  };

  const handleAutoTranslateSlide = async (sIdx: number) => {
    const block = list[sIdx];
    if (!block) return;

    const blockKey = block?.id ?? sIdx;
    const currentLang = getSlideLang(block, sIdx);
    const from = currentLang;
    const to = currentLang === 'ar' ? 'en' : 'ar';

    setTranslatingSlide(prev => ({ ...prev, [blockKey]: true }));
    try {
      const srcTitle = from === 'ar'
        ? (block.title || '')
        : (block.titleEn || (isEnglishOnly(block.title) ? block.title : ''));
      const srcContent = from === 'ar'
        ? (block.content || block.text || '')
        : (block.contentEn || block.textEn || (isEnglishOnly(block.content || block.text) ? (block.content || block.text) : ''));

      let srcOpts: string[] = [];
      if (block.type === 'QUESTION' && Array.isArray(block.options)) {
        srcOpts = from === 'ar'
          ? block.options
          : ((block.optionsEn && block.optionsEn.length > 0) ? block.optionsEn : block.options);
      }

      const sectionsList = block.sections || [];
      const srcSections = sectionsList.map((sec: any) =>
        from === 'ar' ? (sec.content || '') : (sec.contentEn || sec.content || '')
      );

      const textsToTranslate = [
        srcTitle,
        srcContent,
        ...srcOpts,
        ...srcSections
      ];

      const translations = await translateBatch(textsToTranslate, from, to);

      let cursor = 0;
      const trTitle = translations[cursor++] || '';
      const trContent = translations[cursor++] || '';
      const trOpts = translations.slice(cursor, cursor + srcOpts.length);
      cursor += srcOpts.length;
      const trSections = translations.slice(cursor, cursor + srcSections.length);

      const updated = { ...block };
      if (to === 'en') {
        if (trTitle) updated.titleEn = trTitle;
        if (trContent) {
          updated.contentEn = trContent;
          updated.textEn = trContent;
        }
        if (trOpts.length > 0) {
          updated.optionsEn = trOpts;
        }
        if (sectionsList.length > 0) {
          updated.sections = sectionsList.map((sec: any, i: number) => ({
            ...sec,
            contentEn: trSections[i] || sec.contentEn || sec.content || ''
          }));
        }
        if (!updated.title && trTitle) updated.title = trTitle;
        if (!updated.content && trContent) {
          updated.content = trContent;
          updated.text = trContent;
        }
      } else {
        if (trTitle) updated.title = trTitle;
        if (trContent) {
          updated.content = trContent;
          updated.text = trContent;
        }
        if (trOpts.length > 0) {
          updated.options = trOpts;
        }
        if (sectionsList.length > 0) {
          updated.sections = sectionsList.map((sec: any, i: number) => ({
            ...sec,
            content: trSections[i] || sec.content || ''
          }));
        }
        if (!updated.titleEn && srcTitle) updated.titleEn = srcTitle;
        if (!updated.contentEn && srcContent) {
          updated.contentEn = srcContent;
          updated.textEn = srcContent;
        }
        if ((!updated.optionsEn || updated.optionsEn.length === 0) && srcOpts.length > 0) {
          updated.optionsEn = srcOpts;
        }
      }

      setCurrentLesson((prev: any) => {
        const newSlides = [...(prev[source] || [])];
        newSlides[sIdx] = updated;
        return { ...prev, [source]: newSlides };
      });

      setSlideLang(blockKey, to);
      showToast(to === 'en' ? "Translated to English successfully" : "تمت الترجمة إلى العربية بنجاح", "success");
    } catch (err: any) {
      console.error("Translation error:", err);
      showToast(language === 'ar' ? "فشلت الترجمة التلقائية" : "Auto translation failed", "error");
    } finally {
      setTranslatingSlide(prev => ({ ...prev, [blockKey]: false }));
    }
  };
  
  const headerLabel = source === 'slides' 
    ? (language === 'ar' ? 'شرائح الشرح والدرس' : 'Lesson Content & Slides') 
    : source === 'assignments' 
      ? (language === 'ar' ? 'تكليفات الدرس (Assignments)' : 'Lesson Assignments') 
      : (language === 'ar' ? 'تدريبات الدرس (Quiz Me)' : 'Lesson Exercises (Quiz Me)');
      
  const headerDesc = source === 'slides' 
    ? (language === 'ar' ? 'قم بإضافة محتوى نصي، أمثلة، ملاحظات، أو أسئلة تفاعلية مدمجة لشرح الدرس' : 'Add text content, examples, notes, or interactive questions to explain the lesson') 
    : source === 'assignments' 
      ? (language === 'ar' ? 'قم بإضافة التكليفات التطبيقية والواجبات المنزلية للطلاب' : 'Add application assignments and homework for students') 
      : (language === 'ar' ? 'قم بإضافة أسئلة تدريبية تفاعلية لتقييم فهم واستيعاب الطالب' : 'Add interactive practice questions to evaluate student understanding');

  return (
    <div className="space-y-8">
      {source !== 'slides' && (
        <input 
          type="file" 
          ref={source === 'assignments' ? assignmentsExcelRef : questionsExcelRef} 
          style={{ display: 'none' }} 
          accept=".xlsx,.xls" 
          onChange={source === 'assignments' ? handleAssignmentsExcelChange : handleQuestionsExcelChange} 
        />
      )}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
            <Layout className="w-6 h-6 text-indigo-600" />
            {headerLabel}
          </h4>
          <p className="text-slate-400 text-sm font-bold mt-1">{headerDesc}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {list.length > 1 && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 text-xs">
              <button
                type="button"
                onClick={handleExpandAll}
                className="px-3 py-1.5 rounded-lg font-bold text-slate-600 hover:text-indigo-600 hover:bg-white transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'توسيع الكل' : 'Expand All'}
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="px-3 py-1.5 rounded-lg font-bold text-slate-600 hover:text-indigo-600 hover:bg-white transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'طي الكل' : 'Collapse All'}
              </button>
            </div>
          )}
          {source !== 'slides' && (
            <>
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
            </>
          )}
          {source === 'slides' && isSuperAdmin && (
            <button 
              type="button"
              onClick={() => setIsCopyModalOpen(true)}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-5 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm text-xs"
            >
              <Copy className="w-4 h-4" />
              {language === 'ar' ? 'تصدير شرائح' : 'Export Slides'}
            </button>
          )}
          <button 
            type="button"
            onClick={() => handleAddBlock('TEXT')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all cursor-pointer text-xs"
          >
            <Plus className="w-4 h-4" />
            {language === 'ar' ? "+ محتوى نصي" : "+ Add Text"}
          </button>
          <button 
            type="button"
            onClick={() => handleAddBlock('QUESTION')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all shadow-lg cursor-pointer text-xs"
          >
            <Plus className="w-4 h-4" />
            {language === 'ar' ? "+ سؤال مدمج" : "+ Add Question"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {list.map((block: any, sIdx: number) => (
          <SlideCard
            key={block?.id ?? sIdx}
            block={block}
            sIdx={sIdx}
            source={source}
            listLength={list.length}
            language={language}
            slideLang={getSlideLang(block, sIdx)}
            setSlideLang={setSlideLang}
            isSuperAdmin={isSuperAdmin}
            isExpanded={isSlideExpanded(block, sIdx)}
            onToggleExpand={() => toggleSlideExpand(block, sIdx)}
            onDuplicate={duplicateSlide}
            openDropdownId={openDropdownId}
            setOpenDropdownId={setOpenDropdownId}
            openMetadataFor={openMetadataFor}
            setOpenMetadataFor={setOpenMetadataFor}
            openSectionsFor={openSectionsFor}
            setOpenSectionsFor={setOpenSectionsFor}
            translatingSlide={Boolean(translatingSlide[block?.id ?? sIdx])}
            onAutoTranslate={handleAutoTranslateSlide}
            showToast={showToast}
            allQuestions={list}
            allExistingSkills={allExistingSkills}
            SECTION_STYLE_PRESETS={SECTION_STYLE_PRESETS}
            currentLessonStandards={currentLesson?.standards || ''}
            currentLessonIndicators={currentLesson?.indicators || ''}
            currentLessonLearningOutcomes={currentLesson?.learningOutcomes || ''}
            insertBlockAt={handleInsertBlockAt}
            moveBlock={moveBlock}
            removeBlock={removeBlock}
            updateBlock={updateBlock}
            updateBlockFields={updateBlockFields}
            updateBlockTypeAndReset={updateBlockTypeAndReset}
            addSection={addSection}
            updateSection={updateSection}
            removeSection={removeSection}
            setCustomSkills={setCustomSkills}
            setCurrentLesson={setCurrentLesson}
          />
        ))}
      </div>

      {source === 'slides' && currentLesson?.id && (
        <CopySlidesModal
          isOpen={isCopyModalOpen}
          onClose={() => setIsCopyModalOpen(false)}
          sourceLessonId={currentLesson.id}
          sourceSlides={list}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};
