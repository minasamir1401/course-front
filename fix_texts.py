import os

files = [
    r'd:\mina\front\src\app\super-admin\exams\new\page.tsx',
    r'd:\mina\front\src\app\super-admin\exams\edit\[id]\page.tsx',
    r'd:\mina\front\src\app\school-admin\exams\new\page.tsx',
    r'd:\mina\front\src\app\school-admin\exams\edit\[id]\page.tsx'
]

replacements = [
    (
        "{t('courseCreate.title')}",
        "{language === 'ar' ? 'إنشاء تقييم جديد' : 'Create New Exam'}"
    ),
    (
        "{t('courseCreate.subtitle')}",
        "{language === 'ar' ? 'صمم تجربة تقييم متكاملة لطلابك' : 'Design a complete assessment experience for your students'}"
    ),
    (
        "{t('courseCreate.courseSettings')}",
        "{language === 'ar' ? 'إعدادات التقييم' : 'Exam Settings'}"
    ),
    (
        "{t('courseCreate.coverImage') || \"Exam Cover Image\"}",
        "{language === 'ar' ? 'صورة غلاف التقييم' : 'Exam Cover Image'}"
    ),
    (
        "{t('courseCreate.courseTitle')}",
        "{language === 'ar' ? 'عنوان التقييم' : 'Exam Title'}"
    ),
    (
        "{t('courseCreate.titlePlaceholder')}",
        "language === 'ar' ? 'مثال: الرياضيات المتقدمة' : 'e.g. Advanced Mathematics'"
    ),
    (
        "{t('courseCreate.courseDesc')}",
        "{language === 'ar' ? 'وصف التقييم' : 'Exam Description'}"
    ),
    (
        "{t('courseCreate.descPlaceholder')}",
        "language === 'ar' ? 'نبذة مختصرة عن التقييم...' : 'Brief description of the exam...'"
    ),
    (
        "(language === 'ar' ? 'حفظ ونشر الكورس' : 'Save & Publish Course')",
        "(language === 'ar' ? 'حفظ ونشر التقييم' : 'Save & Publish Exam')"
    ),
    (
        "'هيكل الموديولات'",
        "'هيكل الأقسام'"
    ),
    (
        "'Modules Structure'",
        "'Sections Structure'"
    ),
    (
        "'قم ببناء هيكل الكورس من خلال إضافة موديولات ودروس.'",
        "'قم ببناء التقييم من خلال إضافة أقسام وأسئلة.'"
    ),
    (
        "'Build the course structure by adding modules and lessons.'",
        "'Build the exam structure by adding sections and questions.'"
    ),
    (
        "'إضافة موديول جديد'",
        "'إضافة قسم جديد'"
    ),
    (
        "'Add New Module'",
        "'Add New Section'"
    ),
    (
        "'الأسئلة المستقلة'",
        "'أسئلة إضافية'"
    ),
    (
        "'Standalone Questions'",
        "'Additional Questions'"
    )
]

for f in files:
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        for old, new in replacements:
            content = content.replace(old, new)
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print('Updated ' + f)
