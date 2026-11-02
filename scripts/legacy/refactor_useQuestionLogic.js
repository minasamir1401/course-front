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

  const hookPath = path.join(dir, 'hooks', 'useQuestionLogic.tsx');
  if (fs.existsSync(hookPath)) {
    let content = fs.readFileSync(hookPath, 'utf8');

    // Add activeSubExamIndex to props
    if (!content.includes('activeSubExamIndex')) {
        content = content.replace(
            'const { currentModule',
            'const { currentModule, activeSubExamIndex'
        );
    }

    // Refactor handleEditQuestionForSource
    const editStr = `const list = currentModule[source] || [];`;
    if (content.includes(editStr)) {
        content = content.replace(editStr, 
            `const list = (source === 'questions' && activeSubExamIndex !== null && currentModule.subExams && currentModule.subExams[activeSubExamIndex]) ? (currentModule.subExams[activeSubExamIndex].questions || []) : (currentModule[source] || []);`
        );
    }

    // Refactor handleSaveQuestionForSource
    const saveStr = `    setCurrentModule((prev: any) => {
      const newList = [...(prev[source] || [])];
      if (editingQuestionIndex !== null) newList[editingQuestionIndex] = itemToSave;
      else newList.push(itemToSave);
      return { ...prev, [source]: newList };
    });`;
    
    if (content.includes(saveStr)) {
        content = content.replace(saveStr, `    setCurrentModule((prev: any) => {
      if (source === 'questions' && activeSubExamIndex !== null && prev.subExams && prev.subExams[activeSubExamIndex]) {
          const subExams = [...prev.subExams];
          const subExam = { ...subExams[activeSubExamIndex] };
          const newList = [...(subExam.questions || [])];
          if (editingQuestionIndex !== null) newList[editingQuestionIndex] = itemToSave;
          else newList.push(itemToSave);
          subExam.questions = newList;
          subExams[activeSubExamIndex] = subExam;
          return { ...prev, subExams };
      } else {
          const newList = [...(prev[source] || [])];
          if (editingQuestionIndex !== null) newList[editingQuestionIndex] = itemToSave;
          else newList.push(itemToSave);
          return { ...prev, [source]: newList };
      }
    });`);
    }

    // Refactor removeQuestionForSource
    const removeStr = `    setCurrentModule((prev: any) => {
      const newList = [...(prev[source] || [])];
      newList.splice(index, 1);
      return { ...prev, [source]: newList };
    });`;

    if (content.includes(removeStr)) {
        content = content.replace(removeStr, `    setCurrentModule((prev: any) => {
      if (source === 'questions' && activeSubExamIndex !== null && prev.subExams && prev.subExams[activeSubExamIndex]) {
          const subExams = [...prev.subExams];
          const subExam = { ...subExams[activeSubExamIndex] };
          const newList = [...(subExam.questions || [])];
          newList.splice(index, 1);
          subExam.questions = newList;
          subExams[activeSubExamIndex] = subExam;
          return { ...prev, subExams };
      } else {
          const newList = [...(prev[source] || [])];
          newList.splice(index, 1);
          return { ...prev, [source]: newList };
      }
    });`);
    }

    // Refactor moveQuestionForSource
    const moveStr = `    setCurrentModule((prev: any) => {
      const newList = [...(prev[source] || [])];
      [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
      return { ...prev, [source]: newList };
    });`;

    if (content.includes(moveStr)) {
        content = content.replace(moveStr, `    setCurrentModule((prev: any) => {
      if (source === 'questions' && activeSubExamIndex !== null && prev.subExams && prev.subExams[activeSubExamIndex]) {
          const subExams = [...prev.subExams];
          const subExam = { ...subExams[activeSubExamIndex] };
          const newList = [...(subExam.questions || [])];
          [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
          subExam.questions = newList;
          subExams[activeSubExamIndex] = subExam;
          return { ...prev, subExams };
      } else {
          const newList = [...(prev[source] || [])];
          [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
          return { ...prev, [source]: newList };
      }
    });`);
    }
    
    // Also we need to fix targetIndex bounds check in moveQuestionForSource
    const boundsCheckStr = `const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= (currentModule[source] || []).length) return;`;
    if (content.includes(boundsCheckStr)) {
        content = content.replace(boundsCheckStr, `const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    const listLen = (source === 'questions' && activeSubExamIndex !== null && currentModule.subExams && currentModule.subExams[activeSubExamIndex]) ? (currentModule.subExams[activeSubExamIndex].questions || []).length : (currentModule[source] || []).length;
    if (targetIndex < 0 || targetIndex >= listLen) return;`);
    }

    fs.writeFileSync(hookPath, content);
    console.log(`Updated ${hookPath}`);
  }
});
