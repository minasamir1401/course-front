// @ts-nocheck
import { useEffect } from 'react';
import { API_URL } from '@/lib/api';
import { buildDraftModules, buildExamSubmissionPayload } from '@/lib/examEditingPayload';
import { canRunExamAutosave } from '@/lib/examAutosavePolicy';
import { attachQuestionsToModules, getStandaloneExamQuestions } from '@/lib/examModuleQuestions';
import { normalizePersistedExamQuestions } from '@/lib/persistedExamQuestion';
import { requiresExamAutosaveIdSync, requiresStandaloneExamQuestionIdSync } from '@/lib/examAutosaveIdSync';
import { syncClientItemsWithServerIds } from '@/lib/examAutosaveModuleSync';
import { buildExamSavePayload } from '@/lib/examSaveScope';

export const useExamAutosave = (props: any) => {
  const { isAutoSaveEnabled, isLoading, isInitialLoad, createdId, examData, modules, isModuleModalOpen, currentModule, editingModuleIndex, manualSubmitRef, lastAutoSaveSnapshotRef, autoSaveGenerationRef, createdIdRef, setCreatedId, setCurrentModule, setModules, setEditingModuleIndex, setLastAutoSave, deletedQuestionIds, setDeletedQuestionIds, showToast, language, autoSaveWriteQueueRef, autoSaveTimerRef, standaloneQuestions, setStandaloneQuestions, moduleId, subExamId } = props;

  useEffect(() => {
    const activeExamId = createdIdRef.current || createdId;
    if (!canRunExamAutosave({
      isAutoSaveEnabled,
      isLoading,
      isInitialLoad,
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
        const token = localStorage.getItem("super_admin_token");
        if (!token) return;

        const finalModules = buildDraftModules({
          modules,
          currentModule,
          editingModuleIndex,
          isModuleModalOpen,
        });
        
        const targetSchoolIds = (examData.schoolIds || []).filter(Boolean);
        const isCentral = !!examData.isCentral;

        const { modulesPayload, allQuestions } = buildExamSubmissionPayload({
          modules: finalModules,
          standaloneQuestions,
        });
        const submittedDeletedQuestionIds = [...(deletedQuestionIds || [])];
        
        const payload = buildExamSavePayload({
          title: examData.title || (language === 'ar' ? 'مسودة امتحان بدون عنوان' : 'Untitled Exam Draft'),
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
          resultVisibility: examData.resultVisibility || 'SHOW_SCORE',
          attemptsAllowed: examData.attemptsAllowed === "" || examData.attemptsAllowed === undefined || examData.attemptsAllowed === null ? 999 : Number(examData.attemptsAllowed),
          startDate: examData.startDate || null,
          endDate: examData.endDate || null,
          status: 'DRAFT',
          modules: modulesPayload,
          questions: allQuestions,
          deletedQuestionIds: submittedDeletedQuestionIds
        }, { moduleId, subExamId });
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
          if (data && data.modules) {
            const persistedQuestions = normalizePersistedExamQuestions(data.questions);
            const parsedModules = attachQuestionsToModules(data.modules.map((l: any) => {
              let parsedQuestions = [];
              let parsedAssignments = [];
              let parsedAttachments = [];
              let parsedSlides = [];

              try {
                parsedQuestions = typeof l.questions === 'string' ? JSON.parse(l.questions) : (l.questions || []);
              } catch (e) { parsedQuestions = []; }

              try {
                parsedAssignments = typeof l.assignments === 'string' ? JSON.parse(l.assignments) : (l.assignments || []);
              } catch (e) { parsedAssignments = []; }

              try {
                parsedAttachments = typeof l.attachments === 'string' ? JSON.parse(l.attachments) : (l.attachments || []);
              } catch (e) { parsedAttachments = []; }

              try {
                parsedSlides = typeof l.slides === 'string' ? JSON.parse(l.slides) : (l.slides || []);
              } catch (e) { parsedSlides = [{ id: Date.now(), type: 'TEXT', label: 'CONTENT', title: language === 'ar' ? "المقدمة" : "Introduction", content: "", sections: [] }]; }

              return {
                ...l,
                isVisible: l.isVisible !== undefined ? l.isVisible : true,
                publishDate: l.publishDate ? new Date(new Date(l.publishDate).getTime() - new Date(l.publishDate).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
                cutOffDate: l.cutOffDate ? new Date(new Date(l.cutOffDate).getTime() - new Date(l.cutOffDate).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
                questions: Array.isArray(parsedQuestions) ? parsedQuestions.map(q => {
                  let parsedExps = [""];
                  try {
                    parsedExps = typeof q.explanation === 'string' && q.explanation.startsWith('[') ? JSON.parse(q.explanation) : (q.explanations || [""]);
                    if (!Array.isArray(parsedExps)) parsedExps = [q.explanation || ""];
                  } catch (e) {
                    parsedExps = [q.explanation || ""];
                  }
                  return { ...q, explanations: parsedExps };
                }) : [],
                assignments: Array.isArray(parsedAssignments) ? parsedAssignments.map(q => {
                  let parsedExps = [""];
                  try {
                    parsedExps = typeof q.explanation === 'string' && q.explanation.startsWith('[') ? JSON.parse(q.explanation) : (q.explanations || [""]);
                    if (!Array.isArray(parsedExps)) parsedExps = [q.explanation || ""];
                  } catch (e) {
                    parsedExps = [q.explanation || ""];
                  }
                  return { ...q, explanations: parsedExps };
                }) : [],
                attachments: Array.isArray(parsedAttachments) ? parsedAttachments : [],
                slides: Array.isArray(parsedSlides) && parsedSlides.length ? parsedSlides : [{ id: Date.now(), type: 'TEXT', label: 'CONTENT', title: language === 'ar' ? "المقدمة" : "Introduction", content: "", sections: [] }]
              };
            }), persistedQuestions);

            const shouldSyncServerIds = requiresExamAutosaveIdSync(modules, parsedModules);
            const serverStandaloneQuestions = getStandaloneExamQuestions(persistedQuestions);
            const shouldSyncStandaloneIds = requiresStandaloneExamQuestionIdSync(standaloneQuestions);

            // A server response is only applied when it gives new database IDs.
            // Replacing equivalent editor state retriggers autosave indefinitely.
            if (isModuleModalOpen && shouldSyncServerIds) {
              let idx = editingModuleIndex;
              if (idx === null) {
                idx = parsedModules.length - 1;
                setEditingModuleIndex(idx);
              }
              if (idx >= 0 && idx < parsedModules.length) {
                // Keep current state edits so we don't overwrite user actively typing, 
                // but preserve backend-assigned IDs (UUIDs)
                setCurrentModule((prev: any) => ({
                ...prev,
                id: parsedModules[idx].id,
                content: prev.content,
                slides: syncClientItemsWithServerIds(prev.slides, parsedModules[idx].slides),
                questions: syncClientItemsWithServerIds(prev.questions, parsedModules[idx].questions),
                assignments: syncClientItemsWithServerIds(prev.assignments, parsedModules[idx].assignments),
                }));
              }
              // Set all modules with backend IDs
              setModules(parsedModules.map((pl: any, plIdx: number) => {
                if (plIdx === idx) {
                  return {
                    ...pl,
                    title: currentModule.title,
                    domain: currentModule.domain,
                    content: currentModule.content,
                    videoUrl: currentModule.videoUrl,
                    summary: currentModule.summary,
                    notes: currentModule.notes,
                    standards: currentModule.standards,
                    indicators: currentModule.indicators,
                    learningOutcomes: currentModule.learningOutcomes,
                    isVisible: currentModule.isVisible,
                    publishDate: currentModule.publishDate,
                    cutOffDate: currentModule.cutOffDate,
                    slides: syncClientItemsWithServerIds(currentModule.slides, pl.slides),
                    questions: syncClientItemsWithServerIds(currentModule.questions, pl.questions),
                    assignments: syncClientItemsWithServerIds(currentModule.assignments, pl.assignments),
                  };
                }
                return pl;
              }));
            } else if (shouldSyncServerIds) {
              setModules(parsedModules);
            }
            if (shouldSyncStandaloneIds) {
              setStandaloneQuestions?.((current: any[]) =>
                syncClientItemsWithServerIds(current, serverStandaloneQuestions),
              );
            }
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
