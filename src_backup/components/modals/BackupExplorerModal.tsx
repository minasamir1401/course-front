"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Search, ChevronDown, ChevronRight, Folder, FileText, FileQuestion, UploadCloud, Loader2 } from "lucide-react";

interface ExploreItem {
  id: string;
  type: 'course' | 'lesson' | 'exam';
  title: string;
  children?: ExploreItem[];
}

interface Selection {
  id: string;
  type: string;
  targetCourseId?: string;
}

interface LiveCourse {
  id: string;
  title: string;
}

interface BackupExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  treeData: ExploreItem[];
  filename: string;
  source: 'local' | 'cloud';
  liveCourses: LiveCourse[];
  language: "ar" | "en";
  onRestore: (selections: Selection[]) => Promise<void>;
}

export default function BackupExplorerModal({
  isOpen,
  onClose,
  treeData,
  filename,
  source,
  liveCourses,
  language,
  onRestore
}: BackupExplorerModalProps) {
  const [selections, setSelections] = useState<Selection[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelections([]);
      setExpanded(new Set());
      setSearchQuery("");
      setIsRestoring(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpanded(newExpanded);
  };

  const isSelected = (id: string) => selections.some(s => s.id === id);

  const handleSelect = (item: ExploreItem, isChecked: boolean) => {
    if (isChecked) {
      // Add to selections
      const newSelection: Selection = { id: item.id, type: item.type };
      // If it's a child and its parent course is not selected, we will require targetCourseId later
      setSelections([...selections, newSelection]);
    } else {
      // Remove
      setSelections(selections.filter(s => s.id !== item.id));
    }
  };

  const handleTargetCourseChange = (id: string, courseId: string) => {
    setSelections(selections.map(s => s.id === id ? { ...s, targetCourseId: courseId } : s));
  };

  const handleConfirm = async () => {
    // We allow empty targetCourseId because the backend will fallback to the original courseId
    setIsRestoring(true);
    await onRestore(selections);
    setIsRestoring(false);
  };

  const filterTree = (nodes: ExploreItem[]): ExploreItem[] => {
    if (!searchQuery) return nodes;
    const lowerQuery = searchQuery.toLowerCase();
    
    return nodes.map(node => {
      const matchSelf = node.title.toLowerCase().includes(lowerQuery);
      const matchedChildren = node.children ? filterTree(node.children) : [];
      
      if (matchSelf || matchedChildren.length > 0) {
        return { ...node, children: matchedChildren };
      }
      return null;
    }).filter(Boolean) as ExploreItem[];
  };

  const filteredTree = filterTree(treeData);

  const renderIcon = (type: string) => {
    if (type === 'course') return <Folder className="w-5 h-5 text-indigo-500" />;
    if (type === 'lesson') return <FileText className="w-4 h-4 text-emerald-500" />;
    if (type === 'exam') return <FileQuestion className="w-4 h-4 text-amber-500" />;
    return null;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-300 border border-slate-200/50">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
              <UploadCloud className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">
                {language === 'ar' ? "مستكشف محتويات النسخة" : "Backup Content Explorer"}
              </h2>
              <p className="text-sm text-slate-500 font-medium break-all">
                {filename.replace('السحابة:', '')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:bg-slate-50 hover:text-red-500 rounded-xl transition-colors shrink-0">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <div className="relative">
            <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400`} />
            <input 
              type="text"
              placeholder={language === 'ar' ? "ابحث عن كورس أو درس أو امتحان..." : "Search courses, lessons, or exams..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 ${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium`}
            />
          </div>

          <div className="space-y-3">
            {filteredTree.map(course => (
              <div key={course.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <div className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                  <button onClick={() => toggleExpand(course.id)} className="p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-400">
                    {expanded.has(course.id) || searchQuery ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />}
                  </button>
                  <label className="flex items-center gap-3 flex-1 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isSelected(course.id)} 
                      onChange={(e) => handleSelect(course, e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                    />
                    {renderIcon(course.type)}
                    <span className="font-bold text-slate-700">{course.title || (language === 'ar' ? 'بدون عنوان' : 'Untitled')}</span>
                    <span className="text-xs font-medium text-slate-400 px-2 py-1 bg-slate-100 rounded-md">
                      {course.children?.length || 0} {language === 'ar' ? "عنصر" : "items"}
                    </span>
                  </label>
                </div>
                
                {(expanded.has(course.id) || searchQuery) && course.children && course.children.length > 0 && (
                  <div className={`bg-slate-50 border-t border-slate-100 py-2 ${language === 'ar' ? 'pr-14' : 'pl-14'} space-y-1`}>
                    {course.children.map(child => {
                      const selected = isSelected(child.id);
                      const parentSelected = isSelected(course.id);
                      const needsTarget = selected && !parentSelected;
                      
                      return (
                        <div key={child.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 pr-4 pl-2 hover:bg-slate-100/50 rounded-xl transition-colors border-b border-slate-100 last:border-0">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={selected || parentSelected}
                              disabled={parentSelected}
                              onChange={(e) => handleSelect(child, e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer disabled:opacity-50"
                            />
                            {renderIcon(child.type)}
                            <span className={`text-sm font-semibold ${selected || parentSelected ? 'text-indigo-900' : 'text-slate-600'}`}>
                              {child.title || (language === 'ar' ? 'بدون عنوان' : 'Untitled')}
                            </span>
                          </label>
                          
                          {needsTarget && (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:w-1/2 mt-2 sm:mt-0 ml-7 sm:ml-0">
                              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md whitespace-nowrap">
                                {language === 'ar' ? "أين تريد وضعه؟" : "Move to:"}
                              </span>
                              <select
                                className="flex-1 bg-white border-2 border-indigo-200 rounded-xl text-xs py-2 px-3 outline-none focus:border-indigo-500 font-bold text-slate-700 shadow-sm"
                                onChange={(e) => handleTargetCourseChange(child.id, e.target.value)}
                                value={selections.find(s => s.id === child.id)?.targetCourseId || ""}
                              >
                                <option value="">{language === 'ar' ? "نفس الكورس الأصلي (افتراضي)" : "Original Course (Default)"}</option>
                                {liveCourses.map(lc => (
                                  <option key={lc.id} value={lc.id}>{lc.title}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            
            {filteredTree.length === 0 && (
              <div className="py-12 text-center text-slate-400 font-medium">
                {language === 'ar' ? "لا توجد بيانات مطابقة." : "No matching data found."}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-[32px]">
          <div className="text-sm font-bold text-slate-500">
            {language === 'ar' ? "تم تحديد" : "Selected"}: <span className="text-indigo-600 bg-indigo-100 px-3 py-1 rounded-lg text-lg ml-1">{selections.length}</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={onClose}
              disabled={isRestoring}
              className="flex-1 sm:flex-none px-6 py-3 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              {language === 'ar' ? "إلغاء" : "Cancel"}
            </button>
            <button 
              onClick={handleConfirm}
              disabled={selections.length === 0 || isRestoring}
              className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{language === 'ar' ? "جاري الاستعادة..." : "Restoring..."}</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>{language === 'ar' ? "استعادة التحديد" : "Restore Selected"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
