const fs = require('fs');
const path = require('path');

function replaceQuestionsMap(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const targetStr = '{questions.map((q, index) => (';
  let startIdx = content.indexOf(targetStr);
  
  if (startIdx === -1) {
    console.log('Could not find questions.map in', filePath);
    return;
  }

  // Bracket counting to find the end of the map function
  let openParen = 0;
  let openBrace = 0;
  let inString = false;
  let stringChar = '';
  
  let endIdx = -1;
  let hasStarted = false;

  for (let i = startIdx; i < content.length; i++) {
    const char = content[i];
    const prevChar = i > 0 ? content[i-1] : '';

    if (!inString && (char === '"' || char === "'" || char === "\`")) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar && prevChar !== '\\') {
      inString = false;
    }

    if (!inString) {
      if (char === '{') {
        openBrace++;
        hasStarted = true;
      }
      else if (char === '}') openBrace--;
      else if (char === '(') openParen++;
      else if (char === ')') openParen--;
    }

    if (hasStarted && openBrace === 0 && openParen === 0) {
      // The block starts with {questions.map( ... )}, so it starts with {
      if (openBrace === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }

  if (endIdx === -1) {
    console.log('Could not find closing bracket in', filePath);
    return;
  }

  const originalBlock = content.substring(startIdx, endIdx);
  
  let innerBlock = originalBlock.substring(targetStr.length, originalBlock.length - 2); 
  const modifiedInnerBlock = innerBlock;

  const newJSX = `
              {/* Modules Questions */}
              {modules.sort((a, b) => (a.order || 0) - (b.order || 0)).map((module) => {
                const moduleQuestions = questions.filter(item => item.moduleId === module.id);
                return (
                  <div key={module.id} className="bg-white border-2 border-indigo-50 rounded-[40px] p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden mb-8">
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
                        <button onClick={() => { if(confirm(language === 'ar' ? 'هل أنت متأكد من حذف الموديول؟' : 'Are you sure you want to delete this module?')) setModules(modules.filter(m => m.id !== module.id)); }} className="flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-bold text-xs transition-all shadow-sm">
                          {language === 'ar' ? "حذف الموديول" : "Delete Module"}
                        </button>
                        <button onClick={() => handleAddQuestion('MCQ', module.id)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs transition-all shadow-sm">
                          {language === 'ar' ? "إضافة سؤال" : "Add Question"}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-4 relative z-10 w-full">
                      {moduleQuestions.length > 0 ? moduleQuestions.map((q) => {
                         const index = questions.findIndex(item => item === q);
                         return (
                           ${modifiedInnerBlock}
                         );
                      }) : (
                        <div className="text-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-[30px] text-slate-400 font-bold flex flex-col items-center justify-center gap-3">
                          {language === 'ar' ? "لا يوجد أسئلة في هذا القسم. ابدأ بإضافة سؤال الآن!" : "No questions in this section. Add one now!"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* General Questions */}
              {(() => {
                const generalQuestions = questions.filter(item => !item.moduleId);
                const hasModules = modules && modules.length > 0;
                if (generalQuestions.length === 0 && hasModules) return null;
                return (
                  <div className="bg-white border-2 border-slate-100 rounded-[40px] p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden">
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
                      {generalQuestions.map((q) => {
                         const index = questions.findIndex(item => item === q);
                         return (
                           ${modifiedInnerBlock}
                         );
                      })}
                    </div>
                  </div>
                );
              })()}
  `;

  content = content.substring(0, startIdx) + newJSX + content.substring(endIdx);
  
  fs.writeFileSync(filePath, content);
  console.log('Patched questions list in', filePath);
}

const files = [
  path.join(__dirname, '../src/app/super-admin/exams/new/page.tsx'),
  path.join(__dirname, '../src/app/school-admin/exams/new/page.tsx'),
];

for (const f of files) {
  replaceQuestionsMap(f);
}

// For edit/[id]/page.tsx, it's already using a different loop, but wait!
// The previous AI flattened the UI, so it MIGHT actually be using {questions.map} in edit page too!
const editFiles = [
  path.join(__dirname, '../src/app/super-admin/exams/edit/[id]/page.tsx'),
  path.join(__dirname, '../src/app/school-admin/exams/edit/[id]/page.tsx'),
];

for (const f of editFiles) {
  let content = fs.readFileSync(f, 'utf8');
  // First, let's remove the existing Modules Questions rendering since we'll put our own.
  const moduleStart = content.indexOf('{/* Modules Questions */}');
  const generalEnd = content.indexOf('})()}');
  if (moduleStart !== -1 && generalEnd !== -1) {
    const originalBlock = content.substring(moduleStart, generalEnd + 5);
    // Find the inner questions.map inside the general block to extract the JSX
    const targetStr = '{generalQuestions.map(({ q, index }) => (';
    const tIdx = originalBlock.indexOf(targetStr);
    if (tIdx !== -1) {
      const qStartIdx = moduleStart + tIdx;
      let openParen = 0; let openBrace = 0; let inString = false; let stringChar = '';
      let endIdx = -1; let hasStarted = false;
      for (let i = qStartIdx; i < content.length; i++) {
        const char = content[i]; const prevChar = i > 0 ? content[i-1] : '';
        if (!inString && (char === '"' || char === "'" || char === "\`")) { inString = true; stringChar = char; }
        else if (inString && char === stringChar && prevChar !== '\\') { inString = false; }
        if (!inString) {
          if (char === '{') { openBrace++; hasStarted = true; }
          else if (char === '}') openBrace--;
          else if (char === '(') openParen++;
          else if (char === ')') openParen--;
        }
        if (hasStarted && openBrace === 0 && openParen === 0) { if (openBrace === 0) { endIdx = i + 1; break; } }
      }
      if (endIdx !== -1) {
        const mapBlock = content.substring(qStartIdx, endIdx);
        const innerBlock = mapBlock.substring(targetStr.length, mapBlock.length - 2); // remove ))
        // Replace the whole module block with our new one!
        // We will just do a hacky regex replacement of the whole block for now.
      }
    }
  }
}
