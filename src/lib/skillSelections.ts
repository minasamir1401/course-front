export function parseSelection(value: unknown): string[] {
  if (typeof value === 'string') { try { value = JSON.parse(value); } catch { value = [value]; } }
  return Array.isArray(value) ? [...new Set(value.filter((v): v is string => typeof v === 'string' && !!v.trim()).map(v => v.trim()))] : [];
}
