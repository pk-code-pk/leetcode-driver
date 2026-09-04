import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";
import { dueCount, pickNext } from "@/lib/queue";
import { problemUrl } from "@/lib/leetcode";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { DateTime } from "luxon";

export const dynamic = "force-dynamic";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "x-driver-token" };

/** Read-only state for the new-tab extension. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = req.headers.get("x-driver-token") ?? url.searchParams.get("token");
  if (!token || token !== process.env.DRIVER_TOKEN) {
    return NextResponse.json({ ok: false }, { status: 401, headers: cors });
  }

  const s = await getSettings();
  const day = DateTime.now().setZone(s.timezone).toFormat("yyyy-LL-dd");
  const [row] = await db.select().from(schema.days).where(eq(schema.days.day, day));

  const target = row?.targetCount ?? s.dailyNewTarget + s.debt;
  const solved = row?.newCount ?? 0;
  const solvedAll = row?.solvedCount ?? 0;
  const next = await pickNext();

  return NextResponse.json(
    {
      ok: true,
      met: solved >= target || s.paused,
      paused: s.paused,
      solved,
    solvedAll,
      target,
      due: await dueCount(),
      streak: s.streak,
      debt: s.debt,
      next: next && { ...next, url: problemUrl(next.slug) },
    },
    { headers: cors },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: { ...cors, "Access-Control-Allow-Methods": "GET,OPTIONS" } });
}
