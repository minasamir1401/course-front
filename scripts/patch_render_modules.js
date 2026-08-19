const fs = require('fs');
const path = require('path');

const replacementJSX = `
              {/* Modules Questions */}
              {modules.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((module: any) => {
                const moduleQuestions = questions.map((q, i) => ({ q, index: i })).filter(item => item.q.moduleId === module.id);
                return (
                  <div key={module.id} className="bg-white border-2 border-indigo-50 rounded-[40px] p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full -z-10" />
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-2xl font-black text-slate-800">{module.title}</h4>
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black">{moduleQuestions.length} {language === 'ar' ? "سؤال" : "questions"}</span>
                        </div>
                        {module.description && <p className="text-slate-500 text-sm mt-1">{module.description}</p>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => { setEditingModuleId(module.id); setCurrentModule({ title: module.title, description: module.description || '' }); setShowModuleForm(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl font-bold text-xs transition-all shadow-sm">
                          {language === 'ar' ? "تعديل الموديول" : "Edit Module"}
                        </button>
                        <button onClick={() => { if(confirm(language === 'ar' ? 'هل أنت متأكد من حذف الموديول؟ (سيتم فصل الأسئلة)' : 'Are you sure you want to delete this module? (Questions will be detached)')) setModules(modules.filter(m => m.id !== module.id)); }} className="flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-bold text-xs transition-all shadow-sm">
                          {language === 'ar' ? "حذف الموديول" : "Delete Module"}
                        </button>
                        <button onClick={() => handleAddQuestion('MCQ', module.id)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs transition-all shadow-sm">
                          {language === 'ar' ? "إضافة سؤال" : "Add Question"}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-4 relative z-10 w-full">
                      {moduleQuestions.length > 0 ? moduleQuestions.map(({ q, index }) => (
                        <div key={examQuestionReactKey(q)} className="bg-white rounded-[30px] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                          <div className="px-6 py-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1 overflow-hidden">
                              <div className="flex flex-col items-center gap-1">
                                <button onClick={() => moveQuestion(index, 'up')} disabled={index === 0} className="text-slate-300 hover:text-indigo-600 disabled:opacity-20 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up w-4 h-4"><path d="m18 15-6-6-6 6"/></svg></button>
                                <span className="w-8 min-w-8 h-8 shrink-0 whitespace-nowrap tabular-nums bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-xs">{index + 1}</span>
                                <button onClick={() => moveQuestion(index, 'down')} disabled={index === questions.length - 1} className="text-slate-300 hover:text-indigo-600 disabled:opacity-20 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down w-4 h-4"><path d="m6 9 6 6 6-6"/></svg></button>
                              </div>
                              <div className="flex flex-col flex-1 overflow-hidden">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">{QUESTION_TYPES.find(t => t.id === q.type)?.label}</span>
                                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase">{q.level} {q.dok ? \`• \${q.dok}\` : ''} • {q.points} {q.points === 1 ? "point" : "points"}</span>
                                </div>
                                <div className="text-slate-700 font-bold truncate text-sm" dangerouslySetInnerHTML={{ __html: q.text.replace(/<[^>]*>?/gm, '').substring(0, 100) + '...' }} />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleEditQuestion(index)} className="w-10 h-10 bg-blue-50 text-blue-400 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit-3 w-5 h-5"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
                              <button onClick={() => removeQuestion(index)} className="w-10 h-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2 w-5 h-5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg></button>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-[30px] text-slate-400 font-bold flex flex-col items-center justify-center gap-3">
                          {language === 'ar' ? "لا يوجد أسئلة في هذا القسم. ابدأ بإضافة سؤال الآن!" : "No questions in this section. Add one now!"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* General Questions (No Module) */}
              {(() => {
                const generalQuestions = questions.map((q, i) => ({ q, index: i })).filter(item => !item.q.moduleId);
                const hasModules = modules && modules.length > 0;
                if (generalQuestions.length === 0 && hasModules) return null;

                return (
                  <div className="bg-white border-2 border-slate-100 rounded-[40px] p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 rounded-bl-full -z-10" />
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-2xl font-black text-slate-800">
                            {language === 'ar' ? "الأسئلة العامة" : "General Questions"}
                          </h4>
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-black">{generalQuestions.length} {language === 'ar' ? "سؤال" : "questions"}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => handleAddQuestion('MCQ')} className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-bold text-xs transition-all shadow-sm">
                          {language === 'ar' ? "إضافة سؤال جديد" : "Add New Question"}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 relative z-10 w-full">
                      {generalQuestions.map(({ q, index }) => (
                        <div key={examQuestionReactKey(q)} className="bg-white rounded-[30px] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                          <div className="px-6 py-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1 overflow-hidden">
                              <div className="flex flex-col items-center gap-1">
                                <button onClick={() => moveQuestion(index, 'up')} disabled={index === 0} className="text-slate-300 hover:text-indigo-600 disabled:opacity-20 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up w-4 h-4"><path d="m18 15-6-6-6 6"/></svg></button>
                                <span className="w-8 min-w-8 h-8 shrink-0 whitespace-nowrap tabular-nums bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-xs">{index + 1}</span>
                                <button onClick={() => moveQuestion(index, 'down')} disabled={index === questions.length - 1} className="text-slate-300 hover:text-indigo-600 disabled:opacity-20 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down w-4 h-4"><path d="m6 9 6 6 6-6"/></svg></button>
                              </div>
                              <div className="flex flex-col flex-1 overflow-hidden">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">{QUESTION_TYPES.find(t => t.id === q.type)?.label}</span>
                                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase">{q.level} {q.dok ? \`• \${q.dok}\` : ''} • {q.points} {q.points === 1 ? "point" : "points"}</span>
                                </div>
                                <div className="text-slate-700 font-bold truncate text-sm" dangerouslySetInnerHTML={{ __html: q.text.replace(/<[^>]*>?/gm, '').substring(0, 100) + '...' }} />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleEditQuestion(index)} className="w-10 h-10 bg-blue-50 text-blue-400 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit-3 w-5 h-5"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
                              <button onClick={() => removeQuestion(index)} className="w-10 h-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2 w-5 h-5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
`;

