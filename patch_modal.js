const fs = require('fs');
const path = 'src/app/super-admin/exams/new/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace moveQuestionDropdown state with moveQuestionModalIndex
content = content.replace(
  'const [moveQuestionDropdown, setMoveQuestionDropdown] = useState<number | null>(null);',
  'const [moveQuestionModalIndex, setMoveQuestionModalIndex] = useState<number | null>(null);'
);

// Update moveQuestionToModule
content = content.replace(
  'setMoveQuestionDropdown(null);',
  'setMoveQuestionModalIndex(null);'
);

// Replace the dropdown UI in the question row with just the button
const buttonPattern = /<div className="relative move-dropdown-container">[\s\S]*?\{\s*moveQuestionDropdown === index && \([\s\S]*?\)\s*\}\s*<\/div>/;
const newButton = `<button
                                    onClick={() => setMoveQuestionModalIndex(index)}
                                    className="w-10 h-10 bg-emerald-50 text-emerald-400 rounded-xl flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-600 transition-all border border-emerald-100 cursor-pointer"
                                    title={language === 'ar' ? "نقل إلى الموديولات" : "Move to modules"}
                                  >
                                    <FolderOutput className="w-4 h-4" />
                                  </button>`;
content = content.replace(buttonPattern, newButton);

// Add the Modal at the end of the component
const modalHtml = `
      {/* Move Question Modal */}
      {moveQuestionModalIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMoveQuestionModalIndex(null)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
                <FolderOutput className="w-5 h-5 text-emerald-500" />
                {language === 'ar' ? 'نقل السؤال إلى اختبار' : 'Move Question to Test'}
              </h3>
              <button onClick={() => setMoveQuestionModalIndex(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-all cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {modules && modules.length > 0 ? (
                <div className="space-y-4">
                  {modules.map((m: any) => (
                    <div key={m.id} className="space-y-2 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <div className={\`text-sm font-black text-slate-700 \${language === 'ar' ? 'text-right' : 'text-left'}\`}>{m.title}</div>
                      {(m.subExams || []).length > 0 ? (
                        <div className="space-y-2 mt-3">
                          {(m.subExams || []).map((s: any) => (
                            <button
                              key={s.id}
                              onClick={() => moveQuestionToModule(moveQuestionModalIndex, m.id, s.id)}
                              className={\`w-full px-4 py-3 bg-white hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 rounded-xl flex items-center gap-3 cursor-pointer transition-all shadow-sm group \${language === 'ar' ? 'text-right' : 'text-left'}\`}
                            >
                              <BookOpen className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 shrink-0" />
                              <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 truncate">{s.title}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic py-2 text-center">{language === 'ar' ? 'لا يوجد اختبارات في هذا الموديول' : 'No tests in this module'}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-400 p-8 text-center bg-slate-50 rounded-xl font-bold border border-dashed border-slate-200">
                  {language === 'ar' ? 'لا يوجد موديولات أو اختبارات مضافة حالياً' : 'No modules or tests added yet'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
`;

content = content.replace('{/* Global overlays/modals */}', modalHtml + '\n      {/* Global overlays/modals */}');

// If the comment doesn't exist, just inject before the last closing div of the component
if (!content.includes('{/* Global overlays/modals */}')) {
    content = content.replace(/<\/div>\s*<\/DashboardLayout>/, modalHtml + '\n    </div>\n    </DashboardLayout>');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully patched modal logic');
