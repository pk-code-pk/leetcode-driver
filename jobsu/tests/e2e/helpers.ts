import { expect, type Browser, type Page } from "@playwright/test";
import path from "node:path";
import postgres from "postgres";

export const PASSWORD = "password123";
let counter = 0;
/** A unique tag so each test's people and jobs don't collide. */
export const uniq = () => `${Date.now().toString(36)}${counter++}`;

export function db() {
  return postgres(process.env.TEST_DATABASE_URL!);
}

export async function newPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext();
  return context.newPage();
}

export async function fillAccount(page: Page, first: string, last: string, email: string) {
  await page.fill("[name=firstName]", first);
  await page.fill("[name=lastName]", last);
  await page.fill("[name=email]", email);
  await page.fill("[name=password]", PASSWORD);
  await page.check("[name=adult]");
  await page.check("[name=terms]");
}

async function confirmEmail(page: Page) {
  await page.waitForURL("**/verify");
  const code = await page.textContent("[data-testid=dev-code]");
  await page.fill("[name=code]", code!);
  await page.click('button:has-text("Confirm")');
  await page.waitForURL((u) => !u.pathname.startsWith("/verify"));
}

export async function signUpResident(page: Page, first: string, email: string) {
  await page.goto("/sign-up/resident");
  await fillAccount(page, first, "Miller", email);
  await page.selectOption("[name=town]", "Newton");
  await page.fill("[name=landmark]", "Near Newton Centre T stop");
  await page.click("button[type=submit]");
  await confirmEmail(page);
}

export async function signUpStudent(page: Page, first: string, email: string) {
  await page.goto("/sign-up/student");
  await fillAccount(page, first, "Thompson", email);
  await page.click("button[type=submit]");
  await confirmEmail(page);
  await page.fill("textarea[name=bio]", "I've done plenty of yard work and babysitting.");
  await page.click("text=Yard Work");
  await page.click('button:has-text("Save profile")');
  await expect(page.getByText("Profile saved")).toBeVisible();
}

export async function logIn(page: Page, email: string) {
  await page.goto("/log-in");
  await page.fill("[name=email]", email);
  await page.fill("[name=password]", PASSWORD);
  await page.click('button:has-text("Log in")');
  await page.waitForURL((u) => u.pathname !== "/log-in");
}

export const inDays = (n: number) => new Date(Date.now() + n * 86400_000).toISOString().slice(0, 10);

type JobInput = { title: string; rate?: string | null; hours?: string; description?: string };

/** Posts a yard-work job and returns its id. `rate: null` ticks "Not sure". */
export async function postJob(page: Page, { title, rate = "30", hours = "3", description }: JobInput): Promise<string> {
  await page.goto("/resident/jobs/new");
  await page.selectOption("[name=type]", "yard-work");
  await page.fill("[name=title]", title);
  await page.fill("textarea[name=description]", description ?? "Leaves need raking and bagging. Tools provided.");
  await page.fill("[name=startDate]", inDays(3));
  await page.fill("[name=hours]", hours);
  if (rate === null) await page.check("[name=rateNotSure]");
  else await page.fill("[name=rate]", rate);
  await page.click('button:has-text("Post job")');
  await page.waitForURL(/\/resident\/jobs\/[0-9a-f-]{36}/);
  return new URL(page.url()).pathname.split("/").pop()!;
}

export const PHOTO = path.join(__dirname, "fixtures", "face.png");

/** Applies to a job, filling in the one-time profile basics (photo, class year) when asked. */
export async function applyTo(page: Page, jobId: string) {
  await page.goto(`/student/jobs/${jobId}`);
  const photo = page.locator("input[type=file]");
  if (await photo.count()) {
    await photo.setInputFiles(PHOTO);
    await expect(page.getByRole("button", { name: "Change photo" }).first()).toBeVisible();
  }
  if (await page.locator("select[name=gradYear]").count()) {
    await page.selectOption("select[name=gradYear]", { index: 2 });
  }
  await page.fill("textarea[name=note]", "I've raked plenty of yards and I'm free this weekend.");
  await page.click('button:has-text("Apply")');
  await expect(page.getByText("You applied")).toBeVisible();
}

export async function book(page: Page, jobId: string, studentFirst: string) {
  await page.goto(`/resident/jobs/${jobId}`);
  await page.click(`button:has-text("Book ${studentFirst}")`);
  await expect(page.getByText("Your student")).toBeVisible();
}

/** A resident, a student, and a job the student has been booked for. */
export async function bookedJob(browser: Browser, title: string) {
  const tag = uniq();
  const resident = await newPage(browser);
  const student = await newPage(browser);
  const residentEmail = `res.${tag}@example.com`;
  const studentEmail = `stu.${tag}@bc.edu`;
  await signUpResident(resident, "Sarah", residentEmail);
  await signUpStudent(student, "Jake", studentEmail);
  const jobId = await postJob(resident, { title });
  await applyTo(student, jobId);
  await book(resident, jobId, "Jake");
  return { resident, student, jobId, residentEmail, studentEmail };
}
