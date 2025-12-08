import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CRITICAL for Azure App Service
  output: 'standalone',
  
  // CRITICAL: Include Prisma and ensure proper file tracing
  experimental: {
    outputFileTracingIncludes: {
      // Include Prisma client for all routes
      '/**/*': [
        '../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**/*',
        '../../node_modules/.pnpm/@prisma+client@*/node_modules/@prisma/client/**/*',
      ],
    },
    // Ensure all dependencies are traced
    outputFileTracingRoot: require('path').join(__dirname, '../../'),
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
