const getApiUrl = () => {
  // In the browser (client-side): always use relative /api
  // This routes through Next.js rewrite proxy → no CORS issues at all
  if (typeof window !== 'undefined') {
    return '/api';
  }

  // Server-side (SSR/build): use env variable or fallback to internal Docker URL
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/"/g, '').trim();
  if (envUrl) return envUrl;

  return 'http://localhost:5000/api';
};

export const API_URL = getApiUrl();

export const getFullImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('data:') || path.startsWith('http')) return path;
  // Remove /api from end of API_URL to get base server URL
  const baseUrl = API_URL.replace(/\/api$/, '');
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${baseUrl}/${cleanPath}`;
};
