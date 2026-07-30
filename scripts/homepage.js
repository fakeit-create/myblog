/* FENG // LAB homepage for Hexo + Stellar. */
'use strict';
const escapeHtml = value => String(value == null ? '' : value)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const prettyPath = path => String(path || '').trim().replace(/^\/+/, '')
  .replace(/(?:^|\/)index\.html$/i, '')
  .replace(/\.html$/i, '/')
  .replace(/\/{2,}/g, '/');
const joinUrl = (root, path) => (String(root || '/').replace(/\/+$/, '') + '/' + prettyPath(path)).replace(/\/{2,}/g, '/');
hexo.extend.filter.register('after_render:html', function (html, data) {
  const route=String(data.path||'').replace(/^\/+|\/+$/g,'');
  if(route && route!=='index.html') return html;
  if(!html.includes('<div class="post-list post">') || html.includes('id="feng-home"')) return html;
  const root=this.config.root||'/';
  const posts=this.locals.get('posts').filter(p=>p.indexing!==false);
  const categories=this.locals.get('categories'), tags=this.locals.get('tags');
  const latest=posts.sort('-date').first(), latestUrl=latest?joinUrl(root,latest.path):root;
  const latestTitle=latest?latest.title:'开始阅读', year=new Date().getFullYear();
  const categoryLinks=categories.sort('name').limit(8).map(c=>`<a href="${joinUrl(root,c.path)}">${escapeHtml(c.name)}<span>${c.length||0}</span></a>`).join('') || '<span class="feng-empty">暂无分类</span>';
  const tagLinks=tags.sort('name').limit(12).map(t=>`<a href="${joinUrl(root,t.path)}"># ${escapeHtml(t.name)}</a>`).join('') || '<span class="feng-empty">暂无标签</span>';
  const home=`
<link rel="stylesheet" href="${root}css/homepage.css?v=2.0.0">
<script src="${root}js/homepage-motion.js?v=2.0.0" defer></script>
<section class="feng-home" id="feng-home" aria-labelledby="feng-home-title">
 <div class="feng-hero">
  <div class="feng-hero-inner">
   <div class="feng-hero-copy feng-scroll-text" data-feng-scroll="hero">
    <p class="feng-eyebrow"><span></span> WELCOME TO MY DIGITAL GARDEN</p>
    <h1 id="feng-home-title">Hi, I'm <em>Feng</em> <span class="feng-wave" aria-hidden="true">👋</span></h1>
    <p class="feng-lead">欢迎来到 FENG // LAB</p>
    <p class="feng-description">记录计算机技术、408 学习与创造过程。<br>在这里整理知识，也分享每一次探索。</p>
    <div class="feng-actions"><a class="feng-button primary" href="${escapeHtml(latestUrl)}">开始阅读 <span>→</span></a><a class="feng-button" href="${root}wiki/docs/">408 学习笔记</a></div>
    <div class="feng-social"><a href="https://github.com/fakeit-create" target="_blank" rel="noopener">GitHub</a><span>·</span><a href="${root}archives/">时光机</a><span>·</span><a href="${root}about/">关于我</a></div>
   </div>
   <div class="feng-profile-card feng-scroll-text" data-feng-scroll="hero-card">
    <div class="feng-profile-top"><div class="feng-avatar"><span>F</span></div><div><strong>Feng</strong><small>STUDENT · DEVELOPER</small></div><i class="feng-online"></i></div>
    <p>“保持好奇，持续构建。”</p><dl><div><dt>当前目标</dt><dd>计算机考研 408</dd></div><div><dt>关注领域</dt><dd>Web · CS · Linux</dd></div><div><dt>站点状态</dt><dd class="is-online">● Online</dd></div></dl>
    <div class="feng-terminal"><span>$</span> learning --every-day<i></i></div>
   </div>
  </div><a class="feng-scroll-cue" href="#feng-portals"><span>SCROLL</span><i></i></a>
 </div>

 <section class="feng-section" id="feng-portals">
  <div class="feng-section-head feng-scroll-text" data-feng-scroll="section"><div><p>CONTENT PORTALS</p><h2>内容入口</h2></div><span>02</span></div>
  <div class="feng-portal-grid">
   <a class="feng-portal wide feng-scroll-text" data-feng-scroll="card" href="${root}wiki/docs/"><i>01</i><div><small>408 STUDY</small><h3>408 学习专区</h3><p>四科系统笔记、跨科索引、历年真题与复习导航。</p></div><b>进入专区 ↗</b></a>
   <a class="feng-portal feng-scroll-text" data-feng-scroll="card" href="${root}explore/"><i>02</i><div><small>LEARNING TOOLS</small><h3>学习工具入口</h3><p>资源导航、番茄钟、专注模式与学习辅助工具。</p></div><b>打开 ↗</b></a>
   <a class="feng-portal feng-scroll-text" data-feng-scroll="card" href="${root}projects/"><i>03</i><div><small>PROJECTS</small><h3>项目展示</h3><p>个人项目、站点实验和开源作品。</p></div><b>查看 ↗</b></a>
   <div class="feng-portal feng-scroll-text" data-feng-scroll="card"><i>04</i><div><small>TECH STACK</small><h3>技术栈</h3><p class="feng-pills"><span>JavaScript</span><span>Hexo</span><span>Linux</span><span>C#</span><span>Caddy</span></p></div></div>
   <div class="feng-portal categories feng-scroll-text" data-feng-scroll="card"><i>05</i><div><small>TAXONOMY</small><h3>文章分类与标签</h3><div class="feng-category-links">${categoryLinks}</div><div class="feng-tag-links">${tagLinks}</div></div></div>
   <a class="feng-portal feng-scroll-text" data-feng-scroll="card" href="${root}about/"><i>06</i><div><small>ABOUT</small><h3>个人介绍</h3><p>关于我、建站初衷、关注方向和联系方式。</p></div><b>认识一下 ↗</b></a>
  </div>
 </section>

 <section class="feng-section feng-advanced" id="feng-advanced">
  <div class="feng-section-head feng-scroll-text" data-feng-scroll="section"><div><p>ADVANCED SYSTEM</p><h2>探索知识系统</h2></div><span>03</span></div>
  <div class="feng-advanced-grid">
   <button class="feng-advanced-card feng-scroll-text" data-feng-scroll="card" data-feng-search><span>⌕</span><div><h3>全站搜索</h3><p>搜索文章标题、正文和快捷命令</p></div><b>Ctrl K</b></button>
   <a class="feng-advanced-card feng-scroll-text" data-feng-scroll="card" href="${root}knowledge-map/?view=relations"><span>◌</span><div><h3>文章关系图</h3><p>按分类、标签查看文章之间的关联</p></div><b>打开 ↗</b></a>
   <a class="feng-advanced-card feng-scroll-text" data-feng-scroll="card" href="${root}knowledge-map/?view=knowledge"><span>◇</span><div><h3>知识图谱</h3><p>从 408 科目与技术主题探索内容</p></div><b>打开 ↗</b></a>
   <a class="feng-advanced-card feng-scroll-text" data-feng-scroll="card" href="${root}knowledge-map/?view=files"><span>▦</span><div><h3>文件管理器</h3><p>用目录树方式浏览全部文章</p></div><b>浏览 ↗</b></a>
   <a class="feng-advanced-card feng-scroll-text" data-feng-scroll="card" href="${escapeHtml(latestUrl)}"><span>↧</span><div><h3>阅读进度与目录</h3><p>文章顶部进度条、右侧目录和章节定位</p></div><b>体验 ↗</b></a>
  </div>
 </section>

 <div class="feng-stats feng-scroll-text" data-feng-scroll="section"><div><strong>${posts.length}</strong><span>篇文章</span></div><i></i><div><strong>${categories.length}</strong><span>个分类</span></div><i></i><div><strong>${tags.length}</strong><span>个标签</span></div><i></i><div><strong>${year}</strong><span>持续记录</span></div></div>
 <div class="feng-post-heading feng-scroll-text" data-feng-scroll="section"><div><p>RECENT WRITING</p><h2>最近文章</h2></div><a href="${root}archives/">查看全部 →</a></div>
</section>`;
  return html.replace('<div class="post-list post">',home+'\n<div class="post-list post">');
});
