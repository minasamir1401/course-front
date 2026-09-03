const fs = require('fs');
const path = require('path');
const directories = [
  'src/app/super-admin/exams/new/components/ModuleModal.tsx',
  'src/app/super-admin/exams/edit/[id]/components/ModuleModal.tsx',
  'src/app/school-admin/exams/new/components/ModuleModal.tsx',
  'src/app/school-admin/exams/edit/[id]/components/ModuleModal.tsx'
];
directories.forEach(file => {
  const fullPath = path.join('d:/mina/front', file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    const youtubeRegex = /<div>\s*<label[^>]*>\s*\{language === 'ar' \? [^\}]+\}\s*<\/label>\s*<input[^>]+value=\{currentModule\.videoUrl\}[^>]+>\s*<\/div>/g;
    content = content.replace(youtubeRegex, '');
    
    const lessonContentRegex = /<div className=\"space-y-3\">\s*<label[^>]*>\s*\{language === 'ar' \? \"محتوى الدرس\" : \"Lesson Content\"\}\s*<\/label>\s*<textarea[^>]+value=\{currentModule\.content[\s\S]*?<\/textarea>\s*<\/div>/g;
    content = content.replace(lessonContentRegex, '');
    
    fs.writeFileSync(fullPath, content);
    console.log('Fixed ' + fullPath);
  }
});
