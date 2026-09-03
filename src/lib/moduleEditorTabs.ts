type ModuleEditorTab = {
  id: "info" | "scheduling" | "exercises";
  label: string;
};

type ModuleEditorTabsInput = {
  moduleMode: boolean;
  hasActiveSubExam: boolean;
  language: string;
};

export function getModuleEditorTabs({
  moduleMode,
  hasActiveSubExam,
  language,
}: ModuleEditorTabsInput): ModuleEditorTab[] {
  const isArabic = language === "ar";

  if (moduleMode) {
    return [
      { id: "info", label: isArabic ? "معلومات الموديول" : "Module Info" },
      { id: "scheduling", label: isArabic ? "الجدولة والظهور" : "Scheduling & Visibility" },
    ];
  }

  if (hasActiveSubExam) {
    return [
      { id: "exercises", label: isArabic ? "إعدادات الاختبار والأسئلة" : "Exam Settings & Questions" },
    ];
  }

  return [
    { id: "info", label: isArabic ? "معلومات الموديول" : "Module Info" },
    { id: "scheduling", label: isArabic ? "الجدولة والظهور" : "Scheduling & Visibility" },
  ];
}
