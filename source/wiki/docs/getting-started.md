---
title: 快速开始
wiki: docs
order: 2
---

## 安装依赖

进入 Hexo 博客根目录，执行：

```bash
npm install
```

## 生成并预览

```bash
hexo clean
hexo generate
hexo server
```

默认情况下，可以访问：

```text
http://localhost:4000/wiki/docs/
```

## 新增文档

在 `source/wiki/docs/` 目录中新建 Markdown 文件，并在 Front-matter 中指定：

```yaml
---
title: 新文档标题
wiki: docs
order: 10
---
```
