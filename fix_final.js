const fs = require('fs');

function refactorFile(filepath, isSchoolAdmin) {
    let content = fs.readFileSync(filepath, 'utf8');

    // 1. Signature
    content = content.replace(
        "const handleAddQuestion = (type: string = 'MCQ') => {", 
        "const handleAddQuestion = (type: string = 'MCQ', moduleId: string | null = null) => {"
    );

    // 2. Init
    let oldInit = 'sections: [{ type: "EXPLANATION", content: "" }], imageUrl: "", correctAnswers: [],\n    });';
    let newInit = 'sections: [{ type: "EXPLANATION", content: "" }], imageUrl: "", correctAnswers: [], moduleId: moduleId || null,\n    });';
    if (content.includes(oldInit)) {
        content = content.replace(oldInit, newInit);
    } else {
        let oldInit2 = 'sections: [{ type: "EXPLANATION", content: "" }], imageUrl: "", correctAnswers: []\n    });';
        let newInit2 = 'sections: [{ type: "EXPLANATION", content: "" }], imageUrl: "", correctAnswers: [], moduleId: moduleId || null\n    });';
        content = content.replace(oldInit2, newInit2);
    }

    // 3. Delete old management flow block exactly up to the next component
    let regex = /\{\/\* Questions Management Flow \*\/\}[\s\S]*?(?=\{\/\* Saved Questions List \*\/\}|\{showQuestionForm && editingIndex === null && renderQuestionForm\(\)\})/;
    content = content.replace(regex, "");

    // 4. Remove the global Add buttons
    let btnText = /<button\s+onClick=\{\(\) => handleAddQuestion\('TEXT'\)\}\s+className="[^"]*"\s*>\s*<Plus className="[^"]*" \/>\s*<span>(?:\{language === 'ar' \? "[^"]*" : "[^"]*"\}|شريحة نصية)<\/span>\s*<\/button>/g;
    let btnMcq = /<button\s+onClick=\{\(\) => handleAddQuestion\('MCQ'\)\}\s+className="[^"]*"\s*>\s*<Plus className="[^"]*" \/>\s*<span>(?:\{language === 'ar' \? "[^"]*" : "[^"]*"\}|شريحة سؤال)<\/span>\s*<\/button>/g;
    content = content.replace(btnText, "");
    content = content.replace(btnMcq, "");

    // 5. Replace the questions list rendering
    let mapStartStr = "{questions.map((q, index) => (";
    let searchAfter = isSchoolAdmin ? "<div className=\"space-y-4\">" : "{/* Saved Questions List */}";
    
    let mapStartIdx = content.indexOf(mapStartStr, content.indexOf(searchAfter));
    if (mapStartIdx !== -1) {
        let endMarker = "                    ))}";
        let mapEndIdx = content.indexOf(endMarker, mapStartIdx) + endMarker.length;
        
        let oldList = content.substring(mapStartIdx, mapEndIdx);
        let cardContent = oldList.substring(mapStartStr.length, oldList.length - endMarker.length).trim();
        
        const newRendering = `{/* Grouped Questions List */}
                  <div className="space-y-12 w-full max-w-full">
                    {/* Modules Questions */}
                    {(examInfo.modules || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((module: any) => {
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
                              <button onClick={() => handleAddQuestion('TEXT', module.id)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition-all shadow-sm">
                                <Plus className="w-4 h-4" />
                                {language === 'ar' ? "إضافة نص" : "Add Text"}
                              </button>
                              <button onClick={() => handleAddQuestion('MCQ', module.id)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs transition-all shadow-sm">
                                <Plus className="w-4 h-4" />
                                {language === 'ar' ? "إضافة سؤال" : "Add Question"}
                              </button>
                            </div>
                          </div>
                          
                          <div className="space-y-4 relative z-10 w-full">
                            {moduleQuestions.length > 0 ? moduleQuestions.map(({ q, index }) => (
${cardContent}
                            )) : (
                               <div className="text-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-[30px] text-slate-400 font-bold flex flex-col items-center justify-center gap-3">
                                 <HelpCircle className="w-8 h-8 text-slate-300" />
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
                      if (generalQuestions.length === 0 && (examInfo.modules?.length || 0) > 0) return null;
                      
                      return (
                        <div className="bg-white border-2 border-slate-100 rounded-[40px] p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 rounded-bl-full -z-10" />
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h4 className="text-2xl font-black text-slate-800">
                                  {language === 'ar' ? "أسئلة عامة (بدون موديول)" : "General Questions (No Module)"}
                                </h4>
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-black">{generalQuestions.length} {language === 'ar' ? "سؤال" : "questions"}</span>
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button onClick={() => handleAddQuestion('TEXT', null)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition-all shadow-sm">
                                <Plus className="w-4 h-4" />
                                {language === 'ar' ? "إضافة نص" : "Add Text"}
                              </button>
                              <button onClick={() => handleAddQuestion('MCQ', null)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-bold text-xs transition-all shadow-sm">
                                <Plus className="w-4 h-4" />
                                {language === 'ar' ? "إضافة سؤال" : "Add Question"}
                              </button>
                            </div>
                          </div>
                          
                          <div className="space-y-4 relative z-10 w-full">
                            {generalQuestions.map(({ q, index }) => (
${cardContent}
                            ))}
                            {generalQuestions.length === 0 && !showQuestionForm && (
                               <div className="text-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-[30px] text-slate-400 font-bold">
                                 {language === 'ar' ? "لا يوجد أسئلة عامة" : "No general questions"}
                               </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>`;
        
        content = content.replace(oldList, newRendering);
    }
    
    fs.writeFileSync(filepath, content);
}

refactorFile('D:/pj/porj/corse/lms-platform/frontend/src/app/super-admin/exams/edit/[id]/page.tsx', false);
refactorFile('D:/pj/porj/corse/lms-platform/frontend/src/app/school-admin/exams/edit/[id]/page.tsx', true);
