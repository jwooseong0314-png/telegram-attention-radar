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
const VERIFIED_LOGO_DOMAINS={
 '삼성전자':'samsung.com',
 'SK하이닉스':'skhynix.com',
 'SK스퀘어':'sksquare.com',
 'LG에너지솔루션':'lgenergysolution.com',
 '삼성SDI':'samsungsdi.com',
 'NAVER':'navercorp.com',
 '카카오':'kakaocorp.com',
 '현대차':'hyundai.com',
 '기아':'kia.com',
 '한국항공우주':'koreaaero.com',
 '한화에어로스페이스':'hanwhaaerospace.com',
 'LIG넥스원':'lignex1.com',
 'LS ELECTRIC':'lselectric.co.kr',
 'HD현대일렉트릭':'hd-hyundaielectric.com',
 '두산에너빌리티':'doosanenerbility.com',
 '대한항공':'koreanair.com',
 '포스코인터내셔널':'poscointl.com',
 '포스코퓨처엠':'poscofuturem.com',
 '에코프로':'ecopro.co.kr',
 '에코프로비엠':'ecoprobm.co.kr',
 '셀트리온':'celltrion.com',
 '삼성바이오로직스':'samsungbiologics.com',
 '유한양행':'yuhan.co.kr',
 '레인보우로보틱스':'rainbow-robotics.com',
 '두산로보틱스':'doosanrobotics.com',
 'NVIDIA':'nvidia.com',
 'Micron':'micron.com',
 'Broadcom':'broadcom.com',
 'AMD':'amd.com',
 'Microsoft':'microsoft.com',
 'Alphabet':'google.com',
 'Meta':'meta.com',
 'Amazon':'amazon.com',
 'Tesla':'tesla.com',
 'Apple':'apple.com',
 'Bloom Energy':'bloomenergy.com',
 'Palantir':'palantir.com'
};
function logoFallback(company){
 const t=String(company||'').trim();
 if(!t)return '•';
 const ascii=t.match(/[A-Za-z0-9]/g);
 if(ascii&&ascii.length)return ascii.slice(0,2).join('').toUpperCase();
 return t.slice(0,1);
}
function companyLogo(company,small=false){
 const domain=VERIFIED_LOGO_DOMAINS[String(company||'').trim()];
 const fb=esc(logoFallback(company));
 if(!domain)return `<span class="company-logo ${small?'small':''} fallback">${fb}</span>`;
 const src=`https://www.google.com/s2/favicons?domain_url=https://${domain}&sz=128`;
 return `<span class="company-logo ${small?'small':''}"><span class="logo-fallback">${fb}</span><img src="${src}" alt="${esc(company)} 로고" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'"></span>`;
}
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
       ${companyLogo(x.company)}
       <div class="company-copy">
         <div class="attention-name">${esc(x.company)} <b class="${growCls}">${trend}</b></div>
         <div class="company-sub">${esc(marketSub||'')}</div>
       </div>
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
function indexSpark(values){
 const vals=(values||[]).map(Number).filter(Number.isFinite);
 if(!vals.length)return makeSpark(13,15);
 const min=Math.min(...vals),max=Math.max(...vals),range=Math.max(0.000001,max-min);
 return vals.slice(-18).map(v=>`<i style="height:${6+((v-min)/range)*18}px"></i>`).join('')
}
function indexPrice(v){
 if(v===null||v===undefined||!Number.isFinite(Number(v)))return '—';
 const n=Number(v);
 return new Intl.NumberFormat('ko-KR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n)
}
function canonicalTheme(category,name){
 const c=String(category||'').trim();
 if(/반도체|패키징|반도체기판|AI\/반도체/.test(c))return '반도체';
 if(/전력망|전력기기|AI\/전력/.test(c))return '전력/전력망';
 if(/원전/.test(c))return '원전';
 if(/에너지|연료전지/.test(c))return '에너지';
 if(/방산/.test(c))return '방산';
 if(/로봇/.test(c))return '로봇';
 if(/매크로/.test(c))return '매크로';
 if(/기업\/수주/.test(c))return '수주';
 if(/기업\/투자/.test(c))return 'CAPEX/증설';
 if(/기업\/실적/.test(c))return '실적';
 if(/밸류에이션/.test(c))return '밸류에이션';
 if(/자본시장|기업\/자본시장/.test(c))return '자본시장';
 return c||String(name||'기타')
}
function buildThemes(){
 const rows=P().keywords||[];
 const grouped=new Map();
 rows.forEach(x=>{
   const theme=canonicalTheme(x.category,x.name);
   if(!theme)return;
   const g=grouped.get(theme)||{name:theme,mentions:0,previousMentions:0};
   g.mentions+=Number(x.mentions||0);
   g.previousMentions+=Number(x.previousMentions||0);
   grouped.set(theme,g)
 });
 const arr=[...grouped.values()].map(x=>{
   const cur=x.mentions,prev=x.previousMentions;
   const isNew=prev===0&&cur>0;
   const growthPct=prev>0?((cur-prev)/prev*100):null;
   return {...x,isNew,growthPct}
 }).filter(x=>x.mentions>0||x.previousMentions>0);
 const up=arr.filter(x=>x.isNew||(x.growthPct!==null&&x.growthPct>0))
   .sort((a,b)=>{
     if(a.isNew!==b.isNew)return a.isNew?-1:1;
     if(a.isNew&&b.isNew)return b.mentions-a.mentions;
     return Number(b.growthPct)-Number(a.growthPct)
   }).slice(0,5);
 const down=arr.filter(x=>x.growthPct!==null&&x.growthPct<0)
   .sort((a,b)=>Number(a.growthPct)-Number(b.growthPct)).slice(0,5);
 return {up,down}
}
function renderMarket(){
 const indexes=DATA?.marketIndices||[];
 $('#indexGrid').innerHTML=(indexes.length?indexes:[
   {name:'코스피'},{name:'코스닥'},{name:'나스닥'},{name:'S&P 500'}
 ]).map((x,i)=>{
   const ch=x.changePct===null||x.changePct===undefined?null:Number(x.changePct);
   const cls=ch===null?'':ch>0?'up':ch<0?'down':'flat';
   const arrow=ch===null?'':ch>0?'▲':ch<0?'▼':'→';
   return `<div class="index-card">
     <b>${esc(x.name||'')}</b>
     <strong>${indexPrice(x.price)}</strong>
     <span class="index-change ${cls}">${ch===null?'조회 실패':`${arrow} ${pct(ch)}`}</span>
     <div class="index-spark">${indexSpark(x.spark)}</div>
   </div>`
 }).join('');
 const themes=buildThemes();
 renderThemes('#themeUp',themes.up,true);
 renderThemes('#themeDown',themes.down,false)
}
function renderThemes(sel,arr,isUp){
 const magnitudes=arr.map(x=>x.isNew?100:Math.abs(Number(x.growthPct||0)));
 const max=Math.max(1,...magnitudes);
 $(sel).innerHTML=arr.length?arr.map((x,i)=>{
   const val=x.isNew?100:Math.abs(Number(x.growthPct||0));
   const label=x.isNew?'NEW':pct(x.growthPct);
   return `<div class="theme-row">
     <span>${i+1}</span>
     <span>${esc(x.name)}</span>
     <span class="bar"><i style="width:${clamp(val/max*100,8,100)}%"></i></span>
     <span class="pct">${label}</span>
   </div>`
 }).join(''):'<div class="empty" style="padding:6px">데이터 없음</div>'
}
function allThemeRows(){
 const rows=P().keywords||[];
 const grouped=new Map();
 rows.forEach(x=>{
   const theme=canonicalTheme(x.category,x.name);
   if(!theme)return;
   const g=grouped.get(theme)||{name:theme,mentions:0,previousMentions:0,channels:0};
   g.mentions+=Number(x.mentions||0);
   g.previousMentions+=Number(x.previousMentions||0);
   g.channels=Math.max(g.channels,Number(x.channels||0));
   grouped.set(theme,g)
 });
 return [...grouped.values()].map(x=>{
   const cur=x.mentions,prev=x.previousMentions;
   return {...x,isNew:prev===0&&cur>0,growthPct:prev>0?((cur-prev)/prev*100):null}
 }).filter(x=>x.mentions>0||x.previousMentions>0)
   .sort((a,b)=>{
      if(a.isNew!==b.isNew)return a.isNew?-1:1;
      const ga=a.growthPct===null?-999999:Number(a.growthPct);
      const gb=b.growthPct===null?-999999:Number(b.growthPct);
      if(gb!==ga)return gb-ga;
      return b.mentions-a.mentions
   })
}
function fullPostRows(){
 return [...(P().posts||[])].sort((a,b)=>(b.views||0)-(a.views||0))
}
function fullHotRows(){
 const rows=(P().hot||[]).length?[...(P().hot||[])]:[...(P().posts||[])].map(x=>({...x,hotRatio:null}));
 return rows.sort((a,b)=>Number(b.hotRatio||0)-Number(a.hotRatio||0))
}
function fullAttentionRows(){
 const top=P().attention||[];
 const trends=P().companyTrending||[];
 const byName=new Map();
 top.forEach(x=>byName.set(x.company,{...x,name:x.company,isAttention:true}));
 trends.forEach(x=>{
   if(!byName.has(x.name))byName.set(x.name,{...x,company:x.name,isAttention:false});
 });
 return [...byName.values()].sort((a,b)=>{
   const an=(a.growthText||'').includes('NEW')||a.isNew;
   const bn=(b.growthText||'').includes('NEW')||b.isNew;
   if(an!==bn)return an?-1:1;
   const ag=a.growthPct===null||a.growthPct===undefined?-999999:Number(a.growthPct);
   const bg=b.growthPct===null||b.growthPct===undefined?-999999:Number(b.growthPct);
   if(bg!==ag)return bg-ag;
   return Number(b.mentions||0)-Number(a.mentions||0)
 })
}
function modalPostHtml(rows){
 return `<div class="modal-list posts-full">${rows.map((x,i)=>`
   <a class="modal-post-row" href="${esc(x.url||'#')}" target="_blank" rel="noopener">
     <span class="modal-rank">${i+1}</span>
     <span class="modal-thumb">${thumbFor(i,x)}</span>
     <span class="modal-post-text"><b>${esc(x.title||'제목 없음')}</b><small>${esc(x.channel||x.username||'Telegram')}</small></span>
     <span class="modal-metric">◉ ${fmt(x.views)}<small>↗ ${fmt(x.forwards)}</small></span>
     <span class="modal-time">${esc((x.publishedLabel||'').slice(-5))}</span>
   </a>`).join('')}</div>`
}
function modalHotHtml(rows){
 return `<div class="modal-list">${rows.map((x,i)=>`
   <a class="modal-post-row hot-full-row" href="${esc(x.url||'#')}" target="_blank" rel="noopener">
     <span class="modal-rank">${i+1}</span>
     <span class="modal-hot">${x.hotRatio?`${Number(x.hotRatio).toFixed(1)}배`:'HOT'}</span>
     <span class="modal-post-text"><b>${esc(x.title||'Telegram 주요 게시물')}</b><small>${esc(x.channel||x.username||'Telegram')}</small></span>
     <span class="modal-metric">◉ ${fmt(x.views)}<small>↗ ${fmt(x.forwards)}</small></span>
     <span class="modal-time">${esc((x.publishedLabel||'').slice(-5))}</span>
   </a>`).join('')}</div>`
}
function modalAttentionHtml(rows){
 return `<div class="full-attention-table">
   <div class="full-attention-head"><span>#</span><span>종목</span><span>시장/섹터</span><span>채널</span><span>언급</span><span>변화</span><span>주가</span></div>
   ${rows.map((x,i)=>{
     const g=x.growthPct===null||x.growthPct===undefined?null:Number(x.growthPct);
     const isNew=(x.growthText||'').includes('NEW')||x.isNew;
     const growth=isNew?`NEW (0→${fmt(x.mentions)}건)`:(g===null?'—':pct(g));
     const pr=x.price?.changePct===null||x.price?.changePct===undefined?null:Number(x.price.changePct);
     return `<div class="full-attention-row">
       <span class="modal-rank">${i+1}</span>
       <span class="modal-company-cell">${companyLogo(x.company||x.name,true)}<span><b>${esc(x.company||x.name||'')}</b>${x.isAttention&&evidenceText(x)?`<small>${esc(evidenceText(x))}</small>`:''}</span></span>
       <span>${esc([x.market,x.sector].filter(Boolean).join(' · ')||'—')}</span>
       <span>${fmt(x.channels)}개</span>
       <span>${fmt(x.mentions)}건</span>
       <span class="${isNew||g>0?'growth-up':g<0?'growth-down':''}">${esc(growth)}</span>
       <span>${x.price?.price?`${indexPrice(x.price.price)} <small class="${pr>0?'up':pr<0?'down':'flat'}">${pr===null?'':pct(pr)}</small>`:'—'}</span>
     </div>`
   }).join('')}
 </div>`
}
function modalIndicesHtml(){
 const rows=DATA?.marketIndices||[];
 return `<div class="full-index-grid">${rows.map(x=>{
   const ch=x.changePct===null||x.changePct===undefined?null:Number(x.changePct);
   const cls=ch===null?'':ch>0?'up':ch<0?'down':'flat';
   return `<div class="full-index-card">
     <div class="full-index-name"><b>${esc(x.name||'')}</b><small>${esc(x.symbol||'')}</small></div>
     <strong>${indexPrice(x.price)}</strong>
     <span class="${cls}">${ch===null?'조회 실패':pct(ch)}</span>
     <div class="index-spark full">${indexSpark(x.spark)}</div>
     <dl>
       <div><dt>전일 종가</dt><dd>${indexPrice(x.prevClose)}</dd></div>
       <div><dt>통화</dt><dd>${esc(x.currency||'—')}</dd></div>
       <div><dt>시장 상태</dt><dd>${esc(x.marketState||'—')}</dd></div>
       <div><dt>출처</dt><dd>${esc(x.source||'—')}</dd></div>
     </dl>
   </div>`
 }).join('')}</div>`
}
function modalThemesHtml(){
 const rows=allThemeRows();
 return `<div class="full-theme-table">
   <div class="full-theme-head"><span>#</span><span>테마</span><span>현재 언급</span><span>직전 언급</span><span>변화</span></div>
   ${rows.map((x,i)=>`<div class="full-theme-row">
     <span class="modal-rank">${i+1}</span>
     <span><b>${esc(x.name)}</b></span>
     <span>${fmt(x.mentions)}건</span>
     <span>${fmt(x.previousMentions)}건</span>
     <span class="${x.isNew||Number(x.growthPct)>0?'growth-up':Number(x.growthPct)<0?'growth-down':''}">${x.isNew?'NEW':pct(x.growthPct)}</span>
   </div>`).join('')}
 </div>`
}
function openAllModal(kind){
 const modal=$('#allModal'),title=$('#allModalTitle'),sub=$('#allModalSub'),body=$('#allModalBody');
 if(!modal||!title||!body)return;
 const range=reportRange();
 let html='',heading='전체 보기',detail=`${range} · 현재 선택 기간 기준`;
 if(kind==='posts'){heading='조회수 전체 순위';detail=`${range} · 신규 게시물 ${fmt(fullPostRows().length)}건`;html=modalPostHtml(fullPostRows())}
 else if(kind==='attention'){heading='시장 주목 종목 전체';detail=`${range} · 교차채널/언급 변화 기준`;html=modalAttentionHtml(fullAttentionRows())}
 else if(kind==='hot'){heading='HOT NOW 전체 순위';detail=`${range} · 평소 대비 조회·확산 급증 기준`;html=modalHotHtml(fullHotRows())}
 else if(kind==='indices'){heading='주요 지수 상세';detail=`${DATA?.generatedLabel||''} 기준`;html=modalIndicesHtml()}
 else if(kind==='themes'){heading='주요 테마 전체 변화';detail=`${range} · Telegram 언급 변화율`;html=modalThemesHtml()}
 title.textContent=heading;sub.textContent=detail;body.innerHTML=html||'<div class="empty">표시할 데이터가 없습니다.</div>';
 modal.classList.add('show');modal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open')
}
function closeAllModal(){
 const modal=$('#allModal');if(!modal)return;
 modal.classList.remove('show');modal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')
}
document.addEventListener('click',e=>{
 const all=e.target.closest('[data-view-all]');
 if(all){openAllModal(all.dataset.viewAll);return}
 if(e.target.closest('[data-modal-close]')){closeAllModal()}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAllModal()});
function render(){if(!DATA)return;renderHeader();renderPosts();renderAttention();renderHot();renderMarket()}
async function loadData(showToast=false){try{document.body.classList.add('loading');const qs=new URLSearchParams(location.search);const preview=qs.get('preview')==='1';const file=preview?'preview_data.json':'data.json';const r=await fetch(`${file}?t=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw new Error(r.status);const d=await r.json();const changed=lastGenerated&&lastGenerated!==d.generatedAt;lastGenerated=d.generatedAt;DATA=d;render();if((changed||showToast)&&$('#toast')){$('#toast').textContent=preview?'과거 시간대 미리보기 데이터입니다.':'새 데이터로 갱신했습니다.';$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),1800)}}catch(e){console.error(e);$('#topPosts').innerHTML='<div class="empty">웹 데이터를 불러오지 못했습니다. live는 web_export.py, preview는 preview_web.py를 먼저 실행해 주세요.</div>'}finally{document.body.classList.remove('loading')}}
function setPeriod(p,btn){period=p;$$('.period-btn').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');render()}
$('#periodTabs').addEventListener('click',e=>{const b=e.target.closest('[data-period]');if(!b)return;setPeriod(b.dataset.period,b)});
$$('[data-period-side]').forEach(b=>b.addEventListener('click',()=>{period=b.dataset.periodSide;render();window.scrollTo({top:0,behavior:'smooth'})}));
$$('[data-scroll]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.scroll)?.scrollIntoView({behavior:'smooth'})));
$('#settingsBtn').addEventListener('click',()=>alert('설정 화면은 다음 단계에서 연결합니다.'));
loadData();setInterval(()=>loadData(false),60000);
