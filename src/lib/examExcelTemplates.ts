export { questionExportRows as buildQuestionExportRows } from './questionExcelSync';
import { questionTemplateRows } from './questionExcelSync';
export function buildQuestionTemplateRows(_type: 'questions' | 'assignments', language: string) {
  return questionTemplateRows(language);
}

import { normalizeDok } from './examQuestionMetadata';

export function buildAdvancedMetadataTemplateRows(language: string, list: any[]) {
  const isEn = language === 'en';
  const headers = [
    'Question ID',
    isEn ? 'Exam (Ar)' : 'الاختبار بالعربية',
    isEn ? 'Exam (En)' : 'الاختبار بالإنجليزية',
    isEn ? 'Section (Ar)' : 'القسم بالعربية',
    isEn ? 'Section (En)' : 'القسم بالإنجليزية',
    isEn ? 'Domain (Ar)' : 'المجال بالعربية',
    isEn ? 'Domain (En)' : 'المجال بالإنجليزية',
    isEn ? 'Learning Outcomes (Ar)' : 'نواتج التعلم بالعربية',
    isEn ? 'Learning Outcomes (En)' : 'نواتج التعلم بالإنجليزية',
    isEn ? 'Indicators (Ar)' : 'المؤشرات بالعربية',
    isEn ? 'Indicators (En)' : 'المؤشرات بالإنجليزية',
    isEn ? 'Skill (Ar)' : 'المهارة بالعربية',
    isEn ? 'Skill (En)' : 'المهارة بالإنجليزية',
    isEn ? 'Subskill (Ar)' : 'المهارة الفرعية بالعربية',
    isEn ? 'Subskill (En)' : 'المهارة الفرعية بالإنجليزية',
    isEn ? 'Micro Skill (Ar)' : 'المهارة الدقيقة بالعربية',
    isEn ? 'Micro Skill (En)' : 'المهارة الدقيقة بالإنجليزية',
    isEn ? 'Difficulty Level (Easy/Medium/Hard)' : 'مستوى الصعوبة (تأسيسي / في المستوى / متقدم)',
    isEn ? 'DOK (DOK 1/2/3/4)' : 'عمق المعرفة (DOK 1/2/3/4)',
    isEn ? 'Cognitive Level (Remember/Understand/Apply/Analyze)' : 'المستوى المعرفي (تذكر / فهم / تطبيق / تحليل)',
    isEn ? 'Error Pattern (Ar)' : 'نمط الخطأ بالعربية',
    isEn ? 'Error Pattern (En)' : 'نمط الخطأ بالإنجليزية',
    isEn ? 'Estimated Time (e.g. 2 mins)' : 'الوقت التقديري (مثال: 2 دقيقة)',
  ];

  const rows: any[][] = [headers];

  if (!Array.isArray(list) || list.length === 0) {
    rows.push([
      '',
      'مقدمة في الفيزياء', 'Introduction to Physics',
      'الميكانيكا الكلاسيكية', 'Classical Mechanics',
      'الفيزياء والحركة', 'Physics & Motion',
      'أن يستنتج الطالب العلاقة بين القوة والتسارع', 'Student will infer the relationship between force and acceleration',
      'يطبق القانون الثاني لنيوتن في حل المسائل', 'Applies Newton\'s Second Law in problem solving',
      'قوانين نيوتن للحركة', 'Newton\'s Laws of Motion',
      'القانون الثاني لنيوتن', 'Newton\'s Second Law',
      'حساب التسارع والقوة المحصلة', 'Calculating Acceleration and Net Force',
      'Medium',
      'DOK 2',
      'Application',
      'الخلط بين الكتلة والوزن', 'Confusing mass with weight',
      '2 mins'
    ]);
    rows.push([
      '',
      'التركيب الذري والجدول الدوري', 'Atomic Structure & Periodic Table',
      'الذرات والروابط', 'Atoms & Bonding',
      'الكيمياء العامة', 'General Chemistry',
      'أن يحدد الطالب عدد الإلكترونات في المستويات الرئيسية', 'Student will determine the number of electrons in principal energy levels',
      'يستنتج التوزيع الإلكتروني للعناصر', 'Infers electron configuration of elements',
      'التركيب الذري', 'Atomic Structure',
      'مستويات الطاقة والإلكترونات', 'Energy Levels & Electrons',
      'قاعدة باولي ومبدأ البناء التصاعدي', 'Pauli Principle & Aufbau Principle',
      'Hard',
      'DOK 3',
      'Analyze',
      'الخطأ في ترتيب المستويات الفرعية 4s و 3d', 'Error in orbital order 4s and 3d',
      '3 mins'
    ]);
    rows.push([
      '',
      'الجبر وحساب المثلثات', 'Algebra & Trigonometry',
      'المعادلات والدوال', 'Equations & Functions',
      'الرياضيات', 'Mathematics',
      'أن يحل الطالب المعادلات الخطية ذات المتغير الواحد', 'Student will solve linear equations with one variable',
      'يحدد قيمة المجهول جبرياً وبيانياً', 'Identifies the unknown variable algebraically and graphically',
      'المعادلات الجبرية', 'Algebraic Equations',
      'المعادلات الخطية', 'Linear Equations',
      'عزل المتغير وتبسيط المعادلة', 'Isolating Variables & Simplifying Equations',
      'Easy',
      'DOK 1',
      'Remember',
      'نسيان تغيير الإشارة عند النقل للطرف الآخر', 'Forgetting to flip signs across equation sides',
      '1 min'
    ]);
    return rows;
  }

  for (const question of list) {
    rows.push([
      question.id || '',
      question.course || question.courseTitle || '',
      question.courseEn || question.courseTitleEn || '',
      question.section || '',
      question.sectionEn || '',
      question.domain || '',
      question.domainEn || '',
      question.learningOutcome || question.standard || '',
      question.learningOutcomeEn || question.standardEn || '',
      question.indicator || '',
      question.indicatorEn || '',
      question.skill || '',
      question.skillEn || '',
      question.subskill || '',
      question.subskillEn || '',
      question.microSkill || '',
      question.microSkillEn || '',
      question.level || 'Medium',
      normalizeDok(question.dok) || question.dok || 'DOK 2',
      question.cognitive || 'Apply',
      question.errorPattern || '',
      question.errorPatternEn || '',
      question.estimatedTime || '2 mins',
    ]);
  }

  return rows;
}

