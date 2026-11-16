import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The parent repo has its own lockfile; keep tracing rooted in this app.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
