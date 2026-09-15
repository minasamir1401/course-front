import * as XLSX from 'xlsx';
import { planQuestionImport, questionExportRows, questionTemplateRows } from './questionExcelSync';

export function buildQuestionWorkbook(questions: any[] | null, language: string = 'ar') {
  const wb = XLSX.utils.book_new();
  const rows = questions ? questionExportRows(questions, language) : questionTemplateRows(language);
  const sheet = XLSX.utils.aoa_to_sheet(rows);

  sheet['!cols'] = rows[0].map((_: unknown, i: number) => {
    if (i === 0) return { wch: 25 }; // Question ID
    if (i === 1) return { wch: 15 }; // Action
    if (i === 2 || i === 3) return { wch: 45 }; // Question Text (Ar & En)
    if (i === 4) return { wch: 20 }; // Question Type
    if (i >= 5 && i <= 14) return { wch: 25 }; // Options 1-5 (Ar & En)
    if (i >= 15 && i <= 18) return { wch: 28 }; // Correct Answers (Ar & En)
    if (i === 19) return { wch: 12 }; // Points
    if (i === 20) return { wch: 25 }; // Video URL
    return { wch: 40 }; // Explanations (Ar & En)
  });

  XLSX.utils.book_append_sheet(wb, sheet, 'Questions');

  const instructionsData = language === 'ar' ? [
    ['دليل إرشادات تعبئة قالب الأسئلة ثنائي اللغة (Bilingual Questions Guide)'],
    ['1. اللغتان معاً: يمكنك كتابة نص السؤال والخيارات والتفسير بالعربية والإنجليزية في نفس الصف ليتمكن الطالب من التبديل بين اللغتين فورياً.'],
    ['2. نوع السؤال (Question Type): يدعم القالب: MCQ (اختيار من متعدد)، TRUE_FALSE (صح وخطأ)، MULTI_SELECT (اختيارات متعددة)، TEXT (مقالي).'],
    ['3. الإجابة الصحيحة: يمكنك كتابة نص الإجابة مباشرة، أو كتابة رقم الخيار (1 أو 2 أو 3 أو 4) وسيقوم النظام بمطابقة اللغتين تلقائياً.'],
    ['4. صح وخطأ (TRUE_FALSE): اكتب صحيح أو خطأ (أو True / False) في عمود الإجابة الصحيحة.'],
    ['5. اختيارات متعددة (MULTI_SELECT): اكتب الإجابات في عمود الإجابات المتعددة مثل: ["خيار 1", "خيار 2"] أو أرقام الخيارات 1, 3.'],
    ['6. إضافة أو تعديل: لإضافة أسئلة جديدة اترك Question ID فارغاً واكتب ADD في Action. لتعديل أسئلة حافظ على الـ Question ID.'],
    ['7. حذف سؤال: اكتب DELETE في عمود Action لحذف السؤال عند إعادة الرفع.'],
    ['8. الميتا داتا والتصنيفات: يدعم النظام إضافة أعمدة الميتا داتا (المجال، المهارة، المؤشر، عمق المعرفة DOK، الصعوبة) بالعربية أو الإنجليزية في نفس الملف، أو استخدام نموذج الميتا داتا المتقدم ثنائي اللغة.']
  ] : [
    ['Bilingual Questions Template Guide (دليل تعبئة الأسئلة)'],
    ['1. Dual Languages: You can fill question text, options, and explanations in both Arabic and English in the same row.'],
    ['2. Question Types: Supports MCQ, TRUE_FALSE, MULTI_SELECT, and TEXT.'],
    ['3. Correct Answer: You can write the answer text or the option number (1, 2, 3, 4) and both languages will be matched automatically.'],
    ['4. TRUE_FALSE: Write True or False (or صحيح / خطأ) in the Correct Answer column.'],
    ['5. MULTI_SELECT: Write the answers in Correct Answers column e.g. ["Option 1", "Option 2"] or option numbers: 1, 3.'],
    ['6. Add or Update: Leave Question ID blank and set Action to ADD for new questions. Keep Question ID when updating.'],
    ['7. Delete: Set Action to DELETE to remove a question upon import.'],
    ['8. Metadata & Taxonomies: You can optionally add metadata columns (Domain, Skill, Indicator, DOK, Difficulty) in Arabic or English directly in this sheet, or use the dedicated Advanced Metadata Template.']
  ];

  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
  instructionsSheet['!cols'] = [{ wch: 120 }];
  instructionsSheet['!rows'] = Array.from({ length: instructionsData.length }, () => ({ hpt: 26 }));
  XLSX.utils.book_append_sheet(wb, instructionsSheet, 'Instructions');

  if (questions) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Question Sync v1'],
      ['Question ID'],
      ...questions.map(q => [String(q.id ?? '')]).filter(r => r[0]),
    ]), 'Sync IDs');
  }

  return wb;
}

