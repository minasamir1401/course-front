type EditModuleAutoOpenParams = {
  workflowView: string;
  editModuleId: string | null | undefined;
  handledEditModuleId: string | null;
  modules: Array<{ id?: string | number | null }> | null | undefined;
};

export const resolveEditModuleAutoOpenIndex = ({
  workflowView,
  editModuleId,
  handledEditModuleId,
  modules,
}: EditModuleAutoOpenParams) => {
  // Legacy query parameters must never open a modal as a side effect of loading a page.
  void workflowView;
  void editModuleId;
  void handledEditModuleId;
  void modules;
  return null;
};
