# 手动测试清单 (推了么 / tuileme)

本项目通过 Vite 构建一个 MV3 浏览器扩展。

- **解压后的目录**: `dist/`
- **内容脚本入口**: `dist/content/index.js`
- **后台服务工作线程 (Service Worker)**: `dist/background/index.js`
- **选项页面**: `dist/options.html`
- **懒加载覆盖层分块**: `dist/assets/overlay.js`（按需加载）
- **本地字体**: `public/assets/fonts/*` → 复制到 `dist/assets/fonts/*`

## 0) 构建

```bash
npm run build
```

说明：`npm run build` 会执行两次 Vite 构建：
- 第一次：构建 background/options（ES module）
- 第二次：构建 content script 为单文件 IIFE（避免 x.com 上出现 “Cannot use import statement outside a module”）

## 1) 加载解压后的扩展程序

### Chrome
1. 打开 `chrome://extensions`
2. 开启 **开发者模式** (Developer mode)
3. 点击 **加载解压后的扩展程序** (Load unpacked)
4. 选择 `dist/` 文件夹

### Edge
1. 打开 `edge://extensions`
2. 开启 **开发者模式** (Developer mode)
3. 点击 **加载解压后的扩展程序** (Load unpacked)
4. 选择 `dist/` 文件夹

**通过标准**：扩展成功加载且未显示红色错误横幅。

## 2) 配置选项

打开扩展的“选项”页面。

填写并保存：
- **API Key**（存储在 `chrome.storage.local` 中）
- **Base URL**（默认: `https://api.openai.com/v1`）
- **Model**（默认: `gpt-4o-mini`）
- **Max Tokens**
- **Button Label**（显示在注入按钮上的文本）
- **Language**（影响选项页 UI；覆盖层目前默认为 `auto`）
- **Personas**：确保至少有一个人格包含 **名称 (name)** 和 **提示词 (prompt)**

如果你使用 **自定义 Base URL 域名**，请使用选项页面的“授权并测试 (Authorize & Test)”流程来授予可选的主机权限。

## 3) 验证注入范围（关键）

按钮应 **仅** 注入到推文详情页面：

- **应当注入**:
  - `https://x.com/<user>/status/<id>`
  - `https://twitter.com/<user>/status/<id>`

- **不应注入**:
  - 首页 (Home) / 探索 (Explore) / 搜索 (Search) / 通知 (Notifications) / 消息 (Messages)
  - 任何非 status 页面

**通过标准**：
- 在 status 页面：推文操作栏附近出现一个带有你配置的标签（默认“推了么”）的按钮。
- 在非 status 页面：不显示注入按钮。

## 4) 验证人格（Persona）选择行为

- 如果你配置了 **多个人格**，点击注入按钮应打开一个列出人格名称的小菜单。
- 如果你只配置了 **一个人格**，点击按钮应立即开始生成。

**通过标准**：
- 仅当 `personas` 包含 2 个及以上条目时显示菜单。
- 选择一个人格后触发生成。

## 5) 验证生成内容 + 覆盖层（Overlay）

在推文详情页面，点击注入按钮。

**预期结果**：
- 页面中出现覆盖层（右下角）。
- 随着后台服务工作线程发送进度事件，应显示流式生成的内容。

完成状态：
- 如果自动填充成功：覆盖层显示已完成，并在短暂延迟后自动隐藏。
- 如果自动填充失败但剪贴板成功：覆盖层显示“已复制”样式 + 粘贴提示。
- 如果请求失败：覆盖层显示错误信息。

## 6) 验证撰写框打开 + 填充

当生成完成时：
- 如果回复撰写框 (Reply composer) 已打开，扩展应重用该框。
- 否则，它会点击 **回复 (Reply)** 并等待撰写框出现。
- 随后尝试使用以下方式填充文本：
  1) `document.execCommand('insertText', ...)`
  2) `textContent` + `InputEvent`
  3) 剪贴板回退方案

**通过标准**：
- 回复撰写框最终包含了生成的文本，或者
- 文本已复制到剪贴板，你可以通过 `Ctrl+V` 粘贴。

## 7) 验证字体为本地加载

运行 `npm run build` 后，确保以下文件存在：
- `dist/assets/fonts/Orbitron-Bold.woff2`
- `dist/assets/fonts/ShareTechMono-Regular.woff2`

可选：在推文页面的开发者工具 (DevTools) → 网络 (Network) 中，确认字体是从扩展 URL 加载的（没有远程字体请求）。

## 8) 调试：查看位置

### 内容脚本（页面端）
打开推文页面 → 开发者工具 (DevTools) → **控制台 (Console)**。

### 后台服务工作线程（Background Service Worker）
前往 `chrome://extensions` → 找到该扩展 → 点击 **服务工作线程 (Service worker)**（查看）。

### 权限问题（自定义 Base URL）
- 如果请求因网络或类 CORS 错误而失败，请验证：
  - 已授予该域名的可选主机权限 (Optional host permission)
  - Base URL 使用 HTTPS

## 9) 如果测试失败，需要提供的信息

请包含以下内容：
1. 你测试的 **URL**（完整 URL）
2. 你使用的是 **x.com** 还是 **twitter.com**
3. 截图或对发生情况的描述（按钮是否存在？菜单是否打开？）
4. 控制台日志：
   - 页面控制台（内容脚本）
   - 服务工作线程控制台（后台）
5. 你的选项配置值（请屏蔽 API key）：baseUrl / model / maxTokens / 人格数量
