"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, Download, Edit2, Eye, FileCode, HelpCircle, Plus, Trash2, Upload, ArrowRightLeft, FolderInput, X, Loader2, FolderTree, Layers, ArrowUpRight, Settings, CheckCircle2, AlertCircle, Clock, Target } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useNotification } from "@/context/NotificationContext";
import * as XLSX from "xlsx";
import { buildQuestionWorkbook } from "@/lib/questionExcelWorkbook";
import { buildModuleEditHref, buildSubExamEditorHref, buildModulePortalHref, getModulePortalQuestions, getStandaloneQuestions } from "@/lib/examModuleView";
import { collectQuestionsIntoSubExam, getQuestionCollectionTargets } from "@/lib/examQuestionCollection";
import { getCreatedAtLabel, getUpdatedAtLabel } from "@/lib/examModulePresentation";
import HtmlRenderer from "@/components/HtmlRenderer";
import MoveModuleModal from "@/components/exams/MoveModuleModal";
import SubjectArtwork from '@/components/student/SubjectArtwork';
import { examArtworkKey } from '@/lib/examArtwork';
import FileUpload from "@/components/FileUpload";

const SETTINGS_CATEGORIES = [
  "اللغة العربية", "اللغة الإنجليزية", "اللغة الفرنسية", "اللغة الألمانية", "اللغة الإيطالية",
  "الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "الجيولوجيا", "الميكانيكا",
  "التاريخ", "الجغرافيا", "الفلسفة", "علم النفس", "الاقتصاد", "الإحصاء",
  "التربية الدينية", "التربية الوطنية", "الحاسب الآلي",
  "SAT Math", "SAT English"
];

const SETTINGS_STAGES = [
  {
    stage: "Elementary",
    titleAr: "المرحلة الابتدائية (Primary)",
    titleEn: "Elementary School (Primary)",
    grades: [
      "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
      "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي"
    ]
  },
  {
    stage: "Middle School",
    titleAr: "المرحلة الإعدادية (Prep)",
    titleEn: "Middle School (Prep)",
    grades: [
      "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي"
    ]
  },
  {
    stage: "High School",
    titleAr: "المرحلة الثانوية (Secondary)",
    titleEn: "High School (Secondary)",
    grades: [
      "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
    ]
  }
];

const SETTINGS_GRADE_NAMES: { [key: string]: { ar: string; en: string } } = {
  "الصف الأول الابتدائي": { ar: "الأول الابتدائي", en: "1st Primary" },
  "الصف الثاني الابتدائي": { ar: "الثاني الابتدائي", en: "2nd Primary" },
  "الصف الثالث الابتدائي": { ar: "الثالث الابتدائي", en: "3rd Primary" },
  "الصف الرابع الابتدائي": { ar: "الرابع الابتدائي", en: "4th Primary" },
  "الصف الخامس الابتدائي": { ar: "الخامس الابتدائي", en: "5th Primary" },
  "الصف السادس الابتدائي": { ar: "السادس الابتدائي", en: "6th Primary" },
  "الصف الأول الإعدادي": { ar: "الأول الإعدادي", en: "1st Prep" },
  "الصف الثاني الإعدادي": { ar: "الثاني الإعدادي", en: "2nd Prep" },
  "الصف الثالث الإعدادي": { ar: "الثالث الإعدادي", en: "3rd Prep" },
  "الصف الأول الثانوي": { ar: "الأول الثانوي", en: "1st Secondary" },
  "الصف الثاني الثانوي": { ar: "الثاني الثانوي", en: "2nd Secondary" },
  "الصف الثالث الثانوي": { ar: "الثالث الثانوي", en: "3rd Secondary" }
};

const SETTINGS_SUBJECT_NAMES: { [key: string]: string } = {
  "اللغة العربية": "Arabic",
  "اللغة الإنجليزية": "English",
  "اللغة الفرنسية": "French",
  "اللغة الألمانية": "German",
  "اللغة الإيطالية": "Italian",
  "الرياضيات": "Mathematics",
  "الفيزياء": "Physics",
  "الكيمياء": "Chemistry",
  "الأحياء": "Biology",
  "الجيولوجيا": "Geology",
  "الميكانيكا": "Mechanics",
  "التاريخ": "History",
  "الجغرافيا": "Geography",
  "الفلسفة": "Philosophy",
  "علم النفس": "Psychology",
  "الاقتصاد": "Economics",
  "الإحصاء": "Statistics",
  "التربية الدينية": "Religious Education",
  "التربية الوطنية": "National Education",
  "الحاسب الآلي": "Computer Science",
  "SAT Math": "SAT Math",
  "SAT English": "SAT English"
};

const getGradeName = (grade: string, lang: string = "ar") => {
  if (SETTINGS_GRADE_NAMES[grade]) {
    return lang === "ar" ? SETTINGS_GRADE_NAMES[grade].ar : SETTINGS_GRADE_NAMES[grade].en;
  }
  return grade;
};

const getSubjectName = (cat: string, lang: string = "ar") => {
  if (SETTINGS_SUBJECT_NAMES[cat]) {
    return lang === "ar" ? cat : SETTINGS_SUBJECT_NAMES[cat];
  }
  return cat;
};

import type { useExamModulePortalState } from './useExamModulePortalState';

