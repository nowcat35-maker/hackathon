/* UniFit-S 서버: 웹사이트 보여주기 + 틸론 GPU 임베딩으로 AI 적합도 계산
   실행: node server/server.js   (Node 18 이상, 추가 설치 없음) */
const http=require('http'),fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..');

// .env 읽기 (키는 여기에만 둡니다)
try{for(const l of fs.readFileSync(path.join(ROOT,'.env'),'utf8').split(/\r?\n/)){
  const m=l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^["']|["']$/g,'')}}catch(e){}
const {TILON_API_URL,TILON_API_KEY,TILON_EMBED_MODEL}=process.env;
const PROVIDER=process.env.AI_PROVIDER_NAME||'틸론';
const PORT=process.env.PORT||3000;

// 공고 데이터(js/data.js)를 그대로 읽어옴
const ctx={window:{addEventListener(){}}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT,'js/data.js'),'utf8')+';this.ITEMS=ITEMS;',ctx);
const ITEMS=ctx.ITEMS;
const itemText=i=>['분류: '+i.cat,'공고명: '+i.title,'기관: '+i.org,'분야: '+i.field,'대상: '+i.target,'학년: '+i.grade,'지역: '+i.region,'지원내용: '+i.amount,'조건: '+(i.need||i.cond||'')].join('\n');
const profText=p=>['관심 분류: '+(p.interests||[]).join(', '),'관심 키워드: '+(p.keywords||[]).join(', '),'학교: '+(p.school||''),'학년: '+(p.grade||''),'전공: '+(p.major||''),'학점: '+(p.gpa||''),'지역: '+(p.region||'')].join('\n');

async function embed(texts){
  const out=[];for(let k=0;k<texts.length;k+=16)out.push(...await embedBatch(texts.slice(k,k+16)));return out;
}
async function embedBatch(texts){
  const r=await fetch(TILON_API_URL,{method:'POST',
    headers:{'Content-Type':'application/json',Authorization:'Bearer '+TILON_API_KEY},
    body:JSON.stringify({model:TILON_EMBED_MODEL,input:texts})});
  if(!r.ok)throw new Error('GPU API '+r.status+' '+(await r.text()).slice(0,200));
  const j=await r.json();
  const rows=j.data||j.embeddings||j;           // OpenAI 호환 형식 {data:[{embedding:[...]}]}
  return rows.map(x=>x.embedding||x);
}
const cos=(a,b)=>{let d=0,x=0,y=0;for(let k=0;k<a.length;k++){d+=a[k]*b[k];x+=a[k]*a[k];y+=b[k]*b[k]}return d/(Math.sqrt(x*y)||1)};

let itemVecs=null;                              // 공고 벡터는 한 번만 계산해서 보관
async function scores(profile){
  if(!TILON_API_URL||!TILON_API_KEY||!TILON_EMBED_MODEL)throw new Error('.env 설정이 비어 있어요');
  if(!itemVecs)itemVecs=await embed(ITEMS.map(itemText));
  const [pv]=await embed([profText(profile)]);
  const raw=ITEMS.map((_,k)=>cos(pv,itemVecs[k]));
  const lo=Math.min(...raw),hi=Math.max(...raw),out={};
  ITEMS.forEach((it,k)=>{out[it.id]=Math.round(45+54*((raw[k]-lo)/((hi-lo)||1)))});   // 45~99%로 보기 좋게 펼침
  return out;
}

const MIME={'.html':'text/html;charset=utf-8','.css':'text/css','.js':'text/javascript;charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{
  if(req.method==='POST'&&req.url==='/api/scores'){
    let b='';req.on('data',c=>{b+=c;if(b.length>1e5)req.destroy()});
    req.on('end',async()=>{
      try{const t0=Date.now();const out=await scores(JSON.parse(b||'{}'));res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true,scores:out,provider:PROVIDER,model:TILON_EMBED_MODEL,ms:Date.now()-t0}))}
      catch(e){console.error('[scores]',e.message);res.writeHead(502,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:false,error:e.message}))}
    });return;
  }
  let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/')p='/index.html';
  const f=path.join(ROOT,p);
  if(!f.startsWith(ROOT)||/\.env|server/.test(p)){res.writeHead(403);return res.end('forbidden')}
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end('not found')}res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});res.end(d)});
}).listen(PORT,()=>console.log('UniFit-S 실행 중 → http://localhost:'+PORT+(TILON_API_KEY?'  (GPU 연결 설정됨)':'  (⚠ .env 없음: 기본 계산 사용)')));
