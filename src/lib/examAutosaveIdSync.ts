const isPersistedId = (id: unknown) => typeof id === 'string' && id.length > 0;

const containsTransientQuestionId = (questions: unknown) =>
  Array.isArray(questions) && questions.some((question) => !isPersistedId(question?.id));

export function requiresExamAutosaveIdSync(localModules: unknown, serverModules: unknown) {
  if (!Array.isArray(localModules) || !Array.isArray(serverModules)) return false;

  return localModules.some((module, moduleIndex) => {
    const serverModule = serverModules[moduleIndex];
    if (!serverModule || !isPersistedId(module?.id)) return true;
    if (containsTransientQuestionId(module?.questions) || containsTransientQuestionId(module?.assignments)) return true;

    return Array.isArray(module?.subExams) && module.subExams.some((subExam: any) =>
      !isPersistedId(subExam?.id) || containsTransientQuestionId(subExam?.questions),
    );
  });
}

export function requiresStandaloneExamQuestionIdSync(localQuestions: unknown) {
  return containsTransientQuestionId(localQuestions);
}
