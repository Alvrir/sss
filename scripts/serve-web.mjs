import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('dist-web');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.ttf':'font/ttf','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let file=resolve(root,'.'+pathname);
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  try{if(!(await stat(file)).isFile())file=resolve(root,'index.html');}catch{if(extname(pathname)){res.writeHead(404);res.end();return;}file=resolve(root,'index.html');}
  res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream','Cache-Control':'no-cache'});res.end(await readFile(file));
 }catch{res.writeHead(500);res.end('No se pudo abrir la app. Ejecutá npm run build:web.');}
}).listen(4173,'127.0.0.1',()=>console.log('Match Roulette: http://localhost:4173'));
