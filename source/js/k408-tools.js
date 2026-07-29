(()=>{'use strict';
const TARGET=new Date(2026,11,19,8,30,0),KEY='k408:countdown:hidden';
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
  const setHidden=hidden=>{
    root.classList.toggle('is-hidden',hidden);
    button.textContent=hidden?'408':'−';
    button.title=hidden?'显示 408 倒计时':'隐藏倒计时';
    button.setAttribute('aria-expanded',String(!hidden));
    try{localStorage.setItem(KEY,hidden?'1':'0')}catch{}
  };
  let hidden=false;try{hidden=localStorage.getItem(KEY)==='1'}catch{}
  setHidden(hidden);
  button.addEventListener('click',()=>setHidden(!root.classList.contains('is-hidden')));
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
