const fs = require('fs');

const hookFiles = [
  'src/app/super-admin/exams/new/hooks/useLessonBuilder.ts',
  'src/app/super-admin/exams/edit/[id]/hooks/useLessonBuilder.ts',
  'src/app/school-admin/exams/new/hooks/useLessonBuilder.ts',
  'src/app/school-admin/exams/edit/[id]/hooks/useLessonBuilder.ts'
];

const injectCode = `
  const moveBlock = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number, direction: 'UP' | 'DOWN') => {
    setCurrentModule((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      const targetIndex = direction === 'UP' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newSlides.length) return prev;
      [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
      return { ...prev, [source]: newSlides };
    });
  };

  const insertBlockAt = (source: 'slides' | 'assignments' | 'questions' = 'slides', index: number, type: 'TEXT' | 'QUESTION') => {
    const newBlock = type === 'TEXT' 
      ? { id: Date.now() + Math.random(), type: 'TEXT', label: 'CONTENT', title: "New Content", content: "", text: "", videoUrl: "", sections: [] }
      : { id: Date.now() + Math.random(), type: 'QUESTION', label: 'MCQ', title: "New Question", content: "", text: "", videoUrl: "", options: ["", "", "", ""], correctAnswer: "", sections: [] };
    setCurrentModule((prev: any) => {
      const newSlides = [...(prev[source] || [])];
      newSlides.splice(index, 0, newBlock);
      return { ...prev, [source]: newSlides };
    });
    showToast("Slide inserted successfully", "success");
  };
`;

hookFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf-8');
    if (!code.includes('const moveBlock =')) {
      code = code.replace(/return \{/, injectCode + '\n  return {');
      fs.writeFileSync(file, code);
      console.log('Fixed', file);
    }
  }
});
console.log('Done!');
