(()=>{'use strict';
const TARGET=new Date(2026,11,19,8,30,0),KEY='k408:countdown:hidden',POS_KEY='k408:countdown:position';
const $=(s,r=document)=>r.querySelector(s);
function build(){
  if($('#k408-fixed-countdown'))return;
  const root=document.createElement('aside');
  root.id='k408-fixed-countdown';
  root.className='k408-fixed-countdown';
  root.setAttribute('aria-label','408 考试倒计时');
  root.innerHTML=`<button class="k408-count-toggle" type="button" aria-expanded="true" title="隐藏倒计时">−</button>
    <div class="k408-count-body">
      <div class="k408-count-label"><i></i><span>距离 2026 年 408 初试</span></div>
      <div class="k408-count-time" aria-live="off">
        <strong data-unit="days">---</strong><small>天</small><strong data-unit="hours">--</strong><small>时</small><strong data-unit="mins">--</strong><small>分</small><strong data-unit="secs">--</strong><small>秒</small>
      </div>
      <div class="k408-count-date">2026.12.19 · 08:30</div>
    </div>`;
  document.body.append(root);
  const button=$('.k408-count-toggle',root);
  const clampPosition=(x,y)=>{
    const width=root.offsetWidth||52,height=root.offsetHeight||40;
    return {
      x:Math.max(8,Math.min(x,Math.max(8,window.innerWidth-width-8))),
      y:Math.max(8,Math.min(y,Math.max(8,window.innerHeight-height-8)))
    };
  };
  const placeAtSavedPosition=position=>{
    if(!position)return;
    const rawX=Number(position.x),rawY=Number(position.y);
    const x=Number.isFinite(rawX)?rawX:8,y=Number.isFinite(rawY)?rawY:8;
    let targetX=x;
    // 保存的是收缩按钮的左上角。按钮位于屏幕右半侧时，展开面板向左伸展，
    // 避免仍从原坐标向右展开而超出屏幕。
    if(!root.classList.contains('is-hidden')&&x+26>window.innerWidth/2){
      targetX=x+52-root.offsetWidth;
    }
    const p=clampPosition(targetX,y);
    root.style.left=p.x+'px';root.style.top=p.y+'px';
    root.style.right='auto';root.style.bottom='auto';
  };
  const restorePosition=()=>{
    try{const saved=JSON.parse(localStorage.getItem(POS_KEY));if(saved){placeAtSavedPosition(saved);return true}}catch{}
    return false;
  };
  const resetPosition=()=>{
    root.style.removeProperty('left');root.style.removeProperty('top');
    root.style.removeProperty('right');root.style.removeProperty('bottom');
  };
  const setHidden=hidden=>{
    root.classList.toggle('is-hidden',hidden);
    button.textContent=hidden?'408':'−';
    button.title=hidden?'拖动可移动，点击显示倒计时':'隐藏倒计时';
    button.setAttribute('aria-expanded',String(!hidden));
    if(hidden){restorePosition()}else if(!restorePosition()){resetPosition()}
    try{localStorage.setItem(KEY,hidden?'1':'0')}catch{}
  };
  let hidden=false;try{hidden=localStorage.getItem(KEY)==='1'}catch{}
  setHidden(hidden);

  let drag=null,suppressClick=false;
  button.addEventListener('pointerdown',event=>{
    if(!root.classList.contains('is-hidden')||event.button!==0)return;
    const rect=root.getBoundingClientRect();
    drag={id:event.pointerId,startX:event.clientX,startY:event.clientY,left:rect.left,top:rect.top,moved:false};
    button.setPointerCapture(event.pointerId);
  });
  button.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    const dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;
    if(!drag.moved&&Math.hypot(dx,dy)<4)return;
    drag.moved=true;event.preventDefault();
    placeAtSavedPosition({x:drag.left+dx,y:drag.top+dy});
  });
  const finishDrag=event=>{
    if(!drag||event.pointerId!==drag.id)return;
    if(drag.moved){
      const rect=root.getBoundingClientRect(),position=clampPosition(rect.left,rect.top);
      placeAtSavedPosition(position);suppressClick=true;
      try{localStorage.setItem(POS_KEY,JSON.stringify(position))}catch{}
    }
    drag=null;
  };
  button.addEventListener('pointerup',finishDrag);
  button.addEventListener('pointercancel',finishDrag);
  button.addEventListener('click',()=>{
    if(suppressClick){suppressClick=false;return}
    setHidden(!root.classList.contains('is-hidden'));
  });
  window.addEventListener('resize',()=>{
    if(!root.classList.contains('is-hidden'))return;
    const rect=root.getBoundingClientRect(),position=clampPosition(rect.left,rect.top);
    placeAtSavedPosition(position);
    try{localStorage.setItem(POS_KEY,JSON.stringify(position))}catch{}
  });
  const draw=()=>{
    let seconds=Math.max(0,Math.floor((TARGET-Date.now())/1000));
    const values={days:Math.floor(seconds/86400),hours:Math.floor(seconds%86400/3600),mins:Math.floor(seconds%3600/60),secs:seconds%60};
    for(const [name,value] of Object.entries(values)){const el=$(`[data-unit="${name}"]`,root);if(el)el.textContent=String(value).padStart(name==='days'?1:2,'0')}
    if(seconds===0){const label=$('.k408-count-label span',root);if(label)label.textContent='2026 年 408 初试时间已到'}
  };
  draw();setInterval(draw,1000);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',build,{once:true}):build();
})();
