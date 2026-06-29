---
title: 解决 Visual Studio 中 C# 文件头自动生成的问题
date: 2026-06-29 15:00:00
updated: 2026-06-29 15:00:00
categories:
  - 开发工具
tags:
  - Visual Studio
  - CSharp
  - Item Template
  - 文件头
cover: https://204714.xyz/file/1779690888392_image.png
banner: https://204714.xyz/file/1780995706299_SF_Background.jpg
description: 本文记录如何通过 Visual Studio Item Template 实现 C# 类文件自动生成文件头注释，并解决模板不显示的问题。
excerpt: 通过自定义 Visual Studio Item Template，可以让新建 C# 类文件时自动带上统一的文件头注释。本文记录完整配置过程和踩坑点。
comments: true
---

## 前言

在日常 C# 开发中，很多项目都会要求源文件顶部带有统一的文件头注释，例如文件名、作者、创建时间、描述信息等。

如果每次新建类文件后都手动复制这些内容，不仅麻烦，而且容易遗漏。为了解决这个问题，可以通过 Visual Studio 的 **Item Template** 功能，自定义一个带文件头的 C# 类模板。

这样以后在 Visual Studio 中新建类文件时，就可以自动生成带文件头注释的 `.cs` 文件。

## 最终效果

新建 C# 类文件后，希望自动生成类似下面的内容：

```csharp
// -----------------------------------------------------------------------------
// <copyright file="$safeitemname$.cs" company="你的公司名">
// Copyright (c) 你的公司名. All rights reserved.
// </copyright>
// <author>你的名字</author>
// <date>$time$</date>
// <summary>
// 这里填写类说明
// </summary>
// -----------------------------------------------------------------------------

namespace $rootnamespace$
{
    public class $safeitemname$
    {
    }
}
```

这样每次新建类时，文件头就会自动带上基本信息。

## 第一步：准备模板文件

首先准备两个文件：

```text
Class.cs
FileHeaderClass.vstemplate
```

这两个文件就是 Visual Studio Item Template 的核心文件。

## 第二步：编写 Class.cs

`Class.cs` 是实际生成出来的 C# 类文件模板。

内容如下：

```csharp
// -----------------------------------------------------------------------------
// <copyright file="$safeitemname$.cs" company="你的公司名">
// Copyright (c) 你的公司名. All rights reserved.
// </copyright>
// <author>你的名字</author>
// <date>$time$</date>
// <summary>
// 这里填写类说明
// </summary>
// -----------------------------------------------------------------------------

namespace $rootnamespace$
{
    public class $safeitemname$
    {
    }
}
```

其中几个变量的作用如下：

- `$safeitemname$`：新建文件时输入的类名
- `$rootnamespace$`：当前项目的默认命名空间
- `$time$`：生成文件时的时间

你可以根据自己的需要修改公司名、作者名和注释格式。

## 第三步：编写 FileHeaderClass.vstemplate

`FileHeaderClass.vstemplate` 用来告诉 Visual Studio 这个模板是什么、显示在哪里、生成哪个文件。

内容如下：

```xml
<?xml version="1.0" encoding="utf-8"?>
<VSTemplate Version="3.0.0" Type="Item" xmlns="http://schemas.microsoft.com/developer/vstemplate/2005">
  <TemplateData>
    <Name>带文件头的 C# 类</Name>
    <Description>创建带公司文件头注释的 C# 类</Description>
    <ProjectType>CSharp</ProjectType>
    <SortOrder>10</SortOrder>
    <DefaultName>Class.cs</DefaultName>
  </TemplateData>
  <TemplateContent>
    <ProjectItem ReplaceParameters="true" TargetFileName="$fileinputname$.cs">Class.cs</ProjectItem>
  </TemplateContent>
</VSTemplate>
```

需要注意的是，如果模板里写了下面这一行：

```xml
<Icon>Class.ico</Icon>
```

但是压缩包里没有 `Class.ico` 文件，那么 Visual Studio 可能不会显示这个模板。

