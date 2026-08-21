export const parseJson = (str: any, fallback: any = {}) => {
  try {
    if (str === undefined || str === null) return fallback;
    let parsed = str;
    if (typeof str === "string") {
      const trimmed = str.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[") || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
        try {
          parsed = JSON.parse(trimmed);
        } catch {
          parsed = trimmed;
        }
      } else {
        return fallback;
      }
    }
    if (typeof parsed !== "object" || parsed === null) {
      return parsed;
    }
    if (fallback && !Array.isArray(fallback) && Array.isArray(parsed)) {
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
};

export const getGradeName = (grade: string, language: string) => {
  if (language === 'ar') {
    const translations: { [key: string]: string } = {
      "Elementary": "المرحلة الابتدائية",
      "Middle School": "المرحلة الإعدادية",
      "High School": "المرحلة الثانوية",
      "الصف الأول الابتدائي": "الأول الابتدائي",
      "الصف الثاني الابتدائي": "الثاني الابتدائي",
      "الصف الثالث الابتدائي": "الثالث الابتدائي",
      "الصف الرابع الابتدائي": "الرابع الابتدائي",
      "الصف الخامس الابتدائي": "الخامس الابتدائي",
      "الصف السادس الابتدائي": "السادس الابتدائي",
      "الصف الأول الإعدادي": "الأول الإعدادي",
      "الصف الثاني الإعدادي": "الثاني الإعدادي",
      "الصف الثالث الإعدادي": "الثالث الإعدادي",
      "الصف الأول الثانوي": "الأول الثانوي",
      "الصف الثاني الثانوي": "الثاني الثانوي",
      "الصف الثالث الثانوي": "الثالث الثانوي"
    };
    return translations[grade] || grade;
  }
  const translations: { [key: string]: string } = {
    "Elementary": "Elementary Stage",
    "Middle School": "Middle School Stage",
    "High School": "High School Stage",
    "الصف الأول الابتدائي": "1st Primary",
    "الصف الثاني الابتدائي": "2nd Primary",
    "الصف الثالث الابتدائي": "3rd Primary",
    "الصف الرابع الابتدائي": "4th Primary",
    "الصف الخامس الابتدائي": "5th Primary",
    "الصف السادس الابتدائي": "6th Primary",
    "الصف الأول الإعدادي": "1st Prep",
    "الصف الثاني الإعدادي": "2nd Prep",
    "الصف الثالث الإعدادي": "3rd Prep",
    "الصف الأول الثانوي": "1st Secondary",
    "الصف الثاني الثانوي": "2nd Secondary",
    "الصف الثالث الثانوي": "3rd Secondary"
  };
  return translations[grade] || grade;
};

export const getGradeCheckboxLabel = (grade: string, language: string) => {
  if (language === 'ar') {
    const translations: { [key: string]: string } = {
      "الصف الأول الابتدائي": "الأول",
      "الصف الثاني الابتدائي": "الثاني",
      "الصف الثالث الابتدائي": "الثالث",
      "الصف الرابع الابتدائي": "الرابع",
      "الصف الخامس الابتدائي": "الخامس",
      "الصف السادس الابتدائي": "السادس",
      "الصف الأول الإعدادي": "الأول",
      "الصف الثاني الإعدادي": "الثاني",
      "الصف الثالث الإعدادي": "الثالث",
      "الصف الأول الثانوي": "الأول",
      "الصف الثاني الثانوي": "الثاني",
      "الصف الثالث الثانوي": "الثالث"
    };
    return translations[grade] || grade;
  }
  const translations: { [key: string]: string } = {
    "الصف الأول الابتدائي": "Gr. 1",
    "الصف الثاني الابتدائي": "Gr. 2",
    "الصف الثالث الابتدائي": "Gr. 3",
    "الصف الرابع الابتدائي": "Gr. 4",
    "الصف الخامس الابتدائي": "Gr. 5",
    "الصف السادس الابتدائي": "Gr. 6",
    "الصف الأول الإعدادي": "Gr. 1",
    "الصف الثاني الإعدادي": "Gr. 2",
    "الصف الثالث الإعدادي": "Gr. 3",
    "الصف الأول الثانوي": "Gr. 1",
    "الصف الثاني الثانوي": "Gr. 2",
    "الصف الثالث الثانوي": "Gr. 3"
  };
  return translations[grade] || grade;
};

export const getSubjectName = (subject: string, language: string) => {
  if (language === 'ar') return subject;
  const translations: { [key: string]: string } = {
    "اللغة العربية": "Arabic",
    "اللغة الإنجليزية": "English",
    "اللغة الفرنسية": "French",
    "اللغة الألمانية": "German",
    "اللغة الإيطالية": "Italian",
    "الرياضيات": "Mathematics",
    "الفيزياء": "Physics",
    "الكيمياء": "Chemistry",
    "الأحياء": "Biology",
    "الجيولوجيا": "Geology",
    "الميكانيكا": "Mechanics",
    "التاريخ": "History",
    "الجغرافيا": "Geography",
    "الفلسفة": "Philosophy",
    "علم النفس": "Psychology",
    "الاقتصاد": "Economics",
    "الإحصاء": "Statistics",
    "التربية الدينية": "Religious Education",
    "التربية الوطنية": "National Education",
    "الحاسب الآلي": "Computer Science",
    "SAT Math": "SAT Math",
    "SAT English": "SAT English"
  };
  return translations[subject] || subject;
};
