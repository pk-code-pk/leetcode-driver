/**
 * Keeps the driver's LeetCode session fresh.
 *
 * LEETCODE_SESSION is HttpOnly, so a page script reading document.cookie can
 * never see it — chrome.cookies is the only way to read it from the browser.
 */
const SYNC_ALARM = "leetcode-driver-cookie-sync";

async function readCookie(name) {
  const c = await chrome.cookies.get({ url: "https://leetcode.com", name });
  return c?.value ?? null;
}

async function syncSession(reason = "alarm") {
  const { driverUrl, driverToken, lastCookieFp } = await chrome.storage.sync.get([
    "driverUrl",
    "driverToken",
    "lastCookieFp",
  ]);
  if (!driverUrl || !driverToken) return;

  const [session, csrf] = await Promise.all([
    readCookie("LEETCODE_SESSION"),
    readCookie("csrftoken"),
  ]);
  if (!session || !csrf) return; // signed out of LeetCode

  // Only push when the session actually changed.
  const fp = session.slice(-24);
  if (fp === lastCookieFp && reason !== "manual") return;

  try {
    const res = await fetch(`${driverUrl.replace(/\/$/, "")}/api/cookie`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-driver-token": driverToken },
      body: JSON.stringify({ session, csrf }),
    });
    if (res.ok) {
      await chrome.storage.sync.set({ lastCookieFp: fp, lastCookieAt: Date.now() });
      console.log("[leetcode-driver] session synced");
    } else {
      console.warn("[leetcode-driver] sync rejected", res.status);
    }
  } catch (e) {
    console.warn("[leetcode-driver] sync failed", e);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(SYNC_ALARM, { periodInMinutes: 180 });
  void syncSession("install");
});
chrome.runtime.onStartup.addListener(() => void syncSession("startup"));
chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === SYNC_ALARM) void syncSession("alarm");
});

// Re-sync as soon as LeetCode issues a new session cookie.
chrome.cookies.onChanged.addListener(({ cookie, removed }) => {
  if (!removed && cookie.domain.includes("leetcode.com") && cookie.name === "LEETCODE_SESSION") {
    void syncSession("cookie-change");
  }
});

// Options page asks for an immediate sync after saving credentials.
chrome.runtime.onMessage.addListener((msg, _sender, respond) => {
  if (msg?.type === "sync-now") {
    syncSession("manual").then(() => respond({ ok: true }));
    return true;
  }
});

// Clicking the toolbar icon brings the overlay back, whatever state it is in.
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "toggle-overlay" });
  } catch {
    // No content script on this page (not LeetCode or NeetCode).
  }
});
