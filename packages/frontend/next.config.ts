import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: false,
    typescript: {
      ignoreBuildErrors: false, // We want to catch errors in production
    }
};

export default nextConfig;
