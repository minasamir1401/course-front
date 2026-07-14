const fs = require('fs');

function patchSkillsHub(filePath) {
  console.log('Patching: ' + filePath);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add RichTextEditor import
  if (!content.includes('import RichTextEditor')) {
    content = content.replace(
      'import InteractiveQuestionRenderer from "@/components/InteractiveQuestionRenderer";',
      'import InteractiveQuestionRenderer from "@/components/InteractiveQuestionRenderer";\nimport RichTextEditor from "@/components/RichTextEditor";'
    );
  }

  // 2. openAddActivity - add questionText: ""
  content = content.replace(
    /title:\s*"",\s*type:\s*"MCQ",/g,
    'title: "",\n      questionText: "",\n      type: "MCQ",'
  );

  // 3. openEditActivity
  const editActivityOld = `  const openEditActivity = (activity: any) => {
    setEditingActivity({ 
      ...activity,
      options: parseField(activity.options),
      correctAnswer: parseField(activity.correctAnswer)
    });
    setIsActivityModalOpen(true);
  };`;
  const editActivityNew = `  const openEditActivity = (activity: any) => {
    let parsedOpts = parseField(activity.options);
    if (Array.isArray(parsedOpts)) {
       parsedOpts = { choices: parsedOpts };
    }
    const qText = parsedOpts?.questionText || "";
    setEditingActivity({ 
      ...activity,
      options: parsedOpts,
      questionText: qText,
      correctAnswer: parseField(activity.correctAnswer)
    });
    setIsActivityModalOpen(true);
  };`;
  if (content.includes(editActivityOld)) {
    content = content.replace(editActivityOld, editActivityNew);
  } else {
      console.log('openEditActivity block not found or already patched.');
  }

  // 4. handleSaveActivity
  const saveActivityOld = `      const payload = { ...activity };
      if (typeof payload.options === 'object') payload.options = JSON.stringify(payload.options);
      if (typeof payload.correctAnswer === 'object') payload.correctAnswer = JSON.stringify(payload.correctAnswer);`;
  const saveActivityNew = `      const payload = { ...activity };
      
      let parsedOptions = payload.options;
      if (typeof parsedOptions === 'string') {
        try { parsedOptions = JSON.parse(parsedOptions); } catch(e) {}
      }
      if (Array.isArray(parsedOptions)) {
        parsedOptions = { choices: parsedOptions };
      }
      if (typeof parsedOptions !== 'object' || parsedOptions === null) {
        parsedOptions = {};
      }
      parsedOptions.questionText = editingActivity.questionText;
      
      payload.options = JSON.stringify(parsedOptions);
      if (typeof payload.correctAnswer === 'object') payload.correctAnswer = JSON.stringify(payload.correctAnswer);`;
  
  if (content.includes(saveActivityOld)) {
    content = content.replace(saveActivityOld, saveActivityNew);
  }

  // 5. Update UI
  // The UI label "نص السؤال / العنوان الرئيسي" to "عنوان السؤال (Question Title)"
  content = content.replace(
    /\{language === 'ar' \? "نص السؤال \/ العنوان الرئيسي" : "Question Text \/ Main Title"\}/g,
    "{language === 'ar' ? \"عنوان السؤال (Question Title)\" : \"Question Title\"}"
  );

  content = content.replace(
    /\{language === 'ar' \? "اكتب نص السؤال هنا\.\.\." : "Write question text\.\.\."\}/g,
    "{language === 'ar' ? \"مثال: سؤال جمع، توصيل...\" : \"e.g. Addition Question...\"}"
  );

  // Add the Rich Text Editor box right after the "type" dropdown block
  const typeDropdownEndHtml = `                  </select>
                </div>

                {/* Additional Metadata */}`;
  const richTextHtml = `                  </select>
                </div>

                {/* Question Rich Text */}
                <div className="space-y-2 md:col-span-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? "نص السؤال (Question Text)" : "Question Text"}</label>
                  <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden min-h-[200px] shadow-sm hover:border-indigo-300 transition-all duration-300">
                    <RichTextEditor 
                      value={editingActivity.questionText || ""} 
                      onChange={(val) => setEditingActivity({...editingActivity, questionText: val})} 
                    />
                  </div>
                </div>

                {/* Additional Metadata */}`;

  if (content.includes(typeDropdownEndHtml)) {
    content = content.replace(typeDropdownEndHtml, richTextHtml);
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

// Execute for Super Admin Skills Hub
patchSkillsHub('d:/pj/porj/corse/lms-platform/frontend/src/app/super-admin/skills-hub/edit/page.tsx');
console.log('Done patchSkillsHub');
