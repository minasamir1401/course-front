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

  // We are going to replace everything inside handleAdvancedMetadataExcelChange
  const startIndex = content.indexOf("const handleAdvancedMetadataExcelChange = (e: React.ChangeEvent<HTMLInputElement>, activeSubExamIndex: number | null, source: 'questions' | 'assignments'): Promise<any[]> => {");
  if (startIndex === -1) continue;

  const endIndex = content.indexOf("let downloadQuestionsTemplate =", startIndex);
  if (endIndex === -1) continue;

  let functionBody = content.substring(startIndex, endIndex);

  // Fix the missing resolve() block
  functionBody = functionBody.replace(
    /return newState;\s*}\);\s*showToast\(language === 'ar' \? "تم تعيين الميتا داتا بنجاح" : "Metadata successfully mapped to questions", "success"\);\s*} catch \(err\) \{/g,
    `finalTargetList = targetList;\n            return newState;\n          });\n          showToast(language === 'ar' ? "تم استيراد الميتا داتا المتقدمة بنجاح" : "Advanced Metadata imported successfully", "success");\n          resolve(finalTargetList);\n        } catch (err) {`
  );

  functionBody = functionBody.replace(
    /showToast\(language === 'ar' \? "حدث خطأ أثناء قراءة ملف Excel" : "Error reading Excel file", "error"\);\s*\}/g,
    `showToast(language === 'ar' ? "حدث خطأ أثناء قراءة ملف Excel" : "Error reading Excel file", "error");\n          resolve([]);\n        }`
  );

  content = content.substring(0, startIndex) + functionBody + content.substring(endIndex);
  fs.writeFileSync(file, content);
}
console.log('Fixed useModuleManagement.ts promises.');
