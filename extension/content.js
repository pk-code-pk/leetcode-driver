/**
 * Watches a problem page for an accepted verdict and reports it to the driver.
 *
 * This replaces polling LeetCode's API: it works on NeetCode's own judge (where
 * no LeetCode submission exists) and on Premium problems, and it needs no
 * session cookie.
 */
const HOST = location.hostname.includes("neetcode") ? "neetcode" : "leetcode";
const ACCEPTED = /\b(accepted|success|all test cases passed)\b/i;
const REJECTED = /\b(wrong answer|time limit exceeded|runtime error|compile error|memory limit)\b/i;

let lastReport = 0;
let failed = 0;

/** NeetCode renames slugs, so the driver maps them back server-side. */
function slug() {
  const m = location.pathname.match(/\/problems\/([^/]+)/);
  return m ? m[1] : null;
}

function askForCode() {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), 2500);
    window.addEventListener("message", function onMsg(e) {
      if (e.source !== window || e.data?.__ld !== "code") return;
      clearTimeout(t);
      window.removeEventListener("message", onMsg);
      resolve(e.data.payload);
    });
    window.postMessage({ __ld: "grab-code" }, "*");
  });
}

/** Tell the driver the clock actually started. */
async function reportOpen() {
  const s = slug();
  if (!s) return;
  const { driverUrl, driverToken } = await chrome.storage.sync.get(["driverUrl", "driverToken"]);
  if (!driverUrl || !driverToken) return;
  try {
    await fetch(`${driverUrl.replace(/\/$/, "")}/api/open`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-driver-token": driverToken },
      body: JSON.stringify({ slug: s }),
    });
  } catch {}
}

async function report() {
  const s = slug();
  if (!s) return;
  if (Date.now() - lastReport < 20000) return; // one verdict per submission
  lastReport = Date.now();

  const { driverUrl, driverToken } = await chrome.storage.sync.get(["driverUrl", "driverToken"]);
  if (!driverUrl || !driverToken) return;

  const got = await askForCode();
  try {
    const res = await fetch(`${driverUrl.replace(/\/$/, "")}/api/solve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-driver-token": driverToken },
      body: JSON.stringify({
        host: HOST,
        slug: s,
        failedSubmissions: failed,
        code: got?.code ?? null,
        lang: got?.lang ?? null,
      }),
    });
    if (res.ok) {
      failed = 0;
      console.log("[leetcode-driver] solve reported:", s);
      // The overlay owns the UI; tell it to ask for notes.
      window.dispatchEvent(new CustomEvent("__ld_solved", { detail: { slug: s } }));
    } else {
      console.warn("[leetcode-driver] report rejected", res.status);
    }
  } catch (e) {
    console.warn("[leetcode-driver] report failed", e);
  }
}

// The verdict is a small element ("Accepted") inside a much larger result
// panel, so scanning mutation payloads misses it whenever the panel arrives as
// one big subtree. Scan for the element itself instead, debounced.
const VERDICT_SEL = "span, div, h1, h2, h3, p, strong";

function scanVerdict() {
  // LeetCode paints the live verdict green ("text-xl font-medium text-green-s")
  // and greys out the submission-history rows, which also read "Accepted" — so
  // colour, not text, is what separates this submission from an old one.
  for (const el of document.querySelectorAll("div, span, h1, h2, h3, strong, p")) {
    if (el.children.length) continue;
    const t = el.textContent?.trim();
    if (!t || t.length > 48) continue;
    const cls = String(el.className ?? "");
    const prominent = /green|text-xl/.test(cls);

    if (ACCEPTED.test(t)) {
      // On NeetCode the classes differ, so fall back to any short verdict there.
      if (prominent || HOST === "neetcode") return "accepted";
    }
    if (REJECTED.test(t) && (/red/.test(cls) || HOST === "neetcode")) return "rejected";
  }
  return null;
}

let scanTimer = null;
let lastVerdict = null;

function scheduleScan() {
  if (scanTimer) return;
  scanTimer = setTimeout(() => {
    scanTimer = null;
    const v = scanVerdict();
    if (!v || v === lastVerdict) { lastVerdict = v; return; }
    lastVerdict = v;
    if (v === "accepted") report();
    else failed++;
  }, 400);
}

const obs = new MutationObserver(scheduleScan);
obs.observe(document.body, { childList: true, subtree: true, characterData: true });
scheduleScan();

// Inject the page-world helper that can read the editor.
const el = document.createElement("script");
el.src = chrome.runtime.getURL("page.js");
document.documentElement.appendChild(el);

void reportOpen();
