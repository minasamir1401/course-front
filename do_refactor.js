const fs = require('fs');
const files = [
  'src/app/school-admin/exams/edit/[id]/page.tsx',
  'src/app/school-admin/exams/new/page.tsx',
  'src/app/super-admin/exams/edit/[id]/page.tsx',
  'src/app/super-admin/exams/new/page.tsx'
];

function processFile(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('const renderQuestionForm = () =>')) {
    console.log(file + ' already refactored');
    return;
  }

  const formStartStr = '{showQuestionForm && (';
  let formStartIdx = content.indexOf(formStartStr);
  if (formStartIdx === -1) return;

  let open = 0, formEndIdx = -1;
  for (let i = formStartIdx; i < content.length; i++) {
    if (content[i] === '{') open++;
    if (content[i] === '}') {
      open--;
      if (open === 0) { formEndIdx = i; break; }
    }
  }

  if (formEndIdx === -1) return;

  const formBlock = content.substring(formStartIdx, formEndIdx + 1);
  const innerJSX = formBlock.substring(formStartStr.length, formBlock.length - 2).trim();

  const renderFn = `\n  const renderQuestionForm = () => (\n    ${innerJSX}\n  );\n`;
  
  let returnIdx = content.indexOf('return (\n    <DashboardLayout');
  if (returnIdx === -1) returnIdx = content.indexOf('return (\r\n    <DashboardLayout');
  if (returnIdx === -1) {
     const match = content.match(/return\s*\(\s*<DashboardLayout/);
     if (match) returnIdx = match.index;
  }
  
  if (returnIdx === -1) return;

  content = content.substring(0, returnIdx) + renderFn + content.substring(returnIdx);

  // Re-find the formBlock because indices changed
  content = content.replace(formBlock, '{showQuestionForm && editingIndex === null && renderQuestionForm()}');

  // Now handle questions.map
  let mapStartIdx = content.lastIndexOf('{questions.map(');
  if (mapStartIdx === -1) return;

  open = 0;
  let mapEndIdx = -1;
  for (let i = mapStartIdx; i < content.length; i++) {
    if (content[i] === '{') open++;
    if (content[i] === '}') {
      open--;
      if (open === 0) { mapEndIdx = i; break; }
    }
  }

  if (mapEndIdx !== -1) {
    const beforeEnd = content.substring(mapEndIdx - 50, mapEndIdx);
    const divMatch = beforeEnd.lastIndexOf('</div>');
    if (divMatch !== -1) {
        const absoluteDivIdx = mapEndIdx - 50 + divMatch;
        const inlineBlock = `\n                    {showQuestionForm && editingIndex === index && (\n                      <div className="border-t-2 border-dashed border-indigo-100 p-6 bg-slate-50/80 mt-4 rounded-b-[30px]">\n                        {renderQuestionForm()}\n                      </div>\n                    )}\n                  `;
        content = content.substring(0, absoluteDivIdx) + inlineBlock + content.substring(absoluteDivIdx);
    }
  }

  // Remove auto-scrolls
  content = content.replace(/setTimeout\(\(\) => \{\s*window\.scrollTo\(\{ top: document\.body\.scrollHeight, behavior: 'smooth' \}\);\s*\}, 100\);/g, '');

  fs.writeFileSync(file, content);
  console.log('Refactored ' + file);
}

files.forEach(processFile);
