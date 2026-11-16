import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Reuse one connection pool across hot reloads in development.
const globalForDb = globalThis as unknown as { __jobsuSql?: ReturnType<typeof postgres> };

const sql = globalForDb.__jobsuSql ?? postgres(process.env.DATABASE_URL!, { max: 10 });
if (process.env.NODE_ENV !== "production") globalForDb.__jobsuSql = sql;

export const db = drizzle(sql, { schema });
export { schema };
