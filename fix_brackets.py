import os

files = [
    r'd:\mina\front\src\app\super-admin\exams\new\page.tsx',
    r'd:\mina\front\src\app\super-admin\exams\edit\[id]\page.tsx',
    r'd:\mina\front\src\app\school-admin\exams\new\page.tsx',
    r'd:\mina\front\src\app\school-admin\exams\edit\[id]\page.tsx'
]

replacements = [
    (
        "placeholder=language === 'ar' ? 'مثال: الرياضيات المتقدمة' : 'e.g. Advanced Mathematics'",
        "placeholder={language === 'ar' ? 'مثال: الرياضيات المتقدمة' : 'e.g. Advanced Mathematics'}"
    ),
    (
        "placeholder=language === 'ar' ? 'نبذة مختصرة عن التقييم...' : 'Brief description of the exam...'",
        "placeholder={language === 'ar' ? 'نبذة مختصرة عن التقييم...' : 'Brief description of the exam...'}"
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
