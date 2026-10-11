const toggle=document.querySelector('.menu-btn');const nav=document.querySelector('#nav');toggle?.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});
// Progressive Web App registration (requires HTTPS or localhost).
if ("serviceWorker" in navigator) { window.addEventListener("load", () => { navigator.serviceWorker.register((document.documentElement.lang === "el" ? "" : "../") + "sw.js").catch(err => console.warn("PWA unavailable:", err)); }); }
