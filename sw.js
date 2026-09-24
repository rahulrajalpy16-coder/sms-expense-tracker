const CACHE='sms-expense-v4-receipt-parser';
const APP=['./','./index.html','./styles.css','./db.js','./parser.js','./app.js','./manifest.webmanifest','./icons/sms-logo.png','./icons/icon-192.png','./icons/icon-512.png','./templates/SMS_Reimbursement_Voucher_Template.xlsx'];

self.addEventListener('install',e=>e.waitUntil(
  caches.open(CACHE).then(c=>c.addAll(APP)).then(()=>self.skipWaiting())
));

self.addEventListener('activate',e=>e.waitUntil(
  Promise.all([
    self.clients.claim(),
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k.startsWith('sms-expense')&&k!==CACHE).map(k=>caches.delete(k))
    ))
  ])
));

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin===location.origin){
    e.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      try{
        const fresh=await fetch(e.request,{cache:'no-store'});
        if(fresh.ok)await cache.put(e.request,fresh.clone());
        return fresh;
      }catch{
        return (await cache.match(e.request)) || (await cache.match('./index.html'));
      }
    })());
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c=>{
    const hit=await c.match(e.request);if(hit)return hit;
    const r=await fetch(e.request);
    if(r.ok||r.type==='opaque')await c.put(e.request,r.clone());
    return r;
  }));
});