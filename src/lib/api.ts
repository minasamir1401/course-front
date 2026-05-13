const getApiUrl = () => {
  // Always prioritize the environment variable if defined
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/"/g, '').trim();
  if (envUrl) return envUrl;

  // Fallback logic
  if (typeof window !== 'undefined') {
    return '/api';
  }

  return 'http://localhost:5000/api';
};

export const API_URL = getApiUrl();
