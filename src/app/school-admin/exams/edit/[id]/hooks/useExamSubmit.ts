// @ts-nocheck
import { API_URL } from '@/lib/api';
import { buildDraftModules, buildExamSubmissionPayload } from '@/lib/examEditingPayload';
import { buildExamSavePayload, isChildExamSave } from '@/lib/examSaveScope';

export const useExamSubmit = (props: any) => {
  const { examData, modules, isModuleModalOpen, currentModule, editingModuleIndex, manualSubmitRef, autoSaveGenerationRef, autoSaveTimerRef, setIsLoading, autoSaveWriteQueueRef, createdIdRef, standaloneQuestions, deletedQuestionIds, setDeletedQuestionIds, showToast, language, router, t, isLoading, isLoadingQuestions, moduleId, subExamId } = props;

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoadingQuestions) {
      showToast(language === 'ar' ? 'يرجى الانتظار لحظات حتى يكتمل تحميل الأسئلة أولاً' : 'Please wait for questions to finish loading first', 'warning');
      return;
    }
    if (!examData.title) {
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
      });

      let targetSchoolIds = (examData.schoolIds || []).filter(Boolean);
      if (targetSchoolIds.length === 0 && typeof window !== 'undefined') {
        try {
          const user = JSON.parse(localStorage.getItem("school_admin_user") || "{}");
          const sId = String(user?.schoolId || "").trim();
          if (sId) targetSchoolIds = [sId];
        } catch {}
      }
      const isCentral = false;

      const { modulesPayload, allQuestions } = buildExamSubmissionPayload({
        modules: finalModules,
        standaloneQuestions,
      });
      const submittedDeletedQuestionIds = [...(deletedQuestionIds || [])];
      const childExamSave = isChildExamSave({ moduleId, subExamId });

      if (childExamSave) {
        const activeSubExam = (currentModule?.subExams || []).find((subExam: any) => String(subExam?.id || '') === String(subExamId));
        if (!activeSubExam) throw new Error(language === 'ar' ? 'الاختبار غير موجود' : 'Exam not found');

        const childRes = await fetch(`${API_URL}/exams/${createdIdRef.current}/modules/${moduleId}/exams/${subExamId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: activeSubExam.title,
            password: activeSubExam.password || null,
            duration: activeSubExam.duration || null,
            passingScore: activeSubExam.passingScore || null,
            attemptsAllowed: activeSubExam.attemptsAllowed,
            publishDate: activeSubExam.publishDate || null,
            cutOffDate: activeSubExam.cutOffDate || null,
          }),
        });
        if (!childRes.ok) {
          const data = await childRes.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to update child exam');
        }
      }

      const activeExamId = createdIdRef.current;
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
        body: JSON.stringify(buildExamSavePayload({
          title: examData.title,
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
        }, { moduleId, subExamId }))
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.stack || data.details || data.error || "Failed to create exam");
      }

      if (submittedDeletedQuestionIds.length > 0) {
        setDeletedQuestionIds?.((prev: string[]) => prev.filter((id) => !submittedDeletedQuestionIds.includes(id)));
      }
      showToast(language === 'ar' ? "تم حفظ الاختبار بنجاح" : "Exam saved successfully!", "success");
      if (!childExamSave) router.push(`/school-admin/exams`);
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
