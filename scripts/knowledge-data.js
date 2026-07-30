/* Build the static data used by the relationship graph, knowledge graph and file explorer. */
'use strict';
const plain=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
hexo.extend.generator.register('feng-knowledge-data', function(locals){
 const root=this.config.root||'/';
 const docs=[];
 locals.posts.filter(p=>p.indexing!==false).forEach(p=>docs.push({
  id:'post:'+p.path,type:'article',title:plain(p.title)||'未命名文章',url:root+p.path,
  date:p.date?new Date(p.date).toISOString():'',categories:p.categories.map(x=>x.name),tags:p.tags.map(x=>x.name)
 }));
 const wiki=locals.pages.filter(p=>p.wiki&&p.indexing!==false);
 wiki.forEach(p=>docs.push({id:'wiki:'+p.path,type:'wiki',title:plain(p.title)||'未命名笔记',url:root+p.path,date:'',categories:['408 学习专区'],tags:[p.wiki]}));
 const groups={}; docs.forEach(d=>[...d.categories,...d.tags].forEach(g=>(groups[g]||(groups[g]=[])).push(d.id)));
 const links=[]; Object.keys(groups).forEach(g=>{const a=groups[g];for(let i=1;i<a.length;i++)links.push({source:a[0],target:a[i],label:g})});
 return {path:'knowledge-data.json',data:JSON.stringify({generated:new Date().toISOString(),documents:docs,links})};
});
