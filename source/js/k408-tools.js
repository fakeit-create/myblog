(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const concepts=[
['数据结构','栈','队列','只允许一端插入删除，后进先出（LIFO）。','一端插入、另一端删除，先进先出（FIFO）。','题目问操作受限位置与元素离开顺序。'],
['数据结构','B 树','所有叶结点同层；结点存关键字和记录定位信息，适合磁盘索引。','B+ 树','记录通常只在叶结点；叶结点有序链接，更适合范围查询。','不要把 B+ 树非叶结点中的关键字当作完整记录。'],
['数据结构','DFS','沿一条路径深入后回溯；常用栈或递归。','BFS','按层扩展；常用队列；无权图可求最短路径。','遍历序列取决于邻接点访问次序。'],
['数据结构','Prim','从一个顶点逐步扩展生成树，偏向选跨割最小边。','Kruskal','全局按边权选边，用并查集避免成环。','两者都求无向连通带权图的最小生成树。'],
['计算机组成原理','Cache 缺失','所需主存块未在 Cache，通常由硬件处理并装入。','缺页','所需页面不在内存，触发异常，由操作系统调页。','Cache 与页表/TLB 所在层次和处理主体不同。'],
['计算机组成原理','中断','通常来自 CPU 外部且异步，如 I/O 完成。','异常','通常由当前指令执行引起且同步，如缺页、除零。','广义中断有时包含异常，答题先看教材和题设口径。'],
['计算机组成原理','RISC','指令较规整，寻址方式少，强调流水线友好。','CISC','指令与寻址方式较丰富，单条指令功能可更复杂。','现代处理器常融合两者思想，不能只凭指令长度判断。'],
['计算机组成原理','组合逻辑控制器','由逻辑电路直接产生控制信号，速度快、修改困难。','微程序控制器','由微指令解释产生控制信号，规整、易扩展但有控制存储访问。','不要简单等同于 RISC 与 CISC，只能说存在常见倾向。'],
['操作系统','进程','资源分配和保护的基本单位，拥有独立地址空间。','线程','处理机调度的基本单位，同进程线程共享多数资源。','不同系统实现有差异；408 通常按上述经典模型。'],
['操作系统','死锁预防','破坏死锁四个必要条件之一，策略较静态。','死锁避免','动态检查分配后是否仍处于安全状态，如银行家算法。','安全状态一定无死锁；不安全状态不等于已经死锁。'],
['操作系统','分页','页面大小固定，地址空间一维，可能有内部碎片。','分段','段长可变，按逻辑模块划分，可能有外部碎片。','段页式先分段再分页，兼顾逻辑保护与离散分配。'],
['操作系统','用户态','权限受限，不能直接执行特权指令。','内核态','可执行特权指令并访问受保护资源。','系统调用会主动陷入内核态；函数调用不一定切换状态。'],
['计算机网络','交换机','典型工作在数据链路层，依据 MAC 地址转发帧。','路由器','工作在网络层，依据 IP 路由表转发分组。','三层交换机具备路由能力，题目仍要按设备功能判断。'],
['计算机网络','流量控制','防止发送方压垮接收方，关注端到端接收能力。','拥塞控制','防止过多流量压垮网络，关注网络负载。','TCP 接收窗口用于流控，拥塞窗口用于拥塞控制。'],
['计算机网络','ARP','根据同一链路上的目标 IPv4 地址解析 MAC 地址。','DNS','将域名解析为 IP 地址等资源记录。','ARP 不负责跨路由器解析远端主机 MAC。'],
['计算机网络','TCP','面向连接、可靠字节流、有流控和拥塞控制。','UDP','无连接、尽力而为、面向报文、首部开销小。','UDP 不保证可靠，但应用层可自行实现可靠机制。']];
function countdown(){let root=$('#k408-countdown');if(!root)return;let input=$('#k408-exam-date'),saved='k408:countdown:date',now0=new Date(),year=now0.getFullYear();if(now0>new Date(year+'-12-26T08:30'))year++;let def=localStorage.getItem(saved)||year+'-12-26T08:30';input.value=def;input.onchange=()=>{localStorage.setItem(saved,input.value);draw()};function draw(){let target=new Date(input.value),now=new Date(),ms=target-now;if(!Number.isFinite(target.getTime()))return;if(ms<=0){$('#k408-count-title').textContent='设定的考试时间已到';ms=0}else $('#k408-count-title').textContent='距离 408 初试还有';let sec=Math.floor(ms/1000),v=[Math.floor(sec/86400),Math.floor(sec%86400/3600),Math.floor(sec%3600/60),sec%60];['days','hours','mins','secs'].forEach((x,i)=>$('#k408-'+x).textContent=String(v[i]).padStart(i?2:1,'0'));let examYear=target.getFullYear(),start=new Date(examYear,0,1),total=target-start,used=Math.max(0,Math.min(total,now-start)),pct=total>0?used/total*100:0;$('#k408-year-progress').style.width=pct.toFixed(1)+'%';let days=v[0],stage=days>240?'基础阶段':days>150?'强化阶段':days>60?'真题阶段':'冲刺阶段';$('#k408-stage').textContent=stage;$('#k408-progress-text').textContent=pct.toFixed(1)+'%'}draw();setInterval(draw,1000)}
function cards(){let root=$('#k408-concepts');if(!root)return,q=$('#k408-concept-query'),f=$('#k408-subject');function draw(){let w=q.value.trim().toLowerCase(),sub=f.value,a=concepts.filter(x=>(!sub||x[0]===sub)&&(!w||x.join(' ').toLowerCase().includes(w)));root.innerHTML=a.length?a.map(x=>`<article class="k408-concept"><header><b>${esc(x[1])} vs ${esc(x[3])}</b><span>${esc(x[0])}</span></header><div class="k408-vs"><section class="k408-side"><h3>${esc(x[1])}</h3><p>${esc(x[2])}</p></section><section class="k408-side"><h3>${esc(x[3])}</h3><p>${esc(x[4])}</p></section></div><p class="k408-tip">辨析：${esc(x[5])}</p></article>`).join(''):'<div class="k408-empty">没有匹配的概念，换个关键词试试。</div>'}q.oninput=draw;f.onchange=draw;draw()}
document.addEventListener('DOMContentLoaded',()=>{countdown();cards()});})();
