type ExamAutosavePolicyArgs = {
  isAutoSaveEnabled: boolean;
  isLoading: boolean;
  isLoadingQuestions?: boolean;
  isInitialLoad?: boolean;
  isManualSubmit: boolean;
  activeExamId?: string | null;
  allowCreateWithoutId?: boolean;
};

export function canRunExamAutosave({
  isAutoSaveEnabled,
  isLoading,
  isLoadingQuestions = false,
  isInitialLoad = false,
  isManualSubmit,
  activeExamId,
  allowCreateWithoutId = false,
}: ExamAutosavePolicyArgs) {
  if (!isAutoSaveEnabled || isLoading || isLoadingQuestions || isInitialLoad || isManualSubmit) {
    return false;
  }

  if (!allowCreateWithoutId && !String(activeExamId || '').trim()) {
    return false;
  }

  return true;
}
