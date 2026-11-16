import { expect, test } from "@playwright/test";
import {
  applyTo,
  book,
  bookedJob,
  db,
  fillAccount,
  logIn,
  newPage,
  postJob,
  signUpResident,
  signUpStudent,
  uniq,
} from "./helpers";

test("a job goes from posted to paid and rated", async ({ browser }) => {
  const tag = uniq();
  const resident = await newPage(browser);
  const student = await newPage(browser);
  await signUpResident(resident, "Sarah", `sarah.${tag}@example.com`);
  await signUpStudent(student, "Jake", `jake.${tag}@bc.edu`);

  const title = `Rake leaves ${tag}`;
  const jobId = await postJob(resident, { title, rate: "30", hours: "3" });
  await expect(resident.getByText("Your job is live")).toBeVisible();

  // The student finds it in the feed and applies.
  await student.goto("/student/jobs");
  await expect(student.locator("[data-testid=job-card]", { hasText: title })).toContainText("$30/hr");
  await applyTo(student, jobId);

  // The resident sees the applicant by first name and last initial only.
  await resident.goto(`/resident/jobs/${jobId}`);
  const applicant = resident.locator("[data-testid=applicant]");
  await expect(applicant).toContainText("Jake T.");
  await expect(applicant).not.toContainText("Thompson");

  // Messaging: contact details are hidden before booking.
  await applicant.getByRole("link", { name: "Message" }).click();
  await resident.fill("[name=body]", "Hi Jake, does Saturday at 10 work?");
  await resident.click('button:has-text("Send")');
  await expect(resident.locator("[data-testid=thread]")).toContainText("does Saturday at 10 work?");
  const convoUrl = resident.url();

  await student.goto("/student/jobs");
  await expect(student.locator("[data-testid=unread]")).toHaveText("1");
  await student.goto(convoUrl);
  await student.fill("[name=body]", "Yes! Text me on 617-555-0142 or venmo me.");
  await student.click('button:has-text("Send")');
  await expect(student.locator("[data-testid=thread]")).toContainText("[contact hidden until booked]");
  await expect(student.locator("[data-testid=thread]")).not.toContainText("617-555-0142");

  // Booking holds the estimated total.
  await book(resident, jobId, "Jake");
  await expect(resident.getByText("Jake Thompson")).toBeVisible(); // full name once booked

  // The student can't bill more than the booked time.
  await student.goto(`/student/jobs/${jobId}`);
  await expect(student.getByText("You got the job")).toBeVisible();
  await student.fill("[name=hours]", "2.5");
  await student.click('button:has-text("Mark job as done")');
  await expect(student.getByText("Waiting for Sarah")).toBeVisible();

  // The resident releases payment: 2.5h x $30 = $75, 10% fee, $67.50 payout.
  await resident.goto(`/resident/jobs/${jobId}`);
  await expect(resident.getByText("Jake marked this done: 2.5 hours, $75")).toBeVisible();
  await resident.click('button:has-text("release payment")');
  await expect(resident.getByText("Receipt")).toBeVisible();
  await expect(resident.locator("aside")).toContainText("$75");

  await student.goto(`/student/jobs/${jobId}`);
  await expect(student.locator("aside")).toContainText("−$7.50");
  await expect(student.locator("aside")).toContainText("$67.50");
  await student.goto("/student/my-jobs");
  await expect(student.locator("[data-testid=earned]")).toHaveText("$67.50");

  // Ratings are hidden from the other side until both are in.
  await resident.click('label[data-star="5"]');
  await resident.fill("[name=comment]", "On time and thorough.");
  await resident.click('button:has-text("Submit rating")');
  await expect(resident.getByText("You rated Jake")).toBeVisible();

  await student.goto(`/student/jobs/${jobId}`);
  await expect(student.getByText("Sarah has rated you. You'll see it once you submit yours.")).toBeVisible();
  await expect(student.getByText("On time and thorough.")).toHaveCount(0);
  await student.click('label[data-star="4"]');
  await student.click('button:has-text("Submit rating")');
  await expect(student.getByText("You rated Sarah")).toBeVisible();
  await student.reload();
  await expect(student.getByText("Sarah rated you")).toBeVisible();

  // A second rating is refused, and the job is closed to new applicants.
  const other = await newPage(browser);
  await signUpStudent(other, "Maya", `maya.${tag}@bc.edu`);
  const res = await other.goto(`/student/jobs/${jobId}`);
  expect(res?.status()).toBe(404);
});

