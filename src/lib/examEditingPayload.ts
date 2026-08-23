type BuildDraftModulesArgs = {
  modules: any[];
  currentModule: any;
  editingModuleIndex: number | null;
  isModuleModalOpen: boolean;
};

export function buildDraftModules({
  modules,
  currentModule,
  editingModuleIndex,
  isModuleModalOpen,
}: BuildDraftModulesArgs) {
  const finalModules = Array.isArray(modules) ? [...modules] : [];
  const hasCurrentModule = !!currentModule?.title || !!currentModule?.id;
  if (!hasCurrentModule) return finalModules;

  const matchedIndex = editingModuleIndex !== null
    ? editingModuleIndex
    : finalModules.findIndex((module) => String(module?.id || '') === String(currentModule?.id || ''));

  if (matchedIndex >= 0) {
    finalModules[matchedIndex] = currentModule;
    return finalModules;
  }

  if (isModuleModalOpen) {
    finalModules.push(currentModule);
  }

  return finalModules;
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
        duration: subExam.duration || null,
        passingScore: subExam.passingScore || null,
        attemptsAllowed: subExam.attemptsAllowed || 1,
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
