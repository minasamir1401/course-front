const fs = require('fs');

const filesToPatch = [
    'd:/mina/front/src/app/super-admin/exams/new/components/SettingsPanel.tsx',
    'd:/mina/front/src/app/super-admin/exams/edit/[id]/components/SettingsPanel.tsx',
    'd:/mina/front/src/app/school-admin/exams/new/components/SettingsPanel.tsx',
    'd:/mina/front/src/app/school-admin/exams/edit/[id]/components/SettingsPanel.tsx'
];

filesToPatch.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    
    if (content.includes('نوع التقييم')) {
        console.log('Already patched:', file);
        return;
    }
    
    // Find the start of the block
    const searchStartStr = 'Assign Assessment to School';
    const startIdx = content.indexOf(searchStartStr);
    if (startIdx === -1) {
        console.log('Could not find search string in', file);
        return;
    }
    
    const divStartIdx = content.lastIndexOf('<div', startIdx);
    
    // Find the end of the block
    const searchEndStr = '      </div>\r\n\r\n                    <div className="grid grid-cols-1';
    let endIdx = content.indexOf(searchEndStr, startIdx);
    if (endIdx === -1) {
        // Try without CRLF
        const searchEndStr2 = '      </div>\n\n                    <div className="grid grid-cols-1';
        endIdx = content.indexOf(searchEndStr2, startIdx);
    }
    
    if (endIdx === -1) {
        // Fallback: look for `<div className="grid grid-cols-1 md:grid-cols-2 gap-8">`
        const fallbackStr = '<div className="grid grid-cols-1 md:grid-cols-2 gap-8">';
        const fallbackIdx = content.indexOf(fallbackStr, startIdx);
        if (fallbackIdx !== -1) {
            // Find the preceding `</div>`
            endIdx = content.lastIndexOf('</div>', fallbackIdx);
            // Move to end of `</div>`
            endIdx += 6;
        } else {
             console.log('Could not find end block in', file);
             return;
        }
    } else {
        // point endIdx to the start of `      </div>\r\n\r\n                    <div className="grid grid-cols-1`
        endIdx = endIdx + 12; // roughly past the `</div>`
    }
    
    // the original block text
    const oldBlock = content.slice(divStartIdx, endIdx);
    
    // Wrap the old block logic in our new condition, and insert the radios
    const replacement = `<div className="space-y-4">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'نوع التقييم' : 'Assessment Type'}</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="assessmentType" checked={examData.isCentral} onChange={() => setExamData({ ...examData, isCentral: true, schoolIds: [] })} className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                          <span className="text-sm font-bold text-slate-700">{language === 'ar' ? 'مركزي (لجميع المدارس)' : 'Centralized (All Schools)'}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="assessmentType" checked={!examData.isCentral} onChange={() => setExamData({ ...examData, isCentral: false })} className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                          <span className="text-sm font-bold text-slate-700">{language === 'ar' ? 'مخصص لمدارس محددة' : 'Specific Schools'}</span>
                        </label>
                      </div>

                      {!examData.isCentral && (
                        ` + oldBlock + `
                      )}
                    </div>`;

    const newContent = content.slice(0, divStartIdx) + replacement + content.slice(endIdx);
    
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Successfully patched UI for Centralized assessment in', file);
});
