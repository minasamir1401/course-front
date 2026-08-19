const fs = require('fs');
let c = fs.readFileSync('src/app/exams/page.tsx', 'utf8');

c = c.replace(/module\.sections/g, 'module.modules');
c = c.replace(/activeModule\.sections/g, 'activeModule.modules');
c = c.replace(/section\.exams/g, 'section.subExams');
c = c.replace(/\/exams\/\$\{exam\.id\}/g, '/exams/${activeModule.id}?subExamId=${exam.id}');

fs.writeFileSync('src/app/exams/page.tsx', c);
console.log('Fixed page.tsx');
