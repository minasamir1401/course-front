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
    
    // Remove moveBlock
    const moveBlockRegex = /\s*const moveBlock = \(source: 'slides' \| 'assignments' \| 'questions' = 'slides', index: number, direction: 'UP' \| 'DOWN'\) => \{\s*setCurrentModule\(\(prev: any\) => \{\s*const newSlides = \[\.\.\.\(prev\[source\] \|\| \[\]\)\];\s*const targetIndex = direction === 'UP' \? index - 1 : index \+ 1;\s*if \(targetIndex < 0 \|\| targetIndex >= newSlides\.length\) return prev;\s*\[newSlides\[index\], newSlides\[targetIndex\]\] = \[newSlides\[targetIndex\], newSlides\[index\]\];\s*return \{ \.\.\.prev, \[source\]: newSlides \};\s*\}\);\s*\};\s*/g;
    code = code.replace(moveBlockRegex, '\n');

    // Remove insertBlockAt
    const insertBlockRegex = /\s*const insertBlockAt = \(source: 'slides' \| 'assignments' \| 'questions' = 'slides', index: number, type: 'TEXT' \| 'QUESTION'\) => \{\s*const newBlock = type === 'TEXT'[^]*?return \{ \.\.\.prev, \[source\]: newSlides \};\s*\}\);\s*showToast\("Slide inserted successfully", "success"\);\s*\};\s*/g;
    code = code.replace(insertBlockRegex, '\n');

    fs.writeFileSync(file, code);
    console.log('Cleaned', file);
  }
});
console.log('Done!');
