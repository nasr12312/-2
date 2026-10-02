import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'dist');
if(!fs.existsSync(path.join(root,'index.html'))){console.error('Build the app first: npm run build');process.exit(1)}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.woff2':'font/woff2','.woff':'font/woff','.svg':'image/svg+xml','.json':'application/json'};
http.createServer((req,res)=>{try{const url=new URL(req.url,'http://localhost');const requested=decodeURIComponent(url.pathname);const target=path.resolve(root,'.'+requested);if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}let file=fs.existsSync(target)&&fs.statSync(target).isFile()?target:path.join(root,'index.html');if(path.extname(requested)&&!fs.existsSync(target)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-cache');fs.createReadStream(file).pipe(res)}catch{res.writeHead(400);res.end('Bad request')}}).listen(4173,'127.0.0.1',()=>console.log('Gheras: http://127.0.0.1:4173'));
