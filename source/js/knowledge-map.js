(() => {
  'use strict';

  const one = (selector, root = document) => root.querySelector(selector);
  const all = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);

  let destroyCurrent = () => {};

  function normalise(raw) {
    const documents = Array.isArray(raw?.documents) ? raw.documents.filter(Boolean) : [];
    const links = Array.isArray(raw?.links) ? raw.links.filter(Boolean) : [];
    return { documents, links, generated: raw?.generated || '', stats: raw?.stats || {} };
  }

  async function loadData() {
    // knowledge-map 页面通常位于 /knowledge-map/，不能使用相对于当前页面的
    // knowledge-data.json，否则浏览器会误请求 /knowledge-map/knowledge-data.json。
    // 先读取站点根目录；后面的候选地址用于兼容部署在子目录中的 Hexo 网站。
    const roots = [
      document.documentElement.dataset.root,
      one('meta[name=hexo-root]')?.content,
      one('link[rel=canonical]')?.getAttribute('data-root'),
      '/'
    ].filter(Boolean);
    const candidates = [...new Set(roots.map(root => {
      const base = `/${String(root).replace(/^\/+|\/+$/g, '')}/`.replace(/\/{2,}/g, '/');
      return `${base}knowledge-data.json`;
    }))];

    let lastError;
    for (const path of candidates) {
      try {
        const url = new URL(path, location.origin);
        url.searchParams.set('_', String(Date.now()));
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error(`${url.pathname} 返回 HTTP ${response.status}`);
        return normalise(await response.json());
      } catch (error) {
        lastError = error;
      }
    }
    throw new Error(`knowledge-data.json 加载失败：${lastError?.message || '未知错误'}`);
  }

  async function init() {
    destroyCurrent();
    const app = one('#feng-knowledge-app');
    if (!app) return;

    app.innerHTML = '<div class="fkg-loading">正在读取文章与 408 知识数据…</div>';

    let data;
    try {
      data = await loadData();
    } catch (error) {
      app.innerHTML = `<div class="fkg-empty"><div><b>知识数据加载失败</b><p>${escapeHtml(error.message)}</p><small>请重新执行 Hexo 生成，并确认 public/knowledge-data.json 已部署到站点根目录。</small></div></div>`;
      return;
    }

    const modes = {
      relations: '文章关系图',
      knowledge: '知识图谱',
      files: '文件管理器'
    };
    let mode = new URLSearchParams(location.search).get('view') || 'relations';
    if (!modes[mode]) mode = 'relations';

    app.innerHTML = `
      <nav class="fkg-tabs" aria-label="知识系统视图">
        ${Object.entries(modes).map(([key, label]) => `<button type="button" data-view="${key}">${label}</button>`).join('')}
      </nav>
      <section class="fkg-panel"></section>`;

    const panel = one('.fkg-panel', app);
    let stopView = () => {};

    function showEmpty(title, detail) {
      panel.innerHTML = `<div class="fkg-empty"><div><b>${escapeHtml(title)}</b><p>${escapeHtml(detail)}</p></div></div>`;
    }

    function select(next, updateUrl = true) {
      stopView();
      mode = next;
      all('[data-view]', app).forEach(button => button.classList.toggle('active', button.dataset.view === mode));
      if (updateUrl) history.replaceState(null, '', `${location.pathname}?view=${mode}`);
      if (mode === 'files') renderFiles();
      else renderGraph(mode);
    }

    function renderFiles() {
      const docs = data.documents;
      if (!docs.length) {
        showEmpty('没有读取到任何内容', 'knowledge-data.json 的 documents 数组为空，请清理 Hexo 缓存后重新生成。');
        return;
      }

      // Build a real path tree rather than a flat category filter. Source paths
      // are emitted by the Hexo generator; old data remains compatible by
      // falling back to the public URL.
      const root = { name: 'ROOT', path: '', folders: new Map(), files: [] };
      const cleanPath = doc => {
        let path = String(doc.source || doc.url || '').replace(/^https?:\/\/[^/]+/i, '').replace(/^\/+|\/+$/g, '');
        path = path.replace(/^source\//, '').replace(/\.(md|markdown|html?)$/i, '');
        path = path.replace(/\/(index)$/i, '');
        return path || String(doc.slug || doc.title || 'untitled');
      };
      docs.forEach(doc => {
        const parts = cleanPath(doc).split('/').filter(Boolean);
        const fileName = parts.pop() || doc.title;
        let node = root;
        parts.forEach(part => {
          if (!node.folders.has(part)) node.folders.set(part, { name: part, path: [node.path, part].filter(Boolean).join('/'), folders: new Map(), files: [] });
          node = node.folders.get(part);
        });
        node.files.push({ ...doc, fileName });
      });
      const folders = [root];
      const walk = node => [...node.folders.values()].sort((a,b)=>a.name.localeCompare(b.name,'zh-CN')).forEach(child => { folders.push(child); walk(child); });
      walk(root);
      const countFiles = node => node.files.length + [...node.folders.values()].reduce((sum, child) => sum + countFiles(child), 0);
      const label = node => node === root ? 'ROOT' : node.name;

      panel.innerHTML = `<div class="fkg-files"><aside class="fkg-tree" aria-label="内容目录树"></aside><main class="fkg-list"></main></div>`;
      const tree = one('.fkg-tree', panel), list = one('.fkg-list', panel);
      tree.innerHTML = folders.map((node,index) => {
        const depth = node === root ? 0 : node.path.split('/').length;
        return `<button type="button" class="${index ? '' : 'active'}" data-folder="${escapeHtml(node.path)}" style="--depth:${depth}"><i>${node.folders.size ? '▾' : '·'}</i><span>${escapeHtml(label(node))}</span><small>${countFiles(node)}</small></button>`;
      }).join('');
      const byPath = new Map(folders.map(node => [node.path, node]));
      const draw = path => {
        const node = byPath.get(path) || root;
        const childFolders = [...node.folders.values()].sort((a,b)=>a.name.localeCompare(b.name,'zh-CN'));
        const files = node.files.slice().sort((a,b) => (a.order ?? 9999) - (b.order ?? 9999) || a.title.localeCompare(b.title,'zh-CN'));
        const crumbs = ['ROOT', ...node.path.split('/').filter(Boolean)];
        list.innerHTML = `<header><b>${crumbs.map(escapeHtml).join(' / ')}</b><span>${childFolders.length} 个目录 · ${files.length} 个文件</span></header>`+
          childFolders.map(folder => `<button class="fkg-file fkg-folder" type="button" data-open-folder="${escapeHtml(folder.path)}"><i>▾</i><span>${escapeHtml(folder.name)}</span><small>${countFiles(folder)} 项</small></button>`).join('')+
          files.map(doc => `<a class="fkg-file" href="${escapeHtml(doc.url)}"><i>${doc.type === 'wiki' ? '▤' : '◇'}</i><span><b>${escapeHtml(doc.title)}</b><em>${escapeHtml(doc.fileName)}</em></span><small>${escapeHtml((doc.categories || [])[0] || doc.type)}</small></a>`).join('')+
          (!childFolders.length && !files.length ? '<div class="fkg-empty"><p>此目录为空</p></div>' : '');
      };
      const openFolder = path => {
        all('[data-folder]', panel).forEach(item => item.classList.toggle('active', item.dataset.folder === path));
        draw(path);
      };
      draw('');
      panel.onclick = event => {
        const button = event.target.closest('[data-folder],[data-open-folder]');
        if (button) openFolder(button.dataset.folder ?? button.dataset.openFolder);
      };
      stopView = () => { panel.onclick = null; };
    }

    function renderGraph(kind) {
      const docs = data.documents.slice(0, 140);
      if (!docs.length) {
        showEmpty('图谱没有节点', '没有读取到文章或 408 页面。请使用新版 scripts/knowledge-data.js 重新生成网站。');
        return;
      }

      panel.innerHTML = `<div class="fkg-graph"><canvas aria-label="${escapeHtml(modes[kind])}"></canvas><div class="fkg-tip"></div><div class="fkg-legend"></div><div class="fkg-hint">拖拽移动 · 滚轮缩放 · 点击节点打开内容</div></div>`;
      const wrap = one('.fkg-graph', panel);
      const canvas = one('canvas', wrap);
      const tip = one('.fkg-tip', wrap);
      const legend = one('.fkg-legend', wrap);
      const context = canvas.getContext('2d');
      if (!context) {
        showEmpty('浏览器无法创建图谱画布', 'Canvas 2D 不可用，请关闭浏览器的图形限制后重试。');
        return;
      }

      let nodes = [];
      let links = [];
      let width = 0;
      let height = 0;
      let dpr = 1;
      let offsetX = 0;
      let offsetY = 0;
      let scale = 1;
      let dragging = null;
      let hovered = -1;
      let positioned = false;

      if (kind === 'relations') {
        nodes = docs.map(doc => ({ ...doc, radius: doc.type === 'wiki' ? 8 : 7, group: (doc.categories || [])[0] || doc.type }));
        const index = new Map(nodes.map((node, i) => [node.id, i]));
        links = data.links
          .filter(link => index.has(link.source) && index.has(link.target))
          .slice(0, 400)
          .map(link => ({ a: index.get(link.source), b: index.get(link.target), label: link.label || '' }));
        legend.innerHTML = '<span><i style="--c:#65dda5"></i>408 笔记</span><span><i style="--c:#68b7ff"></i>文章</span>';
      } else {
        const labels = [...new Set(docs.flatMap(doc => [...(doc.categories || []), ...(doc.tags || [])]).filter(Boolean))].slice(0, 80);
        const groupNodes = labels.map(label => ({ id: `group:${label}`, title: label, type: 'group', radius: 11, group: label }));
        nodes = [...groupNodes, ...docs.map(doc => ({ ...doc, radius: doc.type === 'wiki' ? 7 : 6, group: (doc.categories || [])[0] || doc.type }))];
        const index = new Map(nodes.map((node, i) => [node.id, i]));
        labels.forEach(label => {
          docs.forEach(doc => {
            if ([...(doc.categories || []), ...(doc.tags || [])].includes(label)) links.push({ a: index.get(`group:${label}`), b: index.get(doc.id), label });
          });
        });
        legend.innerHTML = '<span><i style="--c:#b18cff"></i>分类 / 标签</span><span><i style="--c:#65dda5"></i>408 笔记</span><span><i style="--c:#68b7ff"></i>文章</span>';
      }

      function colour(node) {
        if (node.type === 'group') return '#b18cff';
        if (node.type === 'wiki') return '#65dda5';
        return '#68b7ff';
      }

      function positionNodes() {
        const cx = width / 2;
        const cy = height / 2;
        const maxRadius = Math.max(80, Math.min(width, height) * 0.39);
        const groupCount = nodes.filter(node => node.type === 'group').length;
        nodes.forEach((node, index) => {
          let radius;
          let angle;
          if (node.type === 'group') {
            angle = (Math.PI * 2 * index) / Math.max(1, groupCount) - Math.PI / 2;
            radius = Math.min(width, height) * 0.2;
          } else {
            const docIndex = index - groupCount;
            angle = docIndex * 2.399963229728653;
            radius = Math.min(maxRadius, 55 + Math.sqrt(Math.max(0, docIndex)) * 31);
          }
          node.x = cx + Math.cos(angle) * radius;
          node.y = cy + Math.sin(angle) * radius;
        });
        positioned = true;
      }

      function drawLabel(node, active) {
        const show = active || node.type === 'group' || nodes.length <= 35;
        if (!show) return;
        context.font = `${active ? 600 : 500} ${active ? 13 : 11}px Inter, "Microsoft YaHei", sans-serif`;
        const label = node.title.length > 20 ? `${node.title.slice(0, 20)}…` : node.title;
        const textWidth = context.measureText(label).width;
        const x = node.x + node.radius + 6;
        const y = node.y - 7;
        context.fillStyle = 'rgba(4,14,25,.88)';
        context.fillRect(x - 4, y - 11, textWidth + 8, 17);
        context.fillStyle = active ? '#ffffff' : 'rgba(220,241,250,.86)';
        context.fillText(label, x, y + 2);
      }

      function draw() {
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        context.clearRect(0, 0, width, height);
        context.save();
        context.translate(offsetX, offsetY);
        context.scale(scale, scale);

        context.strokeStyle = 'rgba(92,190,226,.28)';
        context.lineWidth = 1 / scale;
        context.beginPath();
        links.forEach(link => {
          const a = nodes[link.a];
          const b = nodes[link.b];
          if (!a || !b) return;
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
        });
        context.stroke();

        nodes.forEach((node, index) => {
          const active = index === hovered;
          context.save();
          context.shadowColor = colour(node);
          context.shadowBlur = active ? 20 : 9;
          context.globalAlpha = active ? 1 : 0.9;
          context.fillStyle = colour(node);
          context.beginPath();
          context.arc(node.x, node.y, node.radius + (active ? 3 : 0), 0, Math.PI * 2);
          context.fill();
          context.restore();
          drawLabel(node, active);
        });
        context.restore();
      }

      function resize() {
        const rect = wrap.getBoundingClientRect();
        width = Math.max(320, Math.round(rect.width));
        height = Math.max(420, Math.round(rect.height));
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        if (!positioned) positionNodes();
        draw();
      }

      function localPoint(event) {
        const rect = canvas.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
      }

      function graphPoint(event) {
        const point = localPoint(event);
        return { x: (point.x - offsetX) / scale, y: (point.y - offsetY) / scale };
      }

      function hitTest(event) {
        const point = graphPoint(event);
        let found = -1;
        let nearest = 18 / scale;
        nodes.forEach((node, index) => {
          const distance = Math.hypot(node.x - point.x, node.y - point.y);
          const limit = Math.max(nearest, node.radius + 7 / scale);
          if (distance <= limit) {
            found = index;
            nearest = distance;
          }
        });
        return found;
      }

      canvas.onpointerdown = event => {
        canvas.setPointerCapture(event.pointerId);
        dragging = { x: event.clientX, y: event.clientY, startX: offsetX, startY: offsetY, moved: false };
      };
      canvas.onpointermove = event => {
        if (dragging) {
          const dx = event.clientX - dragging.x;
          const dy = event.clientY - dragging.y;
          if (Math.abs(dx) + Math.abs(dy) > 3) dragging.moved = true;
          offsetX = dragging.startX + dx;
          offsetY = dragging.startY + dy;
          draw();
          return;
        }
        hovered = hitTest(event);
        const point = localPoint(event);
        tip.style.display = hovered < 0 ? 'none' : 'block';
        if (hovered >= 0) {
          const node = nodes[hovered];
          tip.innerHTML = `<b>${escapeHtml(node.title)}</b><small>${escapeHtml(node.type === 'group' ? '分类 / 标签' : node.type === 'wiki' ? '408 笔记' : '文章')}</small>`;
          tip.style.left = `${Math.min(width - 260, point.x + 14)}px`;
          tip.style.top = `${Math.max(8, point.y - 48)}px`;
        }
        draw();
      };
      canvas.onpointerup = event => {
        if (dragging && !dragging.moved) {
          const index = hitTest(event);
          if (index >= 0 && nodes[index].url) location.href = nodes[index].url;
        }
        dragging = null;
      };
      canvas.onpointercancel = () => { dragging = null; };
      canvas.onpointerleave = () => {
        if (!dragging) {
          hovered = -1;
          tip.style.display = 'none';
          draw();
        }
      };
      canvas.onwheel = event => {
        event.preventDefault();
        const point = localPoint(event);
        const oldScale = scale;
        scale = Math.max(0.45, Math.min(3, scale * (event.deltaY < 0 ? 1.12 : 0.89)));
        offsetX = point.x - (point.x - offsetX) * scale / oldScale;
        offsetY = point.y - (point.y - offsetY) * scale / oldScale;
        draw();
      };

      window.addEventListener('resize', resize, { passive: true });
      requestAnimationFrame(resize);
      stopView = () => {
        window.removeEventListener('resize', resize);
        canvas.onpointerdown = null;
        canvas.onpointermove = null;
        canvas.onpointerup = null;
        canvas.onpointercancel = null;
        canvas.onpointerleave = null;
        canvas.onwheel = null;
      };
    }

    app.onclick = event => {
      const button = event.target.closest('[data-view]');
      if (button) select(button.dataset.view);
    };
    select(mode, false);
    destroyCurrent = () => {
      stopView();
      app.onclick = null;
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
  document.addEventListener('pjax:complete', init);
})();