test("sign-up rules: .edu only for students, live campus only, 18+ and terms required", async ({ page }) => {
  const tag = uniq();
  await page.goto("/sign-up/student");
  await fillAccount(page, "Sam", "Lee", `sam.${tag}@gmail.com`);
  await page.click("button[type=submit]");
  await expect(page.locator("p[role=alert]")).toContainText(".edu email");

  await page.goto("/sign-up/student");
  await fillAccount(page, "Sam", "Lee", `sam.${tag}@harvard.edu`);
  await page.click("button[type=submit]");
  await expect(page.locator("p[role=status]")).toContainText("isn't live at your campus yet");

  await page.goto("/sign-up/student");
  await fillAccount(page, "Sam", "Lee", `sam.${tag}@bc.edu`);
  await page.uncheck("[name=adult]");
  await page.click("button[type=submit]");
  await expect(page.locator("p[role=alert]")).toContainText("18 or older");

  const sql = db();
  const [{ n }] = await sql`select count(*)::int as n from users where email like ${"sam." + tag + "%"}`;
  await sql.end();
  expect(n).toBe(0);
});

test("a wrong confirmation code is refused and a duplicate email can't sign up twice", async ({ browser }) => {
  const tag = uniq();
  const page = await newPage(browser);
  await page.goto("/sign-up/student");
  await fillAccount(page, "Ana", "Diaz", `ana.${tag}@bc.edu`);
  await page.click("button[type=submit]");
  await page.waitForURL("**/verify");
  await page.fill("[name=code]", "000000");
  await page.click('button:has-text("Confirm")');
  await expect(page.locator("p[role=alert]")).toContainText("isn't right");

  // Unconfirmed accounts can't reach the app.
  await page.goto("/student/jobs");
  await expect(page).toHaveURL(/\/verify/);

  const second = await newPage(browser);
  await second.goto("/sign-up/student");
  await fillAccount(second, "Ana", "Diaz", `ana.${tag}@bc.edu`);
  await second.click("button[type=submit]");
  await expect(second.locator("p[role=alert]")).toContainText("already exists");
});

test("job rules: minimum rate, and people can't see what isn't theirs", async ({ browser }) => {
  const tag = uniq();
  const resident = await newPage(browser);
  await signUpResident(resident, "Sarah", `sarah.${tag}@example.com`);

  await resident.goto("/resident/jobs/new");
  await resident.selectOption("[name=type]", "yard-work");
  await resident.fill("[name=title]", "Cheap job");
  await resident.fill("textarea[name=description]", "Leaves need raking and bagging.");
  await resident.fill("[name=startDate]", new Date(Date.now() + 86400_000 * 2).toISOString().slice(0, 10));
  await resident.fill("[name=hours]", "2");
  await resident.fill("[name=rate]", "15");
  await resident.click('button:has-text("Post job")');
  await expect(resident.locator("p[role=alert]")).toContainText("$18.75");

  const jobId = await postJob(resident, { title: `Private job ${tag}` });

  // Another resident can't open it; a student can't use resident pages; signed-out visitors are sent to log in.
  const other = await newPage(browser);
  await signUpResident(other, "Tom", `tom.${tag}@example.com`);
  expect((await other.goto(`/resident/jobs/${jobId}`))?.status()).toBe(404);

  const student = await newPage(browser);
  await signUpStudent(student, "Jake", `jake.${tag}@bc.edu`);
  await student.goto(`/resident/jobs/${jobId}`);
  await expect(student).toHaveURL(/\/student\/jobs$/);
  await student.goto("/admin");
  await expect(student).toHaveURL(/\/student\/jobs$/);

  const anon = await newPage(browser);
  await anon.goto(`/student/jobs/${jobId}`);
  await expect(anon).toHaveURL(/\/log-in/);
});

