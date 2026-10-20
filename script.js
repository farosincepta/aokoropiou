const toggle=document.querySelector('.menu-btn'),nav=document.querySelector('#nav');toggle?.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});
const locale=document.documentElement.lang||'el';const t=window.AOK_I18N||{};
const base=new URL(locale==='el'?'./':'../',document.currentScript?.src||location.href);
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register(new URL('sw.js',base)).catch(console.warn));}
let deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;});
function standalone(){return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}
const installButton=document.querySelector('#aok-install'),installInfo=document.querySelector('#aok-install-info');
installButton?.addEventListener('click',async()=>{if(standalone()){installInfo.textContent=t.installed;return;}if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;return;}installInfo.textContent=/iPad|iPhone|iPod/.test(navigator.userAgent)?t.ios:t.android;installInfo.hidden=false;});
const connection=document.querySelector('#aok-connection');function connectionState(){if(connection){connection.hidden=navigator.onLine;connection.textContent=t.offline;}}window.addEventListener('offline',connectionState);window.addEventListener('online',connectionState);connectionState();
