type CollectQuestionsArgs = {
  module: any;
  subExamId: string;
  standaloneQuestions?: any[];
};

export type QuestionCollectionTarget = { id: string; title: string };
export type StandaloneQuestionCollectionTarget = QuestionCollectionTarget & {
  moduleId: string;
  moduleTitle: string;
};

const questionKey = (question: any, index: number) => String(question?.id || `question-${index}`);

export function getQuestionCollectionTargets(module: any): QuestionCollectionTarget[] {
  return (Array.isArray(module?.subExams) ? module.subExams : [])
    .filter((subExam: any) => subExam?.id)
    .map((subExam: any) => ({ id: String(subExam.id), title: subExam.title || "Untitled exam" }));
}

export function getStandaloneQuestionCollectionTargets(modules: any[]): StandaloneQuestionCollectionTarget[] {
  return (Array.isArray(modules) ? modules : []).flatMap((module: any) =>
    getQuestionCollectionTargets(module).map((subExam) => ({
      ...subExam,
      moduleId: String(module.id),
      moduleTitle: module.title || "Untitled module",
    })),
  );
}

export function collectQuestionsIntoSubExam({
  module,
  subExamId,
  standaloneQuestions = [],
}: CollectQuestionsArgs) {
  const subExams = Array.isArray(module?.subExams) ? module.subExams : [];
  const targetIndex = subExams.findIndex((subExam: any) => String(subExam?.id) === String(subExamId));
  if (targetIndex < 0) {
    return { module, standaloneQuestions, movedQuestionIds: [] as string[] };
  }

  const targetExam = subExams[targetIndex];
  const existingQuestions = Array.isArray(targetExam.questions) ? targetExam.questions : [];
  const sourceQuestions = [
    ...(Array.isArray(module?.questions) ? module.questions : []),
    ...(Array.isArray(standaloneQuestions) ? standaloneQuestions : []),
  ];
  const existingIds = new Set(existingQuestions.map(questionKey));
  const movedQuestionIds: string[] = [];
  const collectedQuestions = [...existingQuestions];

  sourceQuestions.forEach((question, index) => {
    const id = questionKey(question, index);
    if (existingIds.has(id)) return;
    existingIds.add(id);
    movedQuestionIds.push(id);
    collectedQuestions.push({ ...question, moduleId: module.id, subExamId });
  });

  return {
    module: {
      ...module,
      questions: [],
      subExams: subExams.map((subExam: any, index: number) =>
        index === targetIndex ? { ...subExam, questions: collectedQuestions } : subExam,
      ),
    },
    standaloneQuestions: [],
    movedQuestionIds,
  };
}
