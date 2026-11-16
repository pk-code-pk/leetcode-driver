import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { appUrl } from "./config";

/**
 * Payment flow (Terms §9): the job amount is pre-authorized when a resident
 * books a student, captured when the job is confirmed complete, and the
 * platform fee is taken out before the student's payout.
 *
 * "mock" simulates all of this so the product works end to end without Stripe.
 * "stripe" uses Stripe Checkout (manual capture) with Connect destination charges.
 */
export type PaymentsProvider = "mock" | "stripe";

export function paymentsProvider(): PaymentsProvider {
  return process.env.PAYMENTS_PROVIDER === "stripe" ? "stripe" : "mock";
}

let stripeClient: Stripe | null = null;
function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  return (stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY));
}

export type AuthorizeInput = {
  bookingId: string;
  jobId: string;
  jobTitle: string;
  amountCents: number;
  residentEmail: string;
  studentStripeAccountId: string | null;
};

export type AuthorizeResult =
  | { kind: "authorized"; ref: string } // hold is in place
  | { kind: "redirect"; url: string; ref: string }; // resident must enter card details

export async function authorizePayment(input: AuthorizeInput): Promise<AuthorizeResult> {
  if (paymentsProvider() === "mock") return { kind: "authorized", ref: `mock_${randomUUID()}` };

  if (!input.studentStripeAccountId) throw new Error("This student hasn't set up payouts yet.");
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_email: input.residentEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: input.amountCents,
          product_data: { name: `JobsU: ${input.jobTitle}` },
        },
      },
    ],
    payment_intent_data: {
      capture_method: "manual",
      transfer_data: { destination: input.studentStripeAccountId },
      metadata: { bookingId: input.bookingId },
    },
    metadata: { bookingId: input.bookingId },
    success_url: `${appUrl()}/resident/jobs/${input.jobId}?paid=1`,
    cancel_url: `${appUrl()}/resident/jobs/${input.jobId}?paid=0`,
  });
  return { kind: "redirect", url: session.url!, ref: session.id };
}

/** Capture the final amount; the fee stays with JobsU and the rest goes to the student. */
export async function capturePayment(ref: string, amountCents: number, feeCents: number): Promise<void> {
  if (ref.startsWith("mock_")) return;
  await stripe().paymentIntents.capture(ref, {
    amount_to_capture: amountCents,
    application_fee_amount: feeCents,
  });
}

/** Release the hold without charging. */
export async function cancelPayment(ref: string | null): Promise<void> {
  if (!ref || ref.startsWith("mock_") || ref.startsWith("cs_")) return;
  await stripe().paymentIntents.cancel(ref);
}

/** Create (if needed) a student's Stripe Connect account and return an onboarding link. */
export async function studentOnboardingLink(opts: {
  email: string;
  existingAccountId: string | null;
}): Promise<{ accountId: string; url: string }> {
  const accountId =
    opts.existingAccountId ??
    (
      await stripe().accounts.create({
        type: "express",
        email: opts.email,
        capabilities: { transfers: { requested: true } },
        business_type: "individual",
      })
    ).id;
  const link = await stripe().accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${appUrl()}/student/payouts?refresh=1`,
    return_url: `${appUrl()}/student/payouts?done=1`,
  });
  return { accountId, url: link.url };
}

export async function payoutsEnabled(accountId: string): Promise<boolean> {
  const account = await stripe().accounts.retrieve(accountId);
  return Boolean(account.payouts_enabled && account.details_submitted);
}

export function constructWebhookEvent(payload: string, signature: string): Stripe.Event {
  if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  return stripe().webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
}
