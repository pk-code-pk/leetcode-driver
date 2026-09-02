# LeetCode Driver

Spaced repetition for LeetCode that **decides and nags**, so the only effort left is solving.

It picks the problem, pushes it to your phone, times the attempt, detects the solve by
polling LeetCode, infers how hard it was from your own submission telemetry, and
reschedules — without you tapping anything.

## What makes it different

Existing LeetCode SRS tools ([LeetTrack][lt], [LeetFlash][lf], [PatternBank][pb],
[grind][gr], [GoStudyNeetCode][gs]) all make you self-rate and all make you open the tool.
This one does neither:

| | Everything else | Here |
|---|---|---|
| Marking a problem done | you tap | polled from LeetCode |
| Rating difficulty | you judge and tap | inferred from time + failed submissions + hints used |
| Knowing when to stop grinding | your call | rescue timer at 25 min offers a hint ladder |
| Ignoring a reminder | it goes away | escalates 4 tiers, then compounds into debt |
| Session cookie upkeep | re-paste it monthly | the extension refreshes it silently |

## How grading works

`src/lib/sm2.ts` maps telemetry onto SM-2's 0–5 scale against a per-difficulty
baseline (Easy 12 min, Medium 25, Hard 45; halved for reviews), then penalizes
failed submissions and hints spent. A lapse steps the ladder *back* and floors the
interval at 3 days rather than resetting to 1 — resetting causes review pileup.

Override any inferred grade with the **Too hard / Too easy** buttons on the solve message.

## Where hints and notes come from

Sourced free wherever possible; generation only fills the gaps.

| Layer | Source | Coverage | Cost |
|---|---|---|---|
| 1 | LeetCode's own `hints` field | **45/150 problems** (23 have 3+) | free |
| 2 | Claude-generated ladder | 100% | needs `ANTHROPIC_API_KEY` |
| 3 | Official LeetCode topic tags | 100%, level 1 only | free |
| 4 | Link to a NeetCode walkthrough | always | free |

Measured, not assumed: only ~30% of the NeetCode 150 carry an official hint, and
every official *editorial* is `paidOnly`, so scraped content alone can't carry the
rescue timer — layer 2 is what makes the other 70% work. Without a key you still get
layers 1, 3 and 4, so a hint always resolves to something.

Pattern notes work the same way: Claude summarizes *your* accepted solution when a key
is set; otherwise the solve message shows the canonical LeetCode tags. Tags and official
hints are fetched once at seed time and cached, so nothing is scraped at runtime.

## Deploying for $0

Nothing here needs an always-on process. Cron and Telegram callbacks are both
request-driven, so a serverless host works and there is nothing to spin down.

| Piece | Service | Cost |
|---|---|---|
| App | Vercel | free |
| Postgres | Supabase | free |
| Cron (every 5 min) | cron-job.org -> `GET /api/cron` | free |
| Telegram | webhook (Telegram calls you) | free |

1. Supabase -> new project -> copy the connection string (use the **session pooler**
   URI; serverless opens many short-lived connections).
2. Import the repo on Vercel. Set env vars: `DATABASE_URL`, `SECRET_KEY`,
   `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `DRIVER_TOKEN`, `PUBLIC_URL`
   (your vercel.app URL), and `DISABLE_CRON=1`.
3. Locally, with the same `DATABASE_URL`: `npm run db:push && npm run seed`.
4. `npm run telegram:register` to point the bot at the deployment.
5. cron-job.org -> new job -> `https://<you>.vercel.app/api/cron`, every 5 minutes,
   with header `Authorization: Bearer <DRIVER_TOKEN>`.

`DISABLE_CRON=1` matters: serverless functions are frozen between requests, so an
in-process scheduler would never fire. The external pinger is what drives the clock.

Paid hosts (Railway ~$5/mo, Fly ~$2/mo) only buy you a long-lived process, which
this design doesn't need. Render's free tier is the trap — it sleeps, and a sleeping
service can't nag you.