所以如果没有准备图标文件，建议直接不要写 `Icon`。

## 第四步：打包为 zip

Visual Studio 只识别 `.zip` 格式的模板压缩包，不识别 `.7z`。

正确的压缩包结构应该是：

```text
FileHeaderClassTemplate.zip
├─ Class.cs
└─ FileHeaderClass.vstemplate
```

注意，压缩包打开后第一层必须直接看到这两个文件。

不要压成下面这种结构：

```text
FileHeaderClassTemplate.zip
└─ FileHeaderClassTemplate
   ├─ Class.cs
   └─ FileHeaderClass.vstemplate
```

如果多套了一层文件夹，Visual Studio 可能扫描不到模板。

另外，如果目录里有 `.meta` 文件，也建议删除，例如：

```text
Class.cs.meta
FileHeaderClass.vstemplate.meta
```

最终压缩包里只保留：

```text
Class.cs
FileHeaderClass.vstemplate
```

## 第五步：放到 Visual Studio 模板目录

Visual Studio 2022 的用户模板目录一般是：

```text
C:\Users\Administrator\Documents\Visual Studio 2022\Templates\ItemTemplates\C#
```

把压缩好的模板放进去：

```text
C:\Users\Administrator\Documents\Visual Studio 2022\Templates\ItemTemplates\C#\FileHeaderClassTemplate.zip
```

如果你的用户名不是 `Administrator`，需要把路径里的用户名改成自己的 Windows 用户名。

例如：

```text
C:\Users\你的用户名\Documents\Visual Studio 2022\Templates\ItemTemplates\C#
```

## 第六步：重启 Visual Studio

模板放好以后，需要关闭 Visual Studio，然后重新打开。

接着在项目中右键：

```text
添加 → 新建项
```

然后搜索：

```text
带文件头的 C# 类
```

如果模板正常识别，就可以看到自己创建的模板。

## 常见问题

### 1. 模板没有显示

如果模板没有显示，优先检查以下几点：

- 压缩包是不是 `.zip`
- 压缩包内部是不是直接包含 `Class.cs` 和 `.vstemplate`
- 有没有多套一层文件夹
- `.vstemplate` 里有没有引用不存在的图标文件
- `ProjectType` 是否写成了 `CSharp`
- 是否已经重启 Visual Studio

### 2. 压缩包是 7z 格式

Visual Studio 不识别 `.7z` 模板。

错误示例：

```text
FileHeaderClassTemplate.7z
```

正确示例：

```text
FileHeaderClassTemplate.zip
```

一定要使用 `.zip`。

### 3. 压缩包里有多余文件

如果压缩包里有这些文件：

```text
Class.cs.meta
FileHeaderClass.vstemplate.meta
```

建议删除。

这些文件通常不是 Visual Studio 模板需要的内容，保留它们没有意义，反而可能干扰判断。

### 4. 压缩包里套了一层文件夹

错误结构：

```text
FileHeaderClassTemplate.zip
└─ FileHeaderClassTemplate
   ├─ Class.cs
   └─ FileHeaderClass.vstemplate
```

正确结构：

```text
FileHeaderClassTemplate.zip
├─ Class.cs
└─ FileHeaderClass.vstemplate
```

Visual Studio 对模板结构比较敏感，所以这一点很重要。

## 总结

通过 Visual Studio 的 Item Template，可以实现 C# 类文件自动生成文件头注释。

整个流程主要分为几步：

- 编写 `Class.cs` 模板文件
- 编写 `FileHeaderClass.vstemplate`
- 将两个文件打包成 `.zip`
- 放入 Visual Studio 的 ItemTemplates 目录
- 重启 Visual Studio 后使用模板

这次问题的关键点主要有两个：

1. Visual Studio 只识别 `.zip`，不识别 `.7z`
2. 压缩包内部不能多套一层文件夹，必须直接包含模板文件

处理好这两个问题后，自定义 C# 文件头模板就可以正常使用了。