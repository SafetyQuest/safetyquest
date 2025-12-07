import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CRITICAL for Azure App Service
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
  
  // Optimizations
  swcMinify: true,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
};

export default nextConfig;