## Running locally (no deploy, no public URL)

Telegram can't reach `localhost` with a webhook, so the app long-polls instead —
set `TELEGRAM_MODE=polling` (it's also the default whenever `PUBLIC_URL` is unset)
and no tunnel is needed. Outbound push works fine from a laptop.

```bash
# Postgres via Homebrew
brew services start postgresql@16
createdb leetcode_driver

cat > .env <<'ENV'
DATABASE_URL=postgresql://localhost:5432/leetcode_driver
SECRET_KEY=change-me-at-least-16-chars
DRIVER_TOKEN=change-me
TELEGRAM_BOT_TOKEN=...        # from @BotFather
TELEGRAM_MODE=polling
ENV

npm run db:push
npm run seed                  # ~50s: 150 problems + live tags + official hints
npm run build && npm start
```

Point the extension's Options at `http://localhost:3000`.

**The catch:** when the machine sleeps, cron stops and reminders don't fire. It
degrades gracefully — tiers are computed from stored state and the current clock,
so a late wake still fires the correct tier rather than losing it — but a closed
laptop at 9pm means no 9pm nudge. Move to an always-on host when you want the
nagging to be reliable.

## Setup

1. **Postgres** — Supabase or Railway's bundled Postgres; the data is a few MB, so
   every free tier is oversized for it. Put the URL in `DATABASE_URL`.
2. **Telegram bot** — message [@BotFather](https://t.me/BotFather), `/newbot`, copy the token.
3. `cp .env.example .env` and fill it in.
4. ```bash
   npm install
   npm run db:push      # create tables
   npm run seed         # load the NeetCode 150
   npm run build && npm start
   ```
5. Deploy somewhere always-on (Railway / Fly / Render). Vercel Hobby caps cron at
   once per day — if you deploy there, set `DISABLE_CRON=1` and hit `/api/cron`
   from an external pinger instead.
6. `npm run telegram:register` to point the bot at your deployment.
7. Message your bot `/start`. That binds it to your chat.
8. Install the browser extension (`extension/`) and set your driver URL + token in
   its Options. It keeps the LeetCode session fresh and resolves your username.

## Forcing functions

Escalation alone is ignorable, because you own the off switch. Two mechanisms
make skipping cost something:

**Relentless mode.** Past the last escalation tier the ladder stops climbing and
starts repeating: a nag every `relentlessEveryMin` (default 10) until the target
is met. There is no snooze and no dismiss — solving is the only thing that stops it.
Quiet hours still apply. Turn it off with `relentless = false` in settings.

**New-tab takeover.** `extension/` is a Chromium extension that replaces every new
tab with the problem you owe. The background colour tracks your debt (verdigris →
amber → vermilion) and a tally along the top edge shows one block per outstanding
problem. When the target is met the page goes quiet — the reward is the absence of
a demand. See `extension/README.md` to install.

## Surfaces

- **Telegram** — the real interface. Problems, hints, escalation, overrides.
- **`/next`** — 302s straight to the problem you should be solving. Bookmark it on your home screen.
- **`/`** — read-only stats and topic coverage.

## Commands

`/next` serve one now · `/status` where you stand · `/pause` · `/resume`

## Credits

The NeetCode 150 dataset and the anti-pileup lapse tweak are adapted from
[JMoooore/GoStudyNeetCode][gs] (MIT).

[lt]: https://chromewebstore.google.com/detail/leettrack-leetcode-tracke/ejlhjhcgckodmgjbmfieeeigmdpnkbfj
[lf]: https://apps.apple.com/us/app/leetflash-%E7%AE%97%E6%B3%95%E5%88%B7%E9%A2%98%E5%A4%8D%E4%B9%A0%E7%A5%9E%E5%99%A8/id6744669023
[pb]: https://pattern-bank.vercel.app/
[gr]: https://github.com/brandon-gong/grind
[gs]: https://github.com/JMoooore/GoStudyNeetCode
