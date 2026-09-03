function getDirectModuleQuestionCount(moduleItem: any) {
  return moduleItem?._count?.questions ?? moduleItem?.questions?.length ?? 0;
}

function getSubExamQuestionCount(subExam: any) {
  return subExam?.questionsCount ?? subExam?._count?.questions ?? subExam?.questions?.length ?? 0;
}

export function getModuleScopedQuestionsCount(moduleItem: any) {
  const subExams = Array.isArray(moduleItem?.subExams) ? moduleItem.subExams : [];
  const directQuestions = subExams.length > 0
    ? getDirectModuleQuestionCount(moduleItem)
    : (moduleItem?.questionsCount ?? getDirectModuleQuestionCount(moduleItem));
  const subExamQuestions = subExams.reduce(
    (total: number, subExam: any) => total + getSubExamQuestionCount(subExam),
    0,
  );

  return directQuestions + subExamQuestions;
}

export function getStandaloneQuestionsCount(exam: any) {
  const totalExamQuestions = exam?._count?.questions ?? exam?.questions?.length ?? 0;
  const moduleQuestions = (exam?.modules || []).reduce(
    (total: number, moduleItem: any) => total + getModuleScopedQuestionsCount(moduleItem),
    0,
  );

  return Math.max(0, totalExamQuestions - moduleQuestions);
}

export function getModuleQuestionCardCounts(moduleQuestions: unknown, standaloneQuestions: unknown) {
  return {
    moduleQuestions: Math.max(0, Number(moduleQuestions) || 0),
    standaloneQuestions: Math.max(0, Number(standaloneQuestions) || 0),
  };
}
