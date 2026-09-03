const fs = require('fs');

function applySyncToEdit(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  const searchStr = '  React.useEffect(() => {\\n    if (!roleFallbackHref) return;\\n    router.replace(roleFallbackHref);\\n  }, [roleFallbackHref, router]);';
  const insertion = `  React.useEffect(() => {
    if (!roleFallbackHref) return;
    router.replace(roleFallbackHref);
  }, [roleFallbackHref, router]);

  React.useEffect(() => {
    if (moduleMode && examData?.title && resolvedModule && resolvedModule.title !== examData.title) {
      setModules((prev) => {
        if (!prev?.length) return prev;
        const next = [...prev];
        next[0] = { ...next[0], title: examData.title };
        return next;
      });
    }
  }, [examData?.title, moduleMode, resolvedModule]);

  React.useEffect(() => {
    if (moduleMode && resolvedModule?.title && resolvedModule.title !== examData?.title) {
      setExamData((prev) => ({ ...prev, title: resolvedModule.title }));
    }
  }, [resolvedModule?.title, moduleMode]);`;

  const index = code.indexOf('  React.useEffect(() => {\n    if (!roleFallbackHref) return;\n    router.replace(roleFallbackHref);\n  }, [roleFallbackHref, router]);');

  if (index > -1) {
    const updated = code.replace('  React.useEffect(() => {\n    if (!roleFallbackHref) return;\n    router.replace(roleFallbackHref);\n  }, [roleFallbackHref, router]);', insertion);
    fs.writeFileSync(filePath, updated);
    console.log("Updated", filePath);
  } else {
    console.log("Could not find string in", filePath);
  }
}

applySyncToEdit('src/app/super-admin/exams/edit/[id]/page.tsx');
