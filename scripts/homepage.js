/* FENG // LAB homepage example for Hexo + Stellar.
 * Adds a lightweight personal landing section before the original post list.
 * The original articles, pagination and theme layout remain untouched.
 */
'use strict';

const escapeHtml = value => String(value == null ? '' : value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

hexo.extend.filter.register('after_render:html', function (html, data) {
  const route = String(data.path || '').replace(/^\/+|\/+$/g, '');
  if (route && route !== 'index.html') return html;
  if (!html.includes('<div class="post-list post">') || html.includes('id="feng-home"')) return html;

  const posts = this.locals.get('posts').filter(post => post.indexing !== false);
  const categories = this.locals.get('categories');
  const tags = this.locals.get('tags');
  const latest = posts.sort('-date').first();
  const latestUrl = latest ? this.config.root + latest.path : this.config.root;
  const latestTitle = latest ? latest.title : '开始阅读';
  const year = new Date().getFullYear();

  const home = `
<link rel="stylesheet" href="${this.config.root}css/homepage.css?v=1.0.0">
<section class="feng-home" id="feng-home" aria-labelledby="feng-home-title">
  <div class="feng-hero">
    <div class="feng-hero-inner">
    <div class="feng-hero-copy">
      <p class="feng-eyebrow"><span></span> WELCOME TO MY DIGITAL GARDEN</p>
      <h1 id="feng-home-title">Hi, I'm <em>Feng</em> <span class="feng-wave" aria-hidden="true">👋</span></h1>
      <p class="feng-lead">欢迎来到 FENG // LAB</p>
      <p class="feng-description">记录计算机技术、408 学习与创造过程。<br>在这里整理知识，也分享每一次探索。</p>
      <div class="feng-actions">
        <a class="feng-button primary" href="${escapeHtml(latestUrl)}">开始阅读 <span aria-hidden="true">→</span></a>
        <a class="feng-button" href="${this.config.root}wiki/docs/">408 学习笔记</a>
      </div>
      <div class="feng-social" aria-label="站点链接">
        <a href="https://github.com/fakeit-create" target="_blank" rel="noopener">GitHub</a>
        <span>·</span><a href="${this.config.root}archives/">时光机</a>
        <span>·</span><a href="${this.config.root}friends/">社交</a>
      </div>
    </div>
    <div class="feng-profile-card" aria-label="个人状态">
      <div class="feng-profile-top">
        <div class="feng-avatar" aria-hidden="true"><span>F</span></div>
        <div><strong>Feng</strong><small>STUDENT · DEVELOPER</small></div>
        <i class="feng-online" title="持续更新"></i>
      </div>
      <p>“保持好奇，持续构建。”</p>
      <dl>
        <div><dt>当前目标</dt><dd>计算机考研 408</dd></div>
        <div><dt>关注领域</dt><dd>Web · CS · Linux</dd></div>
        <div><dt>站点状态</dt><dd class="is-online">● Online</dd></div>
      </dl>
      <div class="feng-terminal" aria-hidden="true"><span>$</span> learning --every-day<i></i></div>
    </div>
    </div>
    <a class="feng-scroll-cue" href="#feng-about" aria-label="向下滚动查看关于我"><span>SCROLL</span><i></i></a>
  </div>

  <section class="feng-section" id="feng-about" aria-labelledby="feng-about-title">
    <div class="feng-section-head">
      <div><p>ABOUT ME</p><h2 id="feng-about-title">认识一下</h2></div>
      <span>01</span>
    </div>
    <div class="feng-bento">
      <a class="feng-card feng-featured" href="${this.config.root}wiki/docs/">
        <span class="feng-card-icon blue" aria-hidden="true">⌘</span>
        <div><small>FEATURED</small><h3>408 学习笔记</h3><p>数据结构、计算机组成原理、操作系统与计算机网络的系统化记录。</p></div>
        <b aria-hidden="true">↗</b>
      </a>
      <a class="feng-card" href="${this.config.root}explore/">
        <span class="feng-card-icon purple" aria-hidden="true">◇</span>
        <div><small>EXPLORE</small><h3>探索空间</h3><p>发现工具、实验与有趣的项目。</p></div>
        <b aria-hidden="true">↗</b>
      </a>
      <div class="feng-card feng-stack">
        <span class="feng-card-icon green" aria-hidden="true">&lt;/&gt;</span>
        <div><small>TECH STACK</small><h3>技术栈</h3><p class="feng-pills"><span>JavaScript</span><span>Hexo</span><span>Linux</span><span>C#</span></p></div>
      </div>
      <a class="feng-card" href="https://github.com/fakeit-create" target="_blank" rel="noopener">
        <span class="feng-card-icon amber" aria-hidden="true">⌁</span>
        <div><small>GITHUB</small><h3>开源动态</h3><p>@fakeit-create · 查看我的项目与提交记录。</p></div>
        <b aria-hidden="true">↗</b>
      </a>
      <a class="feng-card feng-latest" href="${escapeHtml(latestUrl)}">
        <span class="feng-card-icon cyan" aria-hidden="true">✦</span>
        <div><small>LATEST POST</small><h3>${escapeHtml(latestTitle)}</h3><p>查看最近更新的文章。</p></div>
        <b aria-hidden="true">→</b>
      </a>
    </div>
  </section>

  <div class="feng-stats" aria-label="博客统计">
    <div><strong>${posts.length}</strong><span>篇文章</span></div>
    <i></i><div><strong>${categories.length}</strong><span>个分类</span></div>
    <i></i><div><strong>${tags.length}</strong><span>个标签</span></div>
    <i></i><div><strong>${year}</strong><span>持续记录</span></div>
  </div>

  <div class="feng-post-heading">
    <div><p>RECENT WRITING</p><h2>最近文章</h2></div>
    <a href="${this.config.root}archives/">查看全部 <span aria-hidden="true">→</span></a>
  </div>
</section>`;

  return html.replace('<div class="post-list post">', home + '\n<div class="post-list post">');
});
