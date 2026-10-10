import { NextResponse } from "next/server";
import { authorized } from "@/lib/auth";
import { forgiveDebt } from "@/lib/engine";

export const dynamic = "force-dynamic";

/** Clear the debt from missed days, from the dashboard. */
export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const was = await forgiveDebt();
  return NextResponse.json({ ok: true, was });
}
