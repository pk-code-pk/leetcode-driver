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
    const t = setTimeout(() => resolve(null), 700);
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

// Verdicts render as new nodes rather than navigations, so watch the subtree.
const obs = new MutationObserver((muts) => {
  for (const m of muts) {
    for (const node of m.addedNodes) {
      const text = node.innerText ?? node.textContent ?? "";
      if (!text || text.length > 400) continue;
      if (ACCEPTED.test(text)) return void report();
      if (REJECTED.test(text)) failed++;
    }
  }
});
obs.observe(document.body, { childList: true, subtree: true });

// Inject the page-world helper that can read the editor.
const el = document.createElement("script");
el.src = chrome.runtime.getURL("page.js");
document.documentElement.appendChild(el);

void reportOpen();
