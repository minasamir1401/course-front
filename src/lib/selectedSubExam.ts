export type SelectedSubExamLocation = {
  moduleIndex: number;
  subExamIndex: number;
};

export const findSelectedSubExamLocation = (
  modules: Array<{ subExams?: Array<{ id?: string | number | null }> }> | undefined,
  selectedSubExamId?: string | number | null,
): SelectedSubExamLocation | null => {
  if (!modules?.length || selectedSubExamId === null || selectedSubExamId === undefined) {
    return null;
  }

  const selectedId = String(selectedSubExamId);

  for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex += 1) {
    const subExams = modules[moduleIndex]?.subExams || [];
    const subExamIndex = subExams.findIndex((subExam) => String(subExam?.id ?? "") === selectedId);

    if (subExamIndex >= 0) {
      return { moduleIndex, subExamIndex };
    }
  }

  return null;
};
