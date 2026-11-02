const fs = require('fs');

const hookFiles = [
  'src/app/super-admin/exams/new/hooks/useModuleManagement.ts',
  'src/app/super-admin/exams/edit/[id]/hooks/useModuleManagement.ts',
  'src/app/school-admin/exams/new/hooks/useModuleManagement.ts',
  'src/app/school-admin/exams/edit/[id]/hooks/useModuleManagement.ts'
];

hookFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf-8');
    
    // First, remove the incorrectly placed handleRemoveModule block if it exists
    const badRegex = /\s*const handleRemoveModule = \(\w+: \w+\) => \{\s*const confirmMessage[^]*?setModules\(newModules\);\s*\}\s*};\s*/;
    code = code.replace(badRegex, '\n');

    // Also remove the old handleRemoveModuleFn block entirely just in case
    const badRegex2 = /\s*const handleRemoveModule = \(index: number\) => \{\s*const confirmMessage = language === 'ar' \? "هل أنت متأكد من حذف هذه الوحدة؟" : "Are you sure you want to delete this module\?";\s*if \(confirm\(confirmMessage\)\) \{\s*const newModules = \[\.\.\.modules\];\s*newModules\.splice\(index, 1\);\s*setModules\(newModules\);\s*\}\s*\};\s*/g;
    code = code.replace(badRegex2, '\n');

    // Now inject it correctly right before the final return statement
    const properFn = `
  const handleRemoveModule = (index: number) => {
    const confirmMessage = language === 'ar' ? "هل أنت متأكد من حذف هذه الوحدة؟" : "Are you sure you want to delete this module?";
    if (confirm(confirmMessage)) {
      const newModules = [...modules];
      newModules.splice(index, 1);
      setModules(newModules);
    }
  };
`;

    // Find the last return { 
    const lastReturnIndex = code.lastIndexOf('return {');
    if (lastReturnIndex !== -1) {
      code = code.slice(0, lastReturnIndex) + properFn + '\n  ' + code.slice(lastReturnIndex);
      fs.writeFileSync(file, code);
      console.log('Fixed', file);
    }
  }
});
console.log('Done!');
