import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CRITICAL for Azure App Service & Monorepos
  output: 'standalone', 
  
  // Existing configuration
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
  
  // You may also want to add other optimizations from the guide:
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  swcMinify: true,
};

export default nextConfig;
