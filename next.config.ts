import type { NextConfig } from "next";

// Content-Security-Policy header
// 'unsafe-inline' for styles/scripts is a known Next.js limitation with Server Components.
// Nonces are the proper fix but require middleware — this is a significant improvement over nothing.
const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires these in dev; tighten in v2 with nonces
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' blob: data: https:",
  "media-src 'self' blob:",
  "connect-src 'self' https://*.klevro.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  output: 'standalone',
  // API proxy is handled by src/app/api/[...path]/route.ts (runtime proxy)
  // This avoids build-time env variable issues with next.config.ts rewrites
  allowedDevOrigins: ['lms-front-mina.loca.lt', 'dull-walls-allow.loca.lt', 'lemon-sides-invent.loca.lt'],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
