"use client";

import React, { useMemo } from "react";
import {
  Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2,
  Layout, FileText, Target, Languages, Loader2, Globe, Sparkles,
  Edit2, Copy
} from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import QuestionImageGallery from "@/components/QuestionImageGallery";
import { extractImageUrls } from "@/lib/image-utils";
import MathInput from "@/components/MathInput";
import InteractiveQuestionEditor from "@/components/InteractiveQuestionEditor";
import { getOptionLetter } from "@/lib/utils";
import { normalizeAnswerGlobal } from "@/components/LessonSubComponents";

interface SlideCardProps {
  block: any;
  sIdx: number;
  source: 'slides' | 'assignments' | 'questions';
  listLength: number;
  language: string;
  slideLang: 'ar' | 'en';
  setSlideLang: (sKey: any, lang: 'ar' | 'en') => void;
  isSuperAdmin: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDuplicate?: (sIdx: number) => void;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  openMetadataFor: number | null;
  setOpenMetadataFor: (idx: number | null) => void;
  openSectionsFor: number | null;
  setOpenSectionsFor: (idx: number | null) => void;
  translatingSlide: boolean;
  onAutoTranslate: (sIdx: number) => void;
  showToast: (msg: string, type?: any) => void;
  allQuestions?: any[];
  allExistingSkills: string[];
  SECTION_STYLE_PRESETS: any;
  currentLessonStandards: string;
  currentLessonIndicators: string;
  currentLessonLearningOutcomes: string;
  insertBlockAt: (source: any, index: number, type: 'TEXT' | 'QUESTION') => void;
  moveBlock: (source: any, index: number, direction: 'UP' | 'DOWN') => void;
  removeBlock: (source: any, index: number) => void;
  updateBlock: (source: any, index: number, field: string, value: any, blockRef?: any) => void;
  updateBlockFields: (source: any, index: number, updates: Record<string, any>, blockRef?: any) => void;
  updateBlockTypeAndReset: (source: any, index: number, newType: string) => void;
  addSection: (source: any, blockIndex: number, type: string) => void;
  updateSection: (source: any, blockIndex: number, sectionIndex: number, content: string, blockRef?: any, sectionRef?: any, field?: any) => void;
  removeSection: (source: any, blockIndex: number, sectionIndex: number) => void;
  setCustomSkills: React.Dispatch<React.SetStateAction<string[]>>;
  setCurrentLesson: (cb: any) => void;
}

const cleanHtml = (str?: string) => String(str || '').replace(/<[^>]*>/g, '').trim();

const isEnglishOnly = (str?: string) => {
  const clean = cleanHtml(str);
  return /[a-zA-Z]/.test(clean) && !/[\u0600-\u06FF]/.test(clean);
};

const hasArabicChars = (str?: string) => /[\u0600-\u06FF]/.test(cleanHtml(str));

