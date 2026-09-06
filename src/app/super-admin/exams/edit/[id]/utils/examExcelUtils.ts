import * as XLSX from 'xlsx';
export { exportQuestionsToExcel, downloadQuestionsTemplate, parseQuestionsFromExcel } from '@/lib/examExcelDownloads';

export const downloadMetadataTemplate = (language: string, showToast: (msg: string, type: string) => void) => {
  const wsData = [
    ["Module Title", "Standard", "Indicator", "Outcome", "Domain"],
    ["مقدمة في الفيزياء", "Standard 1: Understanding & Comprehension", "Indicator 1: Identifies Basic Concepts", "Outcome 1: Student will be able to...", "الفيزياء"],
    ["مقدمة في الفيزياء", "Standard 2: Application & Analysis", "Indicator 2: Applies Mathematical Laws", "Outcome 2: Student will distinguish between...", "الفيزياء"],
    ["الحركة الموجية", "Standard 3: Critical Thinking", "Indicator 3: Infers Relationships", "Outcome 3: Student will analyze...", "الفيزياء"]
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Metadata Template");
  XLSX.writeFile(wb, "course_metadata_template.xlsx");
  showToast(language === 'ar' ? "تم تحميل نموذج المعايير بنجاح" : "Metadata template downloaded successfully", "success");
};
