"use client";
import { shouldSkipImageOptimization } from "@/lib/imageDisplay";
import { normalizeDok } from '@/lib/examQuestionMetadata';
import Image from "next/image";
import { Plus, Trash2, Upload, Download, CheckCircle2, ChevronDown, ChevronUp, Save, X, Target, FileText, Languages, Loader2, Image as ImageIcon } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import { getOptionLetter } from "@/lib/utils";
import MathInput from "@/components/MathInput";
import * as XLSX from "xlsx";
import { buildAdvancedMetadataTemplateRows } from '@/lib/examExcelTemplates';
import QuestionImageGallery from '@/components/QuestionImageGallery';
import { extractImageUrls } from '@/lib/image-utils';
export default function LessonQuestionForm(props: any) {
 const {source, currentLesson, language, showQuestionForm, setShowQuestionForm, editingQuestionIndex, tempQuestion, setTempQuestion, openDropdownId, setOpenDropdownId, showToast, showQuestionMetadata, setShowQuestionMetadata, showQuestionSections, setShowQuestionSections, questionActiveLang, setQuestionActiveLang, isTranslatingQuestion, extractFirstImage, handleAutoTranslateQuestion, QUESTION_TYPES, SECTION_STYLE_PRESETS, handleSaveQuestionForSource, updateCurrentQuestionField, updateQuestionOption, toggleQuestionCorrectAnswer, isQuestionCorrectAnswer, addQuestionSection, removeQuestionSection}=props;
 return <>{showQuestionForm && (
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
                      {QUESTION_TYPES.map((type: { id: string; label: string }) => (
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
                    const worksheet = XLSX.utils.aoa_to_sheet(buildAdvancedMetadataTemplateRows(language, [tempQuestion]));
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
                {/* Shared image notice */}
                <p className="text-[10px] text-slate-400 font-bold">
                  {language === 'ar'
                    ? 'الصورة مشتركة بين اللغتين — ما ترفعه هنا يظهر تلقائياً في العربي والإنجليزي.'
                    : 'Image is shared between both languages — uploaded here appears in both AR and EN.'}
                </p>

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
                      <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 shrink-0 flex items-center justify-center relative">
                        <Image src={img} alt="Question Preview" fill sizes="80px" className="object-contain" unoptimized={shouldSkipImageOptimization(img)} />
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

              {/* Question Images & Cross-Language Media Tray */}
              <QuestionImageGallery
                language={language}
                activeLang={questionActiveLang}
                tempQuestion={tempQuestion}
                allQuestions={currentLesson?.questions || []}
                onUpdateQuestion={(field, val) => updateCurrentQuestionField(field, val)}
                showToast={showToast}
              />

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
                  key={`${tempQuestion.id || "draft"}:${questionActiveLang}`}
                  value={(questionActiveLang === 'ar' 
                    ? (tempQuestion.text || '')
                    : (tempQuestion.textEn || (tempQuestion.text && !/[\u0600-\u06FF]/.test(tempQuestion.text) ? tempQuestion.text : ''))
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
                  availableImages={extractImageUrls([
                    tempQuestion.text,
                    tempQuestion.textEn,
                    tempQuestion.imageUrl,
                    ...(Array.isArray(tempQuestion.sections) ? tempQuestion.sections.map((s: any) => s.content) : [])
                  ].filter(Boolean).join(' '))}
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
                            key={`${tempQuestion.id || "draft"}:${questionActiveLang}`}
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
                        const rawOptsAr = Array.from({ length: baseLength }, (_, i) => String(tempQuestion.options?.[i] || ''));
                        const rawOptsEn = Array.from({ length: baseLength }, (_, i) => String(tempQuestion.optionsEn?.[i] || ''));
                        const hasArInText = /[\u0600-\u06FF]/.test(tempQuestion.text || '');
                        const hasArInOpts = rawOptsAr.some(o => /[\u0600-\u06FF]/.test(o));
                        const isArOptsEnglish = (rawOptsAr.some(o => /[a-zA-Z]/.test(o)) && !hasArInOpts) || (!hasArInText && !hasArInOpts);
                        const currentOptsEn = rawOptsAr.map((arVal, idx) => {
                          const enVal = rawOptsEn[idx];
                          if (enVal && enVal.trim()) return enVal;
                          if (arVal && (!/[\u0600-\u06FF]/.test(arVal) || isArOptsEnglish)) return arVal;
                          return enVal || '';
                        });
                        const currentOptsAr = rawOptsEn.map((enVal, idx) => {
                          const arVal = rawOptsAr[idx];
                          if (arVal && arVal.trim()) return arVal;
                          if (enVal && !/[a-zA-Z]/.test(enVal)) return enVal;
                          return arVal || '';
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
                                key={`${tempQuestion.id || "draft"}:${questionActiveLang}`}
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
        )}</>;
}
