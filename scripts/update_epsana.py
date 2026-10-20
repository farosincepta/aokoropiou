#!/usr/bin/env python3
"""EPSANA -> validated JSON; network failures do not overwrite the last verified snapshot."""
import argparse, datetime as dt, json, os, re, sys, time, unicodedata
from pathlib import Path
from urllib.parse import urljoin, urlparse
from zoneinfo import ZoneInfo
import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data/epsana.json'
BASE = 'https://www.epsana.gr'
LEAGUE = os.environ.get('EPSANA_LEAGUE_ID', '749')
AOK = 'ΑΟ ΚΟΡΩΠΙ'
HEAD = {'User-Agent': 'AOK-website/1.0 (public football scores; contact via club website)'}
S = requests.Session()
S.headers.update(HEAD)

def get(url):
    if urlparse(url).hostname not in ('www.epsana.gr', 'epsana.gr'):
        raise ValueError('Disallowed host')
    for n in range(3):
        try:
            r = S.get(url, timeout=25)
            r.raise_for_status()
            r.encoding = r.apparent_encoding or 'utf-8'
            return BeautifulSoup(r.text, 'html.parser')
        except requests.RequestException:
            if n == 2:
                raise
            time.sleep(2 * (n + 1))

def norm(x):
    x = unicodedata.normalize('NFD', x.upper())
    return re.sub(r'[^A-ZΑ-Ω0-9]', '', ''.join(c for c in x if not unicodedata.combining(c)))

def is_aok(s):
    return 'ΚΟΡΩΠ' in norm(s)

def dateparse(s):
    m = re.search(r'(\d{2})[/-](\d{2})[/-](\d{2,4})', s)
    if not m:
        return None
    d, mn, y = map(int, m.groups())
    y += 2000 if y < 100 else 0
    try:
        return dt.date(y, mn, d).isoformat()
    except ValueError:
        return None

def extract_game_id(a):
    if not a:
        return None
    m = re.search(r'game_id=(\d+)', a.get('href', ''))
    return m.group(1) if m else None

def schedule(soup):
    """Read fixtures from EPSANA tables without assuming fixed column offsets."""
    out = []
    round_no = None
    for el in soup.find_all(['h2', 'h3', 'h4', 'table']):
        if el.name != 'table':
            m = re.search(r'(\d+)\s*[ηΗ]\s*Αγωνιστικ', el.get_text(' ', strip=True), re.I)
            if m: round_no = int(m.group(1))
            continue
        for tr in el.find_all('tr'):
            cells = tr.find_all('td', recursive=False)
            if len(cells) < 2: continue
            values = [c.get_text(' ', strip=True) for c in cells]
            full = ' '.join(values)
            if not is_aok(full): continue
            for value in values:
                m = re.search(r'(.+?)\s+[-–—]\s+(.+)', value)
                if m and is_aok(value):
                    home, away = m.group(1).strip(), m.group(2).strip()
                    break
            else:
                continue
            date = dateparse(full)
            if not date: continue
            datecell = next((i for i,v in enumerate(values) if dateparse(v)), -1)
            tm = re.search(r'(?<!\d)([01]?\d|2[0-3]):[0-5]\d(?!\d)', full)
            score = None
            # Score must come from a separate score/result column, not from a time or date.
            for i, value in enumerate(values):
                if i == datecell or re.search(r'\d{1,2}:\d{2}', value): continue
                sm = re.fullmatch(r'\s*(\d{1,2})\s*[-–:]\s*(\d{1,2})\s*', value)
                if sm: score = [int(sm.group(1)), int(sm.group(2))]; break
            a = tr.find('a', href=re.compile(r'display_game|game_id=', re.I))
            gid = extract_game_id(a)
            venue = next((v for v in values if re.search(r'ΓΗΠΕΔ|ΣΤΑΔΙ|ΔΗΜΟΤΙΚ', v, re.I)), '')
            if not venue and len(values)>1: venue = values[1]
            out.append({'id': gid or 'fixture-'+date+'-'+norm(home)+'-'+norm(away),
                        'date':date,'time':tm.group() if tm else None,'home':home,'away':away,
                        'venue':venue,'round':round_no,'score':score,
                        'detail_url':urljoin(BASE,a['href']) if a and gid else None})
    if not out: raise ValueError('No AOK fixtures parsed from EPSANA schedule')
    return sorted({(g['date'],norm(g['home']),norm(g['away'])):g for g in out}.values(),
                  key=lambda g:(g['date'],g['time'] or '00:00'))

def latin(s):
    overrides = {
        'ΒΑΣΙΛΟΠΟΥΛΟΣ': 'Vasilopoulos', 'ΠΑΝΑΓΙΩΤΗΣ': 'Panagiotis',
        'ΜΑΛΕΣΙΟΣ': 'Malesios', 'ΓΕΩΡΓΙΟΣ': 'Georgios',
        'ΜΠΟΥΡΜΠΟΥΛΗΣ': 'Bourboulis', 'ΜΟΣΧΟΝΑ': 'Moschona',
        'ΓΕΡΑΣΙΜΟΣ': 'Gerasimos'
    }
    greek = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ'
    mapping = ['A', 'V', 'G', 'D', 'E', 'Z', 'I', 'Th', 'I', 'K', 'L', 'M', 'N', 'X', 'O', 'P', 'R', 'S', 'T', 'Y', 'F', 'Ch', 'Ps', 'O']
    table = dict(zip(greek, mapping))
    clean = unicodedata.normalize('NFD', s.upper())
    clean = ''.join(c for c in clean if not unicodedata.combining(c))
    return ' '.join(overrides.get(w, ''.join(table.get(c, c) for c in w).title()) for w in clean.split())

