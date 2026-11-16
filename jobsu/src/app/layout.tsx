import type { Metadata } from "next";
import Link from "next/link";
import { and, eq, gt, isNull, ne, or, sql } from "drizzle-orm";
import "./globals.css";
import { currentUser, homeFor } from "@/lib/auth";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { logOut } from "./actions/auth";

export const metadata: Metadata = {
  title: "JobsU — Boston College students for Newton, Brookline and Brighton",
  description:
    "JobsU connects families in Newton, Brookline and Brighton with .edu-confirmed Boston College students for babysitting, tutoring, yard work and more.",
};

async function unreadCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(distinct ${conversations.id})::int` })
    .from(conversations)
    .innerJoin(messages, eq(messages.conversationId, conversations.id))
    .where(
      and(
        ne(messages.senderId, userId),
        or(
          and(
            eq(conversations.residentId, userId),
            or(isNull(conversations.residentLastReadAt), gt(messages.createdAt, conversations.residentLastReadAt)),
          ),
          and(
            eq(conversations.studentId, userId),
            or(isNull(conversations.studentLastReadAt), gt(messages.createdAt, conversations.studentLastReadAt)),
          ),
        ),
      ),
    );
  return row?.n ?? 0;
}

const NAV: Record<string, [string, string][]> = {
  resident: [
    ["/resident/jobs", "My jobs"],
    ["/resident/jobs/new", "Post a job"],
    ["/messages", "Messages"],
  ],
  student: [
    ["/student/jobs", "Find jobs"],
    ["/student/my-jobs", "My jobs"],
    ["/messages", "Messages"],
    ["/student/profile", "Profile"],
  ],
  admin: [
    ["/admin", "Overview"],
    ["/admin/jobs", "Jobs"],
    ["/admin/users", "People"],
    ["/admin/reports", "Reports"],
    ["/admin/outbox", "Emails"],
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const ready = user && user.emailVerifiedAt && !user.suspendedAt;
  const unread = ready && user.role !== "admin" ? await unreadCount(user.id) : 0;

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        <header className="border-b border-line bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
            <Link href={ready ? homeFor(user.role) : "/"} className="text-xl font-black tracking-tight text-navy">
              Jobs<span className="text-blue">U</span>
            </Link>
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-semibold text-muted">
              {ready ? (
                <>
                  {NAV[user.role].map(([href, label]) => (
                    <Link key={href} href={href} className="hover:text-blue">
                      {label}
                      {href === "/messages" && unread > 0 && (
                        <span className="ml-1 rounded-full bg-blue px-1.5 py-0.5 text-xs text-white" data-testid="unread">
                          {unread}
                        </span>
                      )}
                    </Link>
                  ))}
                  <form action={logOut}>
                    <button className="hover:text-blue">Log out</button>
                  </form>
                </>
              ) : user ? (
                <form action={logOut}>
                  <button className="hover:text-blue">Log out</button>
                </form>
              ) : (
                <>
                  <Link href="/log-in" className="hover:text-blue">
                    Log in
                  </Link>
                  <Link href="/sign-up" className="btn btn-primary">
                    Get started
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 pb-10 pt-6 text-xs text-muted">
          <p className="font-semibold text-navy">Flexible work for students. Trusted help for residents.</p>
          <p className="mt-1">
            © {new Date().getFullYear()} JobsU, Inc. ·{" "}
            <a className="underline" href="https://jobsu.app/terms.html">
              Terms
            </a>{" "}
            ·{" "}
            <a className="underline" href="https://jobsu.app/privacy.html">
              Privacy
            </a>{" "}
            ·{" "}
            <a className="underline" href="mailto:support@jobsu.app">
              support@jobsu.app
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
