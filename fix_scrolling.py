import re

files = [
    "src/app/activities/page.tsx",
    "src/app/super-admin/skills-hub/edit/page.tsx",
    "src/app/school-admin/skills-hub/edit/page.tsx"
]

for file_path in files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Update <main>
    # Note: activities page might have slightly different classes, so let's match both
    old_main_1 = 'className="flex-1 flex flex-col lg:flex-row gap-6 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-[1600px] w-full mx-auto"'
    old_main_2 = 'className="flex-1 flex flex-col lg:flex-row gap-6 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-[1600px] w-full mx-auto"' # same
    new_main = 'className="flex-1 flex flex-col gap-6 p-2 sm:p-4 md:p-6 overflow-hidden max-w-[1600px] w-full mx-auto"'
    
    # Actually, in activities/page.tsx we already removed lg:flex-row? No, we didn't!
    content = content.replace(old_main_1, new_main)

    # 2. Update <section>
    old_section_1 = 'className="flex-1 bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 flex flex-col justify-between shadow-sm overflow-hidden min-h-[500px]"'
    old_section_2 = 'className="flex-1 bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 flex flex-col justify-between shadow-sm overflow-hidden min-h-[500px]"'
    new_section = 'className="flex-1 bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 md:p-8 flex flex-col shadow-sm overflow-hidden min-h-0"'
    content = content.replace(old_section_1, new_section)
    
    # 3. Add scroll wrapper inside section
    if '<div className="flex-1 overflow-y-auto' not in content:
        content = content.replace(
            new_section + '>', 
            new_section + '>\n<div className="flex-1 overflow-y-auto min-h-0 pe-2 pb-4 flex flex-col gap-6 w-full">'
        )
        content = content.replace('<footer className=', '</div>\n<footer className=')
        
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    
    print(f"Updated {file_path}")