def detail(soup, game):
    # Parse AOK participation and events; returns empty lineups if official sheet not yet published.
    heading = next((h for h in soup.find_all(['h2', 'h3']) if 'Συμμετοχές' in h.get_text()), None)
    if not heading:
        print(f"INFO: No participation heading for game {game['id']}; sheet not yet published.")
        return {'starters': [], 'bench': [], 'events': []}

    table = heading.find_next('table')
    if not table:
        return {'starters': [], 'bench': [], 'events': []}

    home_aok = is_aok(game['home'])
    players = []
    bench = []

    for tr in table.find_all('tr'):
        cells = tr.find_all('td', recursive=False)
        if len(cells) < 7:
            continue
        number_idx = next((i for i, c in enumerate(cells) if re.fullmatch(r'\d{1,2}', c.get_text(' ', strip=True))), None)
        if number_idx is None:
            continue
        side = cells[:number_idx] if home_aok else cells[number_idx+1:]
        anchors = [a for c in side for a in c.find_all('a', href=True) if re.search('[Α-Ωα-ω]', a.get_text())]
        if not anchors:
            continue
        name = anchors[-1].get_text(' ', strip=True)
        if not re.search('[Α-Ωα-ω]', name):
            continue
        item = {
            'name_el': name,
            'name_latin': latin(name),
            'number': int(cells[number_idx].get_text(' ', strip=True))
        }
        (players if len(players) < 11 else bench).append(item)

    if len(players) != 11:
        print(f"WARNING: Expected 11 AOK starters, got {len(players)}. Lineup not yet posted.")

    events = []
    events_heading = next((h for h in soup.find_all(['h2', 'h3']) if 'Διακύμανση' in h.get_text()), None)
    tbl = events_heading.find_next('table') if events_heading else None

    if tbl:
        for tr in tbl.find_all('tr'):
            cells = tr.find_all('td', recursive=False)
            if len(cells) != 5:
                continue
            a = cells[0 if home_aok else 4].find('a')
            if not a:
                continue
            imgs = cells[1].find_all('img')
            desc = ' '.join(i.get('alt', '') + ' ' + i.get('title', '') for i in imgs).lower()
            minute = cells[3].get_text(' ', strip=True)
            kind = ('goal' if 'γκολ' in desc else 'yellow' if 'κίτριν' in desc else 'red' if 'κόκκιν' in desc else 'out' if 'βγήκε' in desc else 'in' if 'μπήκε' in desc else None)
            if kind:
                n = a.get_text(' ', strip=True)
                events.append({
                    'type': kind,
                    'minute': minute,
                    'name_el': n,
                    'name_latin': latin(n),
                    'penalty': 'πέναλ' in desc
                })

        if game['score'] and sum(e['type'] == 'goal' for e in events) != game['score'][0 if home_aok else 1]:
            raise ValueError('AOK goals do not match final score')

    return {'starters': players, 'bench': bench, 'events': events}

def standings(soup):
    rows = []
    for tr in soup.find_all('tr'):
        cs = tr.find_all('td', recursive=False)
        if len(cs) < 6:
            continue
        tx = [c.get_text(' ', strip=True) for c in cs]
        if not any(is_aok(t) for t in tx):
            continue
        parent = tr.parent
        for r in parent.find_all('tr', recursive=False):
            v = [c.get_text(' ', strip=True) for c in r.find_all('td', recursive=False)]
            if v:
                rows.append(v)
        break
    if not rows:
        raise ValueError('AOK not found in ranking table')
    return rows

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--details', action='store_true')
    a = ap.parse_args()
    old = json.loads(DATA.read_text(encoding='utf-8')) if DATA.exists() else {}
    fixtures = schedule(get(f'{BASE}/results/display_schedule.php?league_id={LEAGUE}'))
    ranks = standings(get(f'{BASE}/results/display_ranking.php?league_id={LEAGUE}'))
    today = dt.datetime.now(ZoneInfo('Europe/Athens')).date()
    recent = [g for g in fixtures if g['score'] and g['date'] <= today.isoformat()]
    upcoming = [g for g in fixtures if not g['score'] and g['date'] >= today.isoformat()]
    prior = old.get('reports', {})

    if a.details:
        for g in recent:
            if (today - dt.date.fromisoformat(g['date'])).days > 30:
                continue
            if not g['detail_url']:
                continue
            try:
                prior[g['id']] = detail(get(g['detail_url']), g)
            except Exception as e:
                print(f'WARNING: report {g["id"]} unchanged: {e}', file=sys.stderr)
            time.sleep(1)

    obj = {
        'source': 'EPSANA',
        'league_id': LEAGUE,
        'checked_at': dt.datetime.now(dt.timezone.utc).isoformat(),
        'fixtures': fixtures,
        'last_match': recent[-1] if recent else None,
        'next_match': upcoming[0] if upcoming else None,
        'ranking_rows': ranks,
        'reports': prior
    }

    DATA.parent.mkdir(exist_ok=True)
    new = json.dumps(obj, ensure_ascii=False, indent=2) + '\n'

    # Do not commit a change solely because checked_at changed.
    comparable = lambda d: {k: v for k, v in d.items() if k != 'checked_at'}
    if comparable(old) != comparable(obj):
        DATA.write_text(new, encoding='utf-8')
        print('Data changed')
    else:
        print('No data changes')

if __name__ == '__main__':
    main()
