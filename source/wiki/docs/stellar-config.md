---
title: Stellar 配置
wiki: docs
order: 3
---

## Wiki 项目配置

当前项目的配置文件位于：

```text
source/_data/wiki/docs.yml
```

配置文件负责设置项目名称、图标、介绍、搜索范围及左右侧栏组件。

## 菜单入口

在 Stellar 主题配置文件的 `menubar.items` 中加入或保留：

```yaml
- id: wiki
  theme: '#3DC550'
  icon: solar:notebook-bookmark-bold-duotone
  title: 文档
  url: /wiki/docs/
```

注意：这里应链接到 `/wiki/docs/`，而不是普通独立页面 `/wiki/`。

## 修改后重新生成

```bash
hexo clean
hexo generate
hexo server
```
