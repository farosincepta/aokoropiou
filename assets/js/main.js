/* =====================================================================
   ΑΕ ΔΟΞΑ ΚΟΡΩΠΙΟΥ — site behaviour
   Masthead + mega menu, ΕΛ/EN, EPSANA data (fixtures, table, results),
   news, squad, store, forms. Plain JavaScript, no build step.
   ===================================================================== */
(() => {
  "use strict";

  const C = window.DOXA || {};
  const CLUBS = window.DOXA_CLUBS || {};
  const GROUNDS = window.DOXA_GROUNDS || {};
  const TXT = window.DOXA_TEXT || { el: {}, en: {} };
  const PAGE = document.body.getAttribute("data-view") || "";
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => [...r.querySelectorAll(s)];
  const params = new URLSearchParams(location.search);

  /* ---------------------------------------------------------- language */
  let lang = "el";
  try { if (localStorage.getItem("doxa.lang") === "en") lang = "en"; } catch (e) {}
  if (["el", "en"].includes(params.get("lang"))) lang = params.get("lang");

  const t = (key, vars) => {
    let s = (TXT[lang] || {})[key];
    if (s == null) s = TXT.el[key];
    if (s == null) s = key;
    if (vars) for (const k in vars) s = s.split("{" + k + "}").join(vars[k]);
    return s;
  };
  const pick = v => v == null ? "" : typeof v === "string" ? v : (v[lang] ?? v.el ?? "");
  const h = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // Greek text lives in the HTML; English sits next to it in data-en / data-en-* attributes.
  const ATTRS = ["placeholder", "aria-label", "alt", "title", "content"];
  function translateStatic() {
    document.documentElement.lang = lang;
    qsa("[data-en]").forEach(el => {
      if (el._gr == null) el._gr = el.innerHTML;
      el.innerHTML = lang === "en" ? el.getAttribute("data-en") : el._gr;
    });
    ATTRS.forEach(a => qsa(`[data-en-${a}]`).forEach(el => {
      const k = "_gr_" + a;
      if (el[k] == null) el[k] = el.getAttribute(a) || "";
      el.setAttribute(a, lang === "en" ? el.getAttribute(`data-en-${a}`) : el[k]);
    }));
    const titleEn = qs("meta[name='doxa:title-en']");
    if (titleEn) {
      if (document.documentElement._gr == null) document.documentElement._gr = document.title;
      document.title = lang === "en" ? titleEn.content : document.documentElement._gr;
    }
  }

  /* ----------------------------------------------------------- helpers */
  const toLatin = (() => {
    const di = [["ΟΥ", "OU"], ["Ου", "Ou"], ["ου", "ou"], ["ΑΥ", "AV"], ["αυ", "av"], ["ΕΥ", "EF"], ["ευ", "ef"], ["ΜΠ", "B"], ["Μπ", "B"], ["μπ", "b"], ["ΝΤ", "D"], ["ντ", "d"], ["ΓΚ", "G"], ["γκ", "g"]];
    const one = { Α: "A", Β: "V", Γ: "G", Δ: "D", Ε: "E", Ζ: "Z", Η: "I", Θ: "Th", Ι: "I", Κ: "K", Λ: "L", Μ: "M", Ν: "N", Ξ: "X", Ο: "O", Π: "P", Ρ: "R", Σ: "S", Τ: "T", Υ: "Y", Φ: "F", Χ: "Ch", Ψ: "Ps", Ω: "O",
      α: "a", β: "v", γ: "g", δ: "d", ε: "e", ζ: "z", η: "i", θ: "th", ι: "i", κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o", π: "p", ρ: "r", σ: "s", ς: "s", τ: "t", υ: "y", φ: "f", χ: "ch", ψ: "ps", ω: "o" };
    return s => {
      s = String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
      di.forEach(([g, l]) => { s = s.split(g).join(l); });
      s = s.replace(/[Ͱ-Ͽ]/g, c => one[c] ?? c).toLowerCase();
      return s.replace(/(^|[\s.\-(])([a-z])/g, (m, a, b) => a + b.toUpperCase());
    };
  })();
  const titleGr = s => String(s || "").toLocaleLowerCase("el").replace(/(^|[\s.\-(])(\S)/g, (m, a, b) => a + b.toLocaleUpperCase("el"));

  const clubName = (raw, l = lang) => { const c = CLUBS[raw]; return c ? c[l] : (l === "en" ? toLatin(raw) : titleGr(raw)); };
  const clubTag = raw => {
    const c = CLUBS[raw];
    if (c) return lang === "en" ? c.tagEn : c.tag;
    return (lang === "en" ? toLatin(raw) : raw).replace(/[^A-Za-zΑ-Ωα-ω]/g, "").slice(0, 3).toUpperCase();
  };
  const ground = (raw, l = lang) => {
    if (!raw) return "";
    const g = GROUNDS[raw];
    return g ? g[l] : (l === "en" ? toLatin(raw) + " ground" : "Γήπεδο " + raw);
  };
  const mark = (raw, size = "md") => {
    const c = CLUBS[raw];
    return c && c.logo
      ? `<span class="mark mark-${size} has-logo" aria-hidden="true"><img src="${h(c.logo)}" alt="" width="64" height="64" loading="lazy"></span>`
      : `<span class="mark mark-${size}" aria-hidden="true">${h(clubTag(raw))}</span>`;
  };

  // EPSANA dates are Athens local time. Convert to real instants and always show Athens time.
  const ATH = "Europe/Athens";
  const athensOffset = d => {
    const p = {};
    new Intl.DateTimeFormat("en-US", { timeZone: ATH, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(d).forEach(x => { p[x.type] = x.value; });
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute) - Math.floor(d.getTime() / 60000) * 60000;
  };
  const when = s => {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(s || "");
    if (!m) return null;
    const u = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
    return new Date(u - athensOffset(new Date(u)));
  };
  const loc = () => lang === "en" ? "en-GB" : "el-GR";
  const fmt = (d, o) => d ? new Intl.DateTimeFormat(loc(), { timeZone: ATH, ...o }).format(d) : "";
  const hhmm = d => fmt(d, { hour: "2-digit", minute: "2-digit", hour12: false });
  const nth = n => lang === "en" ? n + (([, "st", "nd", "rd"][(n % 100 >> 3 ^ 1) && n % 10]) || "th") : n + "η";
  const divisionName = (d, l = lang) => {
    if (!d) return "";
    const letter = (d.match(/^([Α-Ω])/) || [])[1];
    if (l === "en") return "EPSANA " + ({ Α: "First", Β: "Second", Γ: "Third", Δ: "Fourth" }[letter] || "") + " Division";
    return (letter ? letter + "΄ Κατηγορία" : d) + " ΕΠΣΑΝΑ";
  };

  const memo = {};
  const getData = path => (memo[path] = memo[path] || fetch(path + "?t=" + Math.floor(Date.now() / 300000), { cache: "no-store" })
    .then(r => { if (!r.ok) throw new Error(path + " " + r.status); return r.json(); })
    .catch(e => { console.warn(e); return null; }));

  function flash(msg) {
    let n = qs(".flash");
    if (!n) { n = document.createElement("div"); n.className = "flash"; n.setAttribute("role", "status"); document.body.append(n); }
    n.textContent = msg; n.classList.add("on");
    clearTimeout(n._t); n._t = setTimeout(() => n.classList.remove("on"), 2200);
  }

  const SVG = {
    chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square"/></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square"/></svg>',
    left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square"/></svg>',
    out: '<svg class="ico-out" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2.6"/></svg>',
    fb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 22v-8.2h2.8l.4-3.3h-3.2V8.4c0-.9.3-1.6 1.6-1.6h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.3h2.8V22z" fill="currentColor"/></svg>',
    ig: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.4" cy="6.6" r="1.3" fill="currentColor"/></svg>',
    cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v14H4zM4 10h16M8 3v5M16 3v5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-7.6 7-12.5a7 7 0 1 0-14 0C5 14.4 12 22 12 22zm0-10a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" fill="currentColor"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z" fill="currentColor"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v14H3zm1.5 1.5L12 12l7.5-5.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    note: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2zm0-8h-2V7h2z" fill="currentColor"/></svg>'
  };

  /* ------------------------------------------------------ site masthead */
  const ext = { "@schedule": () => C.epsanaSchedule, "@table": () => C.epsanaTable };
  const link = (href, label, cls = "") => {
    const out = ext[href];
    return `<a href="${h(out ? out() : href)}"${cls ? ` class="${cls}"` : ""}${out ? ' target="_blank" rel="noopener"' : ""}>${h(label)}${out ? SVG.out + `<span class="vh"> ${h(t("newTab"))}</span>` : ""}</a>`;
  };
  const NAV = [
    { id: "news", el: "Νέα", en: "News", intro: { el: "Αγώνες, ανακοινώσεις και τα νέα της Ακαδημίας.", en: "Match reports, club announcements and Academy news." },
      links: [["news.html", "Όλα τα νέα", "All news"], ["news.html?cat=match", "Αγώνες", "Matches"], ["news.html?cat=club", "Σύλλογος", "Club"], ["news.html?cat=academy", "Ακαδημία", "Academy"]] },
    { id: "matches", el: "Αγώνες", en: "Matches", intro: { el: "Πρόγραμμα, αποτελέσματα και βαθμολογία, απευθείας από την ΕΠΣΑΝΑ.", en: "Fixtures, results and the table, straight from EPSANA." },
      links: [["matches.html", "Πρόγραμμα και αποτελέσματα", "Fixtures and results"], ["matches.html?tab=table", "Βαθμολογία", "League table"], ["matches.html?tab=rounds", "Όλες οι αγωνιστικές", "Every matchday"], ["@schedule", "Πρόγραμμα στην ΕΠΣΑΝΑ", "Schedule on EPSANA"], ["@table", "Βαθμολογία στην ΕΠΣΑΝΑ", "Table on EPSANA"]] },
    { id: "team", el: "Ομάδα", en: "Team", intro: { el: "Το ρόστερ της πρώτης ομάδας και το τεχνικό επιτελείο.", en: "The first-team squad and coaching staff." },
      links: [["team.html", "Ρόστερ", "Squad"], ["team.html?pos=gk", "Τερματοφύλακες", "Goalkeepers"], ["team.html?pos=df", "Αμυντικοί", "Defenders"], ["team.html?pos=mf", "Μέσοι", "Midfielders"], ["team.html?pos=fw", "Επιθετικοί", "Forwards"], ["team.html?pos=staff", "Τεχνικό επιτελείο", "Staff"]] },
    { id: "academy", el: "Ακαδημία", en: "Academy", intro: { el: "Ποδόσφαιρο για αγόρια και κορίτσια, από τα πρώτα βήματα.", en: "Football for boys and girls, from their very first kick." },
      links: [["academy.html", "Η Ακαδημία", "The Academy"], ["academy.html#groups", "Τμήματα", "Age groups"], ["academy.html#join", "Εγγραφή", "Register"], ["academy.html#faq", "Ερωτήσεις", "Questions"]] },
    { id: "club", el: "Σύλλογος", en: "Club", intro: { el: "Από το 1981 στο Κορωπί. Μαζί γράφουμε ιστορία.", en: "In Koropi since 1981. Writing history together." },
      links: [["club.html", "Ο σύλλογος", "About the club"], ["history.html", "Ιστορία", "History"], ["stadium.html", "Γήπεδα", "Grounds"], ["sponsors.html", "Χορηγοί", "Sponsors"], ["support.html", "Στήριξη", "Support us"], ["contact.html", "Επικοινωνία", "Contact"]] },
    { id: "store", el: "Κατάστημα", en: "Shop", intro: { el: "Εμφανίσεις και είδη φιλάθλων στα κίτρινα και τα μαύρα.", en: "Kit and supporter gear in yellow and black." },
      links: [["store.html", "Όλα τα προϊόντα", "All products"], ["store.html?cat=kit", "Εμφανίσεις", "Kit"], ["store.html?cat=fan", "Είδη φιλάθλων", "Supporter gear"], ["store.html#order", "Παραγγελία", "Order"]] }
  ];
  const SECTION_OF = { home: "", news: "news", article: "news", matches: "matches", team: "team", academy: "academy", club: "club", history: "club", stadium: "club", sponsors: "club", support: "club", contact: "club", privacy: "club", tickets: "", store: "store" };
  const socials = (cls = "") => Object.entries(C.social || {}).filter(([, v]) => v)
    .map(([k, v]) => `<a class="soc ${cls}" href="${h(v)}" target="_blank" rel="noopener" aria-label="${h(t("social." + k))}">${SVG[k === "facebook" ? "fb" : "ig"]}</a>`).join("");

  function drawMasthead() {
    const host = qs("#masthead"); if (!host) return;
    const here = SECTION_OF[PAGE];
    host.innerHTML = `
<div class="topline"><div class="shell topline-in">
  <p class="topline-motto">${h(t("motto"))}</p>
  <div class="topline-tools">
    <div class="socs">${socials()}</div>
    <div class="langs" role="group" aria-label="${h(t("language"))}">
      <button type="button" data-lang="el" aria-pressed="${lang === "el"}">ΕΛ</button><button type="button" data-lang="en" aria-pressed="${lang === "en"}">EN</button>
    </div>
  </div>
</div></div>
<header class="mast" id="mast">
  <div class="shell mast-in">
    <a class="crest-link" href="index.html" aria-label="${h(t("homeLink"))}"><img src="assets/img/doxa-crest-128.png" alt="" width="84" height="84"></a>
    <a class="wordmark" href="index.html" tabindex="-1" aria-hidden="true"><b>${h(t("short"))}</b><span>${h(t("place"))}</span></a>
    <nav class="mainnav" aria-label="${h(t("mainNav"))}"><ul>
      ${NAV.map(n => `<li><button type="button" class="mainnav-btn" data-menu="${n.id}" aria-expanded="false" aria-controls="mega"${n.id === here ? ' data-here="1"' : ""}>${h(n[lang])}${SVG.down}</button></li>`).join("")}
    </ul></nav>
    <a class="mast-cta" href="tickets.html">${h(t("tickets"))}</a>
    <button class="burger" type="button" aria-controls="mnav" aria-expanded="false"><span class="vh">${h(t("menu"))}</span><i></i><i></i><i></i></button>
  </div>
  <div class="mega" id="mega" hidden></div>
</header>
<div class="mnav" id="mnav" hidden>
  <div class="mnav-head"><img src="assets/img/doxa-crest-64.png" alt="" width="44" height="44"><b>${h(t("short"))}</b><button type="button" class="mnav-close">${SVG.x}<span class="vh">${h(t("close"))}</span></button></div>
  <ul class="mnav-list">
    <li><a class="mnav-home" href="index.html">${h(t("homePage"))}</a></li>
    ${NAV.map(n => `<li><button type="button" class="mnav-sec" aria-expanded="${n.id === here}" aria-controls="ms-${n.id}">${h(n[lang])}${SVG.down}</button>
      <div class="mnav-sub" id="ms-${n.id}"${n.id === here ? "" : " hidden"}>${n.links.map(([href, el, en]) => link(href, lang === "en" ? en : el)).join("")}</div></li>`).join("")}
  </ul>
  <div class="mnav-foot">
    <a class="btn btn-yellow" href="tickets.html">${h(t("seasonTickets"))}</a>
    <a class="btn btn-ghost-light" href="support.html">${h(t("donate"))}</a>
    <div class="mnav-row"><div class="socs">${socials()}</div>
    <div class="langs" role="group" aria-label="${h(t("language"))}"><button type="button" data-lang="el" aria-pressed="${lang === "el"}">ΕΛ</button><button type="button" data-lang="en" aria-pressed="${lang === "en"}">EN</button></div></div>
  </div>
</div>`;
  }

  let megaOpen = null, megaTimer;
  function openMega(id) {
    const mega = qs("#mega"); const n = NAV.find(x => x.id === id);
    if (!mega || !n) return;
    clearTimeout(megaTimer);
    megaOpen = id;
    mega.innerHTML = `<div class="shell mega-in">
      <div class="mega-intro"><p class="kicker">${h(n[lang])}</p><p>${h(pick(n.intro))}</p></div>
      <div class="mega-links">${n.links.map(([href, el, en], i) => link(href, lang === "en" ? en : el, i === 0 ? "first" : "")).join("")}</div>
      <a class="mega-promo" href="tickets.html"><span class="kicker">${h(t("seasonTickets"))}</span><b>${h(t("megaPromo"))}</b><span class="mega-go">${h(t("findOut"))}${SVG.chev}</span></a>
    </div>`;
    mega.hidden = false;
    qsa(".mainnav-btn").forEach(b => b.setAttribute("aria-expanded", String(b.dataset.menu === id)));
  }
  function closeMega(now) {
    const go = () => { const m = qs("#mega"); if (m) m.hidden = true; megaOpen = null; qsa(".mainnav-btn").forEach(b => b.setAttribute("aria-expanded", "false")); };
    clearTimeout(megaTimer);
    if (now) go(); else megaTimer = setTimeout(go, 180);
  }
  function toggleMobile(open) {
    const m = qs("#mnav"), b = qs(".burger"); if (!m) return;
    m.hidden = !open; b && b.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("locked", open);
    if (open) setTimeout(() => { const f = qs(".mnav-close"); f && f.focus(); }, 30); else b && b.focus();
  }

  function wireMasthead() {
    const canHover = () => matchMedia("(hover: hover) and (min-width: 1081px)").matches;
    document.addEventListener("click", e => {
      const lb = e.target.closest("[data-lang]");
      if (lb) { lang = lb.dataset.lang; try { localStorage.setItem("doxa.lang", lang); } catch (x) {} closeMega(true); const wasOpen = qs("#mnav") && !qs("#mnav").hidden; render().then(() => wasOpen && toggleMobile(true)); return; }
      const mb = e.target.closest(".mainnav-btn");
      if (mb) { megaOpen === mb.dataset.menu ? closeMega(true) : openMega(mb.dataset.menu); return; }
      if (megaOpen && !e.target.closest("#mast")) closeMega(true);
      if (e.target.closest(".burger")) { toggleMobile(true); return; }
      if (e.target.closest(".mnav-close")) { toggleMobile(false); return; }
      const sec = e.target.closest(".mnav-sec");
      if (sec) { const open = sec.getAttribute("aria-expanded") !== "true"; sec.setAttribute("aria-expanded", String(open)); qs("#" + sec.getAttribute("aria-controls")).hidden = !open; return; }
      const cp = e.target.closest("[data-copy]");
      if (cp) { navigator.clipboard.writeText(cp.dataset.copy).then(() => flash(t("copied")), () => window.prompt(t("copyThis"), cp.dataset.copy)); }
    });
    document.addEventListener("mouseover", e => {
      if (!canHover()) return;
      const mb = e.target.closest(".mainnav-btn");
      if (mb) { openMega(mb.dataset.menu); return; }
      if (e.target.closest("#mega")) clearTimeout(megaTimer);
    });
    document.addEventListener("mouseout", e => {
      if (!canHover() || !megaOpen) return;
      if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest(".mainnav, #mega")) closeMega();
    });
    document.addEventListener("keydown", e => {
      if (e.key !== "Escape") return;
      if (megaOpen) { const b = qs(`.mainnav-btn[data-menu="${megaOpen}"]`); closeMega(true); b && b.focus(); }
      const m = qs("#mnav"); if (m && !m.hidden) toggleMobile(false);
    });
    const onScroll = () => { const m = qs("#mast"); if (m) m.classList.toggle("stuck", scrollY > 36); };
    addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }

  function drawFooter() {
    const host = qs("#sitefoot"); if (!host) return;
    const col = id => { const n = NAV.find(x => x.id === id); return `<div class="foot-col"><h2>${h(n[lang])}</h2><ul>${n.links.map(([href, el, en]) => `<li>${link(href, lang === "en" ? en : el)}</li>`).join("")}</ul></div>`; };
    host.innerHTML = `
<footer class="foot">
  <div class="foot-motto"><div class="shell foot-motto-in"><img src="assets/img/doxa-crest-128.png" alt="" width="96" height="96" loading="lazy"><p>${h(t("motto"))}</p></div></div>
  <div class="shell foot-grid">
    <div class="foot-about">
      <p class="foot-name">${h(t("full"))}</p>
      <p>${h(t("footAbout"))}</p>
      <ul class="foot-contact">
        ${C.phone ? `<li>${SVG.phone}<a href="tel:+30${h(C.phone.replace(/\s/g, ""))}">${h(C.phone)}</a></li>` : ""}
        ${C.email ? `<li>${SVG.mail}<a href="mailto:${h(C.email)}">${h(C.email)}</a></li>` : ""}
        ${C.area ? `<li>${SVG.pin}<span>${h(pick(C.area))}</span></li>` : ""}
      </ul>
      <div class="socs socs-lg">${socials()}</div>
    </div>
    ${col("matches")}${col("club")}
    <div class="foot-col"><h2>${h(t("fans"))}</h2><ul>
      <li><a href="tickets.html">${h(t("seasonTickets"))}</a></li><li><a href="store.html">${h(t("shop"))}</a></li>
      <li><a href="academy.html">${h(t("academy"))}</a></li><li><a href="support.html">${h(t("donate"))}</a></li><li><a href="team.html">${h(t("squad"))}</a></li></ul></div>
  </div>
  <div class="foot-legal"><div class="shell foot-legal-in">
    <span>© ${new Date().getFullYear()} ${h(t("full"))}</span>
    <span>${h(t("dataFrom"))} <a href="https://www.epsana.gr" target="_blank" rel="noopener">epsana.gr</a></span>
    <a href="privacy.html">${h(t("privacy"))}</a>
  </div></div>
</footer>`;
  }

  /* --------------------------------------------------------- season data */
  function season(data) {
    if (!data || !data.fixtures) return null;
    const us = data.club;
    const mine = data.fixtures.filter(f => f.home === us || f.away === us)
      .map(f => ({ ...f, at: when(f.date), isHome: f.home === us })).sort((a, b) => a.round - b.round);
    const done = mine.filter(f => f.hs != null && f.as != null);
    done.forEach(f => {
      const a = f.isHome ? f.hs : f.as, b = f.isHome ? f.as : f.hs;
      f.res = a > b ? "w" : a < b ? "l" : "d";
    });
    const todo = mine.filter(f => f.hs == null);
    const row = (data.standings || []).find(r => r.team === us) || null;
    return { data, us, mine, done, todo, last: done[done.length - 1] || null, next: todo[0] || null, row, form: done.slice(-5) };
  }

  const pill = r => `<span class="res res-${r}">${h(t("r." + r))}</span>`;
  const formStrip = list => `<ol class="formrow" aria-label="${h(t("formLabel"))}">${list.map(f => `<li class="res-${f.res}" title="${h(clubName(f.home))} ${f.hs}–${f.as} ${h(clubName(f.away))}">${h(t("r1." + f.res))}</li>`).join("")}</ol>`;

  function icsHref(f) {
    if (!f.at) return "";
    const z = n => String(n).padStart(2, "0");
    const u = d => `${d.getUTCFullYear()}${z(d.getUTCMonth() + 1)}${z(d.getUTCDate())}T${z(d.getUTCHours())}${z(d.getUTCMinutes())}00Z`;
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Doxa Koropiou//Matches//EL", "BEGIN:VEVENT",
      `UID:doxa-${f.round}-${u(f.at)}@aokusatsc.com`, `DTSTAMP:${u(new Date())}`, `DTSTART:${u(f.at)}`, `DTEND:${u(new Date(f.at.getTime() + 105 * 60000))}`,
      `SUMMARY:${clubName(f.home)} - ${clubName(f.away)}`, `LOCATION:${ground(f.venue)}`, `DESCRIPTION:${nth(f.round)} ${t("round")}`, "END:VEVENT", "END:VCALENDAR"];
    return "data:text/calendar;charset=utf-8," + encodeURIComponent(lines.join("\r\n"));
  }

  // A match card, used in the home rail and the hero
  function matchCard(f, s, opts = {}) {
    const isDone = f.hs != null;
    const mid = isDone ? `<b class="mc-score">${f.hs}<i>–</i>${f.as}</b>`
      : f.at ? `<b class="mc-time">${h(hhmm(f.at))}</b>` : `<b class="mc-time mc-tbc">${h(t("vs"))}</b>`;
    const date = f.at ? fmt(f.at, { weekday: "short", day: "numeric", month: "short" }) : t("tbc");
    const side = raw => `<div class="mc-side${raw === s.us ? " is-us" : ""}">${mark(raw, "lg")}<span>${h(clubName(raw))}</span></div>`;
    return `<article class="mc${isDone ? " mc-done" : ""}${opts.next ? " mc-next" : ""}">
      <header class="mc-top"><span>${h(nth(f.round))} ${h(t("round"))}</span><time${f.date ? ` datetime="${h(f.date)}"` : ""}>${h(date)}</time></header>
      <div class="mc-body">${side(f.home)}<div class="mc-mid">${mid}</div>${side(f.away)}</div>
      <footer class="mc-foot">${isDone ? pill(f.res) : `<span class="mc-ha">${h(t(f.isHome ? "home" : "away"))}</span>`}<span class="mc-venue">${h(f.venue ? ground(f.venue) : (isDone ? "" : t("groundTbc")))}</span></footer>
      ${opts.next && f.at ? `<a class="mc-cal" href="${icsHref(f)}" download="doxa-${f.round}.ics">${SVG.cal}${h(t("toCalendar"))}</a>` : ""}
    </article>`;
  }

  function tableHTML(s, opts = {}) {
    const rows = s.data.standings || [];
    const full = !opts.compact;
    return `<div class="tbl-wrap"><table class="ltable${full ? "" : " ltable-compact"}">
      <caption class="vh">${h(t("tableCap"))}</caption>
      <thead><tr><th scope="col" class="c-pos">${h(t("th.pos"))}</th><th scope="col" class="c-team">${h(t("th.team"))}</th><th scope="col" title="${h(t("th.pFull"))}">${h(t("th.p"))}</th>
      ${full ? `<th scope="col" class="sm-hide">${h(t("th.w"))}</th><th scope="col" class="sm-hide">${h(t("th.d"))}</th><th scope="col" class="sm-hide">${h(t("th.l"))}</th><th scope="col" class="sm-hide">${h(t("th.gfga"))}</th>` : ""}
      <th scope="col" title="${h(t("th.gdFull"))}">${h(t("th.gd"))}</th><th scope="col" class="c-pts">${h(t("th.pts"))}</th></tr></thead>
      <tbody>${rows.map(r => {
        const gd = (r.gf ?? 0) - (r.ga ?? 0);
        return `<tr${r.team === s.us ? ' class="is-us"' : ""}><td class="c-pos">${r.pos}</td><th scope="row" class="c-team"><span class="tm">${mark(r.team, "sm")}<span>${h(clubName(r.team))}</span></span></th><td>${r.p ?? ""}</td>
        ${full ? `<td class="sm-hide">${r.w ?? ""}</td><td class="sm-hide">${r.d ?? ""}</td><td class="sm-hide">${r.l ?? ""}</td><td class="sm-hide">${r.gf ?? ""}:${r.ga ?? ""}</td>` : ""}
        <td>${gd > 0 ? "+" + gd : gd}</td><td class="c-pts">${r.pts}</td></tr>`;
      }).join("")}</tbody></table></div>`;
  }
  const stamp = s => s.data.updated ? `<p class="stamp">${h(t("updated", { when: fmt(new Date(s.data.updated), { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hour12: false }) }))} · <a href="${h(C.epsanaTable)}" target="_blank" rel="noopener">epsana.gr</a></p>` : "";

  function fixtureRow(f, s) {
    const isDone = f.hs != null;
    const us = s && s.us;
    const right = isDone ? `<b class="fr-score">${f.hs}–${f.as}</b>${f.res ? pill(f.res) : ""}${f.note === "α.α." ? `<small class="fr-note" title="${h(t("awardedFull"))}">${h(t("awarded"))}</small>` : ""}`
      : f.at ? `<b class="fr-time">${h(hhmm(f.at))}</b>` : `<span class="fr-tbc">${h(t("tbc"))}</span>`;
    return `<li class="fr${isDone ? " fr-done" : ""}">
      <div class="fr-date">${f.at ? `<b>${h(fmt(f.at, { day: "2-digit" }))}</b><span>${h(fmt(f.at, { month: "short" }))}</span>` : `<b>${f.round}</b><span>${h(t("roundShort"))}</span>`}</div>
      <div class="fr-match">
        <p class="fr-meta">${h(nth(f.round))} ${h(t("round"))}${f.at ? " · " + h(fmt(f.at, { weekday: "long" })) : ""}${f.venue ? " · " + h(ground(f.venue)) : ""}</p>
        <p class="fr-teams"><span class="${f.home === us ? "is-us" : ""}">${mark(f.home, "sm")}${h(clubName(f.home))}</span><span class="fr-dash">–</span><span class="${f.away === us ? "is-us" : ""}">${mark(f.away, "sm")}${h(clubName(f.away))}</span></p>
      </div>
      <div class="fr-right">${right}</div></li>`;
  }

  /* -------------------------------------------------------------- home */
  function drawHome(s) {
    const heroMeta = qs("#hero-meta");
    if (heroMeta) heroMeta.innerHTML = s && s.row
      ? `<span>${h(divisionName(s.data.division))}</span><span>${h(t("heroPos", { pos: nth(s.row.pos), pts: s.row.pts }))}</span>`
      : `<span>${h(t("since"))}</span>`;
    const heroCard = qs("#hero-next");
    if (heroCard) {
      const f = s && (s.next || s.last);
      heroCard.hidden = !f;
      if (f) heroCard.innerHTML = `<p class="kicker">${h(t(s.next ? "nextMatch" : "lastResult"))}</p>${matchCard(f, s, { next: !!s.next })}<a class="hero-next-all" href="matches.html">${h(t("allFixtures"))}${SVG.chev}</a>`;
    }
    const rail = qs("#rail");
    if (rail) {
      if (!s) { rail.innerHTML = `<p class="empty">${h(t("noData"))}</p>`; }
      else {
        const list = s.mine.filter(f => f.hs != null || f.at).slice(0);
        const ahead = s.todo.filter(f => !f.at).slice(0, 3);
        const items = list.concat(ahead);
        rail.innerHTML = items.map(f => matchCard(f, s, { next: s.next && f === s.next })).join("");
        const target = s.last ? items.indexOf(s.last) : 0;
        requestAnimationFrame(() => { const c = rail.children[Math.max(0, target - 1)]; if (c) rail.scrollLeft = c.offsetLeft - rail.offsetLeft; });
      }
    }
    const snap = qs("#snapshot");
    if (snap) {
      if (!s || !s.row) { snap.innerHTML = ""; }
      else {
        const r = s.row;
        snap.innerHTML = `<div class="snap-stat">
            <p class="kicker">${h(divisionName(s.data.division))} · ${h(s.data.season || "")}</p>
            <p class="snap-pos"><b>${r.pos}</b><sup>${lang === "en" ? h(nth(r.pos).replace(/^\d+/, "")) : "η"}</sup><span>${h(t("place_"))}</span></p>
            <dl class="snap-dl"><div><dt>${h(t("th.ptsFull"))}</dt><dd>${r.pts}</dd></div><div><dt>${h(t("wdl"))}</dt><dd>${r.w}-${r.d}-${r.l}</dd></div><div><dt>${h(t("goals"))}</dt><dd>${r.gf}:${r.ga}</dd></div></dl>
            ${s.form.length ? `<p class="snap-form-h">${h(t("formLabel"))}</p>${formStrip(s.form)}` : ""}
            <a class="btn btn-black" href="matches.html?tab=table">${h(t("fullTable"))}</a>
          </div>
          <div class="snap-table">${tableHTML(s, { compact: true })}${stamp(s)}</div>`;
      }
    }
  }

  /* ----------------------------------------------------------- matches */
  function drawMatches(s) {
    const root = qs("#matchroom"); if (!root) return;
    if (!s) { root.innerHTML = `<p class="empty">${h(t("noData"))}</p>`; return; }
    const tabs = [["fixtures", "tab.fixtures"], ["results", "tab.results"], ["table", "tab.table"], ["rounds", "tab.rounds"]];
    let tab = params.get("tab"); if (!tabs.some(x => x[0] === tab)) tab = "fixtures";
    const byMonth = list => {
      const groups = [];
      list.forEach(f => {
        const key = f.at ? fmt(f.at, { month: "long", year: "numeric" }) : t("datesTbc");
        let g = groups.find(x => x.key === key); if (!g) groups.push(g = { key, items: [] });
        g.items.push(f);
      });
      return groups.map(g => `<section class="month"><h3>${h(g.key)}</h3><ul class="frs">${g.items.map(f => fixtureRow(f, s)).join("")}</ul></section>`).join("");
    };
    const rounds = [...new Set(s.data.fixtures.map(f => f.round))].sort((a, b) => a - b);
    let pickRound = +(params.get("round") || (s.next ? s.next.round : rounds[rounds.length - 1]));
    const r = s.row;
    const panels = {
      fixtures: s.todo.length ? byMonth(s.todo) : `<p class="empty">${h(t("noFixtures"))}</p>`,
      results: s.done.length ? byMonth(s.done.slice().reverse()) : `<p class="empty">${h(t("noResults"))}</p>`,
      table: tableHTML(s) + `<p class="fineprint">${h(t("tableNote"))}</p>` + stamp(s),
      rounds: `<div class="round-pick"><label for="round-sel">${h(t("pickRound"))}</label><div class="selectwrap"><select id="round-sel">${rounds.map(x => `<option value="${x}"${x === pickRound ? " selected" : ""}>${h(nth(x))} ${h(t("round"))}</option>`).join("")}</select>${SVG.down}</div></div><ul class="frs" id="round-list"></ul>`
    };
    root.innerHTML = `
      ${r ? `<div class="statbar"><div><b>${h(nth(r.pos))}</b><span>${h(t("place_"))}</span></div><div><b>${r.pts}</b><span>${h(t("th.ptsFull"))}</span></div><div><b>${r.w}-${r.d}-${r.l}</b><span>${h(t("wdl"))}</span></div><div><b>${r.gf}:${r.ga}</b><span>${h(t("goals"))}</span></div>${s.form.length ? `<div class="statbar-form">${formStrip(s.form)}<span>${h(t("formLabel"))}</span></div>` : ""}</div>` : ""}
      <div class="tabs" role="tablist" aria-label="${h(t("matchesNav"))}">${tabs.map(([id, k]) => `<button type="button" role="tab" id="tb-${id}" aria-controls="tp-${id}" aria-selected="${id === tab}" tabindex="${id === tab ? 0 : -1}" data-tab="${id}">${h(t(k))}</button>`).join("")}</div>
      ${tabs.map(([id]) => `<div class="tabpanel" role="tabpanel" id="tp-${id}" aria-labelledby="tb-${id}"${id === tab ? "" : " hidden"}>${panels[id]}</div>`).join("")}
      <p class="ext-links">${link("@schedule", t("epsanaSchedule"), "arrowlink")}${link("@table", t("epsanaTable"), "arrowlink")}</p>`;
    const drawRound = n => {
      const list = s.data.fixtures.filter(f => f.round === n).map(f => ({ ...f, at: when(f.date) }));
      qs("#round-list").innerHTML = list.map(f => fixtureRow(f, s)).join("");
    };
    drawRound(pickRound);
    qs("#round-sel").onchange = e => { pickRound = +e.target.value; drawRound(pickRound); };
    const tl = qs(".tabs", root);
    const select = id => {
      qsa("[role=tab]", tl).forEach(b => { const on = b.dataset.tab === id; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; });
      qsa(".tabpanel", root).forEach(p => { p.hidden = p.id !== "tp-" + id; });
      history.replaceState(null, "", id === "fixtures" ? "matches.html" : "matches.html?tab=" + id);
    };
    tl.onclick = e => { const b = e.target.closest("[role=tab]"); if (b) select(b.dataset.tab); };
    tl.onkeydown = e => {
      if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      const bs = qsa("[role=tab]", tl), i = bs.indexOf(document.activeElement);
      const n = bs[(i + (e.key === "ArrowRight" ? 1 : -1) + bs.length) % bs.length]; n.focus(); select(n.dataset.tab);
    };
  }

  /* -------------------------------------------------------------- news */
  const CATS = ["match", "club", "academy"];
  const cover = n => {
    if (n.image) return `<img src="${h(n.image)}" alt="${h(pick(n.imageAlt))}" loading="lazy">`;
    if (n.cover) {
      const c = n.cover;
      return `<div class="cover"><div class="cover-row">${c.home ? mark(c.home, "xl") : ""}<b>${h(c.big)}</b>${c.away ? mark(c.away, "xl") : ""}</div><span>${h(pick(c.small))}</span></div>`;
    }
    return `<div class="cover cover-plain"><img src="assets/img/doxa-crest-256.png" alt="" loading="lazy" width="120" height="120"></div>`;
  };
  const card = (n, big) => `<a class="card${big ? " card-lead" : ""}" href="article.html?id=${encodeURIComponent(n.id)}">
      <div class="card-media">${cover(n)}<span class="tag">${h(t("cat." + n.category))}</span></div>
      <div class="card-text"><h3>${h(pick(n.title))}</h3>${big ? `<p>${h(pick(n.summary))}</p>` : ""}<time datetime="${h(n.date)}">${h(fmt(new Date(n.date + "T12:00:00Z"), { day: "numeric", month: "long", year: "numeric" }))}</time></div></a>`;

  // Every Doxa match with a score on EPSANA gets a short automatic story,
  // unless data/news.json already has an article for that round ("round": n).
  function resultStories(data, manual) {
    const s = season(data); if (!s) return [];
    const covered = new Set(manual.filter(m => m.round).map(m => +m.round));
    const divEl = divisionName(s.data.division, "el").replace("Κατηγορία", "Κατηγορίας"), divEn = divisionName(s.data.division, "en");
    return s.done.filter(f => !covered.has(f.round) && f.date).map(f => {
      const score = `${f.hs}–${f.as}`;
      const nm = (raw, l) => clubName(raw, l);
      const ttl = l => `${nm(f.home, l)} – ${nm(f.away, l)} ${score}`;
      const wEl = { w: "Νίκη", d: "Ισοπαλία", l: "Ήττα" }[f.res], wEn = { w: "Win", d: "Draw", l: "Defeat" }[f.res];
      const day = l => new Intl.DateTimeFormat(l === "en" ? "en-GB" : "el-GR", { timeZone: ATH, weekday: "long", day: "numeric", month: "long" }).format(f.at).replace(/,/g, "");
      const dEl = day("el"), art = /^(Κυριακή|Δευτέρα|Τρίτη|Τετάρτη|Πέμπτη|Παρασκευή)/.test(dEl) ? "την " : "το ";
      let tail = { el: "", en: "" };
      if (s.last && f.round === s.last.round && s.row) tail = {
        el: `\n\nΜετά από ${s.row.p} αγώνες, η Δόξα βρίσκεται στην ${s.row.pos}η θέση με ${s.row.pts} βαθμούς.`,
        en: `\n\nAfter ${s.row.p} matches, Doxa are ${(n => n + ([, "st", "nd", "rd"][(n % 100 >> 3 ^ 1) && n % 10] || "th"))(s.row.pos)} in the table with ${s.row.pts} points.`
      };
      return {
        id: "match-" + f.round, auto: true, round: f.round, date: f.date.slice(0, 10), category: "match",
        cover: { home: f.home, away: f.away, big: score, small: { el: `${wEl} · ${f.round}η αγωνιστική`, en: `${wEn} · Matchday ${f.round}` } },
        title: { el: ttl("el"), en: ttl("en") },
        summary: { el: `${wEl} ${f.isHome ? "εντός" : "εκτός"} έδρας για την ${f.round}η αγωνιστική της ${divEl}.`, en: `${wEn} ${f.isHome ? "at home" : "away"} on matchday ${f.round} of the ${divEn}.` },
        body: {
          el: `Ο αγώνας ${nm(f.home, "el")} – ${nm(f.away, "el")} για την ${f.round}η αγωνιστική της ${divEl} έληξε ${score}${{ w: " με νίκη της Δόξας", d: " ισόπαλος", l: "" }[f.res]}. Έγινε ${art}${dEl}${f.venue ? ", " + (f.venue in GROUNDS ? "στο " + ground(f.venue, "el").replace(/^Γήπεδο/, "γήπεδο") : "στο γήπεδο " + f.venue) : ""}.${tail.el}`,
          en: `${nm(f.home, "en")} – ${nm(f.away, "en")}, matchday ${f.round} of the ${divEn}, finished ${score}${{ w: ", a win for Doxa", d: ", a draw", l: "" }[f.res]}. It was played on ${day("en")}${f.venue ? " at " + (/ ground$/.test(ground(f.venue, "en")) ? "the " : "") + ground(f.venue, "en") : ""}.${tail.en}`
        }
      };
    });
  }

  async function drawNews() {
    const homeGrid = qs("#home-news"), list = qs("#news-grid"), art = qs("#story");
    if (!homeGrid && !list && !art) return;
    const [nd, ep] = await Promise.all([getData("data/news.json"), getData("data/epsana.json")]);
    const manual = (nd && nd.articles) || [];
    const all = manual.concat(resultStories(ep, manual)).sort((a, b) => b.date.localeCompare(a.date) || (b.round || 0) - (a.round || 0));
    if (homeGrid) homeGrid.innerHTML = all.length ? all.slice(0, 5).map((n, i) => card(n, i === 0)).join("") : `<p class="empty">${h(t("noNews"))}</p>`;
    if (list) {
      const bar = qs("#news-cats");
      let cat = params.get("cat"); if (!CATS.includes(cat)) cat = "";
      const paint = () => {
        bar.innerHTML = [["", "allNews"], ...CATS.map(c => [c, "cat." + c])].map(([c, k]) => `<button type="button" data-cat="${c}" aria-pressed="${c === cat}">${h(t(k))}</button>`).join("");
        const items = all.filter(n => !cat || n.category === cat);
        list.innerHTML = items.length ? items.map(n => card(n)).join("") : `<p class="empty">${h(t("noNews"))}</p>`;
        const ttl = qs("#news-title"); if (ttl) ttl.textContent = cat ? t("cat." + cat) : t("newsTitle");
        document.title = (cat ? t("cat." + cat) : t("newsTitle")) + " · " + t("short");
      };
      bar.onclick = e => { const b = e.target.closest("[data-cat]"); if (!b) return; cat = b.dataset.cat; history.replaceState(null, "", cat ? "news.html?cat=" + cat : "news.html"); paint(); };
      paint();
    }
    if (art) {
      const n = all.find(x => x.id === params.get("id"));
      if (!n) { art.innerHTML = `<section class="pagehead"><div class="shell"><h1>${h(t("notFound"))}</h1></div></section><div class="shell section"><a class="arrowlink" href="news.html">${h(t("allNews"))}</a></div>`; return; }
      document.title = pick(n.title) + " · " + t("short");
      const body = pick(n.body).split(/\n\n+/).map(p => p.startsWith("## ") ? `<h2>${h(p.slice(3))}</h2>` : `<p>${h(p)}</p>`).join("");
      const url = location.href.split("&lang")[0];
      const more = all.filter(x => x !== n).slice(0, 3);
      art.innerHTML = `
        <section class="pagehead pagehead-story"><div class="shell narrow">
          <p class="crumbs"><a href="news.html">${h(t("newsTitle"))}</a><span aria-hidden="true">/</span><a href="news.html?cat=${h(n.category)}">${h(t("cat." + n.category))}</a></p>
          <h1>${h(pick(n.title))}</h1>
          <p class="pagehead-date"><time datetime="${h(n.date)}">${h(fmt(new Date(n.date + "T12:00:00Z"), { weekday: "long", day: "numeric", month: "long", year: "numeric" }))}</time></p>
        </div></section>
        <div class="shell narrow story-wrap">
          <div class="story-media">${cover(n)}</div>
          <div class="prose">${body}</div>
          <div class="share"><span>${h(t("share"))}</span>
            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener">Facebook</a>
            <a href="https://wa.me/?text=${encodeURIComponent(pick(n.title) + " " + url)}" target="_blank" rel="noopener">WhatsApp</a>
            <button type="button" data-copy="${h(url)}">${h(t("copyLink"))}</button>
          </div>
        </div>
        ${more.length ? `<section class="section section-grey"><div class="shell"><div class="sechead"><h2>${h(t("moreNews"))}</h2><a class="arrowlink" href="news.html">${h(t("allNews"))}</a></div><div class="cards cards-3">${more.map(m => card(m)).join("")}</div></div></section>` : ""}`;
    }
  }

  /* ------------------------------------------------------------- squad */
  const POS = ["gk", "df", "mf", "fw"];
  const shirt = p => `<article class="shirt shirt-${h(p.position)}">
      <span class="shirt-no">${p.number}</span>
      <div class="shirt-txt"><b>${h(t("pos1." + p.position))}</b>${p.name ? `<span>${h(pick(p.name))}</span>` : `<span>${h(t("numberLabel", { n: p.number }))}</span>`}</div>
      ${p.captain ? `<span class="shirt-c" title="${h(t("captain"))}">C</span>` : ""}
    </article>`;

  async function drawSquad() {
    const rail = qs("#squad-rail"), page = qs("#squad");
    if (!rail && !page) return;
    const d = await getData("data/squad.json");
    const players = ((d && d.players) || []).slice().sort((a, b) => POS.indexOf(a.position) - POS.indexOf(b.position) || a.number - b.number);
    if (rail) rail.innerHTML = players.length ? players.map(shirt).join("") : `<p class="empty">${h(t("squadSoon"))}</p>`;
    if (page) {
      const views = ["", ...POS, "staff"];
      let pos = params.get("pos") || ""; if (!views.includes(pos)) pos = "";
      const bar = qs("#squad-pos");
      const paint = () => {
        bar.innerHTML = views.map(v => `<a href="team.html${v ? "?pos=" + v : ""}" data-pos="${v}" aria-current="${v === pos ? "page" : "false"}">${h(t(v ? (v === "staff" ? "staff" : "posN." + v) : "everyone"))}</a>`).join("");
        let out = d && d.placeholder && pos !== "staff" ? `<p class="note">${SVG.note}<span>${h(t("squadPlaceholder"))}</span></p>` : "";
        if (!d) out += `<p class="empty">${h(t("squadError"))}</p>`;
        (pos === "staff" ? [] : POS.filter(x => !pos || x === pos)).forEach(x => {
          const list = players.filter(p => p.position === x);
          if (list.length) out += `<section class="posgroup"><h2>${h(t("posN." + x))}<span>${list.length}</span></h2><div class="shirts">${list.map(shirt).join("")}</div></section>`;
        });
        if (!pos || pos === "staff") out += `<section class="posgroup"><h2>${h(t("staff"))}</h2><ul class="staff">${((d && d.staff) || []).map(x => `<li><span>${h(pick(x.role))}</span><b>${h(pick(x.name))}</b></li>`).join("")}</ul></section>`;
        page.innerHTML = out;
        const ttl = qs("#team-title"); if (ttl) ttl.textContent = pos ? t(pos === "staff" ? "staff" : "posN." + pos) : t("squad");
      };
      bar.onclick = e => { const a = e.target.closest("[data-pos]"); if (!a) return; e.preventDefault(); pos = a.dataset.pos; history.pushState(null, "", a.getAttribute("href")); paint(); };
      if (!window._doxaPop) { window._doxaPop = true; addEventListener("popstate", () => { pos = new URLSearchParams(location.search).get("pos") || ""; paint(); }); }
      paint();
    }
  }

  /* ------------------------------------------------------------- store */
  async function drawStore() {
    const host = qs("#products"); if (!host) return;
    const d = await getData("data/store.json");
    const items = (d && d.products) || [];
    let cat = params.get("cat") || ""; if (!["kit", "fan"].includes(cat)) cat = "";
    qs("#store-cats").innerHTML = [["", "allProducts"], ["kit", "kit"], ["fan", "fanGear"]].map(([c, k]) => `<a href="store.html${c ? "?cat=" + c : ""}" aria-current="${c === cat ? "page" : "false"}">${h(t(k))}</a>`).join("");
    const shop = C.shopUrl;
    host.innerHTML = (d && d.placeholder ? `<p class="note">${SVG.note}<span>${h(t("storePlaceholder"))}</span></p>` : "") +
      `<div class="products">${items.filter(p => !cat || p.category === cat).map(p => `
      <article class="product">
        <div class="product-img"><img src="${h(p.image)}" alt="" loading="lazy" width="600" height="600">${p.label ? `<span class="tag">${h(pick(p.label))}</span>` : ""}</div>
        <div class="product-txt"><h3>${h(pick(p.name))}</h3><p>${p.price ? "€" + p.price : h(t("priceSoon"))}${p.sizes ? ` · <span>${h(p.sizes.join(" · "))}</span>` : ""}</p></div>
        ${shop ? `<a class="btn btn-black btn-sm" href="${h(shop)}" target="_blank" rel="noopener">${h(t("buy"))}</a>` : `<a class="btn btn-outline btn-sm" href="#order" data-choose="${h(p.id)}">${h(t("order"))}</a>`}
      </article>`).join("")}</div>`;
    const sel = qs("#o-item");
    if (sel) { const v = sel.value; sel.innerHTML = items.map(p => `<option value="${h(p.name.el)}" data-id="${h(p.id)}">${h(pick(p.name))}${p.price ? " – €" + p.price : ""}</option>`).join(""); if (v) sel.value = v; }
    const of = qs("#order"); if (of) of.hidden = !!shop;
  }

  /* --------------------------------------------- tickets, support, etc. */
  function drawTickets() {
    const host = qs("#plans"); if (!host) return;
    const url = C.ticketUrl;
    host.innerHTML = (C.tickets || []).map(p => `
      <article class="plan${p.best ? " plan-best" : ""}">
        ${p.best ? `<span class="plan-flag">${h(t("popular"))}</span>` : ""}
        <h3>${h(pick(p.name))}</h3>
        <p class="plan-price">${p.price ? `<b>€${p.price}</b><span>/ ${h(t("perSeason"))}</span>` : `<b>${h(t("free"))}</b>`}</p>
        <p>${h(pick(p.text))}</p>
        ${p.price ? (url ? `<a class="btn ${p.best ? "btn-black" : "btn-yellow"}" href="${h(url)}" target="_blank" rel="noopener">${h(t("buy"))}</a>` : `<a class="btn ${p.best ? "btn-black" : "btn-yellow"}" href="#ticket-form" data-choose="${h(p.id)}">${h(t("request"))}</a>`) : ""}
      </article>`).join("");
    const sel = qs("#t-plan");
    if (sel) { const v = sel.value; sel.innerHTML = (C.tickets || []).filter(p => p.price).map(p => `<option value="${h(p.name.el)} – €${p.price}" data-id="${h(p.id)}">${h(pick(p.name))} – €${p.price}</option>`).join(""); if (v) sel.value = v; }
    const f = qs("#ticket-form"); if (f) f.hidden = !!url;
    const pn = qs("#prices-note"); if (pn) pn.hidden = !!C.pricesConfirmed;
  }

  function drawSupport() {
    const host = qs("#bank"); if (!host) return;
    const b = C.bank || {};
    host.innerHTML = b.iban
      ? `<dl class="bankbox">${[["holder", b.holder], ["bank", b.bank], ["iban", b.iban], ["bic", b.bic], ["ref", t("bankRefText")]].filter(r => r[1]).map(([k, v]) => `<div><dt>${h(t("bank." + k))}</dt><dd>${h(v)}</dd>${k === "bank" ? "<span></span>" : `<button type="button" data-copy="${h(v)}">${h(t("copy"))}</button>`}</div>`).join("")}</dl>`
      : `<p class="note">${SVG.note}<span>${h(t("bankSoon"))}</span></p>`;
    const card = qs("#donate-link"); if (card) { card.hidden = !C.donateUrl; if (C.donateUrl) qs("a", card).href = C.donateUrl; }
  }

  async function drawSponsors() {
    const host = qs("#partners"); if (!host) return;
    const d = await getData("data/sponsors.json");
    const list = (d && d.sponsors) || [];
    host.innerHTML = list.length
      ? `<div class="partners">${list.map(s => s.url ? `<a href="${h(s.url)}" target="_blank" rel="noopener" title="${h(s.name)}"><img src="${h(s.logo)}" alt="${h(s.name)}" loading="lazy"></a>` : `<div title="${h(s.name)}"><img src="${h(s.logo)}" alt="${h(s.name)}" loading="lazy"></div>`).join("")}</div>`
      : `<div class="partners-empty"><p><b>${h(t("sponsorsEmptyH"))}</b>${h(t("sponsorsEmptyP"))}</p><a class="btn btn-black" href="sponsors.html#enquire">${h(t("becomeSponsor"))}</a></div>`;
  }

  // Academy groups by year of birth, for the season that starts each July
  const GROUPS = [
    { max: 5, el: "Νηπιακό", en: "Nursery", ages: "4–5" }, { max: 7, el: "Κ8", en: "U8", ages: "6–7" }, { max: 9, el: "Κ10", en: "U10", ages: "8–9" },
    { max: 11, el: "Κ12", en: "U12", ages: "10–11" }, { max: 13, el: "Κ14", en: "U14", ages: "12–13" }, { max: 15, el: "Κ16", en: "U16", ages: "14–15" }, { max: 17, el: "Κ18", en: "U18", ages: "16–17" }
  ];
  const seasonStart = () => { const n = new Date(); return n.getMonth() >= 6 ? n.getFullYear() : n.getFullYear() - 1; };
  const groupFor = dob => {
    if (!dob) return null;
    const age = seasonStart() + 1 - new Date(dob).getFullYear();
    return age < 4 ? null : GROUPS.find(g => age <= g.max) || null;
  };
  function drawGroups() {
    const host = qs("#groups-grid"); if (!host) return;
    const s = seasonStart();
    host.innerHTML = GROUPS.map((g, i) => {
      const lo = i === 0 ? 4 : GROUPS[i - 1].max + 1;
      return `<li><b>${h(pick(g))}</b><span>${h(t("ages", { a: g.ages }))}</span><small>${h(t("bornIn", { y: (s + 1 - g.max) + (g.max !== lo ? "–" + (s + 1 - lo) : "") }))}</small></li>`;
    }).join("");
  }

  function drawContact() {
    const host = qs("#contact-facts"); if (!host) return;
    host.innerHTML = [
      C.phone && ["phone", t("phone"), `<a href="tel:+30${h(C.phone.replace(/\s/g, ""))}">${h(C.phone)}</a>`],
      C.email && ["mail", "Email", `<a href="mailto:${h(C.email)}">${h(C.email)}</a>`],
      C.area && ["pin", t("area"), h(pick(C.area))],
      C.homeGround && ["pin", t("homeGround"), h(pick(C.homeGround))],
      pick(C.hours) && ["clock", t("hours"), h(pick(C.hours))]
    ].filter(Boolean).map(([i, k, v]) => `<li>${SVG[i]}<div><span>${h(k)}</span><b>${v}</b></div></li>`).join("");
    const s = qs("#contact-socs"); if (s) s.innerHTML = socials("soc-dark");
  }

  /* ------------------------------------------------------------- forms */
  function wireForms() {
    qsa("form[data-send]").forEach(form => {
      if (form._wired) return; form._wired = true;
      const dob = qs("[name='child_birthdate']", form), out = qs("#group-out", form);
      if (dob && out) dob.addEventListener("change", () => {
        const g = groupFor(dob.value);
        out.hidden = !g; if (g) out.textContent = t("groupIs", { g: pick(g) + " (" + t("ages", { a: g.ages }) + ")" });
        const hid = qs("[name='age_group']", form); if (hid) hid.value = g ? g.el : "";
      });
      form.addEventListener("submit", async e => {
        e.preventDefault();
        const msg = qs(".formmsg", form);
        let first = null;
        qsa("[required]", form).forEach(f => {
          const bad = f.type === "checkbox" ? !f.checked : !f.value.trim() || (f.type === "email" && !/^\S+@\S+\.\S+$/.test(f.value.trim()));
          f.setAttribute("aria-invalid", String(bad));
          if (bad && !first) first = f;
        });
        if (first) { first.focus(); msg.className = "formmsg is-bad"; msg.textContent = t("checkFields"); return; }
        if (qs("[name='website']", form)?.value) return; // spam trap
        const box = form.dataset.send; // general | office | academy
        const key = (C.forms || {})[box];
        const fallback = { general: C.email, office: C.officeEmail, academy: C.academyEmail }[box] || C.email;
        if (!key) { msg.className = "formmsg is-bad"; msg.textContent = t("formOff"); return; }
        const btn = qs("[type=submit]", form); btn.disabled = true;
        msg.className = "formmsg"; msg.textContent = t("sending");
        const body = {};
        new FormData(form).forEach((v, k) => { if (k !== "website") body[k] = v; });
        body.access_key = key;
        body.subject = form.dataset.subject + (body.child_name ? " – " + body.child_name : body.name ? " – " + body.name : "");
        body.from_name = "Δόξα Κορωπίου · aokusatsc.com";
        body.site_language = lang === "en" ? "English" : "Ελληνικά";
        const reply = body.email || body.parent_email; if (reply) body.replyto = reply;
        try {
          const r = await fetch("https://api.web3forms.com/submit", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body) });
          const j = await r.json().catch(() => ({}));
          if (!r.ok || j.success === false || j.success === "false") throw new Error(j.message || r.status);
          form.reset(); if (out) out.hidden = true;
          msg.className = "formmsg is-ok"; msg.textContent = t("sent." + (form.dataset.kind || "general"));
        } catch (err) {
          console.warn(err);
          msg.className = "formmsg is-bad"; msg.innerHTML = h(t("sendFailed")) + ` <a href="mailto:${h(fallback)}">${h(fallback)}</a>`;
        } finally { btn.disabled = false; }
      });
    });
    if (!window._doxaChoose) {
      window._doxaChoose = true;
      document.addEventListener("click", e => {
        const b = e.target.closest("[data-choose]"); if (!b) return;
        const sel = qs("#t-plan") || qs("#o-item") || qs("#s-pack"); if (!sel) return;
        const o = [...sel.options].find(x => x.dataset.id === b.dataset.choose || x.value === b.dataset.choose); if (o) sel.value = o.value;
      });
    }
  }

  /* ------------------------------------------------------------ render */
  async function render() {
    drawMasthead();
    drawFooter();
    translateStatic();
    drawTickets(); drawSupport(); drawGroups(); drawContact(); wireForms();
    qsa("[data-out]").forEach(a => { const f = ext[a.dataset.out]; if (f) { a.href = f(); a.target = "_blank"; a.rel = "noopener"; } });
    const jobs = [drawNews(), drawSquad(), drawStore(), drawSponsors()];
    if (qs("#rail, #snapshot, #matchroom, #hero-next")) jobs.push(getData("data/epsana.json").then(d => { const s = season(d); drawHome(s); drawMatches(s); }));
    await Promise.all(jobs);
  }

  // rail arrows
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-scroll]"); if (!b) return;
    const r = qs("#" + b.dataset.target); if (r) r.scrollBy({ left: (b.dataset.scroll === "next" ? 1 : -1) * r.clientWidth * 0.8, behavior: "smooth" });
  });

  wireMasthead();
  render();
  if (qs("#rail, #matchroom")) setInterval(() => { delete memo["data/epsana.json"]; getData("data/epsana.json").then(d => { const s = season(d); drawHome(s); }); }, 600000);
})();
