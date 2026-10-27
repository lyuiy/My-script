# 美团 Surge / Egern 模块

将原作者的 Quantumult X 配置转换为 Surge 模块；Egern 使用 Surge 兼容模块导入。

## 远程导入

在 Surge 或 Egern 的模块管理中添加以下 URL：

```text
https://raw.githubusercontent.com/lyuiy/My-script/main/script/Meituan/MT.sgmodule
```

启用模块和 MITM，并安装、信任对应客户端的 MITM 证书，然后彻底退出并重新打开美团。

原有的无扩展名地址继续可用，与 MT.sgmodule 内容一致；两个地址只需导入一个：

```text
https://raw.githubusercontent.com/lyuiy/My-script/main/script/Meituan/meituan
```

## 文件与行为

- `MT.sgmodule`：46 条拦截规则、2 条 URL 拒绝规则、8 个响应脚本入口，追加 7 个 MITM 域名。
- `MT.js`：原作者脚本的完整镜像，未修改脚本内容；模块内全部 8 个 script-path 均引用本仓库的该文件。
- `meituan`：保留原有订阅地址，与 `MT.sgmodule` 内容相同。

脚本处理底部视频/小团入口、指定推荐流、个人中心推荐、搜索热词、AI 技能、购物车顶部横幅及启动图。模块与脚本均由本仓库提供，不依赖 Script Hub 在线转换。原作者后续更新不会自动同步到本镜像。

## 来源与验证

- 原作者：TG@ZenMoFiShi（GitHub: [ZenmoFeiShi](https://github.com/ZenmoFeiShi)）。
- [原始 QX 配置](https://raw.githubusercontent.com/ZenmoFeiShi/Qx/refs/heads/main/MT.snippet)。
- [原始 MT.js](https://raw.githubusercontent.com/ZenmoFeiShi/Qx/refs/heads/main/MT.js)。
- 原配置标注美团版本：12.67.403；原配置更新时间：2026-10-25；本次同步日期：2026-10-27。
- MT.js SHA-256：`9a48981f5d1cdac2d7c72c8f1164752ce712113eaf687aeeba2829e78c66308a`。
- 已核对规则完整性，并通过 8 个响应处理分支和 2 个原样放行场景的模拟测试；未在手机客户端实际流量中验证。
