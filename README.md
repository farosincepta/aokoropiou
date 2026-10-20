# Α.Ο. Κορωπίου — Version 9 (PWA)

This is Version 8 with installable Progressive Web App functionality added. All Greek, English and Spanish pages remain.

## Publishing
Upload **all** files and folders to the root of your website hosting. This includes `manifest.webmanifest`, `sw.js`, `icon-192.png`, and `icon-512.png`. Keep `/en/`, `/es/` and `/assets/`.

The PWA requires **HTTPS** (or `localhost` for development). Opening `index.html` from your computer using `file://` lets you preview the pages but **cannot install the PWA** or enable offline caching.

On Android Chrome, visit the published site and use **Install app** or **Add to Home screen** from the browser menu. On iPhone Safari, use **Share → Add to Home Screen** (and **Open as Web App** when offered). Installation options depend on browser and iOS version.

The first successful online visit downloads the site for offline viewing; external Facebook/Instagram links still require connectivity. Offline content reflects the last downloaded version. A service worker update is downloaded when visitors revisit the website online.

## Important
This is a demonstration site with sample content, not verified club announcements. Do not represent it as an official club app without authorization. GitHub Pages deployment depends on repository settings and account eligibility; a private repository may not support Pages on a free plan.
