/* 로그인 · 회원 정보 저장 (연습용: 브라우저 localStorage에 저장) */
const H=s=>{let h=5381;for(const c of s)h=((h<<5)+h+c.charCodeAt(0))|0;return 'h'+(h>>>0).toString(16)};
const U=()=>JSON.parse(localStorage.getItem('uf_users')||'{}');
const saveU=u=>localStorage.setItem('uf_users',JSON.stringify(u));
const curId=()=>localStorage.getItem('uf_cur');
const me=()=>{const id=curId();return id?(U()[id]||null):null};
function upd(fn){const u=U(),id=curId();if(!id||!u[id])return;fn(u[id]);saveU(u)}
function signup(id,pw,profile){const u=U();if(u[id])return '이미 있는 아이디예요.';u[id]={id,pw:H(pw),profile,book:[],applied:[]};saveU(u);localStorage.setItem('uf_cur',id);return ''}
function login(id,pw){const u=U()[id];if(!u||u.pw!==H(pw))return '아이디나 비밀번호가 틀렸어요.';localStorage.setItem('uf_cur',id);return ''}
function logout(){localStorage.removeItem('uf_cur');location.href=ROOT+'index.html'}
function changePw(oldPw,newPw){const m=me();if(!m||m.pw!==H(oldPw))return '현재 비밀번호가 틀렸어요.';upd(x=>{x.pw=H(newPw)});return ''}
const getP=()=>me()?.profile||null;
const getB=()=>me()?.book||[];
const getA=()=>me()?.applied||[];
function toggleB(id){upd(m=>{m.stage=m.stage||{};if(m.book.includes(id)){m.book=m.book.filter(x=>x!==id);if(['wish','prep'].includes(m.stage[id]))delete m.stage[id]}else m.book.push(id)})}
function applyTo(id){if(!['done','pass','fail'].includes(stageOf(id)))setStage(id,'done')}

/* ---- 지원 현황 단계: wish(관심) → prep(준비 중) → done(지원 완료) → pass/fail(결과) ---- */
function stageOf(id){const m=me();if(!m)return null;const s=(m.stage||{})[id];if(s)return s;if(m.applied.some(a=>a.id===id))return 'done';if(m.book.includes(id))return 'wish';return null}
function setStage(id,st){upd(m=>{m.stage=m.stage||{};
 if(!st){delete m.stage[id];m.book=m.book.filter(x=>x!==id);m.applied=m.applied.filter(a=>a.id!==id);return}
 m.stage[id]=st;
 if(st==='wish'||st==='prep'){if(!m.book.includes(id))m.book.push(id);m.applied=m.applied.filter(a=>a.id!==id)}
 else if(!m.applied.some(a=>a.id===id))m.applied.push({id,date:new Date().toISOString().slice(0,10)})})}
function trackedIds(){const m=me();if(!m)return[];return[...new Set([...m.book,...m.applied.map(a=>a.id),...Object.keys(m.stage||{})])].filter(id=>stageOf(id))}

/* 프로필 입력칸 (회원가입과 마이페이지가 같이 사용) */
const profileHTML=`
<label>이름</label><input id="pf_name" required>
<label>학교</label><input id="pf_school">
<label>학년</label><select id="pf_grade"><option>1학년</option><option>2학년</option><option>3학년</option><option>4학년</option></select>
<label>전공</label><input id="pf_major">
<label>평점 (4.5 만점)</label><input id="pf_gpa" type="number" step="0.1" max="4.5">
<label>나이 (만, 선택 · 자격진단에 사용)</label><input id="pf_age" type="number" min="14" max="60" placeholder="예: 22">
<label>거주 지역</label><select id="pf_region"><option>서울</option><option>경기</option><option>부산</option><option>기타</option></select>
<label>관심 카테고리</label><div class="chips" id="pf_ints"><label><input type="checkbox" value="장학금">장학금</label><label><input type="checkbox" value="대외활동">대외활동</label><label><input type="checkbox" value="공모전">공모전</label></div>
<label>관심 키워드 (쉼표로 구분)</label><input id="pf_kw" placeholder="AI, 디자인, 봉사">`;
const $=id=>document.getElementById(id);
function readProfile(){return{name:$('pf_name').value,school:$('pf_school').value,grade:$('pf_grade').value,major:$('pf_major').value,gpa:$('pf_gpa').value,region:$('pf_region').value,age:$('pf_age').value,interests:[...document.querySelectorAll('#pf_ints input:checked')].map(c=>c.value),keywords:$('pf_kw').value.split(',').map(s=>s.trim()).filter(Boolean)}}
function fillProfile(p){if(!p)return;for(const k of['name','school','grade','major','gpa','region','age'])$('pf_'+k).value=p[k]||'';$('pf_kw').value=(p.keywords||[]).join(', ');document.querySelectorAll('#pf_ints input').forEach(c=>c.checked=(p.interests||[]).includes(c.value))}
