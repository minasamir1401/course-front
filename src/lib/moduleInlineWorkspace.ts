export function createModuleDraft(language: string) {
  return {
    title: "",
    domain: "",
    content: "",
    videoUrl: "",
    summary: "",
    notes: "",
    standards: "",
    indicators: "",
    learningOutcomes: "",
    isVisible: true,
    publishDate: "",
    cutOffDate: "",
    slides: [{
      id: Date.now(),
      type: "TEXT",
      label: "CONTENT",
      title: language === "ar" ? "المقدمة" : "Introduction",
      content: "",
      videoUrl: "",
      sections: [],
    }],
    questions: [],
    assignments: [],
    attachments: [],
  };
}

export function upsertModuleDraft<T>(modules: T[], module: T, editingIndex: number | null) {
  if (editingIndex === null) return [...modules, module];
  return modules.map((item, index) => (index === editingIndex ? module : item));
}
