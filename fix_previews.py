import re

files = [
    "src/app/super-admin/skills-hub/edit/page.tsx",
    "src/app/school-admin/skills-hub/edit/page.tsx"
]

for file_path in files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the start of <aside className="w-full lg:w-80 space-y-6 shrink-0 flex flex-col">
    aside_start = content.find('<aside className="w-full lg:w-80 space-y-6 shrink-0 flex flex-col">')
    
    if aside_start == -1:
        print(f"Skipping {file_path}, aside not found.")
        continue
        
    # Find the end of aside which is followed by Main Interactive Workspace
    aside_end_marker = '{/* Main Interactive Workspace */}'
    aside_end = content.find(aside_end_marker, aside_start)
    
    if aside_end == -1:
        print(f"Skipping {file_path}, aside_end not found.")
        continue
        
    # Find the <div className="space-y-6 flex-1 w-full min-w-0"> after previewIsLoading
    target_div = '<div className="space-y-6 flex-1 w-full min-w-0">'
    target_div_idx = content.find(target_div, aside_end)
    
    if target_div_idx == -1:
        print(f"Skipping {file_path}, target_div not found.")
        continue
        
    # We will remove the aside completely.
    content = content[:aside_start] + content[aside_end:]
    
    # We need to insert the Top Bar immediately inside target_div
    # Recalculate target_div_idx because content length changed
    target_div_idx = content.find(target_div, aside_start)
    
    insert_idx = target_div_idx + len(target_div)
    
    top_bar = """
                  <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 mb-2">
                    {/* Metadata Tags */}
                    <div className="flex flex-wrap items-center gap-2">
                      {previewActivity.standard && (
                        <span className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-xl text-[11px] font-black border border-rose-100 flex items-center gap-1.5" title={previewActivity.standard}>
                          <Target className="w-3.5 h-3.5" />
                          {language === 'ar' ? 'المعيار' : 'Standard'}
                        </span>
                      )}
                      {previewActivity.indicator && (
                        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-[11px] font-black border border-emerald-100 flex items-center gap-1.5" title={previewActivity.indicator}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {language === 'ar' ? 'المؤشر' : 'Indicator'}
                        </span>
                      )}
                      {previewActivity.learningOutcome && (
                        <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-xl text-[11px] font-black border border-purple-100 flex items-center gap-1.5" title={previewActivity.learningOutcome}>
                          <GraduationCap className="w-3.5 h-3.5" />
                          {language === 'ar' ? 'الهدف' : 'Outcome'}
                        </span>
                      )}
                    </div>

                    {/* Helper Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {previewActivity.hint && (
                        <button
                          onClick={() => {
                            setPreviewHintsUsed(prev => prev + 1);
                            setPreviewHelperModal({ type: "hint", content: translateText(previewActivity.hint, language) });
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:scale-[1.02] text-amber-700 font-black text-[11px] transition-all cursor-pointer shadow-sm group"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'تلميح' : 'Hint'}</span>
                        </button>
                      )}
                      {previewActivity.tip && (
                        <button
                          onClick={() => setPreviewHelperModal({ type: "tip", content: translateText(previewActivity.tip, language) })}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:scale-[1.02] text-emerald-700 font-black text-[11px] transition-all cursor-pointer shadow-sm group"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'نصيحة' : 'Tip'}</span>
                        </button>
                      )}
                      {previewActivity.keyInsight && (
                        <button
                          onClick={() => setPreviewHelperModal({ type: "keyInsight", content: translateText(previewActivity.keyInsight, language) })}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:scale-[1.02] text-indigo-700 font-black text-[11px] transition-all cursor-pointer shadow-sm group"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'فكرة' : 'Insight'}</span>
                        </button>
                      )}
                    </div>
                  </div>
"""
    content = content[:insert_idx] + top_bar + content[insert_idx:]
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Fixed {file_path}")
