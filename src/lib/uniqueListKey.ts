export function getUniqueListKey(id: unknown, index: number, seen: Map<string, number>): string {
  const base = id === undefined || id === null || id === '' ? `row-${index}` : String(id);
  const occurrence = seen.get(base) || 0;
  seen.set(base, occurrence + 1);
  return occurrence === 0 ? base : `${base}-${occurrence}`;
}
