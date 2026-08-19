const fs = require('fs');
const path = require('path');

function processFile(relPath) {
  const filePath = path.join(__dirname, relPath);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split('\n');

  let inRunAutoSave = false;
  let inHandleSubmit = false;
  
  let newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Track where we are
    if (line.includes('const runAutoSave = async () => {')) {
      inRunAutoSave = true;
    } else if (inRunAutoSave && line.includes('const url = activeExamId')) {
      inRunAutoSave = false;
    }
    
    if (line.includes('const handleSubmit = async (e: React.FormEvent) => {')) {
      inHandleSubmit = true;
    } else if (inHandleSubmit && line.includes('const url = activeExamId')) {
      inHandleSubmit = false;
    }

    // Fix double push in runAutoSave
    if (inRunAutoSave && line.includes('allQuestions.push(...(standaloneQuestions || []).map(q => ({ ...q, moduleId: null })));')) {
      // Check if the previous non-empty line was also this push
      let prevNonEmptyIdx = newLines.length - 1;
      while (prevNonEmptyIdx >= 0 && newLines[prevNonEmptyIdx].trim() === '') {
        prevNonEmptyIdx--;
      }
      if (prevNonEmptyIdx >= 0 && newLines[prevNonEmptyIdx].includes('allQuestions.push(...(standaloneQuestions || []).map(q => ({ ...q, moduleId: null })));')) {
        // Skip duplicate
        continue;
      }
    }
    
    // Fix missing push in handleSubmit
    if (inHandleSubmit && line.includes('const activeExamId = createdIdRef.current;')) {
      // Check if we already pushed standaloneQuestions before this
      let hasPush = false;
      for (let j = newLines.length - 1; j >= newLines.length - 20; j--) {
        if (newLines[j] && newLines[j].includes('standaloneQuestions')) {
          hasPush = true;
          break;
        }
      }
      if (!hasPush) {
        newLines.push('      allQuestions.push(...(standaloneQuestions || []).map(q => ({ ...q, moduleId: null })));');
      }
    }

    newLines.push(line);
  }

  fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
  console.log('Processed ' + relPath);
}

processFile('src/app/super-admin/exams/edit/[id]/page.tsx');
processFile('src/app/school-admin/exams/edit/[id]/page.tsx');
