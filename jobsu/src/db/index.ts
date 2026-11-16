import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Reuse one connection pool across hot reloads in development.
const globalForDb = globalThis as unknown as { __jobsuSql?: ReturnType<typeof postgres> };

const sql = globalForDb.__jobsuSql ?? postgres(process.env.DATABASE_URL!, {
    // Serverless hosts open one pool per function instance, so keep each pool small.
    max: process.env.VERCEL ? 1 : 10,
    // Pooled connection strings (pgbouncer-style) don't support prepared statements.
    prepare: !/pooler|pgbouncer/.test(process.env.DATABASE_URL ?? ""),
  });
if (process.env.NODE_ENV !== "production") globalForDb.__jobsuSql = sql;

export const db = drizzle(sql, { schema });
export { schema };
