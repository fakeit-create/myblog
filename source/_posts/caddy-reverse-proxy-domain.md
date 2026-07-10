---
title: 使用 Caddy 将端口反向代理成域名并自动配置 HTTPS
date: 2026-07-10 14:00:00
updated: 2026-07-10 14:00:00
categories:
  - 服务器运维
tags:
  - Caddy
  - HTTPS
  - 反向代理
  - VPS
  - 域名解析
cover: https://204714.xyz/file/1779690888392_image.png
banner: https://204714.xyz/file/1780995706299_SF_Background.jpg
description: 本文记录如何使用 Caddy 将 VPS 上指定端口的服务反向代理到域名，并自动申请 HTTPS 证书。
excerpt: 通过 Caddy 的 reverse_proxy 功能，可以把服务器上的端口服务映射到域名访问，同时自动配置和续期 HTTPS 证书。本文记录完整配置过程和常见问题。
comments: true
---

## 前言

在 VPS 上部署网站、面板或者 Web 服务时，很多服务默认会运行在某个端口上，例如：

```text
192.236.226.174:22336
```

这种访问方式虽然可以正常使用，但不够方便，也不适合正式使用。

更推荐的方式是使用域名访问，例如：

```text
https://ai.204714.xyz
```

这样不仅更美观，也可以通过 HTTPS 提高安全性。

本文记录如何使用 **Caddy** 将服务器上的端口服务反向代理成域名，并让 Caddy 自动申请 HTTPS 证书。

## 最终效果

原本服务访问地址是：

```text
http://192.236.226.174:22336
```

配置完成后，可以直接通过域名访问：

```text
https://ai.204714.xyz
```

也就是说：

```text
https://ai.204714.xyz
```

会被 Caddy 转发到服务器本地的：

```text
127.0.0.1:22336
```

最终实现通过域名访问端口服务，并且自动启用 HTTPS。

## 第一步：确认域名解析正确

首先需要将域名解析到 VPS 的公网 IP。

例如当前域名是：

```text
ai.204714.xyz
```

VPS 公网 IP 是：

```text
192.236.226.174
```

那么需要在域名 DNS 管理后台添加一条 A 记录：

```text
主机记录：ai
记录类型：A
记录值：192.236.226.174
```

配置完成后，可以在本地电脑或者 VPS 上执行：

```bash
nslookup ai.204714.xyz
```

如果返回结果中能看到：

```text
192.236.226.174
```

说明域名解析已经生效。

也可以使用：

```bash
ping ai.204714.xyz
```

如果解析到了正确的服务器 IP，就可以继续下一步。

## 第二步：确认端口服务正在运行

在配置 Caddy 之前，需要确认目标服务是否真的运行在指定端口上。

这里的目标端口是：

```text
22336
```

在 VPS 上执行：

```bash
sudo ss -lntp | grep 22336
```

如果看到类似下面的结果：

```text
LISTEN 0 4096 *:22336 *:* users:(("你的程序",pid=1234,fd=7))
```

说明服务已经在监听 `22336` 端口。

也可以直接测试本机访问：

```bash
curl -I http://127.0.0.1:22336
```

如果返回类似：

```text
HTTP/1.1 200 OK
```

或者：

```text
HTTP/1.1 302 Found
```

说明后端服务是正常的。

如果这里访问失败，需要先检查你的程序是否启动成功，而不是先修改 Caddy。

## 第三步：确认 Caddy 已经监听 80 和 443 端口

Caddy 自动申请 HTTPS 证书需要使用 80 和 443 端口。

在 VPS 上执行：

```bash
sudo ss -lntp | grep -E ':80|:443'
```

正常情况下应该看到类似：

```text
LISTEN 0 4096 *:80  *:* users:(("caddy",pid=xxx,fd=xxx))
LISTEN 0 4096 *:443 *:* users:(("caddy",pid=xxx,fd=xxx))
```

这说明 Caddy 已经正常监听 HTTP 和 HTTPS 端口。

如果服务器开启了防火墙，也需要放行 80 和 443。

如果使用的是 `ufw`，可以执行：

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

查看防火墙状态：

```bash
sudo ufw status
```

确保能看到类似：

```text
80/tcp ALLOW
443/tcp ALLOW
```

## 第四步：查看 Caddy 主配置文件

Caddy 的主配置文件一般是：

```text
/etc/caddy/Caddyfile
```

