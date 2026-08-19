const fs = require('fs');
const path = require('path');

const editFiles = [
  path.join(__dirname, '../src/app/super-admin/exams/edit/[id]/page.tsx'),
  path.join(__dirname, '../src/app/school-admin/exams/edit/[id]/page.tsx'),
];

for (const f of editFiles) {
  let content = fs.readFileSync(f, 'utf8');

  // 1. In useEffect where examData is loaded, set modules
  // The line usually looks like: setQuestions(examData.questions.map((q: any) => ({
  content = content.replace(/setQuestions\(\s*examData\.questions\.map\(/g, 'if (examData.modules) setModules(examData.modules);\n          setQuestions(examData.questions.map(');

  // 2. Change `(examInfo.modules || [])` to `modules` in the Modules Questions block
  content = content.replace(/\{\(examInfo\.modules \|\| \[\]\)\.sort\(/g, '{modules.sort(');
  content = content.replace(/examInfo\.modules\?.find/g, 'modules?.find');
  content = content.replace(/examInfo\.modules && examInfo\.modules\.length > 0/g, 'modules && modules.length > 0');

  // 3. Inject Edit/Delete module buttons into the existing Module header
  const moduleHeaderRegex = /<h4 className="text-2xl font-black text-slate-800">\{module\.title\}<\/h4>[\s\S]*?<div className="flex gap-2 shrink-0">/;
  const editButtons = `<div className="flex gap-2 shrink-0">
                                <button onClick={() => { setEditingModuleId(module.id); setCurrentModule({ title: module.title, description: module.description || '' }); setShowModuleForm(true); }} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs">{language === 'ar' ? 'تعديل' : 'Edit'}</button>
                                <button onClick={() => { if(confirm(language === 'ar' ? 'تأكيد الحذف؟' : 'Are you sure?')) setModules(modules.filter(m => m.id !== module.id)); }} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-xs">{language === 'ar' ? 'حذف' : 'Delete'}</button>`;
  
  content = content.replace(moduleHeaderRegex, match => {
     if (match.includes('setEditingModuleId')) return match; // already injected
     return match.replace(/<div className="flex gap-2 shrink-0">/, editButtons);
  });

  fs.writeFileSync(f, content);
  console.log('Fixed edit page:', f);
}
