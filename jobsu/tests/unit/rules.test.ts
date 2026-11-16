import { describe, expect, it } from "vitest";
import { addDaysISO, autoReleaseDue } from "@/lib/dates";
import { checkStudentEmail, isValidEmail, normalizeEmail } from "@/lib/edu";
import { prohibitedReasons } from "@/lib/jobTypes";
import { formatCents, formatHours, jobTotalCents, parseDollars, rateError, settle } from "@/lib/money";
import { averageRating, reviewVisible } from "@/lib/reviews";
import { screenMessage } from "@/lib/screening";

describe("money", () => {
  it("parses dollar amounts into cents", () => {
    expect(parseDollars("30")).toBe(3000);
    expect(parseDollars("$18.75")).toBe(1875);
    expect(parseDollars(" 1,200.5 ")).toBe(120050);
    expect(parseDollars("thirty")).toBeNull();
    expect(parseDollars("-5")).toBeNull();
    expect(parseDollars("")).toBeNull();
  });

  it("enforces the $18.75 minimum", () => {
    expect(rateError(1874)).toMatch(/18\.75/);
    expect(rateError(1875)).toBeNull();
    expect(rateError(3000)).toBeNull();
    expect(rateError(100000)).not.toBeNull();
  });

  it("totals a job from rate and minutes", () => {
    expect(jobTotalCents(3000, 180)).toBe(9000);
    expect(jobTotalCents(1875, 45)).toBe(1406); // 14.0625 rounds to 14.06
  });

  it("takes a 10% fee and pays out the rest", () => {
    expect(settle(3000, 150, 9000)).toEqual({ amountCents: 7500, feeCents: 750, payoutCents: 6750 });
  });

  it("never charges more than the amount held at booking", () => {
    expect(settle(3000, 240, 9000)).toEqual({ amountCents: 9000, feeCents: 900, payoutCents: 8100 });
  });

  it("keeps fee plus payout equal to the amount charged", () => {
    for (const [rate, mins] of [[1875, 45], [2999, 77], [4500, 15]]) {
      const s = settle(rate, mins, 10_000_000);
      expect(s.feeCents + s.payoutCents).toBe(s.amountCents);
    }
  });

  it("formats amounts and hours", () => {
    expect(formatCents(9000)).toBe("$90");
    expect(formatCents(6750)).toBe("$67.50");
    expect(formatHours(60)).toBe("1 hour");
    expect(formatHours(150)).toBe("2.5 hours");
    expect(formatHours(75)).toBe("1.25 hours");
  });
});

describe("student email check", () => {
  const allowed = ["bc.edu"];
  it("accepts the live campus, including subdomains and odd casing", () => {
    expect(checkStudentEmail("jake@bc.edu", allowed)).toEqual({ ok: true, school: "Boston College" });
    expect(checkStudentEmail("  Jake@BC.EDU ", allowed)).toEqual({ ok: true, school: "Boston College" });
    expect(checkStudentEmail("jake@law.bc.edu", allowed).ok).toBe(true);
  });
  it("rejects non-.edu addresses", () => {
    expect(checkStudentEmail("jake@gmail.com", allowed)).toEqual({ ok: false, reason: "not_edu" });
    expect(checkStudentEmail("jake@bc.edu.evil.com", allowed)).toEqual({ ok: false, reason: "not_edu" });
  });
  it("waitlists other campuses, including lookalike domains", () => {
    expect(checkStudentEmail("amy@harvard.edu", allowed)).toEqual({ ok: false, reason: "campus_not_live" });
    expect(checkStudentEmail("amy@notbc.edu", allowed)).toEqual({ ok: false, reason: "campus_not_live" });
  });
  it("validates and normalizes emails", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("a b@c.com")).toBe(false);
    expect(normalizeEmail(" A@B.Com ")).toBe("a@b.com");
  });
});

describe("message screening", () => {
  it("leaves ordinary messages alone", () => {
    const r = screenMessage("Saturday at 10 works. See you then!", false);
    expect(r).toEqual({ body: "Saturday at 10 works. See you then!", flagged: false, reasons: [] });
  });
  it("flags off-platform payment, before and after booking", () => {
    expect(screenMessage("just venmo me", false).reasons).toContain("off-platform payment");
    expect(screenMessage("Can you Zelle me instead?", true).reasons).toContain("off-platform payment");
    expect(screenMessage("I'll pay you in cash", true).flagged).toBe(true);
  });
  it("hides phone numbers and emails until the pair has booked", () => {
    const r = screenMessage("Call 617-555-0142 or jake@gmail.com", false);
    expect(r.body).not.toMatch(/617|gmail/);
    expect(r.reasons).toContain("contact details before booking");
    expect(screenMessage("(617) 555 0142", false).body).not.toMatch(/555/);
    expect(screenMessage("+1 617.555.0142", false).body).not.toMatch(/555/);
  });
  it("allows contact details once booked", () => {
    const r = screenMessage("My number is 617-555-0142", true);
    expect(r.body).toContain("617-555-0142");
    expect(r.flagged).toBe(false);
  });
  it("doesn't mistake times, prices or dates for phone numbers", () => {
    for (const msg of ["3 hours at $30 is $90", "See you at 10:30 on 11/19", "The house number is 1420"]) {
      expect(screenMessage(msg, false).flagged).toBe(false);
    }
  });
});

describe("prohibited work", () => {
  it("flags work JobsU doesn't allow", () => {
    expect(prohibitedReasons("Need someone to clean the gutters and fix the roof")).toContain("roof work");
    expect(prohibitedReasons("rewire a light switch")).toContain("electrical work");
    expect(prohibitedReasons("drive my kids to soccer")).toContain("paid driving of people");
    expect(prohibitedReasons("help move a piano upstairs")).toContain("moving very heavy items");
  });
  it("lets ordinary jobs through", () => {
    expect(prohibitedReasons("Rake leaves and bag them")).toEqual([]);
    expect(prohibitedReasons("Babysit two kids on Friday night")).toEqual([]);
    expect(prohibitedReasons("Piano lessons for a beginner")).toEqual([]);
    expect(prohibitedReasons("Set up a new printer")).toEqual([]);
  });
});

describe("reviews", () => {
  const completedAt = new Date("2026-11-01T12:00:00Z");
  it("stay hidden until both sides submit", () => {
    expect(reviewVisible({ bothSubmitted: false, completedAt, now: new Date("2026-11-05T12:00:00Z") })).toBe(false);
    expect(reviewVisible({ bothSubmitted: true, completedAt, now: new Date("2026-11-01T13:00:00Z") })).toBe(true);
  });
  it("become visible after 14 days even if one side never submits", () => {
    expect(reviewVisible({ bothSubmitted: false, completedAt, now: new Date("2026-11-15T12:00:00Z") })).toBe(true);
    expect(reviewVisible({ bothSubmitted: false, completedAt: null })).toBe(false);
  });
  it("average to one decimal", () => {
    expect(averageRating([])).toBeNull();
    expect(averageRating([5, 4, 4])).toBe(4.3);
  });
});

describe("auto-release", () => {
  it("is due 7 days after the job date, not before", () => {
    expect(autoReleaseDue("2026-11-10", "2026-11-16")).toBe(false);
    expect(autoReleaseDue("2026-11-10", "2026-11-17")).toBe(true);
    expect(autoReleaseDue("2026-11-10", "2026-12-01")).toBe(true);
  });
  it("adds days across month and year ends", () => {
    expect(addDaysISO("2026-11-28", 7)).toBe("2026-12-05");
    expect(addDaysISO("2026-12-28", 7)).toBe("2027-01-04");
  });
});
