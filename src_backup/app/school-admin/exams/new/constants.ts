import { Lightbulb, TriangleAlert, Search, MessageSquareQuote, CheckCircle2 } from 'lucide-react';

export const SECTION_STYLE_PRESETS: Record<string, {
  icon: any;
  labelEn: string;
  labelAr: string;
  container: string;
  badge: string;
}> = {
  HINT: {
    icon: Lightbulb,
    labelEn: "Hint",
    labelAr: "تلميح",
    container: "bg-yellow-50/70 border-yellow-200",
    badge: "bg-yellow-100 text-yellow-700",
  },
  TIP: {
    icon: Lightbulb,
    labelEn: "Tip",
    labelAr: "نصيحة",
    container: "bg-sky-50/70 border-sky-200",
    badge: "bg-sky-100 text-sky-700",
  },
  WARNING: {
    icon: TriangleAlert,
    labelEn: "Warning",
    labelAr: "تحذير",
    container: "bg-rose-50/70 border-rose-200",
    badge: "bg-rose-100 text-rose-700",
  },
  KEY_INSIGHT: {
    icon: Search,
    labelEn: "Key Insight",
    labelAr: "رؤية رئيسية",
    container: "bg-indigo-50/70 border-indigo-200",
    badge: "bg-indigo-100 text-indigo-700",
  },
  FEEDBACK: {
    icon: MessageSquareQuote,
    labelEn: "Feedback",
    labelAr: "ملاحظات",
    container: "bg-emerald-50/70 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
  },
  EXPLANATION: {
    icon: CheckCircle2,
    labelEn: "Explanation",
    labelAr: "تفسير",
    container: "bg-amber-50/70 border-amber-200",
    badge: "bg-amber-100 text-amber-700",
  },
};

export const DEFAULT_SKILLS = [
  "Problem Solving", "Reasoning", "Number Sense", "Algebraic Thinking", "Geometry", "Data Analysis",
  "Observation", "Investigation", "Scientific Reasoning", "Data Interpretation", "Experiment Design",
  "Main Idea", "Inference", "Vocabulary in Context", "Author's Purpose", "Supporting Details"
];

export const STANDARDS = [
  "Standard 1: Basic Comprehension",
  "Standard 2: Analytical Ability",
  "Standard 3: Practical Application",
  "Standard 4: Creative Thinking"
];

export const INDICATORS = [
  "Indicator 1.1: Defining Terms",
  "Indicator 1.2: Explaining Concepts",
  "Indicator 2.1: Comparing Results",
  "Indicator 3.1: Problem Solving"
];

export const LEARNING_OUTCOMES = [
  "LO1: أن يعدد الطالب خصائص...",
  "LO2: أن يحلل الطالب العلاقة بين...",
  "LO3: أن يطبق القوانين في...",
  "LO4: أن يستنتج الطالب..."
];

export const GRADES = [
  "الصف الأول الابتدائي", "الصف الثاني الابتدائي", "الصف الثالث الابتدائي",
  "الصف الرابع الابتدائي", "الصف الخامس الابتدائي", "الصف السادس الابتدائي",
  "الصف الأول الإعدادي", "الصف الثاني الإعدادي", "الصف الثالث الإعدادي",
  "الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"
];

export const QUESTION_TYPES = [
  { id: "MCQ", labelEn: "Multiple Choice", labelAr: "اختيار من متعدد" },
  { id: "TRUE_FALSE", labelEn: "True / False", labelAr: "صح وخطأ" },
  { id: "MULTI_SELECT", labelEn: "Multi-select", labelAr: "اختيار متعدد" }
];

export const CATEGORIES = [
  "اللغة العربية", "اللغة الإنجليزية", "اللغة الفرنسية", "اللغة الألمانية", "اللغة الإيطالية",
  "الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "الجيولوجيا", "الميكانيكا",
  "التاريخ", "الجغرافيا", "الفلسفة", "علم النفس", "الاقتصاد", "الإحصاء",
  "التربية الدينية", "التربية الوطنية", "الحاسب الآلي",
  "SAT Math", "SAT English"
];

export const SKILLS = ["General", "Critical Thinking", "Problem Solving", "Analysis", "Application"];
