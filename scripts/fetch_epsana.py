#!/usr/bin/env python3
"""
Fetch AO Koropiou's league data from epsana.gr and save it as data/epsana.json.

Run by the GitHub Action in .github/workflows/epsana-sync.yml.
Settings (league id, club name on EPSANA) live in data/epsana-config.json,
so a new season only needs one number changed there.

The file is rewritten only when the standings or fixtures actually change,
so the repository is not flooded with identical commits.
"""
import json
import re
import sys
import time
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "data" / "epsana-config.json"
OUT = ROOT / "data" / "epsana.json"
BASE = "https://www.epsana.gr/results/"
HEADERS = {
    # A normal browser identity: EPSANA sits behind Cloudflare, which may refuse obvious bots.
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "el-GR,el;q=0.9,en;q=0.6",
    "Referer": "https://www.epsana.gr/",
}


def norm(text):
    """Upper-case, accent-free, single-spaced text for robust matching."""
    text = unicodedata.normalize("NFD", text or "")
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", text).strip().upper()


def clean(text):
    return re.sub(r"\s+", " ", (text or "").replace("\xa0", " ")).strip()


def get(url, tries=4):
    last = None
    session = requests.Session()
    for i in range(tries):
        try:
            r = session.get(url, headers=HEADERS, timeout=30)
            if r.status_code in (403, 429, 503) or "cf-chl" in r.text[:5000] or "Just a moment" in r.text[:2000]:
                last = RuntimeError(f"EPSANA refused the request (HTTP {r.status_code}). "
                                    "Its website protection is probably blocking GitHub's servers.")
            else:
                r.raise_for_status()
                r.encoding = r.apparent_encoding if not r.encoding or r.encoding.lower() == "iso-8859-1" else r.encoding
                return r.text
        except Exception as exc:  # network hiccup: wait and retry
            last = exc
        time.sleep(10 * (i + 1))
    raise RuntimeError(f"Could not download {url}: {last}")


def to_int(value):
    m = re.search(r"-?\d+", value or "")
    return int(m.group()) if m else None


def header_cells(table):
    row = table.find("tr")
    return [norm(c.get_text(" ")) for c in row.find_all(["th", "td"])] if row else []


def find_col(headers, *keys):
    for i, h in enumerate(headers):
        if any(k in h for k in keys):
            return i
    return None


def id_from(tag, param):
    a = tag.find("a", href=True) if tag else None
    if not a:
        return None
    m = re.search(param + r"=(\d+)", a["href"])
    return int(m.group(1)) if m else None


# ---------------------------------------------------------------- standings
def parse_standings(html):
    soup = BeautifulSoup(html, "html.parser")
    title = clean(soup.title.get_text()) if soup.title else ""
    for table in soup.find_all("table"):
        if table.find("table"):  # skip page-layout tables that wrap the real one
            continue
        h = header_cells(table)
        if find_col(h, "ΒΑΘΜ") is None or find_col(h, "ΟΜΑΔ") is None:
            continue
        c = {
            "team": find_col(h, "ΟΜΑΔ"), "pts": find_col(h, "ΒΑΘΜ"), "p": find_col(h, "ΑΓΩΝ"),
            "w": find_col(h, "ΝΙΚ"), "d": find_col(h, "ΙΣΟΠ"), "l": find_col(h, "ΗΤΤ"),
            "gf": find_col(h, "ΥΠΕΡ"), "ga": find_col(h, "ΚΑΤΑ"),
        }
        rows = []
        for tr in table.find_all("tr")[1:]:
            tds = tr.find_all("td")
            if len(tds) < 5 or c["team"] is None or c["team"] >= len(tds):
                continue
            team = clean(tds[c["team"]].get_text(" "))
            if not team:
                continue
            row = {"pos": to_int(tds[0].get_text()) or len(rows) + 1, "team": team,
                   "team_id": id_from(tds[c["team"]], "team_id")}
            for k in ("pts", "p", "w", "d", "l", "gf", "ga"):
                row[k] = to_int(tds[c[k]].get_text()) if c[k] is not None and c[k] < len(tds) else None
            rows.append(row)
        if rows:
            return rows, title
    raise RuntimeError("Standings table not found - EPSANA may have changed its page layout.")


# ----------------------------------------------------------------- schedule
ROUND_RE = re.compile(r"(\d+)\s*(?:Η|ΗΣ)?\s*ΑΓΩΝΙΣΤΙΚ")


