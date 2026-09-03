// @ts-nocheck
import React from 'react';
import { Settings, Layers, CheckCircle2, ListOrdered, Upload, Download, FileText } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import FileUpload from '@/components/FileUpload';
import { CATEGORIES } from '../constants';
import { getGradeName, getSubjectName } from '../utils/examUtils';

export const SettingsPanel = (props: any) => {
  const { examData, setExamData, language, t, toggleCourseSubject, schools, toggleCourseSchool, selectAllSchools, modules, handleExcelUpload, downloadMetadataTemplate, availableMetadata, showToast, setShowSettings, moduleMode, currentModule, setCurrentModule } = props;

  const handleLock = () => {
    setShowSettings?.(false);
    if (showToast) {
      showToast(language === 'ar' ? 'تم حفظ وإخفاء الإعدادات بنجاح' : 'Settings saved and hidden successfully', 'success');
    }
  };

  return (
    <>
      <div className="lg:col-span-4 space-y-8">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-600/10 transition-all"></div>
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <Settings className="w-6 h-6 text-indigo-600" />
              {language === 'ar' ? 'إعدادات الموديول' : 'Module Settings'}
            </h2>
            {!moduleMode && <button
                type="button" 
                onClick={handleLock}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md active:scale-95 cursor-pointer"
              >
                {language === 'ar' ? 'حفظ وإخفاء' : 'Save & Hide'}
              </button>}
          </div>

          <div className="space-y-6 relative z-10 transition-all duration-300">
            {/* Cover Image Upload */}
            <div className="space-y-3">
              <FileUpload
                label={language === 'ar' ? 'صورة غلاف التقييم' : 'Assessment Cover Image'}
                accept="image/*"
                value={examData.coverImage}
                onUploadSuccess={(url) => setExamData({ ...examData, coverImage: url })}
                tokenKey="super_admin_token"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? (moduleMode ? 'عنوان الموديول' : 'عنوان التقييم') : (moduleMode ? 'Module Title' : 'Assessment Title')}</label>
              <input
                type="text"
                value={moduleMode ? (currentModule?.title || '') : examData.title}
                onChange={(e) => {
                  if (moduleMode) {
                    setCurrentModule({ ...currentModule, title: e.target.value });
                    setExamData({ ...examData, title: e.target.value });
                    return;
                  }
                  setExamData({ ...examData, title: e.target.value });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all"
                placeholder={language === 'ar' ? (moduleMode ? 'مثال: القوة والحركة' : 'مثال: تقييم الرياضيات المتقدمة') : (moduleMode ? 'e.g. Force and Motion' : 'e.g. Advanced Mathematics Assessment')}
              />
            </div>

            {moduleMode && <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'القسم' : 'Section'}</label><input type="text" value={currentModule?.section || ''} onChange={(e) => setCurrentModule({ ...currentModule, section: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600" /></div>
              <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'المجال الداخلي' : 'Internal Domain'}</label><input type="text" value={currentModule?.domain || ''} onChange={(e) => setCurrentModule({ ...currentModule, domain: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600" /></div>
              <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'تاريخ النشر' : 'Publish Date'}</label><input type="datetime-local" value={currentModule?.publishDate || ''} onChange={(e) => setCurrentModule({ ...currentModule, publishDate: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-xs font-bold outline-none focus:border-emerald-500" /></div><div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'تاريخ الإغلاق' : 'Cut-off Date'}</label><input type="datetime-local" value={currentModule?.cutOffDate || ''} onChange={(e) => setCurrentModule({ ...currentModule, cutOffDate: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-xs font-bold outline-none focus:border-rose-500" /></div></div>
            </div>}

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
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                          {group.grades.map((g: any) => (
                            <label key={g} className={`flex min-w-0 items-center gap-2.5 p-2.5 rounded-lg border-2 cursor-pointer transition-all ${examData.grades.includes(g) ? 'bg-indigo-50/50 border-indigo-400' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                              <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${examData.grades.includes(g) ? 'bg-indigo-600 text-white' : 'bg-slate-100 border border-slate-200'}`}>
                                {examData.grades.includes(g) && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </div>
                              <span className={`min-w-0 whitespace-nowrap text-[11px] sm:text-xs font-bold ${examData.grades.includes(g) ? 'text-indigo-900' : 'text-slate-600'}`}>{getGradeName(g)}</span>
                              <input type="checkbox" className="hidden" checked={examData.grades.includes(g)} onChange={(e) => {
                                if (e.target.checked) setExamData({ ...examData, grades: [...examData.grades, g] });
                                else setExamData({ ...examData, grades: examData.grades.filter((gr: any) => gr !== g) });
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
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${examData.subjects.includes(cat)
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
                        className={`w-5 h-5 rounded flex items-center justify-center transition-all ${examData.subjects.includes(cat)
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
                <p className="text-[10px] text-slate-400 font-bold">{language === 'ar' ? 'يمكن اختيار أكثر من مجال وسيتم حفظها داخل نفس الموديول.' : 'Multiple domains can be selected and will be saved within the same module.'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'نوع التقييم' : 'Assessment Type'}</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="assessmentType" checked={examData.isCentral} onChange={() => setExamData({ ...examData, isCentral: true, schoolIds: [] })} className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                  <span className="text-sm font-bold text-slate-700">{language === 'ar' ? 'مركزي (لجميع المدارس)' : 'Centralized (All Schools)'}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="assessmentType" checked={!examData.isCentral} onChange={() => setExamData({ ...examData, isCentral: false })} className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                  <span className="text-sm font-bold text-slate-700">{language === 'ar' ? 'مخصص لمدارس محددة' : 'Specific Schools'}</span>
                </label>
              </div>

              {!examData.isCentral && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'إسناد التقييم للمدرسة' : 'Assign Assessment to School'}</label>
                  {schools.length === 0 ? (
                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-500 font-bold text-sm">
                      {language === 'ar' ? 'لا توجد مدارس متاحة' : 'No schools available'}
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center px-2 mb-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'اختر المدارس (اختياري)' : 'Select Schools (Optional)'}</span>
                        <button
                          type="button"
                          onClick={selectAllSchools}
                          className="text-[10px] font-black text-indigo-600 hover:underline"
                        >
                          {(examData.schoolIds || []).length === schools.length ? (language === 'ar' ? 'إلغاء الكل' : 'Deselect All') : (language === 'ar' ? 'تحديد الكل' : 'Select All')}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-[250px] overflow-y-auto custom-scrollbar">
                        {schools.map((s) => (
                          <label
                            key={s.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${(examData.schoolIds || []).includes(s.id)
                                ? "bg-indigo-50 border-indigo-500"
                                : "bg-white border-transparent hover:border-slate-200"
                              }`}
                          >
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={(examData.schoolIds || []).includes(s.id)}
                              onChange={() => toggleCourseSchool(s.id)}
                            />
                            <div
                              className={`w-5 h-5 rounded flex items-center justify-center transition-all ${(examData.schoolIds || []).includes(s.id)
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-100 border border-slate-200"
                                }`}
                            >
                              {(examData.schoolIds || []).includes(s.id) && <CheckCircle2 className="w-3 h-3" />}
                            </div>
                            <span className="text-xs font-bold text-slate-700">{s.name}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {language === 'ar' ? 'لو ما اخترتش مدارس: التقييم يبقى مركزي. لو اخترت أكثر من مدرسة: النظام هيعمل نسخة من نفس التقييم لكل مدرسة.' : 'If no schools are selected, the assessment remains central. If multiple schools are selected, a copy will be created for each school.'}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {!moduleMode && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "المدة (دقائق)" : "Duration (Mins)"}</label>
                    <input
                      type="number"
                      value={examData.duration}
                      onChange={(e) => setExamData({ ...examData, duration: parseInt(e.target.value) || 60 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "درجة النجاح" : "Passing Score"}</label>
                    <input
                      type="number"
                      value={examData.passingScore}
                      onChange={(e) => setExamData({ ...examData, passingScore: parseInt(e.target.value) || 50 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "المحاولات" : "Attempts"}</label>
                    <input
                      type="number"
                      value={examData.attemptsAllowed ?? ""}
                      onChange={(e) => setExamData({ ...examData, attemptsAllowed: e.target.value === '' ? '' : parseInt(e.target.value) })}
                      placeholder={language === 'ar' ? "مفتوح (بدون حد)" : "Unlimited"}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "كلمة المرور" : "Password"}</label>
                    <input
                      type="text"
                      value={examData.password || ""}
                      onChange={(e) => setExamData({ ...examData, password: e.target.value })}
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
                      onChange={(e) => setExamData({ ...examData, startDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "تاريخ الانتهاء" : "End Date"}</label>
                    <input
                      type="datetime-local"
                      value={examData.endDate || ""}
                      onChange={(e) => setExamData({ ...examData, endDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "سياسة النتيجة" : "Result Policy"}</label>
                  <select
                    value={examData.resultVisibility}
                    onChange={(e) => setExamData({ ...examData, resultVisibility: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                  >
                    <option value="SHOW_SCORE">{language === 'ar' ? "إظهار النتيجة فقط" : "Show Score Only"}</option>
                    <option value="SHOW_SCORE_ANSWERS">{language === 'ar' ? "إظهار النتيجة والإجابات" : "Show Score & Answers"}</option>
                    <option value="HIDDEN">{language === 'ar' ? "إخفاء النتيجة" : "Hidden"}</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {modules && modules.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[40px] flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
              <ListOrdered className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-900">{language === 'ar' ? 'محتوى التقييم' : 'Assessment Content'}</h4>
              <p className="text-indigo-600 font-bold">{language === 'ar' ? `تم إضافة ${modules.length} موديولات` : `${modules.length} Modules Added`}</p>
            </div>
          </div>
        )}
      </div>

    </>
  );
};
