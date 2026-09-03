import { NextResponse } from "next/server";
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
  if (req.headers.get("x-driver-token") !== process.env.DRIVER_TOKEN) {
    return NextResponse.json({ ok: false }, { status: 401, headers: cors(req) });
  }

  let body: {
    slug?: string; host?: string; failedSubmissions?: number;
    code?: string | null; lang?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400, headers: cors(req) });
  }

  const raw = (body.slug ?? "").trim();
  if (!raw) return NextResponse.json({ ok: false, error: "no slug" }, { status: 400, headers: cors(req) });
  const slug = FROM_NEETCODE[raw] ?? raw;

  const title = await manualSolve({
    expectSlug: slug,
    failedSubmissions: body.failedSubmissions,
    code: body.code ?? null,
    lang: body.lang ?? null,
    source: body.host === "neetcode" ? "page:neetcode" : "page:leetcode",
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
