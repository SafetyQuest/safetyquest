import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CRITICAL for Azure App Service - creates optimized standalone build
  output: 'standalone',
  
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
  
  // Optimize for production
  swcMinify: true,
  reactStrictMode: true,
  
  // Disable source maps in production (smaller build)
  productionBrowserSourceMaps: false,
};

export default nextConfig;