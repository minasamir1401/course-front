const fs = require('fs');
const path = require('path');

const correctCode = `                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={\`flex-1 py-5 flex items-center justify-center gap-3 font-black text-sm transition-all \${
                      activeTab === tab.id ? 'text-indigo-600 bg-white border-b-2 border-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                    }\`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 min-h-0 p-5 sm:p-8 lg:p-12 overflow-y-auto custom-scrollbar overscroll-contain">
                {activeTab === 'info' && (
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{language === 'ar' ? "عنوان الموديول" : "Module Title"}</label>
                        <input
                          type="text"
                          value={currentModule.title}
                          onChange={(e) => setCurrentModule({...currentModule, title: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 text-lg font-bold outline-none focus:border-indigo-600 transition-all shadow-sm"
                          placeholder={language === 'ar' ? "مثال: القوة والحركة في اتجاه واحد" : "e.g. Force and Motion in One Dimension"}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{language === 'ar' ? "رابط فيديو يوتيوب" : "YouTube Video URL"}</label>
                        <input 
                          type="text" 
                          value={currentModule.videoUrl}
                          onChange={(e) => setCurrentModule({...currentModule, videoUrl: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-900 text-lg font-bold outline-none focus:border-rose-600 transition-all text-left"
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                        {language === 'ar' ? "محتوى الدرس" : "Lesson Content"}
                      </label>
                      <textarea
                        value={currentModule.content || ""}
                        onChange={(e) => setCurrentModule({ ...currentModule, content: e.target.value })}
                        className="w-full min-h-[180px] bg-slate-50 border border-slate-200 rounded-[28px] py-5 px-6 text-slate-900 text-base font-medium outline-none focus:border-indigo-600 transition-all shadow-sm resize-y leading-8"
                        placeholder={language === 'ar' ? "اكتب أو الصق المحتوى النصي للدرس هنا..." : "Write or paste the lesson content here..."}
                      />
                    </div>

                    <div className="bg-white p-8 rounded-[35px] border border-slate-100 space-y-8">
                       <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                          <Target className="w-6 h-6 text-indigo-600" />
                          {language === 'ar' ? "الأهداف والمعايير الأكاديمية" : "Academic Objectives & Standards"}
                       </h4>
                       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-3">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest">{language === 'ar' ? "المجال" : "Domain"}</label>
                          <select `;

const uiPath = 'd:\\mina\\front\\src\\app\\super-admin\\exams\\new\\components\\ModuleModal.tsx';
let content = fs.readFileSync(uiPath, 'utf8');
const searchStr = `                              <option key={domainName} value={domainName}>{domainName}</option>
                            ))}
                          </select>
                        </div>`;

if (content.includes(searchStr)) {
    // we need to replace everything from .map(tab => ( down to <select
    const replaceStart = `                ].map(tab => (`;
    const replaceEnd = `<label className="text-xs font-black text-slate-500 uppercase tracking-widest">{language === 'ar' ? "المجال" : "Domain"}</label>
                          <select `;
                          
    const startIndex = content.indexOf(replaceStart);
    const endIndex = content.indexOf(replaceEnd) + replaceEnd.length;
    
    content = content.substring(0, startIndex + replaceStart.length) + '\n' + correctCode + content.substring(endIndex);
    fs.writeFileSync(uiPath, content);
    console.log('Restored');
}
