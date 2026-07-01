# Contributing

Thanks for thinking about contributing!

## Reporting bugs

Open an issue with:
- What you expected to happen
- What actually happened
- Your setup (browser/kiosk version, device, OS)
- Browser console output (lines starting with `[tv-scheduler]`)
- Your `schedule.json` (redact URLs if needed)

For audio/playback bugs specifically:
- Exact Android version and WebView version (if kiosk display)
- Whether the issue happens on page load, on schedule trigger, or both

## Suggesting features

Open a discussion first for anything bigger than a small tweak. Many of the "obvious" extensions (web UI, multi-screen management, analytics) are intentionally outside the scope of the core widget — see the README for context.

## Pull requests

- Keep them focused — one change per PR
- Match the existing style: plain JS, no frameworks, no transpilers, no build step
- Don't reintroduce a static `<video>` element — see `docs/BATTLE-TESTED-FIXES.md`
- Update docs if you change configuration or behavior
- Test on a real kiosk browser if you're touching playback or scheduling logic

## Code of conduct

Be civil. Disagreements are fine, personal attacks aren't.

## Questions

Open a GitHub Discussion, or reach out directly:
- Telegram: https://t.me/Boeing911
