import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL(`../${process.env.WEB_OUTPUT_DIR??'dist-web'}/`,import.meta.url);
const base=(process.env.EXPO_PUBLIC_BASE_URL??'').replace(/\/$/,'');
if(base&&!/^\/[a-zA-Z0-9_/-]+$/.test(base))throw new Error('Ruta base inválida.');
const url=path=>`${base}/${path}`;
await writeFile(new URL('manifest.webmanifest',root),JSON.stringify({id:url(''),name:'Match Roulette',short_name:'Match Roulette',lang:'es',start_url:url(''),scope:url(''),display:'standalone',background_color:'#0A1018',theme_color:'#0A1018',icons:[{src:url('icon-192.png'),sizes:'192x192',type:'image/png'},{src:url('icon-512.png'),sizes:'512x512',type:'image/png'}]}));
let html=await readFile(new URL('index.html',root),'utf8');
html=html.replace('<html lang="en">','<html lang="es">').replace('</head>',`<link rel="manifest" href="${url('manifest.webmanifest')}"><meta name="theme-color" content="#0A1018"></head>`);
html=html.replace('</body>',`<script>if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register(${JSON.stringify(url('sw.js'))},{scope:${JSON.stringify(url(''))}}).catch(console.error));}</script></body>`);
await writeFile(new URL('index.html',root),html);
await writeFile(new URL('404.html',root),html);
await writeFile(new URL('.nojekyll',root),'');
async function files(dir=root,prefix=''){const result=[];for(const entry of await readdir(dir,{withFileTypes:true})){if(entry.isDirectory())result.push(...await files(new URL(entry.name+'/',dir),prefix+entry.name+'/'));else if(entry.name!=='sw.js'&&!entry.name.endsWith('.map'))result.push(prefix+entry.name);}return result;}
const diskFiles=await files();const assets=diskFiles.map(url);
const hash=createHash('sha256').update(base);for(const file of diskFiles)hash.update(await readFile(new URL(file,root)));
const prefix='match-roulette-'+(base||'root').replace(/[^a-zA-Z0-9]/g,'_')+'-';
const cache=prefix+hash.digest('hex').slice(0,16);
await writeFile(new URL('sw.js',root),`
const CACHE=${JSON.stringify(cache)},PREFIX=${JSON.stringify(prefix)},ASSETS=${JSON.stringify(assets)},ROOT=${JSON.stringify(url(''))},SHELL=${JSON.stringify(url('index.html'))};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{const target=new URL(event.request.url);if(event.request.method!=='GET'||target.origin!==self.location.origin||!target.pathname.startsWith(ROOT))return;event.respondWith((async()=>{const cache=await caches.open(CACHE);if(event.request.mode==='navigate')return (await cache.match(SHELL))||fetch(event.request);return (await cache.match(event.request))||fetch(event.request);})());});
`);
console.log(`Web offline preparada: ${assets.length} archivos, ruta ${url('')}.`);
