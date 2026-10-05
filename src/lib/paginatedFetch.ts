import { apiFetch } from './api';
/** Load every bounded page for screens whose search/export covers the complete school. */
export async function fetchAllPages(url: string, field: string, init?: RequestInit, fetcher = apiFetch): Promise<any[]> {
  const base = new URL(url, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
  const result: any[] = [], ids = new Set<string>();
  for (let page = 1; ; page++) {
    const target = new URL(base); target.searchParams.set('page', String(page)); target.searchParams.set('limit','200');
    const res = await fetcher(target.toString(), init);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Could not load list');
    const data = await res.json(); const rows = Array.isArray(data) ? data : data[field];
    if (!Array.isArray(rows)) throw new Error('Invalid list response');
    let added = 0;
    for (const row of rows) { if (row.id && ids.has(row.id)) continue; if (row.id) ids.add(row.id); result.push(row); added++; }
    const pagination = data.pagination;
    if (Array.isArray(data) || !pagination || !rows.length || page >= Number(pagination.totalPages ?? pagination.pages) || pagination.hasMore === false) return result;
    if (!added) throw new Error('List pagination did not advance');
  }
}
