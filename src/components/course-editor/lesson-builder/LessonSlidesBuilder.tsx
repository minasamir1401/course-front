"use client";

import React, { useState } from "react";
import { 
  Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2, 
  HelpCircle, Upload, Download, Edit2, Play, Video, BookOpen, Lightbulb, TriangleAlert, Layout, FileText
} from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import MathInput from "@/components/MathInput";
import InteractiveQuestionEditor from "@/components/InteractiveQuestionEditor";
import { getOptionLetter } from "@/lib/utils";
import { useLessonBlocks } from "./useLessonBlocks";
import { getSectionStylePresets } from "./constants";

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
  const [activeSlide, setActiveSlide] = useState<number | null>(null);
  const [slideTab, setSlideTab] = useState<'CONTENT' | 'EXPLANATION' | 'SECTIONS'>('CONTENT');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

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
  } = useLessonBlocks(currentLesson, setCurrentLesson);

  const handleAddSlide = (type: 'TEXT' | 'QUESTION') => addBlock(source, type);
  const handleInsertSlideAt = (index: number, type: 'TEXT' | 'QUESTION') => insertBlockAt(source, index, type);
  const handleMoveSlide = (index: number, direction: 'UP' | 'DOWN') => moveBlock(source, index, direction);
  const handleUpdateSlide = (index: number, field: string, value: any) => updateBlock(source, index, field, value);
  const handleUpdateSlideType = (index: number, newType: string) => updateBlockTypeAndReset(source, index, newType);
  const handleRemoveSlide = (index: number) => removeBlock(source, index);
  const handleAddSlideSection = (slideIndex: number, type: string) => addSection(source, slideIndex, type);
  const handleUpdateSlideSection = (slideIndex: number, sectionIndex: number, content: string) => updateSection(source, slideIndex, sectionIndex, content);
  const handleRemoveSlideSection = (slideIndex: number, sectionIndex: number) => removeSection(source, slideIndex, sectionIndex);

    const list = currentLesson[source] || [];
    
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
          {list.map((block: any, sIdx: number) => (
            <React.Fragment key={block.id || sIdx}>
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

              <div className="bg-slate-50 border border-slate-200 rounded-[30px] overflow-hidden group shadow-sm transition-all hover:shadow-md">
                <div className={`p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center border-b ${block.type === 'QUESTION' ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-slate-100'}`}>
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-md ${block.type === 'QUESTION' ? 'bg-indigo-600' : 'bg-slate-888 bg-slate-800'}`}>
                      {sIdx + 1}
                    </span>
                    <div className="flex flex-col gap-1 w-full md:w-auto">
                      <div className="flex gap-2">
                        <select
                          value={block.label}
                          onChange={(e) => updateBlockTypeAndReset(source, sIdx, e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-600 outline-none focus:border-indigo-600 px-2 py-1 uppercase"
                        >
                          {block.type === 'TEXT' ? (
                            <>
                              <option value="CONTENT">محتوى (Content)</option>
                              <option value="EXAMPLE">مثال (Example)</option>
                              <option value="SUMMARY">ملخص (Summary)</option>
                              <option value="HINT">ملاحظة (Note)</option>
                              <option value="EXPLANATION">شرح (Explanation)</option>
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
                          value={block.title || ""}
                          onChange={(e) => updateBlock(source, sIdx, 'title', e.target.value)}
                          className="bg-transparent text-slate-900 font-black outline-none border-b border-transparent focus:border-indigo-600 px-2 py-1 w-full md:w-48 placeholder:text-slate-400"
                          placeholder={block.type === 'TEXT' 
                            ? (language === 'ar' ? "عنوان الوحدة (اختياري)" : "Unit Title (Optional)") 
                            : (language === 'ar' ? "عنوان السؤال (اختياري)" : "Question Title (Optional)")}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end md:self-auto">
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
                  <div>
                    <RichTextEditor 
                      value={block.content}
                      onChange={(val) => updateBlock(source, sIdx, 'content', val)}
                      placeholder={block.type === 'TEXT' 
                        ? (language === 'ar' ? "اكتب محتوى الشرح هنا..." : "Write explanation content here...") 
                        : (language === 'ar' ? "اكتب نص السؤال هنا..." : "Write question text here...")}
                      className="!bg-white !border-slate-200"
                    />
                  </div>

                  {block.type === 'QUESTION' && (
                    <div className="grid grid-cols-2 md:grid-cols-7 gap-4 p-6 bg-white border border-slate-200 rounded-[30px] shadow-sm mb-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'المعيار' : 'Standard'}</label>
                        <select 
                          className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                          value={block.standard || ""}
                          onChange={(e) => updateBlock(source, sIdx, 'standard', e.target.value)}
                        >
                          <option value="">{language === 'ar' ? 'اختر المعيار...' : 'Select Standard...'}</option>
                          {(currentLesson.standards || "").split("\n").filter(Boolean).map((s: string) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'المؤشر' : 'Indicator'}</label>
                        <select 
                          className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                          value={block.indicator || ""}
                          onChange={(e) => updateBlock(source, sIdx, 'indicator', e.target.value)}
                        >
                          <option value="">{language === 'ar' ? 'اختر المؤشر...' : 'Select Indicator...'}</option>
                          {(currentLesson.indicators || "").split("\n").filter(Boolean).map((ind: string) => (
                            <option key={ind} value={ind}>{ind}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'مخرج التعلم' : 'Learning Outcome'}</label>
                        <select 
                          className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                          value={block.learningOutcome || ""}
                          onChange={(e) => updateBlock(source, sIdx, 'learningOutcome', e.target.value)}
                        >
                          <option value="">{language === 'ar' ? 'اختر مخرج التعلم...' : 'Select Learning Outcome...'}</option>
                          {(currentLesson.learningOutcomes || "").split("\n").filter(Boolean).map((lo: string) => (
                            <option key={lo} value={lo}>{lo}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'المهارة' : 'Skill'}</label>
                        <select 
                          className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                          value={block.skill || "General"}
                          onChange={(e) => updateBlock(source, sIdx, 'skill', e.target.value)}
                        >
                          <option value="General">{language === 'ar' ? 'عام' : 'General'}</option>
                          {["Math", "Physics", "Chemistry", "Biology", "Geology", "History", "Geography", "Philosophy", "Arabic", "English", "French"].map(sk => (
                            <option key={sk} value={sk}>{sk}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'مستوى الصعوبة' : 'Difficulty'}</label>
                        <select 
                          className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                          value={block.level || "Medium"}
                          onChange={(e) => updateBlock(source, sIdx, 'level', e.target.value)}
                        >
                          <option value="Easy">{language === 'ar' ? 'سهل' : 'Easy'}</option>
                          <option value="Medium">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
                          <option value="Hard">{language === 'ar' ? 'صعب' : 'Hard'}</option>
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
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? '⭐ نقاط XP' : '⭐ XP Points'}</label>
                        <input 
                          type="number"
                          className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                          value={block.xpPoints !== undefined ? block.xpPoints : 10}
                          onChange={(e) => updateBlock(source, sIdx, 'xpPoints', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  )}

                  {block.type === 'QUESTION' && (
                    <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 space-y-4">
                      {['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(block.label || 'MCQ') ? (
                        <>
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">{language === 'ar' ? "خيارات الإجابة والإجابة الصحيحة" : "Answer Options & Correct Answer"}</label>
                          {block.label === 'TRUE_FALSE' ? (
                            <div className="grid grid-cols-2 gap-4">
                              {['صحيح', 'خطأ'].map((opt) => (
                                <div key={opt} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${block.correctAnswer === opt ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-transparent'}`} onClick={() => updateBlock(source, sIdx, 'correctAnswer', opt)}>
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${block.correctAnswer === opt ? 'bg-emerald-500 border-emerald-200' : 'bg-slate-200 border-transparent'}`}>
                                    {block.correctAnswer === opt && <CheckCircle2 className="w-4 h-4 text-white" />}
                                  </div>
                                  <span className="font-bold text-slate-700">{opt === 'صحيح' ? (language === 'ar' ? 'صحيح' : 'True') : (language === 'ar' ? 'خطأ' : 'False')}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {(block.options || []).map((opt: string, oIdx: number) => {
                                const isSelected = block.label === 'MULTI_SELECT' 
                                  ? (block.correctAnswers || []).includes(opt) 
                                  : block.correctAnswer === opt;
                                
                                return (
                                  <div key={oIdx} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${isSelected && opt ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-transparent'}`}>
                                    <div 
                                      onClick={() => {
                                        if (block.label === 'MULTI_SELECT') {
                                          const answers = block.correctAnswers || [];
                                          if (answers.includes(opt) && opt) updateBlock(source, sIdx, 'correctAnswers', answers.filter((a:string) => a !== opt));
                                          else if (opt) updateBlock(source, sIdx, 'correctAnswers', [...answers, opt]);
                                        } else {
                                          updateBlock(source, sIdx, 'correctAnswer', opt);
                                        }
                                      }}
                                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer ${isSelected && opt ? 'bg-emerald-500 border-emerald-200' : 'bg-slate-200 border-transparent'}`}
                                    >
                                      {isSelected && opt && <CheckCircle2 className="w-4 h-4 text-white" />}
                                    </div>
                                    <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-[11px] text-indigo-600 shrink-0 select-none">
                                      {getOptionLetter(oIdx, language)}
                                    </span>
                                    <MathInput 
                                      value={opt}
                                      onChange={(val) => {
                                        const newOpts = [...(block.options || [])];
                                        const oldVal = newOpts[oIdx];
                                        const newVal = val;
                                        newOpts[oIdx] = newVal;
                                        
                                        const newBlock = { ...block, options: newOpts };
                                        if (block.label === 'MULTI_SELECT' && (block.correctAnswers || []).includes(oldVal)) {
                                          newBlock.correctAnswers = (block.correctAnswers || []).map((a: string) => a === oldVal ? newVal : a);
                                        } else if (block.correctAnswer === oldVal) {
                                          newBlock.correctAnswer = newVal;
                                        }
                                        
                                        const newSlides = [...(currentLesson[source] || [])];
                                        newSlides[sIdx] = newBlock;
                                        setCurrentLesson({ ...currentLesson, [source]: newSlides });
                                      }}
                                      placeholder={language === 'ar' ? `الخيار ${oIdx + 1}` : `Option ${oIdx + 1}`}
                                      className="bg-transparent flex-1"
                                    />
                                    {block.options.length > 2 && (
                                      <button type="button" onClick={() => {
                                        const newOpts = [...block.options];
                                        newOpts.splice(oIdx, 1);
                                        updateBlock(source, sIdx, 'options', newOpts);
                                      }} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                    )}
                                  </div>
                                );
                              })}
                              <button 
                                type="button"
                                onClick={() => updateBlock(source, sIdx, 'options', [...(block.options||[]), ""])}
                                className="flex justify-center items-center p-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-bold hover:bg-slate-200 hover:border-slate-400 transition-all cursor-pointer"
                              >
                                <Plus className="w-5 h-5 ml-1" /> {language === 'ar' ? 'إضافة خيار' : 'Add Option'}
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <InteractiveQuestionEditor
                          question={{
                            ...block,
                            type: block.label || 'MCQ'
                          }}
                          onChange={(updatedQ) => {
                            setCurrentLesson((prev: any) => {
                              const newSlides = [...(prev[source] || [])];
                              newSlides[sIdx] = {
                                ...newSlides[sIdx],
                                options: updatedQ.options,
                                correctAnswer: updatedQ.correctAnswer,
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
                          language={language}
                        />
                      )}
                    </div>
                  )}

                  {(block.sections || []).length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">أقسام إضافية ديناميكية (Dynamic Sections)</label>
                      {(block.sections || []).map((sec: any, secIdx: number) => {
                        const preset = SECTION_STYLE_PRESETS[sec.type] || SECTION_STYLE_PRESETS.EXPLANATION;
                        const SectionIcon = preset.icon;
                        return (
                          <div key={sec.id || secIdx} className={`p-4 rounded-2xl relative group/section border ${preset.container}`}>
                            <div className="flex justify-between items-center mb-3">
                              <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 ${preset.badge}`}>
                                <SectionIcon className="w-3.5 h-3.5" />
                                {preset.label}
                              </span>
                              <button type="button" onClick={() => removeSection(source, sIdx, secIdx)} className="text-red-400 hover:text-red-600 opacity-0 group-hover/section:opacity-100 transition-all cursor-pointer">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <RichTextEditor 
                              value={sec.content}
                              onChange={(val) => updateSection(source, sIdx, secIdx, val)}
                              placeholder={language === 'ar' ? `محتوى الـ ${sec.type}...` : `${sec.type} content...`}
                              className="!bg-white"
                            />
                          </div>
                        )
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
          ))}
        </div>
      </div>
    );
};
