const fs = require('fs');
let content = fs.readFileSync('d:/mina/front/src/app/super-admin/exams/edit/[id]/hooks/useExamState.ts', 'utf8');

content = content.replace(/if \(exam\.modules\) setModules\(exam\.modules\);/m, `
          if (exam.modules) {
             const allQs = exam.questions || [];
             const mods = exam.modules.map(m => {
                 const mQs = allQs.filter(q => q.moduleId === m.id && !q.subExamId);
                 const subExams = (m.subExams || []).map(s => {
                     const sQs = allQs.filter(q => q.subExamId === s.id);
                     return { ...s, questions: sQs };
                 });
                 return { ...m, questions: mQs, subExams };
             });
             setModules(mods);
          }`);

fs.writeFileSync('d:/mina/front/src/app/super-admin/exams/edit/[id]/hooks/useExamState.ts', content, 'utf8');
console.log('Patched useExamState.ts');
