# Α.Ε. Δόξα Κορωπίου — website

A static, bilingual (Greek first, English second) site for Doxa Koropiou.
It runs on GitHub Pages with no server and no build step.

## Publish

1. Upload everything in this folder to the GitHub repository, including `.nojekyll` and `CNAME`.
2. **Settings → Pages**: deploy from branch `main`, folder `/ (root)`.
3. Custom domain: `aokusatsc.com` (already in `CNAME`). In Porkbun DNS, add the four GitHub Pages
   A records (185.199.108.153, .109.153, .110.153, .111.153) and a `www` CNAME to `YOUR-USERNAME.github.io`.
   Then tick **Enforce HTTPS**.

Test locally: `python3 -m http.server 8000`, then open http://localhost:8000.

## Settings: `assets/js/config.js`

| Setting | What it does |
|---|---|
| `forms` | Web3Forms access keys. **TODO:** log in to web3forms.com as igix88@outlook.com, create a key and paste it into all three slots. The keys there now are temporary. |
| `email`, `phone`, `area`, `homeGround`, `hours` | Contact details (footer and Contact page). Empty = hidden. |
| `social` | Facebook and Instagram links. |
| `epsanaSchedule`, `epsanaTable` | EPSANA links. Change the league number each season. |
| `tickets`, `pricesConfirmed`, `ticketUrl` | Season-ticket packages (indicative prices), and an optional payment link. |
| `bank`, `donateUrl` | Donations. The bank box appears once `iban` is filled. |
| `shopUrl` | Optional external shop. Empty = order form. |

## Results and table

`data/epsana.json` holds the Γ Κατηγορία standings and schedule (EPSANA league 748).
To refresh it, run `python3 scripts/fetch_epsana.py` (needs `pip install -r scripts/requirements.txt`),
or replace the file by hand. `data/epsana-config.json` has the league number and how EPSANA writes
the club's name (`ΑΕ ΔΟΞΑ ΚΟΡΩΠΙΟΥ`).

Every Doxa result automatically gets a short news story. To write your own match report instead,
add an article to `data/news.json` with `"round": n`.

## Content

| What | File |
|---|---|
| Squad (currently numbers and positions only) | `data/squad.json`: add `"name": {"el": "...", "en": "..."}` per player, then `"placeholder": false` |
| News | `data/news.json` |
| Shop products (drawings, no prices yet) | `data/store.json` + `assets/img/store/` |
| Sponsors (none yet) | `data/sponsors.json` |
| Opponent names and logos | `assets/js/clubs.js`. Add a logo path per club; without one, a lettered badge is shown |
| Interface text | `assets/js/text.js` |
| Page text | the `.html` files: Greek in the element, English in its `data-en` attribute |

## Files

```
index.html     Home: hero + next match, match rail, news, table, squad, Academy/tickets/shop, grounds
matches.html   Fixtures, results, table and every matchday (tabs)
news.html, article.html, team.html, academy.html, store.html, tickets.html,
support.html, sponsors.html, club.html, history.html, stadium.html, contact.html, privacy.html, 404.html
assets/css/doxa.css     All styles
assets/js/              config.js, clubs.js, text.js, main.js
data/                   epsana.json, epsana-config.json, news.json, squad.json, store.json, sponsors.json
scripts/                fetch_epsana.py
```
