export const selectEditableModule = (
  moduleId: string | null | undefined,
  resolvedModule: any,
  currentModule: any,
) => {
  if (moduleId && String(currentModule?.id || "") === String(moduleId)) {
    return currentModule;
  }

  return resolvedModule || currentModule;
};

export const selectEditableSubExamIndex = (
  resolvedSubExamIndex: number,
  activeSubExamIndex: number | null | undefined,
) => {
  if (resolvedSubExamIndex >= 0) {
    return resolvedSubExamIndex;
  }

  return activeSubExamIndex ?? -1;
};
