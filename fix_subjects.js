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

  // Fix 1: Parsing data.subjects when loading (in edit/[id]/page.tsx)
  content = content.replace(
    /subjects:\s*data\.subjects\s*\|\|\s*\[\],/,
    `subjects: (() => {
              if (Array.isArray(data.subjects)) return data.subjects;
              if (typeof data.subjects === 'string') {
                try { return JSON.parse(data.subjects); } catch { return [data.subjects]; }
              }
              return [];
            })(),`
  );

  // Fix 2: Remove subjectString generation
  content = content.replace(/const subjectString = \(examData\.subjects \|\| \[\]\)\.join\(\", \"\);\r?\n?/g, '');

  // Fix 3: In payload, replace subject: subjectString with subjects: examData.subjects || []
  content = content.replace(
    /subject:\s*subjectString\s*\|\|\s*\([^)]*\),/g,
    `subjects: examData.subjects || [],`
  );
  
  // also catch the one without fallback (in some files maybe just subject: subjectString,)
  content = content.replace(
    /subject:\s*subjectString,/g,
    `subjects: examData.subjects || [],`
  );

  fs.writeFileSync(file, content);
  console.log(`Fixed ${file}`);
}
