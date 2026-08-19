const fs = require('fs');
const path = require('path');

const files = [
  'src/app/super-admin/exams/edit/[id]/page.tsx',
  'src/app/school-admin/exams/edit/[id]/page.tsx'
];

for (const relPath of files) {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) continue;

  let content = fs.readFileSync(fullPath, 'utf8');

  // 1. Add deletedQuestionIdsRef
  if (!content.includes('deletedQuestionIdsRef')) {
    content = content.replace(
      /const createdIdRef = useRef<string \| null>\(null\);/,
      `const createdIdRef = useRef<string | null>(null);\n  const deletedQuestionIdsRef = useRef<string[]>([]);`
    );
  }

  // 2. removeMinaDuplicates
  const minaMatch = /const unique: any\[\] = \[\];\s*standaloneQuestions\.forEach\(\(q: any\) => \{\s*const sig = \(q\.text \|\| ''\)\.replace\(\/<\[\^>\]\*\>?\/gm, ''\)\.trim\(\)\.toLowerCase\(\);\s*if \(\!seen\.has\(sig\)\) \{\s*unique\.push\(q\);\s*seen\.add\(sig\);\s*\}\s*\}\);/m;
  const newMina = `const unique: any[] = [];
    standaloneQuestions.forEach((q: any) => {
      const sig = (q.text || '').replace(/<[^>]*>?/gm, '').trim().toLowerCase();
      if (!seen.has(sig)) {
        unique.push(q);
        seen.add(sig);
      } else if (q.id) {
        deletedQuestionIdsRef.current.push(q.id);
      }
    });`;
  content = content.replace(minaMatch, newMina);

  // 3. removeStandaloneQuestion
  const standaloneRemoveMatch = /const removeStandaloneQuestion = \(index: number\) => \{\s*if \(!confirm[^)]+\)\) return;\s*setStandaloneQuestions\(\(prev: any\) => \{\s*const newList = \[\.\.\.prev\];\s*newList\.splice\(index, 1\);\s*return newList;\s*\}\);/m;
  const newStandaloneRemove = `const removeStandaloneQuestion = (index: number) => {
    if (!confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا السؤال؟" : "Are you sure you want to delete this question?")) return;
    if (standaloneQuestions[index]?.id) {
      deletedQuestionIdsRef.current.push(standaloneQuestions[index].id);
    }
    setStandaloneQuestions((prev: any) => {
      const newList = [...prev];
      newList.splice(index, 1);
      return newList;
    });`;
  content = content.replace(standaloneRemoveMatch, newStandaloneRemove);

  // 4. removeQuestionForSource
  const moduleRemoveMatch = /const removeQuestionForSource = \(source: 'assignments' \| 'questions', index: number\) => \{\s*if \(!confirm[^)]+\)\) return;\s*const updated = \[\]\.concat\(currentModule\[source\] || \[\]\);\s*updated\.splice\(index, 1\);\s*setCurrentModule\(\(prev: any\) => \(\{\s*\.\.\.prev,\s*\[source\]: updated\s*\}\)\);/m;
  const newModuleRemove = `const removeQuestionForSource = (source: 'assignments' | 'questions', index: number) => {
    if (!confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا السؤال؟" : "Are you sure you want to delete this question?")) return;
    const targetQ = currentModule[source]?.[index];
    if (targetQ?.id) {
      deletedQuestionIdsRef.current.push(targetQ.id);
    }
    const updated = [].concat(currentModule[source] || []);
    updated.splice(index, 1);
    setCurrentModule((prev: any) => ({
      ...prev,
      [source]: updated
    }));`;
  content = content.replace(moduleRemoveMatch, newModuleRemove);

  // 5. runAutoSave payload
  content = content.replace(/status: "DRAFT",\s*modules: modulesPayload,\s*questions: allQuestions/m, `status: "DRAFT",\n          deletedQuestionIds: deletedQuestionIdsRef.current,\n          modules: modulesPayload,\n          questions: allQuestions`);

  // 6. handleSubmit payload and allQuestions push
  const handleSubmitMatch = /const allQuestions: any\[\] = \[\];\s*const modulesPayload = finalModules\.map\(\(m, index\) => \{\s*const mId = m\.id \|\| String\(Date\.now\(\) \+ index\);\s*const mQuestions = \(m\.questions \|\| \[\]\)\.map\(\(q: any\) => \(\{\s*\.\.\.q,\s*moduleId: mId\s*\}\)\);\s*allQuestions\.push\(\.\.\.mQuestions\);\s*return \{\s*id: mId,\s*title: m\.title,\s*description: m\.content \|\| null,\s*duration: m\.duration \|\| null,\s*passingScore: m\.passingScore \|\| null,\s*order: index\s*\};\s*\}\);/m;
  const newHandleSubmit = `const allQuestions: any[] = [];
      const modulesPayload = finalModules.map((m, index) => {
         const mId = m.id || String(Date.now() + index);
         const mQuestions = (m.questions || []).map((q: any) => ({
             ...q,
             moduleId: mId
         }));
         allQuestions.push(...mQuestions);
         return {
            id: mId,
            title: m.title,
            description: m.content || null,
            duration: m.duration || null,
            passingScore: m.passingScore || null,
            order: index
         };
      });
      allQuestions.push(...(standaloneQuestions || []).map(q => ({ ...q, moduleId: null })));`;
  content = content.replace(handleSubmitMatch, newHandleSubmit);
  
  content = content.replace(/status: "PUBLISHED",\s*modules: modulesPayload,\s*questions: allQuestions/m, `status: "PUBLISHED",\n          deletedQuestionIds: deletedQuestionIdsRef.current,\n          modules: modulesPayload,\n          questions: allQuestions`);

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Applied deletion fix to ${relPath}`);
}
