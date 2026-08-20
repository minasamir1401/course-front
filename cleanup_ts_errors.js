const fs = require('fs');

const dirs = [
  'src/app/super-admin/exams/new',
  'src/app/super-admin/exams/edit/[id]',
  'src/app/school-admin/exams/new',
  'src/app/school-admin/exams/edit/[id]'
];

// Revert page.tsx duplicate props
dirs.forEach(d => {
  let file = d + '/page.tsx';
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf-8');
    const extraPropsRegex = / openDropdownId=\{openDropdownId\}[^]*?setIsQuestionStandardOpen\}/g;
    code = code.replace(extraPropsRegex, '');
    fs.writeFileSync(file, code);
    console.log('Reverted page props in', file);
  }
});

// Fix SlidesBuilder destructuring
dirs.forEach(d => {
  let file = d + '/components/SlidesBuilder.tsx';
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf-8');
    const missingProps = 'const { openDropdownId, setOpenDropdownId, allExistingSkills, setCustomSkills, addBlock, insertBlockAt, updateBlock, updateBlockTypeAndReset, moveBlock, removeBlock, addSection, removeSection, updateSection, setIsQuestionIndicatorOpen, setIsQuestionOutcomeOpen, setIsQuestionStandardOpen } = props;';
    if (!code.includes('const { openDropdownId')) {
      code = code.replace(/const \{ source,/, missingProps + '\n  const { source,');
      fs.writeFileSync(file, code);
      console.log('Fixed destructuring in', file);
    }
  }
});

// Fix QuestionsBuilder destructuring
dirs.forEach(d => {
  let file = d + '/components/QuestionsBuilder.tsx';
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf-8');
    const missingProps = 'const { openDropdownId, setOpenDropdownId, allExistingSkills, setCustomSkills, addBlock, insertBlockAt, updateBlock, updateBlockTypeAndReset, moveBlock, removeBlock, addSection, removeSection, updateSection, setIsQuestionIndicatorOpen, setIsQuestionOutcomeOpen, setIsQuestionStandardOpen } = props;';
    if (!code.includes('const { openDropdownId')) {
      code = code.replace(/const \{ source,/, missingProps + '\n  const { source,');
      fs.writeFileSync(file, code);
      console.log('Fixed destructuring in', file);
    }
  }
});

// Fix useQuestionLogic signature
dirs.forEach(d => {
  let file = d + '/hooks/useQuestionLogic.tsx';
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf-8');
    const badSignature = 'export const useQuestionLogic = (\n  setEditingQuestionIndex: any,\n  editingQuestionIndex: any,props: any) => {';
    if (code.includes(badSignature)) {
      code = code.replace(badSignature, 'export const useQuestionLogic = (props: any) => {');
      fs.writeFileSync(file, code);
      console.log('Fixed useQuestionLogic signature in', file);
    }
  }
});

console.log('Cleanup script executed.');
