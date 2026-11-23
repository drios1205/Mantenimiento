const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname);
const types = {'.svg':'image/svg+xml','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg'};
http.createServer((req,res) => {
 let file;
 try { file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname)); } catch { res.writeHead(400).end(); return; }
 if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
 if (file === root) file = path.join(root,'index.html');
 fs.readFile(file,(err,data) => { if(err) {res.writeHead(404).end(); return;} res.setHeader('Content-Type',types[path.extname(file)] || 'application/octet-stream'); res.end(data); });
}).listen(8000,'127.0.0.1',()=>console.log('http://127.0.0.1:8000'));
