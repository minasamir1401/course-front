"use client";
import BilingualMetadataEditor from '@/components/BilingualMetadataEditor';
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import { Save, Layers, Settings, CheckCircle2, Sparkles, Play, Clock, Globe, Languages, Loader2 } from 'lucide-react';
import InteractiveQuestionEditor from "@/components/InteractiveQuestionEditor";
import RichTextEditor from "@/components/RichTextEditor";
import QuestionImageGallery from "@/components/QuestionImageGallery";
import { extractImageUrls } from "@/lib/image-utils";
export default function ActivityEditorModal(props: any) {
 const { t, language, showToast, lessons, expandedLessonId, activitiesData, isActivityModalOpen, setIsActivityModalOpen, editingActivity, setEditingActivity, handleSaveActivity, mounted, activityActiveLang, setActivityActiveLang, isTranslatingActivity, handleAutoTranslateActivity, saveLessonMetadata, getLessonMetadata } = props;
 const updateMetadata = (field: string, value: string) => {
   const lesson = lessons.find((item: any) => item.id === editingActivity.lessonId);
   const pair = getLessonMetadata(lesson).translations?.[value];
   setEditingActivity((prev: any) => ({ ...prev, [field]: value, [field + 'En']: pair?.en || '' }));
 };
 return <>{mounted && isActivityModalOpen && editingActivity && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 bg-slate-900/60 backdrop-blur-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="bg-white rounded-[24px] w-full max-w-5xl max-h-full flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/30 shrink-0">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                {editingActivity.id ? (language === 'ar' ? 'تعديل النشاط التفاعلي' : 'Edit Interactive Activity') : (language === 'ar' ? 'إنشاء نشاط تفاعلي' : 'Create Interactive Activity')}
              </h3>
              <button onClick={() => setIsActivityModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">
                &times;
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 bg-slate-50/20">

              {/* Bilingual Switcher Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-indigo-100 p-4 rounded-2xl shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900">
                      {language === 'ar' ? 'لغة تحرير السؤال والخيارات' : 'Question & Activity Content Language'}
                    </div>
                    <div className="text-xs font-bold text-slate-400">
                      {language === 'ar' ? 'يمكنك التبديل بين اللغتين لكتابة السؤال، الخيارات، والتوجيهات بالعربية والإنجليزية' : 'Switch between languages to author question, options, and guidance in Arabic and English'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setActivityActiveLang('en')}
                      className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${
                        activityActiveLang === 'en'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <span>English (EN)</span>
                      {editingActivity.titleEn && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivityActiveLang('ar')}
                      className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${
                        activityActiveLang === 'ar'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <span>العربية (AR)</span>
                      {editingActivity.title && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isTranslatingActivity}
                    onClick={handleAutoTranslateActivity}
                    className="px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {isTranslatingActivity ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Languages className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isTranslatingActivity
                        ? (language === 'ar' ? 'جارٍ الترجمة...' : 'Translating...')
                        : (activityActiveLang === 'ar'
                            ? (language === 'ar' ? 'ترجمة فورية للإنجليزية' : 'Translate to English')
                            : (language === 'ar' ? 'ترجمة فورية للعربية' : 'Translate to Arabic'))}
                    </span>
                  </button>
                </div>
              </div>
              
              {/* Top Settings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {activityActiveLang === 'ar'
                        ? (language === 'ar' ? 'عنوان السؤال (بالعربية)' : 'Question Title (Arabic)')
                        : 'Question Title (English)'}
                      {activityActiveLang === 'ar' && <span className="text-red-500"> *</span>}
                    </label>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 uppercase">
                      {activityActiveLang === 'ar' ? 'العربية' : 'English'}
                    </span>
                  </div>
                  {activityActiveLang === 'ar' ? (
                    <input 
                      type="text" 
                      value={(editingActivity.title ) ? editingActivity.title : ''} 
                      onChange={(e) => setEditingActivity({...editingActivity, title: e.target.value})}
                      placeholder={language === 'ar' ? "مثال: سؤال جمع، توصيل..." : "e.g. Addition Question..."}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none"
                    />
                  ) : (
                    <input 
                      type="text" 
                      value={editingActivity.titleEn !== undefined && editingActivity.titleEn !== null && editingActivity.titleEn !== '' ? editingActivity.titleEn : (editingActivity.title && !/[\u0600-\u06FF]/.test(editingActivity.title) ? editingActivity.title : '')} 
                      onChange={(e) => {
                        const val = e.target.value;
                        const syncBase = !editingActivity.title || (!/[\u0600-\u06FF]/.test(editingActivity.title) && editingActivity.title === (editingActivity.titleEn || ''));
                        setEditingActivity({
                          ...editingActivity, 
                          titleEn: val,
                          ...(syncBase ? { title: val } : {})
                        });
                      }}
                      placeholder="e.g. Addition Question, Matching Shapes..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "نوع النشاط التفاعلي" : "Activity Type"} <span className="text-red-500">*</span></label>
                  <select 
                    value={editingActivity.type} 
                    onChange={(e) => {
                      const newType = e.target.value;
                      const type = newType;
                      const defaultData: any = {
                        'interactive_drag_drop': { left: [], right: [] } as any,
                        'interactive_fill_blanks': { sentence: '', blanks: [] } as any,
                        'interactive_classification': { groups: [], items: [] } as any,
                        'interactive_clock': { time: '12:00', minuteStep: 5 } as any,
                        'interactive_graph': { nodes: [], edges: [] } as any,
                        'interactive_video': { videoUrl: '', bookmarks: [] } as any,
                        'mcq': { questionText: '', choices: [{id:'1',text:'',isCorrect:true}] } as any,
                      }[type] || {};

                      setEditingActivity({
                        ...editingActivity, 
                        type: newType,
                        options: defaultData,
                        correctAnswer: JSON.stringify(defaultData)
                      });
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-700 focus:border-indigo-500 focus:bg-white outline-none"
                  >
                     <option value="MCQ">{language === 'ar' ? 'اختيار من متعدد (MCQ)' : 'Multiple Choice (MCQ)'}</option>
                     <option value="TRUE_FALSE">{language === 'ar' ? 'صح / خطأ (T/F)' : 'True / False (T/F)'}</option>
                     <option value="MULTI_SELECT">{language === 'ar' ? 'اختيار متعدد (تحديد)' : 'Multi-select (Checkboxes)'}</option>
                     <option value="MATCHING">{language === 'ar' ? 'سؤال التوصيل (Matching)' : 'Matching Elements'}</option>
                     <option value="DRAG_DROP_FILL">{language === 'ar' ? 'سحب الفراغات (Drag & Drop)' : 'Drag & Drop Fill'}</option>
                     <option value="GROUP_SORTING">{language === 'ar' ? 'تصنيف المجموعات' : 'Group Sorting'}</option>
                     <option value="NUMBER_LINE">{language === 'ar' ? 'خط الأعداد' : 'Number Line'}</option>
                     <option value="CLOCK">{language === 'ar' ? 'عقارب الساعة' : 'Interactive Clock'}</option>
                     <option value="MIND_MAP">{language === 'ar' ? 'خريطة مفاهيم' : 'Concept Mind Map'}</option>
                     <option value="VIDEO_CHECKPOINT">{language === 'ar' ? 'فيديو تفاعلي' : 'Interactive Video'}</option>
                     <option value="SWIPE_SORT">{language === 'ar' ? 'سحب سريع (Swipe)' : 'Swipe Sort'}</option>
                     <option value="MAZE">{language === 'ar' ? 'المتاهة (Maze)' : 'Educational Maze'}</option>
                     <option value="WORD_SEARCH">{language === 'ar' ? 'البحث عن الكلمات' : 'Word Search'}</option>
                     <option value="GEOGEBRA">{language === 'ar' ? 'جيوجيبرا (GeoGebra)' : 'GeoGebra Widget'}</option>
                     <option value="FLASH_CARD">{language === 'ar' ? 'بطاقات (Flash Cards)' : 'Flash Cards'}</option>
                     <option value="MEMORY_GAME">{language === 'ar' ? 'لعبة الذاكرة' : 'Memory Game'}</option>
                     <option value="WORD_SCRAMBLE">{language === 'ar' ? 'ترتيب الحروف' : 'Word Scramble'}</option>
                     <option value="SENTENCE_REORDER">{language === 'ar' ? 'ترتيب الجملة' : 'Sentence Reorder'}</option>
                     <option value="MATH_EQUATION">{language === 'ar' ? 'معادلة رياضية' : 'Math Equation'}</option>
                     <option value="SEQUENCE_ORDER">{language === 'ar' ? 'ترتيب التسلسل' : 'Sequence Order'}</option>
                     <option value="COUNT_OBJECTS">{language === 'ar' ? 'عد العناصر' : 'Count Objects'}</option>
                     <option value="IMAGE_LABEL">{language === 'ar' ? 'تسمية الصورة' : 'Image Labeling'}</option>
                     <option value="COLOR_MATCH">{language === 'ar' ? 'تطابق الألوان' : 'Color Match'}</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "المهارة" : "Skill"}</label>
                   <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow pr-10 appearance-none"
                      value={editingActivity?.skill || ''}
                      onChange={(e) => updateMetadata("skill", e.target.value)}
                   />
                </div>

                {/* Question Images & Cross-Language Media Tray */}
                <div className="md:col-span-3">
                  <QuestionImageGallery
                    language={language}
                    activeLang={activityActiveLang}
                    tempQuestion={editingActivity}
                    allQuestions={expandedLessonId && activitiesData[expandedLessonId] ? activitiesData[expandedLessonId] : []}
                    onUpdateQuestion={(field, val) => {
                      setEditingActivity((prev: any) => ({
                        ...prev,
                        [field]: val,
                        ...(field === 'questionTextEn' && (!prev?.questionText || !/[\u0600-\u06FF]/.test(prev?.questionText)) ? { questionText: val } : {})
                      }));
                    }}
                    showToast={showToast}
                    textField="questionText"
                    textFieldEn="questionTextEn"
                    imageField="image"
                  />
                </div>

                {/* Question Rich Text */}
                <div className="space-y-2 md:col-span-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {activityActiveLang === 'ar'
                        ? (language === 'ar' ? 'نص السؤال (بالعربية)' : 'Question Text (Arabic)')
                        : (language === 'ar' ? 'نص السؤال (بالإنجليزية)' : 'Question Text (English)')}
                    </label>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 uppercase">
                      {activityActiveLang === 'ar' ? 'العربية' : 'English'}
                    </span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden min-h-[200px] shadow-sm hover:border-indigo-300 transition-all duration-300">
                    {activityActiveLang === 'ar' ? (
                      <RichTextEditor 
                        key="ar-qtext"
                        value={(editingActivity.questionText ) ? editingActivity.questionText : ""} 
                        onChange={(val) => setEditingActivity({...editingActivity, questionText: val})} 
                        availableImages={extractImageUrls([
                          editingActivity.questionText,
                          editingActivity.questionTextEn,
                          editingActivity.image,
                          editingActivity.explanation,
                          editingActivity.explanationEn,
                          typeof editingActivity.options === 'string' ? editingActivity.options : JSON.stringify(editingActivity.options || ''),
                          typeof editingActivity.optionsEn === 'string' ? editingActivity.optionsEn : JSON.stringify(editingActivity.optionsEn || '')
                        ].filter(Boolean).join(' '))}
                      />
                    ) : (
                      <RichTextEditor 
                        key="en-qtext"
                        value={editingActivity.questionTextEn || (editingActivity.questionText && !/[\u0600-\u06FF]/.test(editingActivity.questionText) ? editingActivity.questionText : "")} 
                        onChange={(val) => {
                          const syncBase = !editingActivity.questionText || (!/[\u0600-\u06FF]/.test(editingActivity.questionText) && editingActivity.questionText === (editingActivity.questionTextEn || ''));
                          setEditingActivity({
                            ...editingActivity, 
                            questionTextEn: val,
                            ...(syncBase ? { questionText: val } : {})
                          });
                        }} 
                        availableImages={extractImageUrls([
                          editingActivity.questionText,
                          editingActivity.questionTextEn,
                          editingActivity.image,
                          editingActivity.explanation,
                          editingActivity.explanationEn,
                          typeof editingActivity.options === 'string' ? editingActivity.options : JSON.stringify(editingActivity.options || ''),
                          typeof editingActivity.optionsEn === 'string' ? editingActivity.optionsEn : JSON.stringify(editingActivity.optionsEn || '')
                        ].filter(Boolean).join(' '))}
                      />
                    )}
                  </div>
                </div>

                {/* Additional Metadata row */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "النقاط (الدرجة)" : "Points"}</label>
                  <input 
                    type="number" value={editingActivity.points} onChange={(e) => setEditingActivity({...editingActivity, points: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "نقاط XP" : "XP Points"}</label>
                  <input 
                    type="number" value={editingActivity.xpPoints !== undefined ? editingActivity.xpPoints : 10} onChange={(e) => setEditingActivity({...editingActivity, xpPoints: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "الصعوبة" : "Difficulty"}</label>
                  <select value={editingActivity.difficulty} onChange={(e) => setEditingActivity({...editingActivity, difficulty: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none">
                    <option value="Foundation">{language === 'ar' ? 'تأسيسي' : 'Foundation'}</option>
                    <option value="On Level">{language === 'ar' ? 'في المستوى' : 'On Level'}</option>
                    <option value="Advanced">{language === 'ar' ? 'متقدم' : 'Advanced'}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "عمق المعرفة (DOK)" : "DOK"}</label>
                  <select value={editingActivity.dok || ""} onChange={(e) => setEditingActivity({...editingActivity, dok: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none">
                    <option value="">{language === 'ar' ? 'لا يوجد' : 'None'}</option>
                    <option value="DOK 1">DOK 1</option>
                    <option value="DOK 2">DOK 2</option>
                    <option value="DOK 3">DOK 3</option>
                    <option value="DOK 4">DOK 4</option>
                  </select>
                </div>
              </div>

              {/* Core Interactive Editor */}
              <div className="bg-white border border-indigo-100 rounded-[24px] shadow-sm p-6 overflow-hidden">
                 <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                   <div className="text-xs font-black text-slate-700 flex items-center gap-2">
                     <Sparkles className="w-4 h-4 text-indigo-500" />
                     <span>
                       {activityActiveLang === 'ar'
                         ? (language === 'ar' ? 'محتوى وبدائل النشاط (باللغة العربية)' : 'Activity Content & Choices (Arabic)')
                         : (language === 'ar' ? 'محتوى وبدائل النشاط (باللغة الإنجليزية)' : 'Activity Content & Choices (English)')}
                     </span>
                   </div>
                   <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700">
                     {activityActiveLang === 'ar' ? 'العربية (AR)' : 'English (EN)'}
                   </span>
                 </div>
                 <BilingualMetadataEditor value={editingActivity} language={language} fields={["standard", "indicator", "learningOutcome", "skill"]} onChange={patch => setEditingActivity((prev: any) => ({ ...prev, ...patch }))} />
                  <InteractiveQuestionEditor 
                   question={editingActivity}
                   onChange={(updatedQ) => setEditingActivity(updatedQ)}
                   language={activityActiveLang}
                 />
              </div>

              {/* Explanation (Optional) */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">
                    {activityActiveLang === 'ar'
                      ? (language === 'ar' ? 'التفسير بالعربية (يظهر بعد الإجابة - اختياري)' : 'Explanation (Arabic - Optional)')
                      : (language === 'ar' ? 'التفسير بالإنجليزية (يظهر بعد الإجابة - اختياري)' : 'Explanation (English - Optional)')}
                  </label>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 uppercase">
                    {activityActiveLang === 'ar' ? 'العربية' : 'English'}
                  </span>
                </div>
                {activityActiveLang === 'ar' ? (
                  <textarea 
                    value={(editingActivity.explanation ) ? editingActivity.explanation : ""} 
                    onChange={(e) => setEditingActivity({...editingActivity, explanation: e.target.value})}
                    rows={3}
                    placeholder={language === 'ar' ? "اكتب شرحاً يوضح سبب الإجابة الصحيحة للطالب..." : "Explain why the answer is correct..."}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none resize-none"
                  />
                ) : (
                  <textarea 
                    value={editingActivity.explanationEn !== undefined && editingActivity.explanationEn !== null && editingActivity.explanationEn !== '' ? editingActivity.explanationEn : (editingActivity.explanation && !/[\u0600-\u06FF]/.test(editingActivity.explanation) ? editingActivity.explanation : '')} 
                    onChange={(e) => {
                      const val = e.target.value;
                      const syncBase = !editingActivity.explanation || (!/[\u0600-\u06FF]/.test(editingActivity.explanation) && editingActivity.explanation === (editingActivity.explanationEn || ''));
                      setEditingActivity({
                        ...editingActivity, 
                        explanationEn: val,
                        ...(syncBase ? { explanation: val } : {})
                      });
                    }}
                    rows={3}
                    placeholder="Explain why the answer is correct in English..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none resize-none"
                  />
                )}
              </div>

              {/* Educational Standards & Alignment */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
                <h4 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  {language === 'ar' ? "المواءمة والمعايير التعليمية" : "Educational Standards & Alignment"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "المعيار التعليمي" : "Educational Standard"}</label>
                    <select
                      value={editingActivity.standard || ""}
                      onChange={async (e) => {
                        const val = e.target.value;
                        const lesson = lessons.find((l: any) => l.id === editingActivity.lessonId);
                        const lessonMetadata = getLessonMetadata(lesson);

                        if (val === "add_custom") {
                          const newVal = prompt(language === 'ar' ? "أدخل معيار مخصص جديد:" : "Enter custom standard:");
                          if (newVal && newVal.trim()) {
                            const trimmed = newVal.trim();
                            const updatedMetadata = {
                              ...lessonMetadata,
                              standards: Array.from(new Set([...(lessonMetadata.standards || []), trimmed]))
                            };
                            await saveLessonMetadata(editingActivity.lessonId, updatedMetadata);
                            updateMetadata("standard", trimmed);
                          }
                        } else {
                          updateMetadata("standard", val);
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                    >
                      <option value="">{language === 'ar' ? '-- اختر المعيار --' : '-- Select Standard --'}</option>
                      {(getLessonMetadata(lessons.find((l: any) => l.id === editingActivity.lessonId)).standards || []).map((std: string) => (
                        <option key={std} value={std}>{std}</option>
                      ))}
                      {editingActivity.standard && !(getLessonMetadata(lessons.find((l: any) => l.id === editingActivity.lessonId)).standards || []).includes(editingActivity.standard) && (
                        <option value={editingActivity.standard}>{editingActivity.standard}</option>
                      )}
                      <option value="add_custom" className="text-indigo-600 font-bold">
                        {language === 'ar' ? '+ إضافة معيار مخصص...' : '+ Add Custom Standard...'}
                      </option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{"Performance Indicator"}</label>
                    <select
                      value={editingActivity.indicator || ""}
                      onChange={async (e) => {
                        const val = e.target.value;
                        const lesson = lessons.find((l: any) => l.id === editingActivity.lessonId);
                        const lessonMetadata = getLessonMetadata(lesson);

                        if (val === "add_custom") {
                          const newVal = prompt(language === 'ar' ? "أدخل مؤشر مخصص جديد:" : "Enter custom indicator:");
                          if (newVal && newVal.trim()) {
                            const trimmed = newVal.trim();
                            const updatedMetadata = {
                              ...lessonMetadata,
                              indicators: Array.from(new Set([...(lessonMetadata.indicators || []), trimmed]))
                            };
                            await saveLessonMetadata(editingActivity.lessonId, updatedMetadata);
                            updateMetadata("indicator", trimmed);
                          }
                        } else {
                          updateMetadata("indicator", val);
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                    >
                      <option value="">{language === 'ar' ? '-- اختر المؤشر --' : '-- Select Indicator --'}</option>
                      {(getLessonMetadata(lessons.find((l: any) => l.id === editingActivity.lessonId)).indicators || []).map((ind: string) => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                      {editingActivity.indicator && !(getLessonMetadata(lessons.find((l: any) => l.id === editingActivity.lessonId)).indicators || []).includes(editingActivity.indicator) && (
                        <option value={editingActivity.indicator}>{editingActivity.indicator}</option>
                      )}
                      <option value="add_custom" className="text-indigo-600 font-bold">
                        {language === 'ar' ? '+ إضافة مؤشر مخصص...' : '+ Add Custom Indicator...'}
                      </option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "مخرج التعلم المستهدف" : "Learning Outcome"}</label>
                    <select
                      value={editingActivity.learningOutcome || ""}
                      onChange={async (e) => {
                        const val = e.target.value;
                        const lesson = lessons.find((l: any) => l.id === editingActivity.lessonId);
                        const lessonMetadata = getLessonMetadata(lesson);

                        if (val === "add_custom") {
                          const newVal = prompt(language === 'ar' ? "أدخل مخرج تعلم مخصص جديد:" : "Enter custom learning outcome:");
                          if (newVal && newVal.trim()) {
                            const trimmed = newVal.trim();
                            const updatedMetadata = {
                              ...lessonMetadata,
                              outcomes: Array.from(new Set([...(lessonMetadata.outcomes || []), trimmed]))
                            };
                            await saveLessonMetadata(editingActivity.lessonId, updatedMetadata);
                            updateMetadata("learningOutcome", trimmed);
                          }
                        } else {
                          updateMetadata("learningOutcome", val);
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                    >
                      <option value="">{language === 'ar' ? '-- اختر مخرج التعلم --' : '-- Select Learning Outcome --'}</option>
                      {(getLessonMetadata(lessons.find((l: any) => l.id === editingActivity.lessonId)).outcomes || []).map((out: string) => (
                        <option key={out} value={out}>{out}</option>
                      ))}
                      {editingActivity.learningOutcome && !(getLessonMetadata(lessons.find((l: any) => l.id === editingActivity.lessonId)).outcomes || []).includes(editingActivity.learningOutcome) && (
                        <option value={editingActivity.learningOutcome}>{editingActivity.learningOutcome}</option>
                      )}
                      <option value="add_custom" className="text-indigo-600 font-bold">
                        {language === 'ar' ? '+ إضافة مخرج مخصص...' : '+ Add Custom Outcome...'}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Learning Aids & Supports */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    {language === 'ar' ? "مساعدات التعلم والتوجيه الذكي" : "Learning Supports & Intelligent Guidance"}
                  </h4>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 uppercase">
                    {activityActiveLang === 'ar' ? 'العربية' : 'English'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {activityActiveLang === 'ar'
                          ? (language === 'ar' ? "التلميح المساعد (بالعربية)" : "Hint (Arabic)")
                          : (language === 'ar' ? "التلميح المساعد (بالإنجليزية)" : "Hint (English)")}
                      </label>
                    </div>
                    {activityActiveLang === 'ar' ? (
                      <textarea 
                        value={(editingActivity.hint ) ? editingActivity.hint : ""} 
                        onChange={(e) => setEditingActivity({...editingActivity, hint: e.target.value})}
                        rows={2}
                        placeholder={language === 'ar' ? "تلميح بسيط لمساعدة الطالب على الحل..." : "Simple hint to help the student..."}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none resize-none"
                      />
                    ) : (
                      <textarea 
                        value={editingActivity.hintEn !== undefined && editingActivity.hintEn !== null && editingActivity.hintEn !== '' ? editingActivity.hintEn : (editingActivity.hint && !/[\u0600-\u06FF]/.test(editingActivity.hint) ? editingActivity.hint : '')} 
                        onChange={(e) => {
                          const val = e.target.value;
                          const syncBase = !editingActivity.hint || (!/[\u0600-\u06FF]/.test(editingActivity.hint) && editingActivity.hint === (editingActivity.hintEn || ''));
                          setEditingActivity({
                            ...editingActivity, 
                            hintEn: val,
                            ...(syncBase ? { hint: val } : {})
                          });
                        }} 
                        rows={2}
                        placeholder="Simple hint to help the student in English..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none resize-none"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {activityActiveLang === 'ar'
                          ? (language === 'ar' ? "نصيحة تعليمية (بالعربية)" : "Tip (Arabic)")
                          : "Tip (English)"}
                      </label>
                    </div>
                    {activityActiveLang === 'ar' ? (
                      <textarea 
                        value={(editingActivity.tip ) ? editingActivity.tip : ""} 
                        onChange={(e) => setEditingActivity({...editingActivity, tip: e.target.value})}
                        rows={2}
                        placeholder={language === 'ar' ? "نصيحة لتجنب الأخطاء الشائعة..." : "Tip to avoid common mistakes..."}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none resize-none"
                      />
                    ) : (
                      <textarea 
                        value={editingActivity.tipEn !== undefined && editingActivity.tipEn !== null && editingActivity.tipEn !== '' ? editingActivity.tipEn : (editingActivity.tip && !/[\u0600-\u06FF]/.test(editingActivity.tip) ? editingActivity.tip : '')} 
                        onChange={(e) => {
                          const val = e.target.value;
                          const syncBase = !editingActivity.tip || (!/[\u0600-\u06FF]/.test(editingActivity.tip) && editingActivity.tip === (editingActivity.tipEn || ''));
                          setEditingActivity({
                            ...editingActivity, 
                            tipEn: val,
                            ...(syncBase ? { tip: val } : {})
                          });
                        }} 
                        rows={2}
                        placeholder="Tip to avoid common mistakes in English..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none resize-none"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {activityActiveLang === 'ar'
                          ? (language === 'ar' ? "الرؤية المعرفية / الخلاصة (بالعربية)" : "Key Insight (Arabic)")
                          : "Key Insight (English)"}
                      </label>
                    </div>
                    {activityActiveLang === 'ar' ? (
                      <textarea 
                        value={(editingActivity.keyInsight ) ? editingActivity.keyInsight : ""} 
                        onChange={(e) => setEditingActivity({...editingActivity, keyInsight: e.target.value})}
                        rows={2}
                        placeholder={language === 'ar' ? "الخلاصة أو الفكرة الكبرى من السؤال..." : "The big idea or summary behind the question..."}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none resize-none"
                      />
                    ) : (
                      <textarea 
                        value={editingActivity.keyInsightEn !== undefined && editingActivity.keyInsightEn !== null && editingActivity.keyInsightEn !== '' ? editingActivity.keyInsightEn : (editingActivity.keyInsight && !/[\u0600-\u06FF]/.test(editingActivity.keyInsight) ? editingActivity.keyInsight : '')} 
                        onChange={(e) => {
                          const val = e.target.value;
                          const syncBase = !editingActivity.keyInsight || (!/[\u0600-\u06FF]/.test(editingActivity.keyInsight) && editingActivity.keyInsight === (editingActivity.keyInsightEn || ''));
                          setEditingActivity({
                            ...editingActivity, 
                            keyInsightEn: val,
                            ...(syncBase ? { keyInsight: val } : {})
                          });
                        }} 
                        rows={2}
                        placeholder="The big idea or summary behind the question in English..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none resize-none"
                      />
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-100 flex justify-end gap-3 bg-white shrink-0">
              <button onClick={() => setIsActivityModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">
                {activityActiveLang === 'en' ? "Cancel" : (language === 'ar' ? "إلغاء" : "Cancel")}
              </button>
              <button onClick={handleSaveActivity} className="px-8 py-3 rounded-xl font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all">
                <CheckCircle2 className="w-5 h-5" />
                {activityActiveLang === 'en' ? "Save Activity" : (language === 'ar' ? "حفظ النشاط" : "Save Activity")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Student Preview Play Modal - Full Page Unified Form */}</>;
}
