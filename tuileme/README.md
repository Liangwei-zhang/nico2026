# 推了么（Tuileme）

一个给 **X / Twitter** 用的浏览器扩展：在推文详情页一键生成 AI 回复，支持“人格（persona）”切换，带 EVA / MAGI 风格 UI。

<img width="2531" height="560" alt="image" src="https://github.com/user-attachments/assets/4da83a4e-6afb-4786-946f-a1e019de4178" />


> 免责声明：本项目与 X（Twitter）无任何隶属关系。该扩展只是在网页上做 UI 注入与自动填充，遵守你自己的使用场景与平台规则。

---

## 你能得到什么？（小学生版）

当你在 X 上打开一条推文（形如 `https://x.com/用户名/status/数字`）：

1. 你会在「回复」按钮附近看到一个 **推了么** 按钮。
2. 鼠标放上去，会出现一个小菜单：这是不同的“人格”。
3. 先点菜单选人格（只是切换，不会立即生成）。
4. 再点一次 **推了么** 主按钮 → 自动生成一条回复。
5. 生成后会尝试自动把回复填进回复框；如果因为浏览器限制没法自动填，会把内容复制到剪贴板，你去粘贴即可。

<img width="843" height="365" alt="image" src="https://github.com/user-attachments/assets/d39a99d0-8875-42ab-a640-3cba6f20897b" />

<img width="566" height="543" alt="image" src="https://github.com/user-attachments/assets/81f57ff8-5371-42df-8d05-2d56fe53fa89" />



---

## 功能列表

- ✅ 推文详情页注入按钮（靠近回复按钮）
- ✅ 人格（persona）管理：多个角色/语气可选
- ✅ 流式生成：边生成边显示
- ✅ 生成结果自动填入回复框（失败时自动复制到剪贴板）
- ✅ 选项页（MAGI UI）配置：API Key / Base URL / Model / Max Tokens / Persona / 语言

<img width="2529" height="660" alt="image" src="https://github.com/user-attachments/assets/572231cf-fa27-4b1c-b6c1-6732d9e69d8a" />


---

## 安装与使用（普通用户）

### 方式 A：从源码安装（Chrome / Edge）

#### 1）准备：下载代码

- 在 GitHub 页面点 **Code → Download ZIP**
- 解压到一个文件夹，例如：`tuileme/`

#### 2）准备：安装 Node.js

你需要 **Node.js**（建议 18+ 或 20+）。

- Windows：去 https://nodejs.org 下载 LTS 版本安装
- Mac：同上

安装完成后，打开命令行（Windows 用 PowerShell/终端，Mac 用 Terminal），输入：

```bash
node -v
npm -v
```

能看到版本号就说明装好了。

#### 3）编译扩展（把源码变成浏览器能用的文件）

在项目根目录运行：

```bash
npm install
npm run build
```

成功后会生成一个 `dist/` 文件夹（这就是要装进浏览器的扩展包）。

#### 4）把扩展装进浏览器（加载已解压）

**Chrome：**

1. 打开 `chrome://extensions`
2. 右上角打开「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择你的项目里的 `dist/` 文件夹

**Edge：**

1. 打开 `edge://extensions`
2. 打开「开发人员模式」
3. 点击「加载解压缩的扩展」
4. 选择 `dist/` 文件夹

#### 5）配置 API（必须）

安装后：

1. 在扩展列表里找到 **推了么** → 点「详情」/「选项」
2. 填入你的模型 API 配置：
   - **API Key**：例如 OpenAI 的 `sk-...`
   - **Base URL**：默认 `https://api.openai.com/v1`（如果你用第三方 OpenAI-compatible 网关，填你的）
   - **Model**：例如 `gpt-4o-mini`
   - **Max Tokens**：例如 `400`
3. 点底部保存按钮（EXECUTE SAVE）

#### 6）开始使用

1. 打开一条推文详情页，例如：
   - `https://x.com/wolfyxbt/status/2014320203497427434`
2. 找到回复按钮旁边的 **推了么**
3. 鼠标悬停，选择一个人格
4. 点击主按钮生成

