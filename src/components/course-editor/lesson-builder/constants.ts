import { Lightbulb, TriangleAlert, CheckCircle2, BookOpen } from "lucide-react";

export const getSectionStylePresets = (language: string) => ({
  HINT: {
    icon: Lightbulb,
    label: language === 'ar' ? "تلميح" : "Hint",
    container: "bg-yellow-50/70 border-yellow-200",
    badge: "bg-yellow-100 text-yellow-700",
  },
  TIP: {
    icon: Lightbulb,
    label: language === 'ar' ? "نصيحة" : "Tip",
    container: "bg-sky-50/70 border-sky-200",
    badge: "bg-sky-100 text-sky-700",
  },
  WARNING: {
    icon: TriangleAlert,
    label: language === 'ar' ? "تحذير" : "Warning",
    container: "bg-rose-50/70 border-rose-200",
    badge: "bg-rose-100 text-rose-700",
  },
  KEY_INSIGHT: {
    icon: CheckCircle2,
    label: language === 'ar' ? "نقطة هامة" : "Key Insight",
    container: "bg-purple-50/70 border-purple-200",
    badge: "bg-purple-100 text-purple-700",
  },
  FEEDBACK: {
    icon: CheckCircle2,
    label: language === 'ar' ? "ملاحظات" : "Feedback",
    container: "bg-emerald-50/70 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
  },
  EXPLANATION: {
    icon: BookOpen,
    label: language === 'ar' ? "شرح مفصل" : "Explanation",
    container: "bg-indigo-50/70 border-indigo-200",
    badge: "bg-indigo-100 text-indigo-700",
  }
});
