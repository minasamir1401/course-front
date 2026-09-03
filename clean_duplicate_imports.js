const fs = require('fs');

const dirs = [
  'src/app/super-admin/exams/new',
  'src/app/super-admin/exams/edit/[id]',
  'src/app/school-admin/exams/new',
  'src/app/school-admin/exams/edit/[id]'
];

// We know the exact string that was injected by master_repair_exams.js:
// import RichTextEditor from '@/components/RichTextEditor';
// import { getOptionLetter } from '@/lib/utils';
// import MathInput from '@/components/MathInput';
// import InteractiveQuestionEditor from '@/components/InteractiveQuestionEditor';
// import { SECTION_STYLE_PRESETS } from '../constants';

// We just need to remove them if they are duplicated in the file.
// But wait, the easiest way is to parse the file line by line and keep track of default imports and named imports,
// or just manually remove the second occurrence of these specific lines.

dirs.forEach(d => {
  ['/components/SlidesBuilder.tsx', '/components/QuestionsBuilder.tsx'].forEach(comp => {
    let file = d + comp;
    if (fs.existsSync(file)) {
      let lines = fs.readFileSync(file, 'utf-8').split('\n');
      
      const seenImports = new Set();
      const newLines = [];
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('import ')) {
          // If it's an exact duplicate line, skip it
          if (seenImports.has(trimmed)) {
            return;
          }
          seenImports.add(trimmed);
          
          // If it's importing a named variable we already imported from the same path, it's harder,
          // but we can just specifically target the known bad ones:
          if (trimmed === "import { getOptionLetter } from '@/lib/utils';") {
             // check if we already imported getOptionLetter from lib/utils
             const alreadyHas = newLines.some(l => l.includes('getOptionLetter') && l.includes('@/lib/utils'));
             if (alreadyHas) return;
          }
          if (trimmed === "import { SECTION_STYLE_PRESETS } from '../constants';") {
             const alreadyHas = newLines.some(l => l.includes('SECTION_STYLE_PRESETS') && l.includes('../constants'));
             if (alreadyHas) return;
          }
          if (trimmed === "import RichTextEditor from '@/components/RichTextEditor';") {
             const alreadyHas = newLines.some(l => l.includes('RichTextEditor') && l.includes('@/components/RichTextEditor') && l !== line);
             // Since we added it to seenImports, the exact match check above caught it, 
             // but if there are whitespace differences, this catches it.
             if (alreadyHas) return;
          }
          if (trimmed === "import MathInput from '@/components/MathInput';") {
             const alreadyHas = newLines.some(l => l.includes('MathInput') && l.includes('@/components/MathInput') && l !== line);
             if (alreadyHas) return;
          }
        }
        newLines.push(line);
      });
      
      fs.writeFileSync(file, newLines.join('\n'));
      console.log('Cleaned duplicate imports in', file);
    }
  });
});

console.log('Done cleaning imports!');
