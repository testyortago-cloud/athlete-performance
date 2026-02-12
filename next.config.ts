import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb',
    },
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
