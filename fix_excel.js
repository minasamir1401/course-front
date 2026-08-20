const fs = require('fs');

const basePaths = [
  'd:/mina/front/src/app/super-admin/exams/new',
  'd:/mina/front/src/app/super-admin/exams/edit/[id]',
  'd:/mina/front/src/app/school-admin/exams/new',
  'd:/mina/front/src/app/school-admin/exams/edit/[id]'
];

for (const basePath of basePaths) {
  const hookPath = basePath + '/hooks/useModuleManagement.ts';
  const pagePath = basePath + '/page.tsx';

  if (fs.existsSync(hookPath)) {
    let hookContent = fs.readFileSync(hookPath, 'utf8');
    
    // Fix signature and resolve() for questions
    hookContent = hookContent.replace(
      /const handleQuestionsExcelChange = \(e: React\.ChangeEvent<HTMLInputElement>\) => \{[\s\S]*?if \(!file\) \{ resolve\(\[\]\); return; \}/,
      'const handleQuestionsExcelChange = (e: React.ChangeEvent<HTMLInputElement>, activeSubExamIndex: number | null) => {\n    const file = e.target.files?.[0];\n    if (!file) { return; }'
    );

    // Fix setCurrentModule for questions
    hookContent = hookContent.replace(
      /setCurrentModule\(\(prev: any\) => \(\{\s*\.\.\.prev,\s*questions: \[\.\.\.\(prev\.questions \|\| \[\]\), \.\.\.parsed\],\s*standards: updatedStds,\s*indicators: updatedInds,\s*learningOutcomes: updatedLos\s*\}\)\);/,
      `setCurrentModule((prev: any) => {
          const isSubExam = activeSubExamIndex !== null;
          const targetList = isSubExam ? (prev.subExams[activeSubExamIndex].questions || []) : (prev.questions || []);
          const newState = { ...prev };
          if (isSubExam) {
            newState.subExams[activeSubExamIndex].questions = [...targetList, ...parsed];
          } else {
            newState.questions = [...targetList, ...parsed];
          }
          newState.standards = updatedStds;
          newState.indicators = updatedInds;
          newState.learningOutcomes = updatedLos;
          return newState;
        });`
    );

    // Fix signature and resolve() for assignments
    hookContent = hookContent.replace(
      /const handleAssignmentsExcelChange = \(e: React\.ChangeEvent<HTMLInputElement>\) => \{[\s\S]*?if \(!file\) \{ resolve\(\[\]\); return; \}/,
      'const handleAssignmentsExcelChange = (e: React.ChangeEvent<HTMLInputElement>, activeSubExamIndex: number | null) => {\n    const file = e.target.files?.[0];\n    if (!file) { return; }'
    );

    // Fix setCurrentModule for assignments
    hookContent = hookContent.replace(
      /setCurrentModule\(\(prev: any\) => \(\{\s*\.\.\.prev,\s*assignments: \[\.\.\.\(prev\.assignments \|\| \[\]\), \.\.\.parsed\],\s*standards: updatedStds,\s*indicators: updatedInds,\s*learningOutcomes: updatedLos\s*\}\)\);/,
      `setCurrentModule((prev: any) => {
          const isSubExam = activeSubExamIndex !== null;
          const targetList = isSubExam ? (prev.subExams[activeSubExamIndex].assignments || []) : (prev.assignments || []);
          const newState = { ...prev };
          if (isSubExam) {
            newState.subExams[activeSubExamIndex].assignments = [...targetList, ...parsed];
          } else {
            newState.assignments = [...targetList, ...parsed];
          }
          newState.standards = updatedStds;
          newState.indicators = updatedInds;
          newState.learningOutcomes = updatedLos;
          return newState;
        });`
    );

    fs.writeFileSync(hookPath, hookContent);
  }

  if (fs.existsSync(pagePath)) {
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    
    // Pass updated handlers in renderQuestionsBuilderProps
    pageContent = pageContent.replace(
      /questionsExcelRef=\{moduleManagement\.questionsExcelRef\}/,
      'questionsExcelRef={moduleManagement.questionsExcelRef}\n      handleQuestionsExcelChange={(e) => moduleManagement.handleQuestionsExcelChange(e, state.activeSubExamIndex)}\n      handleAssignmentsExcelChange={(e) => moduleManagement.handleAssignmentsExcelChange(e, state.activeSubExamIndex)}'
    );
    
    fs.writeFileSync(pagePath, pageContent);
  }
}
console.log('Fixed handlers');
