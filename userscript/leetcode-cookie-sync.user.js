// ==UserScript==
// @name         LeetCode Driver — session sync
// @namespace    leetcode-driver
// @version      1.0
// @description  Keeps the driver's LeetCode session fresh so you never re-paste a cookie.
// @match        https://leetcode.com/*
// @grant        GM_xmlhttpRequest
// @connect      *
// ==/UserScript==

// ---- configure these two, then reload leetcode.com once -------------------
const DRIVER_URL = "https://YOUR-APP.up.railway.app";
const DRIVER_TOKEN = "YOUR_DRIVER_TOKEN";
// ---------------------------------------------------------------------------

(function () {
  "use strict";

  const KEY = "leetcode-driver:last-push";
  const SIX_HOURS = 6 * 60 * 60 * 1000;

  const cookie = (name) =>
    document.cookie.split("; ").find((c) => c.startsWith(name + "="))?.split("=")[1] ?? null;

  const session = cookie("LEETCODE_SESSION");
  const csrf = cookie("csrftoken");
  if (!session || !csrf) return; // signed out

  // Only push when the value actually changed, or it's been a while.
  const fingerprint = session.slice(-24);
  let last = {};
  try { last = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch {}
  if (last.fp === fingerprint && Date.now() - (last.at || 0) < SIX_HOURS) return;

  const username =
    document.cookie.includes("LEETCODE_SESSION") &&
    (window.__NEXT_DATA__?.props?.pageProps?.userStatus?.username || null);

  GM_xmlhttpRequest({
    method: "POST",
    url: DRIVER_URL.replace(/\/$/, "") + "/api/cookie",
    headers: { "Content-Type": "application/json", "x-driver-token": DRIVER_TOKEN },
    data: JSON.stringify({ session, csrf, username }),
    onload: (res) => {
      if (res.status === 200) {
        localStorage.setItem(KEY, JSON.stringify({ fp: fingerprint, at: Date.now() }));
        console.log("[leetcode-driver] session synced");
      } else {
        console.warn("[leetcode-driver] sync failed", res.status, res.responseText);
      }
    },
    onerror: (e) => console.warn("[leetcode-driver] sync error", e),
  });
})();