export default function ExamModulePortalView(props: Exclude<ReturnType<typeof useExamModulePortalState>, import("react").ReactElement>) {
  const { state, moduleId, language, role, router, showToast, normalizedModuleId, normalizeId, findModuleRecursive, examModule, findParentModule, parentModule, title, setTitle, creating, setCreating, collectingSubExamId, setCollectingSubExamId, selectedTargetExamId, setSelectedTargetExamId, movingSubExam, setMovingSubExam, moveMode, setMoveMode, targetMoveModuleId, setTargetMoveModuleId, newModuleTitle, setNewModuleTitle, isMovingSubExam, setIsMovingSubExam, destinationModules, setDestinationModules, isLoadingDestinations, setIsLoadingDestinations, allExamsList, setAllExamsList, targetExamIdForNew, setTargetExamIdForNew, isMoveAllModalOpen, setIsMoveAllModalOpen, isMovingAllSubExams, setIsMovingAllSubExams, subModuleTitle, setSubModuleTitle, creatingSubModule, setCreatingSubModule, subModuleToMove, setSubModuleToMove, isMoveCurrentModuleModalOpen, setIsMoveCurrentModuleModalOpen, isModuleSettingsOpen, setIsModuleSettingsOpen, moduleSettingsTitle, setModuleSettingsTitle, moduleSettingsDescription, setModuleSettingsDescription, moduleSettingsCoverImage, setModuleSettingsCoverImage, moduleSettingsGrades, setModuleSettingsGrades, moduleSettingsSubjects, setModuleSettingsSubjects, moduleSettingsIsCentral, setModuleSettingsIsCentral, moduleSettingsSchoolIds, setModuleSettingsSchoolIds, moduleSettingsDuration, setModuleSettingsDuration, moduleSettingsPassingScore, setModuleSettingsPassingScore, moduleSettingsAttempts, setModuleSettingsAttempts, moduleSettingsPassword, setModuleSettingsPassword, moduleSettingsStartDate, setModuleSettingsStartDate, moduleSettingsEndDate, setModuleSettingsEndDate, moduleSettingsResultVisibility, setModuleSettingsResultVisibility, isSavingModuleSettings, setIsSavingModuleSettings, toggleSettingsGrade, toggleSettingsSubject, toggleSettingsSchool, selectAllSettingsSchools, titleInputRef, jsonInputRef, moduleEditHref, tokenKey, exams, directQuestions, standaloneQuestions, collectionTargets, questions, exportExamData, exportExamJson, importExamJson, createExam, createSubModule, deleteSubModule, deleteExam, collectQuestions, getAuthToken, fetchAvailableDestinations, openMoveModal, handleConfirmMove, openMoveAllModal, handleConfirmMoveAll, handleOpenModuleSettings, handleSaveModuleSettings } = props;
return (
    <div className="space-y-8" dir={language === "ar" ? "rtl" : "ltr"}>
    <div className="rounded-[36px] bg-white border border-slate-100 shadow-sm p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors">←</button>
        <div>
          {parentModule && (
            <div className="flex items-center gap-2 text-xs font-black text-indigo-600 mb-1">
              <Link
                href={buildModulePortalHref(role, state.createdIdRef.current || state.createdId, parentModule.id) || "#"}
                className="hover:underline flex items-center gap-1"
              >
                <span>{parentModule.title || (language === "ar" ? "الموديول الرئيسي" : "Parent Module")}</span>
              </Link>
              <span>/</span>
              <span className="text-slate-500">{examModule.title}</span>
            </div>
          )}
          <div className="text-xs font-black text-indigo-600 uppercase tracking-widest">{language === "ar" ? "بوابة Module الاختبارات" : "Exam Module Portal"}</div>
          <h1 className="text-3xl font-black text-slate-900 mt-1">{examModule.title}</h1>
          <p className="text-slate-400 font-bold mt-1">{examModule.description || (language === "ar" ? "أنشئ الاختبارات والموديولات الفرعية داخل هذا الموديول" : "Create exams and sub-modules inside this module")}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-black text-slate-400">
            <span>{getCreatedAtLabel(examModule.createdAt, language)}</span>
            <span>{getUpdatedAtLabel(examModule.updatedAt, language)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => {
            fetchAvailableDestinations(state.createdIdRef.current || state.createdId);
            setIsMoveCurrentModuleModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-2xl border border-purple-200 bg-purple-50 px-5 py-3 text-sm font-black text-purple-700 transition-all hover:bg-purple-100 shadow-xs"
        >
          <ArrowRightLeft className="w-4 h-4" />
          {language === "ar" ? "نقل هذا الموديول" : "Move This Module"}
        </button>
        <button
          type="button"
          onClick={handleOpenModuleSettings}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition-all hover:border-indigo-200 hover:text-indigo-600 shadow-xs"
        >
          <Settings className="w-4 h-4 text-indigo-600" />
          {language === "ar" ? "إعدادات الموديول" : "Module Settings"}
        </button>
      </div>
    </div>

    {/* Sub-Modules Section */}
    <div className="rounded-[36px] bg-white border border-slate-100 shadow-sm p-7">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-indigo-600" />
            {language === "ar" ? "الموديولات الفرعية" : "Sub-Modules"}
          </h2>
          <p className="text-slate-400 font-bold mt-1">
            {(examModule.subModules || []).length} {language === "ar" ? "موديول فرعي داخل هذا الموديول" : "sub-modules in this module"}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            value={subModuleTitle}
            onChange={(e) => setSubModuleTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") createSubModule(); }}
            placeholder={language === "ar" ? "اسم الموديول الفرعي الجديد..." : "New sub-module name..."}
            className="min-w-0 flex-1 md:w-64 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:border-indigo-500 text-sm"
          />
          <button
            type="button"
            disabled={creatingSubModule}
            onClick={createSubModule}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-white font-black text-sm disabled:opacity-50 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            {creatingSubModule ? (language === "ar" ? "جارٍ الإنشاء..." : "Creating...") : (language === "ar" ? "إضافة موديول فرعي" : "Add Sub-Module")}
          </button>
        </div>
      </div>

      {(examModule.subModules || []).length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-100 p-8 text-center text-slate-400 font-bold text-sm">
          {language === "ar" ? "لا توجد موديولات فرعية حتى الآن داخل هذا الموديول. يمكنك إضافة موديول فرعي لتنظيم الاختبارات." : "No sub-modules inside this module yet. You can add one to organize exams."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(examModule.subModules || []).map((sm: any) => {
            const smPortalHref = buildModulePortalHref(role, state.createdIdRef.current || state.createdId, sm.id);
            const smExamsCount = sm.examsCount ?? (sm.subExams || []).length;
            const smQuestionsCount = (sm.subExams || []).reduce(
              (tot: number, se: any) => tot + (se.questionsCount ?? se._count?.questions ?? (se.questions || []).length ?? 0),
              0
            );

            return (
              <div key={sm.id} className="rounded-3xl border border-indigo-50 bg-slate-50/70 p-5 shadow-xs hover:border-indigo-200 transition-all overflow-hidden">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center shrink-0">
                    <FolderTree className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        fetchAvailableDestinations(state.createdIdRef.current || state.createdId);
                        setSubModuleToMove(sm);
                      }}
                      className="w-8 h-8 rounded-xl bg-white text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center shadow-xs border border-slate-100"
                      title={language === "ar" ? "نقل الموديول الفرعي" : "Move sub-module"}
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSubModule(sm.id)}
                      className="w-8 h-8 rounded-xl bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center shadow-xs border border-slate-100"
                      title={language === "ar" ? "حذف الموديول الفرعي" : "Delete sub-module"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="mt-4 text-lg font-black text-slate-900 truncate">{sm.title}</h3>
                <div className="mt-2 flex items-center gap-3 text-xs font-bold text-slate-400">
                  <span>{smExamsCount} {language === "ar" ? "اختبارات" : "exams"}</span>
                  <span>·</span>
                  <span>{smQuestionsCount} {language === "ar" ? "سؤال" : "questions"}</span>
                </div>

                {smPortalHref && (
                  <Link
                    href={smPortalHref}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white border border-indigo-100 px-4 py-2.5 text-xs font-black text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-xs"
                  >
                    <span>{language === "ar" ? "دخول الموديول الفرعي" : "Open Sub-Module"}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>

    <div className="rounded-[36px] bg-white border border-slate-100 shadow-sm p-7">
      <input ref={jsonInputRef} type="file" accept=".json,application/json" onChange={importExamJson} className="hidden" />
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6"><div><h2 className="text-2xl font-black text-slate-900">{language === "ar" ? "الاختبارات" : "Exams"}</h2><p className="text-slate-400 font-bold mt-1 flex items-center flex-wrap gap-2"><span>{exams.length} {language === "ar" ? "اختبارات" : "exams"} · {questions} {language === "ar" ? "سؤال" : "questions"}</span>{state.isLoadingQuestions && (<span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100/80 px-2.5 py-0.5 text-xs font-black text-indigo-600 animate-pulse"><Loader2 className="w-3 h-3 animate-spin text-indigo-600" /><span>{language === "ar" ? "جارٍ مزامنة الأسئلة في الخلفية..." : "Loading questions in background..."}</span></span>)}</p></div><div className="flex flex-wrap gap-2 w-full md:w-auto">{exams.length > 0 && <button type="button" onClick={openMoveAllModal} className="inline-flex items-center gap-2 rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-black text-purple-700 transition-all hover:bg-purple-100 shadow-xs"><ArrowRightLeft className="w-4 h-4" /><span>{language === "ar" ? "نقل كل الاختبارات إلى موديول آخر" : "Move All Exams"}</span><span className="rounded-lg bg-purple-200/70 px-2 py-0.5 text-xs font-black text-purple-900">{exams.length}</span></button>}{role === "SUPER_ADMIN" && <button onClick={() => jsonInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition-all hover:bg-emerald-100"><Upload className="w-4 h-4" />{language === "ar" ? "استعادة JSON" : "Restore JSON"}</button>}<input ref={titleInputRef} value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === "Enter") createExam(); }} placeholder={language === "ar" ? "اسم الاختبار الجديد" : "New exam name"} className="min-w-0 flex-1 md:w-56 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:border-indigo-500" /><button disabled={creating} onClick={createExam} className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-white font-black disabled:opacity-50"><Plus className="w-5 h-5" />{language === "ar" ? "إنشاء اختبار" : "Create Exam"}</button></div></div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {exams.map((exam: any, index: number) => {
          const editHref = buildSubExamEditorHref(
            role,
            state.createdIdRef.current || state.createdId || "",
            normalizedModuleId,
            exam.id,
          );
          const previewHref = `/exams/${state.createdIdRef.current}?preview=true&subExamId=${encodeURIComponent(exam.id)}`;
          const questionCount = exam.questions?.length || exam.questionsCount || exam._count?.questions || 0;
          const examTitle = exam.title || (language === "ar" ? "اختبار بدون عنوان" : "Untitled Exam");

          return (
            <div key={exam.id || index} className="rounded-3xl border border-slate-100 bg-slate-50 p-5 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2.5">
                  <SubjectArtwork examKey={examArtworkKey(state.createdIdRef.current || state.createdId, exam.id)} subject={state.examData?.subjects||state.examData?.category} title={examTitle} coverImage={exam.coverImage||state.examData?.coverImage} variant="thumbnail"/>
                  <div className="flex flex-wrap items-center justify-end gap-1.5 flex-1 min-w-0">
                    <Link
                      href={previewHref}
                      target="_blank"
                      className="w-8 h-8 rounded-xl bg-white text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center shadow-xs border border-slate-100 shrink-0"
                      title={language === "ar" ? "معاينة الاختبار" : "Preview Exam"}
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => exportExamData(exam)}
                      className="w-8 h-8 rounded-xl bg-white text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-all flex items-center justify-center shadow-xs border border-slate-100 shrink-0"
                      title={language === "ar" ? "تصدير البيانات" : "Export Data"}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => exportExamJson(exam.id)}
                      className="w-8 h-8 rounded-xl bg-white text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center shadow-xs border border-slate-100 shrink-0"
                      title={language === "ar" ? "تصدير JSON" : "Export JSON"}
                    >
                      <FileCode className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openMoveModal(exam)}
                      className="w-8 h-8 rounded-xl bg-white text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center shadow-xs border border-slate-100 shrink-0"
                      title={language === "ar" ? "نقل الاختبار بأسئلته إلى موديول آخر" : "Move exam to another module"}
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (editHref) {
                          router.push(editHref);
                        }
                      }}
                      className="w-8 h-8 rounded-xl bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center shadow-xs border border-slate-100 shrink-0"
                      title={language === "ar" ? "تعديل الاختبار" : "Edit Exam"}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteExam(exam.id)}
                      className="w-8 h-8 rounded-xl bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center shadow-xs border border-slate-100 shrink-0"
                      title={language === "ar" ? "حذف الاختبار" : "Delete Exam"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="mt-4 text-xl font-black text-slate-900 truncate" title={examTitle}>{examTitle}</h3>

                <div className="mt-2.5 flex items-center gap-2 text-xs font-black text-slate-400">
                  <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{questionCount} {language === "ar" ? "سؤال" : "questions"}</span>
                </div>
              </div>

              {(directQuestions.length > 0 || standaloneQuestions.length > 0) && (
                <button
                  type="button"
                  onClick={() => collectQuestions(exam.id)}
                  disabled={collectingSubExamId !== null}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                >
                  <HelpCircle className="h-4 w-4" />
                  {collectingSubExamId === exam.id
                    ? (language === "ar" ? "جارٍ إضافة الأسئلة..." : "Adding questions...")
                    : (language === "ar" ? "إضافة كل أسئلة الموديول" : "Add all module questions")}
                </button>
              )}

              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-black text-slate-500">
                <div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  {getCreatedAtLabel(exam.createdAt, language)}
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {getUpdatedAtLabel(exam.updatedAt, language)}
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  {exam.publishDate
                    ? `${language === "ar" ? "نشر" : "Publish"}: ${new Date(exam.publishDate).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { timeZone: 'Africa/Cairo' })}`
                    : (language === "ar" ? "بدون تاريخ نشر" : "No publish date")}
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-500" />
                  {exam.cutOffDate
                    ? `${language === "ar" ? "إغلاق" : "Cut-off"}: ${new Date(exam.cutOffDate).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { timeZone: 'Africa/Cairo' })}`
                    : (language === "ar" ? "بدون تاريخ إغلاق" : "No cut-off date")}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {exams.length === 0 && <div className="rounded-3xl border-2 border-dashed border-slate-200 py-16 text-center text-slate-400 font-black">{language === "ar" ? "لا توجد اختبارات بعد. أنشئ أول اختبار من هنا." : "No exams yet. Create the first exam here."}</div>}
    </div>

    {directQuestions.length > 0 && <div className="rounded-[36px] bg-white border border-slate-100 shadow-sm p-7">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900">{language === "ar" ? "أسئلة الموديول" : "Module Questions"}</h2>
        <p className="mt-1 text-slate-400 font-bold">{directQuestions.length} {language === "ar" ? "سؤال محفوظ مباشرة داخل الموديول" : "questions saved directly in this module"}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {directQuestions.map((question: any, index: number) => (
          <div key={question.id || index} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-black text-indigo-600">
              <HelpCircle className="h-4 w-4" />
              {language === "ar" ? `سؤال ${index + 1}` : `Question ${index + 1}`}
            </div>
            <HtmlRenderer html={question.text || ""} className="font-bold text-slate-800" />
          </div>
        ))}
      </div>
    </div>}

    {standaloneQuestions.length > 0 && <div className="rounded-[36px] border border-amber-200 bg-amber-50/50 shadow-sm p-7">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900">{language === "ar" ? "أسئلة منفردة غير مسندة" : "Unassigned Standalone Questions"}</h2>
        <p className="mt-1 text-amber-700 font-bold">
          {language === "ar"
            ? `${standaloneQuestions.length} سؤال منفرد جاهز للإضافة إلى اختبار.`
            : `${standaloneQuestions.length} standalone questions are ready to add to an exam.`}
        </p>
      </div>
      {collectionTargets.length > 0 ? (
        <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-amber-200 bg-white p-4 md:flex-row md:items-center">
          <select
            value={selectedTargetExamId}
            onChange={(event) => setSelectedTargetExamId(event.target.value)}
            className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:border-amber-500"
          >
            <option value="">{language === "ar" ? "اختر الاختبار المستهدف" : "Choose the target exam"}</option>
            {collectionTargets.map((exam) => <option key={exam.id} value={exam.id}>{exam.title}</option>)}
          </select>
          <button
            type="button"
            onClick={() => collectQuestions(selectedTargetExamId)}
            disabled={!selectedTargetExamId || collectingSubExamId !== null}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 font-black text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <HelpCircle className="h-5 w-5" />
            {collectingSubExamId
              ? (language === "ar" ? "جارٍ تجميع الأسئلة..." : "Collecting questions...")
              : (language === "ar" ? "تجميع الأسئلة في الاختبار" : "Collect questions into exam")}
          </button>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-dashed border-amber-300 bg-white p-4 font-bold text-amber-800">
          {language === "ar" ? "أنشئ اختبارًا داخل هذا الموديول أولًا، ثم اختره لتجميع الأسئلة." : "Create an exam inside this module first, then choose it to collect the questions."}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {standaloneQuestions.map((question: any, index: number) => (
          <div key={question.id || index} className="rounded-3xl border border-amber-100 bg-white p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-black text-amber-700">
              <HelpCircle className="h-4 w-4" />
              {language === "ar" ? `سؤال منفرد ${index + 1}` : `Standalone Question ${index + 1}`}
            </div>
            <HtmlRenderer html={question.text || ""} className="font-bold text-slate-800" />
          </div>
        ))}
      </div>
    </div>}

    {movingSubExam && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-[32px] max-w-lg w-full p-7 shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ArrowRightLeft className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {language === "ar" ? "نقل الاختبار إلى موديول آخر" : "Move Exam to Another Module"}
                </h3>
                <p className="text-xs font-bold text-slate-400">
                  {language === "ar" ? "سيتم نقل الاختبار بجميع أسئلته المحفوظة" : "The exam and all its questions will be moved"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setMovingSubExam(null)}
              className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1">
            <div className="text-xs font-bold text-purple-700">
              {language === "ar" ? "الاختبار المحدد:" : "Selected Exam:"}
            </div>
            <div className="text-sm font-black text-purple-900 flex items-center justify-between">
              <span>{movingSubExam.title}</span>
              <span className="text-xs font-bold bg-white px-2.5 py-1 rounded-lg text-purple-700 shadow-xs">
                {movingSubExam.questions?.length || movingSubExam.questionsCount || movingSubExam._count?.questions || 0} {language === "ar" ? "سؤال" : "questions"}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
              {language === "ar" ? "اختر وجهة النقل:" : "Select Destination:"}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMoveMode("existing")}
                disabled={destinationModules.length === 0}
                className={`p-3.5 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1.5 ${
                  moveMode === "existing"
                    ? "border-purple-600 bg-purple-50/50 text-purple-700 shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                <FolderInput className="w-5 h-5" />
                <span>{language === "ar" ? "موديول موجود" : "Existing Module"}</span>
                {isLoadingDestinations ? (
                  <span className="text-[10px] text-purple-500 animate-pulse">
                    {language === "ar" ? "جارٍ التحميل..." : "Loading..."}
                  </span>
                ) : destinationModules.length === 0 ? (
                  <span className="text-[10px] text-slate-400">
                    ({language === "ar" ? "لا يوجد غيره" : "None available"})
                  </span>
                ) : (
                  <span className="text-[10px] text-purple-600 font-bold">
                    ({destinationModules.length} {language === "ar" ? "متاح" : "available"})
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMoveMode("new")}
                className={`p-3.5 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1.5 ${
                  moveMode === "new"
                    ? "border-purple-600 bg-purple-50/50 text-purple-700 shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Plus className="w-5 h-5" />
                <span>{language === "ar" ? "إنشاء موديول جديد" : "Create New Module"}</span>
              </button>
            </div>

            {moveMode === "existing" ? (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">
                    {language === "ar" ? "حدد الموديول المستهدف:" : "Target Module:"}
                  </label>
                  {isLoadingDestinations && (
                    <span className="text-xs text-purple-600 animate-pulse">
                      {language === "ar" ? "جارٍ التحديث..." : "Updating..."}
                    </span>
                  )}
                </div>
                <select
                  value={targetMoveModuleId}
                  onChange={(e) => setTargetMoveModuleId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-purple-600 transition-all"
                >
                  <option value="">
                    {language === "ar" ? "-- اختر الموديول المستهدف --" : "-- Select Target Module --"}
                  </option>
                  {destinationModules.filter((m) => m.isCurrentExam).length > 0 && (
                    <optgroup
                      label={
                        language === "ar"
                          ? `هذا الاختبار (${state.examData?.title || "الحالي"})`
                          : `Current Exam (${state.examData?.title || "Current"})`
                      }
                    >
                      {destinationModules
                        .filter((m) => m.isCurrentExam)
                        .map((mod) => (
                          <option key={mod.id} value={mod.id}>
                            {mod.title}
                          </option>
                        ))}
                    </optgroup>
                  )}
                  {Array.from(new Set(destinationModules.filter((m) => !m.isCurrentExam).map((m) => m.examId))).map(
                    (examId) => {
                      const examItems = destinationModules.filter((m) => m.examId === examId);
                      const examTitle = examItems[0]?.examTitle || examId;
                      return (
                        <optgroup key={examId} label={examTitle}>
                          {examItems.map((mod) => (
                            <option key={mod.id} value={mod.id}>
                              {mod.title}
                            </option>
                          ))}
                        </optgroup>
                      );
                    }
                  )}
                </select>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {allExamsList.length > 1 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      {language === "ar" ? "الاختبار التابع له الموديول الجديد:" : "Target Exam:"}
                    </label>
                    <select
                      value={targetExamIdForNew}
                      onChange={(e) => setTargetExamIdForNew(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-purple-600 transition-all"
                    >
                      <option value={state.createdIdRef?.current || state.createdId}>
                        {language === "ar"
                          ? `هذا الاختبار (${state.examData?.title || "الحالي"})`
                          : `Current Exam (${state.examData?.title || "Current"})`}
                      </option>
                      {allExamsList
                        .filter((e: any) => normalizeId(e.id) !== normalizeId(state.createdIdRef?.current || state.createdId))
                        .map((e: any) => (
                          <option key={e.id} value={e.id}>
                            {e.title || (language === "ar" ? "اختبار بدون عنوان" : "Untitled Exam")}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    {language === "ar" ? "اسم الموديول الجديد:" : "New Module Name:"}
                  </label>
                  <input
                    type="text"
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    placeholder={language === "ar" ? "مثال: موديول 3 - المراجعة النهائية" : "e.g., Module 3 - Final Review"}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-purple-600 transition-all"
                    autoFocus
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setMovingSubExam(null)}
              disabled={isMovingSubExam}
              className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {language === "ar" ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleConfirmMove}
              disabled={isMovingSubExam}
              className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isMovingSubExam ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{language === "ar" ? "جارٍ النقل..." : "Moving..."}</span>
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>{language === "ar" ? "تأكيد النقل" : "Confirm Move"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}
    {isMoveAllModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {language === "ar" ? "نقل جميع الاختبارات الفرعية" : "Move All Sub-Exams"}
                </h3>
                <p className="text-xs font-bold text-slate-400">
                  {language === "ar" ? "سيتم نقل كافة الاختبارات بأسئلتها بالكامل إلى الموديول المختار" : "All exams and their questions will be moved completely"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsMoveAllModalOpen(false)}
              className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2">
            <div className="text-xs font-bold text-purple-700">
              {language === "ar" ? "الموديول المصدر الحالي:" : "Current Source Module:"}
            </div>
            <div className="text-sm font-black text-purple-900 flex items-center justify-between">
              <span>{examModule.title}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-white px-2.5 py-1 rounded-lg text-purple-700 shadow-xs">
                  {exams.length} {language === "ar" ? "اختبار" : "exams"}
                </span>
                <span className="text-xs font-bold bg-white px-2.5 py-1 rounded-lg text-purple-700 shadow-xs">
                  {questions} {language === "ar" ? "سؤال" : "questions"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
              {language === "ar" ? "اختر وجهة النقل:" : "Select Destination:"}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMoveMode("existing")}
                disabled={destinationModules.length === 0}
                className={`p-3.5 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1.5 ${
                  moveMode === "existing"
                    ? "border-purple-600 bg-purple-50/50 text-purple-700 shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                <FolderInput className="w-5 h-5" />
                <span>{language === "ar" ? "موديول موجود" : "Existing Module"}</span>
                {isLoadingDestinations ? (
                  <span className="text-[10px] text-purple-500 animate-pulse">
                    {language === "ar" ? "جارٍ التحميل..." : "Loading..."}
                  </span>
                ) : destinationModules.length === 0 ? (
                  <span className="text-[10px] text-slate-400">
                    ({language === "ar" ? "لا يوجد غيره" : "None available"})
                  </span>
                ) : (
                  <span className="text-[10px] text-purple-600 font-bold">
                    ({destinationModules.length} {language === "ar" ? "متاح" : "available"})
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMoveMode("new")}
                className={`p-3.5 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1.5 ${
                  moveMode === "new"
                    ? "border-purple-600 bg-purple-50/50 text-purple-700 shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Plus className="w-5 h-5" />
                <span>{language === "ar" ? "إنشاء موديول جديد" : "Create New Module"}</span>
              </button>
            </div>

            {moveMode === "existing" ? (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">
                    {language === "ar" ? "حدد الموديول المستهدف لاستقبال جميع الاختبارات:" : "Target Module for all exams:"}
                  </label>
                  {isLoadingDestinations && (
                    <span className="text-xs text-purple-600 animate-pulse">
                      {language === "ar" ? "جارٍ التحديث..." : "Updating..."}
                    </span>
                  )}
                </div>
                <select
                  value={targetMoveModuleId}
                  onChange={(e) => setTargetMoveModuleId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-purple-600 transition-all"
                >
                  <option value="">
                    {language === "ar" ? "-- اختر الموديول المستهدف --" : "-- Select Target Module --"}
                  </option>
                  {destinationModules.filter((m) => m.isCurrentExam).length > 0 && (
                    <optgroup
                      label={
                        language === "ar"
                          ? `هذا الاختبار (${state.examData?.title || "الحالي"})`
                          : `Current Exam (${state.examData?.title || "Current"})`
                      }
                    >
                      {destinationModules
                        .filter((m) => m.isCurrentExam)
                        .map((mod) => (
                          <option key={mod.id} value={mod.id}>
                            {mod.title}
                          </option>
                        ))}
                    </optgroup>
                  )}
                  {Array.from(new Set(destinationModules.filter((m) => !m.isCurrentExam).map((m) => m.examId))).map(
                    (examId) => {
                      const examItems = destinationModules.filter((m) => m.examId === examId);
                      const examTitle = examItems[0]?.examTitle || examId;
                      return (
                        <optgroup key={examId} label={examTitle}>
                          {examItems.map((mod) => (
                            <option key={mod.id} value={mod.id}>
                              {mod.title}
                            </option>
                          ))}
                        </optgroup>
                      );
                    }
                  )}
                </select>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {allExamsList.length > 1 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      {language === "ar" ? "الاختبار التابع له الموديول الجديد:" : "Target Exam:"}
                    </label>
                    <select
                      value={targetExamIdForNew}
                      onChange={(e) => setTargetExamIdForNew(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-purple-600 transition-all"
                    >
                      <option value={state.createdIdRef?.current || state.createdId}>
                        {language === "ar"
                          ? `هذا الاختبار (${state.examData?.title || "الحالي"})`
                          : `Current Exam (${state.examData?.title || "Current"})`}
                      </option>
                      {allExamsList
                        .filter((e: any) => normalizeId(e.id) !== normalizeId(state.createdIdRef?.current || state.createdId))
                        .map((e: any) => (
                          <option key={e.id} value={e.id}>
                            {e.title || (language === "ar" ? "اختبار بدون عنوان" : "Untitled Exam")}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    {language === "ar" ? "اسم الموديول الجديد:" : "New Module Name:"}
                  </label>
                  <input
                    type="text"
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    placeholder={language === "ar" ? "مثال: موديول 3 - المراجعة النهائية" : "e.g., Module 3 - Final Review"}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-purple-600 transition-all"
                    autoFocus
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsMoveAllModalOpen(false)}
              disabled={isMovingAllSubExams}
              className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {language === "ar" ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleConfirmMoveAll}
              disabled={isMovingAllSubExams}
              className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isMovingAllSubExams ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{language === "ar" ? "جارٍ النقل الجماعي..." : "Moving all..."}</span>
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>{language === "ar" ? `تأكيد نقل جميع الاختبارات (${exams.length})` : `Confirm Move All (${exams.length})`}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

      {isMoveCurrentModuleModalOpen && examModule && (
        <MoveModuleModal
          isOpen={isMoveCurrentModuleModalOpen}
          onClose={() => setIsMoveCurrentModuleModalOpen(false)}
          onSuccess={async () => {
            setIsMoveCurrentModuleModalOpen(false);
            if (typeof state.refreshModules === "function") {
              await state.refreshModules();
            } else {
              window.location.reload();
            }
          }}
          moduleToMove={examModule}
          parentExam={{ id: state.createdIdRef.current || state.createdId, title: state.examData?.title || "" }}
          allExams={allExamsList.length > 0 ? allExamsList : [{ id: state.createdIdRef.current || state.createdId, title: state.examData?.title || "" }]}
          language={language}
          role={role}
        />
      )}

      {subModuleToMove && (
        <MoveModuleModal
          isOpen={Boolean(subModuleToMove)}
          onClose={() => setSubModuleToMove(null)}
          onSuccess={async () => {
            setSubModuleToMove(null);
            if (typeof state.refreshModules === "function") {
              await state.refreshModules();
            } else {
              window.location.reload();
            }
          }}
          moduleToMove={subModuleToMove}
          parentExam={{ id: state.createdIdRef.current || state.createdId, title: state.examData?.title || "" }}
          allExams={allExamsList.length > 0 ? allExamsList : [{ id: state.createdIdRef.current || state.createdId, title: state.examData?.title || "" }]}
          language={language}
          role={role}
        />
      )}

      {/* Dedicated In-Place Modal for Active Module Settings */}
      {isModuleSettingsOpen && examModule && (
        <div
          dir={language === "ar" ? "rtl" : "ltr"}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 sm:p-6 md:p-8 animate-in fade-in duration-300"
        >
          <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[92vh]">
            {/* Header */}
            <div className="bg-slate-900 p-6 sm:p-8 flex justify-between items-center gap-4 text-white shrink-0">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Settings className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl sm:text-2xl font-black text-white truncate">
                    {language === "ar" ? `إعدادات الموديول: ${examModule.title}` : `Module Settings: ${examModule.title}`}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm font-bold mt-1">
                    {language === "ar"
                      ? "تعديل جميع بيانات وإعدادات هذا الموديول والتقييم"
                      : "Edit all info and settings for this module and assessment"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModuleSettingsOpen(false)}
                className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSaveModuleSettings} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              {/* Cover Image Upload */}
              <div className="space-y-3">
                <FileUpload
                  label={language === "ar" ? "صورة غلاف التقييم" : "Assessment Cover Image"}
                  accept="image/*"
                  value={moduleSettingsCoverImage}
                  onUploadSuccess={(url) => setModuleSettingsCoverImage(url)}
                  tokenKey={tokenKey}
                />
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                  {language === "ar" ? "عنوان التقييم / اسم الموديول *" : "Assessment / Module Title *"}
                </label>
                <input
                  type="text"
                  required
                  value={moduleSettingsTitle}
                  onChange={(e) => setModuleSettingsTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-slate-900 font-bold outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-sm text-sm sm:text-base"
                  placeholder={language === "ar" ? "مثال: تقييم الرياضيات المتقدمة" : "e.g. Advanced Mathematics Assessment"}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                  {language === "ar" ? "وصف الموديول" : "Module Description"}
                </label>
                <textarea
                  rows={3}
                  value={moduleSettingsDescription}
                  onChange={(e) => setModuleSettingsDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-sm resize-none text-sm"
                  placeholder={language === "ar" ? "اكتب نبذة أو وصفاً للموديول..." : "Write a brief description..."}
                />
              </div>

              {/* Stages & Grades */}
              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                  {language === "ar" ? "المراحل الدراسية والصفوف المستهدفة" : "Educational Stages & Grades"}
                </label>
                <div className="space-y-4 max-h-[360px] overflow-y-auto custom-scrollbar pr-1 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  {SETTINGS_STAGES.map((group) => {
                    const allSelected = group.grades.every((g) => moduleSettingsGrades.includes(g));

                    return (
                      <div key={group.stage} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <h4 className="font-black text-sm text-slate-800 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-indigo-600" />
                            {language === "ar" ? group.titleAr : group.titleEn}
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              if (allSelected) {
                                setModuleSettingsGrades(moduleSettingsGrades.filter((g) => !group.grades.includes(g)));
                              } else {
                                const newGrades = [...moduleSettingsGrades];
                                group.grades.forEach((g) => {
                                  if (!newGrades.includes(g)) newGrades.push(g);
                                });
                                setModuleSettingsGrades(newGrades);
                              }
                            }}
                            className="text-xs font-black text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                          >
                            {allSelected
                              ? (language === "ar" ? "إلغاء تحديد الكل" : "Deselect All")
                              : (language === "ar" ? "تحديد الكل" : "Select All")}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {group.grades.map((g) => {
                            const isSelected = moduleSettingsGrades.includes(g);
                            return (
                              <label
                                key={g}
                                className={`flex min-w-0 items-center gap-2.5 p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                                  isSelected
                                    ? "bg-indigo-50/50 border-indigo-400 text-indigo-900"
                                    : "bg-white border-slate-100 hover:border-slate-200 text-slate-600"
                                }`}
                              >
                                <div
                                  className={`w-5 h-5 rounded flex items-center justify-center transition-all shrink-0 ${
                                    isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 border border-slate-200"
                                  }`}
                                >
                                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </div>
                                <span className="min-w-0 truncate text-[11px] sm:text-xs font-bold">
                                  {getGradeName(g, language)}
                                </span>
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={isSelected}
                                  onChange={() => toggleSettingsGrade(g)}
                                />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Subject / Specialization */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                  {language === "ar" ? "المادة / التخصص" : "Subject / Specialization"} <span className="text-red-500">*</span>
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-[200px] overflow-y-auto custom-scrollbar flex flex-wrap gap-2">
                  {SETTINGS_CATEGORIES.map((cat) => {
                    const isSelected = moduleSettingsSubjects.includes(cat);
                    return (
                      <label
                        key={cat}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isSelected}
                          onChange={() => toggleSettingsSubject(cat)}
                        />
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center transition-all shrink-0 ${
                            isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 border border-slate-200"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3" />}
                        </div>
                        <span className="text-xs font-black">{getSubjectName(cat, language)}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 font-bold">
                  {language === "ar"
                    ? "يمكن اختيار أكثر من مجال وسيتم حفظها داخل نفس الموديول والتقييم."
                    : "Multiple domains can be selected and will be saved within the same module."}
                </p>
              </div>

              {/* Assessment Type */}
              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                  {language === "ar" ? "نوع التقييم" : "Assessment Type"}
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="moduleSettingsAssessmentType"
                      checked={moduleSettingsIsCentral}
                      onChange={() => {
                        setModuleSettingsIsCentral(true);
                        setModuleSettingsSchoolIds([]);
                      }}
                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-bold text-slate-700">
                      {language === "ar" ? "مركزي (لجميع المدارس)" : "Centralized (All Schools)"}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="moduleSettingsAssessmentType"
                      checked={!moduleSettingsIsCentral}
                      onChange={() => setModuleSettingsIsCentral(false)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-bold text-slate-700">
                      {language === "ar" ? "مخصص لمدارس محددة" : "Specific Schools"}
                    </span>
                  </label>
                </div>

                {!moduleSettingsIsCentral && (
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                      {language === "ar" ? "إسناد التقييم للمدرسة" : "Assign Assessment to School"}
                    </label>
                    {(!state.schools || state.schools.length === 0) ? (
                      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-500 font-bold text-sm">
                        {language === "ar" ? "لا توجد مدارس متاحة" : "No schools available"}
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center px-2 mb-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {language === "ar" ? "اختر المدارس (اختياري)" : "Select Schools (Optional)"}
                          </span>
                          <button
                            type="button"
                            onClick={selectAllSettingsSchools}
                            className="text-[10px] font-black text-indigo-600 hover:underline cursor-pointer"
                          >
                            {(moduleSettingsSchoolIds || []).length === (state.schools || []).length
                              ? (language === "ar" ? "إلغاء الكل" : "Deselect All")
                              : (language === "ar" ? "تحديد الكل" : "Select All")}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-[250px] overflow-y-auto custom-scrollbar">
                          {(state.schools || []).map((s: any) => {
                            const isSelected = (moduleSettingsSchoolIds || []).includes(s.id);
                            return (
                              <label
                                key={s.id}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                  isSelected
                                    ? "bg-indigo-50 border-indigo-500"
                                    : "bg-white border-transparent hover:border-slate-200"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={isSelected}
                                  onChange={() => toggleSettingsSchool(s.id)}
                                />
                                <div
                                  className={`w-5 h-5 rounded flex items-center justify-center transition-all shrink-0 ${
                                    isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 border border-slate-200"
                                  }`}
                                >
                                  {isSelected && <CheckCircle2 className="w-3 h-3" />}
                                </div>
                                <span className="text-xs font-bold text-slate-700">{s.name}</span>
                              </label>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold">
                          {language === "ar"
                            ? "المحتوى متاح لطلاب المدارس المحددة فقط. إلغاء كل المدارس في الوضع المخصص يخفيه عن الطلاب؛ لإتاحته للجميع اختر التقييم المركزي."
                            : "Only students of the selected schools can access this content. No selected schools in this mode means no student access; choose Centralized to share with all schools."}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Duration, Passing Score, Attempts, Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    {language === "ar" ? "المدة (دقائق)" : "Duration (Mins)"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={moduleSettingsDuration}
                    onChange={(e) => setModuleSettingsDuration(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all shadow-xs"
                    placeholder={language === "ar" ? "مثال: 60" : "e.g. 60"}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-600" />
                    {language === "ar" ? "درجة النجاح (%)" : "Passing Score (%)"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={moduleSettingsPassingScore}
                    onChange={(e) => setModuleSettingsPassingScore(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all shadow-xs"
                    placeholder={language === "ar" ? "مثال: 50" : "e.g. 50"}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                    {language === "ar" ? "المحاولات" : "Attempts"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={moduleSettingsAttempts}
                    onChange={(e) => setModuleSettingsAttempts(e.target.value)}
                    placeholder={language === "ar" ? "مفتوح (بدون حد)" : "Unlimited"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all shadow-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                    {language === "ar" ? "كلمة المرور" : "Password"}
                  </label>
                  <input
                    type="text"
                    value={moduleSettingsPassword}
                    onChange={(e) => setModuleSettingsPassword(e.target.value)}
                    placeholder={language === "ar" ? "اختياري" : "Optional"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    {language === "ar" ? "تاريخ البدء" : "Start Date"}
                  </label>
                  <input
                    type="datetime-local"
                    value={moduleSettingsStartDate}
                    onChange={(e) => setModuleSettingsStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-emerald-500 transition-all shadow-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-red-500" />
                    {language === "ar" ? "تاريخ الانتهاء" : "End Date"}
                  </label>
                  <input
                    type="datetime-local"
                    value={moduleSettingsEndDate}
                    onChange={(e) => setModuleSettingsEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-red-500 transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Result Policy */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                  {language === "ar" ? "سياسة النتيجة" : "Result Policy"}
                </label>
                <select
                  value={moduleSettingsResultVisibility}
                  onChange={(e) => setModuleSettingsResultVisibility(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all shadow-xs"
                >
                  <option value="SHOW_SCORE">{language === "ar" ? "إظهار النتيجة فقط" : "Show Score Only"}</option>
                  <option value="SHOW_SCORE_ANSWERS">{language === "ar" ? "إظهار النتيجة والإجابات" : "Show Score & Answers"}</option>
                  <option value="HIDDEN">{language === "ar" ? "إخفاء النتيجة" : "Hidden"}</option>
                </select>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white z-10">
                <button
                  type="button"
                  onClick={() => setIsModuleSettingsOpen(false)}
                  disabled={isSavingModuleSettings}
                  className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {language === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSavingModuleSettings}
                  className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {isSavingModuleSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{language === "ar" ? "جارٍ الحفظ..." : "Saving..."}</span>
                    </>
                  ) : (
                    <span>{language === "ar" ? "حفظ التغييرات" : "Save Changes"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
