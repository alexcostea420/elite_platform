const hE={1:0.92,2:1.54,3:0.31,4:0.92,5:1.23,6:0.92,7:1.54,8:2.16,9:0.62,10:1.54,11:0.62,12:0.00,13:1.23,14:2.47,15:0.92,16:0.31,17:0.92,18:0.61,19:0.61,20:0.92,21:1.53,22:1.53,23:0.92,24:0.92,25:0.61,26:0.61,27:1.23,28:0.31,29:1.32,30:1.01,31:0.53};
const lE={1:1.19,2:0.30,3:1.19,4:0.59,5:1.74,6:1.19,7:0.89,8:0.59,9:0.30,10:1.48,11:1.48,12:1.19,13:1.19,14:0.30,15:1.19,16:1.19,17:0.88,18:1.17,19:1.17,20:0.59,21:1.17,22:1.17,23:0.88,24:1.73,25:2.35,26:0.59,27:0.30,28:0.89,29:0.95,30:0.97,31:0.51};
const mE={1:1.79,2:1.40,3:1.10,4:1.05,5:1.60,6:2.50,7:2.50,8:2.15,9:2.15,10:0.00,11:0.80,12:1.20};
const mET={1:0.68,2:1.13,3:1.04,4:0.79,5:1.28,6:1.19,7:0.90,8:1.09,9:1.41,10:0.91,11:0.47,12:1.14};
const mN=['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec'];

/* ── Bar Chart ── */
function barChart(id,data,maxV,hotColor,isObj){
  const el=document.getElementById(id);if(!el)return;
  const frag=document.createDocumentFragment();
  const keys=Object.keys(data).map(Number).sort((a,b)=>a-b);
  keys.forEach(d=>{
    const v=data[d];if(v<1.0)return;
    const pct=Math.min(100,((v-1)/(maxV-1))*100);
    const fc=v>=1.8?hotColor:v>=1.4?hotColor+'bb':'#334155';
    const vc=v>=1.5?hotColor:'#64748b';
    const row=document.createElement('div');row.className='bar-row';
    const lbl=document.createElement('div');lbl.className='bar-label';
    lbl.textContent=isObj?mN[d-1]:'ziua '+d;
    const trk=document.createElement('div');trk.className='bar-track';
    const fill=document.createElement('div');fill.className='bar-fill';
    fill.style.background=fc;fill.dataset.width=pct+'%';
    trk.appendChild(fill);
    const val=document.createElement('div');val.className='bar-val';
    val.style.color=vc;val.textContent='+'+Math.round((v-1)*100)+'%'+(v>=1.5?' ★':'');
    row.appendChild(lbl);row.appendChild(trk);row.appendChild(val);
    frag.appendChild(row);
  });
  el.appendChild(frag);
}
barChart('hchart',hE,3,'#F59E0B',false);
barChart('lchart',lE,3,'#06B6D4',false);
barChart('mchart',mE,2.7,'#06B6D4',true);
barChart('mchart-tops',mET,1.5,'#F59E0B',true);


/* ── Scroll Reveal ── */
window._revealObs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');window._revealObs.unobserve(e.target)}});
},{threshold:.08});
document.querySelectorAll('.reveal').forEach(el=>window._revealObs.observe(el));

/* ── Animate bar fills on reveal ── */
const barObserver=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.querySelectorAll('.bar-fill').forEach((f,i)=>{
        setTimeout(()=>{f.style.width=f.dataset.width||'0%'},i*30);
      });
      barObserver.unobserve(e.target);
    }
  });
},{threshold:.1});
document.querySelectorAll('#hchart,#lchart,#mchart,#mchart-tops').forEach(el=>{
  if(el)barObserver.observe(el.closest('.card')||el);
});

/* ── Score Widget ── */
const eclipsesSolar=[new Date('2026-08-12')];
const eclipsesLunar=[new Date('2026-03-03'),new Date('2026-08-27')];
const fibLevels=[{d:new Date('2026-09-24'),name:'1.618 — Raportul de Aur'}];
const knownFullMoon=new Date('2026-03-03');

function calcScore(){
  const today=new Date();today.setHours(0,0,0,0);
  const active=[],upcoming=[];
  eclipsesSolar.forEach(d=>{
    const diff=(d-today)/86400000;
    if(diff>=0&&diff<=7)active.push({name:'Eclipsă Solară',pts:3,type:'PRIMAR',detail:`în ${Math.round(diff)} zile`});
    else if(diff>7&&diff<120)upcoming.push({name:'Eclipsă Solară Totală',days:Math.round(diff)});
  });
  eclipsesLunar.forEach(d=>{
    const diff=(d-today)/86400000;
    const adiff=Math.abs(diff);
    if(adiff<=3)active.push({name:'Eclipsă Lunară',pts:2,type:'PRIMAR',detail:`±${Math.round(adiff)}z`});
    else if(diff>3&&diff<120)upcoming.push({name:'Eclipsă Lunară',days:Math.round(diff)});
  });
  fibLevels.forEach(f=>{
    const diff=(f.d-today)/86400000;
    const adiff=Math.abs(diff);
    if(adiff<=7)active.push({name:`Fibonacci ${f.name}`,pts:2,type:'PRIMAR',detail:`±${Math.round(adiff)}z`});
    else if(diff>7&&diff<200)upcoming.push({name:`Fibonacci ${f.name}`,days:Math.round(diff)});
  });
  const m=today.getMonth()+1,day=today.getDate();
  if((m===1&&day>=16)||(m===2&&day<=15))active.push({name:'Sezonier Ianuarie',pts:1,type:'secundar'});
  const dom=today.getDate();
  const hv=hE[dom]||0,lv=lE[dom]||0;
  if(hv>=1.3||lv>=1.3){
    const favors=hv>=lv?`top-uri +${Math.round((hv-1)*100)}%`:`low-uri +${Math.round((lv-1)*100)}%`;
    active.push({name:`Zi din Lună (${dom})`,pts:1,type:'secundar',detail:favors});
  }
  const daysF=(today-knownFullMoon)/86400000;
  const cp=((daysF%29.53)+29.53)%29.53;
  const df=Math.min(cp,29.53-cp),dn=Math.abs(cp-14.765);
  if(df<=1.5)active.push({name:'Lună Plină',pts:1,type:'secundar',detail:`±${df.toFixed(1)}z`});
  else if(dn<=1.5)active.push({name:'Lună Nouă',pts:1,type:'secundar',detail:`±${dn.toFixed(1)}z`});
  const total=active.reduce((s,x)=>s+x.pts,0);
  const hasPrimary=active.some(x=>x.type==='PRIMAR');
  return{total,active,upcoming,hasPrimary};
}

