const fs = require('fs');
const path = require('path');

const transformEditor = (content, isEditPage) => {
  // 1. Remove "Module First" logic
  content = content.replace(/\{questions\.some\(q => q\.type === 'TEXT'\) \? QUESTION_TYPES : \([\s\S]*?<\/div>\s*\)\}/g, '{QUESTION_TYPES}');

  // 2. Add modules state
  if (!content.includes('const [modules, setModules]')) {
    const stateRegex = /const \[questions, setQuestions\] = useState<any\[\]>\((.*?)\);/;
    content = content.replace(stateRegex, `const [questions, setQuestions] = useState<any[]>($1);
  const [modules, setModules] = useState<any[]>(examInfo?.modules || []);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [currentModule, setCurrentModule] = useState<any>({ title: '', description: '' });
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);`);
  }

  // 3. Fix payload to include modules
  content = content.replace(/questions: questionsPayload/, 'modules: modules, questions: questionsPayload');
  
  // 4. Modify handleAddQuestion to include activeModuleId
  const handleAddQuestionRegex = /const handleAddQuestion = \(type: string\) => \{/;
  content = content.replace(handleAddQuestionRegex, `const handleAddQuestion = (type: string, moduleId: string | null = null) => {`);
  const newQuestionRegex = /const newQuestion = \{\s*type,\s*id:/;
  content = content.replace(newQuestionRegex, `const newQuestion = { type, moduleId, id:`);
  
  // 5. Build Module Form rendering
  const moduleFormUI = `
  const renderModuleForm = () => (
    <div className="bg-white rounded-[40px] border-2 border-indigo-500 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto mt-10 mb-10">
      <div className="bg-indigo-600 px-8 py-5 flex justify-between items-center">
        <h4 className="text-white font-black flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus w-5 h-5"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          {editingModuleId ? (language === 'ar' ? 'تعديل الموديول' : 'Edit Module') : (language === 'ar' ? "إضافة موديول جديد" : "Add New Module")}
        </h4>
        <button 
          type="button"
          onClick={() => { setShowModuleForm(false); setEditingModuleId(null); setCurrentModule({ title: '', description: ''}); }}
          className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x w-6 h-6"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
      <div className="p-8 md:p-12 space-y-8">
        <div className="flex flex-col gap-4">
          <label className="text-sm font-black text-slate-700">
            {language === 'ar' ? 'اسم الموديول' : 'Module Name'}
          </label>
          <input 
            type="text"
            autoFocus
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-4 text-xl font-black focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all"
            placeholder={language === 'ar' ? 'أدخل اسم الموديول' : 'Enter module name'}
            value={currentModule.title}
            onChange={(e) => setCurrentModule({...currentModule, title: e.target.value})}
          />
        </div>
        <div className="flex flex-col gap-4">
          <label className="text-sm font-black text-slate-700">
            {language === 'ar' ? 'وصف الموديول (اختياري)' : 'Description (Optional)'}
          </label>
          <textarea 
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-4 text-base font-medium focus:outline-none focus:border-indigo-600 transition-all min-h-[100px]"
            value={currentModule.description}
            onChange={(e) => setCurrentModule({...currentModule, description: e.target.value})}
          />
        </div>
        <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
          <button 
            type="button"
            onClick={() => { setShowModuleForm(false); setEditingModuleId(null); setCurrentModule({ title: '', description: ''}); }}
            className="px-8 py-4 rounded-2xl font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all cursor-pointer"
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button 
            type="button"
            onClick={() => {
               if(!currentModule.title) return;
               if(editingModuleId) {
                  setModules(modules.map(m => m.id === editingModuleId ? { ...m, ...currentModule } : m));
               } else {
                  setModules([...modules, { id: 'temp-mod-' + Math.random().toString(36).substr(2,9), ...currentModule, order: modules.length }]);
               }
               setShowModuleForm(false);
               setEditingModuleId(null);
               setCurrentModule({ title: '', description: ''});
            }}
            className="px-10 py-4 rounded-2xl font-black bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>{language === 'ar' ? 'حفظ الموديول' : 'Save Module'}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save w-5 h-5"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
  `;
  
  if (!content.includes('const renderModuleForm = () =>')) {
    content = content.replace(/const renderQuestionForm = \(\) => \(/, moduleFormUI + '\n  const renderQuestionForm = () => (');
  }

  // 6. Undo Previous AI's TEXT hack for modules in renderQuestionForm
  content = content.replace(/currentQuestion\.type === 'TEXT' \? \([\s\S]*?<\/div>\s*\)\s*:\s*(<div className="bg-white)/, '$1');

  // 7. Update Add Module Button to trigger real module form
  content = content.replace(/onClick=\{\(\) => handleAddQuestion\('TEXT'\)\}/g, "onClick={() => { setShowModuleForm(true); setEditingModuleId(null); setCurrentModule({title:'', description:''}); }}");

  return content;
};

const newFiles = [
  path.join(__dirname, '../src/app/super-admin/exams/new/page.tsx'),
  path.join(__dirname, '../src/app/school-admin/exams/new/page.tsx'),
  path.join(__dirname, '../src/app/super-admin/exams/edit/[id]/page.tsx'),
  path.join(__dirname, '../src/app/school-admin/exams/edit/[id]/page.tsx')
];

for (const file of newFiles) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    content = transformEditor(content, file.includes('edit'));
    fs.writeFileSync(file, content);
    console.log("Transformed", file);
  } catch(e) {
    console.error("Error transforming", file, e);
  }
}
