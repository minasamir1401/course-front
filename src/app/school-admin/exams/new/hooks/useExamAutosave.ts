// @ts-nocheck
import { useEffect } from 'react';
import { apiFetch, API_URL } from '@/lib/api';
import { canRunExamAutosave } from '@/lib/examAutosavePolicy';
import { buildDraftModules, buildExamSubmissionPayload } from '@/lib/examEditingPayload';
import { attachQuestionsToModules, getStandaloneExamQuestions } from '@/lib/examModuleQuestions';
import { normalizePersistedExamQuestions } from '@/lib/persistedExamQuestion';
import { requiresExamAutosaveIdSync, requiresStandaloneExamQuestionIdSync } from '@/lib/examAutosaveIdSync';
import { syncClientItemsWithServerIds, syncClientModulesWithServerIds } from '@/lib/examAutosaveModuleSync';

export const useExamAutosave = (props: any) => {
  const { isAutoSaveEnabled, isLoading, createdId, examData, modules, isModuleModalOpen, currentModule, editingModuleIndex, manualSubmitRef, lastAutoSaveSnapshotRef, autoSaveGenerationRef, createdIdRef, setCreatedId, setCurrentModule, setModules, setEditingModuleIndex, setLastAutoSave, deletedQuestionIds, setDeletedQuestionIds, showToast, language, autoSaveWriteQueueRef, autoSaveTimerRef, standaloneQuestions, setStandaloneQuestions } = props;

  useEffect(() => {
    const activeExamId = createdIdRef.current || createdId;
    if (!canRunExamAutosave({
      isAutoSaveEnabled,
      isLoading,
      isManualSubmit: manualSubmitRef.current,
      activeExamId,
      allowCreateWithoutId: false,
    })) return;

    const snapshot = JSON.stringify({ createdId, examData, modules, isModuleModalOpen, currentModule, editingModuleIndex, standaloneQuestions, deletedQuestionIds });
    if (snapshot === lastAutoSaveSnapshotRef.current) return;
    lastAutoSaveSnapshotRef.current = snapshot;
    const requestGeneration = ++autoSaveGenerationRef.current;
    
    const timer = setTimeout(() => {
      const runAutoSave = async () => {
        if (manualSubmitRef.current || requestGeneration !== autoSaveGenerationRef.current) return;
      try {
        const token = localStorage.getItem("school_admin_token");
        if (!token) return;

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

        const { modulesPayload, allQuestions, cleanedStandaloneQuestions } = buildExamSubmissionPayload({
          modules: finalModules,
          standaloneQuestions,
        });
        const submittedDeletedQuestionIds = [...(deletedQuestionIds || [])];
        const payload = {
          title: examData.title || (language === 'ar' ? "مسودة امتحان بدون عنوان" : "Untitled Exam Draft"),
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
          status: "DRAFT",
          modules: modulesPayload,
          questions: allQuestions,
          deletedQuestionIds: submittedDeletedQuestionIds
        };

        const method = activeExamId ? "PUT" : "POST";
        const url = activeExamId 
          ? `${API_URL}/exams/${activeExamId}?compact=true`
          : `${API_URL}/exams`;

        const res = await apiFetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          const serverId = data.id || data.exam?.id;
          if (!createdIdRef.current && serverId) {
             createdIdRef.current = serverId;
             setCreatedId(serverId);
          }
          if (manualSubmitRef.current || requestGeneration !== autoSaveGenerationRef.current) return;
          const saved = data.exam || data;
          const serverQuestions = normalizePersistedExamQuestions(data.questions || saved.questions || []);
          const serverModules = attachQuestionsToModules(data.modules || saved.modules || [], serverQuestions);
          if (requiresExamAutosaveIdSync(finalModules, serverModules)) {
            const syncedModules = syncClientModulesWithServerIds(finalModules, serverModules);
            setModules(syncedModules);
            if (isModuleModalOpen && syncedModules.length) {
              const index = editingModuleIndex ?? syncedModules.length - 1;
              if (syncedModules[index]) {
                setCurrentModule(syncedModules[index]);
                setEditingModuleIndex(index);
              }
            }
          }
          if (requiresStandaloneExamQuestionIdSync(standaloneQuestions) || cleanedStandaloneQuestions.length !== (standaloneQuestions || []).length) {
            setStandaloneQuestions?.(syncClientItemsWithServerIds(cleanedStandaloneQuestions, getStandaloneExamQuestions(serverQuestions)));
          }
          if (submittedDeletedQuestionIds.length > 0) {
            setDeletedQuestionIds?.((prev: string[]) => prev.filter((id) => !submittedDeletedQuestionIds.includes(id)));
          }
          setLastAutoSave(new Date());
        } else {
          const message = await res.text().catch(() => "");
          console.error("Auto-save failed:", message);
          showToast(language === 'ar' ? "فشل الحفظ التلقائي. تأكد من الاتصال ثم احفظ يدوياً." : "Auto-save failed. Check your connection, then save manually.", "error");
        }
      } catch (err) {
        console.error("Auto save failed", err);
        showToast(language === 'ar' ? "فشل الحفظ التلقائي. تأكد من الاتصال ثم احفظ يدوياً." : "Auto-save failed. Check your connection, then save manually.", "error");
      }
      };

      const queuedWrite = autoSaveWriteQueueRef.current.then(runAutoSave, runAutoSave);
      autoSaveWriteQueueRef.current = queuedWrite.catch(() => undefined);
    }, 1_500);
    autoSaveTimerRef.current = timer;

    return () => {
      clearTimeout(timer);
      if (autoSaveTimerRef.current === timer) autoSaveTimerRef.current = null;
    };
  }, [isAutoSaveEnabled, isLoading, createdId, examData, modules, isModuleModalOpen, currentModule, editingModuleIndex, standaloneQuestions, deletedQuestionIds]);

};
