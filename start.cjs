const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'dist');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml'};
const server = http.createServer((req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);return res.end()}
 if(pathname==='/')pathname='/index.html';
 const file=path.resolve(root,'.'+pathname);
 if(!file.startsWith(root+path.sep)||!types[path.extname(file)]){res.writeHead(404);return res.end('Not found')}
 fs.stat(file,(error,stat)=>{if(error||!stat.isFile()){res.writeHead(404);return res.end('Not found')}
 res.setHeader('Content-Type',types[path.extname(file)]);res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');fs.createReadStream(file).pipe(res)});
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Mở http://127.0.0.1:5173 — server đã chạy.':e.message);process.exitCode=1});
server.listen(5173,'127.0.0.1',()=>console.log('An Nhiên 2.5D: http://127.0.0.1:5173'));
