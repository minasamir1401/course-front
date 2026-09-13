"use client";

import React, { useState } from "react";
import { 
  Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2, 
  HelpCircle, Upload, Download, Edit2, Play, Video, BookOpen, Lightbulb, TriangleAlert, Layout, FileText, Copy, Target,
  Languages, Loader2, Globe, Sparkles
} from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import MathInput from "@/components/MathInput";
import InteractiveQuestionEditor from "@/components/InteractiveQuestionEditor";
import { getOptionLetter } from "@/lib/utils";
import { normalizeAnswerGlobal } from "@/components/LessonSubComponents";
import { useLessonBlocks } from "./useLessonBlocks";
import { getSectionStylePresets } from "./constants";
import { useCourseEditor } from "../CourseEditorContext";
import CopySlidesModal from "@/components/modals/CopySlidesModal";
import { translateBatch } from "@/lib/translationService";
import { useNotification } from "@/context/NotificationContext";

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
  const [activeSlide, setActiveSlide] = useState<number | null>(null);
  const [slideTab, setSlideTab] = useState<'CONTENT' | 'EXPLANATION' | 'SECTIONS'>('CONTENT');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [openMetadataFor, setOpenMetadataFor] = useState<number | null>(null);
  const [openSectionsFor, setOpenSectionsFor] = useState<number | null>(null);
  const [slideLanguages, setSlideLanguages] = useState<Record<number, 'ar' | 'en'>>({});
  const [translatingSlide, setTranslatingSlide] = useState<Record<number, boolean>>({});

  const { role } = useCourseEditor();
  const isSuperAdmin = role === "SUPER_ADMIN";

  const [customSkills, setCustomSkills] = useState<string[]>([]);

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

  const SECTION_STYLE_PRESETS: any = getSectionStylePresets(language);

  const {
    addBlock,
    insertBlockAt,
    moveBlock,
    updateBlock,
    updateBlockTypeAndReset,
    removeBlock,
    addSection,
    updateSection,
    removeSection
  } = useLessonBlocks(setCurrentLesson);

  const handleAddSlide = (type: 'TEXT' | 'QUESTION') => addBlock(source, type);
  const handleInsertSlideAt = (index: number, type: 'TEXT' | 'QUESTION') => insertBlockAt(source, index, type);
  const handleMoveSlide = (index: number, direction: 'UP' | 'DOWN') => moveBlock(source, index, direction);
  const handleUpdateSlide = (index: number, field: string, value: any) => updateBlock(source, index, field, value);
  const handleUpdateSlideType = (index: number, newType: string) => updateBlockTypeAndReset(source, index, newType);
  const duplicateSlide = (index: number) => {
    setCurrentLesson((prev: any) => {
      const list = prev[source] || [];
      const itemToCopy = list[index];
      if (!itemToCopy) return prev;

      const newItem = JSON.parse(JSON.stringify(itemToCopy));
      newItem.id = Date.now() + Math.random();

      const newList = [...list];
      newList.splice(index + 1, 0, newItem);
      return { ...prev, [source]: newList };
    });
  };
  const handleRemoveSlide = (index: number) => removeBlock(source, index);
  const handleAddSlideSection = (slideIndex: number, type: string) => addSection(source, slideIndex, type);
  const handleUpdateSlideSection = (slideIndex: number, sectionIndex: number, content: string) => updateSection(source, slideIndex, sectionIndex, content);
  const handleRemoveSlideSection = (slideIndex: number, sectionIndex: number) => removeSection(source, slideIndex, sectionIndex);

    const list = currentLesson[source] || [];

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
      return slideLanguages[sIdx] || detectSlideLanguage(block);
    };

    const setSlideLang = (sIdx: number, lang: 'ar' | 'en') => {
      setSlideLanguages(prev => ({ ...prev, [sIdx]: lang }));
    };

    const handleAutoTranslateSlide = async (sIdx: number) => {
      const block = list[sIdx];
      if (!block) return;

      const currentLang = getSlideLang(block, sIdx);
      const from = currentLang;
      const to = currentLang === 'ar' ? 'en' : 'ar';

      setTranslatingSlide(prev => ({ ...prev, [sIdx]: true }));
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

        setSlideLang(sIdx, to);
        showToast(to === 'en' ? "Translated to English successfully" : "تمت الترجمة إلى العربية بنجاح", "success");
      } catch (err: any) {
        console.error("Translation error:", err);
        showToast(language === 'ar' ? "فشلت الترجمة التلقائية" : "Auto translation failed", "error");
      } finally {
        setTranslatingSlide(prev => ({ ...prev, [sIdx]: false }));
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
      <div className="space-y-8 animate-in fade-in duration-300">
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
          <div className="flex flex-wrap gap-3">
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
              onClick={() => addBlock(source, 'TEXT')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              {language === 'ar' ? "+ محتوى نصي (Text)" : "+ Add Text Content"}
            </button>
            <button 
              type="button"
              onClick={() => addBlock(source, 'QUESTION')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              {language === 'ar' ? "+ سؤال مدمج (Question)" : "+ Add Embedded Question"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {list.map((block: any, sIdx: number) => {
            const slideLang = getSlideLang(block, sIdx);
            const isSlideBodyEnglish = isEnglishOnly(block.content || block.text);

            const resolvedTitle = slideLang === 'en'
              ? (block.titleEn !== undefined && block.titleEn !== null && block.titleEn !== ''
                  ? block.titleEn
                  : (block.title && isEnglishOnly(block.title) ? block.title : ''))
              : (block.title && hasArabicChars(block.title) && block.title !== 'محتوى جديد' && block.title !== 'سؤال جديد' ? block.title : '');

            const resolvedContent = slideLang === 'en'
              ? (block.contentEn || block.textEn || (isSlideBodyEnglish ? (block.content || block.text) : ''))
              : (hasArabicChars(block.content || block.text) ? (block.content || block.text) : '');

            return (
              <React.Fragment key={block.id ?? sIdx}>
                {sIdx === 0 && (
                  <div className="group/divider relative py-2 flex items-center justify-center my-2">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-dashed border-slate-200 group-hover/divider:border-indigo-300 transition-colors"></div>
                    </div>
                    <div className="relative flex justify-center opacity-0 group-hover/divider:opacity-100 transition-all duration-300 scale-95 group-hover/divider:scale-100 gap-3 z-10">
                      <button
                        type="button"
                        onClick={() => insertBlockAt(source, 0, 'TEXT')}
                        className="bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? '+ شريحة شرح' : '+ Explanation Slide'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertBlockAt(source, 0, 'QUESTION')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md hover:shadow-indigo-900/10 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? '+ سؤال مدمج' : '+ Inline Question'}</span>
                      </button>
                    </div>
                    <div className="relative w-6 h-6 bg-slate-100 border border-slate-200 text-slate-400 rounded-full flex items-center justify-center text-[10px] font-black group-hover/divider:hidden transition-all shadow-sm">
                      +
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 border border-slate-200 rounded-2xl sm:rounded-[30px] overflow-hidden group shadow-sm transition-all hover:shadow-md">
                  <div className={`p-3 sm:p-4 flex flex-col md:flex-row gap-3 sm:gap-4 justify-between items-stretch md:items-center border-b ${block.type === 'QUESTION' ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-center gap-2 sm:gap-4 w-full min-w-0 md:w-auto">
                      <span
                        dir="ltr"
                        style={{ inlineSize: '40px', blockSize: '40px', minInlineSize: '40px', wordBreak: 'keep-all', overflowWrap: 'normal' }}
                        className={`shrink-0 flex-none whitespace-nowrap tabular-nums rounded-xl flex items-center justify-center font-black text-white shadow-md ${block.type === 'QUESTION' ? 'bg-indigo-600' : 'bg-slate-800'}`}
                      >
                        {sIdx + 1}
                      </span>
                      <div className="flex flex-col gap-1 flex-1 min-w-0 md:w-auto">
                        <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                          <select
                            value={block.label}
                            onChange={(e) => updateBlockTypeAndReset(source, sIdx, e.target.value)}
                            className="w-full min-w-0 sm:w-auto bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-600 outline-none focus:border-indigo-600 px-2 py-1 uppercase"
                          >
                            {block.type === 'TEXT' ? (
                              <>
                                <option value="CONTENT">{language === 'ar' ? 'محتوى (Content)' : 'Content'}</option>
                                <option value="EXAMPLE">{language === 'ar' ? 'مثال (Example)' : 'Example'}</option>
                                <option value="SUMMARY">{language === 'ar' ? 'ملخص (Summary)' : 'Summary'}</option>
                                <option value="HINT">{language === 'ar' ? 'ملاحظة (Note)' : 'Hint / Note'}</option>
                                <option value="EXPLANATION">{language === 'ar' ? 'شرح (Explanation)' : 'Explanation'}</option>
                              </>
                            ) : (
                              <>
                                <option value="MCQ">{language === 'ar' ? 'اختيار من متعدد (MCQ)' : 'Multiple Choice (MCQ)'}</option>
                                <option value="TRUE_FALSE">{language === 'ar' ? 'صح / خطأ (T/F)' : 'True / False (T/F)'}</option>
                                <option value="MULTI_SELECT">{language === 'ar' ? 'اختيار متعدد (تحديد)' : 'Multi-select (Checkboxes)'}</option>
                                <option value="MATCHING">{language === 'ar' ? 'سؤال التوصيل (Matching)' : 'Matching Elements'}</option>
                                <option value="DRAG_DROP_FILL">{language === 'ar' ? 'سحب الفراغات (Drag & Drop Fill)' : 'Drag & Drop Fill'}</option>
                                <option value="GROUP_SORTING">{language === 'ar' ? 'تصنيف المجموعات (Group Sorting)' : 'Group Sorting'}</option>
                                <option value="NUMBER_LINE">{language === 'ar' ? 'خط الأعداد (Number Line)' : 'Number Line'}</option>
                                <option value="CLOCK">{language === 'ar' ? 'عقارب الساعة (Clock)' : 'Interactive Clock'}</option>
                                <option value="MIND_MAP">{language === 'ar' ? 'خريطة مفاهيم (Mind Map)' : 'Concept Mind Map'}</option>
                                <option value="VIDEO_CHECKPOINT">{language === 'ar' ? 'فيديو تفاعلي (Video Checkpoint)' : 'Interactive Video'}</option>
                                <option value="SWIPE_SORT">{language === 'ar' ? 'سحب سريع لليمين/اليسار (Swipe Sort)' : 'Swipe Sort'}</option>
                                <option value="MAZE">{language === 'ar' ? 'المتاهة التعليمية (Maze)' : 'Educational Maze'}</option>
                                <option value="WORD_SEARCH">{language === 'ar' ? 'البحث عن الكلمات (Word Search)' : 'Word Search'}</option>
                                <option value="GEOGEBRA">{language === 'ar' ? 'جيوجيبرا (GeoGebra)' : 'GeoGebra Widget'}</option>
                                <option value="FLASH_CARD">{language === 'ar' ? 'البطاقات التعليمية (Flash Cards)' : 'Flash Cards'}</option>
                                <option value="MEMORY_GAME">{language === 'ar' ? 'لعبة الذاكرة (Memory Game)' : 'Memory Game'}</option>
                                <option value="WORD_SCRAMBLE">{language === 'ar' ? 'ترتيب الحروف (Word Scramble)' : 'Word Scramble'}</option>
                                <option value="SENTENCE_REORDER">{language === 'ar' ? 'ترتيب الجملة (Sentence Reorder)' : 'Sentence Reorder'}</option>
                                <option value="MATH_EQUATION">{language === 'ar' ? 'معادلة حسابية (Math Equation)' : 'Math Equation'}</option>
                                <option value="SEQUENCE_ORDER">{language === 'ar' ? 'ترتيب التسلسل (Sequence Order)' : 'Sequence Order'}</option>
                                <option value="CROSSWORD">{language === 'ar' ? 'الكلمات المتقاطعة (Crossword)' : 'Crossword'}</option>
                                <option value="COUNT_OBJECTS">{language === 'ar' ? 'عد العناصر (Count Objects)' : 'Count Objects'}</option>
                                <option value="IMAGE_LABEL">{language === 'ar' ? 'تسمية الصورة (Image Labeling)' : 'Image Labeling'}</option>
                                <option value="COLOR_MATCH">{language === 'ar' ? 'تطابق الألوان (Color Match)' : 'Color Match'}</option>
                              </>
                            )}
                          </select>
                          <input 
                            type="text"
                            value={resolvedTitle}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (slideLang === 'en') {
                                updateBlock(source, sIdx, 'titleEn', val, block);
                                if (!block.title || (!/[\u0600-\u06FF]/.test(block.title) && block.title === (block.titleEn || ''))) {
                                  updateBlock(source, sIdx, 'title', val, block);
                                }
                              } else {
                                updateBlock(source, sIdx, 'title', val, block);
                              }
                            }}
                            className="bg-transparent text-slate-900 font-black outline-none border-b border-transparent focus:border-indigo-600 px-2 py-1 w-full min-w-0 md:w-48 placeholder:text-slate-400"
                            placeholder={block.type === 'TEXT' 
                              ? (slideLang === 'en' ? "Unit Title (English)" : "عنوان الوحدة (اختياري)") 
                              : (slideLang === 'en' ? "Question Title (English)" : "عنوان السؤال (اختياري)")}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full md:w-auto self-auto md:self-auto">
                      <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm ml-1">
                        <button
                          type="button"
                          disabled={sIdx === 0}
                          onClick={() => moveBlock(source, sIdx, 'UP')}
                          className="p-2 text-slate-500 hover:text-indigo-600 disabled:text-slate-300 disabled:hover:text-slate-300 hover:bg-slate-50 rounded-lg transition-all"
                          title={language === 'ar' ? "تحريك لأعلى" : "Move Up"}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={sIdx === list.length - 1}
                          onClick={() => moveBlock(source, sIdx, 'DOWN')}
                          className="p-2 text-slate-500 hover:text-indigo-600 disabled:text-slate-300 disabled:hover:text-slate-300 hover:bg-slate-50 rounded-lg transition-all"
                          title={language === 'ar' ? "تحريك لأسفل" : "Move Down"}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="relative" data-dropdown-root="true" onClick={(e) => e.stopPropagation()}>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === `${source}-slide-${sIdx}` ? null : `${source}-slide-${sIdx}`);
                          }}
                          className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> {language === 'ar' ? "إضافة قسم" : "Add Section"}
                        </button>
                        <div className={`absolute right-0 left-auto mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-xl p-2 z-50 ${openDropdownId === `${source}-slide-${sIdx}` ? "block" : "hidden"}`}>
                          {['FEEDBACK', 'HINT', 'EXPLANATION', 'TIP', 'WARNING', 'KEY_INSIGHT'].map(secType => (
                            <button
                              key={secType}
                              type="button"
                              onClick={() => {
                                 addSection(source, sIdx, secType);
                                 setOpenDropdownId(null);
                              }}
                              className="w-full text-right px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors flex items-center gap-2"
                            >
                              {React.createElement(SECTION_STYLE_PRESETS[secType]?.icon || FileText, { className: "w-4 h-4" })}
                              <span>{SECTION_STYLE_PRESETS[secType]?.label || secType}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      {isSuperAdmin && (
                        <button 
                          type="button"
                          onClick={() => removeBlock(source, sIdx)}
                          className="text-red-500 hover:text-red-600 p-2 hover:bg-red-500/10 rounded-xl transition-all bg-white cursor-pointer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-3 sm:p-6 space-y-6">
                    {/* Language Switcher Bar: English First, Arabic Second */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 shadow-xs">
                      <div className="flex items-center gap-2">
                        <Languages className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-black text-slate-700">
                          {slideLang === 'en' ? 'Slide Language / لغة الشريحة:' : 'لغة الشريحة / Slide Language:'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setSlideLang(sIdx, 'en')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                              slideLang === 'en'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-white'
                            }`}
                          >
                            <Globe className="w-3.5 h-3.5" />
                            English (EN)
                          </button>
                          <button
                            type="button"
                            onClick={() => setSlideLang(sIdx, 'ar')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                              slideLang === 'ar'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-white'
                            }`}
                          >
                            <Globe className="w-3.5 h-3.5" />
                            العربية (Arabic)
                          </button>
                        </div>
                        <button
                          type="button"
                          disabled={translatingSlide[sIdx]}
                          onClick={() => handleAutoTranslateSlide(sIdx)}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl font-black flex items-center gap-1.5 text-xs transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                          {translatingSlide[sIdx] ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          <span>
                            {translatingSlide[sIdx] 
                              ? (language === 'ar' ? 'جارٍ الترجمة...' : 'Translating...') 
                              : (slideLang === 'en' ? 'Translate to Arabic' : 'ترجمة للإنجليزية')}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* The primary editor must remain available when advanced settings are collapsed. */}
                    <div>
                      <RichTextEditor
                        value={resolvedContent}
                        onChange={(val) => {
                          if (slideLang === 'en') {
                            updateBlock(source, sIdx, 'contentEn', val, block);
                            if (!block.content || (!/[\u0600-\u06FF]/.test(block.content) && block.content === (block.contentEn || ''))) {
                              updateBlock(source, sIdx, 'content', val, block);
                            }
                          } else {
                            updateBlock(source, sIdx, 'content', val, block);
                          }
                        }}
                        placeholder={block.type === 'TEXT'
                          ? (slideLang === 'en' ? 'Write explanation content here (English)...' : 'اكتب محتوى الشرح هنا...')
                          : (slideLang === 'en' ? 'Write question text here (English)...' : 'اكتب نص السؤال هنا...')}
                        className="!bg-white !border-slate-200"
                      />
                    </div>

                  {/* Unified Metadata Toggle */}
                  <div 
                    className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 px-3 sm:px-6 py-4 rounded-[20px] cursor-pointer hover:bg-slate-100 transition-all mb-4" 
                    onClick={() => setOpenMetadataFor(openMetadataFor === sIdx ? null : sIdx)}
                  >
                    <h5 className="text-sm font-black text-slate-700 flex items-center gap-2">
                      <Target className="w-4 h-4 text-indigo-500" />
                      {language === 'ar' ? 'إعدادات متقدمة (المعيار، المؤشر، رابط فيديو...)' : 'Advanced Settings (Standard, Indicator, Video...)'}
                    </h5>
                    {openMetadataFor === sIdx ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>

                  {openMetadataFor === sIdx && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                      <div className="mb-4">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">
                      {language === 'ar' ? "رابط فيديو (اختياري) خاص بهذا القسم" : "Video Link (Optional) for this section"}
                    </label>
                    <input
                      type="url"
                      value={block.videoUrl || ""}
                      onChange={(e) => updateBlock(source, sIdx, 'videoUrl', e.target.value)}
                      placeholder={language === 'ar' ? "أضف رابط يوتيوب أو فيميو هنا..." : "Add YouTube or Vimeo link here..."}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 font-bold"
                    />
                  </div>
                  {/* Common Metadata for ALL slide types (TEXT and QUESTION) */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-6 bg-white border border-slate-200 rounded-2xl sm:rounded-[30px] shadow-sm mb-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'المعيار' : 'Standard'}</label>
                      <select 
                        className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                        value={block.standard || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "__CUSTOM__") {
                            const customVal = prompt(language === 'ar' ? "أدخل المعيار لهذه الشريحة:" : "Enter standard for this slide:");
                            if (customVal && customVal.trim()) {
                              updateBlock(source, sIdx, 'standard', customVal.trim());
                            }
                          } else {
                            updateBlock(source, sIdx, 'standard', val);
                          }
                        }}
                      >
                        <option value="">{language === 'ar' ? 'بلا معيار (None)' : 'None'}</option>
                        {block.standard && !((currentLesson.standards || "").split("\n").includes(block.standard)) && (
                          <option value={block.standard}>{block.standard}</option>
                        )}
                        {(currentLesson.standards || "").split("\n").filter(Boolean).map((s: string) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                        <option value="__CUSTOM__" className="text-indigo-600 font-bold">{language === 'ar' ? '+ إضافة معيار مخصص للشريحة...' : '+ Add Custom Standard...'}</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'المؤشر' : 'Indicator'}</label>
                      <select 
                        className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                        value={block.indicator || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "__CUSTOM__") {
                            const customVal = prompt(language === 'ar' ? "أدخل المؤشر لهذه الشريحة:" : "Enter indicator for this slide:");
                            if (customVal && customVal.trim()) {
                              updateBlock(source, sIdx, 'indicator', customVal.trim());
                            }
                          } else {
                            updateBlock(source, sIdx, 'indicator', val);
                          }
                        }}
                      >
                        <option value="">{language === 'ar' ? 'بلا مؤشر (None)' : 'None'}</option>
                        {block.indicator && !((currentLesson.indicators || "").split("\n").includes(block.indicator)) && (
                          <option value={block.indicator}>{block.indicator}</option>
                        )}
                        {(currentLesson.indicators || "").split("\n").filter(Boolean).map((ind: string) => (
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                        <option value="__CUSTOM__" className="text-indigo-600 font-bold">{language === 'ar' ? '+ إضافة مؤشر مخصص للشريحة...' : '+ Add Custom Indicator...'}</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'مخرج التعلم' : 'Learning Outcome'}</label>
                      <select 
                        className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                        value={block.learningOutcome || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "__CUSTOM__") {
                            const customVal = prompt(language === 'ar' ? "أدخل ناتج التعلم لهذه الشريحة:" : "Enter learning outcome for this slide:");
                            if (customVal && customVal.trim()) {
                              updateBlock(source, sIdx, 'learningOutcome', customVal.trim());
                            }
                          } else {
                            updateBlock(source, sIdx, 'learningOutcome', val);
                          }
                        }}
                      >
                        <option value="">{language === 'ar' ? 'بلا ناتج تعلم (None)' : 'None'}</option>
                        {block.learningOutcome && !((currentLesson.learningOutcomes || "").split("\n").includes(block.learningOutcome)) && (
                          <option value={block.learningOutcome}>{block.learningOutcome}</option>
                        )}
                        {(currentLesson.learningOutcomes || "").split("\n").filter(Boolean).map((lo: string) => (
                          <option key={lo} value={lo}>{lo}</option>
                        ))}
                        <option value="__CUSTOM__" className="text-indigo-600 font-bold">{language === 'ar' ? '+ إضافة ناتج تعلم مخصص...' : '+ Add Custom Outcome...'}</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'المهارة' : 'Skill'}</label>
                      <select 
                        className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                        value={block.skill || "General"}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "add_custom") {
                            const newVal = prompt(language === 'ar' ? "أدخل مهارة مخصصة جديدة:" : "Enter custom skill:");
                            if (newVal && newVal.trim()) {
                              const trimmed = newVal.trim();
                              setCustomSkills(prev => Array.from(new Set([...prev, trimmed])));
                              updateBlock(source, sIdx, 'skill', trimmed);
                            }
                          } else {
                            updateBlock(source, sIdx, 'skill', val);
                          }
                        }}
                      >
                        <option value="General">{language === 'ar' ? 'عام' : 'General'}</option>
                        {allExistingSkills.filter((sk: any) => sk !== "General").map((sk: any) => (
                          <option key={sk} value={sk}>{sk}</option>
                        ))}
                        <option value="add_custom" className="text-indigo-600 font-bold">
                          {language === 'ar' ? '+ إضافة مهارة مخصصة...' : '+ Add Custom Skill...'}
                        </option>
                      </select>
                    </div>
                  </div>

                  {block.type === 'QUESTION' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-6 bg-white border border-slate-200 rounded-2xl sm:rounded-[30px] shadow-sm mb-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'مستوى الصعوبة' : 'Difficulty'}</label>
                        <select 
                          className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                          value={block.level || "Medium"}
                          onChange={(e) => updateBlock(source, sIdx, 'level', e.target.value)}
                        >
                          <option value="Foundation">{language === 'ar' ? 'تأسيسي' : 'Foundation'}</option>
                          <option value="On Level">{language === 'ar' ? 'في المستوى' : 'On Level'}</option>
                          <option value="Advanced">{language === 'ar' ? 'متقدم' : 'Advanced'}</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'عمق المعرفة (DOK)' : 'Depth of Knowledge (DOK)'}</label>
                        <select 
                          className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                          value={block.dok || ""}
                          onChange={(e) => updateBlock(source, sIdx, 'dok', e.target.value)}
                        >
                          <option value="">{language === 'ar' ? 'بلا تحديد' : 'None'}</option>
                          <option value="DOK 1">DOK 1</option>
                          <option value="DOK 2">DOK 2</option>
                          <option value="DOK 3">DOK 3</option>
                          <option value="DOK 4">DOK 4</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'النقاط' : 'Points'}</label>
                        <input 
                          type="number"
                          className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                          value={block.points !== undefined ? block.points : 1}
                          onChange={(e) => updateBlock(source, sIdx, 'points', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'نقاط XP' : 'XP Points'}</label>
                        <input 
                          type="number"
                          className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                          value={block.xpPoints !== undefined ? block.xpPoints : 10}
                          onChange={(e) => updateBlock(source, sIdx, 'xpPoints', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  )}
                    </div>
                  )}

                  {block.type === 'QUESTION' && (
                    <div className="bg-slate-100 p-3 sm:p-6 rounded-2xl border border-slate-200 space-y-4">
                      {['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(block.label || 'MCQ') ? (
                        <>
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">
                            {slideLang === 'en' ? "Answer Options & Correct Answer" : "خيارات الإجابة والإجابة الصحيحة"}
                          </label>
                          {block.label === 'TRUE_FALSE' ? (
                            <div className="grid grid-cols-2 gap-4">
                              {['True', 'False'].map((opt) => {
                                const isSelected = normalizeAnswerGlobal(block.correctAnswer) === normalizeAnswerGlobal(opt);
                                return (
                                  <div 
                                    key={opt} 
                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-transparent'}`} 
                                    onClick={() => {
                                      updateBlock(source, sIdx, 'correctAnswer', opt);
                                      updateBlock(source, sIdx, 'correctAnswerEn', opt);
                                    }}
                                  >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-emerald-500 border-emerald-200' : 'bg-slate-200 border-transparent'}`}>
                                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                                    </div>
                                    <span className="font-bold text-slate-700">{opt}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            (() => {
                              const isEnOpts = (block.options || []).some((o: string) => /[a-zA-Z]/.test(o)) && !(block.options || []).some((o: string) => /[\u0600-\u06FF]/.test(o));
                              const rawOpts = slideLang === 'en'
                                ? ((block.optionsEn && block.optionsEn.length > 0)
                                    ? block.optionsEn
                                    : (isEnOpts ? (block.options || []) : ["", "", "", ""]))
                                : (block.options || []).map((o: string) => (/[\u0600-\u06FF]/.test(o) ? o : ''));
                              const baseOpts = (block.options && block.options.length > 0) ? block.options : (block.optionsEn || ["", "", "", ""]);
                              const displayOpts = rawOpts.length > 0 ? rawOpts : ["", "", "", ""];

                              return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {displayOpts.map((opt: string, oIdx: number) => {
                                    const baseVal = baseOpts[oIdx] || opt;
                                    const isSelected = block.label === 'MULTI_SELECT' 
                                      ? (block.correctAnswers || []).includes(baseVal) || (block.correctAnswersEn || []).includes(opt)
                                      : (block.correctAnswer === baseVal || block.correctAnswerEn === opt);

                                    return (
                                      <div key={oIdx} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${isSelected && opt ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-transparent'}`}>
                                        <div 
                                          onClick={() => {
                                            const baseTarget = baseOpts[oIdx] || opt;
                                            if (block.label === 'MULTI_SELECT') {
                                              const answers = block.correctAnswers || [];
                                              if (answers.includes(baseTarget) && baseTarget) {
                                                updateBlock(source, sIdx, 'correctAnswers', answers.filter((a:string) => a !== baseTarget));
                                              } else if (baseTarget) {
                                                updateBlock(source, sIdx, 'correctAnswers', [...answers, baseTarget]);
                                              }
                                            } else {
                                              updateBlock(source, sIdx, 'correctAnswer', baseTarget);
                                              if (slideLang === 'en') {
                                                updateBlock(source, sIdx, 'correctAnswerEn', opt);
                                              }
                                            }
                                          }}
                                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer ${isSelected && opt ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-200 border-transparent'}`}
                                        >
                                          {isSelected && opt && <CheckCircle2 className="w-4 h-4 text-white" />}
                                        </div>
                                        <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-[11px] text-indigo-600 shrink-0 select-none">
                                          {getOptionLetter(oIdx, slideLang)}
                                        </span>
                                        <MathInput 
                                          value={opt}
                                          onChange={(val) => {
                                            if (slideLang === 'en') {
                                              const newOptsEn = [...(block.optionsEn && block.optionsEn.length > 0 ? block.optionsEn : displayOpts)];
                                              newOptsEn[oIdx] = val;
                                              updateBlock(source, sIdx, 'optionsEn', newOptsEn);

                                              const newOpts = [...(block.options || [])];
                                              if (!newOpts[oIdx] || (!/[\u0600-\u06FF]/.test(newOpts[oIdx]) && newOpts[oIdx] === displayOpts[oIdx])) {
                                                newOpts[oIdx] = val;
                                                updateBlock(source, sIdx, 'options', newOpts);
                                              }
                                            } else {
                                              const newOpts = [...(block.options || [])];
                                              const oldVal = newOpts[oIdx];
                                              newOpts[oIdx] = val;

                                              const newBlock = { ...block, options: newOpts };
                                              if (block.label === 'MULTI_SELECT' && (block.correctAnswers || []).includes(oldVal)) {
                                                newBlock.correctAnswers = (block.correctAnswers || []).map((a: string) => a === oldVal ? val : a);
                                              } else if (block.correctAnswer === oldVal) {
                                                newBlock.correctAnswer = val;
                                              }

                                              setCurrentLesson((prev: any) => {
                                                const newSlides = [...(prev[source] || [])];
                                                const resolvedIndex = newSlides.findIndex((candidate: any) => candidate === block || (block.id != null && candidate?.id === block.id));
                                                if (resolvedIndex < 0) return prev;
                                                newSlides[resolvedIndex] = newBlock;
                                                return { ...prev, [source]: newSlides };
                                              });
                                            }
                                          }}
                                          placeholder={slideLang === 'en' ? `Option ${oIdx + 1}` : `الخيار ${oIdx + 1}`}
                                          className="bg-transparent flex-1"
                                        />
                                        {displayOpts.length > 2 && (
                                          <button 
                                            type="button" 
                                            onClick={() => {
                                              const newOpts = [...(block.options || [])];
                                              newOpts.splice(oIdx, 1);
                                              updateBlock(source, sIdx, 'options', newOpts);
                                              if (block.optionsEn && block.optionsEn.length > 0) {
                                                const newOptsEn = [...block.optionsEn];
                                                newOptsEn.splice(oIdx, 1);
                                                updateBlock(source, sIdx, 'optionsEn', newOptsEn);
                                              }
                                            }} 
                                            className="text-red-400 hover:text-red-600"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      updateBlock(source, sIdx, 'options', [...(block.options || []), ""]);
                                      if (block.optionsEn && block.optionsEn.length > 0) {
                                        updateBlock(source, sIdx, 'optionsEn', [...block.optionsEn, ""]);
                                      }
                                    }}
                                    className="flex justify-center items-center p-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-bold hover:bg-slate-200 hover:border-slate-400 transition-all cursor-pointer"
                                  >
                                    <Plus className="w-5 h-5 ml-1" /> {slideLang === 'en' ? 'Add Option' : 'إضافة خيار'}
                                  </button>
                                </div>
                              );
                            })()
                          )}
                        </>
                      ) : (
                        <InteractiveQuestionEditor
                          question={{
                            ...block,
                            options: slideLang === 'en' && block.optionsEn && block.optionsEn.length > 0 ? block.optionsEn : block.options,
                            type: block.label || 'MCQ'
                          }}
                          onChange={(updatedQ) => {
                            setCurrentLesson((prev: any) => {
                              const newSlides = [...(prev[source] || [])];
                              const resolvedIndex = newSlides.findIndex((candidate: any) => candidate === block || (block.id != null && candidate?.id === block.id));
                              if (resolvedIndex < 0) return prev;
                              newSlides[resolvedIndex] = {
                                ...newSlides[resolvedIndex],
                                options: updatedQ.options,
                                optionsEn: slideLang === 'en' ? updatedQ.options : newSlides[resolvedIndex].optionsEn,
                                correctAnswer: updatedQ.correctAnswer,
                                correctAnswerEn: slideLang === 'en' ? updatedQ.correctAnswer : newSlides[resolvedIndex].correctAnswerEn,
                                ...(updatedQ.type === 'MULTI_SELECT' ? (() => {
                                  try {
                                    return { correctAnswers: JSON.parse(updatedQ.correctAnswer) };
                                  } catch (e) {
                                    return {};
                                  }
                                })() : {})
                              };
                              return { ...prev, [source]: newSlides };
                            });
                          }}
                          language={slideLang}
                        />
                      )}
                    </div>
                  )}

                  {(block.sections || []).length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div 
                        className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 px-3 sm:px-6 py-4 rounded-[20px] cursor-pointer hover:bg-slate-100 transition-all mb-4" 
                        onClick={() => setOpenSectionsFor(openSectionsFor === sIdx ? null : sIdx)}
                      >
                        <h5 className="text-sm font-black text-slate-700 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-500" />
                          {slideLang === 'en' ? 'Dynamic Sections' : 'أقسام إضافية ديناميكية (Dynamic Sections)'}
                        </h5>
                        {openSectionsFor === sIdx ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                      </div>
                      
                      {openSectionsFor === sIdx && (
                        <div className="animate-in slide-in-from-top-2 duration-300 space-y-4 pt-2">
                          {(block.sections || []).map((sec: any, secIdx: number) => {
                            const preset = SECTION_STYLE_PRESETS[sec.type] || SECTION_STYLE_PRESETS.EXPLANATION;
                            const SectionIcon = preset.icon;
                            const secContent = slideLang === 'en'
                              ? (sec.contentEn || (sec.content && /[a-zA-Z]/.test(sec.content) && !/[\u0600-\u06FF]/.test(sec.content) ? sec.content : ''))
                              : (sec.content || '');
                            return (
                              <div key={sec.id || secIdx} className={`p-4 rounded-2xl relative group/section border ${preset.container}`}>
                                <div className="flex justify-between items-center mb-3">
                                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 ${preset.badge}`}>
                                    <SectionIcon className="w-3.5 h-3.5" />
                                    {preset.label}
                                    {slideLang === 'en' && <span className="text-[9px] bg-white/40 px-1.5 py-0.5 rounded ml-1 font-bold">EN</span>}
                                  </span>
                                  <button type="button" onClick={() => removeSection(source, sIdx, secIdx)} className="text-red-400 hover:text-red-600 opacity-0 group-hover/section:opacity-100 transition-all cursor-pointer">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <RichTextEditor 
                                  value={secContent}
                                  onChange={(val) => {
                                    if (slideLang === 'en') {
                                      updateSection(source, sIdx, secIdx, val, block, sec, 'contentEn');
                                    } else {
                                      updateSection(source, sIdx, secIdx, val, block, sec, 'content');
                                    }
                                  }}
                                  placeholder={slideLang === 'en' ? `${sec.type} content (English)...` : `محتوى الـ ${sec.type}...`}
                                  className="!bg-white"
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="group/divider relative py-2 flex items-center justify-center my-2">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-dashed border-slate-200 group-hover/divider:border-indigo-300 transition-colors"></div>
                </div>
                <div className="relative flex justify-center opacity-0 group-hover/divider:opacity-100 transition-all duration-300 scale-95 group-hover/divider:scale-100 gap-3 z-10">
                  <button
                    type="button"
                    onClick={() => insertBlockAt(source, sIdx + 1, 'TEXT')}
                    className="bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? '+ شريحة شرح' : '+ Explanation Slide'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertBlockAt(source, sIdx + 1, 'QUESTION')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md hover:shadow-indigo-900/10 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? '+ سؤال مدمج' : '+ Inline Question'}</span>
                  </button>
                </div>
                <div className="relative w-6 h-6 bg-slate-100 border border-slate-200 text-slate-400 rounded-full flex items-center justify-center text-[10px] font-black group-hover/divider:hidden transition-all shadow-sm">
                  +
                </div>
              </div>
            </React.Fragment>
          );
        })}
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
