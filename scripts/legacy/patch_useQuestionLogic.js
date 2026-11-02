const fs = require('fs');

const files = [
  'd:/mina/front/src/app/super-admin/exams/new/hooks/useQuestionLogic.tsx',
  'd:/mina/front/src/app/super-admin/exams/edit/[id]/hooks/useQuestionLogic.tsx',
  'd:/mina/front/src/app/school-admin/exams/new/hooks/useQuestionLogic.tsx',
  'd:/mina/front/src/app/school-admin/exams/edit/[id]/hooks/useQuestionLogic.tsx',
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. handleSaveQuestionForSource
    const saveRegex = /setCurrentModule\(\(prev: any\) => \{\s*const newList = \[\.\.\.\(prev\[source\] \|\| \[\]\)\];\s*if \(editingQuestionIndex !== null\) newList\[editingQuestionIndex\] = itemToSave;\s*else newList\.push\(itemToSave\);\s*return \{ \.\.\.prev, \[source\]: newList \};\s*\}\);/g;
    
    content = content.replace(saveRegex, `setCurrentModule((prev: any) => {
      if (source === 'questions' && activeSubExamIndex !== null && prev.subExams && prev.subExams[activeSubExamIndex]) {
        const newSubExams = [...prev.subExams];
        const newQuestions = [...(newSubExams[activeSubExamIndex].questions || [])];
        if (editingQuestionIndex !== null) newQuestions[editingQuestionIndex] = itemToSave;
        else newQuestions.push(itemToSave);
        newSubExams[activeSubExamIndex] = { ...newSubExams[activeSubExamIndex], questions: newQuestions };
        return { ...prev, subExams: newSubExams };
      } else {
        const newList = [...(prev[source] || [])];
        if (editingQuestionIndex !== null) newList[editingQuestionIndex] = itemToSave;
        else newList.push(itemToSave);
        return { ...prev, [source]: newList };
      }
    });`);

    // 2. removeQuestionForSource
    const removeRegex = /setCurrentModule\(\(prev: any\) => \{\s*const newList = \[\.\.\.\(prev\[source\] \|\| \[\]\)\];\s*newList\.splice\(index, 1\);\s*return \{ \.\.\.prev, \[source\]: newList \};\s*\}\);/g;

    content = content.replace(removeRegex, `setCurrentModule((prev: any) => {
      if (source === 'questions' && activeSubExamIndex !== null && prev.subExams && prev.subExams[activeSubExamIndex]) {
        const newSubExams = [...prev.subExams];
        const newQuestions = [...(newSubExams[activeSubExamIndex].questions || [])];
        newQuestions.splice(index, 1);
        newSubExams[activeSubExamIndex] = { ...newSubExams[activeSubExamIndex], questions: newQuestions };
        return { ...prev, subExams: newSubExams };
      } else {
        const newList = [...(prev[source] || [])];
        newList.splice(index, 1);
        return { ...prev, [source]: newList };
      }
    });`);

    // 3. moveQuestionForSource
    const moveRegex = /if \(targetIndex < 0 \|\| targetIndex >= \(currentModule\[source\] \|\| \[\]\)\.length\) return;\s*setCurrentModule\(\(prev: any\) => \{\s*const newList = \[\.\.\.\(prev\[source\] \|\| \[\]\)\];\s*\[newList\[index\], newList\[targetIndex\]\] = \[newList\[targetIndex\], newList\[index\]\];\s*return \{ \.\.\.prev, \[source\]: newList \};\s*\}\);/g;

    content = content.replace(moveRegex, `setCurrentModule((prev: any) => {
      if (source === 'questions' && activeSubExamIndex !== null && prev.subExams && prev.subExams[activeSubExamIndex]) {
        const newSubExams = [...prev.subExams];
        const newQuestions = [...(newSubExams[activeSubExamIndex].questions || [])];
        if (targetIndex < 0 || targetIndex >= newQuestions.length) return prev;
        [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
        newSubExams[activeSubExamIndex] = { ...newSubExams[activeSubExamIndex], questions: newQuestions };
        return { ...prev, subExams: newSubExams };
      } else {
        const newList = [...(prev[source] || [])];
        if (targetIndex < 0 || targetIndex >= newList.length) return prev;
        [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
        return { ...prev, [source]: newList };
      }
    });`);

    fs.writeFileSync(file, content, 'utf8');
    console.log('Patched ' + file);
  }
}
