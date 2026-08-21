"use client";

import React from "react";
import { Plus, FileText, Trash2, Upload } from "lucide-react";

interface LessonAttachmentsTabProps {
  currentLesson: any;
  setCurrentLesson: (lesson: any) => void;
  language: string;
  showToast: (message: string, type: "success" | "error") => void;
}

export const LessonAttachmentsTab: React.FC<LessonAttachmentsTabProps> = ({
  currentLesson,
  setCurrentLesson,
  language,
  showToast
}) => {
  return (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xl font-black text-slate-900">{language === 'ar' ? "الملفات المرفقة" : "Attached Files"}</h4>
                      <button onClick={() => setCurrentLesson({ ...currentLesson, attachments: [...(currentLesson.attachments || []), { name: "", url: "", type: "PDF" }] })} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg"><Plus className="w-5 h-5" /> {language === 'ar' ? "إضافة ملف" : "Add File"}</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(currentLesson.attachments || []).map((att: any, attIdx: number) => (
                        <div key={attIdx} className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 hover:border-indigo-100 transition-all shadow-sm">
                          <div className="flex justify-between items-start">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><FileText className="w-6 h-6" /></div>
                            <button onClick={() => { const atts = [...currentLesson.attachments]; atts.splice(attIdx, 1); setCurrentLesson({ ...currentLesson, attachments: atts }); }} className="text-red-500 hover:text-red-700 p-2 transition-colors"><Trash2 size={20} /></button>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">{language === 'ar' ? "اسم الملف" : "File Name"}</label>
                            <input type="text" value={att.name} onChange={(e) => { const atts = [...currentLesson.attachments]; atts[attIdx].name = e.target.value; setCurrentLesson({ ...currentLesson, attachments: atts }); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold text-sm outline-none focus:border-indigo-600" placeholder={language === 'ar' ? "مثال: كتاب الفيزياء الأساسي" : "e.g. Basic Physics Book"} />
                          </div>
                          <div className="flex gap-3">
                            <div className="w-32 space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">{language === 'ar' ? "النوع" : "Type"}</label>
                              <select value={att.type} onChange={(e) => { const atts = [...currentLesson.attachments]; atts[attIdx].type = e.target.value; setCurrentLesson({ ...currentLesson, attachments: atts }); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold text-xs outline-none focus:border-indigo-600">
                                <option value="PDF">PDF</option>
                                <option value="PPT">PPT</option>
                                <option value="DOC">DOC</option>
                                <option value="XLS">XLS</option>
                                <option value="IMAGE">IMAGE</option>
                              </select>
                            </div>
                            <div className="flex-1 space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1 text-left" dir="ltr">URL</label>
                              <div className="flex items-center gap-2">
                                <input type="text" value={att.url} onChange={(e) => { const atts = [...currentLesson.attachments]; atts[attIdx].url = e.target.value; setCurrentLesson({ ...currentLesson, attachments: atts }); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-600 text-xs outline-none text-left font-mono focus:border-indigo-600" dir="ltr" placeholder="https://..." />
                                <label className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl cursor-pointer transition-all flex items-center justify-center shrink-0 shadow-sm border border-indigo-200" title={language === 'ar' ? "رفع ملف (PDF, PPT, DOC...)" : "Upload File"}>
                                  <Upload className="w-4 h-4" />
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,image/*" 
                                    onChange={async (e: any) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        try {
                                          const { uploadFileToServer } = await import("@/lib/image-utils");
                                          const url = await uploadFileToServer(file);
                                          const atts = [...currentLesson.attachments];
                                          atts[attIdx].url = url;
                                          if (!atts[attIdx].name) atts[attIdx].name = file.name;
                                          if (file.name.toLowerCase().endsWith('.pdf')) atts[attIdx].type = 'PDF';
                                          else if (file.name.match(/\.(ppt|pptx)$/i)) atts[attIdx].type = 'PPT';
                                          else if (file.name.match(/\.(doc|docx)$/i)) atts[attIdx].type = 'DOC';
                                          else if (file.name.match(/\.(xls|xlsx)$/i)) atts[attIdx].type = 'XLS';
                                          else if (file.type.startsWith('image/')) atts[attIdx].type = 'IMAGE';
                                          setCurrentLesson({...currentLesson, attachments: atts});
                                          showToast(language === 'ar' ? "تم رفع الملف بنجاح ✅" : "File uploaded successfully ✅", "success");
                                        } catch (error) {
                                          showToast(language === 'ar' ? "فشل رفع الملف ❌" : "File upload failed ❌", "error");
                                        }
                                      }
                                    }} 
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
  );
};