function renderScoreWidget(){
  const sc=calcScore();
  const today=new Date();
  const ds=today.toLocaleDateString('ro-RO',{day:'2-digit',month:'long',year:'numeric'});
  let status,sc_class;
  if(sc.total>=4&&sc.hasPrimary){status='⚡ FEREASTRĂ ACTIVĂ';sc_class='sw-active';}
  else if(sc.total>=3){status='👁 WATCH';sc_class='sw-watch';}
  else{status='● INACTIV';sc_class='sw-inactive';}
  const scoreColor=sc.total>=4?'var(--green)':sc.total>=3?'var(--solar)':'var(--muted)';
  const pct=Math.min(100,(sc.total/4)*100);
  const mHtml=sc.active.length>0
    ?sc.active.map(x=>`<div class="sw-method-item"><span class="sw-dot-active"></span><span style="color:var(--text)">${x.name}</span><span class="mono" style="color:${x.type==='PRIMAR'?'var(--solar)':'var(--muted)'};font-size:11px;margin-left:4px">+${x.pts}pt</span>${x.detail?`<span style="color:var(--dim);font-size:10px">(${x.detail})</span>`:''}</div>`).join('')
    :'<div class="muted" style="font-size:12px;padding:4px 0">Nicio metodă activă momentan</div>';
  const nHtml=sc.upcoming.length>0
    ?`<div class="sw-next"><span class="mono" style="font-size:10px;color:var(--solar)">URMĂTOR →</span> ${sc.upcoming.slice(0,2).map(u=>`<strong style="color:var(--text)">${u.name}</strong> <span style="color:var(--muted)">în ${u.days} zile</span>`).join(' · ')}</div>`
    :'';
  document.getElementById('score-widget-wrap').innerHTML=`
  <div class="score-widget">
    <div>
      <div class="sw-date">${ds}</div>
      <div class="sw-score" style="color:${scoreColor}">${sc.total}</div>
      <div class="sw-label">puncte active</div>
      <div style="margin-top:10px"><span class="sw-status ${sc_class}">${status}</span></div>
    </div>
    <div style="width:1px;background:var(--border);align-self:stretch"></div>
    <div class="sw-methods">
      <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;font-family:var(--font-mono)">Metode Active</div>
      ${mHtml}${nHtml}
    </div>
    <div class="sw-progress-wrap">
      <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;font-family:var(--font-mono)">Progres spre fereastră</div>
      <div style="background:rgba(255,255,255,.05);border-radius:6px;height:10px;overflow:hidden">
        <div style="width:${pct}%;height:100%;background:${scoreColor};border-radius:6px;transition:width 1.2s ease"></div>
      </div>
      <div style="margin-top:8px;display:flex;justify-content:space-between;font-size:11px;color:var(--dim);font-family:var(--font-mono)">
        <span>${sc.total} / 4 minim</span><span style="color:var(--border2)">max ~11</span>
      </div>
      <div style="margin-top:12px;font-size:10px;color:var(--dim);line-height:1.6">Necesită: <strong style="color:var(--text)">4+ pct + 1 metodă PRIMARĂ</strong></div>
    </div>
  </div>`;
}
renderScoreWidget();

/* ── Dynamic Header Badges ── */
(function(){
  var now=new Date();
  var months=['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];
  var bd=document.getElementById('badge-date');
  if(bd)bd.textContent=months[now.getMonth()]+' '+now.getFullYear();

  var bp=document.getElementById('badge-pivot');
  if(bp){
    var sc=calcScore();
    if(sc.upcoming.length>0){
      var u=sc.upcoming[0];
      var pivotDate=new Date(now.getTime()+u.days*86400000);
      var dd=pivotDate.getDate(),mm=pivotDate.getMonth()+1,yy=pivotDate.getFullYear();
      var dateStr=(dd<10?'0':'')+dd+'.'+(mm<10?'0':'')+mm+'.'+yy;
      bp.textContent='Next Pivot: '+u.name+' \u2014 '+dateStr+' ('+u.days+' zile)';
      bp.style.borderColor='rgba(245,158,11,.3)';bp.style.color='#F59E0B';
    }else if(sc.active.length>0){
      bp.textContent='\u26A1 Pivot activ: '+sc.active[0].name;
      bp.style.borderColor='rgba(16,185,129,.3)';bp.style.color='#10B981';
    }else{
      bp.textContent='Nicio fereastr\u0103 activ\u0103';
    }
  }
})();

/* ── Section IDs + Toggle Buttons ── */
const secIds=['s-cycles','s-bear','s-seasons','s-dom','s-eclipse','s-blood','s-mercury','s-gann','s-fib','s-shmita','s-halving','s-scoring','s-legend'];
document.querySelectorAll('.section-title').forEach((el,i)=>{
  if(secIds[i])el.id=secIds[i];
  const btn=document.createElement('button');
  btn.className='section-toggle';btn.textContent='−';
  btn.title='Ascunde/arată secțiunea';
  btn.addEventListener('click',e=>{
    e.preventDefault();
    const open=btn.textContent==='−';
    btn.textContent=open?'+':'−';
    let sib=el.nextElementSibling;
    while(sib&&!sib.classList.contains('section-title')){
      if(!sib.classList.contains('section-collapsible'))sib.classList.add('section-collapsible');
      if(open){sib.classList.add('section-collapsed')}else{sib.classList.remove('section-collapsed')}
      sib=sib.nextElementSibling;
    }
  });
  el.appendChild(btn);
});

/* ── Subnav Active Section ── */
const navLinks=document.querySelectorAll('.subnav-link');
const secObserver=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      navLinks.forEach(l=>l.classList.remove('active'));
      const lnk=document.querySelector(`.subnav-link[href="#${e.target.id}"]`);
      if(lnk){lnk.classList.add('active');lnk.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});}
    }
  });
},{rootMargin:'-20% 0px -70% 0px'});
document.querySelectorAll('.section-title[id]').forEach(el=>secObserver.observe(el));

/* ── Tooltips ── */
const tipbox=document.createElement('div');
tipbox.className='tipbox';document.body.appendChild(tipbox);
let tipTimer;
function bindTip(el){
  el.addEventListener('mouseenter',()=>{clearTimeout(tipTimer);tipbox.innerHTML=el.dataset.tip;tipbox.classList.add('show');});
  el.addEventListener('mousemove',e=>{tipbox.style.left=(e.clientX+14)+'px';tipbox.style.top=(e.clientY-10)+'px';});
  el.addEventListener('mouseleave',()=>{tipTimer=setTimeout(()=>tipbox.classList.remove('show'),100);});
}
document.querySelectorAll('.bar-row').forEach(row=>{
  const lbl=row.querySelector('.bar-label')?.textContent?.trim();
  const val=row.querySelector('.bar-val')?.textContent?.trim();
  if(lbl&&val){row.dataset.tip=`<strong>${lbl}</strong><br>Apariții: ${val} față de medie`;bindTip(row);}
});
document.querySelectorAll('.cal-cell:not(.cal-neutral)').forEach(cell=>{
  const num=cell.querySelector('.num')?.textContent;
  const enr=cell.querySelector('.enr')?.textContent;
  if(num&&enr){cell.dataset.tip=`Ziua <strong>${num}</strong><br>${enr} față de medie`;bindTip(cell);}
});
document.querySelectorAll('.method-table tbody tr').forEach(row=>{
  const name=row.querySelector('td strong')?.textContent?.trim();
  const pts=row.querySelector('.score')?.textContent;
  if(name&&pts){row.dataset.tip=`<strong>${name}</strong> · ${pts} punct${pts>1?'e':''}`;bindTip(row);}
});

