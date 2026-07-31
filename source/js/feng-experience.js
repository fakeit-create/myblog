/* FENG // LAB — AnZhiYu-inspired interaction layer for Stellar. */
(() => {
'use strict';
const D=document,W=window,ROOT='.l_body',MAIN='#main';
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const cleanUrl=value=>{const u=new URL(value||'/',location.href);if(u.origin===location.origin)u.pathname=u.pathname.replace(/(?:^|\/)index\.html$/i,'/').replace(/\.html$/i,'/').replace(/\/{2,}/g,'/');return u.pathname+u.search+u.hash};
const samePage=url=>url.origin===location.origin&&url.pathname===location.pathname&&url.search===location.search;
const eligible=a=>{
 if(!a||a.target||a.download||a.hasAttribute('data-no-pjax')||a.closest('[data-no-pjax],#feng-command,#feng-knowledge-app'))return false;
 const raw=a.getAttribute('href');if(!raw||/^(#|mailto:|tel:|javascript:)/i.test(raw))return false;
 const u=new URL(a.href,location.href);return u.origin===location.origin&&!/\.(?:pdf|zip|rar|7z|png|jpe?g|gif|webp|svg|mp3|mp4)(?:$|[?#])/i.test(u.pathname);
};
let pageController=new AbortController(),navController=new AbortController(),navigating=false,lastY=scrollY,navRAF=0;
const dispatch=name=>D.dispatchEvent(new CustomEvent(name));
const currentMain=()=>D.querySelector(MAIN);

function setBusy(on){D.documentElement.classList.toggle('feng-navigating',on);D.body?.setAttribute('aria-busy',String(on));}
function restoreScripts(root){root.querySelectorAll('script').forEach(old=>{const s=D.createElement('script');[...old.attributes].forEach(a=>s.setAttribute(a.name,a.value));s.textContent=old.textContent;old.replaceWith(s)})}
function syncHead(doc){
 D.title=doc.title;
 ['meta[name="description"]','link[rel="canonical"]'].forEach(sel=>{const old=D.querySelector(sel),fresh=doc.querySelector(sel);if(old&&fresh){[...old.attributes].forEach(a=>old.removeAttribute(a.name));[...fresh.attributes].forEach(a=>old.setAttribute(a.name,a.value))}})
}
async function swap(url,push=true){
 if(navigating)return;navigating=true;setBusy(true);dispatch('pjax:send');
 const old=currentMain();
 try{
  const res=await fetch(url.href,{headers:{'X-Requested-With':'FENG-PJAX'},credentials:'same-origin'});if(!res.ok)throw new Error('HTTP '+res.status);
  const text=await res.text(),doc=new DOMParser().parseFromString(text,'text/html'),fresh=doc.querySelector(MAIN);
  if(!fresh)throw new Error('Missing #main');
  const replace=()=>{syncHead(doc);old.replaceWith(fresh);restoreScripts(fresh);D.body.className=doc.body.className;if(push)history.pushState({fengPjax:1},'',url.href);scrollTo(0,0)};
  if(D.startViewTransition&&!reduced())await D.startViewTransition(replace).finished;else replace();
  dispatch('pjax:complete');dispatch('feng:page-ready');
 }catch(err){console.warn('[FENG PJAX] fallback:',err);location.href=url.href;return}
 finally{navigating=false;setBusy(false)}
}
function bindNavigation(){
 D.addEventListener('click',e=>{if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const a=e.target.closest('a');if(!eligible(a))return;const u=new URL(a.href,location.href);if(samePage(u)){if(u.hash){e.preventDefault();D.getElementById(decodeURIComponent(u.hash.slice(1)))?.scrollIntoView({behavior:'smooth'})}return}e.preventDefault();swap(u,true)}, {signal:navController.signal});
 addEventListener('popstate',()=>swap(new URL(location.href),false),{signal:navController.signal});
}

function ensureDock(){
 let dock=D.querySelector('#feng-reader-dock');if(dock)return dock;
 dock=D.createElement('aside');dock.id='feng-reader-dock';dock.setAttribute('aria-label','阅读工具');dock.innerHTML=`<button class="feng-dock-main" data-feng-action="top" title="返回顶部"><svg viewBox="0 0 42 42"><circle cx="21" cy="21" r="18"></circle><circle class="meter" cx="21" cy="21" r="18"></circle></svg><b>0</b></button><div class="feng-dock-tools"><button data-feng-action="toc" title="文章目录">☷</button><button data-feng-action="focus" title="专注阅读">◫</button><button data-feng-action="theme" title="切换主题">◐</button></div>`;D.body.append(dock);return dock
}
function initReader(signal){
 const dock=ensureDock(),article=D.querySelector('article.md-text,.md-text.content'),main=dock.querySelector('.feng-dock-main'),num=main.querySelector('b'),meter=main.querySelector('.meter');
 dock.classList.toggle('has-article',!!article);let raf=0;
 const paint=()=>{raf=0;const max=Math.max(1,D.documentElement.scrollHeight-innerHeight),p=Math.max(0,Math.min(100,scrollY/max*100));num.textContent=Math.round(p);meter.style.strokeDashoffset=String(113.1*(1-p/100));dock.classList.toggle('is-visible',scrollY>180);dock.classList.toggle('is-end',p>92)};
 const req=()=>{if(!raf)raf=requestAnimationFrame(paint)};addEventListener('scroll',req,{passive:true,signal});addEventListener('resize',req,{passive:true,signal});paint();
 dock.onclick=e=>{const action=e.target.closest('[data-feng-action]')?.dataset.fengAction;if(!action)return;
  if(action==='top')scrollTo({top:0,behavior:'smooth'});
  if(action==='toc')toggleMobileToc();
  if(action==='focus'){D.body.classList.toggle('feng-focus-mode');dock.querySelector('[data-feng-action="focus"]').classList.toggle('active',D.body.classList.contains('feng-focus-mode'))}
  if(action==='theme'){const dark=D.documentElement.getAttribute('data-theme')==='dark';D.documentElement.setAttribute('data-theme',dark?'light':'dark');try{localStorage.setItem('feng-theme-v1',dark?'light':'dark')}catch(_){}}
 };
}
function toggleMobileToc(){
 let sheet=D.querySelector('#feng-mobile-toc');if(!sheet){sheet=D.createElement('div');sheet.id='feng-mobile-toc';sheet.innerHTML='<button class="feng-toc-mask" aria-label="关闭目录"></button><section><header><b>文章目录</b><button aria-label="关闭">×</button></header><nav></nav></section>';D.body.append(sheet)}
 const source=D.querySelector('#data-toc .toc, .widget-wrapper.toc .toc, .toc-content');const nav=sheet.querySelector('nav');nav.innerHTML=source?source.outerHTML:'<p>当前页面没有目录</p>';sheet.classList.toggle('open');
 sheet.onclick=e=>{if(e.target.matches('.feng-toc-mask,header button'))sheet.classList.remove('open');if(e.target.closest('a'))setTimeout(()=>sheet.classList.remove('open'),80)};
}
function initNav(signal){
 const nav=D.querySelector('.l_main .logo-wrap, .l_main > header, .navbar');if(!nav)return;nav.classList.add('feng-smart-nav');lastY=scrollY;
 const onScroll=()=>{if(navRAF)return;navRAF=requestAnimationFrame(()=>{navRAF=0;const y=scrollY,d=y-lastY;if(y<90)nav.classList.remove('is-hidden');else if(d>8&&!D.body.classList.contains('feng-menu-open'))nav.classList.add('is-hidden');else if(d<-5)nav.classList.remove('is-hidden');lastY=y})};addEventListener('scroll',onScroll,{passive:true,signal});
}
function initToc(signal){
 D.addEventListener('click',e=>{const a=e.target.closest('#data-toc a[href*="#"],.toc-content a[href*="#"]');if(!a)return;let u;try{u=new URL(a.href,location.href)}catch(_){return}if(!samePage(u)||!u.hash)return;const id=decodeURIComponent(u.hash.slice(1)),target=D.getElementById(id);if(!target)return;e.preventDefault();target.scrollIntoView({behavior:reduced()?'auto':'smooth',block:'start'});history.replaceState(history.state,'',u.hash)}, {signal});
 const article=D.querySelector('article.md-text,.md-text.content'),links=[...D.querySelectorAll('#data-toc a.toc-link,.toc-content a.toc-link')];if(!article||!links.length)return;const heads=[...article.querySelectorAll('h1[id],h2[id],h3[id],h4[id]')];if(!heads.length)return;
 const map=new Map(links.map(a=>[decodeURIComponent(a.hash.slice(1)),a]));const io=new IntersectionObserver(entries=>{const hit=entries.filter(x=>x.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];if(!hit)return;links.forEach(a=>a.classList.remove('feng-active'));const a=map.get(hit.target.id);a?.classList.add('feng-active');if(a){const pane=a.closest('.toc-content,#data-toc,.widget-wrapper.toc');if(pane&&pane.scrollHeight>pane.clientHeight){const top=a.offsetTop-pane.offsetTop,bottom=top+a.offsetHeight;if(top<pane.scrollTop)pane.scrollTop=top;else if(bottom>pane.scrollTop+pane.clientHeight)pane.scrollTop=bottom-pane.clientHeight}}},{rootMargin:'-18% 0px -68% 0px'});heads.forEach(h=>io.observe(h));signal.addEventListener('abort',()=>io.disconnect(),{once:true});
}
function initImages(signal){
 D.querySelectorAll('article img:not([loading]),.md-text img:not([loading])').forEach(img=>{img.loading='lazy';img.decoding='async';img.classList.add('feng-zoomable')});
 let light=D.querySelector('#feng-lightbox');if(!light){light=D.createElement('dialog');light.id='feng-lightbox';light.innerHTML='<button aria-label="关闭大图">×</button><img alt=""><p></p>';D.body.append(light);light.onclick=e=>{if(e.target===light||e.target.closest('button'))light.close()}}
 D.addEventListener('click',e=>{const img=e.target.closest('article img,.md-text img');if(!img||img.closest('a'))return;e.preventDefault();light.querySelector('img').src=img.currentSrc||img.src;light.querySelector('img').alt=img.alt||'';light.querySelector('p').textContent=img.alt||'';light.showModal()},{signal});
}
function initCode(){D.querySelectorAll('figure.highlight,pre:has(> code)').forEach(box=>{if(box.tagName==='PRE'&&box.closest('figure.highlight'))return;if(box.dataset.fengCode)return;box.dataset.fengCode='1';const code=box.querySelector('code'),lang=[...box.classList,...(code?[...code.classList]:[])].find(x=>/^(?:language-|lang-)/.test(x))?.replace(/^(?:language-|lang-)/,'')||box.getAttribute('data-language');if(lang){const badge=D.createElement('span');badge.className='feng-code-lang';badge.textContent=lang.toUpperCase();box.append(badge)}const long=box.scrollHeight>420||box.querySelectorAll('.line').length>18;if(!long)return;box.classList.add('feng-code-collapsed');const btn=D.createElement('button');btn.type='button';btn.className='feng-code-toggle';btn.textContent='展开代码';btn.setAttribute('aria-expanded','false');btn.onclick=e=>{e.preventDefault();e.stopPropagation();const open=box.classList.toggle('is-open');btn.setAttribute('aria-expanded',String(open));btn.textContent=open?'收起代码':'展开代码';if(open)box.style.setProperty('max-height','none','important');else box.style.removeProperty('max-height')};box.append(btn)})}
async function initRelated(signal){
 const article=D.querySelector('article.md-text,.md-text.content');if(!article||D.querySelector('.feng-related'))return;let path='';try{const r=await fetch('/search.json',{signal});if(!r.ok)return;const j=await r.json(),all=Array.isArray(j)?j:(j.posts||[]),words=(D.title+' '+article.querySelector('h1')?.textContent).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(x=>x.length>1);const rows=all.filter(x=>{const u=new URL(x.url||x.path||'/',location.href);return u.pathname!==location.pathname}).map(x=>({...x,score:words.reduce((n,w)=>n+((x.title||'').toLowerCase().includes(w)?3:0)+((x.content||'').toLowerCase().includes(w)?1:0),0)})).sort((a,b)=>b.score-a.score).slice(0,3);if(!rows.length)return;
 const sec=D.createElement('section');sec.className='feng-related';sec.innerHTML='<header><small>CONTINUE EXPLORING</small><h2>相关文章</h2></header><div>'+rows.map(x=>`<a href="${cleanUrl(x.url||x.path)}"><span>ARTICLE</span><b>${x.title||'未命名文章'}</b><i>→</i></a>`).join('')+'</div>';article.after(sec)
 }catch(e){if(e.name!=='AbortError')console.debug('[related]',e)}
}
function initPage(){pageController.abort();pageController=new AbortController();const s=pageController.signal;initReader(s);initNav(s);initToc(s);initImages(s);initCode();initRelated(s)}
function boot(){bindNavigation();initPage();D.documentElement.dataset.fengExperience='1.0.2'}
D.readyState==='loading'?D.addEventListener('DOMContentLoaded',boot,{once:true}):boot();D.addEventListener('pjax:complete',initPage);
})();
