AOK VERSION 22 — HEADER + CACHE REPAIR

Upload styles.css and sw.js to the ROOT of your GitHub Pages repository, replacing the existing files.

These files are based on the actual Version 21 files supplied by the user.
styles.css: retains all existing styles and reinforces the separate white header row.
sw.js: changes the cache name and fetches styles.css from the network first, with offline fallback.

IMPORTANT: Existing pages use <link href="styles.css"> (or ../styles.css). If the live browser remains stale after deployment, open the site in a new private/incognito window, or clear its site data/service worker.

This patch does not modify any HTML files. The HTML must already have the aok-header-bottom-wrap and aok-header-bottom containers (present in the Version 21 site).

README is for your reference only; it does not need to be uploaded to GitHub.
