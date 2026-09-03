const fs = require('fs');

const files = [
  'd:/mina/front/src/app/super-admin/exams/new/components/ModuleModal.tsx',
  'd:/mina/front/src/app/super-admin/exams/edit/[id]/components/ModuleModal.tsx',
  'd:/mina/front/src/app/school-admin/exams/new/components/ModuleModal.tsx',
  'd:/mina/front/src/app/school-admin/exams/edit/[id]/components/ModuleModal.tsx',
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    const searchStr = `<div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <h4 className="font-black text-indigo-900 text-lg">
                          {currentModule.subExams?.[activeSubExamIndex]?.title || (language === 'ar' ? 'اختبار بدون عنوان' : 'Untitled Exam')}
                        </h4>
                        <button 
                          onClick={() => setActiveSubExamIndex(null)}
                          className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all"
                        >
                          {language === 'ar' ? 'العودة لقائمة الاختبارات' : 'Back to Exams'}
                        </button>
                      </div>`;

    const replaceStr = `<div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6">
                        <div className="flex justify-between items-center">
                          <h4 className="font-black text-indigo-900 text-lg flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            {language === 'ar' ? 'إعدادات الاختبار' : 'Exam Settings'}
                          </h4>
                          <button 
                            onClick={() => setActiveSubExamIndex(null)}
                            className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all flex items-center gap-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={language === 'ar' ? "rotate-180" : ""}><path d="m15 18-6-6 6-6"/></svg>
                            {language === 'ar' ? 'العودة لقائمة الاختبارات' : 'Back to Exams'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      </div>`;

    if (content.includes(searchStr)) {
        content = content.replace(searchStr, replaceStr);
        fs.writeFileSync(file, content, 'utf8');
        console.log('Patched ' + file);
    } else {
        // Handle spacing differences
        const relaxedSearch = /<div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">[\s\S]*?<\/div>/;
        const match = content.match(relaxedSearch);
        if (match) {
            content = content.replace(match[0], replaceStr);
            fs.writeFileSync(file, content, 'utf8');
            console.log('Patched using relaxed regex: ' + file);
        } else {
            console.log('Could not find target string in ' + file);
        }
    }
  }
}
