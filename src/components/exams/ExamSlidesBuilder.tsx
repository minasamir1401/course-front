// @ts-nocheck
"use client";

import React, { useRef, useState } from 'react';
import BilingualMetadataEditor from '@/components/BilingualMetadataEditor';
import SlideKeyboardRegion from '@/components/SlideKeyboardRegion';
import { ChevronUp, ChevronDown, CheckCircle2, Trash2, Plus, FileText, Layout, Globe, Languages, Loader2, Sparkles } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import { extractImageUrls } from '@/lib/image-utils';
import { getOptionLetter } from '@/lib/utils';
import MathInput from '@/components/MathInput';
import InteractiveQuestionEditor from '@/components/InteractiveQuestionEditor';
import AutoTranslateToggle, { useAutoTranslatePreference } from '@/components/AutoTranslateToggle';
import { useNotification } from '@/context/NotificationContext';
import { syncRichTextFormatting } from '@/lib/bilingualRichText';
import { getAutoTranslateEnabled } from '@/lib/autoTranslatePreference';
import { detectSlideLanguage, hasArabicLetters, isDefaultSlideTitle, isEnglishOnlyText } from '@/lib/slideLanguage';
import { mergeSafeArabicSlidePatch, slideNeedsTabAutoTranslate, translateSingleSlideItem } from '@/lib/manualAutoTranslate';
import { normalizeAnswerGlobal } from '@/components/LessonSubComponents';

