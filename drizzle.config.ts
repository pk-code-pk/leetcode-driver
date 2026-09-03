import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // drizzle-kit needs session mode (5432); the app runs on the transaction
  // pooler, so migrations get their own URL.
  dbCredentials: { url: (process.env.DIRECT_URL || process.env.DATABASE_URL)! },
} satisfies Config;
