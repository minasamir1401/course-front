const fs = require('fs');

const files = [
  'src/app/super-admin/exams/edit/[id]/page.tsx',
  'src/app/super-admin/exams/new/page.tsx',
  'src/app/school-admin/exams/edit/[id]/page.tsx',
  'src/app/school-admin/exams/new/page.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Add standaloneQuestions to allQuestions payload
  content = content.replace(
    /allQuestions\.push\(\.\.\.mQuestions\);\r?\n?([ \t]*)return \{/g,
    `allQuestions.push(...mQuestions);\n$1return {`
  );

  // But we need to push standaloneQuestions OUTSIDE the modules map!
  // Let's find: const payload = {
  content = content.replace(
    /const payload = \{/g,
    `allQuestions.push(...(standaloneQuestions || []).map(q => ({ ...q, moduleId: null })));\n        const payload = {`
  );

  fs.writeFileSync(file, content);
  console.log(`Fixed ${file}`);
}
