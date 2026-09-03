const DEFAULT_OPTIONS = ['', '', '', ''];

/**
 * Normalizes legacy API values before an MCQ editor treats them as a list.
 */
export function normalizeQuestionOptions(value: unknown, fallback = DEFAULT_OPTIONS): string[] {
  if (Array.isArray(value)) {
    return value.map((option) => String(option ?? ''));
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return normalizeQuestionOptions(parsed, fallback);
    } catch {
      return [...fallback];
    }
  }

  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).map((option) => String(option ?? ''));
  }

  return [...fallback];
}
