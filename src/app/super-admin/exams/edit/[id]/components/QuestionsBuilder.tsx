import { normalizeDok } from '@/lib/examQuestionMetadata';
// @ts-nocheck
import React from 'react';
import { getUniqueListKey } from '@/lib/uniqueListKey';
import HtmlRenderer from '@/components/HtmlRenderer';
import RichTextEditor from '@/components/RichTextEditor';
import MathInput from '@/components/MathInput';
import { getOptionLetter, cleanOptionText } from '@/lib/utils';
import { QUESTION_TYPES, SECTION_STYLE_PRESETS } from '../constants';
import { parseJson } from '../utils/examUtils';
import { sanitizeHtml } from '@/lib/sanitize';
import { ChevronUp, ChevronDown, CheckCircle2, Edit2, Trash2, Plus, FileText, Settings, Activity, MoveUp, MoveDown, Mic, Video, Image as ImageIcon, Layout, Check, HelpCircle, Upload, Download, Target, X, Save, Loader2, Sparkles, Languages } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { translateBatch } from '@/lib/translationService';
import InteractiveQuestionEditor from '@/components/InteractiveQuestionEditor';
import * as XLSX from "xlsx";
import { QuestionExcelExportButton } from '@/components/QuestionExcelExportButton';


export const QuestionsBuilder = (props: any) => {
  const [questionActiveLang, setQuestionActiveLang] = React.useState<'ar' | 'en'>('ar');
  const [cardPreviewLang, setCardPreviewLang] = React.useState<Record<number, 'ar' | 'en'>>({});
  const [isTranslatingQuestion, setIsTranslatingQuestion] = React.useState(false);

  const extractFirstImage = (text?: string, imageUrl?: string): string | null => {
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) return imageUrl.trim();
    if (!text || typeof text !== 'string') return null;
    const match = text.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match ? match[1] : null;
  };

  const handleAutoTranslateQuestion = async () => {
    const currentQ = props.tempQuestion;
    if (!currentQ) return;
    setIsTranslatingQuestion(true);
    try {
      const from = questionActiveLang;
      const to = from === 'ar' ? 'en' : 'ar';

      const srcText = from === 'ar' ? currentQ.text : currentQ.textEn;
      const srcExplanation = from === 'ar' ? currentQ.explanation : currentQ.explanationEn;

      const baseLength = Math.max((currentQ.options || []).length, (currentQ.optionsEn || []).length, 4);
      const srcOpts = from === 'ar'
        ? Array.from({ length: baseLength }, (_, i) => String(currentQ.options?.[i] || ''))
        : Array.from({ length: baseLength }, (_, i) => String(currentQ.optionsEn?.[i] || ''));

      const sectionsList = currentQ.sections || [];
      const srcSections = sectionsList.map((s: any) =>
        from === 'ar' ? String(s.content || s.text || '') : String(s.contentEn || s.textEn || s.content || '')
      );

      const srcDomain = from === 'ar' ? currentQ.domain : (currentQ.domainEn || currentQ.domain);
      const srcOutcome = from === 'ar' 
        ? (currentQ.standard || currentQ.learningOutcome) 
        : (currentQ.standardEn || currentQ.learningOutcomeEn || currentQ.standard || currentQ.learningOutcome);
      const srcIndicator = from === 'ar' ? currentQ.indicator : (currentQ.indicatorEn || currentQ.indicator);
      const srcSkill = from === 'ar' ? currentQ.skill : (currentQ.skillEn || currentQ.skill);
      const srcSubskill = from === 'ar' ? currentQ.subskill : (currentQ.subskillEn || currentQ.subskill);
      const srcMicroSkill = from === 'ar' ? currentQ.microSkill : (currentQ.microSkillEn || currentQ.microSkill);
      const srcErrorPattern = from === 'ar' ? currentQ.errorPattern : (currentQ.errorPatternEn || currentQ.errorPattern);

      const textsToTranslate = [
        srcText || '',
        srcExplanation || '',
        ...srcOpts,
        ...srcSections,
        srcDomain || '',
        srcOutcome || '',
        srcIndicator || '',
        srcSkill || '',
        srcSubskill || '',
        srcMicroSkill || '',
        srcErrorPattern || ''
      ];

      const translations = await translateBatch(textsToTranslate, from, to);

      const [trText, trExplanation] = translations.slice(0, 2);
      const trOpts = translations.slice(2, 2 + baseLength);
      const trSections = translations.slice(2 + baseLength, 2 + baseLength + sectionsList.length);
      const [trDomain, trOutcome, trIndicator, trSkill, trSubskill, trMicroSkill, trErrorPattern] = 
        translations.slice(2 + baseLength + sectionsList.length);

      const updated = { ...currentQ };
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

        if (currentQ.correctAnswerIndex !== undefined && currentQ.correctAnswerIndex !== null) {
          if (trOpts[currentQ.correctAnswerIndex]) {
            updated.correctAnswerEn = trOpts[currentQ.correctAnswerIndex];
          }
        } else if (currentQ.correctAnswer) {
          const arOpts = currentQ.options || [];
          const matchedIdx = arOpts.findIndex((o: string) => String(o).trim() === String(currentQ.correctAnswer).trim());
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

        if (currentQ.correctAnswerIndex !== undefined && currentQ.correctAnswerIndex !== null) {
          if (trOpts[currentQ.correctAnswerIndex]) {
            updated.correctAnswer = trOpts[currentQ.correctAnswerIndex];
          }
        } else if (currentQ.correctAnswerEn || currentQ.correctAnswer) {
          const enOpts = currentQ.optionsEn || [];
          const target = currentQ.correctAnswerEn || currentQ.correctAnswer;
          const matchedIdx = enOpts.findIndex((o: string) => String(o).trim() === String(target).trim());
          if (matchedIdx !== -1 && trOpts[matchedIdx]) {
            updated.correctAnswer = trOpts[matchedIdx];
            updated.correctAnswerIndex = matchedIdx;
          }
        }
        setQuestionActiveLang('ar');
      }

      props.setTempQuestion(updated);
    } catch (err: any) {
      console.error('Auto translate question error:', err);
    } finally {
      setIsTranslatingQuestion(false);
    }
  };
  const { currentModule, setCurrentModule, activeSubExamIndex, source, language, assignmentsExcelRef, questionsExcelRef, advancedMetadataExcelRef, handleAssignmentsExcelChange, handleQuestionsExcelChange, handleAdvancedMetadataExcelChange, handleExcelUpload, downloadQuestionsTemplate, downloadAdvancedMetadataTemplate, handleAddQuestionForSource, showQuestionForm, setShowQuestionForm, list, moveQuestionForSource, expandedQuestionIndex, setExpandedQuestionIndex, handleEditQuestionForSource, removeQuestionForSource, tempQuestion, setTempQuestion, updateCurrentQuestionField, customSkills, setCustomSkills, allExistingSkills, availableMetadata, openDropdownId, setOpenDropdownId, addQuestionSection, updateQuestionSectionContent, removeQuestionSection, isQuestionCorrectAnswer, toggleQuestionCorrectAnswer, updateQuestionOption, handleSaveQuestionForSource, editingQuestionIndex } = props;

  const renderQuestionsBuilderFunc = () => {
    const list = (source === 'questions' && activeSubExamIndex !== null && currentModule.subExams && currentModule.subExams[activeSubExamIndex]) ? (currentModule.subExams[activeSubExamIndex].questions || []) : (currentModule[source] || []);
    const headerLabel = source === 'assignments'
      ? (language === 'ar' ? 'واجبات وتكليفات الدرس (Assignments)' : 'Lesson Assignments')
      : (language === 'ar' ? 'اختبار (Exam)' : 'Exam');

    const headerDesc = source === 'assignments'
      ? (language === 'ar' ? 'قم بإضافة التكليفات التطبيقية والواجبات المنزلية للطلاب' : 'Add application homework and assignments for students')
      : (language === 'ar' ? 'قم بإضافة أسئلة لاختبار الطالب في هذا الموديول' : 'Add questions to test student in this module');

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <input
          type="file"
          ref={source === 'assignments' ? assignmentsExcelRef : questionsExcelRef}
          style={{ display: 'none' }}
          accept=".xlsx,.xls"
          onChange={source === 'assignments' ? handleAssignmentsExcelChange : handleQuestionsExcelChange}
        />
        <input
          type="file"
          ref={advancedMetadataExcelRef}
          style={{ display: 'none' }}
          accept=".xlsx,.xls"
          onChange={(e) => handleAdvancedMetadataExcelChange(e)}
        />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <HelpCircle className="w-6 h-6 text-indigo-600" />
              {headerLabel}
            </h4>
            <p className="text-slate-400 text-sm font-bold mt-1">{headerDesc}</p>
          </div>
          <div className="flex flex-wrap gap-2.5 items-center">
            <QuestionExcelExportButton questions={props.isLoadingQuestions ? [] : list} language={language} />
            <button
              type="button"
              onClick={() => handleExcelUpload(source === 'assignments' ? 'assignments' : 'questions')}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm text-xs"
            >
              <Upload className="w-4 h-4" />
              {source === 'assignments' 
                ? (language === 'ar' ? 'استيراد الواجبات' : 'Import Assignments') 
                : (language === 'ar' ? 'استيراد الأسئلة' : 'Import Questions')}
            </button>
            <button
              type="button"
              onClick={() => downloadQuestionsTemplate(source === 'assignments' ? 'assignments' : 'questions')}
              className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-4 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm text-xs"
            >
              <Download className="w-4 h-4" />
              {source === 'assignments' 
                ? (language === 'ar' ? 'نموذج الواجبات' : 'Assignments Template') 
                : (language === 'ar' ? 'نموذج الأسئلة' : 'Questions Template')}
            </button>
            {source === 'questions' && (
              <>
                <button
                  type="button"
                  onClick={() => handleExcelUpload('advancedMetadata')}
                  className="bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200 px-4 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm text-xs"
                >
                  <Upload className="w-4 h-4" />
                  {language === 'ar' ? 'استيراد ميتا داتا متقدمة' : 'Import Advanced Meta Data'}
                </button>
                <button
                  type="button"
                  onClick={() => downloadAdvancedMetadataTemplate()}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-4 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm text-xs"
                >
                  <Download className="w-4 h-4" />
                  {language === 'ar' ? 'نموذج الميتا داتا' : 'Metadata Template'}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => handleAddQuestionForSource(source)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all shadow-lg cursor-pointer text-xs"
            >
              <Plus className="w-4 h-4" />
              {source === 'assignments' ? (language === 'ar' ? '+ إضافة واجب' : '+ Add Assignment') : (language === 'ar' ? '+ إضافة سؤال' : '+ Add Question')}
            </button>
          </div>
        </div>

        {/* Saved Questions Cards List */}
        {!showQuestionForm && (
          <div className="space-y-4">
            {props.isLoadingQuestions ? (
              <div className="bg-white rounded-[35px] border-2 border-indigo-100 p-16 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-800 mb-1">{language === 'ar' ? 'جارٍ تحميل أسئلة الاختبار...' : 'Loading questions...'}</h4>
                  <p className="text-slate-400 font-bold text-xs max-w-sm">{language === 'ar' ? 'يرجى الانتظار بضع ثوانٍ بينما يتم جلب الأسئلة' : 'Please wait while questions are being loaded'}</p>
                </div>
              </div>
            ) : list.length === 0 ? (
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
              list.map((q: any, index: number) => {
                const qImg = extractFirstImage(q);
                return (
                  <div key={q.id ?? index} className="bg-white rounded-[30px] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                      <div className="px-6 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 overflow-hidden">
                          <div className="flex flex-col items-center gap-1">
                            <button type="button" onClick={() => moveQuestionForSource(source, index, 'UP')} disabled={index === 0} className="text-slate-300 hover:text-indigo-600 disabled:opacity-20 transition-colors"><ChevronUp className="w-4 h-4" /></button>
                            <span className="w-8 h-8 min-w-8 shrink-0 whitespace-nowrap tabular-nums bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-xs">{index + 1}</span>
                            <button type="button" onClick={() => moveQuestionForSource(source, index, 'DOWN')} disabled={index === list.length - 1} className="text-slate-300 hover:text-indigo-600 disabled:opacity-20 transition-colors"><ChevronDown className="w-4 h-4" /></button>
                          </div>
                          {qImg && (
                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-50 flex items-center justify-center">
                              <img src={qImg} alt="Thumbnail" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex flex-col flex-1 overflow-hidden">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                                {QUESTION_TYPES.find(t => t.id === q.type)?.labelEn || q.type}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase">
                                {q.points || 1} {language === 'ar' ? 'درجة' : 'pts'} • {q.xpPoints || 10} XP
                              </span>
                            </div>
                            <div
                              className="text-slate-700 font-bold truncate text-sm"
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml((q.text || '').substring(0, 120)) }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
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
                              <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">{isCardEn ? 'Question Content:' : 'نص السؤال / المحتوى:'}</h5>
                              <HtmlRenderer html={activeQText} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-sm font-bold" />
                              {qImg && (
                                <div className="rounded-2xl overflow-hidden border border-slate-200 max-w-sm bg-white p-2">
                                  <img src={qImg} alt="Question Attachment" className="w-full h-48 object-contain rounded-lg" />
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
                                            <span>{cleanOptionText(opt)}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : q.type === 'FLASH_CARD' ? (
                                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs space-y-2 font-bold text-right" dir={isCardEn ? 'ltr' : 'rtl'}>
                                      <p className="text-slate-800"><span className="text-indigo-600">{isCardEn ? 'Front (Question):' : 'الوجه الأمامي (السؤال):'}</span> {parseJson(isCardEn ? (q.optionsEn || q.options) : q.options, { front: "" }).front || activeQText}</p>
                                      <p className="text-slate-800"><span className="text-indigo-600">{isCardEn ? 'Back (Answer):' : 'الوجه الخلفي (الإجابة):'}</span> {parseJson(isCardEn ? (q.optionsEn || q.options) : q.options, { back: "" }).back || (isCardEn ? (q.correctAnswerEn || q.correctAnswer) : q.correctAnswer)}</p>
                                    </div>
                                  ) : (
                                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs space-y-1.5 font-bold text-right" dir={isCardEn ? 'ltr' : 'rtl'}>
                                      <p className="text-slate-400">{isCardEn ? `Activity Type: ${q.type}` : `نوع النشاط: ${q.type}`}</p>
                                      <p className="text-slate-800"><span className="text-emerald-600">✓ {isCardEn ? 'Correct Answer:' : 'الإجابة النموذجية:'}</span> {isCardEn ? (q.correctAnswerEn || q.correctAnswer) : (typeof q.correctAnswer === 'object' ? JSON.stringify(q.correctAnswer) : String(q.correctAnswer || ""))}</p>
                                    </div>
                                  )}
                                </>
                              )}

                              {((q.sections && q.sections.length > 0) || (q.explanation && String(q.explanation).trim() !== '' && q.explanation !== '[]' && q.explanation !== '""')) && (
                                <div className="space-y-3 pt-2">
                                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">{isCardEn ? 'Explanations & Notes:' : 'تفسيرات وملاحظات إضافية:'}</h5>
                                  <div className="space-y-2">
                                    {q.sections && q.sections.length > 0 ? (
                                      q.sections.map((sec: any, secIdx: number) => {
                                        const preset = SECTION_STYLE_PRESETS[sec.type] || SECTION_STYLE_PRESETS.EXPLANATION;
                                        const SectionIcon = preset.icon;
                                        const secContent = isCardEn ? (sec.contentEn || sec.textEn || sec.content) : (sec.content || sec.textEn);
                                        return (
                                          <div key={secIdx} className={`p-4 rounded-xl border ${preset.container} text-xs`}>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1 mb-1.5 ${preset.badge}`}>
                                              <SectionIcon className="w-3 h-3" />
                                               {isCardEn ? preset.labelEn : (preset.labelAr || preset.labelEn)}
                                            </span>
                                            <HtmlRenderer html={secContent} className="text-slate-700 font-bold font-sans" />
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div className="p-4 rounded-xl border bg-amber-50/60 border-amber-200/60 text-xs">
                                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1 mb-1.5 bg-amber-100 text-amber-800">
                                          <FileText className="w-3 h-3" />
                                          {isCardEn ? 'Explanation' : 'التفسير والشرح'}
                                        </span>
                                        <HtmlRenderer html={isCardEn ? (q.explanationEn || q.explanation) : q.explanation} className="text-slate-700 font-bold font-sans" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        );
                      })()}
                  </div>
                );
              })
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
                onClick={() => { setShowQuestionForm(false); setCurrentModule({ ...currentModule, _isStandalone: false }); }}
                className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 md:p-12 space-y-8">
              {/* ── Row 1: Question Type + Points + XP ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-indigo-50 border border-indigo-100 rounded-[24px]">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">{language === 'ar' ? 'نوع السؤال' : 'Question Type'} <span className="text-red-500">*</span></label>
                  <CustomSelect
                    className="bg-white border border-indigo-200 rounded-xl px-3 py-2 font-bold text-black text-xs outline-none min-h-[34px]"
                    value={tempQuestion.type}
                    onChange={(val) => {
                      const newType = val;
                      const updated = { ...tempQuestion, type: newType };
                      if (newType === "TRUE_FALSE") {
                        updated.options = language === 'ar' ? ["صحيح", "خطأ", "", ""] : ["True", "False", "", ""];
                        updated.correctAnswer = language === 'ar' ? "صحيح" : "True";
                      } else if (tempQuestion.type === "TRUE_FALSE") {
                        updated.options = ["", "", "", ""];
                        updated.correctAnswer = "";
                      }
                      setTempQuestion(updated);
                    }}
                    options={QUESTION_TYPES.map(type => ({ value: type.id, label: type.labelEn }))}
                    placeholder={language === 'ar' ? 'اختر النوع...' : 'Select Type...'}
                  />
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
              </div>
              
              {/* Metadata Guidance */}
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-[11.5px] font-bold text-indigo-700 flex items-center gap-1.5 bg-indigo-50/70 border border-indigo-100/80 px-3 py-1.5 rounded-xl">
                  <span>
                    {language === 'ar'
                      ? 'توجيه المحتوى: يُنصح ألا تزيد البيانات الوصفية (Metadata) عن 8 عناصر للحفاظ على تناسق العرض وسرعة المراجعة.'
                      : 'Content Guidance: Recommended maximum of 8 metadata tags for optimal 2-row presentation.'}
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 bg-slate-50 border border-slate-100 rounded-[24px]">
                {[
                  { key: 'course', labelAr: 'الاختبار', labelEn: 'Exam' },
                  { key: 'section', labelAr: 'القسم', labelEn: 'Section' },
                  { key: 'domain', labelAr: 'المجال', labelEn: 'Domain', optionsKey: 'domains', translatable: true },
                  { key: 'standard', labelAr: 'نواتج التعلم', labelEn: 'Learning Outcomes', optionsKey: 'standards', translatable: true },
                  { key: 'indicator', labelAr: 'المؤشرات', labelEn: 'Indicators', optionsKey: 'indicators', translatable: true },
                  { key: 'skill', labelAr: 'المهارة', labelEn: 'Skill', optionsKey: 'outcomes', defaultValue: 'General', translatable: true },
                  { key: 'subskill', labelAr: 'المهارة الفرعية', labelEn: 'Subskill', translatable: true },
                  { key: 'microSkill', labelAr: 'المهارة الدقيقة', labelEn: 'Micro Skill', translatable: true },
                  { key: 'level', labelAr: 'الصعوبة', labelEn: 'Difficulty', defaultValue: 'Medium' },
                  { key: 'dok', labelAr: 'عمق المعرفة (DOK)', labelEn: 'DOK' },
                  { key: 'cognitive', labelAr: 'المستوى المعرفي', labelEn: 'Cognitive' },
                  { key: 'errorPattern', labelAr: 'نمط الخطأ', labelEn: 'Error Pattern', translatable: true },
                  { key: 'estimatedTime', labelAr: 'Estimated Time', labelEn: 'Estimated Time' },
                ].map((field: any) => {
                  const isEn = questionActiveLang === 'en';
                  const activeFieldKey = isEn && field.translatable ? `${field.key}En` : field.key;
                  const currentVal = field.key === 'standard'
                    ? (isEn
                        ? (tempQuestion.standardEn || tempQuestion.learningOutcomeEn || tempQuestion.standard || tempQuestion.learningOutcome || '')
                        : (tempQuestion.standard || tempQuestion.learningOutcome || ''))
                    : field.key === 'dok'
                    ? (normalizeDok(tempQuestion.dok) || tempQuestion.dok || '')
                    : (isEn && field.translatable
                        ? (tempQuestion[`${field.key}En`] ?? tempQuestion[field.key] ?? field.defaultValue ?? '')
                        : (tempQuestion[field.key] ?? field.defaultValue ?? ''));

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
                      ) : field.key === 'level' ? (
                        <select
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-indigo-600 font-bold appearance-none"
                          value={tempQuestion.level || ""}
                          onChange={(e) => updateCurrentQuestionField('level', e.target.value)}
                        >
                          <option value="">{language === 'ar' ? 'اختر...' : 'Select...'}</option>
                          <option value="Foundation">Foundation</option>
                          <option value="On_Level">On_Level</option>
                          <option value="Advanced">Advanced</option>
                          {tempQuestion.level && !['Foundation', 'On_Level', 'Advanced'].includes(tempQuestion.level) && (
                            <option value={tempQuestion.level}>{tempQuestion.level}</option>
                          )}
                        </select>
                      ) : (field.optionsKey && availableMetadata && (availableMetadata as any)[field.optionsKey]?.length > 0) ? (
                        <select
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-indigo-600 font-bold appearance-none"
                          value={currentVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateCurrentQuestionField(activeFieldKey, val);
                            if (field.key === 'standard') {
                              updateCurrentQuestionField(isEn ? 'learningOutcomeEn' : 'learningOutcome', val);
                            }
                          }}
                        >
                          <option value="">{language === 'ar' ? 'اختر...' : 'Select...'}</option>
                          {(availableMetadata as any)[field.optionsKey].map((opt: string, i: number) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                          {currentVal && !(availableMetadata as any)[field.optionsKey].includes(currentVal) && (
                            <option value={currentVal}>{currentVal}</option>
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
                              updateCurrentQuestionField(isEn ? 'learningOutcomeEn' : 'learningOutcome', val);
                            }
                          }}
                        />
                      )}
                    </div>
                  );
                })}
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
                      onClick={() => setQuestionActiveLang('ar')}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${questionActiveLang === 'ar' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-white'}`}
                    >
                      العربية (Arabic)
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionActiveLang('en')}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${questionActiveLang === 'en' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-white'}`}
                    >
                      English (EN)
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
                  value={(questionActiveLang === 'ar' ? tempQuestion.text : tempQuestion.textEn) || ""}
                  onChange={(value) => updateCurrentQuestionField(questionActiveLang === 'ar' ? "text" : "textEn", value)}
                  placeholder={questionActiveLang === 'ar' ? "اكتب نص السؤال بالعربية هنا..." : "Write the question prompt in English here..."}
                />
              </div>

              {/* Question Image Attachment */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black text-slate-700">
                      {language === 'ar' ? 'صورة توضيحية للسؤال (تظهر مع السؤال)' : 'Question Illustrative Image'}
                    </span>
                  </div>
                  {tempQuestion.imageUrl && (
                    <button
                      type="button"
                      onClick={() => updateCurrentQuestionField('imageUrl', '')}
                      className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'حذف الصورة' : 'Remove Image'}</span>
                    </button>
                  )}
                </div>

                {tempQuestion.imageUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 max-w-sm bg-white">
                    <img
                      src={tempQuestion.imageUrl}
                      alt="Question attachment preview"
                      className="w-full h-44 object-contain p-2"
                    />
                    <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-bold truncate">
                      <span className="truncate flex-1 px-1">{tempQuestion.imageUrl}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-200 hover:border-indigo-400 text-indigo-600 rounded-xl text-xs font-black cursor-pointer shadow-sm transition-all hover:bg-indigo-50/50">
                      <Upload className="w-4 h-4" />
                      <span>{language === 'ar' ? 'رفع صورة من جهازك' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const { uploadFileToServer } = await import('@/lib/image-utils');
                              const url = await uploadFileToServer(file);
                              updateCurrentQuestionField('imageUrl', url);
                            } catch (err: any) {
                              console.error('Failed to upload image:', err);
                            }
                          }
                        }}
                      />
                    </label>
                    <span className="text-slate-400 text-xs font-bold">{language === 'ar' ? 'أو رابط صورة:' : 'Or Image URL:'}</span>
                    <input
                      type="text"
                      placeholder="https://example.com/image.png"
                      value={tempQuestion.imageUrl || ''}
                      onChange={(e) => updateCurrentQuestionField('imageUrl', e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Explanations & dynamic blocks inside form */}
              <div className="flex flex-col gap-5 border-t border-slate-100 pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">
                      {questionActiveLang === 'ar'
                        ? (language === 'ar' ? 'تفسيرات الإجابة والكتل المساعدة (بالعربية)' : 'Answer Explanations (Arabic)')
                        : (language === 'ar' ? 'تفسيرات الإجابة والكتل المساعدة (بالإنجليزية)' : 'Answer Explanations (English)')}
                    </label>
                    <p className="text-slate-400 text-[10px] font-bold mt-0.5">
                      {language === 'ar' ? 'أضف تلميحات أو ملاحظات أو تفسيرات تفصيلية لهذا السؤال' : 'Add hints, tips, or detailed explanations'}
                    </p>
                  </div>
                  <div className="relative" data-dropdown-root="true">
                    <button
                      type="button"
                      onClick={() => setOpenDropdownId(openDropdownId === 'question-sections' ? null : 'question-sections')}
                      className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border border-indigo-100"
                    >
                      <Plus className="w-4 h-4" /> {language === 'ar' ? 'إضافة شريحة مساعدة' : 'Add Block'}
                    </button>
                    <div className={`absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-xl p-2 z-50 ${openDropdownId === 'question-sections' ? "block" : "hidden"}`}>
                      {['EXPLANATION'].map(secType => (
                        <button
                          key={secType}
                          type="button"
                          onClick={() => {
                            addQuestionSection(secType);
                            setOpenDropdownId(null);
                          }}
                          className="w-full text-right px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          {React.createElement(SECTION_STYLE_PRESETS[secType]?.icon || FileText, { className: "w-4 h-4" })}
                          <span>{SECTION_STYLE_PRESETS[secType]?.labelEn || secType}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {(tempQuestion.sections || []).map((sec: any, idx: number) => {
                    const preset = SECTION_STYLE_PRESETS[sec.type] || SECTION_STYLE_PRESETS.EXPLANATION;
                    const IconComponent = preset.icon;
                    const secVal = questionActiveLang === 'ar'
                      ? (sec.content || "")
                      : (sec.contentEn ?? sec.content ?? "");

                    return (
                      <div key={idx} className={`p-6 rounded-3xl border-2 flex flex-col gap-4 relative group ${preset.container}`}>
                        <div className="flex justify-between items-center">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${preset.badge}`}>
                            <IconComponent className="w-3.5 h-3.5" />
                            {preset.labelEn}
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
                              sections[idx] = { ...sections[idx], contentEn: value };
                              setTempQuestion((prev: any) => ({ ...prev, sections, explanationEn: value }));
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

              {/* Options & Choices block */}
              {tempQuestion.type !== "TEXT" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                  {tempQuestion.type === "TRUE_FALSE" ? (
                    <div className="grid grid-cols-2 gap-6 mt-4 col-span-2">
                      <div className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${isQuestionCorrectAnswer(language === 'ar' ? "صحيح" : "True") ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                        <div
                          className={`w-8 h-8 rounded-full border-4 cursor-pointer flex items-center justify-center transition-all ${isQuestionCorrectAnswer(language === 'ar' ? "صحيح" : "True") ? 'bg-emerald-500 border-emerald-200 scale-110' : 'bg-white border-slate-200'}`}
                          onClick={() => updateCurrentQuestionField('correctAnswer', language === 'ar' ? "صحيح" : "True")}
                        >
                          {isQuestionCorrectAnswer(language === 'ar' ? "صحيح" : "True") && <CheckCircle2 className="w-5 h-5 text-white" />}
                        </div>
                        <span className="font-black text-xl text-slate-700">{questionActiveLang === 'ar' ? "صحيح" : "True"}</span>
                      </div>

                      <div className={`flex items-center gap-4 p-5 rounded-[22px] border-2 transition-all ${isQuestionCorrectAnswer(language === 'ar' ? "خطأ" : "False") ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                        <div
                          className={`w-8 h-8 rounded-full border-4 cursor-pointer flex items-center justify-center transition-all ${isQuestionCorrectAnswer(language === 'ar' ? "خطأ" : "False") ? 'bg-emerald-50 border-emerald-200 scale-110' : 'bg-white border-slate-200'}`}
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
                        const baseLength = Math.max((tempQuestion.options || []).length, 4);
                        const currentOptsAr = Array.from({ length: baseLength }, (_, i) => String(tempQuestion.options?.[i] || ''));
                        const currentOptsEn = Array.from({ length: baseLength }, (_, i) => String(tempQuestion.optionsEn?.[i] || ''));
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
                                placeholder={questionActiveLang === 'ar' ? `الخيار ${oIndex + 1} (بدون أ، ب، ج)` : `Option ${oIndex + 1} in English (no A, B, C)`}
                                className="bg-transparent flex-1"
                                value={opt}
                                onChange={(val) => {
                                  if (questionActiveLang === 'ar') {
                                    updateQuestionOption(oIndex, val);
                                  } else {
                                    const updatedEn = [...currentOptsEn];
                                    updatedEn[oIndex] = val;
                                    updateCurrentQuestionField("optionsEn", updatedEn);
                                    if (tempQuestion.correctAnswerIndex === oIndex || (!tempQuestion.correctAnswer && !currentOptsAr[oIndex])) {
                                      updateCurrentQuestionField("correctAnswer", val);
                                      updateCurrentQuestionField("correctAnswerEn", val);
                                    } else if (tempQuestion.correctAnswerIndex === oIndex) {
                                      updateCurrentQuestionField("correctAnswerEn", val);
                                    }
                                  }
                                }}
                              />
                              {baseLength > 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOpts = [...currentOptsAr];
                                    newOpts.splice(oIndex, 1);
                                    const newOptsEn = [...currentOptsEn];
                                    newOptsEn.splice(oIndex, 1);
                                    setTempQuestion({ ...tempQuestion, options: newOpts, optionsEn: newOptsEn });
                                  }}
                                  className="text-red-400 hover:text-red-600 transition-all"
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
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveQuestionForSource(source)}
                  className="px-10 py-4 rounded-2xl font-black bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{language === 'ar' ? 'حفظ السؤال في القائمة' : 'Save Slide to List'}</span>
                  <Save className="w-5 h-5 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };



  return renderQuestionsBuilderFunc();
};
