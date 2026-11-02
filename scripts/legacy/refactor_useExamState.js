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

  const hookPath = path.join(dir, 'hooks', 'useExamState.ts');
  if (fs.existsSync(hookPath)) {
    let content = fs.readFileSync(hookPath, 'utf8');

    // Add subExams: [] to currentModule
    if (!content.includes('subExams: []')) {
        content = content.replace('questions: [],', 'subExams: [],\n    questions: [],');
    }
    
    // Add activeSubExamIndex
    if (!content.includes('activeSubExamIndex')) {
        const insertPos = content.indexOf('const [currentModule, setCurrentModule]');
        content = content.slice(0, insertPos) +
                  `const [activeSubExamIndex, setActiveSubExamIndex] = useState<number | null>(null);\n  const [isSubExamModalOpen, setIsSubExamModalOpen] = useState(false);\n\n  ` +
                  content.slice(insertPos);
    }
    
    // Add to return object
    if (!content.includes('activeSubExamIndex, setActiveSubExamIndex')) {
        const returnPos = content.indexOf('customSkills, setCustomSkills');
        content = content.slice(0, returnPos) +
                  `activeSubExamIndex, setActiveSubExamIndex,\n    isSubExamModalOpen, setIsSubExamModalOpen,\n    ` +
                  content.slice(returnPos);
    }

    fs.writeFileSync(hookPath, content);
    console.log(`Updated ${hookPath}`);
  }
});
