const fs = require('fs');
const path = require('path');

const frontDir = 'd:/mina/front/src/app';

const roles = ['super-admin', 'school-admin'];
const modes = ['new', 'edit/[id]'];

for (const role of roles) {
  for (const mode of modes) {
    const hooksDir = path.join(frontDir, role, 'exams', mode, 'hooks');
    
    // 1. Patch useExamState.ts
    const stateFile = path.join(hooksDir, 'useExamState.ts');
    if (fs.existsSync(stateFile)) {
      let stateCode = fs.readFileSync(stateFile, 'utf8');
      stateCode = stateCode.replace(/attemptsAllowed:\s*1\s*,/g, 'attemptsAllowed: "",');
      fs.writeFileSync(stateFile, stateCode);
      console.log(`Patched ${stateFile}`);
    }

    // 2. Patch useExamSubmit.ts
    const submitFile = path.join(hooksDir, 'useExamSubmit.ts');
    if (fs.existsSync(submitFile)) {
      let submitCode = fs.readFileSync(submitFile, 'utf8');
      
      // Add validation logic
      if (!submitCode.includes('examData.attemptsAllowed === ""')) {
        const validationCode = `
    if (!examData.grades || examData.grades.length === 0) {
      showToast(language === 'ar' ? "يرجى تحديد الصفوف الدراسية في الإعدادات" : "Please select grades in Settings", "error");
      return;
    }
    if (!examData.subjects || examData.subjects.length === 0) {
      showToast(language === 'ar' ? "يرجى تحديد مجال التخصص في الإعدادات" : "Please select subject specialization in Settings", "error");
      return;
    }
    if (examData.attemptsAllowed === "" || examData.attemptsAllowed === undefined || examData.attemptsAllowed === null) {
      showToast(language === 'ar' ? "يرجى تحديد عدد المحاولات في الإعدادات" : "Please specify the number of attempts in Settings", "error");
      return;
    }
`;
        // Insert after passingScore validation
        const passingScoreRegex = /if\s*\(\s*examData\.passingScore\s*===\s*undefined[^{}]*\{[^}]*\}/;
        submitCode = submitCode.replace(passingScoreRegex, match => match + '\n' + validationCode);
        
        // Remove default fallback from payload
        submitCode = submitCode.replace(/attemptsAllowed:\s*examData\.attemptsAllowed\s*\|\|\s*1/g, 'attemptsAllowed: Number(examData.attemptsAllowed)');
        
        fs.writeFileSync(submitFile, submitCode);
        console.log(`Patched ${submitFile}`);
      }
    }

    // 3. Patch useQuestionLogic.tsx
    const questionLogicFile = path.join(hooksDir, 'useQuestionLogic.tsx');
    if (fs.existsSync(questionLogicFile)) {
      let qLogicCode = fs.readFileSync(questionLogicFile, 'utf8');
      
      // Update handleAddStandaloneQuestion and handleAddQuestionForSource
      qLogicCode = qLogicCode.replace(/attempts:\s*1/g, 'attempts: 1,\n      course: props.examData?.title || "",\n      section: currentModule?.title || ""');
      
      fs.writeFileSync(questionLogicFile, qLogicCode);
      console.log(`Patched ${questionLogicFile}`);
    }
  }
}
console.log("Patching complete.");
