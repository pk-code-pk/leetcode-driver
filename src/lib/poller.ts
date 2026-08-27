import { getUpdates, deleteWebhook } from "./telegram";
import { handleUpdate, type Update } from "./updates";

/**
 * Long-polling loop for local use. Telegram cannot reach localhost with a
 * webhook, so instead we call out to Telegram and hold the connection open.
 */
let running = false;

export async function startPolling() {
  if (running) return;
  running = true;

  // Telegram refuses getUpdates while a webhook is registered.
  await deleteWebhook();
  console.log("[telegram] long-polling started");

  let offset = 0;
  while (running) {
    try {
      const updates = (await getUpdates(offset, 30)) as (Update & { update_id: number })[] | null;
      if (updates?.length) {
        for (const u of updates) {
          offset = Math.max(offset, u.update_id + 1);
          await handleUpdate(u);
        }
      }
    } catch (e) {
      console.error("[telegram] poll error, backing off:", e);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

export function stopPolling() {
  running = false;
}
