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

    const res = await fetch(`${jsonPath}?v=${Date.now()}`);
    if (!res.ok) return;
    const data = await res.json();

    const getTeam = (teamEl, teamLatin) => (isGreek ? teamEl : teamLatin);
    const getPlayer = (p) => (isGreek ? p.name_el : p.name_latin);

    // 1. Next Match Widget (Home page & Matches page top card)
    if (data.next_match) {
      const nm = data.next_match;
      document.querySelectorAll(".match-card").forEach(card => {
        const text = card.textContent.toUpperCase();
        if (text.includes("ΕΠΟΜΕΝΟΣ") || text.includes("NEXT") || text.includes("PRÓXIMO") || text.includes("PROSSIMO") || text.includes("NÄCHSTES")) {
          const dateP = card.querySelector("p");
          if (dateP) {
            const venueTxt = isGreek ? nm.venue : nm.venue_latin;
            dateP.textContent = `${nm.date} • ${nm.time} (${venueTxt})`;
          }
          const oppB = card.querySelector("span:last-of-type b");
          if (oppB) {
            oppB.textContent = nm.is_home ? getTeam(nm.away, nm.away_latin) : getTeam(nm.home, nm.home_latin);
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
          const oppB = card.querySelector("span:last-of-type b");
          if (oppB) {
            oppB.textContent = rm.is_home ? getTeam(rm.away, rm.away_latin) : getTeam(rm.home, rm.home_latin);
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

    // 3. Mini Standings (Home page card)
    if (data.standings && data.standings.length > 0) {
      document.querySelectorAll(".match-card.standings").forEach(card => {
        // Build rows for top teams (or slice(0, 5) for top 5, or show all)
        const topTeams = data.standings.slice(0, 5); // Change 5 to 16 if you want all teams listed
        
        let rowsHtml = `<div class="table-head"><span>${isGreek ? 'ΟΜΑΔΑ' : 'TEAM'}</span><span>${isGreek ? 'ΑΓ' : 'P'}</span><span>${isGreek ? 'Β' : 'PTS'}</span></div>`;
        
        topTeams.forEach(s => {
          const highlight = s.is_aok ? ' style="background: rgba(18,59,131,0.12); font-weight: bold; color: #123b83;"' : '';
          rowsHtml += `<div class="table-row"${highlight}>
            <span>${s.pos}. ${getTeam(s.team, s.team_latin)}</span>
            <span>${s.played}</span>
            <span>${s.points}</span>
          </div>`;
        });

        // Replace the table content inside the card
        const head = card.querySelector(".table-head");
        const existingRow = card.querySelector(".table-row") || card.querySelector("div:nth-of-type(2)");
        
        if (head && existingRow) {
          // If the container exists, replace existing rows
          const container = head.parentElement;
          const note = card.querySelector("p");
          head.remove();
          existingRow.remove();
          if (note) {
            note.insertAdjacentHTML("beforebegin", rowsHtml);
          } else {
            card.insertAdjacentHTML("beforeend", rowsHtml);
          }
        } else {
          // Fallback direct innerHTML replacement
          const title = card.querySelector("h3");
          const link = card.querySelector("a");
          const note = card.querySelector("p");
          card.innerHTML = `<h3>${title ? title.textContent : (isGreek ? 'ΒΑΘΜΟΛΟΓΙΑ' : 'STANDINGS')}</h3>` + 
                           rowsHtml + 
                           (note ? `<p>${note.textContent}</p>` : '') + 
                           (link ? link.outerHTML : '');
        }
      });
    }

    // 4. Full Standings Table (matches.html)
    const wideStandings = document.querySelector(".standings-wide");
    if (wideStandings && data.standings) {
      const heading = isGreek 
        ? `<div class="standings-line heading"><span>ΘΕΣΗ</span><span>ΟΜΑΔΑ</span><span>ΑΓΩΝΕΣ</span><span>ΒΑΘΜΟΙ</span></div>`
        : `<div class="standings-line heading"><span>POS</span><span>TEAM</span><span>MATCHES</span><span>POINTS</span></div>`;
      
      const rows = data.standings.map(s => {
        const style = s.is_aok ? ` style="font-weight:bold; color:#123b83;"` : ``;
        return `<div class="standings-line"${style}><span>${s.pos}</span><span>${getTeam(s.team, s.team_latin)}</span><span>${s.played}</span><span>${s.points}</span></div>`;
      }).join("");

      wideStandings.innerHTML = heading + rows;
    }

    // 5. Full Fixtures List (matches.html)
    const fixtureList = document.querySelector(".fixture-list");
    if (fixtureList && data.schedule) {
      const crestPath = isSub ? "../assets/crest.png" : "assets/crest.png";
      const rows = data.schedule.map(m => {
        const roundTitle = isGreek ? `ΑΓΩΝΙΣΤΙΚΗ ${m.round}` : `MATCHDAY ${m.round}`;
        const venueTxt = isGreek ? m.venue : m.venue_latin;
        const homeTxt = isGreek ? m.home : m.home_latin;
        const awayTxt = isGreek ? m.away : m.away_latin;
        const homeCrest = (homeTxt.includes("ΚΟΡΩΠΙ") || homeTxt.includes("KOROPI")) 
          ? `<img src="${crestPath}" alt="AOK"/>` 
          : `<span class="fixture-question">⚽</span>`;
        const awayCrest = (awayTxt.includes("ΚΟΡΩΠΙ") || awayTxt.includes("KOROPI")) 
          ? `<img src="${crestPath}" alt="AOK"/>` 
          : `<span class="fixture-question">⚽</span>`;
        const linkTxt = isGreek ? `ΛΕΠΤΟΜΕΡΕΙΕΣ ΑΓΩΝΑ →` : `MATCH DETAILS →`;
        const linkHref = isSub ? "../match-detail.html" : "match-detail.html";

        return `<div class="fixture-row">
          <div class="fixture-date"><strong>${m.date.split('/')[0]}</strong><small>${roundTitle}</small></div>
          <div class="fixture-teams">${homeCrest}<strong>${homeTxt}</strong><span>${m.score || 'VS'}</span><strong>${awayTxt}</strong>${awayCrest}</div>
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