查看内容：

```bash
cat /etc/caddy/Caddyfile
```

有些服务器环境下，主配置文件可能并不是直接写站点配置，而是通过 `import` 引入其他目录中的配置文件。

例如：

```caddy
import /etc/caddy/sites/*.conf
```

这表示真正的网站配置文件可以放在：

```text
/etc/caddy/sites/
```

这种情况下，不建议直接修改 `/etc/caddy/Caddyfile`，而是应该在 `/etc/caddy/sites/` 目录下单独创建站点配置文件。

## 第五步：创建域名反向代理配置文件

进入 Caddy 的站点配置目录：

```bash
cd /etc/caddy/sites/
```

如果目录不存在，可以先创建：

```bash
sudo mkdir -p /etc/caddy/sites
```

创建一个新的配置文件：

```bash
sudo nano /etc/caddy/sites/ai.204714.xyz.conf
```

然后写入以下内容：

```caddy
ai.204714.xyz {
    reverse_proxy 127.0.0.1:22336
}
```

这里的含义是：

```text
访问 ai.204714.xyz 时，由 Caddy 转发到本机的 22336 端口
```

其中：

```text
ai.204714.xyz
```

是你的域名。

```text
127.0.0.1:22336
```

是服务器本地运行的后端服务地址。

如果你的服务监听的是公网 IP，也可以写成：

```caddy
ai.204714.xyz {
    reverse_proxy 192.236.226.174:22336
}
```

不过通常更推荐使用：

```caddy
127.0.0.1:22336
```

因为服务和 Caddy 在同一台服务器上，走本地回环地址更安全、更直接。

## 第六步：保存配置文件

如果使用的是 `nano` 编辑器，保存方式如下：

按下：

```text
Ctrl + O
```

然后回车确认保存。

再按：

```text
Ctrl + X
```

退出编辑器。

保存后的配置文件内容应该类似：

```caddy
ai.204714.xyz {
    reverse_proxy 127.0.0.1:22336
}
```

## 第七步：检查 Caddy 配置是否正确

在重启 Caddy 之前，建议先检查配置是否有语法错误。

执行：

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
```

如果看到类似：

```text
adapted config to JSON
```

并且没有明显的 `error`，说明配置基本没有问题。

有时候可能会看到这样的警告：

```text
WARN Caddyfile input is not formatted; run 'caddy fmt --overwrite' to fix inconsistencies
```

这只是格式警告，不是错误。

如果想格式化配置，可以执行：

```bash
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
```

然后再重新检查：

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
```

## 第八步：重启 Caddy

配置检查通过后，重启 Caddy：

```bash
sudo systemctl restart caddy
```

然后查看 Caddy 状态：

```bash
sudo systemctl status caddy --no-pager
```

如果看到：

```text
active (running)
```

说明 Caddy 已经正常运行。

也可以使用下面命令查看最近日志：

```bash
sudo journalctl -u caddy -n 80 --no-pager
```

如果 Caddy 成功申请证书，日志中通常会看到和 TLS、certificate、HTTPS 相关的内容。

## 第九步：测试 HTTPS 访问

在 VPS 上可以执行：

```bash
curl -I https://ai.204714.xyz
```

如果返回类似：

```text
HTTP/2 200
```

或者：

```text
HTTP/2 302
```

说明 HTTPS 已经正常工作。

也可以直接在浏览器访问：

```text
https://ai.204714.xyz
```

如果可以正常打开页面，就说明反向代理配置成功。

## 常见问题

### 1. 域名无法访问

如果浏览器打不开：

```text
https://ai.204714.xyz
```

首先检查域名解析是否正确：

```bash
nslookup ai.204714.xyz
```

确认是否解析到了 VPS 的公网 IP：

```text
192.236.226.174
```

如果没有解析到正确 IP，需要回到域名 DNS 后台修改解析记录。

### 2. Caddy 没有监听 80 或 443

检查端口监听：

```bash
sudo ss -lntp | grep -E ':80|:443'
```

如果没有看到 Caddy 监听 80 和 443，需要检查 Caddy 是否启动：

```bash
sudo systemctl status caddy --no-pager
```

如果没有运行，可以启动：

```bash
sudo systemctl start caddy
```

设置开机自启：

```bash
sudo systemctl enable caddy
```

### 3. 后端端口没有启动

