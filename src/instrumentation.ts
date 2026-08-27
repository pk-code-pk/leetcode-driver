/** Boots the in-process scheduler and, when local, the Telegram poller. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  if (process.env.DISABLE_CRON !== "1") {
    const cron = (await import("node-cron")).default;
    const { tick, hourly } = await import("@/lib/engine");
    cron.schedule("*/5 * * * *", () => { void tick(); });
    cron.schedule("7 * * * *", () => { void hourly(); });
    console.log("[cron] scheduler started (tick every 5m, hourly checks at :07)");
  }

  // No public URL means no webhook, so fall back to long polling.
  const polling = process.env.TELEGRAM_MODE === "polling" || !process.env.PUBLIC_URL;
  if (polling && process.env.TELEGRAM_BOT_TOKEN) {
    const { startPolling } = await import("@/lib/poller");
    void startPolling();
  }
}
