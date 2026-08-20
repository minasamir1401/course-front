const fs = require('fs');
const path = require('path');

const dirs = [
  'src/app/super-admin/exams/new',
  'src/app/super-admin/exams/edit/[id]',
  'src/app/school-admin/exams/new',
  'src/app/school-admin/exams/edit/[id]'
];

const sourceUtilsDir = 'src/app/super-admin/exams/new/utils';

// Ensure the utils folder exists in all and copy contents
if (fs.existsSync(sourceUtilsDir)) {
  const utilFiles = fs.readdirSync(sourceUtilsDir);
  
  dirs.forEach(d => {
    const targetUtilsDir = d + '/utils';
    if (!fs.existsSync(targetUtilsDir)) {
      fs.mkdirSync(targetUtilsDir, { recursive: true });
    }
    
    utilFiles.forEach(f => {
      const sourceFile = sourceUtilsDir + '/' + f;
      const targetFile = targetUtilsDir + '/' + f;
      if (!fs.existsSync(targetFile)) {
        fs.copyFileSync(sourceFile, targetFile);
        console.log('Copied', f, 'to', d);
      }
    });
  });
}
console.log('Utils synchronized!');
