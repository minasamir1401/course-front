const fs = require('fs');

const files = [
  'd:/mina/front/src/app/super-admin/exams/new/components/QuestionsBuilder.tsx',
  'd:/mina/front/src/app/super-admin/exams/edit/[id]/components/QuestionsBuilder.tsx',
  'd:/mina/front/src/app/school-admin/exams/new/components/QuestionsBuilder.tsx',
  'd:/mina/front/src/app/school-admin/exams/edit/[id]/components/QuestionsBuilder.tsx',
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    const regex = /<div className="flex flex-col gap-2 md:col-span-2">\s*<label className="text-\[10px\] font-black text-slate-400 uppercase tracking-widest">\{language === 'ar' \? 'رابط فيديو اختياري للسؤال' : 'Optional Video Link'\}<\/label>\s*<input\s*type="url"\s*className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-xs outline-none focus:border-indigo-600 min-h-\[34px\]"\s*value=\{tempQuestion\.videoUrl \|\| ""\}\s*onChange=\{\(e\) => updateCurrentQuestionField\("videoUrl", e\.target\.value\)\}\s*placeholder="YouTube or Vimeo link\.\.\."\s*\/>\s*<\/div>/g;

    if (regex.test(content)) {
      content = content.replace(regex, '');
      fs.writeFileSync(file, content, 'utf8');
      console.log('Removed from ' + file);
    } else {
      console.log('Not found in ' + file);
    }
  }
}
