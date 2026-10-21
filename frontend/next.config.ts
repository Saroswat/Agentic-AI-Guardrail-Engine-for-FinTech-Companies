import type { NextConfig } from "next";

const isDesktopBuild = process.env.BUILD_TARGET === "desktop";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: isDesktopBuild ? "standalone" : undefined,
  async rewrites() {
    return [{ source: "/backend/:path*", destination: `${process.env.BACKEND_URL || "http://127.0.0.1:8000"}/:path*` }];
  },
};

export default nextConfig;
