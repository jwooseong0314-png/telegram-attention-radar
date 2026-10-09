let DATA=null;
let period='realtime';
let lastGenerated='';
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const fmt=n=>new Intl.NumberFormat('ko-KR').format(Number(n||0));
const pct=v=>{if(v===null||v===undefined||Number.isNaN(Number(v)))return '—';const n=Number(v);return `${n>0?'+':''}${n.toFixed(1)}%`};
const P=()=>DATA?.periods?.[period]||{};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function localDate(s){try{return new Date(s)}catch{return new Date()}}
function hhmm(d){return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`}
function reportRange(){const d=localDate(DATA?.generatedAt);if(period!=='realtime')return P().label||'';const end=new Date(d);end.setMinutes(0,0,0);const start=new Date(end);start.setHours(start.getHours()-1);return `${hhmm(start)} – ${hhmm(end)}`}
function countMentions(){return (P().companies||[]).length}
function makeSpark(seed=1,count=13){let x=(Math.abs(seed)%7)+2;let vals=[];for(let i=0;i<count;i++){x=clamp(x+(((seed+i*17)%5)-2),1,9);vals.push(x)}return vals.map(v=>`<i style="height:${5+v*2}px"></i>`).join('')}
function thumbFor(i,x){const icons=['◒','▱','◆','▧','⌁','◫','◎','◉','⌬','△'];return icons[i%icons.length]}
function renderHeader(){
 const p=P();
 $('#versionBadge').textContent=`v${DATA?.version||'2.4'}`;
 const isPreview=!!DATA?.previewMode;
 $('#updatedAt').textContent=isPreview?`미리보기 ${DATA?.generatedLabel||'—'}`:(DATA?.generatedLabel||'—');
 $('#nextAt').textContent=isPreview?'LIVE는 ?preview=1 제거':`${DATA?.nextCollectionLabel||'—'} (자동)`;
 $('#sideUpdated').textContent=isPreview?`과거 미리보기 ${DATA?.generatedLabel||'—'}`:`최근 생성 ${DATA?.generatedLabel||'—'}`;
 $('#reportTitle').innerHTML=`${esc(reportRange())} 리포트 <span class="live-tag">${isPreview?'PREVIEW':(period==='realtime'?'LIVE':'BEST')}</span>`;
 $('#reportChannels').textContent=`수집 채널 ${p.stats?.channels||DATA?.monitoredChannels||0}개`;
 $('#reportPosts').textContent=`신규 게시물 ${fmt(p.stats?.posts||0)}건`;
 $('#reportDone').textContent=`분석 완료 ${DATA?.generatedLabel?.slice(11,16)||'—'}`;
 $('#marketTime').textContent=`${DATA?.generatedLabel?.slice(11,16)||'—'} 기준`;

 const k=[
   ['👥','수집 채널',`${p.stats?.channels||DATA?.monitoredChannels||0}개`,'모니터링 대상',''],
   ['▤','신규 게시물',`${fmt(p.stats?.posts||0)}건`,period==='realtime'?'해당 시간대 기준':(p.label||'기간 기준'),'red'],
   ['▥','언급 종목',`${fmt(countMentions())}개`,'추적 종목 기준','green']
 ];
 $('#summaryKpis').innerHTML=k.map(x=>`<div class="summary-card ${x[4]}"><div class="ico">${x[0]}</div><div><small>${x[1]}</small><strong>${x[2]}</strong><span class="summary-note">${esc(x[3])}</span></div></div>`).join('')
}
function renderPosts(){
 let posts=[...(P().posts||[])].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,10);
 $('#topPosts').innerHTML=posts.length?posts.map((x,i)=>`
 <a class="post-row" href="${esc(x.url||'#')}" target="_blank" rel="noopener">
   <div class="rank-num">${i+1}</div>
   <div class="thumb">${thumbFor(i,x)}</div>
   <div class="post-metrics"><b>◉ ${fmt(x.views)}</b><span>↗ ${fmt(x.forwards)}</span></div>
   <div class="post-main">
     <div class="post-title">${esc(x.title||'제목 없음')}</div>
     <div class="post-meta">${esc(x.channel||x.username||'Telegram')}</div>
   </div>
   <div class="post-time">${esc((x.publishedLabel||'').slice(-5))}</div>
 </a>`).join(''):'<div class="empty">게시물 데이터가 없습니다.</div>'
}
function evidenceText(x){const e=(x.evidence||[])[0];if(e?.headline)return e.headline;return x.flow||'주요 언급 확산'}
function renderAttention(){
 const items=(P().attention||[]).slice(0,5);
 $('#attentionList').innerHTML=items.length?items.map((x,i)=>{
   const rawG=x.growthPct;
   const g=rawG===null||rawG===undefined?null:Number(rawG);
   const prRaw=x.price?.changePct;
   const pr=prRaw===null||prRaw===undefined?null:Number(prRaw);
   const isNew=(x.growthText||'').includes('NEW')||x.arrow==='👀';
   const growCls=isNew?'growth-up':g===null?'':g>0?'growth-up':g<0?'growth-down':'';
   const priceCls=pr===null?'':pr>0?'up':pr<0?'down':'flat';
   const priceArrow=pr===null?'':pr>0?'▲':pr<0?'▼':'→';
   const trend=esc(x.arrow||'→');
   const level=esc(x.attentionLevel||'주목');
   const shortGrowth=isNew?`NEW (0→${fmt(x.mentions)}건)`:(g===null?'변화 계산 중':`언급 ${pct(g)}`);
   const marketSub=[x.market,x.sector].filter(Boolean).join(' · ');
   return `<div class="attention-row">
     <div class="attention-rank">${i+1}</div>
     <div class="attention-company">
       <div class="attention-name">${esc(x.company)} <b class="${growCls}">${trend}</b></div>
       <div class="company-sub">${esc(marketSub||'')}</div>
     </div>
     <div class="level-badge">${level}</div>
     <div class="mini-spark">${makeSpark((x.company||'').length+i,14)}</div>
     <div class="price-box">
       <strong>${x.price?.price?fmt(x.price.price):'—'}</strong>
       <span class="${priceCls}">${pr===null?'—':`${priceArrow}${pct(pr)}`}</span>
     </div>
     <div class="mention-box">
       <b>${fmt(x.channels)}개 채널</b>
       <span class="${growCls}">${esc(shortGrowth)}</span>
     </div>
     <div class="why-line"><span class="why-tag">WHY?</span><span>${esc(evidenceText(x))}</span></div>
     <div class="flow-line">↳ ${esc(x.flow||x.marketReaction||'관련 관심 확산')}</div>
   </div>`
 }).join(''):'<div class="empty">현재 교차채널 기준을 넘는 주목 종목이 없습니다.</div>'
}
function renderHot(){
 let hot=(P().hot||[]).slice(0,5);
 if(!hot.length)hot=(P().posts||[]).slice(0,5).map(x=>({...x,hotRatio:null}));
 $('#hotList').innerHTML=hot.length?hot.map((x,i)=>`
 <a class="hot-row" href="${esc(x.url||'#')}" target="_blank" rel="noopener">
   <div class="rank-num">${i+1}</div>
   <div class="hot-ratio">${x.hotRatio?`${Number(x.hotRatio).toFixed(1)}배`:'HOT'}</div>
   <div class="hot-thumb">${thumbFor(i+3,x)}</div>
   <div class="hot-text"><div class="t">${esc(x.title||'Telegram 주요 게시물')}</div><div class="m">${esc(x.channel||x.username||'Telegram')}</div></div>
   <div class="hot-time">${esc((x.publishedLabel||'').slice(-5))}</div>
 </a>`).join(''):'<div class="empty">실시간 HOT 데이터가 없습니다.</div>'
}
function renderMarket(){
 const labels=['코스피','코스닥','나스닥','S&P 500'];
 $('#indexGrid').innerHTML=labels.map((n,i)=>`<div class="index-card">
   <b>${n}</b><strong>—</strong><span class="index-change">연동 전</span>
   <div class="index-spark">${makeSpark(31+i*7,15)}</div>
 </div>`).join('');
 const arr=(P().companies||[]).filter(x=>x.growthPct!==null&&x.growthPct!==undefined);
 const up=[...arr].filter(x=>Number(x.growthPct)>0).sort((a,b)=>Number(b.growthPct)-Number(a.growthPct)).slice(0,5);
 const down=[...arr].filter(x=>Number(x.growthPct)<0).sort((a,b)=>Number(a.growthPct)-Number(b.growthPct)).slice(0,5);
 renderThemes('#themeUp',up,true);renderThemes('#themeDown',down,false)
}
function renderThemes(sel,arr,isUp){const max=Math.max(1,...arr.map(x=>Math.abs(Number(x.growthPct||0))));$(sel).innerHTML=arr.length?arr.map((x,i)=>`<div class="theme-row"><span>${i+1}</span><span>${esc(x.name)}</span><span class="bar"><i style="width:${clamp(Math.abs(Number(x.growthPct||0))/max*100,8,100)}%"></i></span><span class="pct">${pct(x.growthPct)}</span></div>`).join(''):'<div class="empty" style="padding:6px">데이터 없음</div>'}
function render(){if(!DATA)return;renderHeader();renderPosts();renderAttention();renderHot();renderMarket()}
async function loadData(showToast=false){try{document.body.classList.add('loading');const qs=new URLSearchParams(location.search);const preview=qs.get('preview')==='1';const file=preview?'preview_data.json':'data.json';const r=await fetch(`${file}?t=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw new Error(r.status);const d=await r.json();const changed=lastGenerated&&lastGenerated!==d.generatedAt;lastGenerated=d.generatedAt;DATA=d;render();if((changed||showToast)&&$('#toast')){$('#toast').textContent=preview?'과거 시간대 미리보기 데이터입니다.':'새 데이터로 갱신했습니다.';$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),1800)}}catch(e){console.error(e);$('#topPosts').innerHTML='<div class="empty">웹 데이터를 불러오지 못했습니다. live는 web_export.py, preview는 preview_web.py를 먼저 실행해 주세요.</div>'}finally{document.body.classList.remove('loading')}}
function setPeriod(p,btn){period=p;$$('.period-btn').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');render()}
$('#periodTabs').addEventListener('click',e=>{const b=e.target.closest('[data-period]');if(!b)return;setPeriod(b.dataset.period,b)});
$$('[data-period-side]').forEach(b=>b.addEventListener('click',()=>{period=b.dataset.periodSide;render();window.scrollTo({top:0,behavior:'smooth'})}));
$$('[data-scroll]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.scroll)?.scrollIntoView({behavior:'smooth'})));
$('#settingsBtn').addEventListener('click',()=>alert('설정 화면은 다음 단계에서 연결합니다.'));
loadData();setInterval(()=>loadData(false),60000);
