// @ts-nocheck
import React from 'react';
import { Settings, Layers, CheckCircle2, ListOrdered, Upload, Download, FileText } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import FileUpload from '@/components/FileUpload';
import { CATEGORIES } from '../constants';
import { getGradeName, getSubjectName } from '../utils/examUtils';

export const SettingsPanel = (props: any) => {
  const { examData, setExamData, language, t, toggleCourseSubject, schools, toggleCourseSchool, selectAllSchools, modules, handleExcelUpload, downloadMetadataTemplate, availableMetadata } = props;

  return (
    <>
<div className="lg:col-span-4 space-y-8">
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-600/10 transition-all"></div>
                  <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3 relative z-10">
                    <Settings className="w-6 h-6 text-indigo-600" />
                    {language === 'ar' ? 'إعدادات التقييم' : 'Assessment Settings'}
                  </h2>
                  
                  <div className="space-y-6 relative z-10">
                    {/* Cover Image Upload */}
                    <div className="space-y-3">
                      <FileUpload
                        label={language === 'ar' ? 'صورة غلاف التقييم' : 'Assessment Cover Image'}
                        accept="image/*"
                        value={examData.coverImage}
                        onUploadSuccess={(url) => setExamData({ ...examData, coverImage: url })}
                        tokenKey="school_admin_token"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'عنوان التقييم' : 'Assessment Title'}</label>
                      <input 
                        type="text" 
                        value={examData.title}
                        onChange={(e) => setExamData({...examData, title: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all"
                        placeholder={language === 'ar' ? 'مثال: الرياضيات المتقدمة' : 'e.g. Advanced Mathematics'}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'وصف التقييم' : 'Assessment Description'}</label>
                      <textarea 
                        value={examData.description}
                        onChange={(e) => setExamData({...examData, description: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all min-h-[120px] resize-none"
                        placeholder={language === 'ar' ? 'نبذة مختصرة عن التقييم...' : 'Brief description of the exam...'}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-6">


                      <div className="space-y-4">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">{t('courseCreate.grades')}</label>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-1 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          {[
                            {
                              stage: "Elementary",
                              title: language === 'ar' ? "المرحلة الابتدائية (Primary)" : "Elementary School (Primary)",
                              grades: [
                                "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
                                "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي"
                              ]
                            },
                            {
                              stage: "Middle School",
                              title: language === 'ar' ? "المرحلة الإعدادية (Prep)" : "Middle School (Prep)",
                              grades: [
                                "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي"
                              ]
                            },
                            {
                              stage: "High School",
                              title: language === 'ar' ? "المرحلة الثانوية (Secondary)" : "High School (Secondary)",
                              grades: [
                                "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
                              ]
                            }
                          ].map((group) => {
                            const allSelected = group.grades.every((g: any) => examData.grades.includes(g));
                            
                            return (
                              <div key={group.stage} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm space-y-3">
                                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                  <h4 className="font-black text-sm text-slate-800 flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-indigo-600" />
                                    {group.title}
                                  </h4>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (allSelected) {
                                        setExamData({
                                          ...examData,
                                          grades: examData.grades.filter((g: any) => !group.grades.includes(g))
                                        });
                                      } else {
                                        const newGrades = [...examData.grades];
                                        group.grades.forEach((g: any) => {
                                          if (!newGrades.includes(g)) newGrades.push(g);
                                        });
                                        setExamData({
                                          ...examData,
                                          grades: newGrades
                                        });
                                      }
                                    }}
                                    className="text-xs font-black text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                                  >
                                    {allSelected ? (language === 'ar' ? "إلغاء تحديد الكل" : "تحديد الكل") : (language === 'ar' ? "تحديد الكل" : "Select All")}
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {group.grades.map((g: any) => (
                                    <label key={g} className={`flex items-center gap-2.5 p-2.5 rounded-lg border-2 cursor-pointer transition-all ${examData.grades.includes(g) ? 'bg-indigo-50/50 border-indigo-400' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                                      <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${examData.grades.includes(g) ? 'bg-indigo-600 text-white' : 'bg-slate-100 border border-slate-200'}`}>
                                        {examData.grades.includes(g) && <CheckCircle2 className="w-3.5 h-3.5" />}
                                      </div>
                                      <span className={`text-[11px] sm:text-xs font-bold ${examData.grades.includes(g) ? 'text-indigo-900' : 'text-slate-600'}`}>{getGradeName(g)}</span>
                                      <input type="checkbox" className="hidden" checked={examData.grades.includes(g)} onChange={(e) => {
                                        if(e.target.checked) setExamData({...examData, grades: [...examData.grades, g]});
                                        else setExamData({...examData, grades: examData.grades.filter((gr: any) => gr !== g)});
                                      }} />
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('courseCreate.subjectSpecialization')} <span className="text-red-500">*</span></label>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-[200px] overflow-y-auto custom-scrollbar flex flex-wrap gap-2">
                          {CATEGORIES.map((cat) => (
                            <label
                              key={cat}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                                examData.subjects.includes(cat)
                                  ? "bg-indigo-50 border-indigo-500 text-indigo-900"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={examData.subjects.includes(cat)}
                                onChange={(e) => toggleCourseSubject(cat, e.target.checked)}
                              />
                              <div
                                  className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                                  examData.subjects.includes(cat)
                                    ? "bg-indigo-600 text-white"
                                    : "bg-slate-100 border border-slate-200"
                                }`}
                              >
                                {examData.subjects.includes(cat) && <CheckCircle2 className="w-3 h-3" />}
                              </div>
                              <span className="text-xs font-black">{getSubjectName(cat)}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold">{language === 'ar' ? 'يمكن اختيار أكثر من مادة وسيتم حفظها كوسوم داخل نفس التقييم.' : 'Multiple subjects can be selected and will be saved as tags within the same assessment.'}</p>
                      </div>
                    </div>


                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "المدة (دقائق)" : "Duration (Mins)"}</label>
                        <input
                          type="number"
                          value={examData.duration}
                          onChange={(e) => setExamData({...examData, duration: parseInt(e.target.value) || 60})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "درجة النجاح" : "Passing Score"}</label>
                        <input
                          type="number"
                          value={examData.passingScore}
                          onChange={(e) => setExamData({...examData, passingScore: parseInt(e.target.value) || 50})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "المحاولات" : "Attempts"}</label>
                        <input
                          type="number"
                          value={examData.attemptsAllowed}
                          onChange={(e) => setExamData({...examData, attemptsAllowed: parseInt(e.target.value) || 1})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "كلمة المرور" : "Password"}</label>
                        <input
                          type="text"
                          value={examData.password || ""}
                          onChange={(e) => setExamData({...examData, password: e.target.value})}
                          placeholder={language === 'ar' ? "اختياري" : "Optional"}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "تاريخ البدء" : "Start Date"}</label>
                        <input
                          type="datetime-local"
                          value={examData.startDate || ""}
                          onChange={(e) => setExamData({...examData, startDate: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "تاريخ الانتهاء" : "End Date"}</label>
                        <input
                          type="datetime-local"
                          value={examData.endDate || ""}
                          onChange={(e) => setExamData({...examData, endDate: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                        />
                      </div>
                    </div>
                    </div>

                    {/* Advanced Metadata Excel Upload */}
                    <div className="bg-slate-50 border border-slate-200 p-6 rounded-[35px] space-y-4">
                      <h4 className="font-black text-slate-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        {language === 'ar' ? 'البيانات الوصفية المتقدمة' : 'Advanced Metadata'}
                      </h4>
                      <p className="text-xs text-slate-500 font-bold leading-relaxed">
                        {language === 'ar' ? 'قم برفع ملف الإكسيل الخاص بالبيانات الوصفية (المجالات، المعايير، المؤشرات، نواتج التعلم) ليتم استخدامها كخيارات عند إضافة الأسئلة.' : 'Upload the metadata Excel file (Domains, Standards, Indicators, Outcomes) to be used as options when adding questions.'}
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => handleExcelUpload && handleExcelUpload('metadata')}
                          className="flex-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-indigo-700 px-4 py-3 rounded-2xl font-black flex justify-center items-center gap-2 transition-all shadow-sm text-sm"
                        >
                          <Upload className="w-4 h-4" />
                          {language === 'ar' ? 'رفع ملف الإكسيل' : 'Upload Excel'}
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadMetadataTemplate && downloadMetadataTemplate()}
                          className="flex-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl font-black flex justify-center items-center gap-2 transition-all shadow-sm text-sm"
                        >
                          <Download className="w-4 h-4" />
                          {language === 'ar' ? 'تحميل القالب' : 'Download Template'}
                        </button>
                      </div>
                      
                      {availableMetadata && (availableMetadata.domains?.length > 0 || availableMetadata.standards?.length > 0) && (
                        <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <p className="text-xs text-emerald-700 font-bold leading-relaxed">
                            {language === 'ar' ? 'تم رفع البيانات الوصفية بنجاح وهي متاحة الآن في الأسئلة.' : 'Metadata uploaded successfully and is now available in questions.'}
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[40px] flex items-center gap-6">
                   <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                      <ListOrdered className="w-8 h-8" />
                   </div>
                   <div>
                      <h4 className="text-xl font-black text-slate-900">{language === 'ar' ? 'محتوى التقييم' : 'Assessment Content'}</h4>
                      <p className="text-indigo-600 font-bold">{language === 'ar' ? `تم إضافة ${modules.length} موديولات` : `${modules.length} Modules Added`}</p>
                   </div>
                </div>
              </div>
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[40px] flex items-center gap-6">
                   <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                      <ListOrdered className="w-8 h-8" />
                   </div>
                   <div>
                      <h4 className="text-xl font-black text-slate-900">{language === 'ar' ? 'محتوى الامتحان' : 'Exam Content'}</h4>
                      <p className="text-indigo-600 font-bold">{language === 'ar' ? `تم إضافة ${modules.length} موديولات` : `${modules.length} Modules Added`}</p>
                   </div>
                </div>
              </div>

    </>
  );
};
