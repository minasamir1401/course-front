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

  const uiPath = path.join(dir, 'components', 'QuestionsBuilder.tsx');
  if (fs.existsSync(uiPath)) {
    let content = fs.readFileSync(uiPath, 'utf8');

    const importLineMatch = content.match(/import \{([^}]+)\} from 'lucide-react';/);
    if (importLineMatch) {
      let imports = importLineMatch[1];
      const missing = ['Upload', 'Download', 'Target', 'X', 'Save'];
      missing.forEach(m => {
        if (!imports.includes(m)) {
          imports += ", " + m;
        }
      });
      content = content.replace(importLineMatch[0], "import { " + imports + " } from 'lucide-react';");
      fs.writeFileSync(uiPath, content);
      console.log("Fixed " + uiPath);
    }
  }
});
