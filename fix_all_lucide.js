const fs = require('fs');
const path = require('path');

const requiredIcons = {
  'QuestionsBuilder.tsx': [
    'HelpCircle', 'Upload', 'Download', 'Plus', 'ChevronUp', 'ChevronDown', 
    'Edit2', 'Trash2', 'Target', 'X', 'CheckCircle2', 'Save', 'MoveUp', 'MoveDown', 
    'Layout', 'Settings', 'Activity', 'Mic', 'Video', 'FileText', 'Check'
  ],
  'ModuleModal.tsx': [
    'Monitor', 'X', 'Target', 'Upload', 'Download', 'CheckCircle2', 
    'AlertCircle', 'Plus', 'Edit2', 'Trash2', 'FileText', 'Clock', 'HelpCircle', 'ListOrdered'
  ]
};

const directories = [
  'src/app/super-admin/exams/new',
  'src/app/super-admin/exams/edit/[id]',
  'src/app/school-admin/exams/new',
  'src/app/school-admin/exams/edit/[id]'
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) return;

  ['QuestionsBuilder.tsx', 'ModuleModal.tsx'].forEach(filename => {
    const uiPath = path.join(dir, 'components', filename);
    if (!fs.existsSync(uiPath)) return;

    let content = fs.readFileSync(uiPath, 'utf8');

    const regex = /import\\s+\\{([\\s\\S]*?)\\}\\s+from\\s+['"]lucide-react['"];/;
    const match = content.match(regex);

    if (match) {
      const currentImportsRaw = match[1];
      const currentImports = currentImportsRaw.split(',').map(s => s.trim()).filter(Boolean);
      const needed = requiredIcons[filename];

      let added = false;
      needed.forEach(icon => {
        const hasIcon = currentImports.some(imp => imp === icon || imp.startsWith(icon + ' as '));
        if (!hasIcon) {
          currentImports.push(icon);
          added = true;
        }
      });

      if (added) {
        const newImportStr = "import { " + currentImports.join(', ') + " } from 'lucide-react';";
        content = content.replace(match[0], newImportStr);
        fs.writeFileSync(uiPath, content);
        console.log("Updated " + uiPath);
      } else {
        console.log("No changes needed for " + uiPath);
      }
    }
  });
});
