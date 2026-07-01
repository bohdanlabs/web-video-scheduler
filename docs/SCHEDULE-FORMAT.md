# Schedule format specification

The widget reads a single JSON file from the URL set in `CONFIG_URL`. This document describes the format.

## Minimal example

```json
{
  "schedule": [
    {
      "time": "08:59",
      "video_url": "https://your-server.com/morning.mp4"
    }
  ]
}
```

Plays `morning.mp4` every day at 08:59 on all screens. That's the entire minimum config — `time` and `video_url` are the only required fields.

## Full example

```json
{
  "schedule": [
    {
      "time": "08:59",
      "days": [0, 1, 2, 3, 4, 5, 6],
      "screens": ["all"],
      "video_url": "https://your-server.com/morning.mp4",
      "max_duration_sec": 240
    },
    {
      "time": "13:00",
      "days": [1, 2, 3, 4, 5],
      "screens": ["lobby", "canteen"],
      "video_url": "https://your-server.com/lunch_promo.mp4",
      "max_duration_sec": 90
    }
  ]
}
```

## Field reference

| Field | Required | Type | Description |
|---|---|---|---|
| `time` | yes | string | When to trigger, in `HH:MM` 24-hour format. Local time of the display device. |
| `video_url` | yes | string | Full URL to an MP4 video file the widget can fetch. |
| `days` | no | array of int | Which days of the week the slot is active. `0` = Sunday, `1` = Monday, ..., `6` = Saturday. Omit (or use `[0,1,2,3,4,5,6]`) for every day. |
| `screens` | no | array of string | Which displays should play this slot. Use `["all"]` for every display, or list specific screen IDs (matched against the `?screen=` URL param). Omit for "all". |
| `max_duration_sec` | no | int | Safety stop timer in seconds. If the video doesn't fire its `ended` event for any reason (codec issue, network stall), the widget force-stops it after this many seconds. Default: 300. Set slightly longer than your actual video length. |

Comments are allowed only as keys prefixed with `_` (e.g. `_description`, `_comment`). The widget ignores any field starting with underscore.

## Day-of-week examples

```json
"days": [0, 1, 2, 3, 4, 5, 6]   // every day
"days": [1, 2, 3, 4, 5]         // weekdays only
"days": [0, 6]                  // weekends only
"days": [1]                     // Mondays only
```

If `days` is omitted, the slot plays every day.

## Multi-screen targeting

The widget reads its screen identity from the URL query string:

```
https://yoursite.com/tv?screen=lobby
                              ↑
                          screen ID
```

If no `?screen=` parameter is set, the screen ID defaults to `'all'`.

In the schedule, the `screens` field filters which slots apply:

```json
"screens": ["all"]                  // every screen plays this
"screens": ["lobby"]                // only ?screen=lobby
"screens": ["lobby", "canteen"]     // either of these two
```

A slot with `"screens": ["all"]` plays on every screen *including* screens with custom IDs.
A slot with no `screens` field is treated as `"screens": ["all"]`.

## Hot reloading

The widget refetches the JSON config every 60 seconds. You can edit the file and changes will take effect within a minute, without anyone needing to reload the page on each display.

The fetch uses `?t=<timestamp>` to bypass browser caching and `cache: 'no-store'` for good measure.

## Triggering rules

The widget checks the schedule once per second. At each check, it iterates through the (filtered-by-screen) schedule and triggers the first slot that:

1. Matches the current `HH:MM`
2. Matches today's day-of-week (if `days` is specified)
3. Has not already triggered today (per-day deduplication using a `dateKey | time | video_url` key)

Only one video plays at a time. If multiple slots have the same `time`, the first one in the array wins.

## Time-zone notes

All scheduling is **local to the display device**. The widget reads `new Date().getHours()` and `getMinutes()` from the browser, which uses the OS local time.

For multi-region deployments (displays in different countries), either:
- Set each display's OS to its local time zone, OR
- Use the `screens` field with per-region screen IDs and have separate slots for each region's local time

## Validation

The widget is forgiving — bad slots are skipped silently with a console warning. To catch errors early:

```bash
# Validate JSON syntax
cat schedule.json | python3 -m json.tool
```

Or paste into https://jsonlint.com — same result.

## Pitfalls

- **Don't use leading zeros wrong**: `"time": "8:59"` is invalid. Must be `"08:59"`.
- **Don't put schedule items outside `schedule`**: the widget reads `data.schedule` specifically.
- **Don't use HTTPS-only URLs from an HTTP page** (or vice versa) — mixed content gets blocked.
- **Don't forget CORS headers** if `schedule.json` is on a different domain from the website embedding the widget.
