const fs = require('fs');
const path = require('path');

const directories = [
  'src/app/super-admin/exams/new',
  'src/app/super-admin/exams/edit/[id]',
  'src/app/school-admin/exams/new',
  'src/app/school-admin/exams/edit/[id]'
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) return;

  const hookPath = path.join(dir, 'hooks', 'useExamSubmit.ts');
  if (fs.existsSync(hookPath)) {
    let content = fs.readFileSync(hookPath, 'utf8');

    // we can do a regex replace
    const regex = /const allQuestions: any\[\] = \[\];[\s\S]*?modulesPayload = finalModules\.map\(\(m, index\) => \{[\s\S]*?return \{[\s\S]*?order: index[\s\S]*?\};\s*\}\);/;
    
    const replaceStr = `const allQuestions: any[] = [];
      const modulesPayload = finalModules.map((m, index) => {
         const mId = m.id || String(Date.now() + index);
         
         const mSubExams = (m.subExams || []).map((s: any, sIdx: number) => {
             const sId = s.id || String(Date.now() + index * 1000 + sIdx);
             const sQuestions = (s.questions || []).map((q: any) => ({
                 ...q,
                 moduleId: mId,
                 subExamId: sId
             }));
             allQuestions.push(...sQuestions);
             return {
                 id: sId,
                 title: s.title,
                 duration: s.duration || null,
                 passingScore: s.passingScore || null,
                 attemptsAllowed: s.attemptsAllowed || 1,
                 order: sIdx
             };
         });
         
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
            order: index,
            subExams: mSubExams
         };
      });`;

    if (regex.test(content)) {
        content = content.replace(regex, replaceStr);
        fs.writeFileSync(hookPath, content);
        console.log(`Updated ${hookPath}`);
    } else {
        console.log(`Failed to find regex match in ${hookPath}`);
    }
  }
});
