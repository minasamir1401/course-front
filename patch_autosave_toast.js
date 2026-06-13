const fs = require('fs');
const files = [
  'src/app/school-admin/courses/edit/page.tsx',
  'src/app/super-admin/courses/edit/page.tsx',
  'src/app/school-admin/exams/edit/[id]/page.tsx',
  'src/app/super-admin/exams/edit/[id]/page.tsx'
];

files.forEach(f => {
  if(fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf-8');

    // 1. Add toggle logic
    c = c.replace(
      /onChange=\{\(e\) => setIsAutoSaveEnabled\(e.target.checked\)\}/g,
      `onChange={(e) => {
                      const checked = e.target.checked;
                      setIsAutoSaveEnabled(checked);
                      if (checked) {
                        showToast("تم تفعيل الحفظ التلقائي (سيتم حفظ مسودة دورياً)", "warning");
                      } else {
                        showToast("تم إيقاف الحفظ التلقائي", "error");
                      }
                    }}`
    );

    // 2. Add toast on auto-save
    // In courses:
    if (c.includes('setLastAutoSave(new Date());')) {
      c = c.replace(
        /setLastAutoSave\(new Date\(\)\);/g,
        `setLastAutoSave(new Date());\n          showToast("تم الحفظ التلقائي بنجاح", "success");`
      );
    }
    
    fs.writeFileSync(f, c);
  }
});