---

## 开发指南（小学生也能照做）

> 开发的核心思想：你改了代码 → 重新 build → 浏览器扩展页面点刷新 → 去 X 看效果。

### 1）安装依赖

```bash
npm install
```

### 2）本地构建

```bash
npm run build
```

构建产物输出到：`dist/`

### 3）边写边构建（watch）

```bash
npm run dev
```

它会在你保存代码时自动重新 build（本项目使用 `vite build --watch`）。

### 4）在浏览器里刷新扩展

1. 打开 `chrome://extensions`
2. 找到推了么
3. 点一下「刷新」按钮（🔄）
4. 回到 X 页面（必要时刷新网页）

### 5）类型检查（建议养成习惯）

```bash
npm run typecheck
```

---

## 项目结构（你不需要全懂，但要知道去哪改）

```
public/
  manifest.json          # 扩展配置（MV3）
  options.html           # 选项页（MAGI UI）

src/
  background/
    index.ts             # Service Worker：负责请求模型、流式回传
    llmClient.ts         # OpenAI-compatible 调用
    streamParser.ts      # 解析流式输出

  content/
    index.ts             # 内容脚本入口：在 x.com 页面跑
    routeController.ts   # 监听页面变化/路由，决定何时注入按钮
    injector.ts          # 找到回复按钮并注入“推了么”
    button.ts            # 按钮 + 人格菜单 UI（Shadow DOM）
    twitterAdapter.ts    # X 页面 DOM 适配（找推文、取文字、找 reply）
    replyComposer.ts     # 打开回复框/定位输入框
    composerFiller.ts    # 自动填充回复内容（失败则复制）
    ui/overlay.ts        # 悬浮窗（MAGI/NERV 风格）

  options/
    index.ts             # 选项页逻辑
    personas.ts          # 人格管理 UI

  shared/
    config.ts            # 选择器/常量
    storage.ts           # 存储封装
    types.ts             # TypeScript 类型
    i18n.ts              # 文案国际化

dist/
  # build 生成的可加载扩展
```

---

## 配置说明（重要）

### API Key 存在哪里？安全吗？

- **API Key**：保存在 `chrome.storage.local`（仅本机，不会跨设备同步）
- 其它配置（模型、Base URL、persona 等）：保存在 `chrome.storage.sync`（可能会同步到你的浏览器账号）

建议：
- 不要把带密钥的配置提交到 GitHub
- 不要在公共电脑上使用

### Host Permissions（为什么有时会弹权限？）

`manifest.json` 里用了 `optional_host_permissions: ["https://*/*"]`。

含义：
- 默认不强要所有网站权限
- 当你真正要请求某个 API 域名时，浏览器可能会提示你授权

---

## 常见问题（Troubleshooting）

### 1）我在推文页看不到按钮

按顺序试：

1. 确保你在 **推文详情页**，URL 形如：`/xxx/status/123...`
2. 打开扩展管理页：`chrome://extensions`，确认推了么已启用
3. 点击扩展的「刷新」
4. 刷新 X 页面

如果还是不行：
- X 经常改 DOM 结构，可能需要更新选择器（在 `src/shared/config.ts`）

### 2）控制台提示 CSP 字体被拦截

这是 X 自己的 CSP 限制，很多第三方脚本/字体都会被拦截。

本项目的 content script UI **尽量使用系统字体**，选项页字体为本地字体资源。
这类 CSP 警告一般不影响核心功能。

### 3）生成后没有自动填进回复框

浏览器/页面可能限制自动写入。

这时扩展会尝试把内容写入剪贴板，你在回复框按：
- Windows：`Ctrl + V`
- Mac：`Cmd + V`

---

## 贡献（Contributing）

欢迎 PR / Issue：

- X DOM 选择器更新
- 新的人格模板
- UI 细节优化
- 多语言文案完善

建议提 Issue 时附上：
- 你的浏览器版本
- 你的 URL（是否为 status 页面）
- 复现步骤

---

## License

大家随便用吧！
