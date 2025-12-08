import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CRITICAL for Azure App Service
  output: 'standalone',
  
  // CRITICAL: Include Prisma in standalone build
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['../../packages/database/node_modules/.prisma/client/**/*'],
      '/**/*': ['../../packages/database/node_modules/.prisma/client/**/*'],
    },
  },
  
  // Your existing image config
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'safetyqueststoreuae.blob.core.windows.net',
        pathname: '/safety-content/**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Optimizations
  swcMinify: true,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
};

export default nextConfig;
