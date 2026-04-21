import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: false,
    eslint: {
      ignoreDuringBuilds: true,
    }
};

export default nextConfig;
