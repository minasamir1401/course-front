const fs = require('fs');
let c = fs.readFileSync('src/app/exams/[id]/page.tsx', 'utf8');

const subExamIdExtract = "  const subExamId = searchParams.get('subExamId');";
if (!c.includes(subExamIdExtract)) {
  c = c.replace(/const isPreviewMode = searchParams\.get\('preview'\) === 'true';/, "const isPreviewMode = searchParams.get('preview') === 'true';\n" + subExamIdExtract);
}

// Replace localStorage keys
c = c.replace(/`exam_\$\{id\}_answers`/g, '`exam_${id}_${subExamId || "root"}_answers`');
c = c.replace(/`exam_\$\{id\}_time`/g, '`exam_${id}_${subExamId || "root"}_time`');

// Replace fetchExam verify-access payload
c = c.replace(/body: JSON\.stringify\(\{ password: passwordInput \}\),/g, 'body: JSON.stringify({ password: passwordInput, subExamId }),');

// Replace handleSubmit payload
c = c.replace(/body: JSON\.stringify\(\{ answers, totalTime: timeTakenInSeconds \}\)/g, 'body: JSON.stringify({ answers, totalTime: timeTakenInSeconds, subExamId })');

// We need to filter questions and fix duration
// Replace the mapping block in fetchExam
const mappingRegex = /const mappedQuestions = data\.questions\?\.map\(\(q: any\) => \{[\s\S]*?\}\) \|\| \[\];/;
const newMapping = `let filteredQuestions = data.questions || [];
      let subExamDuration = data.duration;
      if (subExamId) {
        filteredQuestions = filteredQuestions.filter((q: any) => q.subExamId === subExamId);
        // Find subExam duration if possible
        const subExam = data.modules?.flatMap((m: any) => m.subExams || []).find((se: any) => se.id === subExamId);
        if (subExam && subExam.duration) {
          subExamDuration = subExam.duration;
        }
      }

      const mappedQuestions = filteredQuestions.map((q: any) => {
        let parsedSections = [];
        try {
          const parsed = typeof q.explanation === 'string' ? JSON.parse(q.explanation) : [];
          if (Array.isArray(parsed)) {
            parsedSections = parsed.map((item: any) => {
              if (typeof item === 'string') {
                return { type: 'EXPLANATION', content: item };
              }
              return item;
            });
          } else {
            parsedSections = [{ type: 'EXPLANATION', content: q.explanation || "" }];
          }
        } catch (e) {
          parsedSections = [{ type: 'EXPLANATION', content: q.explanation || "" }];
        }

        let correctAnswers: string[] = [];
        if (q.type === 'MULTI_SELECT') {
          try {
            const parsed = typeof q.correctAnswer === 'string' ? JSON.parse(q.correctAnswer) : q.correctAnswer;
            correctAnswers = Array.isArray(parsed) ? parsed : (q.correctAnswer ? [String(q.correctAnswer)] : []);
          } catch {
            correctAnswers = typeof q.correctAnswer === 'string' 
              ? q.correctAnswer.split(',').map((s: string) => s.trim()).filter(Boolean)
              : [];
          }
        }

        return {
          ...q,
          options: parseQuestionChoices(q.options),
          correctAnswers: q.type === 'MULTI_SELECT' ? correctAnswers : [],
          sections: parsedSections
        };
      });
      data.duration = subExamDuration || data.duration; // Override duration for the timer
`;
c = c.replace(mappingRegex, newMapping);

// Also fix `checkRes` to include `subExamId`
c = c.replace(/fetch\(\`\$\{API_URL\}\/exams\/\$\{id\}\/check\`,\s*\{/g, 'fetch(`${API_URL}/exams/${id}/check?subExamId=${subExamId || ""}`, {');


fs.writeFileSync('src/app/exams/[id]/page.tsx', c);
console.log('Fixed [id]/page.tsx');