const fs = require('fs');
const path = require('path');

const files = [
  'src/app/super-admin/exams/edit/[id]/page.tsx',
  'src/app/school-admin/exams/edit/[id]/page.tsx'
];

for (const relPath of files) {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) continue;

  let content = fs.readFileSync(fullPath, 'utf8');

  const fixBlock = `
            if (data.questions) {
              const unassigned = data.questions.filter((q: any) => !q.moduleId);
              const processedUnassigned = unassigned.map((q: any) => {
                let parsedExps = [''];
                try {
                  parsedExps = typeof q.explanation === 'string' && q.explanation.startsWith('[') ? JSON.parse(q.explanation) : (q.explanations || ['']);
                  if (!Array.isArray(parsedExps)) parsedExps = [q.explanation || ''];
                } catch (e) {
                  parsedExps = [q.explanation || ''];
                }
                return { ...q, explanations: parsedExps };
              });
              
              setStandaloneQuestions((prev: any[]) => prev.map((q, qIdx) => {
                const serverQ = processedUnassigned[qIdx];
                return serverQ && !q.id ? { ...q, id: serverQ.id } : q;
              }));
            }
          }
          setLastAutoSave(new Date());`;

  // Only apply if it doesn't already exist
  if (!content.includes('const serverQ = processedUnassigned[qIdx];')) {
    content = content.replace(/          \}\r?\n          setLastAutoSave\(new Date\(\)\);/g, fixBlock);
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Applied ID sync fix to ${relPath}`);
  }
}
