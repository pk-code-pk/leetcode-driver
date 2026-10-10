import { NextResponse } from "next/server";
import { authorized } from "@/lib/auth";
import { manualSolve } from "@/lib/engine";
import { PREMIUM_ON_NEETCODE } from "@/lib/leetcode";

export const dynamic = "force-dynamic";

/** NeetCode renames the problems it hosts, so map its slug back to ours. */
const FROM_NEETCODE = Object.fromEntries(
  Object.entries(PREMIUM_ON_NEETCODE).map(([leet, neet]) => [neet, leet]),
);

/**
 * A solve observed on the page itself.
 *
 * The extension sees the verdict render, so this works on NeetCode's judge and
 * on Premium problems — neither of which produces a LeetCode submission the
 * poller could find.
 */
export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false }, { status: 401, headers: cors(req) });
  }

  let body: {
    slug?: string; host?: string; failedSubmissions?: number;
    code?: string | null; lang?: string | null;
    solvedAt?: string; durationMin?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400, headers: cors(req) });
  }

  const raw = (body.slug ?? "").trim();
  if (!raw) return NextResponse.json({ ok: false, error: "no slug" }, { status: 400, headers: cors(req) });
  const slug = FROM_NEETCODE[raw] ?? raw;

  // Optional, for logging a solve done offline: when it was solved and how long it
  // took, so the grade and the review schedule come out as if it was logged live.
  let solvedAt: Date | undefined;
  if (body.solvedAt) {
    solvedAt = new Date(body.solvedAt);
    const age = Date.now() - solvedAt.getTime();
    if (Number.isNaN(age) || age < 0 || age > 60 * 86_400_000) {
      return NextResponse.json(
        { ok: false, error: "solvedAt must be a date in the last 60 days" },
        { status: 400, headers: cors(req) },
      );
    }
  }
  const mins = Number(body.durationMin);
  const durationSec = body.durationMin != null && mins > 0 && mins < 600 ? Math.round(mins * 60) : undefined;

  const title = await manualSolve({
    expectSlug: slug,
    solvedAt,
    durationSec,
    failedSubmissions: body.failedSubmissions,
    code: body.code ?? null,
    lang: body.lang ?? null,
    source: body.host === "neetcode" ? "page:neetcode" : body.host === "site" ? "site" : "page:leetcode",
  });

  // Not an error: you solved something the driver hadn't served.
  return NextResponse.json({ ok: true, recorded: Boolean(title), title }, { headers: cors(req) });
}

function cors(req?: Request) {
  const origin = req?.headers.get("origin") ?? "";
  const allowed =
    origin === "https://leetcode.com" ||
    origin === "https://neetcode.io" ||
    origin.startsWith("chrome-extension://");
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "https://leetcode.com",
    "Access-Control-Allow-Headers": "content-type,x-driver-token",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    Vary: "Origin",
  };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { headers: cors(req) });
}
