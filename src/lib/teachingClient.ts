import { API_URL, apiFetch } from './api';
export async function teachingRequest(path: string, init: RequestInit = {}) {
  const response = await apiFetch(API_URL + path, { ...init, cache: 'no-store', headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'تعذر تحميل البيانات. / Could not load records.');
  return data;
}
