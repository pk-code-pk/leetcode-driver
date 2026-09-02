const url = document.getElementById("url");
const token = document.getElementById("token");
const ok = document.getElementById("ok");

chrome.storage.sync.get(["driverUrl", "driverToken"]).then((s) => {
  url.value = s.driverUrl ?? "";
  token.value = s.driverToken ?? "";
});

document.getElementById("save").addEventListener("click", async () => {
  await chrome.storage.sync.set({
    driverUrl: url.value.trim().replace(/\/$/, ""),
    driverToken: token.value.trim(),
  });
  ok.textContent = "Saved. Syncing LeetCode session\u2026";
  const res = await chrome.runtime.sendMessage({ type: "sync-now" }).catch(() => null);
  ok.textContent = res?.ok
    ? "Saved. Open a new tab to check."
    : "Saved, but the session sync didn't run \u2014 make sure you're signed in to leetcode.com.";
  setTimeout(() => (ok.textContent = ""), 6000);
});
