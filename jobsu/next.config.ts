import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The parent repo has its own lockfile; keep tracing rooted in this app.
  outputFileTracingRoot: __dirname,
  // Lets a build or the test server run alongside `npm run dev` without sharing a cache.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