def parse_date(d, t):
    m = re.match(r"(\d{1,2})/(\d{1,2})/(\d{2,4})", d or "")
    if not m:
        return None
    day, month, year = int(m.group(1)), int(m.group(2)), int(m.group(3))
    year += 2000 if year < 100 else 0
    tm = re.match(r"(\d{1,2}):(\d{2})", t or "")
    hh, mm = (int(tm.group(1)), int(tm.group(2))) if tm else (0, 0)
    return f"{year:04d}-{month:02d}-{day:02d}T{hh:02d}:{mm:02d}"


def parse_schedule(html):
    soup = BeautifulSoup(html, "html.parser")
    fixtures = []
    current_round = 0
    # Walk the page in order: round headings, then their tables.
    for el in soup.find_all(["h1", "h2", "h3", "h4", "b", "strong", "td", "div", "span", "table"]):
        if el.name != "table":
            # only short text nodes count as round headings
            txt = norm(el.get_text(" "))
            if len(txt) < 30:
                m = ROUND_RE.search(txt)
                if m:
                    current_round = int(m.group(1))
            continue
        if el.find("table"):  # skip page-layout tables that wrap the real ones
            continue
        h = header_cells(el)
        ci = find_col(h, "ΟΜΑΔΕΣ")
        if ci is None or find_col(h, "ΑΠΟΤΕΛ") is None:
            continue
        cv, cd, ct, cr, cs = (find_col(h, "ΓΗΠΕΔ"), find_col(h, "ΗΜ/Ν", "ΗΜΕΡΟΜ"),
                              find_col(h, "ΩΡΑ"), find_col(h, "ΔΙΑΙΤ"), find_col(h, "ΑΠΟΤΕΛ"))
        rnd = current_round or (max([f["round"] for f in fixtures], default=0) + 1)
        for tr in el.find_all("tr")[1:]:
            tds = tr.find_all("td")
            if len(tds) <= ci:
                continue
            teams = clean(tds[ci].get_text(" "))
            if " - " not in teams:
                continue
            home, away = [clean(x) for x in teams.split(" - ", 1)]
            cell = lambda i: clean(tds[i].get_text(" ")) if i is not None and i < len(tds) else ""
            score = cell(cs)
            sm = re.match(r"^(\d+)\s*-\s*(\d+)", score)
            fixtures.append({
                "round": rnd,
                "home": home, "away": away,
                "venue": cell(cv) or None,
                "date": parse_date(cell(cd), cell(ct)),
                "hs": int(sm.group(1)) if sm else None,
                "as": int(sm.group(2)) if sm else None,
                "note": None if sm or not score else score,
                "referees": cell(cr) or None,
                "game_id": id_from(tds[ci], "game_id") or id_from(tds[cs] if cs is not None and cs < len(tds) else None, "game_id"),
            })
    seen, unique = set(), []
    for f in fixtures:
        key = (f["round"], f["home"], f["away"])
        if key not in seen:
            seen.add(key)
            unique.append(f)
    if not unique:
        raise RuntimeError("Schedule tables not found - EPSANA may have changed its page layout.")
    return unique


def main():
    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    league = cfg["league_id"]
    ranking_html = get(f"{BASE}display_ranking.php?league_id={league}")
    schedule_html = get(f"{BASE}display_schedule.php?league_id={league}")

    standings, title = parse_standings(ranking_html)
    fixtures = parse_schedule(schedule_html)

    # "ΕΠΣΑΝΑ: Βαθμολογία: Β Κατηγορία, 2026-2027" -> division + season
    m = re.search(r":\s*([^:,]+),\s*(\d{4}-\d{4})", title)
    division, season = (clean(m.group(1)), m.group(2)) if m else (cfg.get("division"), cfg.get("season"))

    club = cfg["club_name"]
    if not any(norm(r["team"]) == norm(club) for r in standings):
        print(f"Warning: '{club}' not found in the standings. Check club_name in {CONFIG.name}.", file=sys.stderr)

    data = {
        "source": "epsana.gr",
        "league_id": league,
        "division": division,
        "season": season,
        "club": club,
        "standings": standings,
        "fixtures": fixtures,
        "links": {
            "standings": f"{BASE}display_ranking.php?league_id={league}",
            "schedule": f"{BASE}display_schedule.php?league_id={league}",
            "results": f"{BASE}display_results.php?league_id={league}",
        },
    }

    if OUT.exists():
        old = json.loads(OUT.read_text(encoding="utf-8"))
        old.pop("updated", None)
        if old == data:
            print("No changes on EPSANA.")
            return
    data["updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"Saved {len(standings)} teams and {len(fixtures)} fixtures.")


if __name__ == "__main__":
    main()