test("staff suggest a rate for 'not sure' jobs, and risky jobs wait for review", async ({ browser }) => {
  const tag = uniq();
  const resident = await newPage(browser);
  const student = await newPage(browser);
  const admin = await newPage(browser);
  await signUpResident(resident, "Sarah", `sarah.${tag}@example.com`);
  await signUpStudent(student, "Jake", `jake.${tag}@bc.edu`);

  const title = `Unsure rate ${tag}`;
  const jobId = await postJob(resident, { title, rate: null });
  await expect(resident.getByText("taking a quick look")).toBeVisible();

  const risky = `Gutters ${tag}`;
  await postJob(resident, { title: risky, description: "Clean the gutters and patch part of the roof." });
  await expect(resident.getByText("taking a quick look")).toBeVisible();

  // Not visible to students until approved.
  await student.goto("/student/jobs");
  await expect(student.getByText(title)).toHaveCount(0);
  await expect(student.getByText(risky)).toHaveCount(0);

  // Staff account: the configured admin email becomes an admin on sign-up.
  const sql = db();
  const existing = await sql`select 1 from users where email = 'admin@jobsu.test'`;
  await sql.end();
  if (existing.length) await logIn(admin, "admin@jobsu.test");
  else await signUpResident(admin, "Ben", "admin@jobsu.test");
  await admin.goto("/admin/jobs");

  const riskyCard = admin.locator("[data-testid=pending-job]", { hasText: risky });
  await expect(riskyCard).toContainText("May involve roof work");
  await riskyCard.locator("[name=note]").fill("Roof and gutter work isn't something JobsU students can do.");
  await riskyCard.getByRole("button", { name: "Decline" }).click();
  await expect(admin.locator("[data-testid=pending-job]", { hasText: risky })).toHaveCount(0);

  const card = admin.locator("[data-testid=pending-job]", { hasText: title });
  await expect(card).toContainText("Needs a suggested rate");
  await card.getByRole("button", { name: "Approve and post" }).click();
  await expect(card.locator("p[role=alert]")).toContainText("Suggest an hourly rate");
  await card.locator("[name=rate]").fill("32");
  await card.getByRole("button", { name: "Approve and post" }).click();
  await expect(admin.locator("[data-testid=pending-job]", { hasText: title })).toHaveCount(0);

  await student.goto("/student/jobs");
  await expect(student.locator("[data-testid=job-card]", { hasText: title })).toContainText("$32/hr");
  await resident.goto(`/resident/jobs/${jobId}`);
  await expect(resident.getByText("$32/hr")).toBeVisible();

  // The matching student was emailed about the new job (recorded in the outbox).
  await admin.goto("/admin/outbox");
  await expect(admin.locator("[data-testid=email]", { hasText: `jake.${tag}@bc.edu` }).first()).toContainText("New yard work job");
});

