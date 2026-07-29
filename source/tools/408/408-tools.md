---
title: 408 学习工具
layout: page
permalink: /tools/408/
menu_id: wiki
comments: false
---

<div class="k408-tools">
<h1>408 学习工具</h1>
<p class="k408-lead">考试进度与四科易混概念集中查看。数据均保存在当前浏览器。</p>

<section id="k408-countdown" class="k408-panel">
  <div class="k408-count-head">
    <div><h2 id="k408-count-title">距离 408 初试还有</h2><p class="k408-lead">可按当年官方安排修改时间，设置会在本机保存。</p></div>
    <label>考试时间 <input id="k408-exam-date" type="datetime-local"></label>
  </div>
  <div class="k408-clock">
    <div class="k408-unit"><b id="k408-days">--</b><span>天</span></div>
    <div class="k408-unit"><b id="k408-hours">--</b><span>时</span></div>
    <div class="k408-unit"><b id="k408-mins">--</b><span>分</span></div>
    <div class="k408-unit"><b id="k408-secs">--</b><span>秒</span></div>
  </div>
  <div class="k408-progress"><i id="k408-year-progress"></i></div>
  <div class="k408-stage"><span>当前建议：<strong id="k408-stage">--</strong></span><span id="k408-progress-text">--</span></div>
</section>

<section id="concepts" class="k408-panel">
  <h2>易混概念对比卡</h2>
  <p class="k408-lead">内置四科核心辨析卡，可按科目筛选或搜索概念。</p>
  <div class="k408-search">
    <input id="k408-concept-query" type="search" placeholder="搜索：缺页、死锁、TCP、B+ 树…">
    <select id="k408-subject"><option value="">全部科目</option><option>数据结构</option><option>计算机组成原理</option><option>操作系统</option><option>计算机网络</option></select>
  </div>
  <div id="k408-concepts" class="k408-card-grid"></div>
</section>
</div>
