export function buildMasterReferenceGuideRows(language: string = 'ar'): any[][] {
  const isEn = language === 'en';
  if (isEn) {
    return [
      ['Section / Topic', 'Rule / Format', 'Example / Values'],
      ['1. Workbook Structure (Full Backup)', 'A complete lesson/course backup uses multiple sheets: Metadata, Slides, Questions, Assignments, Reference Guide.', 'Never rename sheet tabs if importing back as a full lesson.'],
      ['2. Dual Language (Arabic & English)', 'Every row has parallel (Ar) and (En) columns so students can switch languages seamlessly.', 'Fill Title (Ar) & Title (En), Content (Ar) & Content (En), Options (Ar) & Options (En).'],
      ['3. Slide Block Types (Block Type)', 'Use TEXT for explanation/reading/example slides, or QUESTION for an inline question inside the explanation.', 'TEXT or QUESTION'],
      ['4. Text Slide Kinds (Slide Kind for TEXT)', 'Allowed values when Block Type is TEXT:', 'CONTENT, EXAMPLE, SUMMARY, HINT, EXPLANATION'],
      ['5. Tables Inside Slides or Questions', 'Use the Table (Ar) / Table (En) column with vertical bars | to separate columns and new lines (Alt+Enter) for rows. First row becomes the table header.', 'Concept | Definition | Unit\nForce | Push or pull on an object | Newton\nMass | Amount of matter | kg'],
      ['6. Alternative Inline Table Syntax', 'You can also embed a table directly inside Explanation Content using [TABLE] ... [/TABLE] tags.', '[TABLE]\nStep | Action\n1 | Read formula\n2 | Substitute values\n[/TABLE]'],
      ['7. Equations & Math (KaTeX)', 'Wrap formulas in single $ for inline math or $$ for block math.', '$E = mc^2$ or $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$'],
      ['8. Standard Question Types', 'Supported in both Slides (Block Type = QUESTION) and Questions / Assignments sheets:', 'MCQ, TRUE_FALSE, MULTI_SELECT, TEXT (or ESSAY)'],
      ['8a. MCQ Example', 'Put 2-5 options in Option 1..5 (Ar/En) and the exact text or 1-based option number (1-5) in Correct Answer.', 'Question Type: MCQ | Options: 2, 3, 4, 5 | Correct Answer: 3 (or index 2)'],
      ['8b. TRUE_FALSE Example', 'Correct Answer can be True/False, T/F, or Arabic equivalents.', 'Question Type: TRUE_FALSE | Options: True, False | Correct Answer: True'],
      ['8c. MULTI_SELECT Example', 'Put multiple answers separated by commas or JSON array in Correct Answers (or Correct Answer).', 'Question Type: MULTI_SELECT | Correct Answers: ["JavaScript", "Python"] or 1, 3'],
      ['8d. TEXT / ESSAY Example', 'Open-ended answer question graded manually or via AI rubric. Leave Options empty.', 'Question Type: TEXT'],
      ['9. Interactive Question Types', 'Supported types in Slides / Questions:', 'MATCHING, GROUP_SORTING, DRAG_DROP_FILL, SEQUENCE_ORDER, SENTENCE_REORDER, WORD_SCRAMBLE, FLASH_CARD, CLOCK, NUMBER_LINE, MATH_EQUATION, COUNT_OBJECTS, IMAGE_LABEL, COLOR_MATCH, SWIPE_SORT, MEMORY_GAME, WORD_SEARCH, CROSSWORD, MIND_MAP, VIDEO_CHECKPOINT, GEOGEBRA, MAZE'],
      ['9a. MATCHING Syntax (Interactive Data)', 'Write Left = Right pairs separated by | or Alt+Enter.', 'Egypt = Cairo | France = Paris | Japan = Tokyo'],
      ['9b. GROUP_SORTING Syntax (Interactive Data)', 'Write GroupName: Item1, Item2 separated by | or Alt+Enter.', 'Metals: Iron, Copper | Non-Metals: Oxygen, Carbon'],
      ['9c. DRAG_DROP_FILL Syntax', 'Put the sentence with [___] blanks in Question/Content, choices in Option 1..5, and ordered answers in Correct Answers.', 'Sentence: Water boils at [___] C | Option 1: 100 | Option 2: 0 | Correct Answer: 100'],
      ['9d. SEQUENCE_ORDER / SENTENCE_REORDER', 'Put items in their correct order in Option 1..5 (or separated by | in Interactive Data).', 'Option 1: Step 1 | Option 2: Step 2 | Option 3: Step 3'],
      ['9e. FLASH_CARD Syntax', 'Write Front = Back pairs separated by | or Alt+Enter.', 'H2O = Water | NaCl = Table Salt'],
      ['9f. CLOCK / NUMBER_LINE / MATH_EQUATION', 'For CLOCK set Correct Answer to HH:MM (e.g. 03:30). For NUMBER_LINE / MATH_EQUATION put Correct Answer and optional choices.', 'CLOCK -> Correct Answer: 03:30'],
      ['10. Dynamic Helper Sections', 'Sections JSON stores extra HINT, TIP, EXPLANATION, FEEDBACK, WARNING, KEY_INSIGHT blocks, or you can write plain Explanation (Ar/En).', '[{"type":"HINT","content":"Remember the unit","contentEn":"Remember the unit"}]'],
      ['11. Safe Backup & Restore Rules', 'Leave Slide ID / Question ID blank or Action = ADD to add new rows. Keep exported IDs with Action = UPDATE to update safely. Exporting preserves hidden IDs and JSON backup.', 'Course Excel Template also supports multi-sheet Course Data + Slides Backup + Questions Backup.'],
    ];
  }

  return [
    ['القسم / الموضوع', 'القاعدة / الصيغة المطلوبة', 'مثال عملي / القيم المدعومة'],
    ['1. هيكل ملف النسخ الاحتياطي الكامل', 'ملف الدرس الشامل يحتوي على عدة أوراق: Metadata (البيانات والمعايير)، Slides (شرائح الشرح)، Questions (التدريبات)، Assignments (الواجبات)، Reference Guide (هذا الدليل).', 'لا تغيّر أسماء أوراق العمل عند إعادة الاستيراد كدرس كامل.'],
    ['2. دعم اللغتين (عربي وإنجليزي)', 'كل صف يدعم عمود للعربية (Ar) وآخر للإنجليزية (En) في العناوين والشرح والخيارات والميتاداتا ليتمكن الطالب من تبديل اللغة.', 'املأ Title (Ar) و Title (En) و Content (Ar) و Content (En) والخيارات باللغتين.'],
    ['3. نوع الشريحة الرئيسي (Block Type)', 'استخدم TEXT لشرائح الشرح والأمثلة والملخص، أو QUESTION لإضافة سؤال مدمج داخل الشرح.', 'TEXT أو QUESTION'],
    ['4. تصنيف شريحة الشرح (Slide Kind مع TEXT)', 'القيم المعتمدة عند اختيار TEXT:', 'CONTENT (محتوى)، EXAMPLE (مثال)، SUMMARY (ملخص)، HINT (ملاحظة)، EXPLANATION (شرح)'],
    ['5. كتابة الجداول داخل الشرائح بسهولة', 'اكتب الجدول في عمود Table (Ar) أو Table (En) باستخدام الرمز | للفصل بين الأعمدة و (Alt+Enter) لبدء صف جديد. الصف الأول يصبح رأس الجدول تلقائياً.', 'المفهوم | التعريف | الوحدة\nالقوة | مؤثر يغير حالة الجسم | نيوتن\nالكتلة | مقدار ما في الجسم | كيلوجرام'],
    ['6. صيغة بديلة للجدول داخل النص', 'يمكنك أيضاً كتابة الجدول مباشرة داخل عمود الشرح بين الوسمين [TABLE] و [/TABLE].', '[TABLE]\nالخطوة | الإجراء\n1 | اكتب القانون\n2 | عوّض بالقيم\n[/TABLE]'],
    ['7. كتابة المعادلات الرياضية (KaTeX)', 'ضع المعادلة داخل علامتي $ للمعادلة السطرية أو $$ للمعادلة المستقلة.', '$E = mc^2$ أو $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$'],
    ['8. أنواع الأسئلة الأساسية', 'تعمل في الشرائح المدمجة (QUESTION) وفي أوراق Questions و Assignments:', 'MCQ, TRUE_FALSE, MULTI_SELECT, TEXT (أو ESSAY)'],
    ['8أ. سؤال اختيار من متعدد (MCQ)', 'اكتب 2 إلى 5 خيارات في Option 1..5 واكتب نص الإجابة أو رقم الخيار (1-5) في Correct Answer.', 'Question Type: MCQ | Option 1..4 | Correct Answer: الرياض'],
    ['8ب. سؤال صح وخطأ (TRUE_FALSE)', 'اكتب صحيح أو خطأ أو True / False في عمود الإجابة الصحيحة.', 'Question Type: TRUE_FALSE | Correct Answer: True'],
    ['8ج. سؤال اختيارات متعددة (MULTI_SELECT)', 'اكتب الإجابات الصحيحة مفصولة بفاصلة أو أرقام الخيارات أو مصفوفة JSON.', 'Question Type: MULTI_SELECT | Correct Answers: ["جافاسكريبت", "بايثون"] أو 1, 3'],
    ['8د. سؤال مقالي (TEXT / ESSAY)', 'سؤال مفتوح الإجابة بدون خيارات. اترك أعمدة Option 1..5 فارغة.', 'Question Type: TEXT'],
    ['9. جميع أنواع الأسئلة التفاعلية المدعومة', 'الأنواع المدعومة في المحرر والإكسيل:', 'MATCHING, GROUP_SORTING, DRAG_DROP_FILL, SEQUENCE_ORDER, SENTENCE_REORDER, WORD_SCRAMBLE, FLASH_CARD, CLOCK, NUMBER_LINE, MATH_EQUATION, COUNT_OBJECTS, IMAGE_LABEL, COLOR_MATCH, SWIPE_SORT, MEMORY_GAME, WORD_SEARCH, CROSSWORD, MIND_MAP, VIDEO_CHECKPOINT, GEOGEBRA, MAZE'],
    ['9أ. التوصيل (MATCHING) في Interactive Data', 'اكتب كل زوج بصيغة: العنصر الأيمن = العنصر الأيسر، وافصل الأزواج بـ | أو سطر جديد.', 'مصر = القاهرة | السعودية = الرياض | اليابان = طوكيو'],
    ['9ب. تصنيف المجموعات (GROUP_SORTING)', 'اكتب اسم المجموعة متبوعاً بنقطتين : ثم عناصرها مفصولة بفاصلة، وافصل المجموعات بـ | أو سطر جديد.', 'الفلزات: حديد، نحاس | اللافلزات: أكسجين، كربون'],
    ['9ج. سحب الفراغات (DRAG_DROP_FILL)', 'اكتب الجملة مع [___] مكان الفراغ في النص، والخيارات في Option 1..5، والإجابة المرتبة في Correct Answer.', 'النص: يغلي الماء عند [___] درجة | Option 1: 100 | Option 2: 0 | Correct Answer: 100'],
    ['9د. الترتيب المتسلسل (SEQUENCE_ORDER / SENTENCE_REORDER)', 'اكتب الخطوات أو الكلمات بالترتيب الصحيح في Option 1..5 (أو مفصولة بـ | في Interactive Data).', 'Option 1: الخطوة الأولى | Option 2: الثانية | Option 3: الثالثة'],
    ['9هـ. البطاقات التعليمية (FLASH_CARD)', 'اكتب: الوجه الأمامي = الوجه الخلفي، وافصل البطاقات بـ | أو سطر جديد.', 'H2O = الماء | NaCl = ملح الطعام'],
    ['9و. الساعة وخط الأعداد (CLOCK / NUMBER_LINE)', 'في الساعة ضع الوقت المطلوب بصيغة HH:MM في Correct Answer (مثال 03:30).', 'CLOCK -> Correct Answer: 03:30'],
    ['10. الأقسام التفسيرية الإضافية (Dynamic Sections)', 'عمود Sections JSON يحفظ أقسام HINT / TIP / EXPLANATION / FEEDBACK / WARNING / KEY_INSIGHT، أو اكتب التفسير مباشرة في Explanation.', '[{"type":"HINT","content":"تذكر تحويل الوحدات","contentEn":"Remember unit conversion"}]'],
    ['11. قواعد النسخ الاحتياطي الآمن ومنع التكرار', 'اترك Slide ID / Question ID فارغاً (أو Action = ADD) لإضافة صفوف جديدة. عند تعديل ملف مصدّر حافظ على الـ IDs واضبط Action = UPDATE. عند تصدير الكورس كاملاً يتم تحديث الدروس بنفس الاسم بدون تكرار.', 'ملف الكورس المصدّر من قائمة الكورسات يحتوي أيضاً على أوراق Slides Backup و Questions Backup و Metadata Backup كاملة.'],
  ];
}