export function readQuestionImport(wb: XLSX.WorkBook, current: any[], canDelete: boolean, language: string) {
  const sheet = wb.Sheets.Questions || wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
  let exportedIds: string[] | undefined;
  if (wb.Sheets['Sync IDs']) {
    const manifest = XLSX.utils.sheet_to_json<any[]>(wb.Sheets['Sync IDs'], { header: 1, defval: '' });
    if (manifest[0]?.[0] !== 'Question Sync v1' || manifest[1]?.[0] !== 'Question ID') {
      throw new Error(language === 'ar' ? 'ورقة Sync IDs غير صالحة. أعد التصدير.' : 'Invalid Sync IDs sheet. Export again.');
    }
    exportedIds = manifest.slice(2).map(r => String(r[0] ?? '').trim()).filter(Boolean);
    if (new Set(exportedIds).size !== exportedIds.length) throw new Error('Duplicate Sync IDs / أرقام مزامنة مكررة');
  }
  return planQuestionImport(rows, current, { canDelete, exportedIds, language });
}

export async function importModuleQuestions(
  e: { target: HTMLInputElement },
  subIndex: number | null,
  source: 'questions' | 'assignments',
  getContext: () => any,
  canDelete: boolean,
) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  const start = getContext();
  const { language = 'ar', showToast } = start;
  const snapshot = JSON.stringify(start.currentModule);
  const scope = JSON.stringify([start.moduleId, start.subExamId, start.activeSubExamIndex]);
  try {
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const ctx = getContext();
    if (ctx.isLoadingQuestions || JSON.stringify(ctx.currentModule) !== snapshot ||
        JSON.stringify([ctx.moduleId, ctx.subExamId, ctx.activeSubExamIndex]) !== scope) {
      throw new Error(language === 'ar' ? 'تغيرت القائمة أثناء قراءة الملف. حاول الاستيراد مرة أخرى.' : 'The list changed while reading. Import again.');
    }
    const child = source === 'questions' && subIndex != null;
    const target = child ? ctx.currentModule.subExams?.[subIndex] : ctx.currentModule;
    if (!target) throw new Error(language === 'ar' ? 'الاختبار المحدد غير موجود.' : 'Selected exam no longer exists.');
    const plan = readQuestionImport(wb, target[source] || [], canDelete, language);
    const summary = language === 'ar'
      ? `مراجعة الاستيراد: إضافة ${plan.added}، تعديل ${plan.updated}، حذف ${plan.deletedIds.length}، بدون تغيير ${plan.unchanged}.\nهل تريد تطبيق هذه التغييرات؟`
      : `Import preview: ${plan.added} added, ${plan.updated} updated, ${plan.deletedIds.length} deleted, ${plan.unchanged} unchanged.\nApply these changes?`;
    if (!window.confirm(summary)) return;
    ctx.setCurrentModule((prev: any) => child
      ? { ...prev, subExams: prev.subExams.map((s: any, i: number) => i === subIndex ? { ...s, [source]: plan.questions } : s) }
      : { ...prev, [source]: plan.questions });
    if (source === 'questions' && plan.deletedIds.length) {
      ctx.setDeletedQuestionIds?.((prev: string[]) => [...new Set([...prev, ...plan.deletedIds])]);
    }
    showToast(language === 'ar' ? 'تم تطبيق تغييرات الملف في المحرر بنجاح. تابع حالة الحفظ.' : 'Workbook changes applied in the editor. Check save status.', 'success');
  } catch (error) {
    showToast(error instanceof Error ? error.message : String(error), 'error');
  }
}
