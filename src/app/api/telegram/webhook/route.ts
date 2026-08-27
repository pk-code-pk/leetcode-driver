import { NextResponse } from "next/server";
import { handleUpdate, type Update } from "@/lib/updates";

export const dynamic = "force-dynamic";
// hint generation is the slow path
export const maxDuration = 60;

export async function POST(req: Request) {
  if (req.headers.get("x-telegram-bot-api-secret-token") !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  await handleUpdate((await req.json()) as Update);
  // Always 200 — a non-200 makes Telegram retry the same update forever.
  return NextResponse.json({ ok: true });
}
