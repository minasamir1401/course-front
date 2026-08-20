// @ts-nocheck
import { useNotification } from '@/context/NotificationContext';
import React from 'react';
import { createPortal } from 'react-dom';
import { Monitor, X, Target, Clock, HelpCircle, Upload, Download, FileText, Trash2, Plus, CheckCircle2, AlertCircle, Edit2, Settings, ListOrdered } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import FileUpload from '@/components/FileUpload';
import * as XLSX from "xlsx";

export const ModuleModal = (props: any) => {
  const { showToast } = useNotification();
  const [editingTitleIndex, setEditingTitleIndex] = React.useState<number | null>(null);
  const [editingTitleValue, setEditingTitleValue] = React.useState('');
  const { isModuleModalOpen, language, editingModuleIndex, currentModule, setIsModuleModalOpen, activeTab, setActiveTab, setCurrentModule, availableMetadata, t, metadataExcelRef, handleMetadataExcelChange, handleExcelUpload, downloadMetadataTemplate, renderSlidesBuilder, renderQuestionsBuilder, saveModule, standaloneQuestions, visibleStandaloneCount, handleEditStandaloneQuestion, removeStandaloneQuestion, setVisibleStandaloneCount, activeSubExamIndex, setActiveSubExamIndex } = props;

  if (!isModuleModalOpen || typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 sm:p-6 md:p-8 animate-in fade-in duration-300">
        <div className="bg-white border border-slate-200 w-full max-w-7xl h-[100dvh] sm:h-auto sm:max-h-[95vh] rounded-[24px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
          {/* Modal Header */}
          <div className="bg-slate-900 p-3 sm:p-8 flex justify-between items-center gap-3">
            <div className="min-w-0">
              <h3 className="text-base sm:text-2xl font-black text-white flex items-center gap-2 sm:gap-3 truncate">
                <Monitor className="w-8 h-8" />
                {editingModuleIndex !== null ? (language === 'ar' ? `تعديل الموديول: ${currentModule.title}` : `Edit Module: ${currentModule.title}`) : (language === 'ar' ? "إضافة موديول جديد" : "Design New Module")}
              </h3>
              <p className="hidden sm:block text-slate-400 mt-1 font-bold">{language === 'ar' ? "بناء محتوى الموديول والأسئلة" : "Build module content and questions"}</p>
            </div>
            <button onClick={() => setIsModuleModalOpen(false)} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 overflow-x-auto shrink-0 custom-scrollbar">
            {[
              { id: 'info', label: language === 'ar' ? "معلومات الموديول" : "Module Info", icon: Target },
              { id: 'scheduling', label: language === 'ar' ? "الجدولة والظهور" : "Scheduling & Visibility", icon: Clock },
              { id: 'exercises', label: language === 'ar' ? "الاختبارات" : "Exams", icon: HelpCircle },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-5 flex items-center justify-center gap-3 font-black text-sm transition-all ${activeTab === tab.id ? 'text-indigo-600 bg-white border-b-2 border-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                  }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 p-5 sm:p-8 lg:p-12 overflow-y-auto custom-scrollbar overscroll-contain">
            {activeTab === 'info' && (
              <div className="space-y-10">
                <div className="grid grid-cols-1 gap-8">
                  <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{language === 'ar' ? "عنوان الاختبار" : "Exam Title"}</label>
                    <input
                      type="text"
                      value={currentModule.title}
                      onChange={(e) => setCurrentModule({ ...currentModule, title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 text-lg font-bold outline-none focus:border-indigo-600 transition-all shadow-sm"
                      placeholder={language === 'ar' ? "مثال: القوة والحركة في اتجاه واحد" : "e.g. Force and Motion in One Dimension"}
                    />
                  </div>
                </div>


                <div className="bg-white p-8 rounded-[35px] border border-slate-100 space-y-8">
                   <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                      <Target className="w-6 h-6 text-indigo-600" />
                      {language === 'ar' ? "بيانات الاختبار الأساسية" : "Basic Assessment Info"}
                   </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">{language === 'ar' ? "الاختبار (Exam)" : "Exam"}</label>
                        <input 
                          type="text"
                          value={currentModule.course || ""}
                          onChange={(e) => setCurrentModule({...currentModule, course: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 text-sm outline-none focus:border-indigo-600 shadow-sm font-bold"
                          placeholder={language === 'ar' ? "الاختبار" : "Exam"}
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">{language === 'ar' ? "القسم (Section)" : "Section"}</label>
                        <input 
                          type="text"
                          value={currentModule.section || ""}
                          onChange={(e) => setCurrentModule({...currentModule, section: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 text-sm outline-none focus:border-indigo-600 shadow-sm font-bold"
                          placeholder={language === 'ar' ? "القسم" : "Section"}
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">{language === 'ar' ? "المجال (Domain)" : "Domain"}</label>
                        <input 
                          type="text"
                          value={currentModule.domain || ""}
                          onChange={(e) => setCurrentModule({...currentModule, domain: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 text-sm outline-none focus:border-indigo-600 shadow-sm font-bold"
                          placeholder={language === 'ar' ? "المجال" : "Domain"}
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">{language === 'ar' ? "الصفوف المستهدفة (Target Grades)" : "Target Grades"}</label>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 max-h-[120px] overflow-y-auto custom-scrollbar flex flex-wrap gap-2">
                           {['KG1', 'KG2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map(g => {
                             const grades = currentModule.gradeTarget ? currentModule.gradeTarget.split(',').filter(Boolean) : [];
                             const isSelected = grades.includes(g);
                             return (
                               <label key={g} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-indigo-50 border-indigo-500 text-indigo-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                  <input type="checkbox" className="hidden" checked={isSelected} onChange={() => {
                                    if (isSelected) {
                                      setCurrentModule({...currentModule, gradeTarget: grades.filter(x => x !== g).join(',')});
                                    } else {
                                      setCurrentModule({...currentModule, gradeTarget: [...grades, g].join(',')});
                                    }
                                  }} />
                                  <span className="text-[10px] font-black">{g}</span>
                               </label>
                             );
                           })}
                        </div>
                      </div>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'scheduling' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="bg-indigo-50/50 border border-indigo-100 p-8 rounded-[35px] flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xl font-black text-indigo-900">{language === 'ar' ? "ظهور الموديول" : "Module Visibility"}</h4>
                    <p className="text-indigo-600/60 font-bold text-sm">{language === 'ar' ? "التحكم في إمكانية رؤية الطلاب لهذا الموديول حالياً" : "Control whether students can see this module currently"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentModule({ ...currentModule, isVisible: !currentModule.isVisible })}
                    className={`w-20 h-10 rounded-full relative transition-all duration-300 ${currentModule.isVisible ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-8 h-8 bg-white rounded-full transition-all duration-300 ${currentModule.isVisible ? (language === 'ar' ? 'left-1' : 'right-11') : (language === 'ar' ? 'left-11' : 'right-1')}`}></div>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 text-emerald-600">
                      <CheckCircle2 className="w-6 h-6" />
                      <label className="text-sm font-black uppercase tracking-widest">{language === 'ar' ? "تاريخ النشر" : "Publish Date"}</label>
                    </div>
                    <p className="text-slate-400 text-xs font-bold">{language === 'ar' ? "لن يظهر الموديول للطلاب قبل هذا التاريخ حتى لو تم تمكين الظهور" : "The module will not appear to students before this date even if Visibility is enabled"}</p>
                    <input
                      type="datetime-local"
                      value={currentModule.publishDate || ""}
                      onChange={(e) => setCurrentModule({ ...currentModule, publishDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 text-red-500">
                      <AlertCircle className="w-6 h-6" />
                      <label className="text-sm font-black uppercase tracking-widest">{language === 'ar' ? "تاريخ الإيقاف / الحذف" : "Cut-off Date"}</label>
                    </div>
                    <p className="text-slate-400 text-xs font-bold">{language === 'ar' ? "سيختفي الموديول تلقائياً من واجهة الطالب بعد هذا التاريخ" : "The module will automatically disappear from the student interface after this date"}</p>
                    <input
                      type="datetime-local"
                      value={currentModule.cutOffDate || ""}
                      onChange={(e) => setCurrentModule({ ...currentModule, cutOffDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-bold text-slate-700 outline-none focus:border-red-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'slides' && renderSlidesBuilder('slides')}

            {activeTab === 'assignments' && renderQuestionsBuilder('assignments')}

            {activeTab === 'exercises' && (
              activeSubExamIndex !== null ? (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-indigo-900 text-lg flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        {language === 'ar' ? 'إعدادات الاختبار' : 'Exam Settings'}
                      </h4>
                      <button
                        onClick={() => setActiveSubExamIndex(null)}
                        className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={language === 'ar' ? "rotate-180" : ""}><path d="m15 18-6-6 6-6" /></svg>
                        {language === 'ar' ? 'العودة لقائمة الاختبارات' : 'Back to Exams'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{language === 'ar' ? 'عنوان الاختبار' : 'Exam Title'}</label>
                        <input 
                          type="text"
                          value={currentModule.subExams?.[activeSubExamIndex]?.title || ''}
                          onChange={(e) => {
                            const newSubExams = [...(currentModule.subExams || [])];
                            newSubExams[activeSubExamIndex].title = e.target.value;
                            setCurrentModule({ ...currentModule, subExams: newSubExams });
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{language === 'ar' ? 'اسم الكورس' : 'Course Name'}</label>
                        <input 
                          type="text"
                          value={currentModule.subExams?.[activeSubExamIndex]?.courseName || ''}
                          onChange={(e) => {
                            const newSubExams = [...(currentModule.subExams || [])];
                            newSubExams[activeSubExamIndex].courseName = e.target.value;
                            setCurrentModule({ ...currentModule, subExams: newSubExams });
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{language === 'ar' ? 'الدومين' : 'Domain'}</label>
                        <input 
                          type="text"
                          value={currentModule.subExams?.[activeSubExamIndex]?.domainName || ''}
                          onChange={(e) => {
                            const newSubExams = [...(currentModule.subExams || [])];
                            newSubExams[activeSubExamIndex].domainName = e.target.value;
                            setCurrentModule({ ...currentModule, subExams: newSubExams });
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all shadow-sm"
                        />
                      </div>
                      <div className="relative group">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{language === 'ar' ? 'الصفوف المستهدفة' : 'Target Grades'}</label>
                        <div className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all shadow-sm cursor-pointer min-h-[46px] flex items-center">
                          {currentModule.subExams?.[activeSubExamIndex]?.targetGrades?.length > 0 
                            ? currentModule.subExams[activeSubExamIndex].targetGrades.join(', ')
                            : (language === 'ar' ? 'اختر الصفوف' : 'Select Grades')}
                        </div>
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 hidden group-hover:block max-h-48 overflow-y-auto p-2">
                          {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map(grade => (
                            <label key={grade} className="flex items-center gap-2 p-2 hover:bg-slate-50 cursor-pointer rounded-lg">
                              <input 
                                type="checkbox" 
                                checked={currentModule.subExams?.[activeSubExamIndex]?.targetGrades?.includes(grade) || false}
                                onChange={(e) => {
                                  const newSubExams = [...(currentModule.subExams || [])];
                                  const currentGrades = newSubExams[activeSubExamIndex].targetGrades || [];
                                  if (e.target.checked) {
                                    newSubExams[activeSubExamIndex].targetGrades = [...currentGrades, grade];
                                  } else {
                                    newSubExams[activeSubExamIndex].targetGrades = currentGrades.filter((g: string) => g !== grade);
                                  }
                                  setCurrentModule({ ...currentModule, subExams: newSubExams });
                                }}
                              />
                              <span className="text-sm font-bold text-slate-700">{grade}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{language === 'ar' ? 'مدة الاختبار (بالدقائق)' : 'Duration (mins)'}</label>
                        <input 
                          type="number"
                          value={currentModule.subExams?.[activeSubExamIndex]?.duration || ''}
                          onChange={(e) => {
                            const newSubExams = [...(currentModule.subExams || [])];
                            newSubExams[activeSubExamIndex].duration = e.target.value ? Number(e.target.value) : undefined;
                            setCurrentModule({ ...currentModule, subExams: newSubExams });
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{language === 'ar' ? 'درجة النجاح (%)' : 'Passing Score (%)'}</label>
                        <input 
                          type="number"
                          value={currentModule.subExams?.[activeSubExamIndex]?.passingScore || ''}
                          onChange={(e) => {
                            const newSubExams = [...(currentModule.subExams || [])];
                            newSubExams[activeSubExamIndex].passingScore = e.target.value ? Number(e.target.value) : undefined;
                            setCurrentModule({ ...currentModule, subExams: newSubExams });
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{language === 'ar' ? 'المحاولات المسموحة' : 'Attempts Allowed'}</label>
                        <input 
                          type="number"
                          value={currentModule.subExams?.[activeSubExamIndex]?.attemptsAllowed || ''}
                          onChange={(e) => {
                            const newSubExams = [...(currentModule.subExams || [])];
                            newSubExams[activeSubExamIndex].attemptsAllowed = e.target.value ? Number(e.target.value) : undefined;
                            setCurrentModule({ ...currentModule, subExams: newSubExams });
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                  {renderQuestionsBuilder('questions')}
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in p-2 sm:p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xl font-black text-slate-900">{language === 'ar' ? "الاختبارات (Exams)" : "Exams"}</h4>
                    <button
                      onClick={() => {
                        const newSubExams = [...(currentModule.subExams || [])];
                        newSubExams.push({ id: String(Date.now()), title: language === 'ar' ? "اختبار جديد" : "New Exam", questions: [] });
                        setCurrentModule({ ...currentModule, subExams: newSubExams });
                        setActiveSubExamIndex(newSubExams.length - 1);
                      }}
                      className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 hover:bg-indigo-700 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      {language === 'ar' ? "إضافة اختبار جديد" : "Add New Exam"}
                    </button>
                  </div>

                  {(currentModule.subExams?.length || 0) === 0 ? (
                    <div className="text-center p-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                      <p className="text-slate-500 font-bold mb-4">{language === 'ar' ? "لا يوجد اختبارات في هذا الموديول بعد" : "No exams in this module yet"}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentModule.subExams.map((subExam: any, idx: number) => (
                        <div key={idx} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:border-indigo-400 transition-all flex justify-between items-center group cursor-pointer" onClick={() => setActiveSubExamIndex(idx)}>
                          <div>
                            {editingTitleIndex === idx ? (
                              <input
                                autoFocus
                                className="w-full bg-slate-100 border border-indigo-300 rounded px-3 py-1 text-base outline-none text-slate-800 font-bold"
                                value={editingTitleValue}
                                onClick={e => e.stopPropagation()}
                                onChange={e => setEditingTitleValue(e.target.value)}
                                onBlur={() => {
                                  const newSubExams = [...(currentModule.subExams || [])];
                                  newSubExams[idx].title = editingTitleValue || newSubExams[idx].title;
                                  setCurrentModule({ ...currentModule, subExams: newSubExams });
                                  setEditingTitleIndex(null);
                                }}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    const newSubExams = [...(currentModule.subExams || [])];
                                    newSubExams[idx].title = editingTitleValue || newSubExams[idx].title;
                                    setCurrentModule({ ...currentModule, subExams: newSubExams });
                                    setEditingTitleIndex(null);
                                  }
                                }}
                              />
                            ) : (
                              <h5 className="font-black text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">
                                {subExam.title || (language === 'ar' ? 'اختبار بدون عنوان' : 'Untitled Exam')}
                              </h5>
                            )}
                            <p className="text-slate-400 text-xs font-bold mt-1">
                              {subExam.questions?.length || 0} {language === 'ar' ? 'أسئلة' : 'Questions'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTitleIndex(idx);
                                setEditingTitleValue(subExam.title || '');
                              }}
                              className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا الاختبار؟" : "Are you sure you want to delete this exam?")) {
                                  const newSubExams = [...(currentModule.subExams || [])];
                                  newSubExams.splice(idx, 1);
                                  setCurrentModule({ ...currentModule, subExams: newSubExams });
                                }
                              }}
                              className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}

            {activeTab === 'attachments' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xl font-black text-slate-900">{t('courseCreate.attachments') || "Files & Attachments"}</h4>
                  <button
                    onClick={() => setCurrentModule({ ...currentModule, attachments: [...(currentModule.attachments || []), { name: "", url: "", type: "PDF" }] })}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    {t('courseCreate.addFile') || "Add File"}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {(currentModule.attachments || []).map((att: any, attIdx: number) => (
                    <div key={attIdx} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                          <FileText className="w-6 h-6" />
                        </div>
                        <button
                          onClick={() => {
                            const atts = [...currentModule.attachments];
                            atts.splice(attIdx, 1);
                            setCurrentModule({ ...currentModule, attachments: atts });
                          }}
                          className="text-red-500 hover:text-red-600 p-2"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={att.name}
                          onChange={(e) => {
                            const atts = [...currentModule.attachments];
                            atts[attIdx].name = e.target.value;
                            setCurrentModule({ ...currentModule, attachments: atts });
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-sm outline-none focus:border-indigo-600"
                          placeholder={t('courseCreate.fileName') || "File Name"}
                        />
                        <div className="flex gap-3">
                          <select
                            value={att.type}
                            onChange={(e) => {
                              const atts = [...currentModule.attachments];
                              atts[attIdx].type = e.target.value;
                              setCurrentModule({ ...currentModule, attachments: atts });
                            }}
                            className="w-32 bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-xs outline-none focus:border-indigo-600"
                          >
                            <option value="PDF">PDF</option>
                            <option value="PPT">PPT</option>
                            <option value="DOC">DOC</option>
                            <option value="XLS">XLS</option>
                            <option value="IMAGE">IMAGE</option>
                          </select>
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={att.url}
                              onChange={(e) => {
                                const atts = [...currentModule.attachments];
                                atts[attIdx].url = e.target.value;
                                setCurrentModule({ ...currentModule, attachments: atts });
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-xs outline-none text-left font-mono focus:border-indigo-600"
                              placeholder={t('courseCreate.externalUrl') || "External File URL (URL)"}
                              dir="ltr"
                            />
                            <label className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl cursor-pointer transition-all flex items-center justify-center shrink-0 shadow-sm border border-indigo-200" title={language === 'ar' ? "رفع ملف (PDF, PPT, DOC...)" : "Upload File"}>
                              <Upload className="w-4 h-4" />
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,image/*"
                                onChange={async (e: any) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const { uploadFileToServer } = await import("@/lib/image-utils");
                                      const url = await uploadFileToServer(file);
                                      const atts = [...currentModule.attachments];
                                      atts[attIdx].url = url;
                                      if (!atts[attIdx].name) atts[attIdx].name = file.name;
                                      if (file.name.toLowerCase().endsWith('.pdf')) atts[attIdx].type = 'PDF';
                                      else if (file.name.match(/\.(ppt|pptx)$/i)) atts[attIdx].type = 'PPT';
                                      else if (file.name.match(/\.(doc|docx)$/i)) atts[attIdx].type = 'DOC';
                                      else if (file.name.match(/\.(xls|xlsx)$/i)) atts[attIdx].type = 'XLS';
                                      else if (file.type.startsWith('image/')) atts[attIdx].type = 'IMAGE';
                                      setCurrentModule({ ...currentModule, attachments: atts });
                                      showToast(language === 'ar' ? "تم رفع الملف بنجاح ✅" : "File uploaded successfully ✅", "success");
                                    } catch (error) {
                                      showToast(language === 'ar' ? "فشل رفع الملف ❌" : "File upload failed ❌", "error");
                                    }
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Standalone Questions */}
            {/* Standalone Questions Restored Grid */}
            <div className="mt-12 standalone-questions-section">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {standaloneQuestions.slice(0, visibleStandaloneCount).map((q: any, index: number) => (
                  <div key={index} className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center font-black text-slate-500">
                          {index + 1}
                        </div>
                        <div>
                          <span className="text-xs font-black px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full">{q.type || 'MCQ'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.preventDefault(); handleEditStandaloneQuestion(index); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={(e) => { e.preventDefault(); removeStandaloneQuestion(index); }} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="text-slate-800 font-bold line-clamp-3 text-sm flex-1" dangerouslySetInnerHTML={{ __html: q.text }} />
                    <div className="text-xs font-bold text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-auto">
                      {language === 'ar' ? 'الإجابة:' : 'Answer:'} <span className="text-emerald-600 ml-1">{q.correctAnswer || (q.correctAnswers?.join(', ') || '-')}</span>
                    </div>
                  </div>
                ))}
                {standaloneQuestions.length > visibleStandaloneCount && (
                  <div className="col-span-1 md:col-span-2 flex justify-center mt-6">
                    <button
                      onClick={(e) => { e.preventDefault(); setVisibleStandaloneCount(prev => prev + 50); }}
                      className="bg-indigo-50 text-indigo-600 px-8 py-3 rounded-2xl font-black hover:bg-indigo-100 hover:scale-105 transition-all shadow-sm"
                    >
                      {language === 'ar' ? 'عرض المزيد من الأسئلة' : 'Load More Questions'} ({standaloneQuestions.length - visibleStandaloneCount} {language === 'ar' ? 'متبقي' : 'Remaining'})
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
            <button
              onClick={() => setIsModuleModalOpen(false)}
              className="px-10 py-4 rounded-2xl bg-white border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all"
            >
              {t('courseCreate.cancelChanges') || "Cancel Changes"}
            </button>
            <button
              onClick={saveModule}
              className="px-12 py-4 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/20 flex items-center gap-3"
            >
              {language === 'ar' ? "تأكيد وحفظ" : "Confirm & Save"}
              <CheckCircle2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
