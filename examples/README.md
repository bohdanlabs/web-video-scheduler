# Examples

Two ready-to-use HTML pages with the TV Scheduler widget already embedded.

## `standalone.html`

A minimal blank page with the widget. Use this when:
- You want a TV/kiosk display that just shows scheduled videos
- You don't have an existing site to embed the widget into
- You're testing the widget before integrating it elsewhere

**Setup**: edit `CONFIG_URL` inside the file, host on any web server, open in a browser.

## `with-iframe.html`

A page that loads any URL as base content (via iframe), with the widget playing scheduled videos on top. Use this when:
- You want a TV that shows a live dashboard / website most of the time
- The video is an occasional overlay, not the main content
- This is the "kiosk on a wall in a venue" use case

**Setup**: edit both `iframe src` and `CONFIG_URL` in the file, host, open.

## `nginx-tv.conf`

Example nginx server block for serving either of the above as a kiosk page on a local Linux server. Drop into `/etc/nginx/sites-available/` and symlink to `sites-enabled/`.

For integration into an existing website (not as a standalone page), you don't need any of these examples — just use `widget.html` from the repo root directly. See the main README for instructions.
