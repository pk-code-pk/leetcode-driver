const API = (method: string) =>
  `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;

export type Button = { text: string; url?: string; callback_data?: string };

async function call<T = unknown>(method: string, body: Record<string, unknown>): Promise<T | null> {
  if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  const res = await fetch(API(method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { ok: boolean; result?: T; description?: string };
  if (!json.ok) {
    console.error(`[telegram] ${method} failed: ${json.description}`);
    return null;
  }
  return json.result ?? null;
}

export async function sendMessage(
  chatId: string,
  text: string,
  opts: { buttons?: Button[][]; silent?: boolean } = {},
) {
  return call<{ message_id: number }>("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    disable_notification: opts.silent ?? false,
    reply_markup: opts.buttons ? { inline_keyboard: opts.buttons } : undefined,
  });
}

export async function editMessage(
  chatId: string,
  messageId: number,
  text: string,
  buttons?: Button[][],
) {
  return call("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    reply_markup: buttons ? { inline_keyboard: buttons } : undefined,
  });
}

export async function answerCallback(callbackId: string, text?: string) {
  return call("answerCallbackQuery", { callback_query_id: callbackId, text, show_alert: false });
}

export async function setWebhook(url: string, secret: string) {
  return call("setWebhook", {
    url,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
  });
}

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Long-polling support, for running without a public URL. */
export async function getUpdates(offset: number, timeoutSec = 30) {
  return call<{ update_id: number }[]>("getUpdates", {
    offset,
    timeout: timeoutSec,
    allowed_updates: ["message", "callback_query"],
  });
}

/** A registered webhook blocks getUpdates, so polling must clear it first. */
export async function deleteWebhook() {
  return call("deleteWebhook", { drop_pending_updates: false });
}
