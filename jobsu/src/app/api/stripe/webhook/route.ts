import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { studentProfiles } from "@/db/schema";
import { confirmBooking } from "@/lib/jobFlow";
import { constructWebhookEvent } from "@/lib/payments";

// Stripe calls this when a resident finishes checkout (the hold is in place)
// and when a student's payout account changes.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  let event;
  try {
    event = constructWebhookEvent(await request.text(), signature);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "bad signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const bookingId = session.metadata?.bookingId;
    const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    if (bookingId && paymentIntent) await confirmBooking(bookingId, paymentIntent);
  } else if (event.type === "account.updated") {
    const account = event.data.object;
    await db
      .update(studentProfiles)
      .set({ payoutsEnabled: Boolean(account.payouts_enabled && account.details_submitted) })
      .where(eq(studentProfiles.stripeAccountId, account.id));
  }
  return NextResponse.json({ received: true });
}
