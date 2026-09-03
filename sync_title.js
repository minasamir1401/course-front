const fs = require('fs');

function applySync(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  const searchStr = '  const [editingDraftExamTitle, setEditingDraftExamTitle] = React.useState("");';
  const insertion = `  const [editingDraftExamTitle, setEditingDraftExamTitle] = React.useState("");

  React.useEffect(() => {
    if (moduleMode && examData?.title && primaryModule && primaryModule.title !== examData.title) {
      if (typeof updatePrimaryModule === 'function') {
        updatePrimaryModule((m) => ({ ...m, title: examData.title }));
      } else {
        setModules(prev => {
          if (!prev?.length) return prev;
          const next = [...prev];
          next[0] = { ...next[0], title: examData.title };
          return next;
        });
      }
    }
  }, [examData?.title, moduleMode]);

  React.useEffect(() => {
    if (moduleMode && primaryModule?.title && primaryModule.title !== examData?.title) {
      setExamData((prev) => ({ ...prev, title: primaryModule.title }));
    }
  }, [primaryModule?.title, moduleMode]);`;

  const lines = code.split('\\n');
  const index = lines.findIndex(l => l.includes(searchStr));

  if (index > -1) {
    lines[index] = insertion;
    fs.writeFileSync(filePath, lines.join('\\n'));
    console.log("Updated", filePath);
  } else {
    console.log("Could not find line in", filePath);
  }
}

applySync('src/app/super-admin/exams/new/page.tsx');
applySync('src/app/super-admin/exams/edit/[id]/page.tsx');
