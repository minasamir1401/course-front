import * as XLSX from 'xlsx';
export function downloadSkillTemplate() {
  const rows = [{title:'Example activity', questionText:'What is 2 + 2?', type:'MCQ', options:'["3","4","5","6"]', correctAnswer:'B', points:10, xpPoints:10, difficulty:'Medium', estimatedTime:60, hint:'', explanation:'2 + 2 = 4'}];
  const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Activities'); XLSX.writeFile(workbook, 'activities-template.xlsx');
}
export function downloadSkillMetadataTemplate() {
  const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{standards:'', indicators:'', outcomes:''}]), 'Standards'); XLSX.writeFile(workbook, 'skill-standards-template.xlsx');
}
export async function readSkillMetadata(file: File) {
  if (file.size > 5 * 1024 * 1024) throw new Error('Maximum file size: 5 MB');
  const workbook = XLSX.read(await file.arrayBuffer(), {type:'array'});
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]]);
  const result = {standards: [] as string[], indicators: [] as string[], outcomes: [] as string[]};
  if (!rows.length || !rows.some(row => ['standards','indicators','outcomes'].some(key => key in row))) throw new Error('Use the standards template');
  for (const key of ['standards','indicators','outcomes'] as const) result[key] = [...new Set(rows.map(row => String(row[key] ?? '').trim()).filter(Boolean))];
  return result;
}
