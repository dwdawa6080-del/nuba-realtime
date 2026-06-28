const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 4000;
const GROQ_API_KEY = 'GROQ_KEY';

const MIME = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json'};

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}

  if(req.method==='POST' && req.url==='/api/generate'){
    let body='';
    req.on('data',chunk=>body+=chunk);
    req.on('end',()=>{
      const parsed=JSON.parse(body);
      const groqBody=JSON.stringify({model:'llama-3.3-70b-versatile',messages:[{role:'user',content:parsed.prompt}],max_tokens:4000});
      const options={hostname:'api.groq.com',path:'/openai/v1/chat/completions',method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+GROQ_API_KEY}};
      const apiReq=https.request(options,apiRes=>{
        let data='';
        apiRes.on('data',chunk=>data+=chunk);
        apiRes.on('end',()=>{res.writeHead(200,{'Content-Type':'application/json'});res.end(data);});
      });
      apiReq.on('error',err=>{res.writeHead(500);res.end(JSON.stringify({error:err.message}));});
      apiReq.write(groqBody);apiReq.end();
    });
    return;
  }

  let filePath=path.join(__dirname,'public',req.url==='/'?'index.html':req.url+(req.url.endsWith('/')?'index.html':'.html'));
  if(!fs.existsSync(filePath)){res.writeHead(404);res.end('404 Not Found');return;}
  const ext=path.extname(filePath);
  res.writeHead(200,{'Content-Type':MIME[ext]||'text/plain'});
  fs.createReadStream(filePath).pipe(res);
}).listen(PORT,()=>console.log('🚀 Server running on port 4000'));