/* ── Fibonacci: Today Marker ── */
(function(){
  const fibs=[
    new Date('2022-04-30'),new Date('2023-06-16'),new Date('2024-04-19'),
    new Date('2024-10-15'),new Date('2025-05-15'),new Date('2025-10-06'),
    new Date('2025-12-06'),new Date('2026-09-24'),new Date('2028-03-28'),new Date('2030-09-19')
  ];
  const today=new Date();today.setHours(0,0,0,0);
  let insertAfterIdx=-1;
  for(let i=0;i<fibs.length-1;i++){
    if(today>=fibs[i]&&today<fibs[i+1]){insertAfterIdx=i;break;}
  }
  if(insertAfterIdx<0)return;
  const tl=document.querySelector('.tl');
  if(!tl)return;
  const items=tl.querySelectorAll('.tl-item');
  if(!items[insertAfterIdx])return;
  const marker=document.createElement('div');
  marker.className='tl-today';
  const ds=today.toLocaleDateString('ro-RO',{day:'2-digit',month:'short',year:'numeric'});
  marker.innerHTML=`<div class="tl-today-dot"></div><div class="tl-today-label">▶ AZI — ${ds}</div>`;
  items[insertAfterIdx].after(marker);
})();

/* ── Interactive Chart Cards ── */
(function(){
const CONCEPTS={
solar:{
  color:'#F59E0B',label:'Eclipsă Solară',days:90,
  events:[
    {date:'2012-05-20',type:'Inelară',pre:[4.97,5.20,4.90,5.05,4.93],prices:[5.09,5.14,5.21,5.47,6.16,6.35,6.63,6.80,7.62,8.41,8.71,10.87,12.04],bull:true,ret:'+136%'},
    {date:'2012-11-13',type:'Totală',pre:[11.89,11.85,11.65,10.89,10.90],prices:[10.95,11.73,12.20,13.41,13.56,13.30,13.35,13.30,13.74,14.25,17.26,19.53,20.60],bull:true,ret:'+88%'},
    {date:'2013-05-10',type:'Inelară',pre:[142,117,118,137,98],prices:[118,124,133,129,111,100,110,95,66,88,86,91,97],bull:false,ret:'-44%'},
    {date:'2013-11-03',type:'Hibridă',pre:[125,122,130,163,186],prices:[208,312,476,751,947,795,879,618,745,940,873,879,880],bull:true,ret:'+453%'},
    {date:'2014-04-29',type:'Inelară',pre:[584,460,453,516,488],prices:[447,439,441,486,571,630,653,611,582,640,625,622,622],bull:true,ret:'+46%'},
    {date:'2015-03-20',type:'Totală',pre:[257,245,254,276,285],prices:[262,247,255,236,223,231,236,244,238,240,237,226,230],bull:false,ret:'-15%'},
    {date:'2016-03-09',type:'Totală',pre:[375,378,411,422,434],prices:[413,417,418,415,422,424,433,463,453,456,457,452,506],bull:true,ret:'+23%'},
    {date:'2016-09-01',type:'Inelară',pre:[654,573,589,574,578],prices:[575,617,610,600,607,613,638,631,676,727,718,734,742],bull:true,ret:'+29%'},
    {date:'2017-08-21',type:'Totală',pre:[3600,3650,3700,3850,4000],prices:[4050,4330,4600,3900,4250,5600,5850,6100,5750,6450,7400,8050,8200],bull:true,ret:'+102%'},
    {date:'2019-07-02',type:'Totală',pre:[8700,9200,10500,11400,12800],prices:[10800,11800,10200,9850,10400,10100,10350,10600,10050,9600,8400,8150,8300],bull:false,ret:'-23%'},
    {date:'2020-12-14',type:'Totală',pre:[15500,16200,17800,18900,19100],prices:[19400,23000,24000,28900,32000,33400,30500,37000,38500,44000,49000,55000,57000],bull:true,ret:'+194%'},
    {date:'2021-06-10',type:'Anulară',pre:[56800,49000,42000,38200,36500],prices:[37000,35600,33000,34500,32000,29800,31500,38000,42000,44800,47000,49000,46200],bull:true,ret:'+25%'},
    {date:'2023-04-20',type:'Hibridă',pre:[27500,27800,28200,29000,28600],prices:[28800,27500,29200,28400,27000,26300,26700,27200,28000,29500,30000,30500,29800],bull:true,ret:'+3%'},
    {date:'2023-10-14',type:'Inelară',pre:[26000,26000,26000,26000,27000],prices:[26000,29000,34000,36000,37000,38000,39000,40000,41000,42000,43000,42000,42000],bull:true,ret:'+59%'},
    {date:'2024-04-08',type:'Totală',pre:[73000,72000,70000,69000,69000],prices:[71000,63000,66000,64000,63000,61000,59000,58000,57000,56000,55000,55000,55000],bull:false,ret:'-22%'},
    {date:'2024-10-02',type:'Inelară',pre:[55000,57000,59000,61000,63000],prices:[60000,60000,67000,69000,72000,75000,80000,84000,88000,90000,92000,93000,93000],bull:true,ret:'+54%'},
    {date:'2026-02-17',type:'Inelară',pre:[92000,88000,82000,75000,68000],prices:[67000,64000,68000,70000,73000],bull:null,ret:'~+9%',live:'live'},
    {date:'2026-08-12',type:'Totală',pre:[],prices:[],bull:null,ret:'—',live:'next'}
  ]
},
lunar:{
  color:'#93C5FD',label:'Eclipsă Lunară',days:90,
  events:[
    {date:'2014-04-15',type:'Totală',pre:[634,615,584,460,453],prices:[516,488,447,439,441,486,571,630,653,611,582,640,625],bull:true,ret:'+27%'},
    {date:'2014-10-08',type:'Totală',pre:[485,479,457,423,387],prices:[353,395,383,336,349,424,381,368,375,346,320,323,320],bull:false,ret:'-9%'},
    {date:'2015-04-04',type:'Totală',pre:[276,276,282,260,253],prices:[255,237,223,226,236,242,236,239,233,226,233,245,251],bull:false,ret:'-11%'},
    {date:'2015-09-28',type:'Totală',pre:[211,230,240,231,227],prices:[239,243,245,263,286,314,380,331,323,377,396,444,439],bull:true,ret:'+86%'},
    {date:'2018-01-31',type:'Totală',pre:[13500,14000,16500,13000,11500],prices:[10100,8200,6900,7600,8500,9200,9700,8350,7400,6600,7000,7500,8000],bull:false,ret:'-21%'},
    {date:'2018-07-27',type:'Totală',pre:[6700,6400,6200,6600,7400],prices:[8200,7800,7100,6400,6200,6500,6350,6400,6300,6500,6350,6200,5900],bull:false,ret:'-28%'},
    {date:'2021-05-26',type:'Totală',pre:[58000,56000,52000,43000,40000],prices:[39000,36400,35600,33000,34500,32200,29800,31500,38000,42000,44800,47500,49200],bull:true,ret:'+26%'},
    {date:'2021-11-19',type:'Parțială',pre:[55000,60000,64000,66000,63000],prices:[58000,57000,49000,47200,46800,43000,42000,38000,37500,42000,44000,40000,38500],bull:false,ret:'-34%'},
    {date:'2022-05-16',type:'Totală',pre:[38000,36000,34000,30000,31000],prices:[30000,29000,20500,20000,19500,20000,21000,22000,23000,23500,21500,20000,19500],bull:false,ret:'-35%'},
    {date:'2022-11-08',type:'Totală',pre:[19000,19000,20000,20000,20000],prices:[18000,16000,16000,16500,17000,17500,18000,19000,20000,20500,21000,21500,22000],bull:true,ret:'+23%'},
    {date:'2025-03-14',type:'Totală',pre:[100000,97000,90000,84000,86000],prices:[83000,84000,84000,83000,83000,85000,90000,94000,97000,100000,103000,104000,105000],bull:true,ret:'+26%'},
    {date:'2025-09-07',type:'Totală',pre:[121000,119000,116000,113000,108000],prices:[111000,115000,115000,119000,123000,121000,118000,115000,110000,105000,98000,92000,89000],bull:false,ret:'-20%'},
    {date:'2026-03-03',type:'Totală',pre:[80000,75000,70000,67000,64000],prices:[68000,69000,73000,70000],bull:null,ret:'~+7%',live:'live'}
  ]
},
halving:{
  color:'#F97316',label:'Halving',days:365,
  events:[
    {date:'2012-11-28',type:'H1',pre:[10,11,11,12,12],prices:[12,13,14,15,20,27,35,48,65,90,110,100,120,135,100,120,145,135,120,110,130,200,340,530,800,1100],bull:true,ret:'+8250%'},
    {date:'2016-07-09',type:'H2',pre:[450,460,530,580,640],prices:[650,660,610,590,600,610,620,630,650,740,710,750,760,790,830,870,900,920,960,980,1000,1030,1050,1100,1200,1300],bull:true,ret:'+100%'},
    {date:'2020-05-11',type:'H3',pre:[6800,7100,7300,8000,8800],prices:[8600,9200,9500,9400,9700,9200,9300,9100,10000,10400,10800,11200,11800,13000,13800,14500,16500,19100,23000,28900,32000,36000,40000,48000,55000,58000],bull:true,ret:'+574%'},
    {date:'2024-04-19',type:'H4',pre:[52000,58000,62000,64000,66000],prices:[64000,63000,66000,68000,70000,66500,61000,58000,56000,57500,59000,62000,66000,68500,72000,78000,84000,90000,96000,100000,104000,99000,96000,88000,84000,86000],bull:true,ret:'+34%'}
  ]
},
cycle:{
  color:'#06B6D4',label:'Ciclu Scurt 86z',days:86,
  events:[
    {date:'2023-01-06',type:'IC Low',pre:[17400,17100,16800,16600,16900],prices:[16950,17200,18100,20400,22200,23600,24200,25000,26500,27800,28200,29000,28500],bull:true,ret:'+68%'},
    {date:'2023-06-15',type:'IC Low',pre:[27200,27000,26500,26000,25800],prices:[25600,26200,26800,27500,28000,29200,30000,29500,28500,27600,26800,26200,26000],bull:true,ret:'+2%'},
    {date:'2024-01-23',type:'IC Low',pre:[43500,42500,41800,41000,40200],prices:[39800,42000,43500,48000,52000,57000,61000,63500,66000,68000,71000,69500,70000],bull:true,ret:'+76%'},
    {date:'2024-08-05',type:'IC Low',pre:[62000,60000,57000,53500,50000],prices:[49000,50500,54000,57500,59000,58000,60500,62000,63500,66000,68000,72000,76000],bull:true,ret:'+55%'}
  ]
},
pi:{
  color:'#A78BFA',label:'Pi Cycle',days:90,
  events:[
    {date:'2013-04-05',type:'Cross',pre:[34.5,44.2,47.0,69.9,90.5],prices:[142,117,118,137,98,118,124,133,129,111,100,110,95],bull:false,ret:'-33%'},
    {date:'2021-04-12',pre:[50000,52000,55000,58000,59500],prices:[60000,58000,54000,57000,49000,38000,35600,33000,34500,32200,29800,31500,35200],bull:false,ret:'-41%'},
    {date:'2023-11-14',pre:[28000,29500,31000,34000,35500],prices:[36500,37000,38000,39000,40000,42000,43500,44000,48000,52000,57000,61000,63000],bull:true,ret:'+73%'}
  ]
}
};

/* Utility: week labels */
function weekLabels(n,pfx){const a=[];for(let i=0;i<n;i++)a.push(pfx?pfx+(i===0?'':' +'+i+'s'):('S'+i));return a;}

/* Build metrics bar */
function buildMetrics(containerId,events){
  const el=document.getElementById(containerId);if(!el)return;
  const real=events.filter(e=>e.prices.length>2);
  const bullish=real.filter(e=>e.bull===true);
  const avgRet=real.length?real.reduce((s,e)=>{const p=parseFloat(e.ret);return s+(isNaN(p)?0:p)},0)/real.length:0;
  el.innerHTML=`
    <div class="metric-pill"><span class="mv">${real.length}</span> evenimente</div>
    <div class="metric-pill"><span class="mv" style="color:${bullish.length/real.length>=0.6?'var(--green)':'var(--red)'}">${Math.round(bullish.length/real.length*100)}%</span> bullish</div>
    <div class="metric-pill"><span class="mv" style="color:${avgRet>=0?'var(--green)':'var(--red)'}">${avgRet>=0?'+':''}${avgRet.toFixed(0)}%</span> return mediu</div>
  `;
}

/* Build cards */
function buildCards(containerId,events,color){
  const el=document.getElementById(containerId);if(!el)return;
  events.forEach((ev,idx)=>{
    const card=document.createElement('div');
    card.className='chart-card reveal';
    const liveBadge=ev.live==='live'?'<span class="live-badge"><span class="live-dot"></span>LIVE</span>':
                    ev.live==='next'?'<span class="next-badge">URMĂTOR</span>':'';
    const retClass=ev.bull===true?'bull':ev.bull===false?'bear':'';
    card.innerHTML=`
      <div class="chart-card-hd">
        <span class="chart-card-date">${ev.date}</span>
        <span class="chart-card-type">${ev.type}</span>
        ${liveBadge}
        <span class="chart-card-ret ${retClass}">${ev.ret}</span>
        <span class="chart-card-chevron">▾</span>
      </div>
      <div class="chart-card-body">
        <div class="chart-canvas-wrap">
          <canvas id="cc-${containerId.split('-')[1]}-${idx}"></canvas>
        </div>
      </div>
    `;
    el.appendChild(card);
    /* click to expand + animate */
    const hd=card.querySelector('.chart-card-hd');
    let drawn=false;
    hd.addEventListener('click',()=>{
      const wasOpen=card.classList.contains('open');
      card.classList.toggle('open');
      if(!wasOpen&&!drawn&&ev.prices.length>2){
        drawn=true;
        setTimeout(()=>drawAnimatedChart(card.querySelector('canvas'),ev,color),120);
      }
    });
  });
}

/* Format price for eclipse table */
function fmtP(v){if(v==null)return'\u2014';if(v>=1000)return'$'+(v/1000).toFixed(v>=10000?0:1)+'K';return'$'+Math.round(v);}

/* Build eclipse compact table (for solar & lunar) */
function buildEclipseTable(containerId,events,color){
  var el=document.getElementById(containerId);if(!el)return;
  var real=events.filter(function(e){return e.prices.length>2;});

  function getIntervals(ev){
    var p=ev.pre||[],pr=ev.prices||[];
    var evPrice=pr[0];
    if(!evPrice)return null;
    function pct(v){return v!=null&&evPrice?((v-evPrice)/evPrice*100):null;}
    return{
      d28b:p[1]!=null?{price:p[1],pct:pct(p[1])}:null,
      d14b:p[3]!=null?{price:p[3],pct:pct(p[3])}:null,
      d7b:p[4]!=null?{price:p[4],pct:pct(p[4])}:null,
      event:{price:evPrice,pct:0},
      d7a:pr[1]!=null?{price:pr[1],pct:pct(pr[1])}:null,
      d14a:pr[2]!=null?{price:pr[2],pct:pct(pr[2])}:null,
      d28a:pr[4]!=null?{price:pr[4],pct:pct(pr[4])}:null,
      d90a:pr[12]!=null?{price:pr[12],pct:pct(pr[12])}:null
    };
  }

  var table=document.createElement('table');table.className='ecl-table';
  var thead=document.createElement('thead');
  var hr=document.createElement('tr');
  ['Data','Tip','90z Return',''].forEach(function(t,i){
    var th=document.createElement('th');th.textContent=t;
    if(i===2)th.style.textAlign='right';
    if(i===3)th.style.width='30px';
    hr.appendChild(th);
  });
  thead.appendChild(hr);table.appendChild(thead);

  var tbody=document.createElement('tbody');
  events.forEach(function(ev){
    var retClass=ev.bull===true?'bull':ev.bull===false?'bear':'';
    var tr=document.createElement('tr');tr.className='ecl-row';

    var td1=document.createElement('td');
    var ds=document.createElement('span');ds.className='ecl-date';ds.textContent=ev.date;td1.appendChild(ds);
    if(ev.live==='live'){var lb=document.createElement('span');lb.className='live-badge';lb.style.marginLeft='6px';var ld=document.createElement('span');ld.className='live-dot';lb.appendChild(ld);lb.appendChild(document.createTextNode('LIVE'));td1.appendChild(lb);}
    else if(ev.live==='next'){var nb=document.createElement('span');nb.className='next-badge';nb.style.marginLeft='6px';nb.textContent='URM\u0102TOR';td1.appendChild(nb);}

    var td2=document.createElement('td');var ts=document.createElement('span');ts.className='ecl-type';ts.textContent=ev.type||'';td2.appendChild(ts);
    var td3=document.createElement('td');td3.style.textAlign='right';var rs=document.createElement('span');rs.className='ecl-ret '+retClass;rs.textContent=ev.ret;td3.appendChild(rs);
    var td4=document.createElement('td');td4.className='ecl-chev';td4.textContent='\u25BE';
    tr.appendChild(td1);tr.appendChild(td2);tr.appendChild(td3);tr.appendChild(td4);

    var dtr=document.createElement('tr');var dtd=document.createElement('td');dtd.colSpan=4;
    var dd=document.createElement('div');dd.className='ecl-detail';

    var ivs=getIntervals(ev);
    if(ivs){
      var inner=document.createElement('div');inner.className='ecl-detail-inner';
      var grid=document.createElement('div');grid.className='ecl-intervals';
      [{key:'d28b',label:'-28z'},{key:'d14b',label:'-14z'},{key:'d7b',label:'-7z'},
       {key:'event',label:'ECLIPS\u0102',isEvent:true},
       {key:'d7a',label:'+7z'},{key:'d14a',label:'+14z'},{key:'d28a',label:'+28z'},{key:'d90a',label:'+90z'}
      ].forEach(function(s){
        var d=ivs[s.key];
        var c=document.createElement('div');c.className='ecl-iv'+(s.isEvent?' event-col':'');
        var l=document.createElement('div');l.className='ecl-iv-label';l.textContent=s.label;c.appendChild(l);
        var pr=document.createElement('div');pr.className='ecl-iv-price';pr.textContent=d?fmtP(d.price):'\u2014';c.appendChild(pr);
        if(d&&!s.isEvent){
          var pv=document.createElement('div');var pctVal=d.pct;
          pv.className='ecl-iv-pct '+(pctVal>0.5?'up':pctVal<-0.5?'dn':'flat');
          pv.textContent=(pctVal>0?'+':'')+pctVal.toFixed(1)+'%';c.appendChild(pv);
        }
        grid.appendChild(c);
      });
      inner.appendChild(grid);dd.appendChild(inner);
    }
    dtd.appendChild(dd);dtr.appendChild(dtd);
    tr.addEventListener('click',function(){tr.classList.toggle('open');dd.classList.toggle('open');});
    tbody.appendChild(tr);tbody.appendChild(dtr);
  });
  table.appendChild(tbody);el.appendChild(table);

  /* Conclusion with bottom/top analysis */
  if(real.length<3)return;
  var keys=['d28b','d14b','d7b','d7a','d14a','d28a','d90a'];
  var allKeys=['d28b','d14b','d7b','event','d7a','d14a','d28a','d90a'];
  var labels={d28b:'-28 zile',d14b:'-14 zile',d7b:'-7 zile',event:'Eclips\u0103',d7a:'+7 zile',d14a:'+14 zile',d28a:'+28 zile',d90a:'+90 zile'};
  var agg={};keys.forEach(function(k){agg[k]={sum:0,wins:0,n:0};});
  var bottomAt={};var topAt={};
  allKeys.forEach(function(k){bottomAt[k]=0;topAt[k]=0;});

  real.forEach(function(ev){
    var ivs=getIntervals(ev);if(!ivs)return;
    keys.forEach(function(k){if(ivs[k]&&ivs[k].pct!=null){agg[k].sum+=ivs[k].pct;if(ivs[k].pct>0)agg[k].wins++;agg[k].n++;}});
    /* Find local bottom and top across all intervals */
    var minK=null,maxK=null,minV=Infinity,maxV=-Infinity;
    allKeys.forEach(function(k){
      var d=ivs[k];if(!d||d.price==null)return;
      if(d.price<minV){minV=d.price;minK=k;}
      if(d.price>maxV){maxV=d.price;maxK=k;}
    });
    if(minK)bottomAt[minK]++;
    if(maxK)topAt[maxK]++;
  });

  var bestEntry=null,bestPerf=null;
  keys.forEach(function(k){
    var a=agg[k];if(a.n<2)return;a.avg=a.sum/a.n;a.winRate=Math.round(a.wins/a.n*100);
    if(k.indexOf('b')>0&&(!bestEntry||a.avg<agg[bestEntry].avg))bestEntry=k;
    if(k.indexOf('a')>0&&(!bestPerf||a.avg>agg[bestPerf].avg))bestPerf=k;
  });

  /* Find most frequent bottom/top intervals */
  var topBottom=null,topBottomN=0,topTop=null,topTopN=0;
  allKeys.forEach(function(k){
    if(bottomAt[k]>topBottomN){topBottomN=bottomAt[k];topBottom=k;}
    if(topAt[k]>topTopN){topTopN=topAt[k];topTop=k;}
  });

  var box=document.createElement('div');box.className='ecl-conclusion';
  var t=document.createElement('div');t.style.cssText='font-size:11px;font-weight:700;color:var(--text);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px;font-family:var(--font-mono)';
  t.textContent='Analiz\u0103 Bottom/Top \u2014 '+real.length+' eclipse';box.appendChild(t);

  /* Bottom/Top frequency table */
  var tbl=document.createElement('div');tbl.style.cssText='display:flex;gap:4px;margin-bottom:12px;flex-wrap:wrap';
  allKeys.forEach(function(k){
    var isBot=(k===topBottom);var isTop=(k===topTop);
    var bCount=bottomAt[k];var tCount=topAt[k];
    var pct=agg[k]?agg[k].avg:null;
    var c=document.createElement('div');
    c.style.cssText='flex:1;min-width:65px;text-align:center;padding:6px 4px;border-radius:6px;font-family:var(--font-mono);font-size:10px;border:1px solid '+(isBot?'var(--green)':isTop?'var(--red)':'var(--border)')+';background:'+(isBot?'rgba(16,185,129,.08)':isTop?'rgba(239,68,68,.08)':'var(--bg3)');
    var lbl=document.createElement('div');lbl.style.cssText='font-size:8px;color:var(--muted);text-transform:uppercase;margin-bottom:3px';lbl.textContent=labels[k]||k;
    c.appendChild(lbl);
    if(bCount>0){var bd=document.createElement('div');bd.style.cssText='color:var(--green);font-weight:600';bd.textContent='\u25BC '+bCount+'/'+real.length;c.appendChild(bd);}
    if(tCount>0){var td=document.createElement('div');td.style.cssText='color:var(--red);font-weight:600';td.textContent='\u25B2 '+tCount+'/'+real.length;c.appendChild(td);}
    if(bCount===0&&tCount===0){var nd=document.createElement('div');nd.style.cssText='color:var(--dim)';nd.textContent='\u2014';c.appendChild(nd);}
    if(pct!=null&&k!=='event'){var pd=document.createElement('div');pd.style.cssText='font-size:9px;color:'+(pct>=0?'var(--green)':'var(--red)');pd.textContent=(pct>=0?'+':'')+pct.toFixed(1)+'%';c.appendChild(pd);}
    tbl.appendChild(c);
  });
  box.appendChild(tbl);

  /* Win rate bars */
  var barTitle=document.createElement('div');barTitle.style.cssText='font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;font-family:var(--font-mono)';barTitle.textContent='Win Rate per Interval';box.appendChild(barTitle);
  var barExpl=document.createElement('div');barExpl.style.cssText='font-size:10px;color:var(--dim);margin-bottom:8px;line-height:1.5';barExpl.textContent='\u25B6 Win Rate = \xEEn c\xe2te % din eclipse pre\u021Bul la acel interval a fost MAI MARE dec\xe2t \xEEn ziua eclipsei. Avg = media procentual\u0103 fa\u021B\u0103 de pre\u021Bul eclipsei.';box.appendChild(barExpl);
  keys.forEach(function(k){
    var a=agg[k];if(a.n<2)return;var wr=a.winRate,avg=a.avg;
    var bc=avg>=0?'var(--green)':'var(--red)';
    var row=document.createElement('div');row.className='ecl-c-row';
    var l=document.createElement('span');l.className='ecl-c-label';l.style.color=bc;l.textContent=labels[k];
    var bw=document.createElement('div');bw.className='ecl-c-bar';
    var bf=document.createElement('div');bf.className='ecl-c-fill';bf.style.width=wr+'%';bf.style.background=bc;bw.appendChild(bf);
    var ws=document.createElement('span');ws.style.cssText='font-family:var(--font-mono);font-size:11px;min-width:40px;color:'+bc;ws.textContent=wr+'%';
    var as2=document.createElement('span');as2.style.cssText='font-family:var(--font-mono);font-size:11px;color:var(--muted)';as2.textContent='(avg '+(avg>=0?'+':'')+avg.toFixed(1)+'%)';
    row.appendChild(l);row.appendChild(bw);row.appendChild(ws);row.appendChild(as2);
    box.appendChild(row);
  });

  /* Insight text */
  var ins=document.createElement('div');ins.style.cssText='margin-top:10px;padding-top:10px;border-top:1px solid var(--border)';
  if(topBottom){
    var p1=document.createElement('p');p1.style.cssText='font-size:12px;color:var(--muted);margin-bottom:4px';
    var s1=document.createElement('strong');s1.style.color='var(--green)';s1.textContent='\u25BC Bottom probabil: ';p1.appendChild(s1);
    p1.appendChild(document.createTextNode(labels[topBottom]+' \u2014 '+topBottomN+'/'+real.length+' eclipse (' +Math.round(topBottomN/real.length*100)+'%) au format bottom local la acest interval.'));
    ins.appendChild(p1);
  }
  if(topTop){
    var p2=document.createElement('p');p2.style.cssText='font-size:12px;color:var(--muted);margin-bottom:4px';
    var s2=document.createElement('strong');s2.style.color='var(--red)';s2.textContent='\u25B2 Top probabil: ';p2.appendChild(s2);
    p2.appendChild(document.createTextNode(labels[topTop]+' \u2014 '+topTopN+'/'+real.length+' eclipse ('+Math.round(topTopN/real.length*100)+'%) au format top local la acest interval.'));
    ins.appendChild(p2);
  }
  if(bestEntry&&agg[bestEntry]){
    var p3=document.createElement('p');p3.style.cssText='font-size:12px;color:var(--muted)';
    var s3=document.createElement('strong');s3.style.color=color;s3.textContent='Intrare optim\u0103: ';p3.appendChild(s3);
    p3.appendChild(document.createTextNode(labels[bestEntry]+' \u2014 pre\u021B mediu '+Math.abs(agg[bestEntry].avg).toFixed(1)+'% '+(agg[bestEntry].avg<0?'sub':'peste')+' pre\u021Bul eclipsei.'));
    ins.appendChild(p3);
  }
  box.appendChild(ins);el.appendChild(box);
}

/* Vertical line plugin for event marker */
const eventLinePlugin={
  id:'eventLine',
  afterDraw(chart){
    const idx=chart.config._eventIdx;
    if(idx==null)return;
    const meta=chart.getDatasetMeta(0);
    const pt=meta.data[idx];
    if(!pt)return;
    const ctx=chart.ctx;
    const y0=chart.chartArea.top;
    const y1=chart.chartArea.bottom;
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([4,4]);
    ctx.strokeStyle='rgba(255,255,255,.25)';
    ctx.lineWidth=1;
    ctx.moveTo(pt.x,y0);ctx.lineTo(pt.x,y1);
    ctx.stroke();
    /* label */
    ctx.fillStyle='rgba(255,255,255,.45)';
    ctx.font='500 9px JetBrains Mono';
    ctx.textAlign='center';
    ctx.fillText('EVENT',pt.x,y0+10);
    ctx.restore();
  }
};
Chart.register(eventLinePlugin);

/* Animated Chart.js line chart — modern */
function drawAnimatedChart(canvas,ev,lineColor){
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const pre=ev.pre||[];
  const post=ev.prices;
  const allPrices=[...pre,...post];
  const n=allPrices.length;
  const eventIdx=pre.length; /* where the event happens */
  /* Labels: -Xz ... EVENT ... S+1 S+2 ... */
  const labels=allPrices.map((_,i)=>{
    const rel=i-eventIdx;
    if(rel<0)return rel+'z';
    if(rel===0)return '▶';
    return 'S+'+rel;
  });
  /* Gradient: subtle, from color to transparent */
  const gradient=ctx.createLinearGradient(0,0,0,220);
  gradient.addColorStop(0,lineColor+'18');
  gradient.addColorStop(0.6,lineColor+'08');
  gradient.addColorStop(1,'transparent');
  /* Format price for Y-axis */
  function fmtPrice(v){
    if(v>=1000)return'$'+(v/1000).toFixed(v>=100000?0:v>=10000?0:1)+'K';
    return'$'+v;
  }
  const cfg={
    type:'line',
    data:{
      labels:labels,
      datasets:[{
        data:[allPrices[0]],
        borderColor:lineColor,
        backgroundColor:gradient,
        borderWidth:2.5,
        pointRadius:0,
        pointHoverRadius:5,
        pointHoverBackgroundColor:'#fff',
        pointHoverBorderColor:lineColor,
        pointHoverBorderWidth:2,
        fill:true,
        tension:.25,
        segment:{
          borderColor:c=>c.p0DataIndex<eventIdx&&c.p1DataIndex<=eventIdx?lineColor+'66':lineColor
        }
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      animation:false,
      layout:{padding:{top:16,right:4,bottom:0,left:4}},
      interaction:{mode:'index',intersect:false},
      scales:{
        x:{
          display:true,
          grid:{display:false},
          ticks:{
            color:c=>c.tick.label==='▶'?lineColor:'#475569',
            font:{family:'JetBrains Mono',size:9,weight:c=>c.tick&&c.tick.label==='▶'?'bold':'normal'},
            maxRotation:0,autoSkip:true,maxTicksLimit:9
          }
        },
        y:{
          type:'logarithmic',
          display:true,position:'right',
          grid:{color:'rgba(30,50,80,.35)',lineWidth:1,drawBorder:false},
          border:{display:false},
          ticks:{
            color:'#94a3b8',
            font:{family:'JetBrains Mono',size:10},
            padding:8,
            maxTicksLimit:6,
            callback:fmtPrice
          }
        }
      },
      plugins:{
        legend:{display:false},
        tooltip:{
          backgroundColor:'rgba(15,23,42,.92)',
          titleColor:'#e2e8f0',
          bodyColor:'#f1f5f9',
          titleFont:{family:'JetBrains Mono',size:10,weight:'500'},
          bodyFont:{family:'JetBrains Mono',size:12,weight:'600'},
          borderColor:'rgba(100,116,139,.3)',
          borderWidth:1,
          cornerRadius:8,
          padding:{x:10,y:8},
          displayColors:false,
          callbacks:{
            title:items=>{const l=items[0].label;return l==='▶'?'EVENIMENT':l.startsWith('-')?l.replace('z',' zile înainte'):'Săptămâna '+l.replace('S+','');},
            label:c=>fmtPrice(c.parsed.y)
          }
        }
      }
    }
  };
  cfg._eventIdx=eventIdx;
  const chart=new Chart(ctx,cfg);
  /* Progressive draw — fast ramp up */
  let i=1;
  const baseDelay=Math.floor(1400/n);
  const interval=setInterval(()=>{
    if(i>=n){
      clearInterval(interval);
      /* Show dots on event + start + end */
      chart.data.datasets[0].pointRadius=allPrices.map((_,j)=>j===eventIdx?5:j===0||j===n-1?3:0);
      chart.data.datasets[0].pointBackgroundColor=allPrices.map((_,j)=>j===eventIdx?lineColor:j===0?'#475569':'#fff');
      chart.data.datasets[0].pointBorderColor=allPrices.map((_,j)=>j===eventIdx?'#fff':'transparent');
      chart.data.datasets[0].pointBorderWidth=allPrices.map((_,j)=>j===eventIdx?2:0);
      chart.update('none');
      return;
    }
    chart.data.datasets[0].data.push(allPrices[i]);
    chart.update('none');
    i++;
  },baseDelay);
}

/* Initialize all concepts — eclipse types use compact table, others use chart cards */
Object.keys(CONCEPTS).forEach(k=>{
  const c=CONCEPTS[k];
  /* Sort eclipse events newest first */
  if(k==='solar'||k==='lunar'){
    c.events.sort((a,b)=>b.date.localeCompare(a.date));
  }
  buildMetrics('metrics-'+k,c.events);
  if(k==='solar'||k==='lunar'){
    buildEclipseTable('cards-'+k,c.events,c.color);
  }else{
    buildCards('cards-'+k,c.events,c.color);
  }
});
/* Re-observe dynamically created .reveal cards */
if(window._revealObs)document.querySelectorAll('.chart-card.reveal:not(.visible)').forEach(el=>window._revealObs.observe(el));
})();

/* ── Gann Time Cycles ── */
(function(){
  var GANN_INTERVALS=[
    {days:30,label:'30',deg:'30°',cat:'Short',desc:'1 lună'},
    {days:45,label:'45',deg:'45°',cat:'Short',desc:'1/8 cerc'},
    {days:49,label:'49',deg:'7²',cat:'Short',desc:'Square of 7'},
    {days:60,label:'60',deg:'60°',cat:'Short',desc:'1/6 cerc'},
    {days:90,label:'90',deg:'90°',cat:'Major',desc:'1/4 cerc — cel mai important short-term'},
    {days:120,label:'120',deg:'120°',cat:'Mid',desc:'1/3 cerc'},
    {days:144,label:'144',deg:'12²',cat:'Major',desc:'Square of 12 — "ciclu mort"'},
    {days:180,label:'180',deg:'180°',cat:'Major',desc:'1/2 cerc — cel mai puternic'},
    {days:270,label:'270',deg:'270°',cat:'Mid',desc:'3/4 cerc'},
    {days:360,label:'360',deg:'360°',cat:'Major',desc:'Cerc complet = 1 an'},
    {days:520,label:'520',deg:'2×260',cat:'Long',desc:'Square of Time'},
    {days:720,label:'720',deg:'2×360',cat:'Long',desc:'2 ani'},
    {days:1080,label:'1080',deg:'3×360',cat:'Long',desc:'3 ani'},
    {days:1440,label:'1440',deg:'4×360',cat:'Long',desc:'4 ani ≈ halving'}
  ];

  function fmtDate(d){var dd=d.getDate(),mm=d.getMonth()+1,yy=d.getFullYear();return(dd<10?'0':'')+dd+'.'+(mm<10?'0':'')+mm+'.'+yy;}
  function diffDays(from,to){return Math.round((to-from)/86400000);}

  function renderGannTable(containerId,anchorDate,anchorLabel){
    var el=document.getElementById(containerId);if(!el)return;
    var now=new Date();now.setHours(0,0,0,0);
    var anchor=new Date(anchorDate);anchor.setHours(0,0,0,0);
    var html='<div style="overflow-x:auto"><table class="method-table"><thead><tr><th>Interval</th><th>Grad</th><th>Data</th><th>Status</th><th style="font-size:9px">Ce reprezintă</th></tr></thead><tbody>';
    GANN_INTERVALS.forEach(function(g){
      var target=new Date(anchor.getTime()+g.days*86400000);
      var daysFromNow=diffDays(now,target);
      var isPast=daysFromNow<-3;
      var isNear=Math.abs(daysFromNow)<=7;
      var isFuture=daysFromNow>3;
      var isMajor=g.cat==='Major';
      var statusText=isPast?'Trecut':isNear?'ACUM':'în '+daysFromNow+'z';
      var statusColor=isNear?'var(--solar)':isPast?'var(--dim)':'var(--green)';
      var rowBg=isNear?'rgba(245,158,11,.08)':isMajor&&isFuture?'rgba(16,185,129,.03)':'transparent';
      var labelColor=isMajor?'var(--text)':'var(--muted)';
      html+='<tr style="background:'+rowBg+'">';
      html+='<td style="color:'+labelColor+';font-weight:'+(isMajor?'600':'400')+'" class="mono">'+g.label+'z'+(isMajor?' ★':'')+'</td>';
      html+='<td class="muted mono" style="font-size:11px">'+g.deg+'</td>';
      html+='<td class="mono" style="font-size:12px;color:var(--text)">'+fmtDate(target)+'</td>';
      html+='<td style="color:'+statusColor+';font-size:11px;font-family:var(--font-mono);font-weight:'+(isNear?'700':'400')+'">'+statusText+'</td>';
      html+='<td class="muted" style="font-size:10px">'+g.desc+'</td>';
      html+='</tr>';
    });
    html+='</tbody></table></div>';
    el.innerHTML=html;
  }

  /* Render preset tables */
  renderGannTable('gann-ath','2025-10-06','ATH $124,659');
  renderGannTable('gann-bottom','2022-11-21','Bottom FTX $15,781');

  /* Calculator */
  var calcBtn=document.getElementById('gann-calc');
  if(calcBtn){
    calcBtn.addEventListener('click',function(){
      calcBtn.style.transform='scale(.92)';
      setTimeout(function(){calcBtn.style.transform='';},120);
      var dateInput=document.getElementById('gann-date');
      var typeInput=document.getElementById('gann-type');
      if(!dateInput||!dateInput.value)return;
      var label=typeInput.value==='high'?'HIGH':'LOW';
      renderGannTable('gann-result',dateInput.value,label);
      document.getElementById('gann-result').scrollIntoView({behavior:'smooth',block:'center'});
    });
  }
})();

/* ── Reverse date-based tables (newest first) + next event badges ── */
(function(){
  /* Tables to reverse: find all method-table tbody that contain date-like content in first column */
  document.querySelectorAll('.method-table tbody').forEach(function(tbody){
    var rows=Array.from(tbody.querySelectorAll('tr'));
    if(rows.length<3)return;
    /* Check if first column has dates or chronological data */
    var firstCell=rows[0].querySelector('td');
    if(!firstCell)return;
    var txt=firstCell.textContent.trim();
    /* Skip non-date tables: scoring method table, quarterly, faze ciclu */
    if(txt.match(/Eclips|Halving|Ciclu|^#|^\d{4}|^20[12]/)){
      rows.reverse();
      rows.forEach(function(r){tbody.appendChild(r);});
    }
  });

  /* Add "next event" badges to sections with future dates */
  var nextEvents=[
    {id:'s-fib',text:'Urmator: Fib 1.618 — 24 Sep 2026'},
    {id:'s-blood',text:'Urmator: Blood Moon serie 2028–2029'},
    {id:'s-mercury',text:'Urmator: 29 Iun – 23 Iul 2026'},
    {id:'s-halving',text:'Urmator: Halving 5 — ~20 Apr 2028'},
    {id:'s-shmita',text:'Urmator: Sep 2028 – Sep 2029'},
    {id:'s-cycles',text:'Proiectie bottom: ~5 Oct 2026'},
    {id:'s-bear',text:'Proiectie bottom: $54K–$60K'}
  ];
  nextEvents.forEach(function(ne){
    var section=document.getElementById(ne.id);
    if(!section)return;
    var badge=document.createElement('span');
    badge.style.cssText='margin-left:12px;font-family:var(--font-mono);font-size:10px;font-weight:600;color:var(--accent);padding:2px 10px;border-radius:12px;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);letter-spacing:.3px;text-transform:none';
    badge.textContent=ne.text;
    /* Insert before the toggle button */
    var toggle=section.querySelector('.section-toggle');
    if(toggle)section.insertBefore(badge,toggle);
    else section.appendChild(badge);
  });
})();

/* ── Animation Suite: GSAP + Anime.js ── */
(function(){

  /* ── GSAP: Number counters for stat cards ── */
  if(typeof gsap!=='undefined'&&typeof ScrollTrigger!=='undefined'){
    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll('.stat .val[data-target]').forEach(el=>{
      const suffix=el.textContent.replace(/[\d]/g,'');
      const target=parseInt(el.dataset.target);
      const obj={n:0};
      el.textContent='0'+suffix;
      ScrollTrigger.create({
        trigger:el,start:'top 88%',once:true,
        onEnter:()=>gsap.to(obj,{
          n:target,
          duration:target>500?2.2:1.2,
          ease:'power2.out',
          onUpdate:()=>{el.textContent=Math.round(obj.n).toLocaleString()+suffix;}
        })
      });
    });

    /* ── GSAP: Score widget entrance ── */
    gsap.from('#score-widget-wrap',{
      duration:.7,y:22,opacity:0,ease:'back.out(1.4)',delay:.1,clearProps:'all'
    });

    /* ── GSAP: Apply glow class if active window ── */
    requestAnimationFrame(()=>{
      const sw=document.querySelector('#score-widget-wrap .score-widget');
      if(sw&&document.querySelector('.sw-active'))sw.classList.add('glow-active');
    });
  }

  /* ── Anime.js: Header badges stagger entrance ── */
  if(typeof anime!=='undefined'){
    anime({
      targets:'.badge',
      opacity:[0,1],translateY:[-8,0],
      delay:anime.stagger(70,{start:250}),
      duration:400,easing:'easeOutCubic'
    });

    /* ── Anime.js: Subnav links stagger ── */
    anime({
      targets:'.subnav-link',
      opacity:[0,1],translateY:[-5,0],
      delay:anime.stagger(40,{start:350}),
      duration:350,easing:'easeOutCubic'
    });

    /* ── Anime.js: Fibonacci timeline dots sequential reveal ── */
    const fibGrid=document.querySelector('#s-fib ~ .grid2');
    if(fibGrid){
      const dots=fibGrid.querySelectorAll('.tl-dot');
      dots.forEach(d=>{d.style.transform='scale(0)';d.style.opacity='0';});
      const fibObs=new IntersectionObserver(entries=>{
        if(entries[0].isIntersecting){
          fibObs.disconnect();
          anime({targets:dots,scale:[0,1],opacity:[0,1],delay:anime.stagger(65),duration:320,easing:'easeOutBack'});
        }
      },{threshold:.15});
      fibObs.observe(fibGrid);
    }
  }

})();
