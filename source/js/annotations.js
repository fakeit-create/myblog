(() => {
  'use strict';

  const STORE_KEY = 'k408-annotations-v1';
  const ARTICLE_SELECTOR = 'article.md-text, .md-text';
  const TYPES = {
    important: { label: '重点', color: 'yellow' },
    mistake: { label: '易错', color: 'red' },
    review: { label: '待复习', color: 'blue' },
    custom: { label: '批注', color: 'purple' }
  };

  const state = { article: null, selected: null, editingId: null, marks: [] };
  let storeCache = null;
  const $ = (selector, root = document) => root.querySelector(selector);

  // 标记只按文章路径归档，不绑定协议、域名或本地预览端口。
  // 这样 localhost、http/https 和正式域名之间导入备份时仍能对应同一篇文章。
  function normalizePageKey(value = location.href) {
    try {
      let path = new URL(value, location.origin).pathname || '/';
      try { path = decodeURIComponent(path); } catch (_) {}
      path = path.replace(/\/index\.html?$/i, '/').replace(/\/{2,}/g, '/');
      if (!path.startsWith('/')) path = `/${path}`;
      return path.length > 1 ? path.replace(/\/+$/, '') : '/';
    } catch (_) { return String(value || '/'); }
  }
  const pageKey = () => normalizePageKey();
  const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

  function normalizeStore(data) {
    const result = {};
    if (!data || typeof data !== 'object' || Array.isArray(data)) return result;
    for (const [key, values] of Object.entries(data)) {
      if (!Array.isArray(values)) continue;
      const normalized = normalizePageKey(key);
      const map = new Map((result[normalized] || []).map(item => [item.id, item]));
      values.forEach(item => { if (item?.id && item?.quote) map.set(item.id, item); });
      result[normalized] = [...map.values()];
    }
    return result;
  }

  function loadAll() {
    if (storeCache) return storeCache;
    try {
      const data = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      return (storeCache = normalizeStore(data));
    } catch (_) { return (storeCache = {}); }
  }

  function savePage(marks) {
    try {
      const all = loadAll();
      all[pageKey()] = marks;
      localStorage.setItem(STORE_KEY, JSON.stringify(all));
      storeCache = all;
      return true;
    } catch (_) {
      toast('保存失败：浏览器存储空间不可用');
      return false;
    }
  }

  function pageMarks() {
    const value = loadAll()[pageKey()];
    return Array.isArray(value) ? value : [];
  }

  function textNodes(root) {
    const nodes = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!node.nodeValue || !parent || parent.closest('.k408-annotation-ui,script,style,noscript')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  }

  function articleText() {
    return state.article ? textNodes(state.article).map(node => node.nodeValue).join('') : '';
  }

  // 使用与 articleText() 完全相同的文本节点计算偏移。
  // 不能使用 Range.toString()：文章内的隐藏文本、公式辅助文本或脚本内容
  // 可能被 Range 计入，却被 textNodes() 排除，进而使选中文字和弹窗文字错位。
  function comparePoints(aContainer, aOffset, bContainer, bOffset) {
    const a = document.createRange();
    const b = document.createRange();
    try {
      a.setStart(aContainer, aOffset);
      b.setStart(bContainer, bOffset);
      a.collapse(true);
      b.collapse(true);
      return a.compareBoundaryPoints(Range.START_TO_START, b);
    } catch (_) { return 0; }
  }

  function boundaryOffset(container, offset) {
    if (!state.article) return -1;
    let total = 0;
    try {
      for (const node of textNodes(state.article)) {
        const length = node.nodeValue.length;
        // 当前文本节点完全位于边界之前（或刚好结束于边界）。
        if (comparePoints(node, length, container, offset) <= 0) {
          total += length;
          continue;
        }
        // 边界处于当前文本节点内部。
        if (node === container) return total + Math.max(0, Math.min(offset, length));
        // 当前节点开始于边界之后，之前累计值就是目标偏移。
        if (comparePoints(node, 0, container, offset) >= 0) return total;
      }
      return total;
    } catch (_) { return -1; }
  }

  function captureSelection() {
    const selection = getSelection();
    if (!state.article || !selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
    const range = selection.getRangeAt(0);
    if (!state.article.contains(range.commonAncestorContainer)) return null;
    let start = boundaryOffset(range.startContainer, range.startOffset);
    let end = boundaryOffset(range.endContainer, range.endOffset);
    if (start < 0 || end <= start) return null;
    const full = articleText();
    while (start < end && /\s/.test(full[start])) start++;
    while (end > start && /\s/.test(full[end - 1])) end--;
    if (end <= start) return null;
    return {
      start, end,
      quote: full.slice(start, end),
      prefix: full.slice(Math.max(0, start - 32), start),
      suffix: full.slice(end, end + 32)
    };
  }

  function resolvePosition(mark, full) {
    if (Number.isInteger(mark.start) && Number.isInteger(mark.end) && full.slice(mark.start, mark.end) === mark.quote) {
      return [mark.start, mark.end];
    }
    if (!mark.quote) return null;
    const candidates = [];
    let from = 0;
    while (from <= full.length) {
      const at = full.indexOf(mark.quote, from);
      if (at < 0) break;
      let score = 0;
      if (mark.prefix && full.slice(Math.max(0, at - mark.prefix.length), at) === mark.prefix) score += 2;
      if (mark.suffix && full.slice(at + mark.quote.length, at + mark.quote.length + mark.suffix.length) === mark.suffix) score += 2;
      if (Number.isInteger(mark.start)) score -= Math.min(1, Math.abs(at - mark.start) / 10000);
      candidates.push([score, at]);
      from = at + Math.max(1, mark.quote.length);
    }
    if (!candidates.length) return null;
    candidates.sort((a, b) => b[0] - a[0]);
    const start = candidates[0][1];
    return [start, start + mark.quote.length];
  }

  function clearRendered() {
    if (!state.article) return;
    state.article.querySelectorAll('mark.k408-annotation').forEach(mark => {
      mark.replaceWith(document.createTextNode(mark.textContent));
    });
    state.article.normalize();
  }

  function wrapRange(start, end, mark) {
    const nodes = textNodes(state.article);
    let cursor = 0;
    const pieces = [];
    for (const node of nodes) {
      const nodeStart = cursor;
      const nodeEnd = cursor + node.nodeValue.length;
      cursor = nodeEnd;
      if (nodeEnd <= start || nodeStart >= end) continue;
      pieces.push({ node, from: Math.max(0, start - nodeStart), to: Math.min(node.nodeValue.length, end - nodeStart) });
    }
    for (let i = pieces.length - 1; i >= 0; i--) {
      const { node, from, to } = pieces[i];
      if (to <= from || !node.parentNode) continue;
      const selected = node.splitText(from);
      selected.splitText(to - from);
      const element = document.createElement('mark');
      element.className = `k408-annotation k408-annotation--${mark.type || 'important'}`;
      element.dataset.annotationId = mark.id;
      element.tabIndex = 0;
      element.title = mark.note ? `${TYPES[mark.type]?.label || '标记'}：${mark.note}` : (TYPES[mark.type]?.label || '标记');
      selected.replaceWith(element);
      element.appendChild(selected);
    }
  }

  function renderMarks() {
    if (!state.article) return;
    clearRendered();
    const full = articleText();
    state.marks = pageMarks();
    state.marks.forEach(mark => {
      const position = resolvePosition(mark, full);
      if (!position) return;
      mark.start = position[0];
      mark.end = position[1];
      wrapRange(position[0], position[1], mark);
    });
    renderPanelList();
    updateCount();
  }

  function buildUI() {
    if ($('#k408-annotation-fab')) return;
    const selectionButton = document.createElement('button');
    selectionButton.id = 'k408-selection-button';
    selectionButton.className = 'k408-annotation-ui';
    selectionButton.type = 'button';
    selectionButton.textContent = '＋ 添加标记';
    selectionButton.hidden = true;

    const fab = document.createElement('button');
    fab.id = 'k408-annotation-fab';
    fab.className = 'k408-annotation-ui';
    fab.type = 'button';
    fab.setAttribute('aria-label', '打开重点标记');
    fab.innerHTML = '<span aria-hidden="true">✦</span><b id="k408-annotation-count">0</b>';

    const panel = document.createElement('aside');
    panel.id = 'k408-annotation-panel';
    panel.className = 'k408-annotation-ui';
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = `
      <div class="k408-panel-head"><div><strong>重点标记</strong><small>本页批注与高亮</small></div><button type="button" data-action="close" aria-label="关闭">×</button></div>
      <div id="k408-annotation-list" class="k408-annotation-list"></div>
      <div class="k408-panel-foot"><button type="button" data-action="export">导出全部</button><button type="button" data-action="import">导入备份</button><input id="k408-import-file" type="file" accept="application/json" hidden></div>`;

    const dialog = document.createElement('div');
    dialog.id = 'k408-annotation-dialog';
    dialog.className = 'k408-annotation-ui';
    dialog.hidden = true;
    dialog.innerHTML = `
      <div class="k408-dialog-backdrop" data-action="cancel"></div>
      <section class="k408-dialog-card" role="dialog" aria-modal="true" aria-labelledby="k408-dialog-title">
        <div class="k408-dialog-head"><strong id="k408-dialog-title">添加标记</strong><button type="button" data-action="cancel" aria-label="关闭">×</button></div>
        <blockquote id="k408-selected-quote"></blockquote>
        <label>标签类型</label>
        <div class="k408-type-options">
          <label><input type="radio" name="k408-type" value="important" checked><span>重点</span></label>
          <label><input type="radio" name="k408-type" value="mistake"><span>易错</span></label>
          <label><input type="radio" name="k408-type" value="review"><span>待复习</span></label>
          <label><input type="radio" name="k408-type" value="custom"><span>批注</span></label>
        </div>
        <label for="k408-note">批注文字 <small>（可不填，最多 500 字）</small></label>
        <textarea id="k408-note" maxlength="500" rows="4" placeholder="写下你的理解、提醒或易错原因……"></textarea>
        <div class="k408-dialog-actions"><button type="button" class="danger" data-action="delete" hidden>删除</button><span></span><button type="button" data-action="cancel">取消</button><button type="button" class="primary" data-action="save">保存标记</button></div>
      </section>`;

    const toastBox = document.createElement('div');
    toastBox.id = 'k408-annotation-toast';
    toastBox.className = 'k408-annotation-ui';
    toastBox.setAttribute('role', 'status');
    toastBox.setAttribute('aria-live', 'polite');

    document.body.append(selectionButton, fab, panel, dialog, toastBox);
    bindUI();
  }

  function updateCount() {
    const count = $('#k408-annotation-count');
    if (count) count.textContent = String(state.marks.length);
  }

  function renderPanelList() {
    const list = $('#k408-annotation-list');
    if (!list) return;
    list.replaceChildren();
    if (!state.marks.length) {
      const empty = document.createElement('div');
      empty.className = 'k408-list-empty';
      empty.innerHTML = '<b>还没有标记</b><span>选中正文中的文字，即可添加重点和批注。</span>';
      list.appendChild(empty);
      return;
    }
    state.marks.slice().reverse().forEach(mark => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = `k408-list-item k408-list-item--${mark.type || 'important'}`;
      item.dataset.id = mark.id;
      const meta = document.createElement('span');
      meta.className = 'k408-list-meta';
      meta.textContent = TYPES[mark.type]?.label || '标记';
      const quote = document.createElement('b');
      quote.textContent = mark.quote;
      const note = document.createElement('span');
      note.className = 'k408-list-note';
      note.textContent = mark.note || '无批注文字';
      item.append(meta, quote, note);
      list.appendChild(item);
    });
  }

  function showSelectionButton(range) {
    const button = $('#k408-selection-button');
    if (!button) return;
    const rect = range.getBoundingClientRect();
    button.hidden = false;
    button.style.left = `${Math.max(8, Math.min(innerWidth - button.offsetWidth - 8, rect.left + rect.width / 2 - button.offsetWidth / 2))}px`;
    button.style.top = `${Math.max(8, rect.top - button.offsetHeight - 10)}px`;
  }

  function hideSelectionButton() {
    const button = $('#k408-selection-button');
    if (button) button.hidden = true;
  }

  function openDialog(mark = null) {
    state.editingId = mark?.id || null;
    if (!mark && !state.selected) return;
    $('#k408-dialog-title').textContent = mark ? '编辑标记' : '添加标记';
    $('#k408-selected-quote').textContent = mark?.quote || state.selected.quote;
    $('#k408-note').value = mark?.note || '';
    const type = mark?.type || 'important';
    const radio = $(`input[name="k408-type"][value="${type}"]`);
    if (radio) radio.checked = true;
    $('[data-action="delete"]', $('#k408-annotation-dialog')).hidden = !mark;
    const dialog = $('#k408-annotation-dialog');
    dialog.hidden = false;
    document.body.classList.add('k408-dialog-open');
    setTimeout(() => $('#k408-note').focus(), 30);
  }

  function closeDialog() {
    $('#k408-annotation-dialog').hidden = true;
    document.body.classList.remove('k408-dialog-open');
    state.editingId = null;
    state.selected = null;
  }

  function saveDialog() {
    const type = $('input[name="k408-type"]:checked')?.value || 'important';
    const note = $('#k408-note').value.trim();
    const marks = pageMarks();
    const wasEditing = Boolean(state.editingId);
    if (!wasEditing && state.selected && marks.some(item => state.selected.start < item.end && state.selected.end > item.start)) {
      toast('所选文字与已有标记重叠，请重新选择');
      return;
    }
    if (state.editingId) {
      const mark = marks.find(item => item.id === state.editingId);
      if (!mark) return closeDialog();
      mark.type = type;
      mark.note = note;
      mark.updatedAt = new Date().toISOString();
    } else {
      if (!state.selected) return;
      marks.push({ id: makeId(), ...state.selected, type, note, createdAt: new Date().toISOString() });
    }
    if (savePage(marks)) {
      closeDialog();
      renderMarks();
      toast(wasEditing ? '标记已更新' : '标记已保存');
      getSelection()?.removeAllRanges();
    }
  }

  function deleteMark(id = state.editingId) {
    if (!id) return;
    const mark = pageMarks().find(item => item.id === id);
    if (!mark || !confirm(`确定删除“${mark.quote.slice(0, 30)}${mark.quote.length > 30 ? '…' : ''}”的标记吗？`)) return;
    const marks = pageMarks().filter(item => item.id !== id);
    if (savePage(marks)) {
      closeDialog();
      renderMarks();
      toast('标记已删除');
    }
  }

  function openMark(id, scroll = false) {
    const mark = pageMarks().find(item => item.id === id);
    if (!mark) return;
    if (scroll) {
      const target = state.article?.querySelector(`[data-annotation-id="${CSS.escape(id)}"]`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target?.classList.add('is-located');
      setTimeout(() => target?.classList.remove('is-located'), 1200);
      togglePanel(false);
    }
    openDialog(mark);
  }

  function togglePanel(force) {
    const panel = $('#k408-annotation-panel');
    const open = typeof force === 'boolean' ? force : !panel.classList.contains('is-open');
    panel.classList.toggle('is-open', open);
    panel.setAttribute('aria-hidden', String(!open));
  }

  function exportAll() {
    const data = loadAll();
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), pages: data }, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `408重点标记-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  async function importAll(file) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const incoming = parsed.pages || parsed;
      if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) throw new Error('invalid');
      if (!confirm('导入会与现有标记合并，相同标记以备份内容为准。是否继续？')) return;
      const current = loadAll();
      const normalizedIncoming = normalizeStore(incoming);
      for (const [key, values] of Object.entries(normalizedIncoming)) {
        const map = new Map((current[key] || []).map(item => [item.id, item]));
        values.forEach(item => map.set(item.id, item));
        current[key] = [...map.values()];
      }
      localStorage.setItem(STORE_KEY, JSON.stringify(current));
      storeCache = current;
      renderMarks();
      const count = pageMarks().length;
      toast(count ? `导入成功，本页找到 ${count} 条标记` : '导入成功，但备份中没有当前文章的标记');
    } catch (_) { toast('导入失败：请选择正确的 JSON 备份文件'); }
  }

  let toastTimer;
  function toast(message) {
    const box = $('#k408-annotation-toast');
    if (!box) return;
    box.textContent = message;
    box.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => box.classList.remove('is-visible'), 2200);
  }

  function bindUI() {
    $('#k408-selection-button').addEventListener('pointerdown', event => event.preventDefault());
    $('#k408-selection-button').addEventListener('click', () => { hideSelectionButton(); openDialog(); });
    $('#k408-annotation-fab').addEventListener('click', () => togglePanel());

    $('#k408-annotation-panel').addEventListener('click', event => {
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (action === 'close') togglePanel(false);
      if (action === 'export') exportAll();
      if (action === 'import') $('#k408-import-file').click();
      const item = event.target.closest('.k408-list-item');
      if (item) openMark(item.dataset.id, true);
    });
    $('#k408-import-file').addEventListener('change', event => {
      importAll(event.target.files[0]);
      event.target.value = '';
    });

    $('#k408-annotation-dialog').addEventListener('click', event => {
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (action === 'cancel') closeDialog();
      if (action === 'save') saveDialog();
      if (action === 'delete') deleteMark();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') { hideSelectionButton(); closeDialog(); togglePanel(false); }
    });
  }

  function bindArticle() {
    const article = document.querySelector(ARTICLE_SELECTOR);
    if (!article || article === state.article) return;
    state.article = article;
    buildUI();
    renderMarks();

    article.addEventListener('mouseup', () => {
      setTimeout(() => {
        const captured = captureSelection();
        if (!captured || captured.quote.length > 3000) return hideSelectionButton();
        state.selected = captured;
        const selection = getSelection();
        if (selection?.rangeCount) showSelectionButton(selection.getRangeAt(0));
      }, 0);
    });
    article.addEventListener('touchend', () => {
      setTimeout(() => {
        const captured = captureSelection();
        if (!captured || captured.quote.length > 3000) return;
        state.selected = captured;
        const selection = getSelection();
        if (selection?.rangeCount) showSelectionButton(selection.getRangeAt(0));
      }, 120);
    }, { passive: true });
    article.addEventListener('click', event => {
      const mark = event.target.closest('mark.k408-annotation');
      if (mark) { event.preventDefault(); openMark(mark.dataset.annotationId); }
    });
    article.addEventListener('keydown', event => {
      const mark = event.target.closest('mark.k408-annotation');
      if (mark && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); openMark(mark.dataset.annotationId); }
    });
  }

  function init() {
    bindArticle();
    let scheduled = false;
    new MutationObserver(records => {
      // UI updates and visual effects also mutate <body>; only react when an
      // article-like subtree is inserted or the current article is detached.
      const changed = !state.article?.isConnected || records.some(record =>
        [...record.addedNodes].some(node => node.nodeType === 1 &&
          (node.matches?.(ARTICLE_SELECTOR) || node.querySelector?.(ARTICLE_SELECTOR)))
      );
      if (!changed || scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => { scheduled = false; bindArticle(); });
    }).observe(document.body, { childList: true, subtree: true });
    addEventListener('storage', event => {
      if (event.key === STORE_KEY) { storeCache = null; renderMarks(); }
    });
    addEventListener('popstate', () => setTimeout(bindArticle, 50));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