test("a resident can raise a problem, and staff decide the outcome", async ({ browser }) => {
  const { resident, student, jobId } = await bookedJob(browser, `Dispute ${uniq()}`);
  await student.goto(`/student/jobs/${jobId}`);
  await student.click('button:has-text("Mark job as done")');
  await expect(student.getByText("Waiting for Sarah")).toBeVisible();

  await resident.goto(`/resident/jobs/${jobId}`);
  await resident.click("text=Something went wrong?");
  await resident.fill("[name=reason]", "The student left after twenty minutes and the yard isn't done.");
  await resident.click('button:has-text("Pause payment and get help")');
  await expect(resident.getByText("Payment is paused")).toBeVisible();

  // While disputed, auto-release must not pay out.
  const sql = db();
  await sql`update bookings set scheduled_for = current_date - 30 where job_id = ${jobId}`;
  const res = await resident.request.get("/api/cron/auto-release", { headers: { Authorization: "Bearer test-cron-secret" } });
  expect(res.ok()).toBe(true);
  const [b] = await sql`select status from bookings where job_id = ${jobId}`;
  expect(b.status).toBe("disputed");

  const admin = await newPage(browser);
  const existing = await sql`select 1 from users where email = 'admin@jobsu.test'`;
  if (existing.length) await logIn(admin, "admin@jobsu.test");
  else await signUpResident(admin, "Ben", "admin@jobsu.test");
  await admin.goto("/admin");
  await expect(admin.getByText("left after twenty minutes")).toBeVisible();
  await admin.getByRole("button", { name: "Don't charge the resident" }).click();
  await expect(admin.getByText("left after twenty minutes")).toHaveCount(0);

  const [after] = await sql`select status, amount_cents from bookings where job_id = ${jobId}`;
  await sql.end();
  expect(after.status).toBe("cancelled");
  expect(after.amount_cents).toBeNull();
});

test("when a student cancels, the job reopens and the cancellation is recorded", async ({ browser }) => {
  const { resident, student, jobId, studentEmail } = await bookedJob(browser, `Cancel ${uniq()}`);
  await student.goto(`/student/jobs/${jobId}`);
  await student.click("text=Can't make it?");
  await student.click('button:has-text("Cancel this booking")');
  await expect(student.getByText("You withdrew your application for this job.")).toBeVisible();

  await resident.goto(`/resident/jobs/${jobId}`);
  await expect(resident.getByText("Open", { exact: true })).toBeVisible();
  await expect(resident.getByText("Your student")).toHaveCount(0);

  const sql = db();
  const [p] = await sql`select strikes from student_profiles sp join users u on u.id = sp.user_id where u.email = ${studentEmail}`;
  await sql.end();
  expect(p.strikes).toBe(1);
});

test("payment releases automatically 7 days after the job date", async ({ browser }) => {
  const { resident, student, jobId } = await bookedJob(browser, `Auto ${uniq()}`);

  // The endpoint needs the secret.
  expect((await resident.request.get("/api/cron/auto-release")).status()).toBe(401);

  const sql = db();
  const run = () => resident.request.get("/api/cron/auto-release", { headers: { Authorization: "Bearer test-cron-secret" } });

  // 6 days after: not yet.
  await sql`update bookings set scheduled_for = (now() at time zone 'America/New_York')::date - 6 where job_id = ${jobId}`;
  await run();
  expect((await sql`select status from bookings where job_id = ${jobId}`)[0].status).toBe("authorized");

  // 7 days after: released for the booked 3 hours at $30.
  await sql`update bookings set scheduled_for = (now() at time zone 'America/New_York')::date - 7 where job_id = ${jobId}`;
  await run();
  const [b] = await sql`select status, release_kind, amount_cents, fee_cents, payout_cents from bookings where job_id = ${jobId}`;
  expect(b).toMatchObject({ status: "completed", release_kind: "auto", amount_cents: 9000, fee_cents: 900, payout_cents: 8100 });

  // Running again doesn't pay twice.
  await run();
  const [again] = await sql`select count(*)::int as n from emails where subject like 'You''ve been paid%' and body like ${"%Auto %"}`;
  await sql.end();
  expect(again.n).toBeGreaterThanOrEqual(1);

  await student.goto(`/student/jobs/${jobId}`);
  await expect(student.getByText("Released automatically 7 days after the job date.")).toBeVisible();
  await expect(student.locator("aside")).toContainText("$81");
});

