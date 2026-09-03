const fs = require('fs');
const path = require('path');

const directories = [
  'src/app/super-admin/exams/new',
  'src/app/super-admin/exams/edit/[id]',
  'src/app/school-admin/exams/new',
  'src/app/school-admin/exams/edit/[id]'
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) return;

  // 1. types.ts
  const typesPath = path.join(dir, 'types.ts');
  if (fs.existsSync(typesPath)) {
    let content = fs.readFileSync(typesPath, 'utf8');
    if (!content.includes('export interface SubExamData')) {
      content += `\nexport interface SubExamData {
  id?: string;
  title: string;
  duration?: number;
  passingScore?: number;
  attemptsAllowed?: number;
  questions: Question[];
}\n`;
    }
    if (!content.includes('subExams: SubExamData[]')) {
      content = content.replace('questions: Question[];', 'questions: Question[];\n  subExams: SubExamData[];');
    }
    if (!content.includes('subExamId?: string') && content.includes('[key: string]: any;')) {
        content = content.replace('[key: string]: any;', 'subExamId?: string;\n  [key: string]: any;');
    }
    fs.writeFileSync(typesPath, content);
    console.log(`Updated ${typesPath}`);
  }
});
