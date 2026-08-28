const $ = (id) => document.getElementById(id);
const MAX_BLOCKS = 24;

function paint(state) {
  document.documentElement.dataset.state = state;
}

function tally(n) {
  const el = $("tally");
  el.innerHTML = "";
  if (n <= 0) { el.classList.add("empty"); return; }
  el.classList.remove("empty");
  for (let i = 0; i < Math.min(n, MAX_BLOCKS); i++) {
    const b = document.createElement("span");
    b.style.animationDelay = `${i * 24}ms`;
    el.appendChild(b);
  }
}

function render(s) {
  const owed = Math.max(0, s.target - s.solved);
  $("daystamp").textContent = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" });

  if (s.paused) {
    paint("clear"); tally(0);
    $("eyebrow").textContent = "Paused";
    $("title").textContent = "Paused";
    $("tags").textContent = "Send /resume to the bot when you want it back.";
    $("ledger").textContent = `Streak ${s.streak}`;
    return;
  }

  if (s.met || !s.next) {
    paint("clear"); tally(0);
    $("eyebrow").textContent = "Clear";
    $("title").textContent = s.next ? "Done for today" : "Nothing due";
    $("tags").textContent = "";
    $("ledger").textContent = `${s.solved} of ${s.target} done · streak ${s.streak}`;
    return;
  }

  paint(s.debt >= 5 ? "critical" : s.debt >= 2 ? "behind" : "due");
  tally(owed + s.debt);

  $("eyebrow").textContent = "Outstanding";
  $("title").textContent = s.next.title;
  $("tags").textContent = [s.next.difficulty, s.next.isReview ? "Review" : "New"].join(" · ");

  const action = $("action");
  action.href = s.next.url;
  action.hidden = false;
  action.textContent = s.next.isReview ? "Solve it again" : "Solve it";

  $("ledger").textContent =
    `${s.solved} of ${s.target} done · ${s.due} due` + (s.debt ? ` · debt ${s.debt}` : "");
  $("dismiss").hidden = false;
}

function fail(message, hint) {
  paint("error"); tally(0);
  $("eyebrow").textContent = "Not connected";
  $("title").textContent = message;
  $("tags").textContent = hint;
  $("ledger").textContent = "";
}

async function main() {
  const { driverUrl, driverToken } = await chrome.storage.sync.get(["driverUrl", "driverToken"]);
  if (!driverUrl || !driverToken) {
    return fail("Set your driver URL", "Right-click the extension → Options.");
  }
  try {
    const res = await fetch(`${driverUrl.replace(/\/$/, "")}/api/status`, {
      headers: { "x-driver-token": driverToken },
      cache: "no-store",
    });
    if (res.status === 401) return fail("Token rejected", "Check DRIVER_TOKEN in Options.");
    if (!res.ok) return fail(`Driver returned ${res.status}`, "Is the deployment up?");
    render(await res.json());
  } catch {
    fail("Can't reach the driver", `Tried ${driverUrl}. Check the URL in Options.`);
  }
}

// Escape hatch: available, never encouraged. Resets on the next tab.
$("dismiss").addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "https://www.google.com";
});

main();
