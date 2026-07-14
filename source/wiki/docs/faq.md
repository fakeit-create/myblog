---
title: 常见问题
wiki: docs
order: 4
---

## 页面没有出现在 Wiki 项目中

请确认文章 Front-matter 包含正确的项目标识：

```yaml
wiki: docs
```

并确保它与 `source/_data/wiki/docs.yml` 对应。

## 页面访问时显示 404

依次执行：

```bash
hexo clean
hexo generate
hexo server
```

同时检查 Markdown 文件是否已经放入：

```text
source/wiki/docs/
```

## 修改后页面没有变化

通常是 Hexo 缓存导致的。先运行 `hexo clean`，然后重新生成并启动本地服务器。
