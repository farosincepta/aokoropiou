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

    const isSubfolder = window.location.pathname.includes("/en/") || 
                        window.location.pathname.includes("/es/") || 
                        window.location.pathname.includes("/it/") || 
                        window.location.pathname.includes("/de/");
    const jsonPath = isSubfolder ? "../data/live_match.json" : "data/live_match.json";

    const res = await fetch(`${jsonPath}?v=${Date.now()}`);
    if (!res.ok) return;
    const data = await res.json();

    const getTeam = (teamEl, teamLatin) => (isGreek ? teamEl : teamLatin);
    const getPlayer = (p) => (isGreek ? p.name_el : p.name_latin);

    // 1. Next Match Widget
    if (data.next_match) {
      const nm = data.next_match;
      const cards = document.querySelectorAll("section div h3");
      cards.forEach(h3 => {
        const parent = h3.closest("div");
        if (!parent) return;
        const text = h3.textContent.toUpperCase();
        if (text.includes("ΕΠΟΜΕΝΟΣ") || text.includes("NEXT") || text.includes("PRÓXIMO") || text.includes("PROSSIMO") || text.includes("NÄCHSTES")) {
          const dateP = parent.querySelector("p");
          if (dateP) {
            const venueTxt = isGreek ? nm.venue : nm.venue_latin;
            dateP.textContent = `${nm.date} • ${nm.time} (${venueTxt})`;
          }
          const oppB = parent.querySelector("span:last-of-type b");
          if (oppB) {
            const oppName = nm.is_home ? getTeam(nm.away, nm.away_latin) : getTeam(nm.home, nm.home_latin);
            oppB.textContent = oppName;
          }
        }
      });
    }

    // 2. Recent Match Widget
    if (data.recent_match) {
      const rm = data.recent_match;
      const cards = document.querySelectorAll("section div h3");
      cards.forEach(h3 => {
        const parent = h3.closest("div");
        if (!parent) return;
        const text = h3.textContent.toUpperCase();
        if (text.includes("ΤΕΛΕΥΤΑΙΟΣ") || text.includes("LAST") || text.includes("ÚLTIMO") || text.includes("ULTIMA") || text.includes("LETZTES")) {
          const dateP = parent.querySelector("p");
          if (dateP) {
            dateP.textContent = `${rm.date} (${isGreek ? rm.venue : rm.venue_latin})`;
          }
          const strongScore = parent.querySelector("strong");
          if (strongScore && rm.score) {
            strongScore.textContent = rm.score;
          }
          const oppB = parent.querySelector("span:last-of-type b");
          if (oppB) {
            const oppName = rm.is_home ? getTeam(rm.away, rm.away_latin) : getTeam(rm.home, rm.home_latin);
            oppB.textContent = oppName;
          }
          const smallNote = parent.querySelector("small");
          if (smallNote && data.recent_match_details) {
            const det = data.recent_match_details;
            const scTitle = i18n.scorersTitle[lang] || i18n.scorersTitle.en;
            const luTitle = i18n.lineupTitle[lang] || i18n.lineupTitle.en;
            
            let html = "";
            if (det.scorers && det.scorers.length > 0) {
              const scStr = det.scorers.map(s => `⚽ ${isGreek ? s.player_el : s.player_latin} (${s.minute}')`).join(", ");
              html += `<div style="margin-top:6px; color:#d4af37; font-weight:600;">${scTitle}: ${scStr}</div>`;
            }
            if (det.lineup && det.lineup.length > 0) {
              const luStr = det.lineup.map(p => `${p.number ? p.number + '.' : ''} ${getPlayer(p)}`).join(", ");
              html += `<div style="margin-top:4px; opacity:0.9; font-size:0.75rem;"><strong>${luTitle}:</strong> ${luStr}</div>`;
            }
            if (html) {
              smallNote.innerHTML = html;
            }
          }
        }
      });
    }

    // 3. Standings Table
    if (data.standings && data.standings.length > 0) {
      const aok = data.standings.find(s => s.is_aok);
      if (aok) {
        const cards = document.querySelectorAll("section div h3");
        cards.forEach(h3 => {
          const parent = h3.closest("div");
          if (!parent) return;
          const text = h3.textContent.toUpperCase();
          if (text.includes("ΒΑΘΜΟΛΟΓΙΑ") || text.includes("STANDINGS") || text.includes("CLASIFICACIÓN") || text.includes("CLASSIFICA") || text.includes("TABELLE")) {
            const row = parent.querySelector("div:nth-of-type(2)");
            if (row) {
              row.innerHTML = `<span>${aok.pos}. ${getTeam(aok.team, aok.team_latin)}</span><span>${aok.played}</span><span>${aok.points}</span>`;
            }
          }
        });
      }
    }
  } catch (e) {
    console.error("Live match data loading error:", e);
  }
});
