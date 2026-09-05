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
  "connect-src 'self' https://*.klevro.com http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  output: 'standalone',
  compress: true, // Enable Gzip / Brotli compression for smaller bundles and faster transfers
  reactStrictMode: true,
  poweredByHeader: false,

  // Modern Image Optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Production compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // API proxy is handled by src/app/api/[...path]/route.ts (runtime proxy)
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
