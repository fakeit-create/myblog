/* Scroll-linked typography for FENG // LAB. Supports normal pages and Stellar PJAX. */
(() => {
'use strict';
let cleanup=()=>{};
function init(){
 cleanup();
 const home=document.getElementById('feng-home');
 if(!home || matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const items=[...home.querySelectorAll('[data-feng-scroll]')];
 let raf=0, lastY=scrollY;
 const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
 const paint=()=>{
  raf=0; const vh=Math.max(innerHeight,1), direction=scrollY>=lastY?1:-1; lastY=scrollY;
  for(const el of items){
   const r=el.getBoundingClientRect(), kind=el.dataset.fengScroll;
   let visible,scale,y;
   if(kind.startsWith('hero')){
    const out=clamp((vh*.22-r.top)/(vh*.82));
    visible=1-out; scale=1-out*(kind==='hero'?0.16:0.11); y=-out*(kind==='hero'?50:32);
   }else{
    const enter=clamp((vh-r.top)/(vh*.42));
    const leave=clamp((r.bottom)/(vh*.28));
    visible=Math.min(enter,leave);
    scale=.88+visible*.12;
    y=(1-visible)*36*(r.top>vh/2?1:-.45);
   }
   el.style.setProperty('--feng-scroll-opacity',String(.08+visible*.92));
   el.style.setProperty('--feng-scroll-scale',scale.toFixed(4));
   el.style.setProperty('--feng-scroll-y',y.toFixed(1)+'px');
   el.style.setProperty('--feng-scroll-blur',((1-visible)*3.5).toFixed(2)+'px');
  }
 };
 const request=()=>{if(!raf)raf=requestAnimationFrame(paint)};
 addEventListener('scroll',request,{passive:true});addEventListener('resize',request,{passive:true});
 const search=e=>{const b=e.target.closest('[data-feng-search]');if(!b)return;document.getElementById('feng-open')?.click()};
 home.addEventListener('click',search);paint();
 cleanup=()=>{removeEventListener('scroll',request);removeEventListener('resize',request);home.removeEventListener('click',search);if(raf)cancelAnimationFrame(raf)};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
document.addEventListener('pjax:complete',init);document.addEventListener('turbo:load',init);
new MutationObserver(()=>{if(document.getElementById('feng-home')&&!document.querySelector('#feng-home[data-motion-ready]')){document.getElementById('feng-home').dataset.motionReady='1';init()}}).observe(document.documentElement,{childList:true,subtree:true});
})();
