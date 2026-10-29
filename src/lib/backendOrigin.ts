// Server-only configuration; never derive a credential destination from Host,
// forwarded headers or a user-supplied URL.
export function getBackendBase() {
  for (const key of ['INTERNAL_BACKEND_URL', 'NEXT_PUBLIC_BACKEND_ORIGIN', 'BACKEND_ORIGIN']) {
    const value = process.env[key]?.trim().replace(/\/+$/, '');
    if (value) return value.replace('localhost', '127.0.0.1');
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/"/g, '').trim();
  if (apiUrl) { try { return new URL(apiUrl).origin.replace('localhost', '127.0.0.1'); } catch {} }
  return process.env.NODE_ENV === 'production' ? 'https://api.klevro.tech' : 'http://127.0.0.1:5000';
}
