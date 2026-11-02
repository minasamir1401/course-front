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

    // 1. Add editingTitleIndex state inside ModuleModal component if it doesn't exist
    if (!content.includes('editingTitleIndex')) {
      const hookInjectionRegex = /const { showToast } = useNotification\(\);\s*const { isModuleModalOpen/;
      content = content.replace(hookInjectionRegex, `const { showToast } = useNotification();\n  const [editingTitleIndex, setEditingTitleIndex] = React.useState<number | null>(null);\n  const [editingTitleValue, setEditingTitleValue] = React.useState('');\n  const { isModuleModalOpen`);
    }

    // 2. Replace the prompt() block and the title display with inline editing
    // The current display looks like:
    /*
      <h5 className="font-black text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">
        {subExam.title || (language === 'ar' ? 'اختبار بدون عنوان' : 'Untitled Exam')}
      </h5>
    */
    // And the button click looks like:
    /*
      onClick={(e) => {
        e.stopPropagation();
        const newTitle = prompt(language === 'ar' ? "أدخل عنوان الاختبار:" : "Enter Exam Title:", subExam.title);
        if (newTitle !== null) {
          const newSubExams = [...(currentModule.subExams || [])];
          newSubExams[idx].title = newTitle;
          setCurrentModule({...currentModule, subExams: newSubExams});
        }
      }}
    */

    const titleDisplayRegex = /<h5 className="font-black text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">[\s\S]*?<\/h5>/;
    const titleReplacement = `{editingTitleIndex === idx ? (
                                  <input 
                                    autoFocus
                                    className="w-full bg-slate-100 border border-indigo-300 rounded px-3 py-1 text-base outline-none text-slate-800 font-bold"
                                    value={editingTitleValue}
                                    onClick={e => e.stopPropagation()}
                                    onChange={e => setEditingTitleValue(e.target.value)}
                                    onBlur={() => {
                                      const newSubExams = [...(currentModule.subExams || [])];
                                      newSubExams[idx].title = editingTitleValue || newSubExams[idx].title;
                                      setCurrentModule({...currentModule, subExams: newSubExams});
                                      setEditingTitleIndex(null);
                                    }}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        const newSubExams = [...(currentModule.subExams || [])];
                                        newSubExams[idx].title = editingTitleValue || newSubExams[idx].title;
                                        setCurrentModule({...currentModule, subExams: newSubExams});
                                        setEditingTitleIndex(null);
                                      }
                                    }}
                                  />
                                ) : (
                                  <h5 className="font-black text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">
                                    {subExam.title || (language === 'ar' ? 'اختبار بدون عنوان' : 'Untitled Exam')}
                                  </h5>
                                )}`;

    content = content.replace(titleDisplayRegex, titleReplacement);

    const buttonClickRegex = /onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*const newTitle = prompt\([\s\S]*?\}\s*\}\}/;
    const buttonClickReplacement = `onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTitleIndex(idx);
                                    setEditingTitleValue(subExam.title || '');
                                  }}`;

    content = content.replace(buttonClickRegex, buttonClickReplacement);

    fs.writeFileSync(file, content, 'utf8');
    console.log('Patched ' + file);
  }
}
