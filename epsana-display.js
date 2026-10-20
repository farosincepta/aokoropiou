(()=>{'use strict';
const lang=(document.documentElement.lang||'el').slice(0,2),root=lang==='el'?'':'../';
const words={el:['ΤΕΛΕΥΤΑΙΟΣ ΑΓΩΝΑΣ','ΕΠΟΜΕΝΟΣ ΑΓΩΝΑΣ','ΒΑΘΜΟΛΟΓΙΑ','ΑΓΩΝΙΣΤΙΚΗ','Αγώνας','Δεν έχει ανακοινωθεί','Επίσημη πηγή: ΕΠΣΑΝΑ','ΑΠΟΤΕΛΕΣΜΑΤΑ','Αναμένονται επίσημα δεδομένα','Ημερομηνία προς ανακοίνωση'],en:['LAST MATCH','NEXT MATCH','STANDINGS','ROUND','Match','Not announced','Official source: EPSANA','RESULTS','Official data pending','Date to be announced'],es:['ÚLTIMO PARTIDO','PRÓXIMO PARTIDO','CLASIFICACIÓN','JORNADA','Partido','Por anunciar','Fuente oficial: EPSANA','RESULTADOS','Datos oficiales pendientes','Fecha por anunciar'],it:['ULTIMA PARTITA','PROSSIMA PARTITA','CLASSIFICA','GIORNATA','Partita','Da annunciare','Fonte ufficiale: EPSANA','RISULTATI','Dati ufficiali in attesa','Data da annunciare'],de:['LETZTES SPIEL','NÄCHSTES SPIEL','TABELLE','SPIELTAG','Spiel','Noch nicht bekannt','Offizielle Quelle: EPSANA','ERGEBNISSE','Offizielle Daten ausstehend','Termin noch offen']}[lang]||[];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const greek=s=>/ΚΟΡΩΠ/i.test(s||'');
const formatDate=d=>{if(!d)return words[9];try{return new Intl.DateTimeFormat(lang,{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Athens'}).format(new Date(d+'T12:00:00Z'));}catch{return d}};
const team=s=>esc(s||'—');
const source='<a target="_blank" rel="noopener noreferrer" href="https://www.epsana.gr/results/display_ranking.php?league_id=749">'+words[6]+' ↗</a>';
const date=g=>g?.date?formatDate(g.date)+(g.time?' · '+esc(g.time):''):'—';
const score=g=>g?.score?.length===2?g.score.join(' – '):'VS';
const detail=g=>g?.detail_url?'<a target="_blank" rel="noopener noreferrer" href="'+esc(g.detail_url)+'">'+words[4]+' ↗</a>':'';
function card(g,title){return '<h3>'+title+'</h3><p>'+date(g)+'</p><div class="aok-live-versus"><strong>'+team(g?.home)+'</strong><b>'+score(g)+'</b><strong>'+team(g?.away)+'</strong></div><small>'+esc(g?.venue||words[5])+'</small><div>'+detail(g)+'</div>'}
function rank(rows){if(!rows?.length)return '<p>'+words[8]+'</p>'+source;let html='<div class="aok-ranking-scroll"><table class="aok-ranking-table"><tbody>';for(const row of rows){html+='<tr class="'+(row.some(greek)?'aok-highlight':'')+'">'+row.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>'}return html+'</tbody></table></div>'+source}
function fixture(g){return '<div class="fixture-row"><div class="fixture-date"><strong>'+esc(g.round||'—')+'</strong><small>'+words[3]+'</small></div><div class="fixture-teams"><strong>'+team(g.home)+'</strong><span>'+score(g)+'</span><strong>'+team(g.away)+'</strong></div><div class="fixture-meta">'+date(g)+'<br>'+esc(g.venue||'')+'</div>'+detail(g)+'</div>'}
async function run(){let d;try{let r=await fetch(root+'data/epsana.json?v='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error(r.status);d=await r.json();if(!Array.isArray(d.fixtures)||!d.fixtures.length)throw Error('No verified fixtures')}catch(e){console.warn('EPSANA:',e);return}
const cards=document.querySelectorAll('.match-center .match-card');if(cards[0])cards[0].innerHTML=card(d.last_match,words[0]);if(cards[1])cards[1].innerHTML=card(d.next_match,words[1]);if(cards[2])cards[2].innerHTML='<h3>'+words[2]+'</h3>'+rank(d.ranking_rows);
const list=document.querySelector('#programme .fixture-list');if(list)list.innerHTML=d.fixtures.map(fixture).join('');
const standings=document.querySelector('.standings-wide');if(standings)standings.innerHTML=rank(d.ranking_rows);
const results=document.querySelector('#results');if(results){const completed=d.fixtures.filter(g=>Array.isArray(g.score)).reverse();const head=results.querySelector('.squad-heading');results.innerHTML=(head?head.outerHTML:'<h3>'+words[7]+'</h3>')+(completed.length?'<div class="fixture-list">'+completed.map(fixture).join('')+'</div>':'<p>'+words[8]+'</p>')}
const old=document.getElementById('aok-epsana-auto');if(old)old.remove();
const ribbon=document.querySelector('.editorial-intro .info-ribbon');if(ribbon)ribbon.textContent=words[6];
const header=document.querySelector('#standings .squad-heading span');if(header)header.textContent=words[6];
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();