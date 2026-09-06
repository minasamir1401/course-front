import * as XLSX from 'xlsx';
import { planQuestionImport, questionExportRows, questionTemplateRows } from './questionExcelSync';

export function buildQuestionWorkbook(questions: any[] | null, language: string) {
  const wb = XLSX.utils.book_new();
  const rows = questions ? questionExportRows(questions, language) : questionTemplateRows(language);
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = rows[0].map((_: unknown, i: number) => ({ wch: i === 2 ? 60 : i === 0 ? 38 : 22 }));
  XLSX.utils.book_append_sheet(wb, sheet, 'Questions');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    [language === 'ar' ? 'تعليمات تعديل الأسئلة' : 'Question editing instructions'],
    [questions
      ? (language === 'ar' ? 'ورقة Questions تحتوي أسئلتك الحالية. أعد رفع الملف بعد التعديل في نفس القائمة.' : 'Questions contains your current questions. Import the edited file into the same list.')
      : (language === 'ar' ? 'الأمثلة في ورقة Questions للتوضيح. استبدلها بأسئلتك قبل الرفع. لتعديل أسئلة موجودة استخدم زر تصدير الأسئلة للتعديل.' : 'Replace the example rows in Questions with your questions before uploading. To edit existing questions use Export questions for editing.')],
    [language === 'ar' ? 'عدّل البيانات مع الحفاظ على Question ID. للإضافة اتركه فارغًا واكتب ADD في Action.' : 'Keep Question ID when editing. To add: leave ID blank and set Action to ADD.'],
    [language === 'ar' ? 'لحذف سؤال اكتب DELETE في Action، أو احذف صفه من الملف المُصدّر. الحذف حسب الصلاحية وبعد مراجعة الملخص.' : 'To delete: set Action to DELETE, or remove its row from an exported workbook. Deletion requires permission and preview confirmation.'],
    [language === 'ar' ? 'لا تعدّل ورقة Sync IDs. الملفات القديمة بدونها لا تحذف الأسئلة الغائبة.' : 'Do not edit Sync IDs. Old files without it never delete omitted questions.'],
    [language === 'ar' ? 'القالب يدعم MCQ وTRUE_FALSE وMULTI_SELECT وTEXT. الأنواع المركبة تُعدّل من المحرر.' : 'Supports MCQ, TRUE_FALSE, MULTI_SELECT and TEXT. Edit complex types in the question editor.'],
    [language === 'ar' ? 'لـ MCQ اكتب الإجابة في Correct Answer. لـ MULTI_SELECT اكتب قائمة الإجابات في Correct Answers مثل ["2","4"]. الدرجة عدد صحيح موجب.' : 'For MCQ use Correct Answer. For MULTI_SELECT use Correct Answers, e.g. ["2","4"]. Points must be a positive integer.'],
  ]), 'Instructions');
  wb.Sheets.Instructions['!cols'] = [{ wch: 110 }];
  wb.Sheets.Instructions['!rows'] = Array.from({ length: 8 }, () => ({ hpt: 30 }));
  if (questions) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['Question Sync v1'], ['Question ID'], ...questions.map(q => [String(q.id ?? '')]).filter(r => r[0]),
  ]), 'Sync IDs');
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
  e: { target: HTMLInputElement }, subIndex: number | null, source: 'questions' | 'assignments',
  getContext: () => any, canDelete: boolean,
) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  const start = getContext();
  const { language, showToast } = start;
  const snapshot = JSON.stringify(start.currentModule);
  const scope = JSON.stringify([start.moduleId, start.subExamId, start.activeSubExamIndex]);
  try {
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const ctx = getContext();
    if (ctx.isLoadingQuestions || JSON.stringify(ctx.currentModule) !== snapshot ||
        JSON.stringify([ctx.moduleId, ctx.subExamId, ctx.activeSubExamIndex]) !== scope) {
      throw new Error(language === 'ar' ? 'تغيرت القائمة أثناء قراءة الملف. حاول الاستيراد مرة أخرى.' : 'The list changed while reading. Import again.');
    }
    // Assignments live on the module, not the sub-exam.
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
    showToast(language === 'ar' ? 'تم تطبيق تغييرات الملف في المحرر. تابع حالة الحفظ.' : 'Workbook changes applied in the editor. Check save status.', 'success');
  } catch (error) {
    showToast(error instanceof Error ? error.message : String(error), 'error');
  }
}
