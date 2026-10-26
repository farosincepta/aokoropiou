/* =====================================================================
   Α.Ο. Κορωπίου — site script
   Header + right-side menu, ΕΛ/EN switch, EPSANA match centre,
   news, squad, forms. No build step, no dependencies.
   ===================================================================== */
(function () {
  "use strict";

  const CFG = window.AOK_CONFIG || {};
  const TEAMS = window.AOK_TEAMS || {};
  const VENUES = window.AOK_VENUES || {};
  const EN = window.AOK_EN || {};
  const UI = window.AOK_UI || { el: {}, en: {} };
  const page = document.body.dataset.page || "";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ------------------------------------------------------------ language */
  let lang = "el";
  try { lang = localStorage.getItem("aok-lang") === "en" ? "en" : "el"; } catch (e) {}
  const q = new URLSearchParams(location.search);
  if (q.get("lang") === "en" || q.get("lang") === "el") lang = q.get("lang");

  const u = (k, vars) => {
    let s = (UI[lang] && UI[lang][k]) ?? UI.el[k] ?? k;
    if (vars) Object.keys(vars).forEach(v => { s = s.replace("{" + v + "}", vars[v]); });
    return s;
  };
  const L = obj => obj == null ? "" : (typeof obj === "string" ? obj : (obj[lang] ?? obj.el ?? ""));
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function applyStatic() {
    document.documentElement.lang = lang;
    $$("[data-i18n]").forEach(el => {
      if (el.dataset.el == null) el.dataset.el = el.innerHTML;
      const en = EN[el.dataset.i18n];
      el.innerHTML = lang === "en" && en != null ? en : el.dataset.el;
    });
    $$("[data-i18n-attr]").forEach(el => {
      el.dataset.i18nAttr.split(",").forEach(pair => {
        const [attr, key] = pair.split(":").map(s => s.trim());
        const store = "el" + attr.replace(/[^a-z]/gi, "");
        if (el.dataset[store] == null) el.dataset[store] = el.getAttribute(attr) || "";
        el.setAttribute(attr, lang === "en" && EN[key] != null ? EN[key] : el.dataset[store]);
      });
    });
    const t = document.querySelector("meta[name='title-en']");
    if (t) {
      if (!document.documentElement.dataset.titleEl) document.documentElement.dataset.titleEl = document.title;
      document.title = lang === "en" ? t.content : document.documentElement.dataset.titleEl;
    }
    $$(".lang button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  }

  function setLang(next) {
    lang = next;
    try { localStorage.setItem("aok-lang", lang); } catch (e) {}
    renderAll();
  }

  /* ------------------------------------------------------------- helpers */
  const translit = (() => {
    const pairs = [["ΟΥ","OU"],["Ου","Ou"],["ου","ou"],["ΑΥ","AV"],["Αυ","Av"],["αυ","av"],["ΕΥ","EV"],["Ευ","Ev"],["ευ","ev"],["ΜΠ","B"],["Μπ","B"],["μπ","b"],["ΝΤ","D"],["Ντ","D"],["ντ","d"],["ΓΚ","G"],["Γκ","G"],["γκ","g"]];
    const map = { Α:"A",Β:"V",Γ:"G",Δ:"D",Ε:"E",Ζ:"Z",Η:"I",Θ:"Th",Ι:"I",Κ:"K",Λ:"L",Μ:"M",Ν:"N",Ξ:"X",Ο:"O",Π:"P",Ρ:"R",Σ:"S",Τ:"T",Υ:"Y",Φ:"F",Χ:"Ch",Ψ:"Ps",Ω:"O",
      α:"a",β:"v",γ:"g",δ:"d",ε:"e",ζ:"z",η:"i",θ:"th",ι:"i",κ:"k",λ:"l",μ:"m",ν:"n",ξ:"x",ο:"o",π:"p",ρ:"r",σ:"s",ς:"s",τ:"t",υ:"y",φ:"f",χ:"ch",ψ:"ps",ω:"o" };
    return s => {
      s = String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
      pairs.forEach(([g, l]) => { s = s.split(g).join(l); });
      s = s.replace(/[Ͱ-Ͽ]/g, c => map[c] ?? c);
      return s.toLowerCase().replace(/(^|[\s.\-–(«])([a-z])/g, (m, a, b) => a + b.toUpperCase());
    };
  })();
  const greekTitle = s => String(s || "").toLocaleLowerCase("el").replace(/(^|[\s.\-–(«])(\S)/g, (m, a, b) => a + b.toLocaleUpperCase("el"));

  const teamName = raw => {
    const t = TEAMS[raw];
    if (t) return lang === "en" ? t.en : t.el;
    return lang === "en" ? translit(raw) : greekTitle(raw);
  };
  const teamShort = raw => {
    const t = TEAMS[raw];
    if (t) return lang === "en" ? t.shortEn : t.short;
    const s = lang === "en" ? translit(raw) : raw;
    return s.replace(/[^A-Za-zΑ-Ωα-ω]/g, "").slice(0, 3).toUpperCase();
  };
  const venueName = raw => {
    if (!raw) return "";
    const v = VENUES[raw];
    if (v) return lang === "en" ? v.en : v.el;
    return lang === "en" ? translit(raw) : raw;
  };

  const locale = () => (lang === "en" ? "en-GB" : "el-GR");
  // EPSANA times are Greek local time: turn them into real instants, then
  // always display them in Athens time so visitors abroad see kick-off as listed.
  const TZ = "Europe/Athens";
  const tzOffset = when => {
    const p = {}; new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(when).forEach(x => { p[x.type] = x.value; });
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute) - Math.floor(when.getTime() / 60000) * 60000;
  };
  const parseDate = s => {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(s || "");
    if (!m) return null;
    const utc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
    return new Date(utc - tzOffset(new Date(utc)));
  };
  const fmtDate = (d, opts) => d ? new Intl.DateTimeFormat(locale(), { timeZone: TZ, ...opts }).format(d) : "";
  const fmtLong = d => fmtDate(d, { weekday: "long", day: "numeric", month: "long" });
  const fmtTime = d => fmtDate(d, { hour: "2-digit", minute: "2-digit", hour12: false });
  const ordinal = n => {
    if (lang !== "en") return n + "η";
    const t = n % 100, o = n % 10;
    return n + (t >= 11 && t <= 13 ? "th" : o === 1 ? "st" : o === 2 ? "nd" : o === 3 ? "rd" : "th");
  };

  async function getJSON(path) {
    const r = await fetch(path + (path.includes("?") ? "&" : "?") + "v=" + Math.floor(Date.now() / 300000), { cache: "no-store" });
    if (!r.ok) throw new Error(path + " " + r.status);
    return r.json();
  }
  const cache = {};
  const load = path => (cache[path] = cache[path] || getJSON(path).catch(e => { console.warn(e); return null; }));

  function toast(msg) {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2400);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast(u("copied")); }
    catch (e) { prompt(u("copyManual"), text); }
  }

  const ICON = {
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M14 6v12" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    star: '<svg class="star" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 0l1.6 7.4L20 10l-8.4 2.3L10 20l-1.6-7.7L0 10l8.4-2.6z"/></svg>',
    info: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2zm0-8h-2V7h2z"/></svg>',
    facebook: '<svg class="brand" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="#0866FF"/><path fill="#fff" d="M26.6 48V31.4h5.6l.9-6.6h-6.5v-4.2c0-1.9.6-3.2 3.3-3.2h3.5V11.5c-.6-.1-2.7-.3-5.1-.3-5 0-8.5 3.1-8.5 8.7v4.9h-5.7v6.6h5.7V48z"/></svg>',
    instagram: '<svg class="brand" viewBox="0 0 48 48" aria-hidden="true"><defs><radialGradient id="igg" cx="13" cy="50" r="62" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFD776"/><stop offset=".25" stop-color="#F3A554"/><stop offset=".5" stop-color="#E03E6B"/><stop offset=".75" stop-color="#C13584"/><stop offset="1" stop-color="#5B51D8"/></radialGradient></defs><rect width="48" height="48" rx="12" fill="url(#igg)"/><rect x="11" y="11" width="26" height="26" rx="7.5" fill="none" stroke="#fff" stroke-width="3"/><circle cx="24" cy="24" r="6.2" fill="none" stroke="#fff" stroke-width="3"/><circle cx="31.6" cy="16.4" r="1.9" fill="#fff"/></svg>',
    youtube: '<svg viewBox="0 0 24 24"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15V9l5.8 3z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24"><path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.2v12.4a2.6 2.6 0 1 1-1.8-2.5V9.6a5.8 5.8 0 1 0 5 5.8V9a7.4 7.4 0 0 0 4.3 1.4V7.2a4.3 4.3 0 0 1-3.2-1.4z"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.2 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.2.2 2.5.6 3.6a1 1 0 0 1-.3 1z"/></svg>',
    mail: '<svg viewBox="0 0 24 24"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7.2L4.5 7v.1L12 12.4l7.5-5.3V7z"/></svg>',
    pin: '<svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
    ext: '<svg class="ext" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 10.4 3.5 2.1-.8 1.3L11 13V7h2z"/></svg>'
  };

  /* -------------------------------------------------------------- chrome */
  const GROUPS = [
    { id: "home", label: "tab.home", links: [["index.html", "nav.home", true], ["club.html", "nav.club"], ["history.html", "nav.history"], ["stadium.html", "nav.stadium"], ["@results", "nav.results"], ["@standings", "nav.standings"]] },
    { id: "news", label: "tab.news", links: [["news.html", "nav.allNews", true], ["news.html?cat=match", "cat.match"], ["news.html?cat=club", "cat.club"], ["news.html?cat=academy", "cat.academy"]] },
    { id: "team", label: "tab.team", links: [["team.html", "nav.squad", true], ["team.html?pos=gk", "pos.gk"], ["team.html?pos=df", "pos.df"], ["team.html?pos=mf", "pos.mf"], ["team.html?pos=fw", "pos.fw"], ["team.html?pos=staff", "nav.staff"], ["@results", "nav.results"], ["@standings", "nav.standings"]] },
    { id: "academy", label: "tab.academy", links: [["academy.html", "nav.academy", true], ["academy.html#groups", "nav.groups"], ["academy.html#register", "nav.register"], ["academy.html#faq", "nav.faq"]] },
    { id: "store", label: "tab.store", links: [["store.html", "nav.store", true], ["store.html?cat=kit", "store.cat.kit"], ["store.html?cat=fan", "store.cat.fan"], ["store.html#order", "nav.order"]] },
    { id: "sponsors", label: "tab.sponsors", links: [["sponsors.html", "nav.sponsors", true], ["sponsors.html#become", "nav.becomeSponsor"], ["support.html", "nav.support"]] },
    { id: "contact", label: "tab.contact", links: [["contact.html", "nav.contact", true], ["tickets.html", "nav.tickets"], ["support.html", "nav.donate"], ["privacy.html", "nav.privacy"]] }
  ];
  const PAGE_GROUP = { home: "home", club: "home", history: "home", stadium: "home", store: "store", news: "news", article: "news", team: "team", academy: "academy", sponsors: "sponsors", support: "sponsors", contact: "contact", tickets: "contact", privacy: "contact" };

  // A menu/footer link: "@results" and "@standings" go to EPSANA in a new tab.
  const EXT = { "@results": () => CFG.epsanaResults, "@standings": () => CFG.epsanaStandings };
  const navLink = (h, k, cls) => {
    const ext = EXT[h];
    const href = ext ? ext() : h;
    return `<a href="${esc(href)}"${cls ? ` class="${cls}"` : ""}${ext ? ' target="_blank" rel="noopener"' : ""}>${esc(u(k))}${ext ? ICON.ext + `<span class="sr-only"> ${esc(u("newTab"))}</span>` : ""}</a>`;
  };
  let socialSeq = 0; // each Instagram logo needs its own gradient id
  const socialsHTML = () => Object.entries(CFG.social || {}).filter(([, v]) => v)
    .map(([k, v]) => `<a class="social-${k}" href="${esc(v)}" target="_blank" rel="noopener" aria-label="${esc(u("social." + k))}" title="${esc(u("social." + k))}">${(ICON[k] || "").replace(/igg/g, "igg" + (++socialSeq))}</a>`).join("");

  function renderHeader() {
    const host = $("#site-header");
    if (!host) return;
    const overHero = document.body.dataset.hero === "1";
    const current = PAGE_GROUP[page];
    host.innerHTML = `
<header class="site-header${overHero ? " over-hero" : ""}" id="top-bar">
  <div class="wrap header-inner">
    <a class="brand" href="index.html" aria-label="${esc(u("homeAria"))}">
      <img src="assets/img/crest-128.png" alt="" width="44" height="50">
      <span class="brand-text"><span class="brand-name">${esc(u("clubName"))}</span><span class="brand-year">${esc(u("since"))}</span></span>
    </a>
    <nav class="tabs" aria-label="${esc(u("mainNav"))}">
      <ul>${GROUPS.map(g => `<li><button class="tab" type="button" data-open="${g.id}" aria-haspopup="dialog"${g.id === current ? ' aria-current="page"' : ""}>${esc(u(g.label))}</button></li>`).join("")}</ul>
    </nav>
    <div class="header-tools">
      <div class="socials header-socials">${socialsHTML()}</div>
      <div class="lang" role="group" aria-label="${esc(u("language"))}">
        <button type="button" data-lang="el" aria-pressed="${lang === "el"}"><img src="assets/img/flag-gr.svg" alt="" width="22" height="15"><span>ΕΛ</span><span class="sr-only">Ελληνικά</span></button>
        <button type="button" data-lang="en" aria-pressed="${lang === "en"}"><img src="assets/img/flag-en.svg" alt="" width="22" height="15"><span>EN</span><span class="sr-only">English</span></button>
      </div>
      <a class="btn btn-sm ${overHero ? "btn-line" : "btn-line dark"} header-tickets" href="tickets.html">${ICON.ticket}${esc(u("seasonTickets"))}</a>
      <button class="menu-btn" type="button" data-open="${current || "home"}" aria-haspopup="dialog" aria-controls="drawer"><span class="bars" aria-hidden="true"><i></i><i></i><i></i></span><span class="label">${esc(u("menu"))}</span></button>
    </div>
  </div>
</header>
<div class="drawer-scrim" data-close></div>
<aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-label="${esc(u("menu"))}">
  <div class="drawer-top">
    <img src="assets/img/crest-128.png" alt="" width="36" height="41">
    <strong>${esc(u("clubName"))}</strong>
    <button class="drawer-close" type="button" data-close>${esc(u("close"))}${ICON.close}</button>
  </div>
  <div class="drawer-body">
    <ul class="drawer-groups">
      ${GROUPS.map(g => `<li><button class="group-btn" type="button" data-group="${g.id}" aria-expanded="false" aria-controls="dp-${g.id}">${esc(u(g.label))}${ICON.arrow}</button>
        <div class="drawer-sub" id="ds-${g.id}" hidden>${g.links.map(([h, k]) => navLink(h, k)).join("")}</div></li>`).join("")}
    </ul>
    <div class="drawer-panels">
      ${GROUPS.map(g => `<div class="drawer-panel" id="dp-${g.id}" hidden><h3>${esc(u(g.label))}</h3>${g.links.map(([h, k, p]) => navLink(h, k, p ? "primary" : "")).join("")}</div>`).join("")}
    </div>
  </div>
  <div class="drawer-foot">
    <a class="btn btn-white btn-sm" href="tickets.html">${ICON.ticket}${esc(u("seasonTickets"))}</a>
    <a class="btn btn-line btn-sm" href="support.html">${ICON.heart}${esc(u("donate"))}</a>
    <div class="socials">${socialsHTML()}</div>
  </div>
</aside>`;
  }

  let lastFocus = null;
  function openDrawer(group) {
    lastFocus = document.activeElement;
    document.body.classList.add("drawer-open");
    selectGroup(group || "home", window.matchMedia("(max-width: 760px)").matches);
    setTimeout(() => { const b = $(`.group-btn[data-group="${group}"]`) || $(".group-btn"); b && b.focus(); }, 60);
  }
  function closeDrawer() {
    document.body.classList.remove("drawer-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function selectGroup(id, toggleMobile) {
    $$(".group-btn").forEach(b => {
      const on = b.dataset.group === id;
      const sub = $("#ds-" + b.dataset.group);
      if (toggleMobile !== undefined && window.matchMedia("(max-width: 760px)").matches) {
        const open = on ? (toggleMobile === "toggle" ? b.getAttribute("aria-expanded") !== "true" : true) : false;
        b.setAttribute("aria-expanded", String(open)); sub.hidden = !open;
      } else {
        b.setAttribute("aria-expanded", String(on)); sub.hidden = !on;
      }
    });
    $$(".drawer-panel").forEach(p => { p.hidden = p.id !== "dp-" + id; });
  }

  function bindChrome() {
    document.addEventListener("click", e => {
      const open = e.target.closest("[data-open]");
      if (open) { e.preventDefault(); openDrawer(open.dataset.open); return; }
      if (e.target.closest("[data-close]")) { closeDrawer(); return; }
      const g = e.target.closest(".group-btn");
      if (g) { selectGroup(g.dataset.group, "toggle"); return; }
      const l = e.target.closest(".lang button");
      if (l) { setLang(l.dataset.lang); return; }
      const c = e.target.closest("[data-copy]");
      if (c) { copy(c.dataset.copy); return; }
      if (e.target.closest(".drawer a")) closeDrawer();
    });
    document.addEventListener("mouseover", e => {
      const g = e.target.closest(".group-btn");
      if (g && window.matchMedia("(min-width: 761px) and (hover: hover)").matches) selectGroup(g.dataset.group);
    });
    document.addEventListener("keydown", e => {
      if (!document.body.classList.contains("drawer-open")) return;
      if (e.key === "Escape") closeDrawer();
      if (e.key === "Tab") { // keep focus inside the menu
        const f = $$("#drawer a, #drawer button").filter(x => x.offsetParent !== null);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    const bar = () => { const h = $("#top-bar"); if (h) h.classList.toggle("scrolled", window.scrollY > 40); };
    window.addEventListener("scroll", bar, { passive: true }); bar();
  }

  function renderFooter() {
    const host = $("#site-footer");
    if (!host) return;
    const year = new Date().getFullYear();
    const contact = [
      L(CFG.address),
      CFG.phone ? `<a href="tel:${esc(CFG.phone.replace(/\s/g, ""))}">${esc(CFG.phone)}</a>` : "",
      CFG.clubEmail ? `<a href="mailto:${esc(CFG.clubEmail)}">${esc(CFG.clubEmail)}</a>` : ""
    ].filter(Boolean).join("<br>");
    host.innerHTML = `
<footer class="site-footer">
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-brand">
        <img src="assets/img/crest-128.png" alt="" width="64" height="72">
        <div><strong>${esc(u("clubFull"))}</strong><p class="foot-motto">${esc(u("motto1"))}<br>${esc(u("motto2"))}</p><p>${esc(u("footAbout"))}</p><div class="socials" style="margin-top:16px">${socialsHTML()}</div></div>
      </div>
      <div><h4>${esc(u("footClub"))}</h4><ul>
        <li><a href="club.html">${esc(u("nav.club"))}</a></li><li><a href="news.html">${esc(u("tab.news"))}</a></li>
        <li><a href="team.html">${esc(u("tab.team"))}</a></li><li>${navLink("@results", "nav.results")}</li><li>${navLink("@standings", "nav.standings")}</li>
        <li><a href="academy.html">${esc(u("tab.academy"))}</a></li></ul></div>
      <div><h4>${esc(u("footSupport"))}</h4><ul>
        <li><a href="tickets.html">${esc(u("seasonTickets"))}</a></li><li><a href="support.html">${esc(u("nav.donate"))}</a></li>
        <li><a href="store.html">${esc(u("tab.store"))}</a></li><li><a href="sponsors.html">${esc(u("tab.sponsors"))}</a></li><li><a href="contact.html">${esc(u("tab.contact"))}</a></li></ul></div>
      <div><h4>${esc(u("footContact"))}</h4><address>${contact}</address></div>
    </div>
    <div class="foot-bottom">
      <span>© ${year} ${esc(u("clubFull"))}. ${esc(u("rights"))}</span>
      <span>${esc(u("dataSource"))} <a href="https://www.epsana.gr" target="_blank" rel="noopener">epsana.gr</a> · <a href="privacy.html">${esc(u("nav.privacy"))}</a></span>
    </div>
  </div>
</footer>`;
  }

  /* ---------------------------------------------------- match centre data */
  function analyse(data) {
    if (!data) return null;
    const club = data.club;
    const ours = data.fixtures.filter(f => f.home === club || f.away === club)
      .map(f => ({ ...f, d: parseDate(f.date), home_: f.home === club }))
      .sort((a, b) => a.round - b.round);
    const played = ours.filter(f => f.hs != null && f.as != null);
    const upcoming = ours.filter(f => f.hs == null);
    const outcome = f => { const us = f.home_ ? f.hs : f.as, them = f.home_ ? f.as : f.hs; return us > them ? "w" : us < them ? "l" : "d"; };
    played.forEach(f => { f.res = outcome(f); });
    const row = data.standings.find(r => r.team === club);
    return { data, club, ours, played, upcoming, last: played[played.length - 1] || null, next: upcoming[0] || null, row, form: played.slice(-5) };
  }

  const logoOf = raw => (TEAMS[raw] && TEAMS[raw].logo) || (raw === (window._aokClub || "ΑΟ ΚΟΡΩΠΙ") ? "assets/img/crest-128.png" : "");
  // Club logo (or short-name badge when there's no logo). size: "lg" for match boxes, "sm" for lists.
  const badge = (raw, size = "lg") => {
    const logo = logoOf(raw);
    return logo
      ? `<span class="badge logo ${size}" aria-hidden="true"><img src="${esc(logo)}" alt="" loading="lazy" width="48" height="48"></span>`
      : `<span class="badge ${size}" aria-hidden="true">${esc(teamShort(raw))}</span>`;
  };
  const resTag = r => `<span class="result-tag ${r}">${esc(u("res." + r))}</span>`;
  const formHTML = list => `<div class="form" aria-label="${esc(u("formAria"))}">${list.map(f => `<span class="${f.res}" title="${esc(teamName(f.home))} ${f.hs}-${f.as} ${esc(teamName(f.away))}">${esc(u("res1." + f.res))}</span>`).join("")}</div>`;

  function icsFor(f) {
    const d = f.d; if (!d) return "";
    const p = n => String(n).padStart(2, "0");
    const local = x => `${x.getUTCFullYear()}${p(x.getUTCMonth() + 1)}${p(x.getUTCDate())}T${p(x.getUTCHours())}${p(x.getUTCMinutes())}00Z`;
    const end = new Date(d.getTime() + 105 * 60000);
    const title = `${teamName(f.home)} - ${teamName(f.away)}`;
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AOK//Fixtures//EL", "BEGIN:VEVENT",
      `UID:aok-${f.round}-${local(d)}@aokoropi`, `DTSTAMP:${local(new Date())}`,
      `DTSTART:${local(d)}`, `DTEND:${local(end)}`,
      `SUMMARY:${title}`, `LOCATION:${venueName(f.venue)}`, `DESCRIPTION:${ordinal(f.round)} ${u("round")}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    return "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
  }

  let cdTimer;
  function startCountdown(el, d) {
    clearInterval(cdTimer);
    if (!el || !d) return;
    const tick = () => {
      // fixtures are in Greek local time; Europe/Athens offset is handled by the browser for viewers in Greece
      let ms = d - new Date();
      if (ms <= 0) { el.innerHTML = `<div style="min-width:auto;padding:6px 14px"><b>${esc(u("kickedOff"))}</b></div>`; clearInterval(cdTimer); return; }
      const dd = Math.floor(ms / 864e5), hh = Math.floor(ms / 36e5) % 24, mm = Math.floor(ms / 6e4) % 60;
      el.innerHTML = [[dd, "days"], [hh, "hours"], [mm, "mins"]].map(([n, k]) => `<div><b class="num">${n}</b><small>${esc(u(k))}</small></div>`).join("");
    };
    tick(); cdTimer = setInterval(tick, 30000);
  }

  function renderMatchday(a) {
    const host = $("#matchday"); if (!host) return;
    const band = host.closest(".matchday");
    if (!a) { if (band) band.hidden = true; return; }
    if (band) band.hidden = false;
    const { last, next, row, form, data } = a;
    window._aokClub = a.club;
    const lastHTML = last ? `
      <div class="md-label"><span>${esc(u("lastResult"))}</span>${resTag(last.res)}</div>
      <div class="fx">
        <div class="fx-team">${badge(last.home)}<span>${esc(teamName(last.home))}</span></div>
        <div class="fx-score num">${last.hs}<span class="sep">–</span>${last.as}</div>
        <div class="fx-team">${badge(last.away)}<span>${esc(teamName(last.away))}</span></div>
      </div>
      <p class="md-meta">${esc(fmtDate(last.d, { day: "numeric", month: "long" }))} · ${esc(ordinal(last.round))} ${esc(u("round"))}</p>` : `<p class="md-empty">${esc(u("noResults"))}</p>`;
    const nextHTML = next ? `
      <div class="md-label"><span>${esc(u("nextMatch"))}</span><span>${esc(ordinal(next.round))} ${esc(u("round"))}</span></div>
      <div class="fx">
        <div class="fx-team">${badge(next.home)}<span>${esc(teamName(next.home))}</span></div>
        <div class="fx-vs">${next.d ? `<b class="num">${esc(fmtTime(next.d))}</b><small>${esc(fmtDate(next.d, { weekday: "short", day: "numeric", month: "short" }))}</small>` : `<b>–</b><small>${esc(u("tbc"))}</small>`}</div>
        <div class="fx-team">${badge(next.away)}<span>${esc(teamName(next.away))}</span></div>
      </div>
      <p class="md-meta">${next.venue ? esc(venueName(next.venue)) : esc(u("venueTbc"))}${next.home_ ? "" : " · " + esc(u("away"))}</p>
      ${next.d ? `<div class="countdown" id="countdown" aria-live="off"></div>` : ""}
      <div class="md-actions">
        ${next.d ? `<a class="btn btn-sm btn-line dark" href="${icsFor(next)}" download="aok-match.ics">${ICON.cal}${esc(u("addCal"))}</a>` : ""}
        ${next.home_ ? `<a class="btn btn-sm btn-navy" href="tickets.html">${ICON.ticket}${esc(u("tickets"))}</a>` : ""}
      </div>` : `<p class="md-empty">${esc(u("noFixtures"))}</p>`;
    const posHTML = row ? `
      <div class="md-label"><span>${esc(u("position"))}</span>${navLink("@standings", "table")}</div>
      <div class="pos-big num">${row.pos}<sup>${lang === "en" ? ordinal(row.pos).replace(/^\d+/, "") : "η"}</sup></div>
      <p class="pos-pts">${esc(u("ptsFrom", { pts: row.pts, p: row.p }))}</p>
      ${form.length ? formHTML(form) : ""}
      <p class="md-meta" style="text-align:left">${esc(data.division ? (lang === "en" ? u("divisionEn") : data.division.replace(/^([Α-Ω]) /, "$1΄ ") + " ΕΠΣΑΝΑ") : "")} · ${esc(data.season || "")}</p>` : `<p class="md-empty">${navLink("@standings", "fullTable", "link")}</p>`;
    host.innerHTML = `<div class="md-cell md-last">${lastHTML}</div><div class="md-cell md-next">${nextHTML}</div><div class="md-cell md-pos">${posHTML}</div>`;
    if (next) startCountdown($("#countdown"), next.d);
  }

  function standingsHTML(a, compact) {
    const rows = a.data.standings;
    return `<div class="table-wrap"><table class="standings">
      <caption class="sr-only">${esc(u("table"))}</caption>
      <thead><tr><th class="pos">#</th><th class="team">${esc(u("th.team"))}</th><th title="${esc(u("th.pFull"))}">${esc(u("th.p"))}</th>
      ${compact ? "" : `<th class="hide-sm">${esc(u("th.w"))}</th><th class="hide-sm">${esc(u("th.d"))}</th><th class="hide-sm">${esc(u("th.l"))}</th><th class="hide-sm">${esc(u("th.goals"))}</th>`}
      <th title="${esc(u("th.gdFull"))}">${esc(u("th.gd"))}</th><th class="pts">${esc(u("th.pts"))}</th></tr></thead>
      <tbody>${rows.map(r => {
        const gd = (r.gf ?? 0) - (r.ga ?? 0);
        return `<tr class="${r.team === a.club ? "us" : ""}"><td class="pos num">${r.pos}</td><td class="team"><span class="team-cell">${badge(r.team, "sm")}<span>${esc(teamName(r.team))}</span></span></td><td class="num">${r.p ?? ""}</td>
        ${compact ? "" : `<td class="hide-sm num">${r.w ?? ""}</td><td class="hide-sm num">${r.d ?? ""}</td><td class="hide-sm num">${r.l ?? ""}</td><td class="hide-sm num">${r.gf ?? ""}:${r.ga ?? ""}</td>`}
        <td class="num">${gd > 0 ? "+" + gd : gd}</td><td class="pts num">${r.pts}</td></tr>`;
      }).join("")}</tbody></table></div>`;
  }

  function fixtureLi(f, club) {
    const isUs = t => t === club;
    const dateBlock = f.d ? `<b class="num">${esc(fmtDate(f.d, { day: "2-digit" }))}</b><small>${esc(fmtDate(f.d, { month: "short" }))}</small>` : `<b>${f.round}</b><small>${esc(u("roundShort"))}</small>`;
    const score = f.hs != null ? `<span class="num">${f.hs}–${f.as}</span>${f.res ? resTag(f.res) : ""}` : (f.d ? `<span class="num">${esc(fmtTime(f.d))}</span>` : `<span title="${esc(u("tbc"))}" style="color:var(--muted)">–</span>`);
    const sub = [f.d ? fmtDate(f.d, { weekday: "long" }) : "", f.venue ? venueName(f.venue) : ""].filter(Boolean).join(" · ");
    return `<li><div class="fl-date">${dateBlock}</div>
      <div class="fl-teams">${club ? `<span class="ha" title="${esc(u(f.home_ ? "home" : "away"))}">${esc(u(f.home_ ? "homeShort" : "awayShort"))}</span>` : ""}<span class="fl-match"><span class="fl-side${isUs(f.home) ? " us" : ""}">${badge(f.home, "sm")}${esc(teamName(f.home))}</span><span class="fl-dash">–</span><span class="fl-side${isUs(f.away) ? " us" : ""}">${badge(f.away, "sm")}${esc(teamName(f.away))}</span></span>${sub ? `<small>${esc(sub)}</small>` : ""}</div>
      <div class="fl-score">${score}</div></li>`;
  }

  const stamp = a => a.data.updated ? `<p class="data-stamp">${esc(u("updatedAt", { when: fmtDate(new Date(a.data.updated), { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hour12: false }) }))} · <a class="link" href="${esc(CFG.epsanaStandings || a.data.links.standings)}" target="_blank" rel="noopener">epsana.gr</a></p>` : "";

  function renderHomeCentre(a) {
    const host = $("#home-centre"); if (!host) return;
    if (!a) { host.innerHTML = ""; return; }
    const recent = a.played.slice(-2), coming = a.upcoming.slice(0, 3);
    host.innerHTML = `<div class="mc-grid">
      <div>${standingsHTML(a, true)}${stamp(a)}</div>
      <div><h3 style="margin-bottom:14px">${esc(u("fixturesResults"))}</h3><ul class="fixture-list">${[...recent, ...coming].map(f => fixtureLi(f, a.club)).join("")}</ul>
      <p style="margin-top:20px;display:flex;flex-wrap:wrap;gap:20px">${navLink("@results", "allResults", "link")}${navLink("@standings", "fullTable", "link")}</p></div></div>`;
  }

  function renderMatchesPage(a) {
    if (!$("#mp-standings")) return;
    if (!a) { $("#mp-standings").innerHTML = ""; return; }
    $("#mp-standings").innerHTML = standingsHTML(a, false) + `<p class="table-note">${esc(u("tableNote"))}</p>` + stamp(a);
    $("#mp-ours").innerHTML = `<ul class="fixture-list">${a.ours.map(f => fixtureLi(f, a.club)).join("")}</ul>`;
    // every matchday
    const rounds = [...new Set(a.data.fixtures.map(f => f.round))].sort((x, y) => x - y);
    const sel = $("#round-select");
    const defaultRound = a.next ? a.next.round : rounds[rounds.length - 1];
    const cur = sel.value ? +sel.value : defaultRound;
    sel.innerHTML = rounds.map(r => `<option value="${r}"${r === cur ? " selected" : ""}>${esc(ordinal(r))} ${esc(u("round"))}</option>`).join("");
    const drawRound = r => {
      const list = a.data.fixtures.filter(f => f.round === r).map(f => ({ ...f, d: parseDate(f.date) }));
      $("#mp-round").innerHTML = `<ul class="fixture-list">${list.map(f => fixtureLi(f, null)).join("")}</ul>`;
    };
    sel.onchange = () => drawRound(+sel.value);
    drawRound(cur);
    const ahead = $("#mp-summary");
    if (ahead && a.row) {
      const r = a.row;
      ahead.innerHTML = `<div class="facts" style="border-color:var(--line-dark)">
        <div><b class="num">${ordinal(r.pos)}</b><span>${esc(u("position"))}</span></div>
        <div><b class="num">${r.pts}</b><span>${esc(u("th.ptsFull"))}</span></div>
        <div><b class="num">${r.w}-${r.d}-${r.l}</b><span>${esc(u("wdl"))}</span></div>
        <div><b class="num">${r.gf}:${r.ga}</b><span>${esc(u("th.goals"))}</span></div></div>`;
    }
  }

  /* ----------------------------------------------------------------- news */
  const CATS = ["match", "club", "academy"];
  const storyImg = (n, a) => {
    if (n.image) return `<img src="${esc(n.image)}" alt="${esc(L(n.imageAlt) || "")}" loading="lazy">`;
    if (n.cover) {
      const c = n.cover, side = t => t ? `<span class="cover-logo">${badge(t, "lg")}</span>` : "";
      return `<div class="cover${c.home ? " has-logos" : ""}"><div class="cover-row">${side(c.home)}<b class="num">${esc(c.big)}</b>${side(c.away)}</div><small>${esc(L(c.small))}</small></div>`;
    }
    return `<img src="assets/img/stadium-800.webp" alt="" loading="lazy">`;
  };
  const storyHTML = (n, cls = "") => `<a class="story ${cls}" href="article.html?id=${encodeURIComponent(n.id)}">
      <div class="story-img">${storyImg(n)}</div>
      <div><div class="story-meta"><span class="story-cat">${esc(u("cat." + n.category))}</span><time datetime="${esc(n.date)}">${esc(fmtDate(new Date(n.date), { day: "numeric", month: "long", year: "numeric" }))}</time></div>
      <h3>${esc(L(n.title))}</h3>${cls === "lead" ? `<p>${esc(L(n.summary))}</p>` : ""}</div></a>`;
  // A short result story for every AOK match EPSANA has a score for, unless a
  // hand-written article in data/news.json already covers that round ("round": n).
  function autoResults(ep, manual) {
    const an = analyse(ep);
    if (!an) return [];
    const covered = new Set(manual.filter(m => m.round).map(m => +m.round));
    const latest = an.last;
    const both = (el, en) => ({ el, en });
    return an.played.filter(f => !covered.has(f.round) && f.date).map(f => {
      const us = f.home_ ? f.hs : f.as, them = f.home_ ? f.as : f.hs;
      const opp = f.home_ ? f.away : f.home;
      const nm = (raw, l) => { const t = TEAMS[raw]; return t ? t[l] : (l === "en" ? translit(raw) : greekTitle(raw)); };
      const score = `${f.hs}–${f.as}`;
      const title = l => `${nm(f.home, l)} – ${nm(f.away, l)} ${score}`;
      const resEl = { w: "Νίκη", d: "Ισοπαλία", l: "Ήττα" }[f.res], resEn = { w: "Win", d: "Draw", l: "Defeat" }[f.res];
      const whereEl = f.home_ ? "εντός έδρας" : "εκτός έδρας", whereEn = f.home_ ? "at home" : "away";
      const dayEl = new Intl.DateTimeFormat("el-GR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(f.d);
      const wd = dayEl.split(" ")[0];
      const dayAccEl = (/^(Κυριακή|Δευτέρα|Τρίτη|Τετάρτη|Πέμπτη|Παρασκευή)/.test(wd) ? "την " : "το ") + dayEl.replace(/,/g, "");
      const dayEn = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(f.d);
      const venueEl = f.venue ? (VENUES[f.venue] ? VENUES[f.venue].el : "γήπεδο " + f.venue) : "", venueEn = f.venue ? (VENUES[f.venue] ? VENUES[f.venue].en : "the " + translit(f.venue) + " ground") : "";
      let tableEl = "", tableEn = "";
      if (latest && f.round === latest.round && an.row) {
        tableEl = `\n\nΜετά από ${an.row.p} αγώνες, η ομάδα βρίσκεται στην ${an.row.pos}η θέση της βαθμολογίας με ${an.row.pts} βαθμούς.`;
        const o = (n => { const t = n % 100, d = n % 10; return n + (t >= 11 && t <= 13 ? "th" : d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : "th"); })(an.row.pos);
        tableEn = `\n\nAfter ${an.row.p} matches, the team is ${o} in the table with ${an.row.pts} points.`;
      }
      return {
        id: "result-" + f.round, auto: true, round: f.round, date: f.date.slice(0, 10), category: "match",
        cover: { home: f.home, away: f.away, big: score, small: both(`${resEl} · ${f.round}η αγωνιστική`, `${resEn} · Matchday ${f.round}`) },
        title: both(title("el"), title("en")),
        summary: both(`${resEl} ${whereEl} στην ${f.round}η αγωνιστική της Β΄ Κατηγορίας ΕΠΣΑΝΑ.`, `${resEn} ${whereEn} on matchday ${f.round} of the EPSANA Second Division.`),
        body: both(
          `Ο αγώνας ${nm(f.home, "el")} – ${nm(f.away, "el")}, για την ${f.round}η αγωνιστική της Β΄ Κατηγορίας ΕΠΣΑΝΑ, έληξε ${score}${{ w: " με νίκη της ομάδας μας", d: " ισόπαλος", l: "" }[f.res]}. Διεξήχθη ${dayAccEl}${venueEl ? " στο " + venueEl : ""}.${tableEl}`,
          `${nm(f.home, "en")} – ${nm(f.away, "en")}, on matchday ${f.round} of the EPSANA Second Division, finished ${score}${{ w: ", a win for AO Koropiou", d: ", a draw", l: "" }[f.res]}. It was played on ${dayEn}${venueEn ? " at " + venueEn : ""}.${tableEn}`)
      };
    });
  }
  const sortedNews = list => (list || []).slice().sort((a, b) => b.date.localeCompare(a.date));

  async function renderNews() {
    const home = $("#home-news"), all = $("#news-list"), art = $("#article");
    if (!home && !all && !art) return;
    const [data, ep] = await Promise.all([load("data/news.json"), load("data/epsana.json")]);
    const manual = (data && data.articles) || [];
    const list = sortedNews(manual.concat(autoResults(ep, manual)));
    if (home) {
      if (!list.length) { home.innerHTML = `<p>${esc(u("noNews"))}</p>`; }
      else home.innerHTML = `<div class="news-grid">${storyHTML(list[0], "lead")}<div class="news-side">${list.slice(1, 4).map(n => storyHTML(n)).join("")}</div></div>`;
    }
    if (all) {
      const f = $("#news-filters");
      const active = new URLSearchParams(location.search).get("cat");
      f.innerHTML = [["", "allCats"], ...CATS.map(c => [c, "cat." + c])].map(([c, k]) => `<button class="chip" type="button" data-cat="${c}" aria-pressed="${(active || "") === c}">${esc(u(k))}</button>`).join("");
      const draw = cat => {
        const h = $("#news-title"), lead = $("#news-lead"), cta = $("#news-epsana");
        if (h) h.textContent = cat ? u("cat." + cat) : u("tab.news");
        if (lead) lead.textContent = cat ? u("catLead." + cat) : u("newsLead");
        document.title = (cat ? u("cat." + cat) : u("tab.news")) + " · " + u("clubName");
        if (cta) {
          cta.hidden = cat !== "match";
          cta.innerHTML = `<div><b>${esc(u("epsanaCtaH"))}</b><span>${esc(u("epsanaCtaP"))}</span></div><a class="btn btn-navy" href="${esc(CFG.epsanaResults)}" target="_blank" rel="noopener">${esc(u("allResults"))}${ICON.ext}<span class="sr-only"> ${esc(u("newTab"))}</span></a>`;
        }
        const items = list.filter(n => !cat || n.category === cat);
        all.innerHTML = items.length ? items.map(n => storyHTML(n)).join("") : `<p>${esc(u("noNews"))}</p>`;
      };
      f.onclick = e => {
        const b = e.target.closest(".chip"); if (!b) return;
        $$(".chip", f).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
        history.replaceState(null, "", b.dataset.cat ? "?cat=" + b.dataset.cat : "news.html");
        draw(b.dataset.cat);
      };
      draw(active || "");
    }
    if (art) {
      const id = new URLSearchParams(location.search).get("id");
      const n = list.find(x => x.id === id);
      if (!n) { art.innerHTML = `<div class="wrap narrow section"><h1>${esc(u("notFound"))}</h1><p><a class="link" href="news.html">${esc(u("nav.allNews"))}</a></p></div>`; return; }
      document.title = L(n.title) + " · " + u("clubName");
      const body = (L(n.body) || "").split(/\n\n+/).map(p => p.startsWith("## ") ? `<h2>${esc(p.slice(3))}</h2>` : `<p>${esc(p)}</p>`).join("");
      const url = location.href;
      art.innerHTML = `
        <section class="page-head"><div class="wrap narrow">
          <nav class="crumbs" aria-label="breadcrumb"><a href="news.html">${esc(u("tab.news"))}</a><span aria-hidden="true">/</span><span>${esc(u("cat." + n.category))}</span></nav>
          <h1 style="font-size:var(--s4)">${esc(L(n.title))}</h1>
          <p><time datetime="${esc(n.date)}">${esc(fmtDate(new Date(n.date), { weekday: "long", day: "numeric", month: "long", year: "numeric" }))}</time></p>
        </div></section>
        <div class="section tight"><div class="wrap narrow">
          ${n.image || n.cover ? `<div class="article-hero" style="margin-top:0">${storyImg(n)}</div>` : ""}
          <div class="article-body">${body}</div>
          <div class="share"><b>${esc(u("share"))}</b>
            <a class="btn btn-sm btn-line dark" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener">Facebook</a>
            <a class="btn btn-sm btn-line dark" href="https://wa.me/?text=${encodeURIComponent(L(n.title) + " " + url)}" target="_blank" rel="noopener">WhatsApp</a>
            <button class="btn btn-sm btn-line dark" type="button" data-copy="${esc(url)}">${esc(u("copyLink"))}</button>
          </div>
          <p style="margin-top:32px"><a class="link" href="news.html">${esc(u("backNews"))}</a></p>
        </div></div>`;
    }
  }

  /* --------------------------------------------------------------- squad */
  const POS = [["gk", "pos.gk"], ["df", "pos.df"], ["mf", "pos.mf"], ["fw", "pos.fw"]];
  const ageOf = dob => {
    if (!dob) return null;
    const b = new Date(dob), n = new Date();
    let a = n.getFullYear() - b.getFullYear();
    if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
    return a;
  };
  const playerHTML = (p, linked) => {
    const age = ageOf(p.dob);
    const tag = linked ? "a" : "article";
    return `<${tag} class="player"${linked ? ` href="team.html?pos=${esc(p.position)}"` : ""}>
      <div class="player-photo"><img src="${esc(p.photo || "assets/img/players/placeholder.svg")}" alt="${esc(L(p.first) + " " + L(p.last))}" loading="lazy" width="300" height="375">${p.number ? `<span class="player-no num" aria-hidden="true">${p.number}</span>` : ""}${p.captain ? `<span class="captain-tag">${esc(u("captain"))}</span>` : ""}</div>
      <h3><span class="last">${esc(L(p.last))}</span><span class="first">${esc(L(p.first))}</span></h3>
      <div class="player-facts">${age != null ? `<span>${esc(u("age"))} <b class="num">${age}</b></span>` : ""}${p.number ? `<span>${esc(u("shirt"))} <b class="num">${p.number}</b></span>` : ""}</div>
    </${tag}>`;
  };

  async function renderSquad() {
    const host = $("#squad"), row = $("#home-players");
    if (!host && !row) return;
    const data = await load("data/players.json");
    const players = (data && data.players) || [];
    const example = data && data.example;
    if (row) {
      const pick = players.slice().sort((a, b) => (a.number || 99) - (b.number || 99)).slice(0, 10);
      row.innerHTML = players.length ? pick.map(p => playerHTML(p, true)).join("") : `<p>${esc(u("squadSoon"))}</p>`;
    }
    if (host) {
      // Each position is its own view: team.html?pos=gk|df|mf|fw|staff (no ?pos = whole squad)
      const views = [["", "allPlayers"], ...POS, ["staff", "nav.staff"]];
      const legacy = { "#gk": "gk", "#df": "df", "#mf": "mf", "#fw": "fw", "#staff": "staff" }[location.hash];
      let pos = new URLSearchParams(location.search).get("pos") || legacy || "";
      if (!views.some(v => v[0] === pos)) pos = "";
      const staffList = (data && data.staff) || [];
      const draw = () => {
        const chips = $("#squad-filters");
        if (chips) chips.innerHTML = views.map(([id, key]) => `<a class="chip" href="team.html${id ? "?pos=" + id : ""}" data-pos="${id}" aria-current="${id === pos ? "page" : "false"}">${esc(u(key))}</a>`).join("");
        const groups = pos === "staff" ? [] : POS.filter(([id]) => !pos || id === pos);
        let html = example && pos !== "staff" ? `<div class="notice">${ICON.info}<span>${esc(u("exampleSquad"))}</span></div>` : "";
        if (!data) html += `<p>${esc(u("squadUnavailable"))}</p>`;
        html += groups.map(([id, key]) => {
          const list = players.filter(p => p.position === id).sort((a, b) => (a.number || 99) - (b.number || 99));
          if (!list.length) return pos ? `<p>${esc(u("squadSoon"))}</p>` : "";
          return `<section class="squad-group" id="${id}">${pos ? "" : `<h2>${esc(u(key))}<small>${list.length}</small></h2>`}<div class="players">${list.map(p => playerHTML(p)).join("")}</div></section>`;
        }).join("");
        if (!pos || pos === "staff") html += `<section class="squad-group" id="staff">${pos ? "" : `<h2>${esc(u("nav.staff"))}</h2>`}<ul class="staff">${staffList.map(x => `<li><b>${esc(L(x.name))}</b><span>${esc(L(x.role))}</span></li>`).join("")}</ul></section>`;
        host.innerHTML = html;
        const h = $("#team-title");
        if (h) h.textContent = pos ? u(views.find(v => v[0] === pos)[1]) : u("tab.teamTitle");
      };
      draw();
      const chips = $("#squad-filters");
      if (chips && !chips._bound) {
        chips._bound = true;
        chips.addEventListener("click", e => {
          const a = e.target.closest(".chip"); if (!a) return;
          e.preventDefault(); pos = a.dataset.pos;
          history.pushState(null, "", a.getAttribute("href")); draw();
        });
        window.addEventListener("popstate", () => { pos = new URLSearchParams(location.search).get("pos") || ""; draw(); });
      }
    }
  }

  /* ------------------------------------------------------------- sponsors */
  async function renderSponsors() {
    const hosts = $$("[data-sponsors]"); if (!hosts.length) return;
    const data = await load("data/sponsors.json");
    const list = (data && data.sponsors) || [];
    hosts.forEach(h => {
      const slots = Math.max(0, (+h.dataset.sponsors || 6) - list.length);
      h.innerHTML = list.map(s => `<a href="${esc(s.url || "#")}" target="_blank" rel="noopener" title="${esc(s.name)}"><img src="${esc(s.logo)}" alt="${esc(s.name)}" loading="lazy"></a>`).join("")
        + Array.from({ length: slots }, () => `<a class="sponsor-slot" href="sponsors.html#become">${esc(u("yourLogo"))}</a>`).join("");
    });
  }

  /* --------------------------------------------------- tickets & support */
  function renderTickets() {
    const host = $("#plans"); if (!host) return;
    const url = CFG.seasonTicketUrl;
    host.innerHTML = (CFG.seasonTickets || []).map(t => `
      <div class="plan${t.featured ? " featured" : ""}">
        <h3>${esc(L(t))}</h3>
        <div class="price num">${t.price ? "€" + t.price : esc(u("free"))}${t.price ? `<small> / ${esc(u("season"))}</small>` : ""}</div>
        <p>${esc(L(t.desc))}</p>
        ${t.price ? (url ? `<a class="btn ${t.featured ? "btn-white" : "btn-navy"}" href="${esc(url)}" target="_blank" rel="noopener">${esc(u("buyNow"))}</a>` : `<a class="btn ${t.featured ? "btn-white" : "btn-navy"}" href="#ticket-form" data-topic="${esc(t.id)}">${esc(u("requestTicket"))}</a>`) : ""}
      </div>`).join("");
    const note = $("#tickets-note");
    if (note) note.hidden = !!url;
    const sel = $("#t-package");
    if (sel) {
      const v = sel.value;
      sel.innerHTML = (CFG.seasonTickets || []).filter(t => t.price).map(t => `<option value="${esc(t.id)}">${esc(L(t))} – €${t.price}</option>`).join("");
      if (v) sel.value = v;
    }
    const tf = $("#ticket-form-wrap"); if (tf) tf.hidden = !!url;
    const pn = $("#prices-note");
    if (pn) pn.hidden = !!CFG.ticketPricesConfirmed;
  }

  async function renderStore() {
    const host = $("#products"); if (!host) return;
    const data = await load("data/store.json");
    const items = (data && data.products) || [];
    const cat = new URLSearchParams(location.search).get("cat") || "";
    const chips = $("#store-filters");
    if (chips) chips.innerHTML = [["", "allCats"], ["kit", "store.cat.kit"], ["fan", "store.cat.fan"]].map(([c, k]) => `<a class="chip" href="store.html${c ? "?cat=" + c : ""}" aria-current="${c === cat ? "page" : "false"}">${esc(u(k))}</a>`).join("");
    const list = items.filter(p => !cat || p.category === cat);
    const ext = CFG.storeUrl;
    host.innerHTML = (data && data.example ? `<div class="notice" style="grid-column:1/-1">${ICON.info}<span>${esc(u("exampleStore"))}</span></div>` : "") + list.map(p => `
      <article class="product">
        <div class="product-img"><img src="${esc(p.image || "assets/img/store/placeholder.svg")}" alt="" loading="lazy" width="600" height="600">${p.badge ? `<span class="product-badge">${esc(L(p.badge))}</span>` : ""}</div>
        <h3>${esc(L(p.name))}</h3>
        <p class="product-meta"><span class="num">${p.price ? "€" + p.price : esc(u("priceSoon"))}</span>${p.sizes ? `<span>${esc(p.sizes.join(" · "))}</span>` : ""}</p>
        ${ext ? `<a class="btn btn-sm btn-navy" href="${esc(ext)}" target="_blank" rel="noopener">${ICON.bag}${esc(u("buyNow"))}</a>` : `<a class="btn btn-sm btn-line dark" href="#order" data-topic="${esc(p.id)}">${ICON.bag}${esc(u("orderThis"))}</a>`}
      </article>`).join("");
    const sel = $("#o-product");
    if (sel && !sel.options.length) sel.innerHTML = items.map(p => `<option value="${esc(p.id)}">${esc(L(p.name))}${p.price ? " – €" + p.price : ""}</option>`).join("");
    else if (sel) [...sel.options].forEach((o, i) => { const p = items[i]; if (p) o.textContent = L(p.name) + (p.price ? " – €" + p.price : ""); });
    const of = $("#order"); if (of) of.hidden = !!ext;
  }

  function renderSupport() {
    const host = $("#bank"); if (!host) return;
    const b = CFG.bank || {};
    if (b.iban) {
      const rows = [["beneficiary", b.beneficiary], ["bankName", b.bankName], ["iban", b.iban], ["bic", b.bic], ["reference", u("refText")]].filter(r => r[1]);
      host.innerHTML = `<div class="bank">${rows.map(([k, v]) => `<div class="bank-row"><span>${esc(u("bank." + k))}</span><b>${esc(v)}</b>${k !== "bankName" ? `<button class="copy-btn" type="button" data-copy="${esc(v)}">${esc(u("copy"))}</button>` : "<i></i>"}</div>`).join("")}</div>`;
    } else {
      host.innerHTML = `<div class="notice">${ICON.info}<span>${esc(u("bankSoon"))}</span></div>`;
    }
    const card = $("#donate-card");
    if (card) { card.hidden = !CFG.donateUrl; if (CFG.donateUrl) card.querySelector("a").href = CFG.donateUrl; }
  }

  /* ---------------------------------------------------------------- forms */
  const AGE_GROUPS = [
    { max: 5, el: "Νηπιακό (4–5 ετών)", en: "Nursery (ages 4–5)" },
    { max: 7, el: "Προαγωνιστικό Κ8 (6–7 ετών)", en: "Under-8 (ages 6–7)" },
    { max: 9, el: "Κ10 (8–9 ετών)", en: "Under-10 (ages 8–9)" },
    { max: 11, el: "Κ12 (10–11 ετών)", en: "Under-12 (ages 10–11)" },
    { max: 13, el: "Κ14 (12–13 ετών)", en: "Under-14 (ages 12–13)" },
    { max: 15, el: "Κ16 (14–15 ετών)", en: "Under-16 (ages 14–15)" },
    { max: 17, el: "Κ18 (16–17 ετών)", en: "Under-18 (ages 16–17)" }
  ];
  const groupFor = dob => {
    if (!dob) return null;
    const by = new Date(dob).getFullYear(), now = new Date();
    const seasonStart = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    const ageInSeason = seasonStart + 1 - by; // age reached during the season's calendar year
    return AGE_GROUPS.find(g => ageInSeason <= g.max + 0.5 && ageInSeason >= 4) || null;
  };

  function renderAgeGroups() {
    const host = $("#age-groups"); if (!host) return;
    const now = new Date(); const s = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    host.innerHTML = AGE_GROUPS.map((g, i) => {
      const minAge = i === 0 ? 4 : AGE_GROUPS[i - 1].max + 1;
      const years = `${s + 1 - g.max}${g.max !== minAge ? "–" + (s + 1 - minAge) : ""}`;
      return `<li><b>${esc(L(g).split(" (")[0])}</b><span>${esc(u("bornIn", { years }))}</span></li>`;
    }).join("");
  }

  function bindForms() {
    $$("form[data-form]").forEach(form => {
      if (form._bound) return; form._bound = true;
      const dob = form.querySelector("[name='child_dob']");
      const out = form.querySelector("#age-group-out");
      if (dob && out) dob.addEventListener("change", () => {
        const g = groupFor(dob.value);
        out.hidden = !g; if (g) out.textContent = u("groupIs", { g: L(g) });
        const hidden = form.querySelector("[name='age_group']"); if (hidden) hidden.value = g ? g.el : "";
      });
      form.addEventListener("submit", async e => {
        e.preventDefault();
        const status = form.querySelector(".form-status");
        let ok = true;
        $$("[required]", form).forEach(f => {
          const bad = f.type === "checkbox" ? !f.checked : !f.value.trim() || (f.type === "email" && !/^\S+@\S+\.\S+$/.test(f.value));
          f.setAttribute("aria-invalid", String(bad));
          if (bad && ok) { f.focus(); ok = false; }
        });
        if (!ok) { status.className = "form-status bad"; status.textContent = u("fixFields"); return; }
        if (form.querySelector(".hp input") && form.querySelector(".hp input").value) return; // bot
        const to = form.dataset.to === "sales" ? (CFG.salesEmail || CFG.clubEmail) : CFG.clubEmail;
        if (!to) { status.className = "form-status bad"; status.textContent = u("formNotSetup"); return; }
        const btn = form.querySelector("[type=submit]"); btn.disabled = true;
        status.className = "form-status"; status.textContent = u("sending");
        const fd = new FormData(form); const payload = {};
        fd.forEach((v, k) => { if (k !== "_gotcha") payload[k] = v; });
        payload._subject = form.dataset.subject + (payload.child_name ? " – " + payload.child_name : payload.name ? " – " + payload.name : "");
        payload._template = "table";
        payload._language = lang;
        if (payload.email) payload._replyto = payload.email; else if (payload.parent_email) payload._replyto = payload.parent_email;
        try {
          const r = await fetch("https://formsubmit.co/ajax/" + encodeURIComponent(to), {
            method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload)
          });
          const j = await r.json().catch(() => ({}));
          if (!r.ok || j.success === "false" || j.success === false) throw new Error(j.message || r.status);
          form.reset(); if (out) out.hidden = true;
          status.className = "form-status ok"; status.textContent = u({ academy: "sentAcademy", tickets: "sentTickets", store: "sentStore" }[form.dataset.form] || "sent");
        } catch (err) {
          console.warn(err);
          status.className = "form-status bad"; status.innerHTML = esc(u("sendFailed")) + ` <a class="link" href="mailto:${esc(to)}">${esc(to)}</a>`;
        } finally { btn.disabled = false; }
      });
    });
    // pre-select the package / product when a card's button is used
    document.addEventListener("click", e => {
      const b = e.target.closest("[data-topic]");
      if (!b) return;
      const sel = $("#contact-topic") || $("#t-package") || $("#o-product");
      if (sel) { const opt = [...sel.options].find(o => o.value === b.dataset.topic || o.textContent === b.dataset.topic); if (opt) sel.value = opt.value; }
    });
  }

  /* ------------------------------------------------------------ contact */
  function renderContact() {
    const host = $("#contact-list"); if (!host) return;
    const items = [
      ["pin", u("addressLabel"), esc(L(CFG.address))],
      CFG.phone && ["phone", u("phoneLabel"), `<a href="tel:${esc(CFG.phone.replace(/\s/g, ""))}">${esc(CFG.phone)}</a>`],
      CFG.mobile && ["phone", u("mobileLabel"), `<a href="tel:${esc(CFG.mobile.replace(/\s/g, ""))}">${esc(CFG.mobile)}</a>`],
      CFG.clubEmail && ["mail", "Email", `<a href="mailto:${esc(CFG.clubEmail)}">${esc(CFG.clubEmail)}</a>`],
      CFG.officeHours && ["clock", u("hoursLabel"), esc(L(CFG.officeHours))]
    ].filter(Boolean);
    host.innerHTML = items.map(([i, l, v]) => `<li>${ICON[i]}<div><span>${esc(l)}</span>${v.startsWith("<a") ? v : `<b>${v}</b>`}</div></li>`).join("");
    const s = $("#contact-socials"); if (s) { s.innerHTML = socialsHTML(); s.hidden = !s.innerHTML; }
  }

  /* -------------------------------------------------------------- render */
  async function renderAll() {
    renderHeader();
    if (document.body.classList.contains("drawer-open")) {
      const b = $(".group-btn"); selectGroup(PAGE_GROUP[page] || "home");
    }
    renderFooter();
    applyStatic();
    renderContact();
    renderTickets();
    renderSupport();
    renderAgeGroups();
    bindForms();
    $$("[data-ext]").forEach(a => { const f = EXT[a.dataset.ext]; if (f) { a.href = f(); a.target = "_blank"; a.rel = "noopener"; } });
    $$(".js-star").forEach(s => { s.innerHTML = ICON.star; });
    const needsMatches = $("#matchday") || $("#home-centre") || $("#mp-standings");
    const jobs = [renderNews(), renderSquad(), renderSponsors(), renderStore()];
    if (needsMatches) jobs.push(load("data/epsana.json").then(d => {
      const a = analyse(d);
      if (a) window._aokClub = a.club;
      renderMatchday(a); renderHomeCentre(a); renderMatchesPage(a);
    }));
    await Promise.all(jobs);
  }

  bindChrome();
  renderAll();
  // refresh match data every 10 minutes while the page stays open
  if ($("#matchday") || $("#mp-standings")) setInterval(() => { delete cache["data/epsana.json"]; renderAll(); }, 600000);
})();
