import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // API proxy is handled by src/app/api/[...path]/route.ts (runtime proxy)
  // This avoids build-time env variable issues with next.config.ts rewrites
};

export default nextConfig;
