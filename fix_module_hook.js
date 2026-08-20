const fs = require('fs');

const hookFiles = [
  'src/app/super-admin/exams/new/hooks/useModuleManagement.ts',
  'src/app/super-admin/exams/edit/[id]/hooks/useModuleManagement.ts',
  'src/app/school-admin/exams/new/hooks/useModuleManagement.ts',
  'src/app/school-admin/exams/edit/[id]/hooks/useModuleManagement.ts'
];

hookFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf-8');
    code = code.replace(/t:\s*any,\s*props:\s*any/g, 'props: any');
    fs.writeFileSync(file, code);
    console.log('Fixed', file);
  }
});

const pageFiles = [
  'src/app/super-admin/exams/new/page.tsx',
  'src/app/super-admin/exams/edit/[id]/page.tsx',
  'src/app/school-admin/exams/new/page.tsx',
  'src/app/school-admin/exams/edit/[id]/page.tsx'
];

pageFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf-8');
    // Ensure `t` is passed to hooks that might need it
    code = code.replace(/useModuleManagement\(\{ \.\.\.state, showToast, language \}\)/g, 'useModuleManagement({ ...state, showToast, language, t })');
    code = code.replace(/useLessonBuilder\(\{ \.\.\.state, showToast, language \}\)/g, 'useLessonBuilder({ ...state, showToast, language, t })');
    code = code.replace(/useQuestionLogic\(\{ \.\.\.state, showToast, language \}\)/g, 'useQuestionLogic({ ...state, showToast, language, t })');
    fs.writeFileSync(file, code);
    console.log('Fixed page', file);
  }
});
