import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // instrumentation.ts boots the in-process cron scheduler
  serverExternalPackages: ["node-cron", "postgres"],
};

export default nextConfig;
