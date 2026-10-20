document.addEventListener("DOMContentLoaded", async () => {
  try {
    const lang = document.documentElement.lang || "el";
    const isGreek = lang.startsWith("el");

    const i18n = {
      lineupTitle: {
        el: "Αρχική Ενδεκάδα ΑΟΚ",
        en: "AOK Starting Lineup",
        es: "Alineación Titular AOK",
        it: "Formazione Titolare AOK",
        de: "AOK Startaufstellung"
      },
      scorersTitle: {
        el: "Σκόρερ ΑΟΚ",
        en: "AOK Scorers",
        es: "Goleadores AOK",
        it: "Marcatori AOK",
        de: "AOK Torschützen"
      }
    };

    const isSub = window.location.pathname.includes("/en/") || 
                  window.location.pathname.includes("/es/") || 
                  window.location.pathname.includes("/it/") || 
                  window.location.pathname.includes("/de/");
    const jsonPath = isSub ? "../data/live_match.json" : "data/live_match.json";
    const assetBase = isSub ? "../assets/" : "assets/";

    const teamLogos = {
      // Official Club Crest
      "ΑΟ ΚΟΡΩΠΙ": "crest.png",
      "Α.Ο. ΚΟΡΩΠΙΟΥ": "crest.png",
      "AO KOROPI": "crest.png",
      "A.O. KOROPIOU": "crest.png",

      // .png Opponent
      "ΔΙΟΝΥΣΟΣ ΑΤΤΙΚΗΣ": "dionysos.png",
      "DIONYSOS ATTIKIS": "dionysos.png",

      // .jpg Opponents
      "ΑΠΣ ΟΛΥΜΠΙΑΚΟΣ ΒΑΡΗΣ": "olympiakos-varis.jpg",
      "APS OLYMPIAKOS VARIS": "olympiakos-varis.jpg",
      "Α.Π.Ο ΝΙΚΗΦΟΡΟΣ": "nikiforos.jpg",
      "APO NIKIFOROS": "nikiforos.jpg",
      "Α.Ο ΦΟΙΒΟΣ ΒΑΡΗΣ": "foivos-varis.jpg",
      "AO FOIVOS VARIS": "foivos-varis.jpg",
      "ΓΙΑΝΝΗΣ ΠΑΘΙΑΚΑΚΗΣ": "pathiakakis.jpg",
      "GIANNIS PATHIAKAKIS": "pathiakakis.jpg",
      "ΑΠΕΣ ΚΑΠΑΝΔΡΙΤΙΟΥ": "kapandriti.jpg",
      "APES KAPANDRITIOU": "kapandriti.jpg",

      // .jpeg Opponents
      "ΑΠΕ ΛΑΥΡΕΩΤΙΚΗ": "lavreotiki.jpeg",
      "APE LAVREOTIKI": "lavreotiki.jpeg",
      "ΑΟ ΚΟΥΒΑΡΑ": "kouvara.jpeg",
      "AO KOUVARA": "kouvara.jpeg",
      "ΠΑΝΒΟΡΕΙΑΚΟΣ ΑΣ": "panvoreiakos.jpeg",
      "PANVOREIAKOS AS": "panvoreiakos.jpeg",
      "ΠΑΣ ΩΡΩΠΟΣ": "oropos.jpeg",
      "PAS OROPOS": "oropos.jpeg",
      "ΤΡΙΓΛΙΑΣ ΡΑΦΗΝΑΣ ΑΟ": "triglia-rafinas.jpeg",
      "TRIGLIAS RAFINAS AO": "triglia-rafinas.jpeg",
      "ΑΟ ΠΑΙΑΝΙΑΣ": "paiania.jpeg",
      "AO PAIANIAS": "paiania.jpeg",
      "ΝΙΚΗ ΔΡΟΣΙΑΣ": "niki-drosias.jpeg",
      "NIKI DROSIAS": "niki-drosias.jpeg",
      "ΠΑΟ ΚΑΛΥΒΙΩΝ": "kalyvia.jpeg",
      "PAO KALYVION": "kalyvia.jpeg",
      "ΜΑΧΗ ΜΑΡΑΘΩΝΑ": "machi-marathona.jpeg",
      "MACHI MARATHONA": "machi-marathona.jpeg"
    };

    function getLogoHtml(name, size = 32) {
      if (!name) return `<span class="fixture-question" style="display:inline-flex;width:${size}px;height:${size}px;align-items:center;justify-content:center;">⚽</span>`;
      const clean = name.trim().toUpperCase();
      let file = null;
      for (const [k, v] of Object.entries(teamLogos)) {
        if (clean.includes(k.toUpperCase()) || k.toUpperCase().includes(clean)) {
          file = v;
          break;
        }
      }
      if (!file) return `<span class="fixture-question" style="display:inline-flex;width:${size}px;height:${size}px;align-items:center;justify-content:center;">⚽</span>`;
      return `<img src="${assetBase}${file}" alt="${name}" style="width:${size}px; height:${size}px; object-fit:contain; vertical-align:middle; border-radius:4px;"/>`; }  const res = await fetch(`${jsonPath}?v=${Date.now()}`); if (!res.ok) return; const data = await res.json();  const getTeam = (teamEl, teamLatin) => (isGreek ? teamEl : teamLatin); const getPlayer = (p) => (isGreek ? p.name_el : p.name_latin);  // 1. Next Match Widget (Home page & Matches page top card) if (data.next_match) { const nm = data.next_match; document.querySelectorAll(".match-card").forEach(card => { const text = card.textContent.toUpperCase(); if (text.includes("ΕΠΟΜΕΝΟΣ") \vert{}\vert{} text.includes("NEXT") \vert{}\vert{} text.includes("PRÓXIMO") \vert{}\vert{} text.includes("PROSSIMO") \vert{}\vert{} text.includes("NÄCHSTES")) { const dateP = card.querySelector("p"); if (dateP) { const venueTxt = isGreek ? nm.venue : nm.venue_latin; dateP.textContent = `${nm.date} • ${nm.time} (${venueTxt})`;
          }
          const oppName = nm.is_home ? getTeam(nm.away, nm.away_latin) : getTeam(nm.home, nm.home_latin);
          const oppSpan = card.querySelector(".versus span:last-of-type");
          if (oppSpan) {
            oppSpan.innerHTML = `${getLogoHtml(oppName, 36)}<b>${oppName}</b>`;
          }
        }
      });
    }

    // 2. Recent Match Widget (Home page & Matches page top card)
    if (data.recent_match) {
      const rm = data.recent_match;
      document.querySelectorAll(".match-card").forEach(card => {
        const text = card.textContent.toUpperCase();
        if (text.includes("ΤΕΛΕΥΤΑΙΟΣ") || text.includes("LAST") || text.includes("ÚLTIMO") || text.includes("ULTIMA") || text.includes("LETZTES")) {
          const dateP = card.querySelector("p");
          if (dateP) {
            dateP.textContent = `${rm.date} (${isGreek ? rm.venue : rm.venue_latin})`;
          }
          const strongScore = card.querySelector("strong");
          if (strongScore && rm.score) {
            strongScore.textContent = rm.score;
          }
          const oppName = rm.is_home ? getTeam(rm.away, rm.away_latin) : getTeam(rm.home, rm.home_latin);
          const oppSpan = card.querySelector(".versus span:last-of-type");
          if (oppSpan) {
            oppSpan.innerHTML = `${getLogoHtml(oppName, 36)}<b>${oppName}</b>`;
          }
          const smallNote = card.querySelector("small");
          if (smallNote && data.recent_match_details) {
            const det = data.recent_match_details;
            const scTitle = i18n.scorersTitle[lang] || i18n.scorersTitle.en;
            const luTitle = i18n.lineupTitle[lang] || i18n.lineupTitle.en;
            
            let html = "";
            if (det.scorers && det.scorers.length > 0) {
              const scStr = det.scorers.map(s => `⚽ ${isGreek ? s.player_el : s.player_latin} (${s.minute}')`).join(", ");
              html += `<div style="margin-top:6px; color:#d4af37; font-weight:600;">${scTitle}:${scStr}</div>`;
            }
            if (det.lineup && det.lineup.length > 0) {
              const luStr = det.lineup.map(p => `${p.number ? p.number + '.' : ''} ${getPlayer(p)}`).join(", ");
              html += `<div style="margin-top:4px; opacity:0.9; font-size:0.75rem;"><strong>${luTitle}:</strong>${luStr}</div>`;
            }
            if (html) smallNote.innerHTML = html;
          }
        }
      });
    }

    // 3. Mini Standings (Top 5 teams on the widget card with logos)
    if (data.standings && data.standings.length > 0) {
      document.querySelectorAll(".match-card.standings").forEach(card => {
        const topTeams = data.standings.slice(0, 5);
        let rowsHtml = `<div class="table-head"><span>${isGreek ? 'ΟΜΑΔΑ' : 'TEAM'}</span><span>${isGreek ? 'ΑΓ' : 'P'}</span><span>${isGreek ? 'Β' : 'PTS'}</span></div>`;
        
        topTeams.forEach(s => {
          const tName = getTeam(s.team, s.team_latin);
          const highlight = s.is_aok ? ' style="background: rgba(18,59,131,0.12); font-weight: bold; color: #123b83;"' : '';
          rowsHtml += `<div class="table-row"${highlight}>
            <span style="display:inline-flex; align-items:center; gap:6px;">
              ${getLogoHtml(tName, 18)}
              ${s.pos}.${tName}
            </span>
            <span>${s.played}</span>
            <span>${s.points}</span>
          </div>`;
        });

        const head = card.querySelector(".table-head");
        const existingRow = card.querySelector(".table-row") || card.querySelector("div:nth-of-type(2)");
        if (head && existingRow) {
          const note = card.querySelector("p");
          head.remove();
          existingRow.remove();
          if (note) note.insertAdjacentHTML("beforebegin", rowsHtml);
          else card.insertAdjacentHTML("beforeend", rowsHtml);
        }
      });
    }

    // 4. Full Standings Table with Logos (matches.html)
    const wideStandings = document.querySelector(".standings-wide");
    if (wideStandings && data.standings) {
      const heading = isGreek 
        ? `<div class="standings-line heading"><span>ΘΕΣΗ</span><span>ΟΜΑΔΑ</span><span>ΑΓΩΝΕΣ</span><span>ΒΑΘΜΟΙ</span></div>`
        : `<div class="standings-line heading"><span>POS</span><span>TEAM</span><span>MATCHES</span><span>POINTS</span></div>`;
      
      const rows = data.standings.map(s => {
        const tName = getTeam(s.team, s.team_latin);
        const style = s.is_aok ? ` style="font-weight:bold; color:#123b83;"` : ``;
        return `<div class="standings-line"${style}>
          <span>${s.pos}</span>
          <span style="display:inline-flex; align-items:center; gap:8px;">
            ${getLogoHtml(tName, 22)}
            ${tName}
          </span>
          <span>${s.played}</span>
          <span>${s.points}</span>
        </div>`;
      }).join("");

      wideStandings.innerHTML = heading + rows;
    }

    // 5. Full Fixtures List with Logos for Both Teams (matches.html)
    const fixtureList = document.querySelector(".fixture-list");
    if (fixtureList && data.schedule) {
      const rows = data.schedule.map(m => {
        const roundTitle = isGreek ? `ΑΓΩΝΙΣΤΙΚΗ ${m.round}` : `MATCHDAY ${m.round}`;
        const venueTxt = isGreek ? m.venue : m.venue_latin;
        const homeTxt = isGreek ? m.home : m.home_latin;
        const awayTxt = isGreek ? m.away : m.away_latin;
        const linkTxt = isGreek ? `ΛΕΠΤΟΜΕΡΕΙΕΣ ΑΓΩΝΑ →` : `MATCH DETAILS →`;
        const linkHref = isSub ? "../match-detail.html" : "match-detail.html";

        return `<div class="fixture-row">
          <div class="fixture-date"><strong>${m.date.split('/')[0]}</strong><small>${roundTitle}</small></div>
          <div class="fixture-teams" style="display:flex; align-items:center; gap:8px;">
            ${getLogoHtml(homeTxt, 30)}
            <strong>${homeTxt}</strong>
            <span style="margin:0 4px;">${m.score || 'VS'}</span>
            <strong>${awayTxt}</strong>
            ${getLogoHtml(awayTxt, 30)}
          </div>
          <div class="fixture-meta">${m.date} • ${m.time}<br/><b>${venueTxt}</b></div>
          <a class="fixture-details-link" href="${linkHref}">${linkTxt}</a>
        </div>`;
      }).join("");

      fixtureList.innerHTML = rows;
    }

  } catch (err) {
    console.error("Match center error:", err);
  }
});
