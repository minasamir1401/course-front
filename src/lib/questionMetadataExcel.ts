import { questionMetadataFields } from './bilingualMetadata';
import { metadataColumn } from './lessonMetadataExcel';
import { normalizeDok } from './examQuestionMetadata';
export function applyQuestionMetadataRows(rows: unknown[][], questions: any[]) {
  if (rows.length < 2) throw new Error('الملف فارغ / Empty workbook');
  const headers = rows[0].map(value => String(value ?? '').trim().toLowerCase());
  const idColumn = headers.findIndex(h => /question id|معرف|رقم السؤال/.test(h) || h === 'id');
  const fields = questionMetadataFields.flatMap(field => [false, true].map(en => {
    const lookup = field === 'standard' ? 'standards' : field === 'indicator' ? 'indicators' : field === 'learningOutcome' ? 'learningOutcomes' : field;
    return { field: field + (en ? 'En' : ''), column: metadataColumn(headers, lookup, en) };
  }));
  for (const [field, pattern] of [['level', /difficulty|صعوبة|^level$|^المستوى$/], ['dok', /dok|عمق/], ['cognitive', /cognitive|معرفي/], ['estimatedTime', /estimated.*time|وقت/]] as const) fields.push({field, column: headers.findIndex(h => pattern.test(h))});
  if (!fields.some(item => item.column >= 0)) throw new Error('أعمدة Metadata غير صالحة / Invalid metadata headers');
  const next = questions.map(question => ({ ...question }));
  const seen = new Set<number>();
  let position = 0;
  for (const row of rows.slice(1).filter(row => row.some(value => String(value ?? '').trim()))) {
    const id = idColumn >= 0 ? String(row[idColumn] ?? '').trim() : '';
    const index = id ? questions.findIndex(q => String(q.id) === id) : position;
    if (index < 0 || index >= next.length || seen.has(index)) throw new Error('معرف سؤال غير مطابق أو مكرر؛ أعد التصدير / Unknown or duplicate question; export again');
    seen.add(index); position++;
    for (const {field, column} of fields) if (column >= 0) {
      const value = String(row[column] ?? '').trim();
      next[index][field] = field === 'dok' ? normalizeDok(value) : value;
    }
    for (const suffix of ['', 'En']) {
      const outcome = fields.find(f => f.field === 'learningOutcome' + suffix)!;
      const standard = fields.find(f => f.field === 'standard' + suffix)!;
      if (outcome.column >= 0 && standard.column < 0) next[index]['standard' + suffix] = next[index]['learningOutcome' + suffix];
      if (standard.column >= 0 && outcome.column < 0) next[index]['learningOutcome' + suffix] = next[index]['standard' + suffix];
    }
  }
  return next;
}
