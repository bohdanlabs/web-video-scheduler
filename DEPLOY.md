# Site Deployment Guide

Target: Netlify / Vercel / GitHub Pages — pick one. Netlify recommended (free, easiest form handling).

## Files to deploy
All 5 files in this directory:
- `index.html` — landing page
- `demo.html` + `demo.js` — interactive demo
- `lang.js` — EN/UK language switcher
- `style.css` — styles

## Critical: fix the contact form before deploying

The form (`#contactForm`) is currently a **mock** — it shows a thank-you message but sends nothing. Leads will be lost.

### Option A — Netlify (recommended, free)
1. Add `netlify` attribute to the `<form>` tag in `index.html`:
   ```html
   <form class="contact-form" id="contactForm" novalidate netlify name="contact">
   ```
2. Add a hidden field inside the form:
   ```html
   <input type="hidden" name="form-name" value="contact" />
   ```
3. Remove the JS mock submit handler in `index.html` (the `(function () { ... }())` block with `cfThanks`), or let Netlify redirect to its own success page.
4. Submissions arrive in Netlify → Forms → contact. Configure email notification there.

### Option B — Formspree (works on any host)
1. Create account at formspree.io → new form → copy the endpoint ID.
2. Change the form tag:
   ```html
   <form action="https://formspree.io/f/YOUR_ID" method="POST" class="contact-form" id="contactForm">
   ```
3. Remove the JS mock handler.

### Option C — Skip the form (fastest)
Remove the form entirely. The Telegram link (`@Boeing911`) at the bottom already serves as the CTA. Less friction for Ukrainian users who prefer Telegram anyway.

## Checklist before going live
- [ ] Form actually sends (test with a real submission)
- [ ] Both languages work (click UK / EN toggle)
- [ ] Demo link (`/demo.html`) loads and the demo runs
- [ ] Telegram link (`@Boeing911`) opens correctly
- [ ] Mobile layout looks OK (test on real phone)
- [ ] Share the public URL → paste into Plan D DMs for the 42 existing contacts
