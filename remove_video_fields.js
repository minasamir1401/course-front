const fs = require('fs');
const path = require('path');

const directories = [
  'src/app/super-admin/exams/new',
  'src/app/super-admin/exams/edit/[id]',
  'src/app/school-admin/exams/new',
  'src/app/school-admin/exams/edit/[id]'
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const uiPath = path.join('d:/mina/front', dir, 'components', 'ModuleModal.tsx');
  if (fs.existsSync(uiPath)) {
    let content = fs.readFileSync(uiPath, 'utf8');

    // 1. Remove YouTube URL
    const searchYoutube = "<div>\\n                        <label className=\\"block text-xs font-black text-slate-400 uppercase tracking-widest mb-3\\">{language === 'ar' ? \\"رابط فيديو يوتيوب\\" : \\"YouTube Video URL\\"}</label>\\n                        <input \\n                          type=\\"text\\" \\n                          value={currentModule.videoUrl}\\n                          onChange={(e) => setCurrentModule({...currentModule, videoUrl: e.target.value})}\\n                          className=\\"w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 text-lg font-bold outline-none focus:border-rose-600 transition-all text-left\\"\\n                          placeholder=\\"https://youtube.com/watch?v=...\\"\\n                        />\\n                      </div>";
    
    // We will just replace it if we can find it. But whitespace might be tricky. 
    // Let's use regex that ignores whitespace safely.
    content = content.replace(/<div>\\s*<label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">\{language === 'ar' \? "رابط فيديو يوتيوب" : "YouTube Video URL"\}<\/label>\\s*<input[\\s\\S]*?placeholder="https:\/\/youtube\.com\/watch\?v=\.\.\."[\\s\\S]*?\/>\\s*<\/div>/g, '');

    content = content.replace(/<div className="space-y-3">\\s*<label className="block text-xs font-black text-slate-400 uppercase tracking-widest">\\s*\{language === 'ar' \? "محتوى الدرس" : "Lesson Content"\}\\s*<\/label>\\s*<textarea[\\s\\S]*?placeholder=\{language === 'ar' \? "اكتب أو الصق المحتوى النصي للدرس هنا\.\.\." : "Write or paste the lesson content here\.\.\."\}[\\s\\S]*?\/>\\s*<\/div>/g, '');

    content = content.replace(/<div className="grid grid-cols-1 md:grid-cols-2 gap-8">/g, '<div className="grid grid-cols-1 gap-8">');

    fs.writeFileSync(uiPath, content);
    console.log("Fixed " + uiPath);
  }
});
