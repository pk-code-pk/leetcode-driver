import "dotenv/config";
import { setWebhook } from "../src/lib/telegram";

const base = process.env.PUBLIC_URL;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
if (!base || !secret) throw new Error("PUBLIC_URL and TELEGRAM_WEBHOOK_SECRET must be set");

setWebhook(`${base.replace(/\/$/, "")}/api/telegram/webhook`, secret)
  .then((r) => { console.log("webhook registered:", r); process.exit(0); })
  .catch((e) => { console.error(e); process.exit(1); });
