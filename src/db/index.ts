import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const g = globalThis as unknown as {
  __pg?: ReturnType<typeof postgres>;
  __db?: PostgresJsDatabase<typeof schema>;
};

/**
 * Lazily connect. Building the app must not require a reachable database, so
 * the connection is created on first query rather than at import time.
 */
function getDb(): PostgresJsDatabase<typeof schema> {
  if (g.__db) return g.__db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  // Serverless fans out across many short-lived instances, so each one holds a
  // single connection; five apiece exhausts a pooler in minutes.
  const client =
    g.__pg ??
    postgres(url, { max: 3, prepare: false, idle_timeout: 20, connect_timeout: 10 });
  g.__pg = client;
  g.__db = drizzle(client, { schema });
  return g.__db;
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get: (_t, prop) => Reflect.get(getDb(), prop, getDb()),
});

export { schema };