test("reports reach staff, and a paused account is locked out", async ({ browser }) => {
  const { resident, student, jobId, studentEmail } = await bookedJob(browser, `Report ${uniq()}`);
  await resident.goto("/messages");
  await resident.locator("[data-testid=conversation]").first().click();
  await resident.getByRole("link", { name: "Report", exact: true }).click();
  await resident.selectOption("[name=reason]", "Didn't show up");
  await resident.fill("[name=details]", "Waited an hour and nobody came to the house.");
  await resident.click('button:has-text("Send report")');
  await expect(resident.getByText("We've got your report.")).toBeVisible();

  const admin = await newPage(browser);
  const sql = db();
  const existing = await sql`select 1 from users where email = 'admin@jobsu.test'`;
  await sql.end();
  if (existing.length) await logIn(admin, "admin@jobsu.test");
  else await signUpResident(admin, "Ben", "admin@jobsu.test");

  await admin.goto("/admin/reports");
  const report = admin.locator("[data-testid=report]", { hasText: "nobody came to the house" });
  await expect(report).toContainText(studentEmail);
  await report.locator("[name=note]").fill("Spoke to both; paused the student.");
  await report.getByRole("button", { name: "Mark resolved" }).click();
  await expect(report).toContainText("Resolved");

  await admin.goto("/admin/users");
  const row = admin.locator(".card", { hasText: studentEmail });
  await row.locator("summary").click();
  await row.locator("[name=reason]").fill("Missed a booked job without notice.");
  await row.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(row).toContainText("Paused");

  await student.goto(`/student/jobs/${jobId}`);
  await expect(student).toHaveURL(/\/suspended/);
  await expect(student.getByText("Missed a booked job without notice.")).toBeVisible();
});

test("a forgotten password can be reset with an emailed code, and account details can be changed", async ({ browser }) => {
  const tag = uniq();
  const email = `reset.${tag}@example.com`;
  const page = await newPage(browser);
  await signUpResident(page, "Rita", email);

  // Change details and password from the account page.
  await page.goto("/account");
  await page.fill("[name=firstName]", "Margarita");
  await page.selectOption("[name=town]", "Brookline");
  await page.click('button:has-text("Save changes")');
  await expect(page.getByText("Saved.")).toBeVisible();
  await page.fill("[name=currentPassword]", "wrong-password");
  await page.fill("[name=newPassword]", "another-pass-1");
  await page.click('button:has-text("Change password")');
  await expect(page.locator("p[role=alert]")).toContainText("current password isn't right");

  // Forgot password: an unknown email gets the same screen and no code.
  const anon = await newPage(browser);
  await anon.goto("/forgot");
  await anon.fill("[name=email]", `nobody.${tag}@example.com`);
  await anon.click('button:has-text("Send code")');
  await expect(anon).toHaveURL(/\/reset/);
  await expect(anon.locator("[data-testid=dev-code]")).toHaveCount(0);

  await anon.goto("/forgot");
  await anon.fill("[name=email]", email);
  await anon.click('button:has-text("Send code")');
  await anon.fill("[name=code]", "000000");
  await anon.fill("[name=password]", "brand-new-pass-9");
  await anon.click('button:has-text("Save and log in")');
  await expect(anon.locator("p[role=alert]")).toContainText("isn't right");

  const code = await anon.textContent("[data-testid=dev-code]");
  await anon.fill("[name=code]", code!);
  await anon.fill("[name=password]", "brand-new-pass-9");
  await anon.click('button:has-text("Save and log in")');
  await expect(anon).toHaveURL(/\/resident\/jobs$/);
  await expect(anon.getByText("Hi Margarita")).toBeVisible();

  // The reset signed the old session out, and the old password no longer works.
  await page.goto("/resident/jobs");
  await expect(page).toHaveURL(/\/log-in/);
  await page.fill("[name=email]", email);
  await page.fill("[name=password]", "password123");
  await page.click('button:has-text("Log in")');
  await expect(page.locator("p[role=alert]")).toContainText("don't match");
});
