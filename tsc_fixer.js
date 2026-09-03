const fs = require('fs');

const dirs = [
  'src/app/super-admin/exams/new',
  'src/app/super-admin/exams/edit/[id]',
  'src/app/school-admin/exams/new',
  'src/app/school-admin/exams/edit/[id]'
];

// 1. Fix implicit any in SlidesBuilder.tsx
dirs.forEach(d => {
  let file = d + '/components/SlidesBuilder.tsx';
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf-8');
    code = code.replace(/\(val\)/g, '(val: any)');
    code = code.replace(/\(prev\)/g, '(prev: any)');
    code = code.replace(/\(updatedQ\)/g, '(updatedQ: any)');
    fs.writeFileSync(file, code);
  }
});

// 2. Fix implicit any in useExamAutosave.ts
dirs.forEach(d => {
  let file = d + '/hooks/useExamAutosave.ts';
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf-8');
    code = code.replace(/\(q\)/g, '(q: any)');
    fs.writeFileSync(file, code);
  }
});

// 3. Fix useModuleManagement.ts (missing t)
dirs.forEach(d => {
  let file = d + '/hooks/useModuleManagement.ts';
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf-8');
    // Extract t from props at the beginning
    if (!code.includes('const { t } = props;')) {
      code = code.replace(/const \{ currentModule/, 'const { t } = props;\n  const { currentModule');
      fs.writeFileSync(file, code);
    }
  }
});

// 4. Fix useQuestionLogic.tsx signature and missing setIsQuestionIndicatorOpen
dirs.forEach(d => {
  let file = d + '/hooks/useQuestionLogic.tsx';
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf-8');
    // Fix signature
    code = code.replace(/export const useQuestionLogic = \([^]*?props: any\) => \{/, 'export const useQuestionLogic = (props: any) => {');
    // Add missing state destructured from props
    if (!code.includes('setIsQuestionIndicatorOpen')) {
      code = code.replace(/const \{ currentModule/, 'const { setIsQuestionIndicatorOpen, setIsQuestionOutcomeOpen, setIsQuestionStandardOpen, currentModule');
      fs.writeFileSync(file, code);
    }
  }
});

console.log('Done fixing implicit any and missing hook variables!');