如果 Caddy 正常，但访问域名后显示错误，可能是后端服务没有运行。

检查端口：

```bash
sudo ss -lntp | grep 22336
```

测试本地访问：

```bash
curl -I http://127.0.0.1:22336
```

如果这里都访问不了，说明问题不在 Caddy，而是在后端服务本身。

需要先启动后端程序。

### 4. Caddy 配置文件没有被加载

如果你的主配置文件中有：

```caddy
import /etc/caddy/sites/*.conf
```

那么你新建的配置文件应该放在：

```text
/etc/caddy/sites/
```

例如：

```text
/etc/caddy/sites/ai.204714.xyz.conf
```

如果放错目录，Caddy 就不会加载这个配置。

可以使用下面命令查找域名配置写在哪里：

```bash
grep -R "ai.204714.xyz" /etc/caddy/
```

如果没有任何结果，说明配置文件可能没有保存成功，或者保存到了错误位置。

### 5. Caddy 配置有格式警告

如果执行检查配置时看到：

```text
Caddyfile input is not formatted
```

可以执行：

```bash
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
```

然后重新加载：

```bash
sudo systemctl reload caddy
```

这个警告通常不会影响正常运行，只是提示配置格式不够规范。

### 6. HTTPS 证书没有申请成功

Caddy 会自动申请 HTTPS 证书，但需要满足几个条件：

- 域名已经正确解析到 VPS
- VPS 的 80 端口可以从公网访问
- VPS 的 443 端口可以从公网访问
- Caddy 正常运行
- 配置文件中写的是域名，而不是 IP

正确示例：

```caddy
ai.204714.xyz {
    reverse_proxy 127.0.0.1:22336
}
```

错误示例：

```caddy
192.236.226.174 {
    reverse_proxy 127.0.0.1:22336
}
```

HTTPS 证书一般是签发给域名的，不是签发给普通 IP 的。

### 7. 修改端口后如何更新配置

如果以后后端服务端口从：

```text
22336
```

改成了：

```text
8080
```

只需要编辑配置文件：

```bash
sudo nano /etc/caddy/sites/ai.204714.xyz.conf
```

把：

```caddy
reverse_proxy 127.0.0.1:22336
```

改成：

```caddy
reverse_proxy 127.0.0.1:8080
```

然后重载 Caddy：

```bash
sudo systemctl reload caddy
```

不需要重新申请证书，Caddy 会自动处理。

## 常用命令整理

查看 Caddy 状态：

```bash
sudo systemctl status caddy --no-pager
```

重启 Caddy：

```bash
sudo systemctl restart caddy
```

重载 Caddy：

```bash
sudo systemctl reload caddy
```

查看 Caddy 日志：

```bash
sudo journalctl -u caddy -n 80 --no-pager
```

检查 Caddy 配置：

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
```

格式化 Caddy 配置：

```bash
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
```

查看 80 和 443 端口监听：

```bash
sudo ss -lntp | grep -E ':80|:443'
```

查看后端端口监听：

```bash
sudo ss -lntp | grep 22336
```

测试后端服务：

```bash
curl -I http://127.0.0.1:22336
```

测试域名 HTTPS：

```bash
curl -I https://ai.204714.xyz
```

查找域名相关配置：

```bash
grep -R "ai.204714.xyz" /etc/caddy/
```

## 总结

通过 Caddy 可以非常方便地把 VPS 上的端口服务反向代理成域名访问。

本次配置的核心目标是：

```text
https://ai.204714.xyz
```

反向代理到：

```text
127.0.0.1:22336
```

核心配置如下：

```caddy
ai.204714.xyz {
    reverse_proxy 127.0.0.1:22336
}
```

整个流程主要分为几步：

- 将域名解析到 VPS 公网 IP
- 确认后端服务端口正常运行
- 确认 Caddy 监听 80 和 443
- 在 `/etc/caddy/sites/` 下创建域名配置文件
- 使用 `reverse_proxy` 指向后端端口
- 检查配置并重启 Caddy
- 通过 HTTPS 域名访问服务

这次配置的关键点主要有三个：

1. 域名必须正确解析到服务器 IP
2. Caddy 必须能监听 80 和 443 端口
3. 反向代理地址要写成正确的后端端口，例如 `127.0.0.1:22336`

配置完成后，就可以使用更加简洁、安全的 HTTPS 域名访问原本的端口服务了。