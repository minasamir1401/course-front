const fs = require('fs');

const transformEditor = (content, isEditPage) => {
  // 1. Force Module First logic:
  const headerButtonsRegex = /\{QUESTION_TYPES\.filter.*?\.map\(\(type.*?=> \([\s\S]*?<\/button>\s*\)\)\}/g;
  content = content.replace(headerButtonsRegex, (match) => {
    return `
      {questions.some(q => q.type === 'TEXT') ? ${match.replace(/QUESTION_TYPES\.filter\(t => t\.id !== 'TEXT'\)/, 'QUESTION_TYPES')} : (
        <div className="p-4 bg-yellow-50 text-yellow-700 rounded-2xl text-center font-bold text-sm col-span-full w-full">
          {language === 'ar' ? 'يجب إنشاء موديول أولاً قبل إضافة الأسئلة' : 'You must create a module first before adding questions'}
        </div>
      )}
    `;
  });

  // 2. Hijack \`renderQuestionForm\` for TEXT slides using ternary operator
  const formStartRegex = /const renderQuestionForm = \(\) => \(\s*<div className="bg-white/g;
  const formHijack = `const renderQuestionForm = () => (
    currentQuestion.type === 'TEXT' ? (
      <div className="bg-white rounded-[40px] border-2 border-indigo-500 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto mt-10">
        <div className="bg-indigo-600 px-8 py-5 flex justify-between items-center">
          <h4 className="text-white font-black flex items-center gap-3">
            <Plus className="w-5 h-5" />
            {editingIndex !== null ? (language === 'ar' ? 'تعديل الموديول' : 'Edit Module') : (language === 'ar' ? "إضافة موديول جديد" : "Add New Module")}
          </h4>
          <button 
            type="button"
            onClick={() => setShowQuestionForm(false)}
            className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center hover:bg-white/20 transition-all"
          >
            <X className="w-6 h-6" />
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
              placeholder={language === 'ar' ? 'أدخل اسم الموديول (مثال: الوحدة الأولى)' : 'Enter module name'}
              value={currentQuestion.questionText || currentQuestion.text || ''}
              onChange={(e) => setCurrentQuestion({...currentQuestion, questionText: e.target.value, text: e.target.value})}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveQuestion();
                }
              }}
            />
          </div>
          <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
            <button 
              type="button"
              onClick={() => setShowQuestionForm(false)}
              className="px-8 py-4 rounded-2xl font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all cursor-pointer"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button 
              type="button"
              onClick={handleSaveQuestion}
              className="px-10 py-4 rounded-2xl font-black bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <span>{language === 'ar' ? 'حفظ الموديول' : 'Save Module'}</span>
              <Save className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    ) : <div className="bg-white`;
  content = content.replace(formStartRegex, formHijack);

  // 3. Update preview list to make TEXT slides look like Module Headers
  const previewTextRegex = /q\.type === 'TEXT' \? \([\s\S]*?<div dangerouslySetInnerHTML=\{\{ __html: q\.questionText \}\} \/>[\s\S]*?<\/div>\s*\) :/g;
  const newPreviewText = `q.type === 'TEXT' ? (
    <div className="p-4 bg-slate-900 text-white rounded-xl mb-4 mt-8 font-black text-lg flex items-center gap-3 shadow-lg">
      <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
      {q.questionText || q.text || (language === 'ar' ? 'موديول بدون عنوان' : 'Untitled Module')}
    </div>
  ) :`;
  content = content.replace(previewTextRegex, newPreviewText);

  if (isEditPage) {
    // 4. Flatten \`modules\` into \`questions\` to prevent them from disappearing
    content = content.replace(/const examData = await examRes\.json\(\);/, `const examData = await examRes.json();
      
      // Flatten modules if they exist
      if (examData.modules && examData.modules.length > 0 && (!examData.questions || examData.questions.length === 0)) {
        let flattenedQuestions: any[] = [];
        examData.modules.forEach((mod: any) => {
          flattenedQuestions.push({
            id: 'mod-' + Math.random().toString(36).substring(7),
            type: 'TEXT',
            questionText: mod.title || mod.name || (language === 'ar' ? 'موديول' : 'Module'),
            text: mod.title || mod.name || (language === 'ar' ? 'موديول' : 'Module'),
            points: 0,
            xpPoints: 0,
          });
          if (mod.questions && mod.questions.length > 0) {
            flattenedQuestions.push(...mod.questions);
          }
        });
        examData.questions = flattenedQuestions;
      }
    `);
  }

  return content;
};

const newFiles = [
  'src/app/super-admin/exams/new/page.tsx',
  'src/app/school-admin/exams/new/page.tsx',
];

const editFiles = [
  'src/app/super-admin/exams/edit/[id]/page.tsx',
  'src/app/school-admin/exams/edit/[id]/page.tsx'
];

for (const file of newFiles) {
  let content = fs.readFileSync(file, 'utf8');
  content = transformEditor(content, false);
  fs.writeFileSync(file, content);
}

for (const file of editFiles) {
  let content = fs.readFileSync(file, 'utf8');
  content = transformEditor(content, true);
  fs.writeFileSync(file, content);
}

console.log("Transformed all files to Full Editor with Module First logic!");