export const SlideCard: React.FC<SlideCardProps> = React.memo(({
  block,
  sIdx,
  source,
  listLength,
  language,
  slideLang,
  setSlideLang,
  isSuperAdmin,
  isExpanded = true,
  onToggleExpand = () => {},
  onDuplicate,
  openDropdownId,
  setOpenDropdownId,
  openMetadataFor,
  setOpenMetadataFor,
  openSectionsFor,
  setOpenSectionsFor,
  translatingSlide,
  onAutoTranslate,
  showToast,
  allQuestions = [],
  allExistingSkills,
  SECTION_STYLE_PRESETS,
  currentLessonStandards,
  currentLessonIndicators,
  currentLessonLearningOutcomes,
  insertBlockAt,
  moveBlock,
  removeBlock,
  updateBlock,
  updateBlockFields,
  updateBlockTypeAndReset,
  addSection,
  updateSection,
  removeSection,
  setCustomSkills,
  setCurrentLesson
}) => {
  const blockKey = block.id ?? sIdx;
  const isSlideBodyEnglish = isEnglishOnly(block.content || block.text);

  const resolvedTitle = slideLang === 'en'
    ? (block.titleEn !== undefined && block.titleEn !== null && block.titleEn !== ''
        ? block.titleEn
        : (block.title && isEnglishOnly(block.title) ? block.title : ''))
    : (block.titleEn
        ? (block.title || '')
        : (block.title && hasArabicChars(block.title) && block.title !== 'محتوى جديد' && block.title !== 'سؤال جديد' ? block.title : ''));

  const resolvedContent = slideLang === 'en'
    ? (block.contentEn || block.textEn || (isSlideBodyEnglish ? (block.content || block.text) : ''))
    : (block.contentEn ? (block.content || block.text || '') : (hasArabicChars(block.content || block.text) ? (block.content || block.text) : ''));

  const availableImages = useMemo(() => {
    if (!isExpanded) return [];
    return extractImageUrls([
      block.content,
      block.contentEn,
      block.image,
      ...(Array.isArray(block.sections) ? block.sections.map((sec: any) => `${sec.content || ''} ${sec.contentEn || ''}`) : []),
      typeof block.options === 'string' ? block.options : JSON.stringify(block.options || ''),
      typeof block.optionsEn === 'string' ? block.optionsEn : JSON.stringify(block.optionsEn || '')
    ].filter(Boolean).join(' '));
  }, [isExpanded, block.content, block.contentEn, block.image, block.sections, block.options, block.optionsEn]);

  const handleTitleChange = (val: string) => {
    if (slideLang === 'en') {
      const updates: Record<string, any> = { titleEn: val };
      if (!block.title || (!/[\u0600-\u06FF]/.test(block.title) && block.title === (block.titleEn || ''))) {
        updates.title = val;
      }
      updateBlockFields(source, sIdx, updates, block);
    } else {
      updateBlock(source, sIdx, 'title', val, block);
    }
  };

  const handleContentChange = (val: string) => {
    if (slideLang === 'en') {
      const updates: Record<string, any> = { contentEn: val };
      if (!block.content || (!/[\u0600-\u06FF]/.test(block.content) && block.content === (block.contentEn || ''))) {
        updates.content = val;
      }
      updateBlockFields(source, sIdx, updates, block);
    } else {
      updateBlock(source, sIdx, 'content', val, block);
    }
  };

  return (
    <div className="space-y-4">
      {sIdx === 0 && (
        <div className="group/divider relative py-2 flex items-center justify-center my-2">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-dashed border-slate-200 group-hover/divider:border-indigo-300 transition-colors"></div>
          </div>
          <div className="relative flex justify-center opacity-0 group-hover/divider:opacity-100 transition-opacity duration-200 gap-3 z-10">
            <button
              type="button"
              onClick={() => insertBlockAt(source, 0, 'TEXT')}
              className="bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? '+ شريحة شرح' : '+ Explanation Slide'}</span>
            </button>
            <button
              type="button"
              onClick={() => insertBlockAt(source, 0, 'QUESTION')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md hover:shadow-indigo-900/10 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? '+ سؤال مدمج' : '+ Inline Question'}</span>
            </button>
          </div>
          <div className="relative w-6 h-6 bg-slate-100 border border-slate-200 text-slate-400 rounded-full flex items-center justify-center text-[10px] font-black group-hover/divider:hidden shadow-sm">
            +
          </div>
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-2xl sm:rounded-[30px] overflow-hidden group shadow-sm transition-shadow hover:shadow-md">
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
                  onChange={(e) => handleTitleChange(e.target.value)}
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
                className="p-2 text-slate-500 hover:text-indigo-600 disabled:text-slate-300 disabled:hover:text-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                title={language === 'ar' ? "تحريك لأعلى" : "Move Up"}
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={sIdx === listLength - 1}
                onClick={() => moveBlock(source, sIdx, 'DOWN')}
                className="p-2 text-slate-500 hover:text-indigo-600 disabled:text-slate-300 disabled:hover:text-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
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
                className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer"
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
            {onDuplicate && (
              <button
                type="button"
                onClick={() => onDuplicate(sIdx)}
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer bg-white"
                title={language === 'ar' ? "نسخ الشريحة" : "Duplicate Slide"}
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            {isSuperAdmin && (
              <button 
                type="button"
                onClick={() => removeBlock(source, sIdx)}
                className="text-red-500 hover:text-red-600 p-2 hover:bg-red-500/10 rounded-xl transition-colors bg-white cursor-pointer"
                title={language === 'ar' ? "حذف الشريحة" : "Delete Slide"}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={onToggleExpand}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isExpanded
                  ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  : 'bg-white text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
              }`}
              title={isExpanded ? (language === 'ar' ? "طي الشريحة" : "Collapse Slide") : (language === 'ar' ? "توسيع الشريحة" : "Expand Slide")}
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isExpanded ? (
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
                  onClick={() => setSlideLang(blockKey, 'en')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer ${
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
                  onClick={() => setSlideLang(blockKey, 'ar')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer ${
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
                disabled={translatingSlide}
                onClick={() => onAutoTranslate(sIdx)}
                className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl font-black flex items-center gap-1.5 text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {translatingSlide ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>
                  {translatingSlide 
                    ? (language === 'ar' ? 'جارٍ الترجمة...' : 'Translating...') 
                    : (slideLang === 'en' ? 'Translate to Arabic' : 'ترجمة للإنجليزية')}
                </span>
              </button>
            </div>
          </div>

          {/* Slide Images & Cross-Language Media Tray */}
          <QuestionImageGallery
            language={language}
            activeLang={slideLang}
            tempQuestion={block}
            allQuestions={allQuestions}
            onUpdateQuestion={(field, val) => updateBlock(source, sIdx, field, val, block)}
            showToast={showToast}
            textField="content"
            textFieldEn="contentEn"
            imageField="image"
            title={block.type === 'QUESTION'
              ? (language === 'ar' ? 'معرض صور السؤال واستدعاء الوسائط' : 'Question Images & Media Tray')
              : (language === 'ar' ? 'معرض صور الشريحة واستدعاء الوسائط' : 'Slide Images & Media Tray')}
          />

          {/* The primary editor */}
          <div>
            <RichTextEditor
              key={`slide-editor-${blockKey}-${slideLang}`}
              value={resolvedContent}
              onChange={handleContentChange}
              availableImages={availableImages}
              placeholder={block.type === 'TEXT'
                ? (slideLang === 'en' ? 'Write explanation content here (English)...' : 'اكتب محتوى الشرح هنا...')
                : (slideLang === 'en' ? 'Write question text here (English)...' : 'اكتب نص السؤال هنا...')}
              className="!bg-white !border-slate-200"
            />
          </div>

          {/* Unified Metadata Toggle */}
          <div 
            className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 px-3 sm:px-6 py-4 rounded-[20px] cursor-pointer hover:bg-slate-100 transition-colors mb-4" 
            onClick={() => setOpenMetadataFor(openMetadataFor === sIdx ? null : sIdx)}
          >
            <h5 className="text-sm font-black text-slate-700 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-500" />
              {language === 'ar' ? 'إعدادات متقدمة (المعيار، المؤشر، رابط فيديو...)' : 'Advanced Settings (Standard, Indicator, Video...)'}
            </h5>
            {openMetadataFor === sIdx ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>

          {openMetadataFor === sIdx && (
            <div className="space-y-4 pt-1">
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

              {/* Common Metadata for ALL slide types */}
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
                    {block.standard && !((currentLessonStandards || "").split("\n").includes(block.standard)) && (
                      <option value={block.standard}>{block.standard}</option>
                    )}
                    {(currentLessonStandards || "").split("\n").filter(Boolean).map((s: string) => (
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
                    {block.indicator && !((currentLessonIndicators || "").split("\n").includes(block.indicator)) && (
                      <option value={block.indicator}>{block.indicator}</option>
                    )}
                    {(currentLessonIndicators || "").split("\n").filter(Boolean).map((ind: string) => (
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
                    {block.learningOutcome && !((currentLessonLearningOutcomes || "").split("\n").includes(block.learningOutcome)) && (
                      <option value={block.learningOutcome}>{block.learningOutcome}</option>
                    )}
                    {(currentLessonLearningOutcomes || "").split("\n").filter(Boolean).map((lo: string) => (
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
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-transparent'}`} 
                            onClick={() => {
                              updateBlockFields(source, sIdx, { correctAnswer: opt, correctAnswerEn: opt }, block);
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
                        : ((block.optionsEn && block.optionsEn.length > 0)
                            ? (block.options || ["", "", "", ""])
                            : (block.options || []).map((o: string) => (/[\u0600-\u06FF]/.test(o) ? o : '')));
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
                              <div key={oIdx} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${isSelected && opt ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-transparent'}`}>
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
                                      if (slideLang === 'en') {
                                        updateBlockFields(source, sIdx, { correctAnswer: baseTarget, correctAnswerEn: opt }, block);
                                      } else {
                                        updateBlock(source, sIdx, 'correctAnswer', baseTarget);
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
                                      const updates: Record<string, any> = { optionsEn: newOptsEn };

                                      const newOpts = [...(block.options || [])];
                                      if (!newOpts[oIdx] || (!/[\u0600-\u06FF]/.test(newOpts[oIdx]) && newOpts[oIdx] === displayOpts[oIdx])) {
                                        newOpts[oIdx] = val;
                                        updates.options = newOpts;
                                      }
                                      updateBlockFields(source, sIdx, updates, block);
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
                                      const updates: Record<string, any> = { options: newOpts };
                                      if (block.optionsEn && block.optionsEn.length > 0) {
                                        const newOptsEn = [...block.optionsEn];
                                        newOptsEn.splice(oIdx, 1);
                                        updates.optionsEn = newOptsEn;
                                      }
                                      updateBlockFields(source, sIdx, updates, block);
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
                              const updates: Record<string, any> = { options: [...(block.options || []), ""] };
                              if (block.optionsEn && block.optionsEn.length > 0) {
                                updates.optionsEn = [...block.optionsEn, ""];
                              }
                              updateBlockFields(source, sIdx, updates, block);
                            }}
                            className="flex justify-center items-center p-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-bold hover:bg-slate-200 hover:border-slate-400 transition-colors cursor-pointer"
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
                  onChange={(updatedQ: any) => {
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
                className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 px-3 sm:px-6 py-4 rounded-[20px] cursor-pointer hover:bg-slate-100 transition-colors mb-4" 
                onClick={() => setOpenSectionsFor(openSectionsFor === sIdx ? null : sIdx)}
              >
                <h5 className="text-sm font-black text-slate-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  {slideLang === 'en' ? 'Dynamic Sections' : 'أقسام إضافية ديناميكية (Dynamic Sections)'}
                </h5>
                {openSectionsFor === sIdx ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </div>
              
              {openSectionsFor === sIdx && (
                <div className="space-y-4 pt-2">
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
                          <button type="button" onClick={() => removeSection(source, sIdx, secIdx)} className="text-red-400 hover:text-red-600 opacity-0 group-hover/section:opacity-100 transition-opacity cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <RichTextEditor 
                          key={`section-editor-${blockKey}-${sec.id || secIdx}-${slideLang}`}
                          value={secContent}
                          onChange={(val) => {
                            if (slideLang === 'en') {
                              updateSection(source, sIdx, secIdx, val, block, sec, 'contentEn');
                            } else {
                              updateSection(source, sIdx, secIdx, val, block, sec, 'content');
                            }
                          }}
                          availableImages={availableImages}
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
      ) : (
        <div
          onClick={onToggleExpand}
          className="p-4 sm:p-5 bg-white hover:bg-indigo-50/25 transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-t border-slate-100 group/preview"
        >
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-slate-800 group-hover/preview:text-indigo-600 transition-colors">
                {resolvedTitle || (block.type === 'QUESTION' ? (language === 'ar' ? 'سؤال بدون عنوان' : 'Untitled Question') : (language === 'ar' ? 'شريحة بدون عنوان' : 'Untitled Slide'))}
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                {block.label || (block.type === 'QUESTION' ? 'MCQ' : 'CONTENT')}
              </span>
              {block.type === 'QUESTION' && Array.isArray(block.options) && block.options.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {language === 'ar' ? `${block.options.length} خيارات إجابة` : `${block.options.length} options`}
                </span>
              )}
              {Array.isArray(block.sections) && block.sections.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                  {language === 'ar' ? `${block.sections.length} أقسام مساعدة` : `${block.sections.length} sections`}
                </span>
              )}
              {Boolean(block.image || block.imageUrl) && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {language === 'ar' ? 'صورة مرفقة' : 'Image attached'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-bold truncate max-w-3xl">
              {cleanHtml(resolvedContent) || (language === 'ar' ? 'انقر هنا لتعديل محتوى الشريحة وكتابة الشرح...' : 'Click here to edit slide content...')}
            </p>
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'تعديل الشريحة' : 'Edit Slide'}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>

      <div className="group/divider relative py-2 flex items-center justify-center my-2">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-dashed border-slate-200 group-hover/divider:border-indigo-300 transition-colors"></div>
        </div>
        <div className="relative flex justify-center opacity-0 group-hover/divider:opacity-100 transition-opacity duration-200 gap-3 z-10">
          <button
            type="button"
            onClick={() => insertBlockAt(source, sIdx + 1, 'TEXT')}
            className="bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? '+ شريحة شرح' : '+ Explanation Slide'}</span>
          </button>
          <button
            type="button"
            onClick={() => insertBlockAt(source, sIdx + 1, 'QUESTION')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md hover:shadow-indigo-900/10 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? '+ سؤال مدمج' : '+ Inline Question'}</span>
          </button>
        </div>
        <div className="relative w-6 h-6 bg-slate-100 border border-slate-200 text-slate-400 rounded-full flex items-center justify-center text-[10px] font-black group-hover/divider:hidden shadow-sm">
          +
        </div>
      </div>
    </div>
  );
});

SlideCard.displayName = "SlideCard";