export const ExamSlidesBuilder = (props: any) => {
  const {
    openDropdownId,
    setOpenDropdownId,
    allExistingSkills = [],
    setCustomSkills,
    addBlock,
    insertBlockAt,
    updateBlock,
    updateBlockFields,
    updateBlockTypeAndReset,
    moveBlock,
    removeBlock,
    addSection,
    removeSection,
    updateSection,
    source,
    currentModule,
    language,
    setCurrentModule,
    SECTION_STYLE_PRESETS = {},
  } = props;

  const { showToast } = useNotification();
  const [autoTranslateEnabled] = useAutoTranslatePreference();
  const [slideLanguages, setSlideLanguages] = useState<Record<string | number, 'ar' | 'en'>>({});
  const [translatingSlide, setTranslatingSlide] = useState<Record<string | number, boolean>>({});
  const translatingKeysRef = useRef<Set<string | number>>(new Set());

  const list = currentModule?.[source] || [];
  const listRef = useRef<any[]>(list);
  listRef.current = list;

  const patchBlock = (sIdx: number, block: any, updates: Record<string, any>) => {
    if (typeof updateBlockFields === 'function') {
      updateBlockFields(source, sIdx, updates, block);
      return;
    }
    setCurrentModule((prev: any) => {
      const nextList = [...(prev[source] || [])];
      const idx = block?.id != null ? nextList.findIndex((b: any) => b?.id === block.id) : sIdx;
      const resolved = idx >= 0 ? idx : sIdx;
      if (!nextList[resolved]) return prev;
      nextList[resolved] = { ...nextList[resolved], ...updates };
      return { ...prev, [source]: nextList };
    });
  };

  const getSlideLang = (block: any, sIdx: number): 'ar' | 'en' => {
    const key = block?.id ?? sIdx;
    return slideLanguages[key] || slideLanguages[sIdx] || detectSlideLanguage(block, language);
  };

  const handleAutoTranslateSlide = async (sIdx: number, forcedFromLang?: 'ar' | 'en', fromTabSwitch = false) => {
    const curList = listRef.current;
    const block = curList[sIdx];
    if (!block) return;

    const blockKey = block?.id ?? sIdx;
    if (translatingKeysRef.current.has(blockKey)) return;
    translatingKeysRef.current.add(blockKey);

    const fromLang = forcedFromLang || getSlideLang(block, sIdx);
    const snapshotObj = block;

    setTranslatingSlide((prev) => ({ ...prev, [blockKey]: true }));
    try {
      const result = await translateSingleSlideItem(block, fromLang);
      if (fromTabSwitch) {
        if (!result.hasTranslatableSource || !result.changed) return;
        const previewMerged = mergeSafeArabicSlidePatch(snapshotObj, snapshotObj, result.updated);
        if (JSON.stringify(previewMerged) === JSON.stringify(snapshotObj)) return;
        setCurrentModule((prev: any) => {
          const nextList = [...(prev[source] || [])];
          const targetIndex = nextList.findIndex((item: any, idx: number) => (item?.id != null && block?.id != null ? item.id === block.id : idx === sIdx));
          if (targetIndex < 0) return prev;
          nextList[targetIndex] = mergeSafeArabicSlidePatch(nextList[targetIndex], snapshotObj, result.updated);
          return { ...prev, [source]: nextList };
        });
        showToast('تمت الترجمة إلى العربية بنجاح', 'success');
        return;
      }

      if (!result.hasTranslatableSource) {
        showToast(language === 'ar' ? 'لا يوجد نص للترجمة في هذه الشريحة' : 'No translatable text found in this slide', 'info');
        return;
      }

      const snapshotJson = JSON.stringify(block);
      setCurrentModule((prev: any) => {
        const nextList = [...(prev[source] || [])];
        const targetIndex = nextList.findIndex((item: any, idx: number) => (item?.id != null && block?.id != null ? item.id === block.id : idx === sIdx));
        if (targetIndex < 0 || JSON.stringify(nextList[targetIndex]) !== snapshotJson) return prev;
        nextList[targetIndex] = result.updated;
        return { ...prev, [source]: nextList };
      });

      setSlideLanguages((prev) => ({ ...prev, [blockKey]: result.targetLang }));
      if (result.changed) {
        showToast(result.targetLang === 'en' ? 'Translated to English successfully' : 'تمت الترجمة إلى العربية بنجاح', 'success');
      } else {
        showToast(language === 'ar' ? 'تعذرت ترجمة المحتوى حالياً؛ يرجى المحاولة مرة أخرى' : 'Translation returned unchanged text; please try again', 'error');
      }
    } catch (err: any) {
      console.error('Exam slide translation error:', err);
      if (!fromTabSwitch) {
        showToast(err?.message || (language === 'ar' ? 'فشلت الترجمة التلقائية' : 'Auto translation failed'), 'error');
      }
    } finally {
      translatingKeysRef.current.delete(blockKey);
      setTranslatingSlide((prev) => ({ ...prev, [blockKey]: false }));
    }
  };

  const setSlideLang = (sKey: string | number, nextLang: 'ar' | 'en') => {
    const curList = listRef.current;
    const idx = curList.findIndex((b: any, i: number) => (b?.id ?? i) === sKey || i === sKey);
    const prevLang = idx >= 0 ? getSlideLang(curList[idx], idx) : null;
    setSlideLanguages((prev) => ({ ...prev, [sKey]: nextLang }));
    if (prevLang === 'en' && nextLang === 'ar' && autoTranslateEnabled && idx >= 0 && slideNeedsTabAutoTranslate(curList[idx])) {
      void handleAutoTranslateSlide(idx, 'en', true);
    }
  };

  const headerLabel = source === 'slides'
    ? (language === 'ar' ? 'شرائح الشرح' : 'Lecture Slides')
    : source === 'assignments'
      ? (language === 'ar' ? 'الواجبات والتكليفات' : 'Lesson Assignments')
      : (language === 'ar' ? 'أسئلة الموديول' : 'Module Questions');

  const headerDesc = source === 'slides'
    ? (language === 'ar' ? 'إضافة نصوص منسقة وشرائح تفاعلية لشرح المحاضرة' : 'Add rich text and interactive slides for lecture explanation')
    : source === 'assignments'
      ? (language === 'ar' ? 'إضافة مهام تطبيقية وكتل واجبات للطلاب' : 'Add application tasks and homework blocks for students')
      : (language === 'ar' ? 'إضافة أسئلة تدريبية تفاعلية لاختبار فهم الطلاب' : 'Add interactive practice questions to test student understanding');

  return (
    <SlideKeyboardRegion language={language}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
            <Layout className="w-6 h-6 text-indigo-600" />
            {headerLabel}
          </h4>
          <p className="text-slate-400 text-sm font-bold mt-1">{headerDesc}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AutoTranslateToggle language={language} />
          <button
            type="button"
            onClick={() => addBlock(source, 'TEXT')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            {language === 'ar' ? '+ محتوى نصي' : '+ Text Content'}
          </button>
          <button
            type="button"
            onClick={() => addBlock(source, 'QUESTION')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all shadow-lg cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            {language === 'ar' ? '+ سؤال تفاعلي' : '+ Question Slide'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {list.map((block: any, sIdx: number) => {
          const blockKey = block?.id ?? sIdx;
          const slideLang = getSlideLang(block, sIdx);
          const isTranslating = Boolean(translatingSlide[blockKey]);
          const isBodyEn = isEnglishOnlyText(block.content || block.text);

          const resolvedTitle = slideLang === 'en'
            ? (block.titleEn !== undefined && block.titleEn !== null && block.titleEn !== ''
              ? block.titleEn
              : (block.title && isEnglishOnlyText(block.title) ? block.title : ''))
            : (block.titleEn
              ? (block.title || '')
              : (block.title && hasArabicLetters(block.title) && !isDefaultSlideTitle(block.title) ? block.title : ''));

          const resolvedContent = slideLang === 'en'
            ? (block.contentEn || block.textEn || (isBodyEn ? (block.content || block.text || '') : ''))
            : (block.contentEn ? (block.content || block.text || '') : (hasArabicLetters(block.content || block.text) ? (block.content || block.text || '') : ''));

          const handleTitleChange = (val: string) => {
            if (slideLang === 'en') {
              const updates: Record<string, any> = { titleEn: val };
              if (!getAutoTranslateEnabled() && (!block.title || (!hasArabicLetters(block.title) && block.title === (block.titleEn || '')))) {
                updates.title = val;
              }
              patchBlock(sIdx, block, updates);
            } else {
              updateBlock(source, sIdx, 'title', val, block);
            }
          };

          const handleContentChange = (val: string) => {
            if (slideLang === 'en') {
              const prevEn = String(block.contentEn || block.textEn || '');
              const curAr = String(block.content || block.text || '');
              const updates: Record<string, any> = { contentEn: val, textEn: val };
              if (curAr && hasArabicLetters(curAr)) {
                const synced = syncRichTextFormatting(prevEn, val, curAr);
                if (synced !== curAr) {
                  updates.content = synced;
                  updates.text = synced;
                }
              } else if (!getAutoTranslateEnabled() && (!curAr || (!hasArabicLetters(curAr) && curAr === prevEn))) {
                updates.content = val;
                updates.text = val;
              }
              patchBlock(sIdx, block, updates);
            } else {
              const prevAr = String(block.content || block.text || '');
              const updates: Record<string, any> = { content: val, text: val };
              if (block.contentEn) {
                const syncedEn = syncRichTextFormatting(prevAr, val, String(block.contentEn));
                if (syncedEn !== block.contentEn) {
                  updates.contentEn = syncedEn;
                  updates.textEn = syncedEn;
                }
              }
              patchBlock(sIdx, block, updates);
            }
          };

          const availableImages = extractImageUrls([
            block.content,
            block.contentEn,
            block.image,
            ...(Array.isArray(block.sections) ? block.sections.map((s: any) => `${s.content || ''} ${s.contentEn || ''}`) : [])
          ].filter(Boolean).join(' '));

          return (
            <div key={blockKey} data-slide-card={sIdx} tabIndex={-1}>
              <BilingualMetadataEditor value={block} language={language} onChange={patch => setCurrentModule((prev: any) => ({ ...prev, [source]: prev[source].map((item: any, index: number) => index === sIdx ? { ...item, ...patch } : item) }))} />

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
                      <span>{language === 'ar' ? '+ شريحة نصية' : '+ Text Slide'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertBlockAt(source, 0, 'QUESTION')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md hover:shadow-indigo-900/10 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? '+ شريحة سؤال' : '+ Question Slide'}</span>
                    </button>
                  </div>
                  <div className="relative w-6 h-6 bg-slate-100 border border-slate-200 text-slate-400 rounded-full flex items-center justify-center text-[10px] font-black group-hover/divider:hidden transition-all shadow-sm">
                    +
                  </div>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-2xl sm:rounded-[30px] overflow-hidden group shadow-sm transition-all hover:shadow-md">
                <div className={`p-3 sm:p-4 flex flex-col md:flex-row gap-3 sm:gap-4 justify-between items-start md:items-center border-b ${block.type === 'QUESTION' ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-slate-100'}`}>
                  <div className="flex items-center gap-2 sm:gap-4 w-full min-w-0 md:w-auto">
                    <span className={`w-10 h-10 min-w-10 shrink-0 whitespace-nowrap tabular-nums rounded-xl flex items-center justify-center font-black text-white shadow-md ${block.type === 'QUESTION' ? 'bg-indigo-600' : 'bg-slate-800'}`}>
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
                              <option value="CONTENT">{language === 'ar' ? 'محتوى الشرح' : 'Content (Lecture)'}</option>
                              <option value="EXAMPLE">{language === 'ar' ? 'مثال محلول' : 'Worked Example'}</option>
                              <option value="SUMMARY">{language === 'ar' ? 'ملخص رئيسي' : 'Key Summary'}</option>
                              <option value="HINT">{language === 'ar' ? 'ملاحظة ومساعد' : 'Note / Helper'}</option>
                              <option value="EXPLANATION">{language === 'ar' ? 'شرح وتوضيح' : 'Explanation'}</option>
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
                            ? (slideLang === 'en' ? 'Section Title (English)' : 'عنوان القسم (اختياري)')
                            : (slideLang === 'en' ? 'Question Title (English)' : 'عنوان السؤال (اختياري)')}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full md:w-auto self-end md:self-auto">
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
                        <Plus className="w-4 h-4" /> {language === 'ar' ? 'إضافة كتلة' : 'Add Block'}
                      </button>
                      <div className={`absolute left-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-xl p-2 z-50 ${openDropdownId === `${source}-slide-${sIdx}` ? "block" : "hidden"}`}>
                        {['FEEDBACK', 'HINT', 'EXPLANATION', 'TIP', 'WARNING', 'KEY_INSIGHT'].map(secType => (
                          <button
                            key={secType}
                            type="button"
                            onClick={() => {
                              addSection(source, sIdx, secType);
                              setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors flex items-center gap-2"
                          >
                            {React.createElement(SECTION_STYLE_PRESETS[secType]?.icon || FileText, { className: "w-4 h-4" })}
                            <span>{(language === 'ar' ? SECTION_STYLE_PRESETS[secType]?.labelAr : SECTION_STYLE_PRESETS[secType]?.labelEn) || SECTION_STYLE_PRESETS[secType]?.label || secType}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBlock(source, sIdx)}
                      className="text-red-500 hover:text-red-600 p-2 hover:bg-red-500/10 rounded-xl transition-all bg-white cursor-pointer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Slide Language Switcher & Manual/Auto Translation Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center gap-2">
                      <Languages className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-black text-slate-700">
                        {slideLang === 'en' ? 'Slide Language / لغة الشريحة:' : 'لغة الشريحة / Slide Language:'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setSlideLang(blockKey, 'en')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer ${slideLang === 'en' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}
                        >
                          <Globe className="w-3.5 h-3.5" />
                          English (EN)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSlideLang(blockKey, 'ar')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer ${slideLang === 'ar' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}
                        >
                          <Globe className="w-3.5 h-3.5" />
                          العربية (Arabic)
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={isTranslating}
                        onClick={() => void handleAutoTranslateSlide(sIdx)}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl font-black flex items-center gap-1.5 text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        {isTranslating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" /> : <Sparkles className="w-3.5 h-3.5 text-amber-600" />}
                        <span>
                          {isTranslating
                            ? (language === 'ar' ? 'جارٍ الترجمة...' : 'Translating...')
                            : (slideLang === 'en' ? 'Translate to Arabic' : 'ترجمة للإنجليزية')}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">{language === 'ar' ? "رابط فيديو اختياري (يوتيوب/فيميو) لهذا القسم" : "Optional Video Link (YouTube/Vimeo) for this section"}</label>
                    <input
                      type="url"
                      value={block.videoUrl || ""}
                      onChange={(e) => updateBlock(source, sIdx, 'videoUrl', e.target.value, block)}
                      placeholder={language === 'ar' ? "الصق رابط الفيديو هنا..." : "Paste video URL here..."}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 font-bold"
                    />
                  </div>
                  <div>
                    <RichTextEditor
                      key={`exam-slide-${blockKey}-${slideLang}`}
                      value={resolvedContent}
                      onChange={handleContentChange}
                      availableImages={availableImages}
                      dir={slideLang === 'ar' ? 'rtl' : 'ltr'}
                      placeholder={block.type === 'TEXT'
                        ? (slideLang === 'en' ? 'Write lecture explanation content in English...' : 'اكتب محتوى شرح الدرس بالعربية هنا...')
                        : (slideLang === 'en' ? 'Write question prompt in English...' : 'اكتب نص السؤال بالعربية هنا...')}
                      className="!bg-white !border-slate-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-7 gap-4 p-6 bg-white border border-slate-200 rounded-[30px] shadow-sm">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'المعيار' : 'Standard'}</label>
                      <select
                        className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                        value={block.standard || ""}
                        onChange={(e) => updateBlock(source, sIdx, 'standard', e.target.value, block)}
                      >
                        <option value="">{language === 'ar' ? 'اختر المعيار...' : 'Select Standard...'}</option>
                        {(currentModule.standards || "").split("\n").filter(Boolean).map((s: string) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'المؤشر' : 'Indicator'}</label>
                      <select
                        className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                        value={block.indicator || ""}
                        onChange={(e) => updateBlock(source, sIdx, 'indicator', e.target.value, block)}
                      >
                        <option value="">{language === 'ar' ? 'اختر المؤشر...' : 'Select Indicator...'}</option>
                        {(currentModule.indicators || "").split("\n").filter(Boolean).map((ind: string) => (
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'مخرج التعلم' : 'Learning Outcome'}</label>
                      <select
                        className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                        value={block.learningOutcome || ""}
                        onChange={(e) => updateBlock(source, sIdx, 'learningOutcome', e.target.value, block)}
                      >
                        <option value="">{language === 'ar' ? 'اختر مخرج التعلم...' : 'Select Learning Outcome...'}</option>
                        {(currentModule.learningOutcomes || "").split("\n").filter(Boolean).map((lo: string) => (
                          <option key={lo} value={lo}>{lo}</option>
                        ))}
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
                              setCustomSkills?.((prev: string[]) => Array.from(new Set([...prev, trimmed])));
                              updateBlock(source, sIdx, 'skill', trimmed, block);
                            }
                          } else {
                            updateBlock(source, sIdx, 'skill', val, block);
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

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'مستوى الصعوبة' : 'Difficulty'}</label>
                      <select
                        className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                        value={block.level || "Medium"}
                        onChange={(e) => updateBlock(source, sIdx, 'level', e.target.value, block)}
                      >
                        <option value="Foundation">{language === 'ar' ? 'تأسيسي' : 'Foundation'}</option>
                        <option value="On_Level">On_Level</option>
                        <option value="Advanced">{language === 'ar' ? 'متقدم' : 'Advanced'}</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'عمق المعرفة (DOK)' : 'Depth of Knowledge (DOK)'}</label>
                      <select
                        className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                        value={block.dok || ""}
                        onChange={(e) => updateBlock(source, sIdx, 'dok', e.target.value, block)}
                      >
                        <option value="">{language === 'ar' ? 'بلا تحديد' : 'None'}</option>
                        <option value="DOK 1">DOK 1</option>
                        <option value="DOK 2">DOK 2</option>
                        <option value="DOK 3">DOK 3</option>
                        <option value="DOK 4">DOK 4</option>
                      </select>
                    </div>

                    {block.type === 'QUESTION' && (
                      <>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'النقاط' : 'Points'}</label>
                          <input
                            type="number"
                            className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                            value={block.points !== undefined ? block.points : 1}
                            onChange={(e) => updateBlock(source, sIdx, 'points', parseInt(e.target.value) || 0, block)}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'نقاط XP' : 'XP Points'}</label>
                          <input
                            type="number"
                            className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                            value={block.xpPoints !== undefined ? block.xpPoints : 10}
                            onChange={(e) => updateBlock(source, sIdx, 'xpPoints', parseInt(e.target.value) || 0, block)}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {block.type === 'QUESTION' && (
                    <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 space-y-4">
                      {['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(block.label || 'MCQ') ? (
                        <>
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">
                            {slideLang === 'en' ? 'Answer Options (English)' : 'خيارات الإجابة (العربية)'}
                          </label>
                          {block.label === 'TRUE_FALSE' ? (
                            <div className="grid grid-cols-2 gap-4">
                              {(slideLang === 'en' ? ['True', 'False'] : ['صحيح', 'خطأ']).map((opt) => {
                                const isSel = normalizeAnswerGlobal(slideLang === 'en' ? (block.correctAnswerEn || block.correctAnswer) : block.correctAnswer) === normalizeAnswerGlobal(opt);
                                return (
                                  <div
                                    key={opt}
                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${isSel ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-transparent'}`}
                                    onClick={() => patchBlock(sIdx, block, {
                                      correctAnswer: normalizeAnswerGlobal(opt) === 'true' ? 'صحيح' : 'خطأ',
                                      correctAnswerEn: normalizeAnswerGlobal(opt) === 'true' ? 'True' : 'False',
                                    })}
                                  >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSel ? 'bg-emerald-500 border-emerald-200' : 'bg-slate-200 border-transparent'}`}>
                                      {isSel && <CheckCircle2 className="w-4 h-4 text-white" />}
                                    </div>
                                    <span className={`font-black text-sm ${isSel ? 'text-emerald-700' : 'text-slate-500'}`}>{opt}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (() => {
                            const displayOpts = slideLang === 'en'
                              ? ((block.optionsEn && block.optionsEn.length > 0) ? block.optionsEn : (block.options || []))
                              : (block.options || []);
                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {displayOpts.map((opt: any, oIdx: number) => {
                                  const isMulti = block.label === 'MULTI_SELECT';
                                  const isSelected = isMulti
                                    ? (slideLang === 'en'
                                      ? ((block.correctAnswersEn || []).includes(opt) || (block.correctAnswers || []).includes(block.options?.[oIdx]))
                                      : (block.correctAnswers || []).includes(opt))
                                    : (slideLang === 'en'
                                      ? (block.correctAnswerEn === opt || (!block.correctAnswerEn && block.correctAnswer === opt))
                                      : block.correctAnswer === opt);
                                  return (
                                    <div key={oIdx} className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${isSelected ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-transparent'}`}>
                                      <div
                                        className="mt-1 flex-shrink-0 cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const arVal = block.options?.[oIdx] ?? opt;
                                          const enVal = block.optionsEn?.[oIdx] ?? opt;
                                          if (isMulti) {
                                            const curAr = Array.isArray(block.correctAnswers) ? block.correctAnswers : [];
                                            const curEn = Array.isArray(block.correctAnswersEn) ? block.correctAnswersEn : [];
                                            const nextAr = curAr.includes(arVal) ? curAr.filter((a: string) => a !== arVal) : [...curAr, arVal];
                                            const nextEn = curEn.includes(enVal) ? curEn.filter((a: string) => a !== enVal) : [...curEn, enVal];
                                            patchBlock(sIdx, block, { correctAnswers: nextAr, correctAnswersEn: nextEn });
                                          } else {
                                            patchBlock(sIdx, block, { correctAnswer: arVal, correctAnswerEn: enVal });
                                          }
                                        }}
                                      >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                        </div>
                                      </div>
                                      <div className="flex-1 flex gap-3 items-start min-w-0">
                                        <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-[11px] text-indigo-600 shrink-0 select-none">
                                          {getOptionLetter(oIdx, slideLang)}
                                        </span>
                                        <MathInput
                                          value={opt}
                                          onChange={(val: any) => {
                                            if (slideLang === 'en') {
                                              const newOptsEn = [...(block.optionsEn && block.optionsEn.length > 0 ? block.optionsEn : displayOpts)];
                                              const oldEn = newOptsEn[oIdx];
                                              newOptsEn[oIdx] = val;
                                              const updates: Record<string, any> = { optionsEn: newOptsEn };
                                              if (block.correctAnswerEn === oldEn) updates.correctAnswerEn = val;
                                              if (!getAutoTranslateEnabled()) {
                                                const newOpts = [...(block.options || [])];
                                                if (!newOpts[oIdx] || (!hasArabicLetters(newOpts[oIdx]) && newOpts[oIdx] === oldEn)) {
                                                  newOpts[oIdx] = val;
                                                  updates.options = newOpts;
                                                }
                                              }
                                              patchBlock(sIdx, block, updates);
                                            } else {
                                              const newOpts = [...(block.options || [])];
                                              const oldVal = newOpts[oIdx];
                                              newOpts[oIdx] = val;
                                              const updates: Record<string, any> = { options: newOpts };
                                              if (block.correctAnswer === oldVal) updates.correctAnswer = val;
                                              patchBlock(sIdx, block, updates);
                                            }
                                          }}
                                          placeholder={slideLang === 'en' ? `Option ${oIdx + 1} (no A, B, C)` : `الخيار ${oIdx + 1} (بدون أ، ب، ج)`}
                                          className="bg-transparent flex-1"
                                        />
                                        {displayOpts.length > 2 && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newOpts = [...(block.options || [])];
                                              newOpts.splice(oIdx, 1);
                                              const updates: Record<string, any> = { options: newOpts };
                                              if (block.optionsEn?.length) {
                                                const newEn = [...block.optionsEn];
                                                newEn.splice(oIdx, 1);
                                                updates.optionsEn = newEn;
                                              }
                                              patchBlock(sIdx, block, updates);
                                            }}
                                            className="text-red-400 hover:text-red-600"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updates: Record<string, any> = { options: [...(block.options || []), ""] };
                                    if (block.optionsEn?.length) updates.optionsEn = [...block.optionsEn, ""];
                                    patchBlock(sIdx, block, updates);
                                  }}
                                  className="flex justify-center items-center p-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-bold hover:bg-slate-200 hover:border-slate-400 transition-all cursor-pointer"
                                >
                                  <Plus className="w-5 h-5 ml-1" /> {slideLang === 'en' ? 'Add Option' : 'إضافة خيار'}
                                </button>
                              </div>
                            );
                          })()}
                        </>
                      ) : (
                        <InteractiveQuestionEditor
                          question={{
                            ...block,
                            options: slideLang === 'en' && block.optionsEn && block.optionsEn.length > 0 ? block.optionsEn : block.options,
                            type: block.label || 'MCQ'
                          }}
                          onChange={(updatedQ: any) => {
                            if (slideLang === 'en') {
                              const arOptsStr = typeof block.options === 'string' ? block.options : JSON.stringify(block.options || '');
                              const keepAr = hasArabicLetters(arOptsStr) || getAutoTranslateEnabled();
                              patchBlock(sIdx, block, {
                                optionsEn: updatedQ.options,
                                correctAnswerEn: updatedQ.correctAnswer,
                                ...(!keepAr ? { options: updatedQ.options, correctAnswer: updatedQ.correctAnswer } : {}),
                              });
                            } else {
                              patchBlock(sIdx, block, {
                                options: updatedQ.options,
                                correctAnswer: updatedQ.correctAnswer,
                                ...(updatedQ.type === 'MULTI_SELECT' ? (() => {
                                  try { return { correctAnswers: JSON.parse(updatedQ.correctAnswer) }; } catch { return {}; }
                                })() : {}),
                              });
                            }
                          }}
                          language={slideLang}
                        />
                      )}
                    </div>
                  )}

                  {(block.sections || []).length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        {slideLang === 'en' ? 'Dynamic Content Blocks (English)' : 'كتل المحتوى الديناميكية'}
                      </label>
                      {(block.sections || []).map((sec: any, secIdx: number) => {
                        const preset = SECTION_STYLE_PRESETS[sec.type] || SECTION_STYLE_PRESETS.EXPLANATION || {};
                        const SectionIcon = preset.icon || FileText;
                        const secContent = slideLang === 'en'
                          ? (sec.contentEn || (sec.content && isEnglishOnlyText(sec.content) ? sec.content : ''))
                          : (sec.content || '');
                        return (
                          <div key={sec.id || secIdx} className={`p-4 rounded-2xl relative group/section border ${preset.container || ''}`}>
                            <div className="flex justify-between items-center mb-3">
                              <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 ${preset.badge || ''}`}>
                                <SectionIcon className="w-3.5 h-3.5" />
                                {(language === 'ar' ? preset.labelAr : preset.labelEn) || preset.label || sec.type}
                                {slideLang === 'en' && <span className="text-[9px] bg-white/40 px-1.5 py-0.5 rounded ml-1 font-bold">EN</span>}
                              </span>
                              <button type="button" onClick={() => removeSection(source, sIdx, secIdx)} className="text-red-400 hover:text-red-600 opacity-0 group-hover/section:opacity-100 transition-all cursor-pointer">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <RichTextEditor
                              key={`exam-sec-${blockKey}-${sec.id || secIdx}-${slideLang}`}
                              value={secContent}
                              onChange={(val: any) => updateSection(source, sIdx, secIdx, val, block, sec, slideLang === 'en' ? 'contentEn' : 'content')}
                              availableImages={availableImages}
                              dir={slideLang === 'ar' ? 'rtl' : 'ltr'}
                              placeholder={slideLang === 'en' ? `${sec.type} content (English)...` : `محتوى الـ ${preset.labelAr || sec.type}...`}
                              className="!bg-white"
                            />
                          </div>
                        );
                      })}
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
                    <span>{language === 'ar' ? '+ شريحة نصية' : '+ Text Slide'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertBlockAt(source, sIdx + 1, 'QUESTION')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md hover:shadow-indigo-900/10 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? '+ شريحة سؤال' : '+ Question Slide'}</span>
                  </button>
                </div>
                <div className="relative w-6 h-6 bg-slate-100 border border-slate-200 text-slate-400 rounded-full flex items-center justify-center text-[10px] font-black group-hover/divider:hidden transition-all shadow-sm">
                  +
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SlideKeyboardRegion>
  );
};

export default ExamSlidesBuilder;
