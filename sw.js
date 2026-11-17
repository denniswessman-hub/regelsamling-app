const CACHE='regelsamling-2026-11-17-v4';
const ASSETS=['./','./index.html','./styles.css?v=2026-11-17.2','./app.mjs?v=2026-11-17.2','./core.mjs','./assets/regelsamling.json','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('regelsamling-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{const req=event.request;const url=new URL(req.url);if(req.method!=='GET'||url.origin!==self.location.origin)return;
if(req.mode==='navigate'){event.respondWith(fetch(req).then(res=>res.ok?res:caches.match('./index.html',{cacheName:CACHE})).catch(()=>caches.match('./index.html',{cacheName:CACHE})));return;}
event.respondWith(caches.match(req,{cacheName:CACHE}).then(hit=>hit||fetch(req)));
});
