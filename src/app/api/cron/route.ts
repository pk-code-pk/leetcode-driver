import { NextResponse } from "next/server";
import { tick } from "@/lib/engine";

export const dynamic = "force-dynamic";

/** Manual/external trigger, for platforms without a long-running process. */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.DRIVER_TOKEN}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  await tick();
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
