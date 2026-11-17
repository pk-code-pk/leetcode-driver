// Deletes the sample accounts created by `npm run seed`, and everything attached to them
// (their jobs, applications, bookings, messages, ratings, reports and emails).
// Real accounts are left alone.
//
// Dry run (shows what would go):  npx tsx scripts/remove-demo.ts
// Delete for real:                npx tsx scripts/remove-demo.ts --yes
import "dotenv/config";
import postgres from "postgres";

export const DEMO_EMAILS = [
  "admin@jobsu.app",
  "jake@bc.edu",
  "maya@bc.edu",
  "chris@bc.edu",
  "sarah@example.com",
  "david@example.com",
  "priya@example.com",
];

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const sql = postgres(url, { max: 1 });
const commit = process.argv.includes("--yes");

async function main() {
  const counts: Record<string, number> = {};
  try {
    await sql.begin(async (tx) => {
      // Temporary lists of everything that touches a demo account.
      await tx`create temp table d_users on commit drop as select id from users where email = any(${DEMO_EMAILS})`;
      await tx`create temp table d_jobs on commit drop as select id from jobs where resident_id in (select id from d_users)`;
      await tx`create temp table d_bookings on commit drop as select id from bookings
        where resident_id in (select id from d_users) or student_id in (select id from d_users) or job_id in (select id from d_jobs)`;
      await tx`create temp table d_convos on commit drop as select id from conversations
        where resident_id in (select id from d_users) or student_id in (select id from d_users) or job_id in (select id from d_jobs)`;

      const steps: [string, () => Promise<{ count: number }>][] = [
        ["reports", () => tx`delete from reports where reporter_id in (select id from d_users) or subject_id in (select id from d_users)
          or job_id in (select id from d_jobs) or conversation_id in (select id from d_convos)`],
        ["reviews", () => tx`delete from reviews where booking_id in (select id from d_bookings)
          or author_id in (select id from d_users) or subject_id in (select id from d_users)`],
        ["messages", () => tx`delete from messages where conversation_id in (select id from d_convos) or sender_id in (select id from d_users)`],
        ["conversations", () => tx`delete from conversations where id in (select id from d_convos)`],
        ["bookings", () => tx`delete from bookings where id in (select id from d_bookings)`],
        ["applications", () => tx`delete from applications where student_id in (select id from d_users) or job_id in (select id from d_jobs)`],
        ["jobs", () => tx`delete from jobs where id in (select id from d_jobs)`],
        ["emails", () => tx`delete from emails where "to" = any(${DEMO_EMAILS})`],
        // Sessions, codes and profiles go with the user (cascade).
        ["users", () => tx`delete from users where id in (select id from d_users)`],
      ];
      for (const [name, run] of steps) counts[name] = (await run()).count;

      if (!commit) throw new Error("dry-run");
    });
  } catch (e) {
    if ((e as Error).message !== "dry-run") throw e;
  }

  const [{ n: remaining }] = await sql`select count(*)::int as n from users`;
  console.log(commit ? "Deleted:" : "Dry run, nothing deleted. Would delete:", counts);
  console.log(`Accounts left: ${remaining}`);
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
  process.exit(1);
});
