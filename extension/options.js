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
  ok.textContent = "Saved. Open a new tab to check.";
  setTimeout(() => (ok.textContent = ""), 3000);
});
