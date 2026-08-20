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

    // Only replace if it wasn't replaced already (e.g. if we don't find it near customSkills)
    if (!content.includes('customSkills, setCustomSkills,')) {
        content = content.replace('customSkills, setCustomSkills', 'customSkills, setCustomSkills,\n    activeSubExamIndex, setActiveSubExamIndex,\n    isSubExamModalOpen, setIsSubExamModalOpen');
        fs.writeFileSync(fullPath, content);
        console.log("Fixed " + fullPath);
    }
  }
});
