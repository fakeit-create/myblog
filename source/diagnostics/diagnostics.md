---
title: 功能诊断
layout: page
permalink: /diagnostics/
menu_id: explore
comments: false
indexing: false
---

<div class="k408-tools">
<h1>功能诊断页</h1>
<p class="k408-lead">检查博客关键资源、搜索索引、本地存储、重复 ID 和重复脚本。结果只显示在当前浏览器，不会上传。</p>
<section class="k408-panel">
  <button id="k408-run-diag" class="k408-run">重新诊断</button>
  <span id="k408-diag-time" class="k408-diag-note"></span>
  <div class="k408-summary">
    <div><b id="k408-ok">0</b><span>正常</span></div>
    <div><b id="k408-warn">0</b><span>警告</span></div>
    <div><b id="k408-bad">0</b><span>异常</span></div>
  </div>
  <div id="k408-checks" class="k408-checks"></div>
</section>
<p class="k408-diag-note">提示：Service Worker 未启用通常不影响博客使用；搜索索引或关键 JS/CSS 返回 404 才需要优先处理。</p>
</div>
