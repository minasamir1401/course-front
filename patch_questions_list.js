const fs = require('fs');

const files = [
  'd:/mina/front/src/app/super-admin/exams/new/components/QuestionsBuilder.tsx',
  'd:/mina/front/src/app/super-admin/exams/edit/[id]/components/QuestionsBuilder.tsx',
  'd:/mina/front/src/app/school-admin/exams/new/components/QuestionsBuilder.tsx',
  'd:/mina/front/src/app/school-admin/exams/edit/[id]/components/QuestionsBuilder.tsx',
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Make sure activeSubExamIndex is destructured
    if (!content.includes('activeSubExamIndex')) {
      content = content.replace('const { currentModule, setCurrentModule', 'const { currentModule, setCurrentModule, activeSubExamIndex');
    }

    // Replace the incorrect list initialization
    const listRegex = /const list = currentModule\[source\] \|\| \[\];/;
    const newListLogic = `const list = (source === 'questions' && activeSubExamIndex !== null && currentModule.subExams && currentModule.subExams[activeSubExamIndex]) ? (currentModule.subExams[activeSubExamIndex].questions || []) : (currentModule[source] || []);`;

    if (listRegex.test(content)) {
      content = content.replace(listRegex, newListLogic);
      fs.writeFileSync(file, content, 'utf8');
      console.log('Patched list logic in ' + file);
    } else {
      console.log('List logic not found or already patched in ' + file);
    }
  }
}
