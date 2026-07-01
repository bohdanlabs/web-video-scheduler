# Battle-tested fixes

The widget code is small (~200 lines) but the simplicity was earned through weeks of debugging on real hardware. Three non-obvious problems and how they're solved.

## 1. Browser autoplay restrictions

### The problem

Modern browsers block `<video>` autoplay with sound until the user has interacted with the page at least once. This is the Web Autoplay Policy — it exists to stop random websites from blasting audio at you. It also breaks any scheduled-playback widget unless explicitly handled.

The naive fix is to call `video.play()` and let the browser autoplay it muted, then unmute later. This works on desktop browsers but fails on Android WebView (the engine behind Fully Kiosk Browser, the de-facto choice for kiosk displays). On Android WebView the unmute attempt also gets blocked, and the video just keeps playing silent.

### The fix

A Web Audio API silent oscillator on the first user interaction. The widget creates a near-zero-duration silent tone using the Web Audio API, which "primes" the audio context for the rest of the session. After that, `<video>` elements created in the same session can play with sound.

```javascript
const ctx = new AudioContext();
const osc = ctx.createOscillator();
const gain = ctx.createGain();
gain.gain.value = 0;
osc.connect(gain);
gain.connect(ctx.destination);
osc.start();
osc.stop(ctx.currentTime + 0.001);
```

User taps the "Tap to enable sound" button → this runs once → audio works for the rest of the session.

## 2. Audio leak that survives the Web Audio API fix

### The problem

On older Android WebView versions (still common on cheap Android TV boxes shipping with Android 9/10), the audio unlock above isn't enough. The kiosk browser starts buffering the `<video>` element the moment it appears in the DOM — even before any user interaction, even before the scheduled time. This produces a brief but jarring audio leak of 1–3 seconds when the page loads.

This was the bug that took the longest to figure out, because:
- It doesn't reproduce on desktop browsers
- It doesn't reproduce on newer Android versions
- The Web Audio API trick masks it sometimes but not always
- Standard tricks like `preload="none"` and `muted` defaults don't help — the kiosk browser ignores them

The root cause: just having a `<video>` element in the DOM is enough to trigger the kiosk's "I have autoplay permission for this domain, let me prepare this video" logic. The Web Audio API only controls the audio context — it can't prevent the kiosk from initializing the video element itself.

### The fix

Don't put a `<video>` element in the HTML at all. Instead, create it dynamically with `document.createElement('video')` only at playback time, and destroy it (`removeAttribute('src')`, `.load()`, `parentNode.removeChild()`) when the video ends.

Between plays, there's no `<video>` in the DOM for the browser to autoplay, buffer, or "leak" audio from. The kiosk has nothing to prepare. The page sits as a static document until the schedule fires, then the element appears, plays cleanly, and disappears.

```javascript
function playVideo(item) {
  player = document.createElement('video');
  player.playsInline = true;
  player.muted = false;

  const source = document.createElement('source');
  source.src = item.video_url;
  source.type = 'video/mp4';
  player.appendChild(source);
  player.addEventListener('ended', stopVideo);

  overlay.appendChild(player);
  overlay.classList.add('active');
  player.play();
}

function stopVideo() {
  if (player) {
    player.pause();
    player.removeAttribute('src');
    player.load();          // forces buffer cleanup
    player.parentNode.removeChild(player);
    player = null;
  }
}
```

This is the actual root-cause fix. It's also why the widget can't use `preload="auto"` — there's no static element to preload to. Trade-off: a fraction of a second of buffering delay at playback start, in exchange for zero audio leak between plays. For scheduled-overlay use, this is a great trade.

## 3. Reload frequency vs. autoplay permission

### The problem

Long-running kiosk pages should reload occasionally — to free memory, pick up code changes, recover from invisible JavaScript errors. The common default is "reload every day at 04:00".

But every page reload tears down the audio context. On devices where the kiosk browser doesn't persist autoplay permission across reloads (which is most cheap Android TV boxes), this means a human has to physically touch the device every morning to re-enable sound. That's not scalable for production signage in dozens of locations.

### The fix

If you control the page (not just the widget), make the kiosk reload **weekly**, not daily. The widget itself doesn't reload — but `examples/with-iframe.html` shows how to reload the embedded iframe every hour while keeping the host page alive. That's enough to refresh dashboard content without losing the audio context.

If you don't control the page (widget is embedded in someone else's site), this isn't your concern — the host page reload policy is theirs to set.

## Why this matters

For a developer reading the code casually, all three fixes look like minor implementation details. They're not. They're the difference between "demo works on my laptop" and "runs 24/7 in production for months without intervention."

If you fork this widget and decide to "simplify" any of these — particularly putting `<video>` back into the static HTML — you'll save a few lines of code and lose months of stability on real hardware. Don't.

If you've solved these problems differently and have a cleaner approach, please open an issue or a PR. Genuinely interested.