const filesToPatch = [
  path.join(__dirname, '../src/app/super-admin/exams/new/page.tsx'),
  path.join(__dirname, '../src/app/school-admin/exams/new/page.tsx'),
  path.join(__dirname, '../src/app/super-admin/exams/edit/[id]/page.tsx'),
  path.join(__dirname, '../src/app/school-admin/exams/edit/[id]/page.tsx')
];

for (const f of filesToPatch) {
  let content = fs.readFileSync(f, 'utf8');

  // Replace {showQuestionForm && ...} and the {questions.map} block
  // First, we find the index of `{/* Saved Questions List */}`
  let startIdx = content.indexOf('{/* Saved Questions List */}');
  
  if (startIdx === -1 && f.includes('edit')) {
    // For edit pages, the layout might already have Modules Questions
    startIdx = content.indexOf('{/* Modules Questions */}');
  }

  if (startIdx !== -1) {
    // Find the end of the question list block.
    // In edit page it ends with General Questions.
    // Let's just find the closing tag `</>` or `<div className="flex justify-between items-center bg-white p-6` (the bottom bar)
    const endIdx = content.indexOf('<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mt-10 p-8', startIdx);
    const endIdxAlt = content.indexOf('<div className="flex justify-between items-center bg-white', startIdx);
    
    let finalEndIdx = Math.max(endIdx, endIdxAlt);
    if (finalEndIdx === -1) { // try another common marker
       finalEndIdx = content.indexOf('{/* Question Form Modal */}', startIdx);
    }
    
    if (finalEndIdx !== -1) {
      // Find the closing div of the parent
      const beforeStr = content.substring(0, startIdx);
      const afterStr = content.substring(finalEndIdx);
      content = beforeStr + replacementJSX + '\n              ' + afterStr;
      
      // Update examInfo.modules to setModules in useEffect for edit pages
      if (f.includes('edit')) {
        content = content.replace(/setQuestions\(\s*examData\.questions\.map/g, 'setModules(examData.modules || []);\n          setQuestions(examData.questions.map');
      }

      fs.writeFileSync(f, content);
      console.log('Successfully patched UI blocks in ' + f);
    } else {
      console.log('Could not find end index in ' + f);
    }
  } else {
    console.log('Could not find start index in ' + f);
  }
}
