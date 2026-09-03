const fs = require('fs');
const path = require('path');

const directories = [
  'src/app/super-admin/exams/new/hooks/useQuestionLogic.tsx',
  'src/app/super-admin/exams/edit/[id]/hooks/useQuestionLogic.tsx',
  'src/app/school-admin/exams/new/hooks/useQuestionLogic.tsx',
  'src/app/school-admin/exams/edit/[id]/hooks/useQuestionLogic.tsx'
];

directories.forEach(file => {
  const fullPath = path.join('d:/mina/front', file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');

    // Add setEditingQuestionIndex and editingQuestionIndex to destructuring
    const targetDestructuring = "const { currentModule, activeSubExamIndex, setCurrentModule, standaloneQuestions, setStandaloneQuestions, tempQuestion, setTempQuestion, setQuestionSource, setShowQuestionForm, showToast, language } = props;";
    const newDestructuring = "const { currentModule, activeSubExamIndex, setCurrentModule, standaloneQuestions, setStandaloneQuestions, tempQuestion, setTempQuestion, setQuestionSource, setShowQuestionForm, showToast, language, editingQuestionIndex, setEditingQuestionIndex } = props;";

    if (content.includes(targetDestructuring)) {
        content = content.replace(targetDestructuring, newDestructuring);
        fs.writeFileSync(fullPath, content);
        console.log("Fixed " + fullPath);
    } else {
        // Fallback for different destructuring
        if (!content.includes('setEditingQuestionIndex } = props')) {
             content = content.replace(/const \{[^}]+\}\s*=\s*props;/g, (match) => {
                 if (!match.includes('setEditingQuestionIndex')) {
                     return match.replace('} = props;', ', editingQuestionIndex, setEditingQuestionIndex } = props;');
                 }
                 return match;
             });
             fs.writeFileSync(fullPath, content);
             console.log("Fallback Fixed " + fullPath);
        }
    }
  }
});
