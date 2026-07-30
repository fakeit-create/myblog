/* Scroll-linked typography for FENG // LAB. */
(() => {
'use strict';
let teardown=()=>{};
function init(){
 teardown();
 const home=document.getElementById('feng-home');
 if(!home)return;
 home.dataset.motionReady='1';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const items=[...home.querySelectorAll('[data-feng-scroll]')];
 if(reduced){items.forEach(el=>el.classList.add('is-in-view'));return;}
 let raf=0;
 const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
 const paint=()=>{
  raf=0;
  const vh=Math.max(innerHeight,1);
  for(const el of items){
   const r=el.getBoundingClientRect(),kind=el.dataset.fengScroll||'card';
   let progress=1,scale=1,y=0;
   if(kind.startsWith('hero')){
    const leave=clamp((-r.top)/(vh*.72));
    progress=1-leave; scale=1-leave*(kind==='hero'?0.08:0.055); y=-leave*(kind==='hero'?36:24);
   }else{
    const enter=clamp((vh-r.top)/(vh*.34));
    const leave=clamp(r.bottom/(vh*.18));
    progress=Math.min(enter,leave);
    scale=.96+progress*.04;
    y=(1-progress)*(r.top>vh*.5?22:-10);
   }
   el.style.setProperty('--feng-scroll-opacity',(0.18+progress*.82).toFixed(3));
   el.style.setProperty('--feng-scroll-scale',scale.toFixed(4));
   el.style.setProperty('--feng-scroll-y',y.toFixed(1)+'px');
   el.style.setProperty('--feng-scroll-blur',((1-progress)*1.6).toFixed(2)+'px');
  }
 };
 const request=()=>{if(!raf)raf=requestAnimationFrame(paint)};
 const click=e=>{if(e.target.closest('[data-feng-search]'))document.getElementById('feng-open')?.click()};
 addEventListener('scroll',request,{passive:true});
 addEventListener('resize',request,{passive:true});
 home.addEventListener('click',click);
 paint();
 teardown=()=>{removeEventListener('scroll',request);removeEventListener('resize',request);home.removeEventListener('click',click);if(raf)cancelAnimationFrame(raf)};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
document.addEventListener('pjax:complete',init);
document.addEventListener('turbo:load',init);
})();
