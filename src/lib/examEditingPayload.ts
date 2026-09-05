type BuildDraftModulesArgs = {
  modules: any[];
  currentModule: any;
  editingModuleIndex: number | null;
  isModuleModalOpen: boolean;
  moduleMode?: boolean;
};

type BuildExamSubmissionPayloadArgs = {
  modules: any[];
  standaloneQuestions?: any[];
};

export function deduplicateModules(modules: any[]) {
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const result: any[] = [];

  for (const m of (Array.isArray(modules) ? modules : [])) {
    if (!m) continue;
    const id = m.id ? String(m.id).trim() : '';
    const title = m.title ? String(m.title).trim().toLowerCase() : '';

    if (id && seenIds.has(id)) continue;
    if (title && seenTitles.has(title)) continue;

    if (id) seenIds.add(id);
    if (title) seenTitles.add(title);
    result.push(m);
  }

  return result;
}

export function buildDraftModules({
  modules,
  currentModule,
  editingModuleIndex,
  isModuleModalOpen,
  moduleMode,
}: BuildDraftModulesArgs) {
  const finalModules = Array.isArray(modules) ? [...modules] : [];
  const hasCurrentModule = !!currentModule?.title || !!currentModule?.id;
  if (!hasCurrentModule) return deduplicateModules(finalModules);

  const matchedIndex = editingModuleIndex !== null
    ? editingModuleIndex
    : finalModules.findIndex((module) => {
        if (module?.id && currentModule?.id && String(module.id) === String(currentModule.id)) return true;
        if (module?.title && currentModule?.title && String(module.title).trim() === String(currentModule.title).trim()) return true;
        return false;
      });

  if (matchedIndex >= 0 && matchedIndex < finalModules.length) {
    finalModules[matchedIndex] = { ...finalModules[matchedIndex], ...currentModule };
  } else if (isModuleModalOpen || (moduleMode && finalModules.length === 0)) {
    finalModules.push(currentModule);
  }

  return deduplicateModules(finalModules);
}

export function buildModulesSubmissionPayload(modules: any[]) {
  const allQuestions: any[] = [];
  const modulesPayload = (Array.isArray(modules) ? modules : []).map((moduleItem: any, moduleIndex: number) => {
    const moduleId = moduleItem.id || String(Date.now() + moduleIndex);
    const subExams = (moduleItem.subExams || []).map((subExam: any, subExamIndex: number) => {
      const subExamId = subExam.id || String(Date.now() + moduleIndex * 1000 + subExamIndex);
      const subExamQuestions = (subExam.questions || []).map((question: any) => ({
        ...question,
        moduleId,
        subExamId,
      }));
      allQuestions.push(...subExamQuestions);

      return {
        id: subExamId,
        title: subExam.title,
        password: subExam.password || null,
        duration: subExam.duration || null,
        passingScore: subExam.passingScore || null,
        attemptsAllowed: subExam.attemptsAllowed === "" || subExam.attemptsAllowed === undefined || subExam.attemptsAllowed === null ? 999 : Number(subExam.attemptsAllowed),
        publishDate: subExam.publishDate || null,
        cutOffDate: subExam.cutOffDate || null,
        order: subExamIndex,
      };
    });

    const moduleQuestions = (moduleItem.questions || []).map((question: any) => ({
      ...question,
      moduleId,
    }));
    allQuestions.push(...moduleQuestions);

    return {
      id: moduleId,
      title: moduleItem.title,
      description: moduleItem.content || null,
      duration: moduleItem.duration || null,
      passingScore: moduleItem.passingScore || null,
      publishDate: moduleItem.publishDate || null,
      cutOffDate: moduleItem.cutOffDate || null,
      order: moduleIndex,
      subExams,
    };
  });

  return { modulesPayload, allQuestions };
}

export function buildExamSubmissionPayload({
  modules,
  standaloneQuestions = [],
}: BuildExamSubmissionPayloadArgs) {
  const { modulesPayload, allQuestions } = buildModulesSubmissionPayload(modules);
  const standalonePayload = (Array.isArray(standaloneQuestions) ? standaloneQuestions : []).map((question: any) => ({
    ...question,
    moduleId: null,
    subExamId: null,
  }));

  return {
    modulesPayload,
    allQuestions: [...allQuestions, ...standalonePayload],
  };
}