export function buildCourseMetadataTemplateRows(language: string = 'ar') {
  const isEn = language === 'en';
  const headers = [
    isEn ? 'Lesson Title (Ar)' : 'عنوان الدرس بالعربية',
    isEn ? 'Lesson Title (En)' : 'عنوان الدرس بالإنجليزية',
    isEn ? 'Domain (Ar)' : 'المجال بالعربية',
    isEn ? 'Domain (En)' : 'المجال بالإنجليزية',
    isEn ? 'Standard (Ar)' : 'المعيار بالعربية',
    isEn ? 'Standard (En)' : 'المعيار بالإنجليزية',
    isEn ? 'Indicator (Ar)' : 'المؤشر بالعربية',
    isEn ? 'Indicator (En)' : 'المؤشر بالإنجليزية',
    isEn ? 'Outcome (Ar)' : 'ناتج التعلم بالعربية',
    isEn ? 'Outcome (En)' : 'ناتج التعلم بالإنجليزية',
  ];

  return [
    headers,
    [
      'مقدمة في علم الفيزياء', 'Introduction to Physics',
      'الفيزياء', 'Physics',
      'المعيار 1: المفاهيم الفيزيائية الأساسية', 'Standard 1: Basic Physical Concepts',
      'المؤشر 1: يحدد الكميات القياسية والمتجهة', 'Indicator 1: Identifies scalar and vector quantities',
      'يميز الطالب بين الكمية القياسية والكمية المتجهة بدقة', 'Student distinguishes between scalar and vector quantities accurately'
    ],
    [
      'قوانين الحركة والسرعة', 'Laws of Motion and Velocity',
      'الميكانيكا', 'Mechanics',
      'المعيار 2: الحركة في خط مستقيم', 'Standard 2: Linear Motion',
      'المؤشر 2: يحسب السرعة والتسارع من الرسوم البيانية', 'Indicator 2: Calculates velocity and acceleration from graphs',
      'يحل الطالب مسائل حسابية على معادلات الحركة بتسارع ثابت', 'Student solves problems on motion equations with constant acceleration'
    ],
    [
      'التركيب الذري والجدول الدوري', 'Atomic Structure & Periodic Table',
      'الكيمياء', 'Chemistry',
      'المعيار 3: بنية المادة والروابط', 'Standard 3: Matter Structure and Bonds',
      'المؤشر 3: يربط بين موقع العنصر وخواصه الكيميائية', 'Indicator 3: Links element position with chemical properties',
      'يستنتج الطالب السلوك الكيميائي للعناصر بناء على إلكترونات التكافؤ', 'Student infers chemical behavior of elements based on valence electrons'
    ]
  ];
}
