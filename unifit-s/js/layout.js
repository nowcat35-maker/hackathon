const ROOT=document.body.dataset.root||'';
const _m=me();
const _here=(location.hash||location.pathname||'');
const _on=k=>_here.includes(k)?' class="on"':'';
document.body.insertAdjacentHTML('afterbegin',`<a class="skip" href="#main">본문 바로가기</a><header><div class="wrap"><a class="logo" href="${ROOT}index.html"><img src="${ROOT}images/logo_final.png" alt="UniFit-S" onerror="this.replaceWith(document.createTextNode('UniFit-S'))"></a><button type="button" class="burger" id="bg" aria-label="메뉴 열기" aria-expanded="false">${ico('menu',22)}</button><nav id="nv"><a href="${ROOT}pages/recommend.html"${_on('recommend')}>AI 맞춤 추천</a><a href="${ROOT}pages/scholarship.html"${_on('scholarship')}>AI 검색</a>${_m?`<a href="${ROOT}pages/board.html"${_on('board')}>지원 현황</a><a href="${ROOT}pages/calendar.html"${_on('calendar')}>내 캘린더</a><a href="${ROOT}pages/mypage.html"${_on('mypage')}>마이페이지</a><a href="#" id="lo" class="out">로그아웃 (${esc(_m.profile.name||_m.id)})</a>`:`<a href="${ROOT}pages/login.html" class="cta-nav">로그인 · 회원가입</a>`}</nav></div></header>`);
document.getElementById('lo')?.addEventListener('click',e=>{e.preventDefault();askLogout()});
document.getElementById('bg').onclick=()=>{const o=document.getElementById('nv').classList.toggle('open');document.getElementById('bg').setAttribute('aria-expanded',o)};
document.body.insertAdjacentHTML('beforeend',`<footer><div class="wrap fgrid"><div><b class="fb">UniFit-S</b><p>장학금 · 대외활동 · 공모전을 한 곳에서 보고,<br>지원 가능 여부 판단부터 마감 관리까지 이어서 챙겨요.</p></div><div><b>서비스</b><a href="${ROOT}pages/recommend.html">AI 맞춤 추천</a><a href="${ROOT}pages/board.html">지원 현황 보드</a><a href="${ROOT}pages/calendar.html">내 캘린더</a></div><div><b>안내</b><p class="fnote">공고 정보는 각 사이트의 원문을 기준으로 정리했으며, 지원 전 원문에서 마감일과 자격을 꼭 다시 확인하세요. 자격 진단은 참고용입니다.</p></div></div><div class="wrap fcopy">© 2026 UniFit-S</div></footer>`);
document.head.insertAdjacentHTML('beforeend',`<link rel="icon" href="${ROOT}images/logo_symbol.png">`);
document.querySelectorAll('input,textarea').forEach(e=>{e.setAttribute('spellcheck','false');e.setAttribute('autocapitalize','off')});
document.querySelector('.banner,.hero,.wrap')?.setAttribute('id','main');

/* 아래쪽에 잠깐 떴다 사라지는 알림 (되돌리기 버튼 지원) */
function toast(msg,label,fn){
 document.getElementById('toast')?.remove();
 document.body.insertAdjacentHTML('beforeend',`<div class="toast" id="toast" role="status"><span>${esc(msg)}</span>${label?`<button type="button" id="tb">${esc(label)}</button>`:''}</div>`);
 const t=document.getElementById('toast');
 if(label)document.getElementById('tb').onclick=()=>{t.remove();fn&&fn()};
 setTimeout(()=>t.remove(),label?6000:3200);
}
function askLogout(){
 if(document.getElementById('lgm'))return;
 document.body.insertAdjacentHTML('beforeend',`<div class="modal" id="lgm"><div class="mbox" role="dialog" aria-modal="true"><h3>로그아웃 할까요?</h3><p>저장한 공고와 프로필은 그대로 남아 있어요.</p><div class="mrow"><button type="button" class="btn line" id="lgn">취소</button><button type="button" class="btn" id="lgy">로그아웃</button></div></div></div>`);
 const close=()=>{document.getElementById('lgm')?.remove();document.removeEventListener('keydown',esc2)};
 const esc2=e=>{if(e.key==='Escape')close()};
 document.addEventListener('keydown',esc2);
 document.getElementById('lgn').onclick=close;
 document.getElementById('lgy').onclick=()=>{close();logout()};
 document.getElementById('lgm').onclick=e=>{if(e.target.id==='lgm')close()};
 document.getElementById('lgn').focus();
}
