const fs = require('fs');
const path = require('path');
const directories = [
  'src/app/super-admin/exams/new/hooks/useExamState.ts',
  'src/app/super-admin/exams/edit/[id]/hooks/useExamState.ts',
  'src/app/school-admin/exams/new/hooks/useExamState.ts',
  'src/app/school-admin/exams/edit/[id]/hooks/useExamState.ts'
];
directories.forEach(file => {
  const fullPath = path.join('d:/mina/front', file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    const target = '    customSkills, setCustomSkills\\n  };\\n};';
    const replacement = '    customSkills, setCustomSkills,\\n    activeSubExamIndex, setActiveSubExamIndex,\\n    isSubExamModalOpen, setIsSubExamModalOpen\\n  };\\n};';

    if (content.includes(target)) {
        content = content.replace(target, replacement);
        fs.writeFileSync(fullPath, content);
        console.log('Fixed ' + fullPath);
    } else {
        // Try regex if exact literal match fails due to \r\n vs \n
        const targetRegex = /customSkills, setCustomSkills\r?\n\s*};\r?\n};/;
        const replacement2 = 'customSkills, setCustomSkills,\n    activeSubExamIndex, setActiveSubExamIndex,\n    isSubExamModalOpen, setIsSubExamModalOpen\n  };\n};';
        if (targetRegex.test(content)) {
            content = content.replace(targetRegex, replacement2);
            fs.writeFileSync(fullPath, content);
            console.log('Regex Fixed ' + fullPath);
        }
    }
  }
});
