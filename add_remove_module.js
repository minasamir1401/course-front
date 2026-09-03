const fs = require('fs');

const hookFiles = [
  'src/app/super-admin/exams/new/hooks/useModuleManagement.ts',
  'src/app/super-admin/exams/edit/[id]/hooks/useModuleManagement.ts',
  'src/app/school-admin/exams/new/hooks/useModuleManagement.ts',
  'src/app/school-admin/exams/edit/[id]/hooks/useModuleManagement.ts'
];

const handleRemoveModuleFn = `
  const handleRemoveModule = (index: number) => {
    const confirmMessage = language === 'ar' ? "هل أنت متأكد من حذف هذه الوحدة؟" : "Are you sure you want to delete this module?";
    if (confirm(confirmMessage)) {
      const newModules = [...modules];
      newModules.splice(index, 1);
      setModules(newModules);
    }
  };
`;

hookFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf-8');
    
    // Inject before the return statement
    if (!code.includes('const handleRemoveModule =')) {
      code = code.replace(/return \{/, handleRemoveModuleFn + '\n  return {');
      fs.writeFileSync(file, code);
      console.log('Fixed', file);
    }
  }
});
console.log('Done!');
