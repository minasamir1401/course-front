const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { questionExportRows, planQuestionImport } = require('../src/lib/questionExcelSync.ts');
const { applyQuestionMetadataRows } = require('../src/lib/questionMetadataExcel.ts');
const { parseLessonMetadataRows, metadataColumn } = require('../src/lib/lessonMetadataExcel.ts');
const { questionMetadata, metadataLabel } = require('../src/lib/bilingualMetadata.ts');
const { buildAdvancedMetadataTemplateRows } = require('../src/lib/examExcelTemplates.ts');
const { readSkillMetadata } = require('../src/lib/skillExcel.ts');
const XLSX = require('xlsx');
const original = { id: 'question-1', text: 'Find x', type: 'TEXT', points: 2, correctAnswer: '4', options: [], skill: 'حل المعادلات', skillEn: 'Solving equations', domain: 'الجبر', domainEn: 'Algebra', standard: 'معيار أصلي', standardEn: 'Original standard', learningOutcome: 'ناتج أصلي', learningOutcomeEn: 'Original outcome', subskill: 'مهارة فرعية', subskillEn: 'Subskill', microSkill: 'مهارة دقيقة', microSkillEn: 'Micro skill', cognitive: 'Application' };
test('question workbook roundtrip retains distinct bilingual metadata and IDs', () => {
 for (const language of ['ar','en']) {
  const result = planQuestionImport(questionExportRows([original], language), [original], { canDelete:false, language });
  assert.equal(result.unchanged,1); assert.equal(result.updated,0); assert.deepEqual(result.questions[0], original);
 }
});
test('English-first columns never overwrite Arabic or select a subskill as the skill', () => {
 const headers=['Question ID','Skill (En)','Subskill (Ar)','Skill (Ar)','Micro Skill (En)','Domain (En)','Domain (Ar)'];
 const result = applyQuestionMetadataRows([headers,['question-1','Equations','فرعية','المعادلات','Isolating x','Algebra','الجبر']], [original])[0];
 assert.equal(result.skill,'المعادلات'); assert.equal(result.skillEn,'Equations'); assert.equal(result.subskill,'فرعية'); assert.equal(result.microSkillEn,'Isolating x'); assert.equal(result.domain,'الجبر');
});
test('partial metadata imports preserve omitted translations; explicit blank clears only that field', () => {
 const result = applyQuestionMetadataRows([['Question ID','Skill (En)'],['question-1','']], [original])[0];
 assert.equal(result.skillEn,''); assert.equal(result.skill,original.skill); assert.equal(result.domainEn,original.domainEn);
 assert.throws(()=>applyQuestionMetadataRows([['Question ID','Skill (Ar)'],['foreign','بيانات']], [original]), /Unknown/);
 assert.deepEqual(original.skillEn,'Solving equations');
});
test('course metadata retains both languages and rejects another lesson instead of mixing data', () => {
 const rows=[['Lesson Title (En)','Standard (En)','Standard (Ar)','Domain (En)','Domain (Ar)'],['Lesson A','Use algebra','استخدام الجبر','Algebra','الجبر']];
 const result=parseLessonMetadataRows(rows,'Lesson A');
 assert.equal(result.standards,'استخدام الجبر');assert.equal(result.standardsEn,'Use algebra');
 assert.throws(()=>parseLessonMetadataRows(rows,'Lesson B'), /No metadata matches/);
 assert.equal(metadataColumn(['Standard (En)','Standard (Ar)'],'standards',false),1);
});
test('Arabic display resolves pairs and categorical labels without changing their stored code', () => {
 assert.equal(questionMetadata(original,'skill','ar'),'حل المعادلات'); assert.equal(questionMetadata(original,'skill','en'),'Solving equations');
 assert.equal(metadataLabel('Application','ar'),'تطبيق'); assert.equal(metadataLabel('DOK 2','ar'),'عمق المعرفة 2'); assert.equal(original.cognitive,'Application');
 assert.equal(questionMetadata({name:'Canonical', nameAr:'المهارة', nameEn:'Skill'},'name','ar'),'المهارة');
});
test('advanced Arabic template imports Arabic examples and both translations together',()=>{
 const rows=buildAdvancedMetadataTemplateRows('ar',[]); rows[1][0]='question-1';
 const result=applyQuestionMetadataRows([rows[0],rows[1]],[original])[0];
 assert.match(result.domain, /الفيزياء/); assert.equal(result.domainEn,'Physics & Motion'); assert.equal(result.cognitive,'تطبيق');
});
test('skills metadata accepts old templates and pairs new bilingual columns by row',async()=>{
 const rows=[['Standards (Ar)','Standards (En)','Indicators (Ar)','Indicators (En)','Outcomes (Ar)','Outcomes (En)'],['معيار','Standard','مؤشر','Indicator','ناتج','Outcome']];
 const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet(rows),'Metadata');
 const file=new File([XLSX.write(book,{type:'buffer',bookType:'xlsx'})],'metadata.xlsx');
 const result=await readSkillMetadata(file);assert.deepEqual(result.standards,['معيار']);assert.deepEqual(result.standardsEn,['Standard']);assert.deepEqual(result.translations['معيار'],{ar:'معيار',en:'Standard'});
 const old=XLSX.utils.book_new();XLSX.utils.book_append_sheet(old,XLSX.utils.json_to_sheet([{standards:'Legacy',indicators:'Indicator',outcomes:'Outcome'}]),'Metadata');
 assert.deepEqual((await readSkillMetadata(new File([XLSX.write(old,{type:'buffer',bookType:'xlsx'})],'old.xlsx'))).standards,['Legacy']);
});
