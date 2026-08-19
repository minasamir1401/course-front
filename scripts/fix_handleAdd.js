const fs = require('fs');
const files = [
  'src/app/super-admin/exams/new/page.tsx',
  'src/app/school-admin/exams/new/page.tsx',
  'src/app/super-admin/exams/edit/[id]/page.tsx',
  'src/app/school-admin/exams/edit/[id]/page.tsx'
];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const handleAddQuestion = \(type: string( = 'MCQ')?\) => \{/, "const handleAddQuestion = (type: string = 'MCQ', moduleId: string | null = null) => {");
  content = content.replace(/text: "", type, options:/, 'text: "", type, moduleId, options:');
  fs.writeFileSync(file, content);
  console.log("Fixed", file);
}
