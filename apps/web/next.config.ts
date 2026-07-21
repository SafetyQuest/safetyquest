import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",

  // Now top-level in Next 15 (moved out of `experimental`).
  // This traces the whole monorepo so hoisted deps like
  // styled-jsx and @swc/helpers land in .next/standalone/node_modules.
  outputFileTracingRoot: path.join(__dirname, "../../"),

  // Prisma belt-and-suspenders (nft sometimes misses the engine/client files)
  outputFileTracingIncludes: {
    "/**/*": [
      "../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**/*",
      "../../node_modules/.pnpm/@prisma+client@*/node_modules/@prisma/client/**/*",
    ],
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname:
          process.env.NEXT_PUBLIC_AZURE_STORAGE_HOSTNAME ||
          "safetyqueststoreuae.blob.core.windows.net",
        pathname: "/safety-content/**",
      },
    ],
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  reactStrictMode: true,
  productionBrowserSourceMaps: false,
};

export default nextConfig;
