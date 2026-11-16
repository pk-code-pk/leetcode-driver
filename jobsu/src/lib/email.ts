import { db } from "@/db";
import { emails } from "@/db/schema";
import { appUrl } from "./config";

type Mail = { to: string; subject: string; body: string };

/**
 * Every email is recorded in the outbox (visible at /admin/outbox). When
 * RESEND_API_KEY is set it is also delivered through Resend. A delivery
 * failure is recorded but never breaks the action that triggered the email.
 */
export async function sendEmail(mail: Mail): Promise<void> {
  const body = `${mail.body}\n\n— JobsU\n${appUrl()}`;
  const key = process.env.RESEND_API_KEY;
  let provider = "outbox";
  let error: string | null = null;

  if (key) {
    provider = "resend";
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "JobsU <support@jobsu.app>",
          to: mail.to,
          subject: mail.subject,
          text: body,
        }),
      });
      if (!res.ok) error = `Resend ${res.status}: ${(await res.text()).slice(0, 300)}`;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }

  await db.insert(emails).values({ to: mail.to, subject: mail.subject, body, provider, error });
}

export async function sendMany(mails: Mail[]): Promise<void> {
  for (const m of mails) await sendEmail(m);
}
