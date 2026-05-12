# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

番茄钟 Electron 桌面应用。无边框窗口 + 系统托盘 + 桌面通知。

## 命令

```bash
npm start          # 启动 Electron 应用
npm run build      # 打包 Windows 便携版 (.exe)，输出到 dist/
```

安装依赖时 Electron 二进制走中国镜像（`.npmrc` 配置了 `npmmirror.com`）。

### 打包注意事项

`npm run build` 生成 `dist/番茄钟 1.0.0.exe`（便携版单文件，约 72MB）和 `dist/win-unpacked/`（解包目录）。

打包过程中 electron-builder 会下载 `winCodeSign` 工具。其压缩包内含 macOS 符号链接（`darwin/10.12/lib/libcrypto.dylib`、`libssl.dylib`），Windows 上无管理员权限时 7za 无法创建符号链接导致解压失败。绕过方法：

```bash
# 手动下载并解压，排除 darwin 目录
"C:/.../node_modules/7zip-bin/win/x64/7za.exe" x -y -x'!darwin/*' \
  "C:/Users/Administrator/AppData/Local/electron-builder/Cache/winCodeSign/winCodeSign-2.6.0.7z" \
  -o"C:/Users/Administrator/AppData/Local/electron-builder/Cache/winCodeSign/winCodeSign-2.6.0"
```

也可以直接管理员身份运行终端，让 7za 有权创建符号链接。

## 架构

三文件 + assets 目录，无框架无打包器：

```
main.js          # Electron 主进程 — 窗口(420x650, frame:false, transparent:true)、托盘、IPC
preload.js       # contextBridge 暴露 5 个 API 给渲染进程
pomodoro.html    # 渲染进程 — 全部 UI(HTML+CSS)+逻辑(JS)，单文件
assets/
  fanqie.png     # 应用图标 (1254×1254)，用于窗口、托盘通知、打包 exe 图标
```

**主进程 `main.js`**：`createWindow()` 创建无边框透明窗口加载 `pomodoro.html`。`createTray()` 用 base64 内嵌 16×16 图标生成托盘，点击切换窗口显隐，右键菜单「显示窗口/退出」。关闭窗口行为是 hide 而非 quit，通过 `isQuitting` 标志区分。

**IPC 通道**（5 个，全部通过 `preload.js` 的 `contextBridge` 暴露为 `window.electronAPI`）：
- `send-notification` / `update-tray` / `minimize` / `close` / `set-always-on-top`

渲染进程用可选链调用（`window.electronAPI?.method()`），在浏览器中直接打开 `pomodoro.html` 时不会报错。

**渲染进程 `pomodoro.html`**：单文件包含全部 CSS 和 JS。JS 管理三个模式（专注 25min / 小休 5min / 长休 15min），SVG 圆环进度条（r=132，圆周 829.4），`setInterval` 驱动倒计时。完成时播放 base64 内嵌提示音 + 自动切换工作/休息模式。

**主题**：CSS 变量双主题。`:root` 定义暗色，`body.light` 覆盖为浅色。`localStorage` 持久化选择。`body.break` / `body.long-break` 切换模式配色。`body.running` 触发呼吸动画和光环增强。

**字体**：全部使用系统原生字体，不依赖外部 CDN（Google Fonts 在中国不可用）：
- 正文 — `Microsoft YaHei UI` → `PingFang SC` (macOS) 后备链
- 时间数字 — `Cascadia Code` → `Consolas` 后备链

**键盘快捷键**：Space/S（开始/暂停）、R（重置）、1/2/3（切换模式）。
