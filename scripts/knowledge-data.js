/* Generate data for the article relation graph, knowledge graph and file browser. */
'use strict';

const text = value => String(value == null ? '' : value)
  .replace(/<[^>]*>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const array = value => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value.toArray === 'function') return value.toArray();
  try { return Array.from(value); } catch (_) { return []; }
};

const names = value => array(value)
  .map(item => text(item && typeof item === 'object' ? item.name : item))
  .filter(Boolean);

const joinUrl = (root, path) => {
  const base = String(root || '/').replace(/\/+$/, '');
  return (base + '/' + String(path || '').replace(/^\/+/, '')).replace(/\/{2,}/g, '/');
};

hexo.extend.generator.register('feng-knowledge-data', function (locals) {
  const siteRoot = this.config.root || '/';
  const documents = [];
  const used = new Set();

  const add = (item, type) => {
    if (!item || item.indexing === false || item.published === false) return;
    const path = String(item.path || '').trim();
    if (!path || used.has(path)) return;

    const isWiki = type === 'wiki';
    const categories = names(item.categories);
    const tags = names(item.tags);
    if (isWiki) {
      if (!categories.includes('408 学习专区')) categories.unshift('408 学习专区');
      const wikiName = text(item.wiki);
      if (wikiName && !tags.includes(wikiName)) tags.push(wikiName);
    }

    used.add(path);
    documents.push({
      id: (isWiki ? 'wiki:' : 'post:') + path,
      type: isWiki ? 'wiki' : 'article',
      title: text(item.title) || path.replace(/\/?index(?:\.html)?$/i, '').split('/').filter(Boolean).pop() || '未命名内容',
      url: joinUrl(siteRoot, path),
      date: item.date ? new Date(item.date).toISOString() : '',
      categories,
      tags
    });
  };

  array(locals.posts).forEach(post => add(post, 'article'));
  array(locals.pages).forEach(page => {
    if (page && page.wiki) add(page, 'wiki');
  });

  documents.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'wiki' ? -1 : 1;
    return a.title.localeCompare(b.title, 'zh-CN');
  });

  const buckets = new Map();
  documents.forEach(doc => {
    const labels = [...new Set([...doc.categories, ...doc.tags].filter(Boolean))];
    labels.forEach(label => {
      if (!buckets.has(label)) buckets.set(label, []);
      buckets.get(label).push(doc.id);
    });
  });

  const links = [];
  const linkKeys = new Set();
  buckets.forEach((ids, label) => {
    for (let i = 1; i < ids.length; i += 1) {
      const source = ids[0];
      const target = ids[i];
      const key = source + '|' + target + '|' + label;
      if (!linkKeys.has(key)) {
        linkKeys.add(key);
        links.push({ source, target, label });
      }
    }
  });

  return {
    path: 'knowledge-data.json',
    data: JSON.stringify({
      version: 2,
      generated: new Date().toISOString(),
      documents,
      links,
      stats: {
        documents: documents.length,
        wiki: documents.filter(item => item.type === 'wiki').length,
        articles: documents.filter(item => item.type === 'article').length,
        links: links.length
      }
    })
  };
});
