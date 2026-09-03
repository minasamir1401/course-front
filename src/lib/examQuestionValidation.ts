const stripHtml = (value: any) =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();

const getFilledOptions = (options: any) =>
  Array.isArray(options) ? options.map((option) => String(option || "").trim()).filter(Boolean) : [];

const hasExplanationContent = (question: any) => {
  const sections = Array.isArray(question?.sections) ? question.sections : [];
  if (sections.some((section: any) => stripHtml(section?.content))) return true;
  return Boolean(stripHtml(question?.explanation));
};

export const validateExamQuestionForSave = (question: any, language: string) => {
  if (!stripHtml(question?.text)) {
    return {
      error: language === "ar" ? "يرجى إدخال نص السؤال" : "Please enter question text",
    };
  }

  if (question?.type === "TEXT") {
    return {
      warning: hasExplanationContent(question)
        ? null
        : language === "ar"
          ? "تنبيه: لم يتم إضافة Explanation لهذا السؤال بعد"
          : "Warning: no explanation has been added for this question yet",
    };
  }

  const filledOptions = getFilledOptions(question?.options);

  if (["MCQ", "MULTI_SELECT"].includes(question?.type) && filledOptions.length < 2) {
    return {
      error: language === "ar"
        ? "يرجى إدخال اختيارين على الأقل لهذا السؤال"
        : "Please add at least two answer choices for this question",
    };
  }

  if (question?.type === "TRUE_FALSE") {
    if (!String(question?.correctAnswer || "").trim()) {
      return {
        error: language === "ar" ? "يرجى تحديد الإجابة الصحيحة" : "Please select the correct answer",
      };
    }
  } else if (question?.type === "MULTI_SELECT") {
    const validAnswers = Array.isArray(question?.correctAnswers)
      ? question.correctAnswers.map((answer: any) => String(answer || "").trim()).filter(Boolean)
      : [];
    if (validAnswers.length === 0) {
      return {
        error: language === "ar"
          ? "يرجى اختيار إجابة صحيحة واحدة على الأقل"
          : "Please select at least one correct answer",
      };
    }
  } else if (!String(question?.correctAnswer || "").trim()) {
    return {
      error: language === "ar" ? "يرجى اختيار الإجابة الصحيحة" : "Please select the correct answer",
    };
  }

  return {
    warning: hasExplanationContent(question)
      ? null
      : language === "ar"
        ? "تنبيه: لم يتم إضافة Explanation لهذا السؤال بعد"
        : "Warning: no explanation has been added for this question yet",
  };
};
