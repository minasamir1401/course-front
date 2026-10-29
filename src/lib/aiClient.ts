import { apiFetch } from './api';

export async function aiRequest(path: string, body?: unknown, method?: string) {
  const response = await apiFetch(`/api/ai${path}`, {
    method: method || (body === undefined ? 'GET' : 'POST'), credentials: 'include',
    ...(body !== undefined ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'تعذر الاتصال بالمساعد. حاول مجددًا.');
  return data;
}

export function studentAssistantAllowed(pathname: string): boolean {
  if (/^\/(?:exams|assessments|skills|skills-hub|activities|games|competitions|quizzes|evaluations)(?:\/|$)/.test(pathname)) return false;
  return /^\/(?:dashboard|courses|lessons|calendar|reports|messages|profile|settings|certificates|notifications|leaderboard|assistant)(?:\/|$)/.test(pathname);
}

export type AiEvidence = {
  sampleSize: number; strengths: Array<{ name: string; percent: number; total: number }>;
  needsPractice: Array<{ name: string; percent: number; total: number; evidenceLevel: string }>;
  nextLessons: Array<{ id: string; title: string; courseTitle: string; href: string }>;
  recentExams: Array<{ title: string; percentage: number | null; date: string }>;
  completedLessons: number; availableLessons: number; explanation: string;
};
