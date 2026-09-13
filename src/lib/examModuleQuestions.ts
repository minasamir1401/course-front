const hasSameId = (left: unknown, right: unknown) => String(left ?? "") === String(right ?? "");

export function getStandaloneExamQuestions(questions: any[] = []) {
  return (Array.isArray(questions) ? questions : []).filter(
    (question) => !question?.moduleId && !question?.subExamId,
  );
}

export function attachQuestionsToModules(modules: any[] = [], questions: any[] = []) {
  const allQuestions = Array.isArray(questions) ? questions : [];

  return (Array.isArray(modules) ? modules : []).map((module) => {
    const subExams = (module.subExams || []).map((subExam: any) => ({
      ...subExam,
      questions: allQuestions.filter(
        (question) =>
          hasSameId(question.moduleId, module.id) &&
          hasSameId(question.subExamId, subExam.id),
      ),
    }));

    const subModules = (module.subModules || []).map((subModule: any) => {
      const subModSubExams = (subModule.subExams || []).map((subExam: any) => ({
        ...subExam,
        questions: allQuestions.filter(
          (question) =>
            hasSameId(question.moduleId, subModule.id) &&
            hasSameId(question.subExamId, subExam.id),
        ),
      }));

      return {
        ...subModule,
        questions: allQuestions.filter(
          (question) => hasSameId(question.moduleId, subModule.id) && !question.subExamId,
        ),
        subExams: subModSubExams,
      };
    });

    return {
      ...module,
      questions: allQuestions.filter(
        (question) => hasSameId(question.moduleId, module.id) && !question.subExamId,
      ),
      subExams,
      subModules,
    };
  });
}
