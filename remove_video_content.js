const fs = require('fs');
const path = require('path');

const block1 = \`                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{language === 'ar' ? "رابط فيديو يوتيوب" : "YouTube Video URL"}</label>
                        <input 
                          type="text" 
                          value={currentModule.videoUrl}
                          onChange={(e) => setCurrentModule({...currentModule, videoUrl: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 text-lg font-bold outline-none focus:border-rose-600 transition-all text-left"
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>\`;

const block2 = \`                    <div className="space-y-3">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                        {language === 'ar' ? "محتوى الدرس" : "Lesson Content"}
                      </label>
                      <textarea
                        value={currentModule.content || ""}
                        onChange={(e) => setCurrentModule({ ...currentModule, content: e.target.value })}
                        className="w-full min-h-[180px] bg-slate-50 border border-slate-200 rounded-[28px] py-5 px-6 text-slate-900 text-base font-medium outline-none focus:border-indigo-600 transition-all shadow-sm resize-y leading-8"
                        placeholder={language === 'ar' ? "اكتب أو الصق المحتوى النصي للدرس هنا..." : "Write or paste the lesson content here..."}
                      />
                    </div>\`;

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

    content = content.replace(block1, '');
    content = content.replace(block2, '');

    fs.writeFileSync(uiPath, content);
    console.log("Updated " + uiPath);
  }
});
