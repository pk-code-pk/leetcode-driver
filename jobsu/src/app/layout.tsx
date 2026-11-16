import type { Metadata } from "next";
import Link from "next/link";
import { and, eq, gt, isNull, ne, or, sql } from "drizzle-orm";
import "./globals.css";
import { currentUser, homeFor } from "@/lib/auth";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { logOut } from "./actions/auth";
import { MobileTabs, NavLinks } from "@/components/Nav";

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

  const items = ready
    ? NAV[user.role].map(([href, label]) => ({ href, label, badge: href === "/messages" ? unread : 0 }))
    : [];

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..600;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen flex-col">
        {/* Floating glass navigation */}
        <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
          <div className="glass-nav mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl py-2 pl-5 pr-2">
            <Link href={ready ? homeFor(user.role) : "/"} aria-label="JobsU home" className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/JobsU-logo-nobackground.png" alt="JobsU" className="h-10 w-auto" />
            </Link>
            <nav className="flex flex-wrap items-center gap-1">
              {ready ? (
                <>
                  <NavLinks items={items} />
                  <form action={logOut}>
                    <button className="inline-flex h-9 cursor-pointer items-center rounded-md px-3.5 text-[15px] text-faint transition-colors hover:bg-navy/[0.04] hover:text-ink">
                      Log out
                    </button>
                  </form>
                </>
              ) : user ? (
                <form action={logOut}>
                  <button className="inline-flex h-9 cursor-pointer items-center rounded-md px-3.5 text-[15px] text-muted hover:text-ink">
                    Log out
                  </button>
                </form>
              ) : (
                <>
                  <Link href="/log-in" className="inline-flex h-9 items-center rounded-md px-3.5 text-[15px] text-ink transition-colors hover:text-blue">
                    Log in
                  </Link>
                  <Link href="/sign-up/student" className="hidden h-9 items-center rounded-md px-3.5 text-[15px] text-muted transition-colors hover:text-ink sm:inline-flex">
                    I&apos;m a student
                  </Link>
                  <Link href="/sign-up/resident" className="btn btn-primary btn-sm h-11">
                    Request a Job
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className={`flex-1 ${ready ? "pb-24 sm:pb-0" : ""}`}>{children}</main>
        {ready && <MobileTabs items={items} />}
        <footer className="mx-auto w-full max-w-[1400px] px-5 pb-10 pt-8">
          <div className="rule flex flex-wrap items-center justify-between gap-3 pt-6 text-[13px] text-faint">
            <p>
              <span className="text-muted">Flexible work for students. Trusted help for residents.</span>
              <span className="mx-2">·</span>© {new Date().getFullYear()} JobsU, Inc.
            </p>
            <p className="flex gap-5">
              <a className="hover:text-ink" href="https://jobsu.app/terms.html">
                Terms
              </a>
              <a className="hover:text-ink" href="https://jobsu.app/privacy.html">
                Privacy
              </a>
              <a className="hover:text-ink" href="mailto:support@jobsu.app">
                support@jobsu.app
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
