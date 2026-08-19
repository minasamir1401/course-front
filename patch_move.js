const fs = require('fs');
let content = fs.readFileSync('src/app/super-admin/exams/edit/[id]/page.tsx', 'utf8');

content = content.replace('Search } from \'lucide-react\';', 'Search, FolderOutput } from \'lucide-react\';');
content = content.replace('const [isInitialLoad, setIsInitialLoad] = useState(true);', 'const [isInitialLoad, setIsInitialLoad] = useState(true);\n  const [movingQuestionIndex, setMovingQuestionIndex] = useState<number | null>(null);');

const insertMoveFunction = `
  const handleMoveToModule = (moduleIndex: number) => {
    if (movingQuestionIndex === null) return;
    const q = { ...standaloneQuestions[movingQuestionIndex] };
    const newModules = [...modules];
    if (!newModules[moduleIndex].questions) newModules[moduleIndex].questions = [];
    q.moduleId = newModules[moduleIndex].id;
    newModules[moduleIndex].questions.push(q);
    setModules(newModules);
    const newStandalone = [...standaloneQuestions];
    newStandalone.splice(movingQuestionIndex, 1);
    setStandaloneQuestions(newStandalone);
    setMovingQuestionIndex(null);
    showToast(language === 'ar' ? 'تم نقل السؤال بنجاح' : 'Question moved successfully', 'success');
  };

  const handleSaveStandaloneQuestion`;
content = content.replace('const handleSaveStandaloneQuestion', insertMoveFunction);

const buttonHtml = `<button onClick={(e) => { e.preventDefault(); setMovingQuestionIndex(index); }} className="p-2.5 bg-emerald-50 text-emerald-400 rounded-xl hover:bg-emerald-100 hover:text-emerald-600 transition-all border border-emerald-100" title={language === 'ar' ? "نقل إلى الموديولات" : "Move to module"}><FolderOutput className="w-4 h-4" /></button>
                           <button onClick={(e) => { e.preventDefault(); handleEditStandaloneQuestion(index);`;
content = content.replaceAll('<button onClick={(e) => { e.preventDefault(); handleEditStandaloneQuestion(index);', buttonHtml);

const modalHtml = `
      {/* Move Question Modal */}
      {movingQuestionIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMovingQuestionIndex(null)}></div>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <FolderOutput className="w-5 h-5 text-indigo-600" />
                {language === 'ar' ? "نقل إلى موديول" : "Move to Module"}
              </h3>
              <button onClick={() => setMovingQuestionIndex(null)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {modules.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-slate-500 font-bold mb-4">{language === 'ar' ? "لا يوجد موديولات متاحة. قم بإنشاء موديول أولاً." : "No modules available. Create a module first."}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {modules.map((m, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => handleMoveToModule(idx)}
                      className="w-full text-start p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center gap-3 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex flex-col items-center justify-center font-black shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 truncate font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">
                        {m.title || (language === 'ar' ? 'موديول بدون عنوان' : 'Untitled Module')}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>`;
content = content.replace('</DashboardLayout>', modalHtml);

fs.writeFileSync('src/app/super-admin/exams/edit/[id]/page.tsx', content);

let contentSchool = fs.readFileSync('src/app/school-admin/exams/edit/[id]/page.tsx', 'utf8');
contentSchool = contentSchool.replace('Search } from \'lucide-react\';', 'Search, FolderOutput } from \'lucide-react\';');
contentSchool = contentSchool.replace('const [isInitialLoad, setIsInitialLoad] = useState(true);', 'const [isInitialLoad, setIsInitialLoad] = useState(true);\n  const [movingQuestionIndex, setMovingQuestionIndex] = useState<number | null>(null);');
contentSchool = contentSchool.replace('const handleSaveStandaloneQuestion', insertMoveFunction);
contentSchool = contentSchool.replaceAll('<button onClick={(e) => { e.preventDefault(); handleEditStandaloneQuestion(index);', buttonHtml);
contentSchool = contentSchool.replace('</DashboardLayout>', modalHtml);
fs.writeFileSync('src/app/school-admin/exams/edit/[id]/page.tsx', contentSchool);
