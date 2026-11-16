// Creates a staff account and sample people and jobs for local development.
// Run: `npm run seed`. Safe to re-run: existing emails are skipped.
import "dotenv/config";
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

async function hash(password: string) {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${(await scrypt(password, salt, 64)).toString("hex")}`;
}

async function main() {
  const { db } = await import("../src/db");
  const { users, studentProfiles, residentProfiles, jobs } = await import("../src/db/schema");
  const { eq } = await import("drizzle-orm");
  const now = new Date();
  const password = await hash("password123");
  const day = (n: number) => new Date(Date.now() + n * 86400_000).toISOString().slice(0, 10);

  async function person(email: string, role: "admin" | "resident" | "student", firstName: string, lastName: string) {
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) return { user: existing, created: false };
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash: password, role, firstName, lastName, emailVerifiedAt: now, acceptedTermsAt: now, attested18At: now })
      .returning();
    return { user, created: true };
  }

  await person("admin@jobsu.app", "admin", "Ben", "Wakim");

  const students: [string, string, string, string, string[], string][] = [
    ["jake@bc.edu", "Jake", "Thompson", "Sophomore from Ohio. Two summers landscaping, and I've babysat for three families near campus.", ["yard-work", "moving", "babysitting"], "Economics"],
    ["maya@bc.edu", "Maya", "Patel", "Junior studying education. I tutor middle-school math and play piano.", ["tutoring", "lessons", "babysitting"], "Education"],
    ["chris@bc.edu", "Chris", "Nguyen", "CS major. Happy to set up Wi-Fi, printers and phones, and I have a car.", ["tech-setup", "errands", "moving"], "Computer Science"],
  ];
  for (const [email, first, last, bio, jobTypes, major] of students) {
    const { user, created } = await person(email, "student", first, last);
    if (created) {
      await db.insert(studentProfiles).values({
        userId: user.id, school: "Boston College", gradYear: 2028, major, bio, jobTypes,
        hasCar: first === "Chris", availability: "Weekday afternoons, most weekends", enrollmentConfirmedAt: now,
      });
    }
  }

  const { user: sarah, created } = await person("sarah@example.com", "resident", "Sarah", "Miller");
  if (created) {
    await db.insert(residentProfiles).values({ userId: sarah.id, town: "Newton", landmark: "Near Newton Centre T stop" });
    await db.insert(jobs).values([
      { residentId: sarah.id, type: "yard-work", title: "Rake leaves in the back yard", description: "Back yard is covered in leaves. Need them raked and bagged. Rakes and bags provided.", answers: { size: "Medium", tools: "Yes" }, town: "Newton", landmark: "Near Newton Centre T stop", timing: "one-time", startDate: day(3), startTime: "10:00", estMinutes: 180, rateCents: 3000, status: "open" },
      { residentId: sarah.id, type: "babysitting", title: "Date-night sitter for two kids", description: "Looking for a sitter for Friday evening. Kids will have eaten; bedtime is 8.", answers: { kids: "Two kids, ages 4 and 7", pets: "One friendly dog" }, town: "Newton", landmark: "Near Newton Centre T stop", timing: "occasional", startDate: day(5), startTime: "18:00", estMinutes: 240, rateCents: 2800, status: "open" },
      { residentId: sarah.id, type: "tech-setup", title: "Set up a new printer and Wi-Fi extender", description: "New printer needs connecting to two laptops, and the Wi-Fi doesn't reach the top floor.", answers: { device: "Printer and Wi-Fi extender" }, town: "Newton", landmark: "Near Newton Centre T stop", timing: "one-time", startDate: day(2), startTime: "16:00", estMinutes: 90, rateCents: null, status: "pending_review", reviewReasons: ["Needs a suggested rate"] },
    ]);
  }

  console.log("Seeded. Log in with password123 as admin@jobsu.app, sarah@example.com, or jake@bc.edu.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
