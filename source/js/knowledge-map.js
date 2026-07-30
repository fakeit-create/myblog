(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let dispose=()=>{};
async function init(){
 dispose();const app=$('#feng-knowledge-app');if(!app)return;
 let data;try{const r=await fetch('/knowledge-data.json');if(!r.ok)throw 0;data=await r.json()}catch{app.innerHTML='<div class="fkg-empty">知识数据加载失败，请重新生成并部署网站。</div>';return}
 const modes={relations:'文章关系图',knowledge:'知识图谱',files:'文件管理器'};
 let mode=new URLSearchParams(location.search).get('view')||'relations';if(!modes[mode])mode='relations';
 app.innerHTML=`<nav class="fkg-tabs">${Object.entries(modes).map(([k,v])=>`<button data-view="${k}">${v}</button>`).join('')}</nav><section class="fkg-panel"></section>`;
 const panel=$('.fkg-panel',app);let stop=()=>{};
 function select(next,push=true){stop();mode=next;$$('[data-view]',app).forEach(b=>b.classList.toggle('active',b.dataset.view===mode));if(push)history.replaceState(null,'',location.pathname+'?view='+mode);mode==='files'?files():graph(mode)}
 function $$(s,r=document){return[...r.querySelectorAll(s)]}
 function files(){
  const docs=data.documents, groups={全部:docs,'408 笔记':docs.filter(x=>x.type==='wiki'),'技术文章':docs.filter(x=>x.type==='article')};
  docs.forEach(d=>d.categories.forEach(c=>groups[c]||(groups[c]=docs.filter(x=>x.categories.includes(c)))));
  panel.innerHTML=`<div class="fkg-files"><aside class="fkg-tree">${Object.keys(groups).map((g,i)=>`<button class="${i?'':'active'}" data-group="${esc(g)}">▸ ${esc(g)} (${groups[g].length})</button>`).join('')}</aside><main class="fkg-list"></main></div>`;
  const list=$('.fkg-list',panel);const draw=g=>{const a=groups[g]||[];list.innerHTML=`<header><b>ROOT / ${esc(g)}</b><span>${a.length} 个项目</span></header>`+a.map(d=>`<a class="fkg-file" href="${esc(d.url)}"><i>${d.type==='wiki'?'▤':'◇'}</i><span>${esc(d.title)}</span><small>${esc(d.categories[0]||d.type)}</small></a>`).join('')};draw('全部');
  panel.onclick=e=>{const b=e.target.closest('[data-group]');if(!b)return;$$('[data-group]',panel).forEach(x=>x.classList.toggle('active',x===b));draw(b.dataset.group)};stop=()=>panel.onclick=null;
 }
 function graph(kind){
  panel.innerHTML='<div class="fkg-graph"><canvas></canvas><div class="fkg-tip"></div><div class="fkg-hint">拖拽移动 · 滚轮缩放 · 点击节点打开内容</div></div>';
  const wrap=$('.fkg-graph',panel),canvas=$('canvas',wrap),tip=$('.fkg-tip',wrap),ctx=canvas.getContext('2d');
  let nodes=[],links=[];const docs=data.documents.slice(0,100), byId=new Map();
  if(kind==='relations'){nodes=docs.map((d,i)=>({...d,x:0,y:0,r:d.type==='wiki'?6:5,group:d.categories[0]||'其他'}));byId=new Map(nodes.map((n,i)=>[n.id,i]));links=data.links.filter(l=>byId.has(l.source)&&byId.has(l.target)).slice(0,260).map(l=>({a:byId.get(l.source),b:byId.get(l.target)}))}
  else {const names=[...new Set(docs.flatMap(d=>[...d.categories,...d.tags]))].slice(0,70);nodes=[...names.map(n=>({id:'g:'+n,title:n,type:'group',group:n,x:0,y:0,r:7})),...docs.map(d=>({...d,x:0,y:0,r:4,group:d.categories[0]||'其他'}))];byId=new Map(nodes.map((n,i)=>[n.id,i]));const gmap=new Map(names.map(n=>[n,byId.get('g:'+n)]));docs.forEach(d=>[...d.categories,...d.tags].forEach(g=>{if(gmap.has(g))links.push({a:gmap.get(g),b:byId.get(d.id)})}))}
  let w=0,h=0,dpr=1,panX=0,panY=0,zoom=1,drag=null,hover=-1,frame=0;
  const color=n=>n.type==='group'?'#ad8cff':n.type==='wiki'?'#67d9a4':'#7ca7ff';
  function resize(){const r=wrap.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);if(!nodes.some(n=>n.x)){nodes.forEach((n,i)=>{const a=i*2.399,r=Math.min(w,h)*(.12+.34*Math.sqrt((i+1)/nodes.length));n.x=w/2+Math.cos(a)*r;n.y=h/2+Math.sin(a)*r})}draw()}
  function draw(){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.save();ctx.translate(panX,panY);ctx.scale(zoom,zoom);ctx.strokeStyle='rgba(103,170,205,.18)';ctx.lineWidth=1/zoom;ctx.beginPath();links.forEach(l=>{const a=nodes[l.a],b=nodes[l.b];if(a&&b){ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y)}});ctx.stroke();nodes.forEach((n,i)=>{ctx.beginPath();ctx.fillStyle=color(n);ctx.globalAlpha=i===hover?1:.78;ctx.arc(n.x,n.y,n.r+(i===hover?2:0),0,Math.PI*2);ctx.fill()});ctx.globalAlpha=1;ctx.restore()}
  const point=e=>({x:(e.offsetX-panX)/zoom,y:(e.offsetY-panY)/zoom});const hit=e=>{const p=point(e);let best=-1,dist=14/zoom;nodes.forEach((n,i)=>{const d=Math.hypot(n.x-p.x,n.y-p.y);if(d<Math.max(dist,n.r+5/zoom)){best=i;dist=d}});return best};
  canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,px:panX,py:panY,moved:false}};canvas.onpointermove=e=>{if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved|=Math.abs(dx)+Math.abs(dy)>3;panX=drag.px+dx;panY=drag.py+dy;draw();return}hover=hit(e);tip.style.display=hover<0?'none':'block';if(hover>=0){tip.textContent=nodes[hover].title;tip.style.left=Math.min(w-250,e.offsetX+12)+'px';tip.style.top=Math.max(8,e.offsetY-32)+'px'}draw()};canvas.onpointerup=e=>{if(drag&&!drag.moved){const i=hit(e);if(i>=0&&nodes[i].url)location.href=nodes[i].url}drag=null};canvas.onpointerleave=()=>{hover=-1;tip.style.display='none';draw()};canvas.onwheel=e=>{e.preventDefault();const old=zoom,f=e.deltaY<0?1.12:.89;zoom=Math.max(.5,Math.min(2.6,zoom*f));panX=e.offsetX-(e.offsetX-panX)*zoom/old;panY=e.offsetY-(e.offsetY-panY)*zoom/old;draw()};
  addEventListener('resize',resize,{passive:true});resize();stop=()=>{removeEventListener('resize',resize);canvas.onpointerdown=canvas.onpointermove=canvas.onpointerup=canvas.onpointerleave=canvas.onwheel=null;cancelAnimationFrame(frame)};
 }
 app.onclick=e=>{const b=e.target.closest('[data-view]');if(b)select(b.dataset.view)};select(mode,false);dispose=()=>{stop();app.onclick=null};
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();document.addEventListener('pjax:complete',init);
})();
