# Α.Ο. Κορωπίου 1903 — website

A static, bilingual (Greek first, English second) website for AO Koropiou.
It runs on **GitHub Pages** with no server and no build step. Results, fixtures
and the league table update themselves from **EPSANA** through a scheduled
GitHub Action.

---

## 1. Put it on GitHub

1. Create a new repository (e.g. `aokoropi-website`) and upload **everything in this
   folder**, including the hidden `.github` folder and `.nojekyll`.
   *Tip:* with GitHub Desktop or `git push`, hidden folders are included automatically.
   If you drag-and-drop on github.com, also create `.github/workflows/epsana-sync.yml` by hand.
2. **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main`, folder `/ (root)` → Save.
3. **Settings → Actions → General** → *Workflow permissions* → select **Read and write permissions** → Save.
   (This lets the EPSANA job save new results.)
4. **Actions** tab → *Update results from EPSANA* → **Run workflow** once to test it.

## 2. Connect the Porkbun domain

In **Porkbun → Domain → DNS**, delete any default "parking" records for the domain and add:

| Type  | Host  | Answer                    |
|-------|-------|---------------------------|
| A     | (blank) | 185.199.108.153         |
| A     | (blank) | 185.199.109.153         |
| A     | (blank) | 185.199.110.153         |
| A     | (blank) | 185.199.111.153         |
| CNAME | www   | `YOUR-GITHUB-USERNAME.github.io` |

Then in GitHub **Settings → Pages → Custom domain** type `www.yourdomain.gr`, Save, wait for the
DNS check, and tick **Enforce HTTPS** (can take up to an hour). GitHub creates the `CNAME` file for you.
Also update `siteUrl` in `assets/js/config.js`.

## 3. How the EPSANA updates work

* `.github/workflows/epsana-sync.yml` runs **every hour**, and **every 15 minutes on Saturday and
  Sunday afternoons/evenings** (match days).
* It runs `scripts/fetch_epsana.py`, which reads the standings and schedule pages and writes
  `data/epsana.json`. It only commits when something actually changed.
* GitHub Pages republishes automatically about a minute after each commit, and visitors with the
  page open get fresh data every 10 minutes.
* If EPSANA is down or changes its layout, the site keeps showing the last good data and GitHub
  emails you that the job failed.
* **New season:** change `league_id` in `data/epsana-config.json` (the number at the end of the
  EPSANA standings link). If EPSANA renames the club, change `club_name` there too.
* GitHub pauses scheduled jobs in repositories with no activity for 60 days. During the season the
  job's own commits keep it active; after the summer break, open **Actions** and re-enable it if asked.

## 4. Club settings — `assets/js/config.js`

Everything the club needs to supply is in this one file (look for `TODO`):

| Setting | What it does |
|---|---|
| `clubEmail` | **info@aokoropiou.gr** — receives the Contact and Academy forms. |
| `salesEmail` | **sales@aokoropiou.gr** — receives season-ticket requests, sponsorship enquiries and store orders. |
| `epsanaResults`, `epsanaStandings` | The EPSANA pages that the "Results" and "League table" links open in a new tab. Change the number at the end each season. |
| `storeUrl` | Optional link to an external online shop. Empty = products from `data/store.json` with an order form. |
| `phone`, `mobile`, `address`, `officeHours` | Contact page and footer. |
| `social` | Facebook / Instagram / YouTube / TikTok links (empty = hidden). |
| `seasonTicketUrl` | Link to the payment page for season tickets. Empty = a request form that emails `salesEmail`. |
| `seasonTickets`, `ticketPricesConfirmed` | Ticket types and prices. **The prices included are examples** — confirm them, then set `ticketPricesConfirmed: true`. |
| `bank` | Beneficiary, bank, IBAN, BIC for donations. The bank section appears as soon as `iban` is filled. |
| `donateUrl` | Optional card / Apple Pay / Google Pay donation link. |

**Donations by card:** create a payment link with **Viva Wallet** (Greek, pays to a Greek IBAN),
**Stripe Payment Links** or **PayPal Donate**, connected to the club's bank account, and paste it
into `donateUrl`. The same services work for `seasonTicketUrl`.

## 5. Activate the forms (one time)

The forms use **FormSubmit** (free, no account):

1. Publish the site (both emails are already set in `config.js`).
2. Submit the **Contact** form once yourself → FormSubmit emails an **activation link to info@aokoropiou.gr** — click it.
3. Submit the **season-ticket request** form once → an activation link goes to **sales@aokoropiou.gr** — click it.
   From then on every Academy registration and message arrives by email, as a table, with
   *Reply* going straight to the parent or sender.
4. Optional: FormSubmit's activation email also gives a random alias; you can paste that alias
   into `clubEmail` instead of the real address to hide it from spam bots.

## 6. Updating content

| What | File | Notes |
|---|---|---|
| Players | `data/players.json` | **Currently an example squad.** Replace with real players, then set `"example": false` to remove the notice. `position`: `gk`, `df`, `mf`, `fw`. `dob` as `YYYY-MM-DD` — age is calculated automatically. Photos go in `assets/img/players/` (portrait 4:5, e.g. 600×750). |
| Coaching staff | `data/players.json` → `staff` | |
| News | `data/news.json` | Newest first is automatic. `category`: `match`, `club`, `academy`. Add `"image": "assets/img/news/photo.jpg"` for a photo; without one, the `cover` (score/date) is shown on stripes. The first five articles describe real results from EPSANA; the Academy one should be checked by the club. |
| Store | `data/store.json` | **Currently example products** with drawings instead of photos and no prices. Add real photos (square), set `price`, then `"example": false`. `category`: `kit` or `fan`. |
| Sponsors | `data/sponsors.json` | Add `{ "name", "logo", "url" }`. Empty spaces invite new sponsors. |
| Opponent names | `assets/js/teams.js` | Nice Greek/English names and badges for EPSANA club names. New clubs work automatically. |
| Board members | `club.html` (the "Θα ανακοινωθεί" names) and `assets/js/i18n.js` | |
| Page text | the `.html` files (Greek) and `assets/js/i18n.js` (English, same key as `data-i18n`) | |

## 7. Files

```
index.html            Home: hero with motto, matchday (last / next / position), news, table, squad, academy, tickets, history, stadium, sponsors
news.html, article.html   News list with filters, single article (article.html?id=...)
team.html             Squad; team.html?pos=gk|df|mf|fw|staff shows one position
store.html            Store: products by category and an order form (emails sales@)
academy.html          Age groups, registration form (emails the club), FAQ
sponsors.html         Sponsors, packages, enquiry form
tickets.html          Season-ticket packages and a request form (emails sales@)
support.html          Donations: bank transfer + optional card link
club.html             The club today: first team, Academy, board, crest
history.html          Our history and milestones
stadium.html          Our stadium: photo, map, matchday info
contact.html          Details, map, contact form
privacy.html, 404.html
assets/css/site.css   All styles
assets/js/            config.js (settings), app.js (behaviour), ui.js + i18n.js (text), teams.js
data/                 epsana.json (auto), epsana-config.json, players.json, news.json, sponsors.json
scripts/              fetch_epsana.py + requirements.txt
.github/workflows/    epsana-sync.yml
```

## 8. Test locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```
(Opening the HTML file directly doesn't load the data files; use the small server above.)
