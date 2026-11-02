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
    
    const blockRegex = /<div className="space-y-2">\s*<label className="text-xs font-black text-slate-400 uppercase tracking-widest">\{language === 'ar' \? 'إسناد التقييم للمدرسة' : 'Assign Assessment to School'\}<\/label>[\s\S]*?If no schools are selected, the assessment remains central. If multiple schools are selected, a copy will be created for each school.'\}\s*<\/p>\s*<\/>\s*\)\}\s*<\/div>/;

    if (content.match(blockRegex)) {
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
                        $&
                      )}
                    </div>`;

        content = content.replace(blockRegex, replacement);
        fs.writeFileSync(file, content, 'utf8');
        console.log('Successfully patched UI for Centralized assessment in', file);
    } else {
        console.log('Regex did not match in', file);
    }
});
