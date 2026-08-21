import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // API proxy is handled by src/app/api/[...path]/route.ts (runtime proxy)
  // This avoids build-time env variable issues with next.config.ts rewrites
  allowedDevOrigins: ['lms-front-mina.loca.lt', 'dull-walls-allow.loca.lt', 'lemon-sides-invent.loca.lt'],
};

export default nextConfig;
