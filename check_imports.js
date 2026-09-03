const fs = require('fs');
const path = require('path');

const filesToCheck = [
  'src/app/super-admin/exams/new/components/QuestionsBuilder.tsx',
  'src/app/super-admin/exams/new/components/ModuleModal.tsx'
];

filesToCheck.forEach(file => {
  const content = fs.readFileSync(path.join('d:/mina/front', file), 'utf8');
  
  const tags = [...content.matchAll(/<([A-Z][a-zA-Z0-9]*)/g)].map(m => m[1]);
  const uniqueTags = [...new Set(tags)];
  
  console.log('\\n--- File: ' + file + ' ---');
  
  uniqueTags.forEach(tag => {
    const isImported = new RegExp('import .*\\\\b' + tag + '\\\\b.*').test(content);
    const isDefined = new RegExp('(const|function|let|var|class)\\\\s+' + tag + '\\\\b').test(content);
    
    if (!isImported && !isDefined) {
      console.log('Missing: ' + tag);
    }
  });
});
