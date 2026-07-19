"use client";

import React from "react";
import { useCourseEditor } from "./CourseEditorContext";
import { Settings, Edit2, CheckCircle2, Trash2, Upload, Layers, EyeOff } from "lucide-react";
import { getFullImageUrl } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotification } from "@/context/NotificationContext";

export const CourseSettingsForm: React.FC = () => {
  const { language } = useLanguage();
  const { showToast } = useNotification();
  const {
    role,
    courseData,
    setCourseData,
    schools,
    selectAllSchools,
    toggleCourseSchool,
    setIsSettingsHidden,
  } = useCourseEditor();

  const [collapsed, setCollapsed] = React.useState(false);

  const getGradeName = (grade: string) => {
    if (language === "ar") {
      const translations: { [key: string]: string } = {
        Elementary: "المرحلة الابتدائية",
        "Middle School": "المرحلة الإعدادية",
        "High School": "المرحلة الثانوية",
        "الصف الأول الابتدائي": "الأول الابتدائي",
        "الصف الثاني الابتدائي": "الثاني الابتدائي",
        "الصف الثالث الابتدائي": "الثالث الابتدائي",
        "الصف الرابع الابتدائي": "الرابع الابتدائي",
        "الصف الخامس الابتدائي": "الخامس الابتدائي",
        "الصف السادس الابتدائي": "السادس الابتدائي",
        "الصف الأول الإعدادي": "الأول الإعدادي",
        "الصف الثاني الإعدادي": "الثاني الإعدادي",
        "الصف الثالث الإعدادي": "الثالث الإعدادي",
        "الصف الأول الثانوي": "الأول الثانوي",
        "الصف الثاني الثانوي": "الثاني الثانوي",
        "الصف الثالث الثانوي": "الثالث الثانوي",
      };
      return translations[grade] || grade;
    }
    const translations: { [key: string]: string } = {
      Elementary: "Elementary Stage",
      "Middle School": "Middle School Stage",
      "High School": "High School Stage",
      "الصف الأول الابتدائي": "1st Primary",
      "الصف الثاني الابتدائي": "2nd Primary",
      "الصف الثالث الابتدائي": "3rd Primary",
      "الصف الرابع الابتدائي": "4th Primary",
      "الصف الخامس الابتدائي": "5th Primary",
      "الصف السادس الابتدائي": "6th Primary",
      "الصف الأول الإعدادي": "1st Prep",
      "الصف الثاني الإعدادي": "2nd Prep",
      "الصف الثالث الإعدادي": "3rd Prep",
      "الصف الأول الثانوي": "1st Secondary",
      "الصف الثاني الثانوي": "2nd Secondary",
      "الصف الثالث الثانوي": "3rd Secondary",
    };
    return translations[grade] || grade;
  };

  const getGradeCheckboxLabel = (grade: string) => {
    if (language === "ar") {
      const translations: { [key: string]: string } = {
        "الصف الأول الابتدائي": "الأول",
        "الصف الثاني الابتدائي": "الثاني",
        "الصف الثالث الابتدائي": "الثالث",
        "الصف الرابع الابتدائي": "الرابع",
        "الصف الخامس الابتدائي": "الخامس",
        "الصف السادس الابتدائي": "السادس",
        "الصف الأول الإعدادي": "الأول",
        "الصف الثاني الإعدادي": "الثاني",
        "الصف الثالث الإعدادي": "الثالث",
        "الصف الأول الثانوي": "الأول",
        "الصف الثاني الثانوي": "الثاني",
        "الصف الثالث الثانوي": "الثالث",
      };
      return translations[grade] || grade;
    }
    const translations: { [key: string]: string } = {
      "الصف الأول الابتدائي": "Gr. 1",
      "الصف الثاني الابتدائي": "Gr. 2",
      "الصف الثالث الابتدائي": "Gr. 3",
      "الصف الرابع الابتدائي": "Gr. 4",
      "الصف الخامس الابتدائي": "Gr. 5",
      "الصف السادس الابتدائي": "Gr. 6",
      "الصف الأول الإعدادي": "Gr. 1",
      "الصف الثاني الإعدادي": "Gr. 2",
      "الصف الثالث الإعدادي": "Gr. 3",
      "الصف الأول الثانوي": "Gr. 1",
      "الصف الثاني الثانوي": "Gr. 2",
      "الصف الثالث الثانوي": "Gr. 3",
    };
    return translations[grade] || grade;
  };

  if (role !== "SUPER_ADMIN") {
    return null;
  }

  return (
    <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
        <span className="font-black text-slate-800 flex items-center gap-2 text-sm">
          <Settings className="w-4 h-4 text-indigo-600" /> {language === "ar" ? "إعدادات الكورس" : "Course Settings"}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-1.5"
          >
            {collapsed ? (
              <>
                <Edit2 className="w-3 h-3" />
                {language === "ar" ? "تعديل" : "Edit"}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3" />
                {language === "ar" ? "حفظ" : "Save"}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsSettingsHidden(true)}
            className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all flex items-center gap-1.5"
          >
            <EyeOff className="w-3 h-3" />
            {language === "ar" ? "إخفاء" : "Hide"}
          </button>
        </div>
      </div>

      {collapsed ? (
        <div className="px-6 py-4 space-y-4">
          {courseData.coverImage && (
            <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-100 mb-2">
              <img src={getFullImageUrl(courseData.coverImage) || ""} className="w-full h-full object-cover" alt="Cover" />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <p className="font-black text-slate-800 text-sm truncate">{courseData.title || "—"}</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {courseData.grades && courseData.grades.length > 0 ? (
                Array.from(new Set(courseData.grades)).map((g, index) => (
                  <span key={`${g}-${index}`} className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-lg text-xs font-black shrink-0">
                    {getGradeName(g)}
                  </span>
                ))
              ) : (
                <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-lg text-xs font-black">—</span>
              )}
              {courseData.subject && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black">{courseData.subject}</span>}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-5">
          {/* Cover Image Upload */}
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">
              {language === "ar" ? "صورة الغلاف" : "Cover Image"}
            </label>
            <div className="relative group cursor-pointer">
              {courseData.coverImage ? (
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-slate-100 group-hover:border-indigo-400 transition-all">
                  <img src={getFullImageUrl(courseData.coverImage) || ""} className="w-full h-full object-cover" alt="Cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCourseData({ ...courseData, coverImage: "" })}
                      className="p-2 bg-red-500 text-white rounded-xl hover:scale-110 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <label className="p-2 bg-indigo-600 text-white rounded-xl hover:scale-110 transition-all cursor-pointer">
                      <Upload className="w-5 h-5" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={async (e: any) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const { uploadFileToServer } = await import("@/lib/image-utils");
                              const url = await uploadFileToServer(file);
                              if (confirm(language === "ar" ? "هل تريد اعتماد هذه الصورة كغلاف جديد؟" : "Do you want to use this image as the new cover?")) {
                                setCourseData({ ...courseData, coverImage: url });
                                showToast(language === "ar" ? "تم تحديث صورة الغلاف بنجاح" : "Cover image updated successfully", "success");
                              }
                            } catch (error) {
                              console.error("Upload error:", error);
                              showToast(language === "ar" ? "فشل رفع الصورة، حاول مرة أخرى" : "Failed to upload image, please try again", "error");
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-video w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all group cursor-pointer">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-black text-slate-400 group-hover:text-indigo-600">
                    {language === "ar" ? "اضغط لرفع غلاف الكورس" : "Click to upload course cover"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={async (e: any) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const { uploadFileToServer } = await import("@/lib/image-utils");
                          const url = await uploadFileToServer(file);
                          if (confirm(language === "ar" ? "تأكيد اعتماد هذه الصورة كغلاف؟" : "Confirm using this image as cover?")) {
                            setCourseData({ ...courseData, coverImage: url });
                            showToast(language === "ar" ? "تم تحديث صورة الغلاف بنجاح" : "Cover image updated successfully", "success");
                          }
                        } catch (error) {
                          console.error("Upload error:", error);
                          showToast(language === "ar" ? "فشل رفع الصورة، حاول مرة أخرى" : "Failed to upload image, please try again", "error");
                        }
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">{language === "ar" ? "عنوان الكورس" : "Course Title"}</label>
            <input
              type="text"
              value={courseData.title}
              onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">{language === "ar" ? "وصف الكورس" : "Course Description"}</label>
            <textarea
              value={courseData.description}
              onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 min-h-[100px] max-h-[250px] overflow-y-auto resize-none transition-all text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">{language === "ar" ? "الدولة" : "Country"}</label>
            <select
              value={courseData.country}
              onChange={(e) => setCourseData({ ...courseData, country: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all text-sm appearance-none"
            >
              <option value="مصر">{language === "ar" ? "مصر" : "Egypt"}</option>
              <option value="السعودية">{language === "ar" ? "السعودية" : "Saudi Arabia"}</option>
              <option value="الإمارات">{language === "ar" ? "الإمارات" : "UAE"}</option>
              <option value="الكويت">{language === "ar" ? "الكويت" : "Kuwait"}</option>
            </select>
          </div>
          <div className="space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">{language === "ar" ? "المراحل والصفوف الدراسية" : "Stages & Grade Levels"}</label>
            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-1 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {[
                {
                  stage: "Elementary",
                  title: language === "ar" ? "المرحلة الابتدائية (Primary)" : "Elementary School (Primary)",
                  grades: ["الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي", "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي"],
                },
                {
                  stage: "Middle School",
                  title: language === "ar" ? "المرحلة الإعدادية (Prep)" : "Middle School (Prep)",
                  grades: ["الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي"],
                },
                {
                  stage: "High School",
                  title: language === "ar" ? "المرحلة الثانوية (Secondary)" : "High School (Secondary)",
                  grades: ["الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"],
                },
              ].map((group) => {
                const allSelected = group.grades.every((g) => courseData.grades.includes(g));

                return (
                  <div key={group.stage} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <h4 className="font-black text-sm text-slate-800 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        {group.title}
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          if (allSelected) {
                            setCourseData({
                              ...courseData,
                              grades: courseData.grades.filter((g) => !group.grades.includes(g)),
                            });
                          } else {
                            const newGrades = [...courseData.grades];
                            group.grades.forEach((g) => {
                              if (!newGrades.includes(g)) newGrades.push(g);
                            });
                            setCourseData({
                              ...courseData,
                              grades: newGrades,
                            });
                          }
                        }}
                        className="text-xs font-black text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                      >
                        {allSelected ? (language === "ar" ? "إلغاء تحديد الكل" : "Unselect All") : (language === "ar" ? "تحديد الكل" : "Select All")}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {group.grades.map((g) => (
                        <label
                          key={g}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                            courseData.grades.includes(g) ? "bg-indigo-50/50 border-indigo-400" : "bg-white border-slate-100 hover:border-slate-200"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                              courseData.grades.includes(g) ? "bg-indigo-600 text-white" : "bg-slate-100 border border-slate-200"
                            }`}
                          >
                            {courseData.grades.includes(g) && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                          <span className={`text-[11px] sm:text-xs font-bold ${courseData.grades.includes(g) ? "text-indigo-900" : "text-slate-600"}`}>
                            {getGradeCheckboxLabel(g)}
                          </span>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={courseData.grades.includes(g)}
                            onChange={(e) => {
                              if (e.target.checked) setCourseData({ ...courseData, grades: [...courseData.grades, g] });
                              else setCourseData({ ...courseData, grades: courseData.grades.filter((gr) => gr !== g) });
                            }}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">{language === "ar" ? "المادة" : "Subject"}</label>
            <input
              type="text"
              value={courseData.subject}
              onChange={(e) => setCourseData({ ...courseData, subject: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold outline-none focus:border-indigo-600 transition-all text-sm"
            />
          </div>

          {role === "SUPER_ADMIN" && (
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">{language === "ar" ? "إسناد الكورس (نطاق الكورس)" : "Course Assignment (Scope)"}</label>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => setCourseData({ ...courseData, isCentral: true, schoolId: "", schoolIds: [] })}
                  className={`py-3 rounded-xl text-[10px] font-black transition-all ${courseData.isCentral ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-50 text-slate-400"}`}
                >
                  {language === "ar" ? "نطاق مركزي (كل المدارس)" : "Central Scope (All Schools)"}
                </button>
                <button
                  type="button"
                  onClick={() => setCourseData({ ...courseData, isCentral: false })}
                  className={`py-3 rounded-xl text-[10px] font-black transition-all ${!courseData.isCentral ? "bg-orange-500 text-white shadow-lg" : "bg-slate-50 text-slate-400"}`}
                >
                  {language === "ar" ? "تخصيص لمدرسة محددة" : "Assign to Specific School"}
                </button>
              </div>

              {!courseData.isCentral && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between items-center mb-3 px-1">
                    <span className="text-xs font-bold text-slate-500">{language === "ar" ? "اختر المدارس المحددة:" : "Select Specific Schools:"}</span>
                    <button type="button" onClick={selectAllSchools} className="text-[10px] font-black text-indigo-600 hover:underline">
                      {(courseData.schoolIds || []).length === schools.length ? "إلغاء الكل" : "تحديد كافة المدارس"}
                    </button>
                  </div>
                  <div className="max-h-[220px] overflow-y-auto custom-scrollbar p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    {schools.map((s) => (
                      <label
                        key={s.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                          (courseData.schoolIds || []).includes(s.id) ? "bg-indigo-50/50 border-indigo-400" : "bg-white border-slate-100 hover:border-slate-200"
                        }`}
                      >
                        <span className={`text-xs font-bold ${(courseData.schoolIds || []).includes(s.id) ? "text-indigo-900" : "text-slate-600"}`}>{s.name}</span>
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                            (courseData.schoolIds || []).includes(s.id) ? "bg-indigo-600 text-white" : "bg-slate-100 border border-slate-200"
                          }`}
                        >
                          {(courseData.schoolIds || []).includes(s.id) && <CheckCircle2 className="w-3 h-3" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={(courseData.schoolIds || []).includes(s.id)} onChange={() => toggleCourseSchool(s.id)} />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
