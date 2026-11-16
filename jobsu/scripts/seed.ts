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

  // ---- Demo activity: other families, applicants, bookings at each stage, messages and ratings ----
  const { applications, bookings, conversations, messages, reviews } = await import("../src/db/schema");
  const [hasActivity] = await db.select().from(applications).limit(1);
  if (!hasActivity) {
    const ago = (hours: number) => new Date(Date.now() - hours * 3600_000);
    const byEmail = async (email: string) => (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
    const [jake, maya, chris] = [await byEmail("jake@bc.edu"), await byEmail("maya@bc.edu"), await byEmail("chris@bc.edu")];

    // Two more families so the student feed isn't one person's jobs.
    const families: [string, string, string, string, string][] = [
      ["david@example.com", "David", "Chen", "Brookline", "Near Coolidge Corner"],
      ["priya@example.com", "Priya", "Shah", "Brighton", "Near Oak Square"],
    ];
    const fam: Record<string, typeof sarah> = {};
    for (const [email, first, last, town, landmark] of families) {
      const { user, created: isNew } = await person(email, "resident", first, last);
      if (isNew) await db.insert(residentProfiles).values({ userId: user.id, town, landmark });
      fam[first] = user;
    }
    const base = { timing: "one-time", status: "open" as const };
    await db.insert(jobs).values([
      { ...base, residentId: fam.David.id, type: "tutoring", title: "Algebra help for an 8th grader", description: "Weekly session to get ahead of a tough unit. Patient and encouraging is what matters most.", answers: { subject: "Algebra I", grade: "8th grade" }, town: "Brookline", landmark: "Near Coolidge Corner", timing: "recurring", startDate: day(4), startTime: "16:30", estMinutes: 60, rateCents: 4000 },
      { ...base, residentId: fam.David.id, type: "moving", title: "Carry boxes down to the basement", description: "About 25 boxes and a bookshelf from the second floor to the basement. Nothing fragile.", answers: { stairs: "Stairs", truck: "Not needed", heavy: "One bookshelf" }, town: "Brookline", landmark: "Near Coolidge Corner", startDate: day(6), startTime: "11:00", estMinutes: 120, rateCents: 3200 },
      { ...base, residentId: fam.Priya.id, type: "pet-care", title: "Walk and feed our dog while we travel", description: "Two visits a day over a long weekend. Luna is easygoing and loves the park.", answers: { pet: "Luna, a 5-year-old lab mix" }, town: "Brighton", landmark: "Near Oak Square", timing: "occasional", startDate: day(8), startTime: "08:00", estMinutes: 90, rateCents: 2500 },
      { ...base, residentId: fam.Priya.id, type: "lessons", title: "Beginner piano lessons for a 9-year-old", description: "She just started and needs someone fun to keep her practicing. We have a keyboard.", answers: { activity: "Piano", level: "Beginner" }, town: "Brighton", landmark: "Near Oak Square", timing: "recurring", startDate: day(7), startTime: "15:30", estMinutes: 45, rateCents: 3500 },
      { ...base, residentId: fam.Priya.id, type: "organizing", title: "Sort and label the garage shelves", description: "Shelves are up, everything else is in piles. Bins and a label maker are ready.", answers: {}, town: "Brighton", landmark: "Near Oak Square", startDate: day(9), startTime: "10:00", estMinutes: 180, rateCents: 2800 },
    ]);

    const sarahJobs = await db.select().from(jobs).where(eq(jobs.residentId, sarah.id));
    // Posted a couple of days ago, so the applications below come after it.
    await db.update(jobs).set({ createdAt: ago(48) }).where(eq(jobs.residentId, sarah.id));
    const leaves = sarahJobs.find((j) => j.type === "yard-work")!;
    const sitter = sarahJobs.find((j) => j.type === "babysitting")!;

    // Applicants on Sarah's open jobs, with a conversation under way.
    await db.insert(applications).values([
      { jobId: leaves.id, studentId: jake.id, note: "I did two summers of landscaping and I'm free all Thursday morning.", recommended: true, createdAt: ago(20) },
      { jobId: leaves.id, studentId: chris.id, note: "Happy to help, and I can bring extra bags in my car.", createdAt: ago(9) },
      { jobId: sitter.id, studentId: maya.id, note: "I've sat for three families near campus and I'm CPR certified.", createdAt: ago(5) },
    ]);
    const [chat] = await db
      .insert(conversations)
      .values({ jobId: leaves.id, residentId: sarah.id, studentId: jake.id, lastMessageAt: ago(2), residentLastReadAt: ago(6), studentLastReadAt: ago(2), createdAt: ago(19) })
      .returning();
    await db.insert(messages).values([
      { conversationId: chat.id, senderId: sarah.id, body: "Hi Jake, thanks for applying. Is three hours enough for a medium yard?", createdAt: ago(19) },
      { conversationId: chat.id, senderId: jake.id, body: "Hi Sarah! Yes, three hours is plenty, bagging included.", createdAt: ago(18) },
      { conversationId: chat.id, senderId: sarah.id, body: "Great. There's a gate on the left side of the house.", createdAt: ago(7) },
      { conversationId: chat.id, senderId: jake.id, body: "Perfect. Should I bring gloves or do you have some?", createdAt: ago(2) },
    ]);

    // One job at each later stage: booked, waiting for Sarah to confirm, and finished with ratings.
    async function staged(
      job: { type: string; title: string; description: string; startDate: string; startTime: string; estMinutes: number; rateCents: number; status: "booked" | "completed" },
      student: typeof jake,
      booking: Partial<typeof bookings.$inferInsert> & { status: (typeof bookings.$inferInsert)["status"] },
      note: string,
    ) {
      const [j] = await db.insert(jobs).values({ ...job, residentId: sarah.id, answers: {}, town: "Newton", landmark: "Near Newton Centre T stop", timing: "one-time", createdAt: ago(24 * 12) }).returning();
      const [a] = await db.insert(applications).values({ jobId: j.id, studentId: student.id, note, status: "selected", createdAt: ago(24 * 11) }).returning();
      const authorized = Math.round((job.rateCents * job.estMinutes) / 60);
      const [b] = await db
        .insert(bookings)
        .values({ jobId: j.id, applicationId: a.id, residentId: sarah.id, studentId: student.id, rateCents: job.rateCents, estMinutes: job.estMinutes, authorizedCents: authorized, scheduledFor: job.startDate, paymentProvider: "mock", paymentRef: "seed", createdAt: ago(24 * 10), ...booking })
        .returning();
      return b;
    }
    await staged(
      { type: "tutoring", title: "SAT math prep, two sessions", description: "Our daughter wants help with the math section before the December test.", startDate: day(2), startTime: "17:00", estMinutes: 120, rateCents: 4500, status: "booked" },
      maya,
      { status: "authorized" },
      "I tutor middle and high school math and scored well on the SAT myself.",
    );
    await staged(
      { type: "errands", title: "Pick up and assemble a bookshelf", description: "Collect a flat-pack bookshelf from the store and put it together.", startDate: day(-1), startTime: "13:00", estMinutes: 150, rateCents: 3000, status: "booked" },
      chris,
      { status: "completed_pending", studentCompletedAt: ago(20), actualMinutes: 150 },
      "I have a car and I've built plenty of these.",
    );
    const paid = (rate: number, minutes: number) => {
      const amount = Math.round((rate * minutes) / 60);
      const fee = Math.round(amount * 0.1);
      return { amountCents: amount, feeCents: fee, payoutCents: amount - fee };
    };
    const done1 = await staged(
      { type: "moving", title: "Move a couch and two dressers upstairs", description: "Furniture delivery left everything in the hallway.", startDate: day(-9), startTime: "10:00", estMinutes: 120, rateCents: 3500, status: "completed" },
      jake,
      { status: "completed", studentCompletedAt: ago(24 * 9), actualMinutes: 120, residentConfirmedAt: ago(24 * 9 - 2), releasedAt: ago(24 * 9 - 2), releaseKind: "confirmed", ...paid(3500, 120) },
      "Strong, careful, and free that morning.",
    );
    const done2 = await staged(
      { type: "babysitting", title: "Saturday afternoon sitter", description: "Four hours while we're at a wedding.", startDate: day(-16), startTime: "13:00", estMinutes: 240, rateCents: 2800, status: "completed" },
      maya,
      { status: "completed", studentCompletedAt: ago(24 * 16), actualMinutes: 240, residentConfirmedAt: ago(24 * 16 - 3), releasedAt: ago(24 * 16 - 3), releaseKind: "confirmed", ...paid(2800, 240) },
      "I'd love to help. I've sat for kids this age a lot.",
    );
    await db.insert(reviews).values([
      { bookingId: done1.id, authorId: sarah.id, subjectId: jake.id, rating: 5, comment: "Jake was on time, careful with the walls, and done early. We'd book him again.", createdAt: ago(24 * 8) },
      { bookingId: done1.id, authorId: jake.id, subjectId: sarah.id, rating: 5, comment: "Clear instructions and really kind. Easy job.", createdAt: ago(24 * 8) },
      { bookingId: done2.id, authorId: sarah.id, subjectId: maya.id, rating: 5, comment: "The kids asked when Maya is coming back. Couldn't ask for more.", createdAt: ago(24 * 15) },
      { bookingId: done2.id, authorId: maya.id, subjectId: sarah.id, rating: 5, comment: "Lovely family, everything was ready when I arrived.", createdAt: ago(24 * 15) },
    ]);
  }

  console.log("Seeded. Log in with password123 as admin@jobsu.app, sarah@example.com, or jake@bc.edu.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
