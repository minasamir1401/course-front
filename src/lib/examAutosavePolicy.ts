type ExamAutosavePolicyArgs = {
  isAutoSaveEnabled: boolean;
  isLoading: boolean;
  isInitialLoad?: boolean;
  isManualSubmit: boolean;
  activeExamId?: string | null;
  allowCreateWithoutId?: boolean;
};

export function canRunExamAutosave({
  isAutoSaveEnabled,
  isLoading,
  isInitialLoad = false,
  isManualSubmit,
  activeExamId,
  allowCreateWithoutId = false,
}: ExamAutosavePolicyArgs) {
  if (!isAutoSaveEnabled || isLoading || isInitialLoad || isManualSubmit) {
    return false;
  }

  if (!allowCreateWithoutId && !String(activeExamId || '').trim()) {
    return false;
  }

  return true;
}
