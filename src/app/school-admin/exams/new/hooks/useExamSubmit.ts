// @ts-nocheck
import { API_URL } from '@/lib/api';

export const useExamSubmit = (props: any) => {
  const { examData, modules, isModuleModalOpen, currentModule, editingModuleIndex, manualSubmitRef, autoSaveGenerationRef, autoSaveTimerRef, setIsLoading, autoSaveWriteQueueRef, createdIdRef, standaloneQuestions, showToast, language, router, t, isLoading } = props;

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examData.title) {
      showToast(t('courseCreate.titleRequired') || "Please enter a course title", "error");
      return;
    }
    if (!examData.subjects || examData.subjects.length === 0) {
      showToast(t('courseCreate.subjectRequired') || "Please select at least one subject / specialization", "error");
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

      const finalModules = [...modules];
      if (isModuleModalOpen && currentModule.title) {
        if (editingModuleIndex !== null) {
          finalModules[editingModuleIndex] = currentModule;
        } else {
          finalModules.push(currentModule);
        }
      }

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
                 attemptsAllowed: s.attemptsAllowed || 1,
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
            order: index,
            subExams: mSubExams
         };
      });

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
        body: JSON.stringify({
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
          attemptsAllowed: examData.attemptsAllowed || 1,
          startDate: examData.startDate || null,
          endDate: examData.endDate || null,
          status: "PUBLISHED",

          courseName: examData.courseName,
          section: examData.section,
          domain: examData.domain,
          learningOutcomes: examData.learningOutcomes,
          indicators: examData.indicators,
          skills: examData.skills,
          gradeTarget: examData.gradeTarget,

          modules: modulesPayload,
          questions: allQuestions
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.stack || data.details || data.error || "Failed to create exam");
      }

      showToast("Exam created successfully!", "success");
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
