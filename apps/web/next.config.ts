import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // CRITICAL for Azure App Service with monorepo
  output: 'standalone',
  
  // CRITICAL: Tell Next.js to trace dependencies from monorepo root
  // This ensures all dependencies (including styled-jsx) are included
  outputFileTracingRoot: path.join(__dirname, '../../'),
  
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
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  
  // Note: swcMinify is deprecated in Next.js 15, SWC is used by default
};

export default nextConfig;
