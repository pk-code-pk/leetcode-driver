import { expect, test } from "@playwright/test";
import { applyTo, db, fillAccount, inDays, newPage, signUpResident, signUpStudent, uniq } from "./helpers";

test.describe.configure({ timeout: 180_000 });

test("a job can hire two students; applicants can be declined; the job can be reposted and the student hired again", async ({ browser }) => {
  const tag = uniq();
  const resident = await newPage(browser);
  const jake = await newPage(browser);
  const maya = await newPage(browser);
  const chris = await newPage(browser);
  await signUpResident(resident, "Sarah", `team.${tag}@example.com`);
  await signUpStudent(jake, "Jake", `jake.t${tag}@bc.edu`);
  await signUpStudent(maya, "Maya", `maya.t${tag}@bc.edu`);
  await signUpStudent(chris, "Chris", `chris.t${tag}@bc.edu`);

  // Post a job for two students, with the pay guide, transport and the stepper.
  const title = `Move boxes ${tag}`;
  await resident.goto("/resident/jobs/new");
  await resident.selectOption("[name=type]", "yard-work");
  await expect(resident.locator("[data-testid=pay-guide]")).toContainText("Most residents pay $20–$28/hr for yard work");
  await resident.fill("[name=title]", title);
  await resident.fill("textarea[name=description]", "Two of you to rake and bag the front and back yards.");
  await resident.fill("[name=startDate]", inDays(4));
  await resident.fill("[name=hours]", "2");
  await resident.locator("[data-testid=pay-guide]").getByRole("button", { name: "$24/hr" }).click();
  await resident.getByRole("button", { name: "More students" }).click();
  await expect(resident.locator("[data-testid=students-needed]")).toHaveText("2");
  await resident.getByRole("button", { name: "Walkable or on the T" }).click();
  await expect(resident.locator("aside")).toContainText("$96"); // $24 x 2h x 2 students
  await resident.click('button:has-text("Post job")');
  await resident.waitForURL(/\/resident\/jobs\/[0-9a-f-]{36}/);
  const jobId = new URL(resident.url()).pathname.split("/").pop()!;

  // Students see it as a team job, and the first one sees "Be the first".
  await jake.goto("/student/jobs?view=all");
  const card = jake.locator("[data-testid=job-card]", { hasText: title });
  await expect(card).toContainText("Hiring 2");
  await expect(card.locator("[data-testid=applied-count]")).toHaveText("Be the first");

  // The first application asks for a photo and class year, then offers the profile card.
  await applyTo(jake, jobId);
  await expect(jake.locator("[data-testid=profile-card-prompt]")).toBeVisible();
  await jake.fill("[name=hometown]", "Darien, CT");
  await jake.fill("[name=fact1]", "Coached my brother's soccer team");
  await jake.click('button:has-text("Save")');
  await expect(jake.getByText("Families will see this on your profile")).toBeVisible();
  await applyTo(maya, jobId);
  await applyTo(chris, jobId);

  await jake.goto("/student/jobs?view=all");
  await expect(jake.locator("[data-testid=job-card]", { hasText: title }).locator("[data-testid=applied-count]")).toHaveText("3 applied");

  // The resident reviews applicants side by side; the photo and profile card show.
  await resident.goto(`/resident/jobs/${jobId}`);
  await expect(resident.locator("[data-testid=applicant-row]")).toHaveCount(3);
  const pick = async (name: string) => {
    await resident.locator("[data-testid=applicant-row]", { hasText: name }).click();
    await expect(resident.locator("[data-testid=applicant] h3")).toHaveText(name);
  };
  await pick("Jake T.");
  const detail = resident.locator("[data-testid=applicant]");
  await expect(detail).toContainText("Darien, CT");
  await expect(detail).toContainText("Coached my brother's soccer team");
  await expect(detail.locator("img")).toHaveCount(1);

  // Decline Chris.
  await pick("Chris T.");
  await resident.locator("[data-testid=applicant]").getByRole("button", { name: "Decline" }).click();
  await expect(resident.locator("[data-testid=applicant-row]")).toHaveCount(2);

  // Book Jake: one place still open, so the job stays open and Maya stays in the list.
  await expect(resident.locator("[data-testid=applicant-row]", { hasText: "Chris T." })).toHaveCount(0);
  // A resident's decline sticks, even if a place opens up again later.
  const check = db();
  const [chrisApp] = await check`select a.status from applications a join users u on u.id = a.student_id where a.job_id = ${jobId} and u.first_name = 'Chris'`;
  await check.end();
  expect(chrisApp.status).toBe("passed");
  await pick("Jake T.");
  await resident.click('button:has-text("Book Jake")');
  await expect(resident.getByText("1 of 2 students booked")).toBeVisible();
  await expect(resident.locator("[data-testid=applicant-row]")).toHaveCount(1);

  // Book Maya: now the job is full.
  await resident.click('button:has-text("Book Maya")');
  await expect(resident.getByText("2 of 2 students booked")).toBeVisible();
  await expect(resident.locator("[data-testid=booked-student]")).toHaveCount(2);

  // Pay both; the job completes only after the second.
  await resident.locator("[data-testid=booked-student]", { hasText: "Jake" }).getByRole("button", { name: /pay Jake/ }).click();
  await expect(resident.locator("[data-testid=booked-student]", { hasText: "Jake" })).toContainText("Receipt");
  const sql = db();
  expect((await sql`select status from jobs where id = ${jobId}`)[0].status).toBe("booked");
  await resident.locator("[data-testid=booked-student]", { hasText: "Maya" }).getByRole("button", { name: /pay Maya/ }).click();
  await expect(resident.locator("[data-testid=booked-student]", { hasText: "Maya" })).toContainText("Receipt");
  expect((await sql`select status from jobs where id = ${jobId}`)[0].status).toBe("completed");

  // Once paid, the resident gets direct contact details and can hire Jake again.
  await expect(resident.locator("[data-testid=booked-student]", { hasText: "Jake" }).locator("[data-testid=direct-contact]")).toContainText(
    `jake.t${tag}@bc.edu`,
  );
  await resident.locator("[data-testid=booked-student]", { hasText: "Jake" }).getByRole("link", { name: /Hire Jake again/ }).click();
  await expect(resident.getByRole("heading", { name: "Post it again" })).toBeVisible();
  await expect(resident.locator("[name=title]")).toHaveValue(title);
  await expect(resident.locator("[data-testid=students-needed]")).toHaveText("2");
  await resident.fill("[name=startDate]", inDays(10));
  await resident.click('button:has-text("Post job")');
  await resident.waitForURL(/\/resident\/jobs\/[0-9a-f-]{36}\?posted=1/);
  const invites = await sql`select subject from emails where "to" = ${`jake.t${tag}@bc.edu`} and subject like '%wants to hire you again%'`;
  expect(invites.length).toBe(1);
  await sql.end();
});

test("referral links credit the person who shared them", async ({ browser }) => {
  const tag = uniq();
  const sharer = await newPage(browser);
  await signUpResident(sharer, "Nina", `nina.${tag}@example.com`);
  await sharer.goto("/account");
  const link = await sharer.locator("[data-testid=referral] input").inputValue();
  expect(link).toMatch(/\/r\/nina-[0-9a-f]{4}$/);

  const friend = await newPage(browser);
  await friend.goto(new URL(link).pathname);
  await friend.waitForURL("**/sign-up");
  await friend.goto("/sign-up/resident");
  await fillAccount(friend, "Omar", "Ali", `omar.${tag}@example.com`);
  await friend.selectOption("[name=town]", "Brookline");
  await friend.click("button[type=submit]");
  await friend.waitForURL("**/verify");

  await sharer.reload();
  await expect(sharer.locator("[data-testid=referral]")).toContainText("1 person has joined from your link");
});
