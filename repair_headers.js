const fs = require('fs');
const path = require('path');

function repair(relPath) {
  const filePath = path.join(__dirname, relPath);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove corrupted header
  const badHeaderRegex = /^const removeQuestionForSource = [\s\S]*?\)\)\);"use client";\r?\n?/m;
  if (badHeaderRegex.test(content)) {
    content = content.replace(badHeaderRegex, '"use client";\n');
  } else if (!content.trim().startsWith('"use client";')) {
    // Fallback if regex didn't perfectly match but we know it's broken
    const idx = content.indexOf('"use client";');
    if (idx !== -1) {
      content = content.substring(idx);
    }
  }

  // Replace real removeQuestionForSource
  const realRemoveMatch = /const removeQuestionForSource = \(source: 'assignments' \| 'questions', index: number\) => \{\s*if \(!confirm[^)]+\)\) return;\s*setCurrentModule\(\(prev: any\) => \{\s*const newList = \[\.\.\.\(prev\[source\] \|\| \[\]\)\];\s*newList\.splice\(index, 1\);\s*return \{ \.\.\.prev, \[source\]: newList \};\s*\}\);\s*setExpandedQuestionIndex[^\n]+\n\s*showToast[^\n]+\n\s*\};/m;

  const fixedRemove = `const removeQuestionForSource = (source: 'assignments' | 'questions', index: number) => {
    if (!confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا السؤال؟" : "Are you sure you want to delete this question?")) return;
    const targetQ = currentModule[source]?.[index];
    if (targetQ?.id) {
      deletedQuestionIdsRef.current.push(targetQ.id);
    }
    setCurrentModule((prev: any) => {
      const newList = [...(prev[source] || [])];
      newList.splice(index, 1);
      return { ...prev, [source]: newList };
    });
    setExpandedQuestionIndex((expanded) => expanded === index ? null : (expanded !== null && expanded > index ? expanded - 1 : expanded));
    showToast(language === 'ar' ? "تم حذف السؤال" : "Question deleted", "info");
  };`;

  if (realRemoveMatch.test(content)) {
    content = content.replace(realRemoveMatch, fixedRemove);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Repaired ' + relPath);
}

repair('src/app/super-admin/exams/edit/[id]/page.tsx');
repair('src/app/school-admin/exams/edit/[id]/page.tsx');
