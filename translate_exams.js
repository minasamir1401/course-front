const fs = require('fs');
const path = require('path');

const files = [
  'c:/Users/Administrator/Desktop/porj/corse/lms-platform/frontend/src/app/super-admin/exams/edit/[id]/page.tsx',
  'c:/Users/Administrator/Desktop/porj/corse/lms-platform/frontend/src/app/super-admin/exams/new/page.tsx',
  'c:/Users/Administrator/Desktop/porj/corse/lms-platform/frontend/src/app/school-admin/exams/edit/[id]/page.tsx',
  'c:/Users/Administrator/Desktop/porj/corse/lms-platform/frontend/src/app/school-admin/exams/new/page.tsx'
];

const translations = [
  ['dir="ltr"', 'dir="rtl"'],
  [' pb-20 ltr"', ' pb-20 rtl"'],
  [' md:p-10 ltr"', ' md:p-10 rtl"'],
  ['Edit Central Exam', 'تعديل الاختبار المركزي'],
  ['New Central Exam', 'اختبار مركزي جديد'],
  ['Edit Exam', 'تعديل الاختبار'],
  ['New Exam', 'اختبار جديد'],
  ['You are in advanced editing mode. Update scheduling, configurations, passwords, and slides/questions seamlessly.', 'أنت في وضع التعديل المتقدم. يمكنك تحديث الجدولة، الإعدادات، كلمات المرور، والأسئلة بسلاسة.'],
  ['Create a new comprehensive exam. Configure scheduling, passwords, and questions seamlessly.', 'إنشاء اختبار شامل جديد. قم بضبط الجدولة، كلمات المرور، والأسئلة بسلاسة.'],
  ['Save as Draft', 'حفظ كمسودة'],
  ['Save Changes', 'حفظ التغييرات'],
  ['Publish Exam', 'نشر الاختبار'],
  ['General Settings', 'الإعدادات العامة'],
  ['Subjects', 'المواد الدراسية'],
  ['You can select multiple subjects for this exam.', 'يمكنك اختيار أكثر من مادة لهذا الاختبار.'],
  ['Grade Levels', 'المراحل الدراسية'],
  ['Duration (min)', 'المدة (بالدقائق)'],
  ['Exam Password (Optional)', 'كلمة مرور الاختبار (اختياري)'],
  ['Skill', 'المهارة'],
  ['Result Visibility Policy', 'سياسة عرض النتائج'],
  ['Score Only', 'الدرجة فقط'],
  ['Student will only see their total score', 'سيرى الطالب مجموع درجاته فقط'],
  ['Show Correct Answers', 'عرض الإجابات الصحيحة'],
  ['Student can review each question with the correct model answer', 'يمكن للطالب مراجعة كل سؤال مع نموذج الإجابة الصحيح'],
  ['Show Correct/Incorrect Only', 'عرض صح/خطأ فقط'],
  ['Student will see which answers were right or wrong, but not the correct model', 'سيرى الطالب الإجابات الصحيحة والخاطئة، ولكن ليس نموذج الإجابة الصحيح'],
  ['Hide All Results', 'إخفاء جميع النتائج'],
  ['No results will be shown until you change this policy', 'لن يتم عرض أي نتائج حتى تقوم بتغيير هذه السياسة'],
  ['Distribution Scope', 'نطاق التوزيع'],
  ['>Central<', '>مركزي<'],
  ['>Schools<', '>مدارس<'],
  ['Select Target Schools:', 'اختر المدارس المستهدفة:'],
  ['Hold Ctrl for multiple selections', 'اضغط Ctrl لاختيار أكثر من مدرسة'],
  ['"Select All"', '"تحديد الكل"'],
  ['"Clear All"', '"إلغاء التحديد"'],
  ['Availability Dates', 'مواعيد الإتاحة'],
  ['Start Date & Time', 'تاريخ ووقت البدء'],
  ['End Date & Time', 'تاريخ ووقت الانتهاء'],
  ['Exam Title', 'عنوان الاختبار'],
  ['Enter exam title here...', 'أدخل عنوان الاختبار هنا...'],
  ['Exam Slides', 'شرائح الاختبار'],
  [' total points', ' إجمالي النقاط'],
  ['Import Excel', 'استيراد إكسيل'],
  ['Template', 'نموذج'],
  ['Text Slide', 'شريحة نصية'],
  ['Question Slide', 'شريحة سؤال'],
  ['No slides yet', 'لا توجد شرائح بعد'],
  ['Start by adding your first text slide or question slide for this exam.', 'ابدأ بإضافة أول شريحة نصية أو سؤال لهذا الاختبار.'],
  ['Add Text Slide', 'إضافة شريحة نصية'],
  ['Add Question Slide', 'إضافة سؤال'],
  [' point"', ' نقطة"'],
  [' points"', ' نقاط"'],
  [' title="Student Preview"', ' title="معاينة الطالب"'],
  [' title="Edit"', ' title="تعديل"'],
  [' title="Delete"', ' title="حذف"'],
  [' title="Expand"', ' title="توسيع"'],
  [' title="Collapse"', ' title="طي"'],
  ['Slide Content:', 'محتوى الشريحة:'],
  ['Learning Outcome:', 'ناتج التعلم:'],
  ['Options:', 'الخيارات:'],
  ['Content slide (No answers required)', 'شريحة محتوى (لا تتطلب إجابات)'],
  ['Loading exam details...', 'جاري تحميل تفاصيل الاختبار...'],
  ['Saving...', 'جاري الحفظ...'],
  ['Please enter the exam title', 'يرجى إدخال عنوان الاختبار'],
  ['Please select at least one subject', 'يرجى اختيار مادة واحدة على الأقل'],
  ['Please add at least one question or slide', 'يرجى إضافة سؤال أو شريحة واحدة على الأقل'],
  ['Exam updated successfully!', 'تم تحديث الاختبار بنجاح!'],
  ['Exam created successfully!', 'تم إنشاء الاختبار بنجاح!']
];

for (const filePath of files) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    for (const [eng, ar] of translations) {
      content = content.split(eng).join(ar);
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Translated ${path.basename(filePath)}`);
  }
}
