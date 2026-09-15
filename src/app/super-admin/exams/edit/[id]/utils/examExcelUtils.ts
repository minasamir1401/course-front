import * as XLSX from 'xlsx';
import { buildCourseMetadataTemplateRows } from '@/lib/examExcelTemplates';
export { exportQuestionsToExcel, downloadQuestionsTemplate, parseQuestionsFromExcel } from '@/lib/examExcelDownloads';

export const downloadMetadataTemplate = (language: string, showToast: (msg: string, type: string) => void) => {
  const wsData = buildCourseMetadataTemplateRows(language);
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Metadata Template");
  XLSX.writeFile(wb, "course_metadata_template.xlsx");
  showToast(language === 'ar' ? "تم تحميل نموذج المعايير بنجاح" : "Metadata template downloaded successfully", "success");
};
