const fs = require('fs');
const filePath = 'd:/mina/front/src/app/super-admin/exams/edit/[id]/hooks/useExamAutosave.ts';
let content = fs.readFileSync(filePath, 'utf8');

const correctPrefix = `    if (!isAutoSaveEnabled || isLoading || manualSubmitRef.current) return;

    const snapshot = JSON.stringify({ createdId, examData, modules, isModuleModalOpen, currentModule, editingModuleIndex });
    if (snapshot === lastAutoSaveSnapshotRef.current) return;
    lastAutoSaveSnapshotRef.current = snapshot;
    const requestGeneration = ++autoSaveGenerationRef.current;
    
    const timer = setTimeout(() => {
      const runAutoSave = async () => {
        if (manualSubmitRef.current || requestGeneration !== autoSaveGenerationRef.current) return;
      try {
        const token = localStorage.getItem("super_admin_token");
        if (!token) return;

        const finalModules = [...modules];
        if (isModuleModalOpen && currentModule.title) {
          if (editingModuleIndex !== null) {
            finalModules[editingModuleIndex] = currentModule;
          } else {
            finalModules.push(currentModule);
          }
        }`;

content = content.replace(/    if \(\!isAutoSaveEnabled[\s\S]*?finalModules\.push\(currentModule\);\n          }\n        }/, correctPrefix);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed useExamAutosave.ts syntax');
