# New Tab extension

Every new tab shows the problem you owe. When the day's target is met the page
goes quiet — the reward is the absence of a demand.

It also keeps your LeetCode session fresh, so the driver never loses access and
you never re-paste a cookie.

## Install

1. Sign in to leetcode.com in this browser
2. Chrome → `chrome://extensions` → enable **Developer mode**
3. **Load unpacked** → select this `extension/` folder
4. Right-click the extension → **Options** → paste your driver URL and `DRIVER_TOKEN` → Save
5. Open a new tab

Saving in Options immediately pushes your LeetCode session to the driver, which
resolves your username from it. After that the service worker re-syncs on browser
start, every 3 hours, and whenever LeetCode issues a new session cookie.

## Why an extension and not a userscript

`LEETCODE_SESSION` is set **HttpOnly**, so page scripts reading `document.cookie`
cannot see it. `chrome.cookies` can — which is why this lives in the extension's
service worker rather than a Tampermonkey script.

Works in any Chromium browser (Chrome, Arc, Brave, Edge).

## What the colours mean

The background tracks how far behind you are, so you read your standing before
any words: verdigris = on track, amber = debt building, vermilion = debt ≥ 5.
The blocks along the top edge are one per outstanding problem.
