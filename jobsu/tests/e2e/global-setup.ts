import { execSync } from "node:child_process";
import postgres from "postgres";

// Bring the test database up to the current schema and empty it.
export default async function globalSetup() {
  const url = process.env.TEST_DATABASE_URL!;
  execSync("npx drizzle-kit push --force", { env: { ...process.env, DATABASE_URL: url }, stdio: "pipe" });
  const sql = postgres(url);
  await sql`truncate users, waitlist, emails restart identity cascade`;
  await sql.end();
}
