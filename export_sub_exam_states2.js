const fs = require('fs');
const path = require('path');

const directories = [
  'src/app/super-admin/exams/new/hooks/useExamState.ts',
  'src/app/super-admin/exams/edit/[id]/hooks/useExamState.ts',
  'src/app/school-admin/exams/new/hooks/useExamState.ts',
  'src/app/school-admin/exams/edit/[id]/hooks/useExamState.ts'
];

directories.forEach(file => {
  const fullPath = path.join('d:/mina/front', file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');

    if (!content.includes('activeSubExamIndex,')) {
        content = content.replace(/currentModule,\s*setCurrentModule,/, 'currentModule, setCurrentModule,\n    activeSubExamIndex, setActiveSubExamIndex,\n    isSubExamModalOpen, setIsSubExamModalOpen,');
        fs.writeFileSync(fullPath, content);
        console.log("Fixed " + fullPath);
    }
  }
});
