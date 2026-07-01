# Integration Guide

Three integration paths depending on what you have.

## Path 1 — Add the widget to your existing website (most common)

You have a website and want it to play scheduled videos.

### Step 1. Paste the widget

1. Open [`widget.html`](../widget.html) in this repo
2. Copy the **entire file contents** (including the comment header)
3. Open your site's main HTML file
4. Paste **just before the closing `</body>` tag**
5. Save and deploy as you normally would

The pasted code uses only the `vs-` prefix for IDs and the highest possible `z-index` — it will not conflict with anything on your existing page.

### Step 2. Host the schedule config

The widget reads `schedule.json` from a URL you control. You need to put this file somewhere your browser can fetch it from. Options, easiest first:

- **Same server as your site** — drop `schedule.json` next to your HTML files. URL becomes `https://yoursite.com/schedule.json`.
- **Any static hosting** — GitHub Pages, Cloudflare R2, S3, Netlify, etc. Free tier on any of these works.
- **Existing CMS** — most CMSes let you upload a `.json` file as a static asset.

Copy [`schedule.example.json`](../schedule.example.json) as your starting point and edit it.

### Step 3. Wire up the config URL

In the widget code you pasted, find this line:

```javascript
const CONFIG_URL = 'https://your-server.example.com/schedule.json';
```

Change the URL to where you uploaded the schedule. Save and deploy.

### Step 4. Verify it works

Open your site in a browser. You should see:

- A small blue **"Tap to enable sound"** button in the bottom-right corner. Click it once — it should disappear.
- Open the browser console (F12) — you should see a log line like `[tv-scheduler] Loaded N scheduled items for screen "all"`.
- At the next scheduled time, the video should play full-screen.

If something doesn't work, see [Troubleshooting](#troubleshooting) below.

---

## Path 2 — Use a standalone kiosk page

You want a TV/display in a venue, not integration into an existing site.

1. Take the [`examples/standalone.html`](../examples/standalone.html) file
2. Edit `CONFIG_URL` to point at your `schedule.json`
3. Host it on a small Linux box on your LAN (nginx config: [`examples/nginx-tv.conf`](../examples/nginx-tv.conf))
4. Point a kiosk browser on the TV to that URL

See the README for the hardware setup we use in production.

---

## Path 3 — Kiosk page with a base dashboard

You want a TV that shows a live dashboard most of the time, scheduled videos on top.

Same as Path 2, but start from [`examples/with-iframe.html`](../examples/with-iframe.html) instead — it embeds another URL as the base layer behind the video overlay.

Two URLs to edit:
- `iframe src="..."` — the dashboard/website you want as base content
- `CONFIG_URL` — the schedule file

---

## Multi-screen setups

If you have multiple displays and want different schedules per display:

1. Give each display a unique URL with a `?screen=X` parameter:
   - `https://yoursite.com/tv?screen=lobby`
   - `https://yoursite.com/tv?screen=canteen`
   - `https://yoursite.com/tv?screen=warehouse`

2. In `schedule.json`, set `screens` per slot:
   ```json
   {
     "time": "08:59",
     "screens": ["lobby", "canteen"],   // only these displays play this
     "video_url": "..."
   }
   ```

3. Use `["all"]` for slots that should play on every display.

See [`docs/SCHEDULE-FORMAT.md`](SCHEDULE-FORMAT.md) for the full spec.

---

## Troubleshooting

### "I see the page but no video plays at the scheduled time"

Open the browser console (F12). Look for log lines starting with `[tv-scheduler]`.

- **`Failed to load schedule: ...`** — the `CONFIG_URL` is wrong, or the server hosting `schedule.json` isn't reachable from the browser, or CORS is blocking the fetch.
- **`Loaded 0 scheduled items`** — the config URL is correct but the JSON has no items matching this `screen` ID. Check the `screens` field in each item.
- **No log at all** — the widget didn't load. Make sure you pasted the full snippet just before `</body>`.

### "Video plays but no sound"

This is normal on first page load — browsers block sound until the user interacts with the page. There should be a **"Tap to enable sound"** button in the bottom-right. Click/tap it once. Sound will be unlocked for the rest of that session.

If you don't see the button:
- It might be hidden under other content — check the page's z-index conflicts (the widget uses `2147483646` which is the max — but if your other content overrides it, the button gets buried).
- Audio was already unlocked previously and the button hid itself.

### "Audio leaks for 1–2 seconds when the video starts (Android kiosk only)"

This is the bug the widget was specifically designed to solve. If you're seeing it, you're probably running an old/forked version. The fix is built in — the `<video>` element is created dynamically only when needed. See [BATTLE-TESTED-FIXES.md](BATTLE-TESTED-FIXES.md) for the full story.

### "Video plays every time I refresh the page"

You set the schedule time too close to now and the per-day guard hasn't kicked in yet. The widget triggers each slot at most once per day per video — but if you reload the page during the scheduled minute, it sees the slot match again with a fresh in-memory state.

This isn't normally an issue in production (you don't refresh constantly). For testing, change the schedule time to a couple of minutes in the future.

### "I'm on HTTPS but the schedule.json is on HTTP"

Browsers block mixed content. Host `schedule.json` on HTTPS too.

---

## Need help integrating?

The widget is designed to be self-contained, but real integration sometimes hits edge cases — strict CSP policies, framework-specific embedding, CMS plugins, custom hosting setups.

If you want help with your specific site:

- **Telegram**: https://t.me/Boeing911

Free 20–30 min scoping call to see what you need.
