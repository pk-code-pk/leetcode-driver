// Screens messages for attempts to move payment or contact off JobsU (Terms §12).

const PAYMENT_APPS =
  /\b(venmo|zelle|cash\s?app|paypal|apple\s?pay|google\s?pay|cash only|pay (me|you) (in )?cash|pay (me|you) directly|off[- ]?(the[- ])?(app|platform))\b/i;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
// US-style phone numbers, with or without separators
const PHONE = /(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
const HANDLE = /\b(instagram|insta|snap(chat)?|whatsapp|telegram|text me|call me|my number|my cell)\b/i;

export type ScreenResult = { body: string; flagged: boolean; reasons: string[] };

/**
 * `allowContact` is true once the pair has a booking together; before that,
 * phone numbers and emails are hidden so the first job happens on JobsU.
 */
export function screenMessage(raw: string, allowContact: boolean): ScreenResult {
  const reasons: string[] = [];
  let body = raw;

  if (PAYMENT_APPS.test(raw)) reasons.push("off-platform payment");

  if (!allowContact) {
    const hasEmail = new RegExp(EMAIL.source, "i").test(raw);
    const hasPhone = new RegExp(PHONE.source).test(raw);
    if (hasEmail || hasPhone) {
      reasons.push("contact details before booking");
      body = body.replace(EMAIL, "[contact hidden until booked]").replace(PHONE, "[contact hidden until booked]");
    }
    if (HANDLE.test(raw)) reasons.push("asked to move off JobsU");
  }

  return { body, flagged: reasons.length > 0, reasons };
}
