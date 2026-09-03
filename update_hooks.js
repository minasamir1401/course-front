const fs = require('fs');

const hooksPaths = [
  'd:/mina/front/src/app/super-admin/exams/new/hooks/useModuleManagement.ts',
  'd:/mina/front/src/app/super-admin/exams/edit/[id]/hooks/useModuleManagement.ts',
  'd:/mina/front/src/app/school-admin/exams/new/hooks/useModuleManagement.ts',
  'd:/mina/front/src/app/school-admin/exams/edit/[id]/hooks/useModuleManagement.ts'
];

for (const file of hooksPaths) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Replace downloadAdvancedMetadataTemplate
  content = content.replace(
    /let downloadAdvancedMetadataTemplate = \(\) => \{[\s\S]*?showToast\(language === 'ar' \? "[^"]*" : "Advanced Metadata template downloaded successfully", "success"\);\s*\};/,
    `let downloadAdvancedMetadataTemplate = (activeSubExamIndex: number | null, source: 'questions' | 'assignments' = 'questions') => {
    let list = [];
    if (source === 'questions' && activeSubExamIndex !== null && currentModule.subExams && currentModule.subExams[activeSubExamIndex]) {
      list = currentModule.subExams[activeSubExamIndex].questions || [];
    } else {
      list = currentModule[source] || [];
    }
    const wsData = [];
    wsData.push(['Question ID', 'Question Text', 'Exam', 'Section', 'Domain', 'Learning Outcomes', 'Indicators', 'Skill', 'Subskill', 'Micro Skill', 'Difficulty', 'DOK', 'Cognitive', 'Error Pattern', 'Estimated Time']);
    
    if (list.length === 0) {
      wsData.push(['', 'Sample Question...', 'مقدمة في الفيزياء', 'القسم الاول', 'الفيزياء', 'Student will be able to...', 'Identifies Basic Concepts', 'General', 'Specific', 'Micro', 'Medium', 'DOK 2', 'Application', '', '5 mins']);
    } else {
      list.forEach((q: any) => {
        const cleanText = q.text ? q.text.replace(/<[^>]*>?/gm, '').substring(0, 100) : '';
        wsData.push([
          q.id || '',
          cleanText,
          q.course || '',
          q.section || '',
          q.domain || '',
          q.standard || '',
          q.indicator || '',
          q.skill || '',
          q.subskill || '',
          q.microSkill || '',
          q.level || '',
          q.dok || '',
          q.cognitive || '',
          q.errorPattern || '',
          q.estimatedTime || ''
        ]);
      });
    }
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Advanced Metadata Template');
    XLSX.writeFile(wb, 'advanced_metadata_template.xlsx');
    showToast(language === 'ar' ? 'تم تحميل قالب الميتا داتا المتقدمة بنجاح' : 'Advanced Metadata template downloaded successfully', 'success');
  };`
  );

  // Replace handleAdvancedMetadataExcelChange definition
  content = content.replace(
    /const handleAdvancedMetadataExcelChange = \(e: React\.ChangeEvent<HTMLInputElement>, activeSubExamIndex: number \| null, source: 'questions' \| 'assignments'\) => \{/g,
    `const handleAdvancedMetadataExcelChange = (e: React.ChangeEvent<HTMLInputElement>, activeSubExamIndex: number | null, source: 'questions' | 'assignments'): Promise<any[]> => {\n    return new Promise((resolve) => {`
  );

  content = content.replace(
    /if \(!file\) return;/g,
    `if (!file) { resolve([]); return; }`
  );

  content = content.replace(
    /if \(rows\.length < 2\) \{\s*showToast[^\n]*;\s*return;\s*\}/g,
    `if (rows.length < 2) { showToast(language === 'ar' ? "ملف Excel فارغ أو لا يحتوي على بيانات" : "Excel file is empty or does not contain data rows", "error"); resolve([]); return; }`
  );

  content = content.replace(
    /const headers = \(rows\[0\] as string\[\]\)\.map\(\(h\) => String\(h\)\.trim\(\)\.toLowerCase\(\)\);/g,
    `const headers = (rows[0] as string[]).map((h) => String(h).trim().toLowerCase());\n          const idIdx = headers.findIndex(h => h.includes("id") || h.includes("معرف"));`
  );

  // Replace mapping logic inside the loop
  content = content.replace(
    /\/\/ Map row i to question i-1\s*const qIndex = i - 1;\s*let q: any;\s*if \(qIndex < targetList\.length\) \{/g,
    `let qIndex = -1;\n              if (idIdx >= 0 && row[idIdx]) {\n                const rowId = String(row[idIdx]).trim();\n                qIndex = targetList.findIndex((q: any) => q.id === rowId || String(q.id) === rowId);\n              }\n              if (qIndex === -1) {\n                qIndex = mappedCount;\n              }\n              let q: any;\n              if (qIndex < targetList.length) {`
  );

  content = content.replace(
    /targetList\.push\(q\);\s*\}/g,
    `targetList.push(q);\n                qIndex = targetList.length - 1;\n              }`
  );

  // Replace return newState up to catch block
  content = content.replace(
    /return newState;\s*\}\);\s*\} catch \(err\) \{\s*console\.error\(err\);\s*showToast[^\n]*;\s*\}/g,
    `finalTargetList = targetList;\n            return newState;\n          });\n          showToast(language === 'ar' ? "تم استيراد الميتا داتا المتقدمة بنجاح" : "Advanced Metadata imported successfully", "success");\n          resolve(finalTargetList);\n        } catch (err) {\n          console.error(err);\n          showToast(language === 'ar' ? "حدث خطأ أثناء قراءة ملف Excel" : "Error reading Excel file", "error");\n          resolve([]);\n        }`
  );

  content = content.replace(
    /let isSubExam = false;/g,
    `let isSubExam = false;\n            let finalTargetList: any[] = [];`
  );

  content = content.replace(
    /reader\.readAsArrayBuffer\(file\);\s*e\.target\.value = "";\s*\};\s*return \{/g,
    `reader.readAsArrayBuffer(file);\n      e.target.value = "";\n    });\n  };\n  return {`
  );

  fs.writeFileSync(file, content);
}
console.log('Hooks updated successfully.');
