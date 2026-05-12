import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    const backendOriginFromApiUrl = (() => {
      const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
      if (!rawApiUrl) return '';
      try {
        const parsed = new URL(rawApiUrl);
        return parsed.origin;
      } catch {
        return '';
      }
    })();

    const backendOrigin =
      process.env.BACKEND_ORIGIN ||
      backendOriginFromApiUrl ||
      'http://backend:5000';

    return [
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
