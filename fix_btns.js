const fs = require('fs');

['src/app/super-admin/exams/edit/[id]/page.tsx', 'src/app/school-admin/exams/edit/[id]/page.tsx'].forEach(p => {
  let f = fs.readFileSync(p, 'utf8');
  const reportUrl = p.includes('school-admin') ? '/school-admin/exams/results/' : '/super-admin/exams/results/';
  
  const targetRegex = /\{\/\*\s*Actions\s*\*\/\}\s*<div className="flex items-center gap-2 shrink-0">\s*<button\s*onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*openEditModuleModal\(index\);\s*\}\}\s*className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all border border-blue-100"\s*>\s*<Edit2 className="w-4 h-4" \/>\s*<\/button>/g;
  
  const replacement = `{/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            onClick={(e) => { e.stopPropagation(); window.open('/exams/' + examId + '?moduleId=' + lesson.id, '_blank'); }}
                            title={language === 'ar' ? 'معاينة الموديول' : 'Preview Module'}
                            className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all border border-emerald-100"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); window.open('${reportUrl}' + examId + '?moduleId=' + lesson.id, '_blank'); }}
                            title={language === 'ar' ? 'التقرير' : 'Report'}
                            className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white flex items-center justify-center transition-all border border-amber-100"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); openEditModuleModal(index); }}
                            className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all border border-blue-100"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>`;
  
  f = f.replace(targetRegex, replacement);
  fs.writeFileSync(p, f);
});
