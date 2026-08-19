const fs = require('fs');
const path = require('path');

function extractBlock(content, startIdx) {
    let openCount = 0;
    let i = startIdx;
    let foundFirst = false;

    for (; i < content.length; i++) {
        if (content[i] === '{') {
            openCount++;
            foundFirst = true;
        } else if (content[i] === '}') {
            openCount--;
        }
        
        if (foundFirst && openCount === 0) {
            return content.substring(startIdx, i + 1);
        }
    }
    return null;
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Restore original file from git to avoid double-processing issues
    require('child_process').execSync(`"C:\\Program Files\\Git\\cmd\\git.exe" restore ${filePath}`, { stdio: 'inherit' });
    content = fs.readFileSync(filePath, 'utf8');

    // 1. Add currentSubExam state
    if (!content.includes('const [currentSubExam')) {
        content = content.replace(
            /const \[currentModule,\s*setCurrentModule\] = useState.*?;\r?\n/g,
            `$&  const [currentSubExam, setCurrentSubExam] = useState<any>({ title: '', duration: 60, attemptsAllowed: 1 });\n  const [showSubExamForm, setShowSubExamForm] = useState(false);\n  const [editingSubExamId, setEditingSubExamId] = useState<string | null>(null);\n  const [activeModuleForSubExam, setActiveModuleForSubExam] = useState<string | null>(null);\n`
        );
    }

    // 2. Add renderSubExamForm
    if (!content.includes('const renderSubExamForm = () =>')) {
        const moduleFormIdx = content.indexOf('const renderModuleForm = () =>');
        const subExamForm = `
  const renderSubExamForm = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="bg-indigo-600 px-8 py-6 flex items-center justify-between">
          <h3 className="text-xl font-black text-white">
            {editingSubExamId ? (language === "ar" ? "تعديل الاختبار" : "Edit SubExam") : (language === "ar" ? "إضافة اختبار جديد" : "Add New SubExam")}
          </h3>
          <button onClick={() => setShowSubExamForm(false)} className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8 space-y-6 bg-slate-50">
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              {language === "ar" ? "عنوان الاختبار" : "SubExam Title"}
            </label>
            <input
              type="text"
              value={currentSubExam.title}
              onChange={(e) => setCurrentSubExam({ ...currentSubExam, title: e.target.value })}
              className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              placeholder={language === "ar" ? "مثال: الاختبار الأول" : "e.g. Test 1"}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                {language === "ar" ? "المدة (دقائق)" : "Duration (Mins)"}
              </label>
              <input
                type="number"
                value={currentSubExam.duration}
                onChange={(e) => setCurrentSubExam({ ...currentSubExam, duration: parseInt(e.target.value) || 60 })}
                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                {language === "ar" ? "المحاولات المسموحة" : "Attempts Allowed"}
              </label>
              <input
                type="number"
                value={currentSubExam.attemptsAllowed}
                onChange={(e) => setCurrentSubExam({ ...currentSubExam, attemptsAllowed: parseInt(e.target.value) || 1 })}
                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>
          </div>
        </div>
        <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3">
          <button onClick={() => setShowSubExamForm(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">
            {language === "ar" ? "إلغاء" : "Cancel"}
          </button>
          <button
            onClick={() => {
              if (!currentSubExam.title || !activeModuleForSubExam) return;
              
              setModules(modules.map(m => {
                if (m.id !== activeModuleForSubExam) return m;
                const subExams = m.subExams || [];
                if (editingSubExamId) {
                  return { ...m, subExams: subExams.map((s: any) => s.id === editingSubExamId ? { ...s, ...currentSubExam } : s) };
                } else {
                  return { ...m, subExams: [...subExams, { id: crypto.randomUUID(), ...currentSubExam, order: subExams.length }] };
                }
              }));
              setShowSubExamForm(false);
              setEditingSubExamId(null);
            }}
            className="px-8 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
          >
            {language === "ar" ? "حفظ الاختبار" : "Save SubExam"}
          </button>
        </div>
      </div>
    </div>
  );\n\n`;
        content = content.slice(0, moduleFormIdx) + subExamForm + content.slice(moduleFormIdx);
    }

    // 3. Update the modules render loop
    // Find the `{modules.sort` section manually
    const modulesBlockMatch = content.match(/\{modules\s*\.sort\(/);
    if (modulesBlockMatch) {
        const startIdx = modulesBlockMatch.index;
        const blockStr = extractBlock(content, startIdx);
        
        if (blockStr) {
            const replaceModuleLoopStr = `{modules.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((module: any) => {
        const moduleQuestions = questions.filter((q: any) => q.moduleId === module.id);
        const subExams = module.subExams || [];
        return (
          <div key={module.id} className="bg-white border-2 border-indigo-50 rounded-[40px] p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full -z-10"></div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="text-2xl font-black text-slate-800">{module.title}</h4>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black">{subExams.length} {language === 'ar' ? 'اختبار' : 'Tests'}</span>
                </div>
                {module.description && <p className="text-slate-500 text-sm mt-1">{module.description}</p>}
              </div>
              <div className="flex gap-2 shrink-0 flex-wrap">
                <button onClick={() => {
                  setEditingModuleId(module.id);
                  setCurrentModule({ title: module.title, description: module.description });
                  setShowModuleForm(true);
                }} className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl font-bold text-xs transition-all shadow-sm">
                  {language === 'ar' ? 'تعديل الموديول' : 'Edit Module'}
                </button>
                <button onClick={() => setModules(modules.filter((m: any) => m.id !== module.id))} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-sm bg-rose-50 text-rose-600 hover:bg-rose-100">
                  <Trash2 className="w-4 h-4" />
                  {language === 'ar' ? 'حذف الموديول' : 'Delete'}
                </button>
              </div>
            </div>

            <div className="mt-6 border-t-2 border-indigo-100 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h5 className="font-black text-slate-800">{module.title}</h5>
                    <p className="text-xs text-slate-400">{subExams.length} {language === 'ar' ? 'اختبار' : 'Tests'}</p>
                  </div>
                </div>
                <button onClick={() => {
                  setActiveModuleForSubExam(module.id);
                  setCurrentSubExam({ title: '', duration: 60, attemptsAllowed: 1 });
                  setEditingSubExamId(null);
                  setShowSubExamForm(true);
                }} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer">
                  <Plus className="w-4 h-4" />
                  {language === 'ar' ? 'إضافة اختبار' : 'Add Test'}
                </button>
              </div>

              <div className="space-y-4">
                {subExams.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((subExam: any) => {
                  const subExamQuestions = questions.filter((q: any) => q.subExamId === subExam.id);
                  return (
                    <div key={subExam.id} className="border-2 border-slate-100 rounded-[24px] overflow-hidden bg-white shadow-sm transition-all hover:border-indigo-100">
                      <div className="flex items-center justify-between p-5 gap-4 transition-all bg-indigo-600">
                        <div className="flex items-center gap-4 flex-1 overflow-hidden">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white/20">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div className="overflow-hidden">
                            <h6 className="font-black text-sm truncate text-white">{subExam.title}</h6>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold flex items-center gap-1 text-indigo-200">
                                <Clock className="w-3 h-3" /> {subExam.duration} {language === 'ar' ? 'د' : 'm'}
                              </span>
                              <span className="text-[10px] font-bold text-indigo-200">•</span>
                              <span className="text-[10px] font-bold text-indigo-200">{subExamQuestions.length} {language === 'ar' ? 'سؤال' : 'questions'}</span>
                              <span className="text-[10px] font-bold text-indigo-200">•</span>
                              <span className="text-[10px] font-bold text-indigo-200">{subExam.attemptsAllowed} {language === 'ar' ? 'محاولة' : 'attempts'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => {
                            setActiveModuleForSubExam(module.id);
                            setEditingSubExamId(subExam.id);
                            setCurrentSubExam({ title: subExam.title, duration: subExam.duration, attemptsAllowed: subExam.attemptsAllowed });
                            setShowSubExamForm(true);
                          }} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer bg-white/20 hover:bg-white/30 text-white">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => {
                            setModules(modules.map((m: any) => {
                              if (m.id !== module.id) return m;
                              return { ...m, subExams: (m.subExams || []).filter((s: any) => s.id !== subExam.id) };
                            }));
                          }} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer bg-rose-500/80 hover:bg-rose-500 text-white">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-5 border-t-2 border-indigo-100 bg-slate-50/60">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{language === 'ar' ? 'الأسئلة' : 'Questions'} ({subExamQuestions.length})</p>
                          <div className="flex gap-2">
                            <button onClick={() => {
                                setEditingIndex(null);
                                setCurrentQuestion({ _clientId: crypto.randomUUID(), type: "MCQ", options: ["", "", "", ""], correctAnswer: "", points: 1, text: '', moduleId: module.id, subExamId: subExam.id });
                                setShowQuestionForm(true);
                            }} className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-all shadow-sm cursor-pointer">
                              <Plus className="w-3.5 h-3.5" />
                              {language === 'ar' ? 'إضافة سؤال' : 'Add Question'}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {subExamQuestions.length === 0 ? (
                             <div className="p-6 text-center text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-xl">
                               {language === 'ar' ? 'لا توجد أسئلة في هذا الاختبار بعد.' : 'No questions in this test yet.'}
                             </div>
                          ) : subExamQuestions.map((q: any) => {
                            const originalIndex = questions.findIndex((allQ: any) => (allQ._clientId && allQ._clientId === q._clientId) || (allQ.id && allQ.id === q.id));
                            return (
                              <div key={q.id || q._clientId} className="bg-white rounded-[16px] border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                                <div className="px-5 py-3.5 flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                    <span className="w-7 h-7 shrink-0 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-xs">
                                      {originalIndex + 1}
                                    </span>
                                    <div className="flex-1 overflow-hidden">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">{q.type}</span>
                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{q.points} pts</span>
                                      </div>
                                      <div className="text-slate-700 font-bold truncate text-xs"><HtmlRenderer html={q.text || ''} /></div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {typeof setPreviewQuestion !== 'undefined' && <button onClick={() => setPreviewQuestion(q)} className="w-8 h-8 bg-indigo-50 text-indigo-400 rounded-lg flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all cursor-pointer">
                                      <Eye className="w-4 h-4" />
                                    </button>}
                                    <button onClick={() => {
                                        setEditingIndex(originalIndex);
                                        setCurrentQuestion(q);
                                        setShowQuestionForm(true);
                                    }} className="w-8 h-8 bg-blue-50 text-blue-400 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all cursor-pointer">
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => {
                                        if (confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا السؤال؟' : 'Are you sure you want to delete this question?')) {
                                          if (q.id && typeof setDeletedQuestionIds !== 'undefined') {
                                              setDeletedQuestionIds((prev: any) => [...prev, q.id]);
                                          }
                                          setQuestions(questions.filter((item: any) => (item.id && item.id !== q.id) || (item._clientId && item._clientId !== q._clientId)));
                                        }
                                    }} className="w-8 h-8 bg-red-50 text-red-400 rounded-lg flex items-center justify-center hover:bg-red-600 hover:text-white transition-all cursor-pointer">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}`;

            content = content.slice(0, startIdx) + replaceModuleLoopStr + content.slice(startIdx + blockStr.length);
        } else {
            console.log("Could not extract balanced `{modules` block in " + filePath);
        }
    } else {
        console.log("Could not match the `{modules.sort` start regex in " + filePath);
    }

    // Include renderSubExamForm in the return tree
    if (!content.includes('{showSubExamForm && renderSubExamForm()}')) {
        content = content.replace(
            /\{showModuleForm && renderModuleForm\(\)\}/g,
            `{showModuleForm && renderModuleForm()}\n      {showSubExamForm && renderSubExamForm()}`
        );
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Updated " + filePath);
}

processFile('src/app/super-admin/exams/edit/[id]/page.tsx');
processFile('src/app/super-admin/exams/new/page.tsx');

processFile('src/app/school-admin/exams/edit/[id]/page.tsx');
processFile('src/app/school-admin/exams/new/page.tsx');
