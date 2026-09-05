// @ts-nocheck
import { API_URL } from '@/lib/api';
import { buildCreatedModulePortalHref } from '@/lib/moduleCreationWorkflow';
import { buildDraftModules } from '@/lib/examEditingPayload';

export const useExamSubmit = (props: any) => {
  const { examData, modules, isModuleModalOpen, currentModule, editingModuleIndex, manualSubmitRef, autoSaveGenerationRef, autoSaveTimerRef, setIsLoading, autoSaveWriteQueueRef, createdIdRef, standaloneQuestions, deletedQuestionIds, setDeletedQuestionIds, showToast, language, router, t, isLoading, moduleMode } = props;

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleMode && !examData.title) {
      showToast(t('courseCreate.titleRequired') || "Please enter a course title", "error");
      return;
    }
    manualSubmitRef.current = true;
    autoSaveGenerationRef.current += 1;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    setIsLoading(true);
    const token = localStorage.getItem("school_admin_token");
    
    try {
      await autoSaveWriteQueueRef.current;

      const finalModules = buildDraftModules({
        modules,
        currentModule,
        editingModuleIndex,
        isModuleModalOpen,
        moduleMode,
      });

      const targetSchoolIds = (examData.schoolIds || []).filter(Boolean);
      const isCentral = false;

      const allQuestions: any[] = [];
      const modulesPayload = finalModules.map((m, index) => {
         const mId = m.id || String(Date.now() + index);
         
         const mSubExams = (m.subExams || []).map((s: any, sIdx: number) => {
             const sId = s.id || String(Date.now() + index * 1000 + sIdx);
             const sQuestions = (s.questions || []).map((q: any) => ({
                 ...q,
                 moduleId: mId,
                 subExamId: sId
             }));
             allQuestions.push(...sQuestions);
             return {
                 id: sId,
                 title: s.title,
                 duration: s.duration || null,
                 passingScore: s.passingScore || null,
                 attemptsAllowed: s.attemptsAllowed === "" || s.attemptsAllowed === undefined || s.attemptsAllowed === null ? 999 : Number(s.attemptsAllowed),
                 publishDate: s.publishDate || null,
                 cutOffDate: s.cutOffDate || null,
                 order: sIdx
             };
         });
         
         const mQuestions = (m.questions || []).map((q: any) => ({
             ...q,
             moduleId: mId
         }));
         allQuestions.push(...mQuestions);

         return {
            id: mId,
            title: m.title,
            description: m.content || null,
            duration: m.duration || null,
            passingScore: m.passingScore || null,
            publishDate: m.publishDate || null,
            cutOffDate: m.cutOffDate || null,
            order: index,
            subExams: mSubExams
         };
      });

      if (moduleMode && modulesPayload.length === 0) {
        showToast(language === 'ar' ? 'أضف الموديول أولًا ثم احفظ' : 'Add the module first, then save', 'error');
        setIsLoading(false);
        manualSubmitRef.current = false;
        return;
      }

      const resolvedTitle = examData.title || finalModules[0]?.title || "";
      if (!resolvedTitle) {
        showToast(language === 'ar' ? 'أدخل عنوان الموديول أولًا' : 'Enter the module title first', 'error');
        setIsLoading(false);
        manualSubmitRef.current = false;
        return;
      }

      const activeExamId = createdIdRef.current;
      const submittedDeletedQuestionIds = [...(deletedQuestionIds || [])];
      const method = activeExamId ? "PUT" : "POST";
      const url = activeExamId 
        ? `${API_URL}/exams/${activeExamId}`
        : `${API_URL}/exams`;

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: resolvedTitle,
          description: examData.description,
          coverImage: examData.coverImage || null,
          grades: examData.grades,
          subjects: examData.subjects || [],
          country: examData.country,
          isCentral,
          schoolId: targetSchoolIds.length > 0 ? targetSchoolIds[0] : null,
          schoolIds: targetSchoolIds,
          duration: examData.duration || 60,
          passingScore: examData.passingScore || 50,
          password: examData.password || null,
          resultVisibility: examData.resultVisibility || "SHOW_SCORE",
          attemptsAllowed: examData.attemptsAllowed === "" || examData.attemptsAllowed === undefined || examData.attemptsAllowed === null ? 999 : Number(examData.attemptsAllowed),
          startDate: examData.startDate || null,
          endDate: examData.endDate || null,
          status: "PUBLISHED",

          section: examData.section,
          domain: examData.domain,
          learningOutcomes: examData.learningOutcomes,
          indicators: examData.indicators,
          skills: examData.skills,
          gradeTarget: examData.gradeTarget,

          modules: modulesPayload,
          questions: allQuestions,
          deletedQuestionIds: submittedDeletedQuestionIds
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.stack || data.details || data.error || "Failed to create exam");
      }

      const data = await res.json().catch(() => ({}));
      const createdExam = data?.exam || null;
      const createdExamId = String(createdExam?.id || activeExamId || "").trim();

      if (createdExamId) {
        createdIdRef.current = createdExamId;
      }
      if (submittedDeletedQuestionIds.length > 0) {
        setDeletedQuestionIds?.((prev: string[]) => prev.filter((id) => !submittedDeletedQuestionIds.includes(id)));
      }

      showToast(moduleMode ? (language === 'ar' ? 'تم إنشاء الموديول بنجاح' : 'Module created successfully!') : "Exam created successfully!", "success");

      if (moduleMode) {
        const redirectHref = buildCreatedModulePortalHref(
          "SCHOOL_ADMIN",
          createdExamId,
          finalModules,
          createdExam,
        );

        if (redirectHref) {
          router.push(redirectHref);
          return;
        }
      }

      router.push(`/school-admin/exams`);
    } catch (error: any) {
      console.error("Exam creation error:", error);
      showToast(error.message || "Connection error", 'error');
    } finally {
      manualSubmitRef.current = false;
      setIsLoading(false);
    }
  };

  return { handleSubmit };
};
