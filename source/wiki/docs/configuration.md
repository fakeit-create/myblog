---
title: 主题配置
wiki: docs
order: 3
---

## Wiki 项目配置

项目配置文件的推荐路径是：

```text
source/_data/wiki/docs.yml
```

其中，配置文件名 `docs.yml` 对应文档 Front-matter 中的：

```yaml
wiki: docs
```

## 菜单入口

可以在 Stellar 的主题配置中添加 Wiki 入口：

```yaml
- id: wiki
  theme: '#3DC550'
  icon: solar:notebook-bookmark-bold-duotone
  title: 文档
  url: /wiki/docs/
```

修改配置后，需要清理缓存并重新生成站点。
