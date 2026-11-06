/* 하나의 HTML 파일로 합치기:  node bundle.js
   결과: dist/unifit-s.html  (CSS·JS·글꼴·images 폴더의 그림이 전부 안에 들어가요)
   이 파일 하나만 있으면 어디서 열어도(더블클릭, 메일 첨부, 인터넷 업로드) 똑같이 보여요. */
const fs=require('fs'),path=require('path');
const R=p=>path.join(__dirname,p);
const rd=p=>fs.readFileSync(R(p),'utf8');
const b64=p=>fs.readFileSync(R(p)).toString('base64');
const MIME={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};

// 1) 그림 → data URI
const IMGS={};const missing=[];
for(const n of['logo_final','logo_symbol','banner_bg','card_scholarship','card_activity','card_contest']){
  const f=['.png','.jpg','.jpeg','.webp'].map(e=>'images/'+n+e).find(p=>fs.existsSync(R(p)));
  if(f)IMGS[n]=`data:${MIME[path.extname(f)]};base64,${b64(f)}`;else missing.push(n);
}
// 2) CSS + 글꼴
const fontCss=[['Regular',400],['Bold',700],['ExtraBold',800]].map(([f,w])=>`@font-face{font-family:'Pretendard';font-weight:${w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${b64('fonts/Pretendard-'+f+'.woff2')}) format('woff2')}`).join('\n');
let css=rd('css/style.css').replace(/url\(\.\.\/images\/banner_bg\.png\)/g,IMGS.banner_bg?`url(${IMGS.banner_bg})`:'none');
// 3) JS 고쳐 쓰기 (파일 하나 안에서 페이지 이동이 되도록)
const fix=s=>s
  .replace(/\$\{ROOT\}images\/\$\{IMG\[i\.cat\]\}\.png/g,"${__IMGS[IMG[i.cat]]||'x'}")
  .replace(/\$\{ROOT\}images\/(\w+)\.png/g,(m,n)=>"${__IMGS['"+n+"']||'x'}")
  .replace(/location\.href\s*=/g,'window.__nav=')
  .replace(/location\.search/g,'__Q')
  .replace(/\$\{ROOT\}/g,'');
const shared=['js/data.js','js/auth.js','js/layout.js'].map(p=>fix(rd(p)));
// 4) 페이지 쪼개기
const pages={};
for(const [key,file] of [['index','index.html'],['recommend','pages/recommend.html'],['scholarship','pages/scholarship.html'],['detail','pages/detail.html'],['login','pages/login.html'],['mypage','pages/mypage.html'],['calendar','pages/calendar.html'],['board','pages/board.html']]){
  const h=rd(file);
  const title=(h.match(/<title>(.*?)<\/title>/)||[])[1]||'UniFit-S';
  const body=h.slice(h.indexOf('>',h.indexOf('<body'))+1,h.indexOf('<script src='));
  const scripts=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
  pages[key]={title,html:body,js:fix(scripts.join('\n'))};
}
const esc=s=>s.replace(/<\/(script)/gi,'<\\/$1');
const router=`
const __IMGS=${JSON.stringify(IMGS)};
const PAGES=${JSON.stringify(pages)};
function __route(h){h=(h||'').replace(/^#\\/?/,'');let [p,q]=h.split('?');p=(p||'index').replace(/^(\\.\\.\\/|\\.\\/)+/,'').replace(/^pages\\//,'').replace(/\\.html$/,'');return {p:PAGES[p]?p:'index',q:q?'?'+q:''}}
function __href(u){u=String(u).replace(/^(\\.\\.\\/|\\.\\/)+/,'');const i=u.indexOf('?');const r=__route(i<0?u:u.slice(0,i));return '#/'+r.p+(i<0?'':u.slice(i))}
function go(u){const h=__href(u);if(location.hash===h)location.reload();else location.hash=h}
Object.defineProperty(window,'__nav',{set:v=>go(v)});
const __cur=__route(location.hash);const __Q=__cur.q;
document.title=PAGES[__cur.p].title;
document.getElementById('app').innerHTML=PAGES[__cur.p].html;
addEventListener('hashchange',()=>{location.reload();scrollTo(0,0)});
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href]');if(!a)return;const h=a.getAttribute('href');if(!h||h[0]==='#'||/^(https?:|mailto:|tel:)/.test(h)||a.target==='_blank'||a.hasAttribute('download'))return;e.preventDefault();go(h)});
`;
const out=`<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UniFit-S</title>
<style>${fontCss}\n${css}</style></head><body><div id="app"></div>
<script>${esc(router)}</script>
<script>${esc(shared[0])}</script><script>${esc(shared[1])}</script><script>${esc(shared[2])}</script>
<script>{const s=document.createElement('script');s.textContent=PAGES[__cur.p].js;document.body.appendChild(s)}</script>
</body></html>`;
fs.mkdirSync(R('dist'),{recursive:true});fs.writeFileSync(R('dist/unifit-s.html'),out);
console.log('만들었어요 → dist/unifit-s.html ('+(out.length/1048576).toFixed(1)+' MB)');
if(missing.length)console.log('⚠ images 폴더에 없는 그림(대체 표시로 나와요):',missing.join(', '));else console.log('그림 6개 모두 포함됐어요');
