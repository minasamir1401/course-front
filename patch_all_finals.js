const fs = require('fs');
const path = require('path');

function patch(relPath) {
  const filePath = path.join(__dirname, relPath);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Fix removeMinaDuplicates
  const oldMina = `  const removeMinaDuplicates = () => {
    const seen = new Set();
    const unique: any[] = [];
    standaloneQuestions.forEach((q: any) => {
      const sig = (q.text || '').replace(/<[^>]*>?/gm, '').trim().toLowerCase();
      if (!seen.has(sig)) {
        unique.push(q);
        seen.add(sig);
      }
    });
    setStandaloneQuestions(unique);
    setShowDuplicatesModal(false);
    showToast(language === 'ar' ? 'تم حذف الأسئلة المتكررة بنجاح' : 'Duplicate questions removed successfully', 'success');
  };`;
  
  const newMina = `  const removeMinaDuplicates = () => {
    const seen = new Set();
    const unique: any[] = [];
    standaloneQuestions.forEach((q: any) => {
      const sig = (q.text || '').replace(/<[^>]*>?/gm, '').trim().toLowerCase();
      if (!seen.has(sig)) {
        unique.push(q);
        seen.add(sig);
      } else if (q.id) {
        deletedQuestionIdsRef.current.push(q.id);
      }
    });
    setStandaloneQuestions(unique);
    setShowDuplicatesModal(false);
    showToast(language === 'ar' ? 'تم حذف الأسئلة المتكررة بنجاح' : 'Duplicate questions removed successfully', 'success');
  };`;

  if (content.includes(oldMina)) {
    content = content.replace(oldMina, newMina);
    console.log('Fixed removeMinaDuplicates in ' + relPath);
  } else if (!content.includes('deletedQuestionIdsRef.current.push(q.id)') && content.includes('removeMinaDuplicates')) {
    // Regex fallback
    content = content.replace(
      /if \(\!seen\.has\(sig\)\) \{\s*unique\.push\(q\);\s*seen\.add\(sig\);\s*\}/,
      `if (!seen.has(sig)) {
        unique.push(q);
        seen.add(sig);
      } else if (q.id) {
        deletedQuestionIdsRef.current.push(q.id);
      }`
    );
    console.log('Fixed removeMinaDuplicates (fallback) in ' + relPath);
  }

  // 2. Fix runAutoSave (remove duplicate standalone push)
  const autoSaveStandalonePush = `allQuestions.push(...(standaloneQuestions || []).map(q => ({ ...q, moduleId: null })));
        
        allQuestions.push(...(standaloneQuestions || []).map(q => ({ ...q, moduleId: null })));`;
  if (content.includes(autoSaveStandalonePush)) {
    content = content.replace(autoSaveStandalonePush, `allQuestions.push(...(standaloneQuestions || []).map(q => ({ ...q, moduleId: null })));`);
    console.log('Fixed runAutoSave duplicates in ' + relPath);
  }

  // 3. Fix handleSubmit (add standalone push)
  const handleSubmitStr = `      const modulesPayload = finalModules.map((m, index) => {
         const mId = m.id || String(Date.now() + index);
         const mQuestions = (m.questions || []).map((q: any) => ({
             ...q,
             moduleId: mId
         }));
         allQuestions.push(...mQuestions);
         return {
            id: mId,
            title: m.title,
            description: m.content || null,
            duration: m.duration || null,
            passingScore: m.passingScore || null,
            order: index
         };
      });

      const activeExamId = createdIdRef.current;`;
      
  const newHandleSubmitStr = `      const modulesPayload = finalModules.map((m, index) => {
         const mId = m.id || String(Date.now() + index);
         const mQuestions = (m.questions || []).map((q: any) => ({
             ...q,
             moduleId: mId
         }));
         allQuestions.push(...mQuestions);
         return {
            id: mId,
            title: m.title,
            description: m.content || null,
            duration: m.duration || null,
            passingScore: m.passingScore || null,
            order: index
         };
      });
      allQuestions.push(...(standaloneQuestions || []).map(q => ({ ...q, moduleId: null })));

      const activeExamId = createdIdRef.current;`;

  if (content.includes(handleSubmitStr)) {
    content = content.replace(handleSubmitStr, newHandleSubmitStr);
    console.log('Fixed handleSubmit missing standalone in ' + relPath);
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

patch('src/app/super-admin/exams/edit/[id]/page.tsx');
patch('src/app/school-admin/exams/edit/[id]/page.tsx');
