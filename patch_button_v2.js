const fs = require('fs');
const path = 'src/app/super-admin/exams/new/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update imports
if (!content.includes('FolderOutput')) {
  content = content.replace(
    "Upload, Download } from 'lucide-react';",
    "Upload, Download, FolderOutput } from 'lucide-react';"
  );
}

// 2. Add moveQuestionDropdown state
if (!content.includes('moveQuestionDropdown')) {
  content = content.replace(
    'const [showSettingsSidebar, setShowSettingsSidebar] = useState(true);',
    `const [showSettingsSidebar, setShowSettingsSidebar] = useState(true);
  const [moveQuestionDropdown, setMoveQuestionDropdown] = useState<number | null>(null);`
  );
}

// 3. Add moveQuestionToModule function
if (!content.includes('moveQuestionToModule')) {
  content = content.replace(
    /const moveQuestion = \([\s\S]*?\}\s*\];\s*return next;\s*\}\);\s*\};/,
    match => `${match}

  const moveQuestionToModule = (index: number, moduleId: string, subExamId: string) => {
    setQuestions(prev => {
      const next = [...prev];
      next[index] = { ...next[index], moduleId, subExamId };
      return normalizeExamQuestionOrder(next);
    });
    setMoveQuestionDropdown(null);
  };`
  );
}

// 4. Inject button
const buttonRegex = /(<div className="flex items-center gap-2">\s*<button\s*onClick=\{\(\) => setExpandedIndex\(expandedIndex === index \? null : index\)\})/;

if (!content.includes('<FolderOutput')) {
  content = content.replace(buttonRegex, `<div className="flex items-center gap-2">
                                  <div className="relative move-dropdown-container">
                                    <button
                                      onClick={() => setMoveQuestionDropdown(moveQuestionDropdown === index ? null : index)}
                                      className="w-10 h-10 bg-emerald-50 text-emerald-400 rounded-xl flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-600 transition-all border border-emerald-100 cursor-pointer"
                                      title={language === 'ar' ? "نقل إلى الموديولات" : "Move to modules"}
                                    >
                                      <FolderOutput className="w-4 h-4" />
                                    </button>
                                    
                                    {moveQuestionDropdown === index && (
                                      <>
                                        <div className="fixed inset-0 z-40" onClick={() => setMoveQuestionDropdown(null)}></div>
                                        <div className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 bg-white border border-slate-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] p-2 animate-in fade-in zoom-in-95 duration-200">
                                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 pb-2 mb-2 border-b border-slate-50 text-center">
                                            {language === 'ar' ? 'اختر الاختبار لنقل السؤال' : 'Select SubExam to Move Question'}
                                          </div>
                                          {modules && modules.length > 0 ? (
                                            <div className="max-h-48 overflow-y-auto space-y-3 p-1">
                                              {modules.map((m: any) => (
                                                <div key={m.id} className="space-y-1 bg-slate-50 rounded-xl p-2">
                                                  <div className="text-xs font-black text-slate-700 px-1 truncate mb-2 text-right">{m.title}</div>
                                                  {(m.subExams || []).map((s: any) => (
                                                    <button
                                                      key={s.id}
                                                      onClick={() => moveQuestionToModule(index, m.id, s.id)}
                                                      className="w-full text-right px-3 py-2 bg-white hover:bg-indigo-50 border border-slate-100 rounded-lg flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
                                                    >
                                                      <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                                      <span className="text-xs font-bold text-slate-600 truncate">{s.title}</span>
                                                    </button>
                                                  ))}
                                                  {!(m.subExams?.length > 0) && (
                                                    <div className="text-[10px] text-slate-400 px-2 italic text-center py-1">{language === 'ar' ? 'لا يوجد اختبارات في هذا الموديول' : 'No tests in this module'}</div>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="text-xs text-slate-400 p-4 text-center bg-slate-50 rounded-lg font-bold border border-dashed border-slate-200">
                                              {language === 'ar' ? 'لا يوجد موديولات أو اختبارات مضافة حالياً' : 'No modules or tests added yet'}
                                            </div>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}`);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Patch complete.');
