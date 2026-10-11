const CACHE_NAME = 'aokoropiou-v9-20261010';
const PRECACHE = ["./academy.html", "./stadium.html", "./staff-02.html", "./player-15.html", "./index.html", "./article-academy.html", "./player-16.html", "./player-19.html", "./player-12.html", "./player-08.html", "./manifest.webmanifest", "./player-03.html", "./script.js", "./player-05.html", "./player-13.html", "./player-11.html", "./article-action.html", "./article-season.html", "./player-06.html", "./match-detail.html", "./staff-01.html", "./player-01.html", "./icon-192.png", "./article-history.html", "./matches.html", "./contact.html", "./staff-03.html", "./icon-512.png", "./player-04.html", "./player-18.html", "./player-17.html", "./player-09.html", "./sponsors.html", "./player-14.html", "./news.html", "./history.html", "./player-10.html", "./player-07.html", "./team.html", "./player-02.html", "./styles.css", "./es/academy.html", "./es/stadium.html", "./es/staff-02.html", "./es/player-15.html", "./es/index.html", "./es/article-academy.html", "./es/player-16.html", "./es/player-19.html", "./es/player-12.html", "./es/player-08.html", "./es/player-03.html", "./es/player-05.html", "./es/player-13.html", "./es/player-11.html", "./es/article-action.html", "./es/article-season.html", "./es/player-06.html", "./es/match-detail.html", "./es/staff-01.html", "./es/player-01.html", "./es/article-history.html", "./es/matches.html", "./es/contact.html", "./es/staff-03.html", "./es/player-04.html", "./es/player-18.html", "./es/player-17.html", "./es/player-09.html", "./es/sponsors.html", "./es/player-14.html", "./es/news.html", "./es/history.html", "./es/player-10.html", "./es/player-07.html", "./es/team.html", "./es/player-02.html", "./assets/news-3.jpg", "./assets/news-4.jpg", "./assets/stadium.jpg", "./assets/crest.png", "./assets/news-2.jpg", "./assets/flag-gr.svg", "./assets/flag-es.svg", "./assets/flag-en.svg", "./assets/news-1.jpg", "./en/academy.html", "./en/stadium.html", "./en/staff-02.html", "./en/player-15.html", "./en/index.html", "./en/article-academy.html", "./en/player-16.html", "./en/player-19.html", "./en/player-12.html", "./en/player-08.html", "./en/player-03.html", "./en/player-05.html", "./en/player-13.html", "./en/player-11.html", "./en/article-action.html", "./en/article-season.html", "./en/player-06.html", "./en/match-detail.html", "./en/staff-01.html", "./en/player-01.html", "./en/article-history.html", "./en/matches.html", "./en/contact.html", "./en/staff-03.html", "./en/player-04.html", "./en/player-18.html", "./en/player-17.html", "./en/player-09.html", "./en/sponsors.html", "./en/player-14.html", "./en/news.html", "./en/history.html", "./en/player-10.html", "./en/player-07.html", "./en/team.html", "./en/player-02.html"];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(request,copy)); }
      return response;
    }).catch(() => caches.match(request).then(cached => cached || caches.match('./index.html'))));
  } else {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(request,copy)); }
      return response;
    })));
  }
});
