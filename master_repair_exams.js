const fs = require('fs');
const path = require('path');

const dirs = [
  'src/app/super-admin/exams/new',
  'src/app/super-admin/exams/edit/[id]',
  'src/app/school-admin/exams/new',
  'src/app/school-admin/exams/edit/[id]'
];

// Step 1: Ensure constants.ts exists in all dirs
const constantsCode = fs.readFileSync('src/app/super-admin/exams/new/constants.ts', 'utf-8');
dirs.forEach(d => {
  if (!fs.existsSync(d + '/constants.ts')) {
    fs.writeFileSync(d + '/constants.ts', constantsCode);
    console.log('Created constants.ts in', d);
  }
});

// Helper to inject imports
function injectImports(filePath, importsStr) {
  if (fs.existsSync(filePath)) {
    let code = fs.readFileSync(filePath, 'utf-8');
    if (!code.includes(importsStr.split('\n')[0])) {
      const importRegex = /import .*? from .*?;/g;
      let lastImportEnd = 0;
      let match;
      while ((match = importRegex.exec(code)) !== null) {
        lastImportEnd = match.index + match[0].length;
      }
      if (lastImportEnd > 0) {
        code = code.slice(0, lastImportEnd) + '\n' + importsStr + code.slice(lastImportEnd);
      } else {
        code = importsStr + '\n' + code;
      }
      fs.writeFileSync(filePath, code);
      console.log('Injected imports in', filePath);
    }
  }
}

// Step 2: Fix SlidesBuilder imports
const builderImports = `
import { ChevronUp, ChevronDown, CheckCircle2, Edit2, Trash2, Plus, FileText, Settings, Activity, MoveUp, MoveDown, Mic, Video, Image as ImageIcon, Layout, Check } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import { getOptionLetter } from '@/lib/utils';
import MathInput from '@/components/MathInput';
import InteractiveQuestionEditor from '@/components/InteractiveQuestionEditor';
import { SECTION_STYLE_PRESETS } from '../constants';
`;

dirs.forEach(d => {
  let file = d + '/components/SlidesBuilder.tsx';
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf-8');
    code = code.replace(/import \{.*lucide-react.*\r?\n/, '');
    fs.writeFileSync(file, code);
    injectImports(file, builderImports);
  }
});

dirs.forEach(d => {
  let file = d + '/components/QuestionsBuilder.tsx';
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf-8');
    code = code.replace(/import \{.*lucide-react.*\r?\n/, '');
    fs.writeFileSync(file, code);
    injectImports(file, builderImports);
  }
});

// Step 3: Pass missing props in page.tsx
dirs.forEach(d => {
  let file = d + '/page.tsx';
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf-8');
    
    const extraProps = ` openDropdownId={openDropdownId} setOpenDropdownId={setOpenDropdownId} allExistingSkills={allExistingSkills} setCustomSkills={setCustomSkills} addBlock={lessonBuilder.addBlock} insertBlockAt={lessonBuilder.insertBlockAt} updateBlock={lessonBuilder.updateBlock} updateBlockTypeAndReset={lessonBuilder.updateBlockTypeAndReset} moveBlock={lessonBuilder.moveBlock} removeBlock={lessonBuilder.removeBlock} addSection={lessonBuilder.addSection} removeSection={lessonBuilder.removeSection} updateSection={lessonBuilder.updateSection} setIsQuestionIndicatorOpen={questionLogic.setIsQuestionIndicatorOpen} setIsQuestionOutcomeOpen={questionLogic.setIsQuestionOutcomeOpen} setIsQuestionStandardOpen={questionLogic.setIsQuestionStandardOpen} `;

    code = code.replace(/<SlidesBuilder/g, '<SlidesBuilder' + extraProps);
    code = code.replace(/<QuestionsBuilder/g, '<QuestionsBuilder' + extraProps);

    if (!code.includes('const [openDropdownId')) {
      code = code.replace(/const \[examData/g, 'const [openDropdownId, setOpenDropdownId] = React.useState<string | null>(null);\n  const [allExistingSkills, setAllExistingSkills] = React.useState<string[]>([]);\n  const [customSkills, setCustomSkills] = React.useState<string[]>([]);\n  const [examData');
    }
    
    fs.writeFileSync(file, code);
    console.log('Fixed page props in', file);
  }
});

// Step 4: Fix hooks imports
const hookImports = `
import { ChevronDown, Edit2, Trash2, Plus } from 'lucide-react';
`;
dirs.forEach(d => {
  let file = d + '/hooks/useQuestionLogic.tsx';
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf-8');
    if (!code.includes('lucide-react')) {
      code = hookImports + code;
      fs.writeFileSync(file, code);
      console.log('Fixed hook imports in', file);
    }
  }
});

console.log('Master repair completed!');
