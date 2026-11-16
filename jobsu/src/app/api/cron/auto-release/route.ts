import { NextResponse } from "next/server";
import { runAutoRelease } from "@/lib/bookings";

// Call daily from a scheduler: GET /api/cron/auto-release with "Authorization: Bearer $CRON_SECRET".
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const released = await runAutoRelease();
  return NextResponse.json({ released });
}
