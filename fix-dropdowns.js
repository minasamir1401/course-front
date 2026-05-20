const fs = require('fs');

const SELECT_OPTIONS = `
                              <option value="FEEDBACK">تغذية راجعة</option>
                              <option value="HINT">تلميح</option>
                              <option value="EXPLANATION">شرح</option>
                              <option value="TIP">نصيحة</option>
                              <option value="WARNING">تحذير</option>
                              <option value="KEY_INSIGHT">نقطة مهمة</option>`;

function fixCreatePage(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let count = 0;

  // Replace ALL group/menu dropdown patterns in create page using regex
  // Pattern matches: <div className="relative group/menu">.....</div> (the closing outer div)
  // We use a function to generate the right replacement based on context

  // 1) Assignment dropdown (setTempQuestion, no sIdx)
  content = content.replace(
    /<div className="relative group\/menu">\s*<button className="[^"]*">\s*<Plus className="w-4 h-4"\/> إضافة قسم\s*<\/button>\s*<div className="[^"]*group-hover\/menu:block[^"]*">\s*\{(?:[^}]|\{[^}]*\})*?setTempQuestion\(\{\.\.\.tempQuestion, sections:[\s\S]*?<\/div>\s*<\/div>/g,
    () => {
      count++;
      return `<select
                              value=""
                              onChange={(e) => { if(e.target.value) { setTempQuestion({...tempQuestion, sections: [...(tempQuestion.sections || []), { id: Date.now(), type: e.target.value, content: "" }]}); (e.target as HTMLSelectElement).value = ""; } }}
                              className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all outline-none cursor-pointer border border-indigo-200"
                            >${SELECT_OPTIONS}
                            </select>`;
    }
  );

  // 2) Slides dropdown (addSection, with sIdx)
  content = content.replace(
    /<div className="relative group\/menu">\s*<button className="[^"]*">\s*<Plus className="w-4 h-4" \/> Add Section\s*<\/button>\s*<div className="[^"]*group-hover\/menu:block[^"]*">\s*\{(?:[^}]|\{[^}]*\})*?addSection\(sIdx,[\s\S]*?<\/div>\s*<\/div>/g,
    () => {
      count++;
      return `<select
                               value=""
                               onChange={(e) => { if(e.target.value) { addSection(sIdx, e.target.value); (e.target as HTMLSelectElement).value = ""; } }}
                               className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl text-sm font-bold transition-all outline-none cursor-pointer border border-indigo-200"
                             >${SELECT_OPTIONS}
                             </select>`;
    }
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ create/page.tsx: replaced ${count} dropdown(s)`);
  return count;
}

function fixEditPage(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let count = 0;

  // Replace openDropdownId-based dropdowns with setTempQuestion
  content = content.replace(
    /<div className="relative"[^>]*onClick[^>]*stopPropagation[^>]*>\s*<button\s[\s\S]*?setOpenDropdownId[\s\S]*?إضافة قسم[\s\S]*?<\/button>\s*<div className[^>]*openDropdownId === "assignment"[\s\S]*?setTempQuestion\(\{\.\.\.tempQuestion, sections:[\s\S]*?<\/div>\s*<\/div>/g,
    () => {
      count++;
      return `<select
                               value=""
                               onChange={(e) => { if(e.target.value) { setTempQuestion({...tempQuestion, sections: [...(tempQuestion.sections || []), { id: Date.now(), type: e.target.value, content: "" }]}); (e.target as HTMLSelectElement).value = ""; } }}
                               className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all outline-none cursor-pointer border border-indigo-200"
                             >${SELECT_OPTIONS}
                             </select>`;
    }
  );

  // Replace openDropdownId-based dropdowns with addSection(sIdx)
  content = content.replace(
    /<div className="relative"[^>]*onClick[^>]*stopPropagation[^>]*>\s*<button\s[\s\S]*?setOpenDropdownId[\s\S]*?Add Section[\s\S]*?<\/button>\s*<div className[^>]*openDropdownId[^>]*>\s*\{[\s\S]*?addSection\(sIdx,[\s\S]*?<\/div>\s*<\/div>/g,
    () => {
      count++;
      return `<select
                              value=""
                              onChange={(e) => { if(e.target.value) { addSection(sIdx, e.target.value); (e.target as HTMLSelectElement).value = ""; } }}
                              className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl text-sm font-bold transition-all outline-none cursor-pointer border border-indigo-200"
                            >${SELECT_OPTIONS}
                            </select>`;
    }
  );

  // Remove unused openDropdownId state if no longer referenced
  const remainingRefs = (content.match(/openDropdownId/g) || []).length;
  if (remainingRefs <= 2) { // only the useState declaration itself
    content = content.replace(/\r?\n\s*const \[openDropdownId, setOpenDropdownId\] = useState<string \| null>\(null\);/, '');
    console.log('✅ Removed unused openDropdownId state from edit page');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ edit/page.tsx: replaced ${count} dropdown(s)`);
  return count;
}

const createPath = 'src/app/super-admin/courses/create/page.tsx';
const editPath   = 'src/app/super-admin/courses/edit/page.tsx';

const c1 = fixCreatePage(createPath);
const c2 = fixEditPage(editPath);

if (c1 === 0 && c2 === 0) {
  console.log('\n⚠️  No patterns replaced. Dumping snippet for debug...');
  const raw = fs.readFileSync(createPath, 'utf8');
  const idx = raw.indexOf('group/menu');
  if (idx !== -1) {
    console.log('Found group/menu at char', idx);
    console.log(JSON.stringify(raw.substring(idx - 50, idx + 400)));
  } else {
    console.log('group/menu not found at all in create page');
    // Show the إضافة قسم context
    const idx2 = raw.indexOf('\u0625\u0636\u0627\u0641\u0629 \u0642\u0633\u0645');
    if (idx2 !== -1) {
      console.log('Found إضافة قسم at char', idx2);
      console.log(JSON.stringify(raw.substring(idx2 - 200, idx2 + 100)));
    }
  }
}
