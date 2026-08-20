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

  const uiPath = path.join(dir, 'components', 'ModuleModal.tsx');
  if (fs.existsSync(uiPath)) {
    let content = fs.readFileSync(uiPath, 'utf8');

    // Fix currentModule.subExams[ => currentModule.subExams?.[
    if (content.includes('currentModule.subExams[')) {
        content = content.replaceAll('currentModule.subExams[', 'currentModule.subExams?.[');
        fs.writeFileSync(uiPath, content);
        console.log(`Updated ${uiPath}`);
    } else {
        console.log(`No fix needed in ${uiPath}`);
    }
  }
});
