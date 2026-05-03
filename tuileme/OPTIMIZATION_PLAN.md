# 推了么 - Browser Extension Optimization Plan

> Version: 1.0  
> Date: 2026-01-23  
> Target Stores: Chrome Web Store + Edge Add-ons

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Target Architecture](#3-target-architecture)
4. [Build System Setup](#4-build-system-setup)
5. [Type System Design](#5-type-system-design)
6. [Module Specifications](#6-module-specifications)
7. [UI/UX Improvements](#7-uiux-improvements)
8. [Store Compliance](#8-store-compliance)
9. [Implementation Checklist](#9-implementation-checklist)

---

## 1. Executive Summary

### 1.1 Goals

| Goal | Description |
|------|-------------|
| **Minimal Code Splitting** | Split `content.js` (789 lines) into single-responsibility modules |
| **Legacy Code Cleanup** | Replace polling injection with MutationObserver, unify i18n, type-safe messaging |
| **UX Optimization** | Auto-open Reply composer, smart fill with clipboard fallback |
| **Store Compliance** | Minimal permissions, local fonts, privacy policy, optional host permissions |

### 1.2 Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Build Tool | Vite + Rollup | Best DX, native ES modules, tree-shaking |
| Language | TypeScript | Type safety, better refactoring, IDE support |
| baseUrl Strategy | Any HTTPS + optional permissions | User flexibility without compromising compliance |
| Detail Page Only | Yes | Simpler injection, more stable, less risk |
| Reply Strategy | Auto-click Reply + Reuse existing composer | Best UX |
| Fill Strategy | Auto-fill (2 methods) + Clipboard fallback | Maximum compatibility |
| Font Strategy | Local woff2 files | No remote resources, better compliance |
| options.html | Static (copy to dist) | Simpler build config |
| Output Filenames | Fixed (no hash) | Easier manifest management |

---

## 2. Current State Analysis

### 2.1 File Structure (Current)

```
dsxxx/
  manifest.json       (20 lines)
  content.js          (789 lines) <- MAIN PROBLEM
  background.js       (143 lines)
  options.js          (338 lines)
  options.html        (296 lines)
  styles.css          (121 lines)
  dsxxx.zip
```

### 2.2 Problems Identified

#### content.js Issues

| Issue | Location | Impact |
|-------|----------|--------|
| Mixed responsibilities | Entire file | Hard to maintain, test, modify |
| Polling injection (`setInterval` 1s) | Line 752-756 | Performance, instability, complexity |
| Large inline CSS/HTML in Shadow DOM | Line 120-243, 453-682 | Bloated bundle, hard to maintain |
| Duplicate i18n (also in options.js) | Line 19-44 | Maintenance burden, inconsistency |
| Global mutable state | Line 47-49, 760 | Race conditions, hard to debug |
| Remote Google Fonts | Line 122, 455 | Compliance risk, latency |

#### Compliance Issues

| Issue | Risk Level | Resolution |
|-------|------------|------------|
| `host_permissions: ["https://*/*", "http://*/*"]` | **HIGH** | Use optional_host_permissions |
| Remote font loading (@import googleapis) | **MEDIUM** | Bundle fonts locally |
| API Key in storage.sync | **LOW** | Move to storage.local |
| Sponsored content in options | **LOW** | Disclose in privacy policy |

### 2.3 Current Injection Logic (Problematic)

```
setInterval(() => {
  // Query ALL tweet buttons every second
  // Complex path-based deduplication
  // Multiple observer instances
  // URL change detection via string comparison
}, 1000);
```

**Problems:**
- Runs on ALL pages (including /home where not needed)
- Queries entire DOM every second
- Complex cleanup/observer management
- Race conditions with SPA navigation

---

## 3. Target Architecture

### 3.1 Directory Structure

```
src/
  shared/
    types.ts              # All shared TypeScript interfaces
    config.ts             # Constants, selectors, defaults
    storage.ts            # Unified storage access (local + sync)
    i18n.ts               # Single i18n source
    url.ts                # URL parsing utilities
    logger.ts             # Debug logging (disabled in production)

  content/
    index.ts              # Ultra-thin entry point
    routeController.ts    # SPA navigation handling
    injector.ts           # MutationObserver-based injection
    twitterAdapter.ts     # Twitter/X DOM interactions
    replyComposer.ts      # Open/find Reply composer
    composerFiller.ts     # Fill text with fallback strategies
    messaging.ts          # Chrome runtime messaging
    state.ts              # Centralized state management
    ui/
      button.ts           # Trigger button + persona menu
      button.css          # Button styles (EVA/NERV)
      overlay.ts          # Stream overlay (LAZY LOADED)
      overlay.css         # Overlay styles (EVA/NERV)

  background/
    index.ts              # Message router
    llmClient.ts          # OpenAI-compatible API client
    streamParser.ts       # SSE stream parsing
    permissions.ts        # Optional permissions handling
    types.ts              # Background-specific types

  options/
    index.ts              # Options page entry
    permissions-ui.ts     # Domain authorization UI
    personas.ts           # Persona CRUD
    i18nBind.ts           # data-i18n attribute binding
    options.css           # Options page styles

assets/
  fonts/
    Orbitron-Bold.woff2
    Orbitron-ExtraBold.woff2
    ShareTechMono-Regular.woff2

public/
  manifest.json           # Extension manifest
  options.html            # Static options page
  _locales/               # (Optional) Chrome i18n
    en/messages.json
    zh_CN/messages.json
    ja/messages.json
    ko/messages.json
```

### 3.2 Build Output (dist/)

```
dist/
  manifest.json
  options.html
  content/
    index.js              # ~50-100 lines after lazy loading
  background/
    index.js
  options/
    index.js
  assets/
    ui-overlay.js         # Lazy-loaded overlay chunk
    button.css
    overlay.css
    fonts/
      Orbitron-Bold.woff2
      Orbitron-ExtraBold.woff2
      ShareTechMono-Regular.woff2
```

### 3.3 Lazy Loading Strategy

```
content/index.ts (entry)
  ├── Always loaded: routeController, injector, button
  └── Lazy loaded (on button click):
        ├── overlay.ts (heavy UI)
        └── overlay.css
```

**Bundle Size Target:**
- `content/index.js`: < 20KB (minified)
- `ui-overlay.js`: ~30-50KB (only loaded when needed)

---

## 4. Build System Setup

### 4.1 Vite Configuration Strategy

```typescript
// vite.config.ts conceptual structure

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: 'src/content/index.ts',
        background: 'src/background/index.ts',
        options: 'src/options/index.ts',
      },
      output: {
        // Fixed entry names (no hash)
        entryFileNames: '[name]/index.js',
        // Chunk names for lazy loading
        chunkFileNames: 'assets/[name].js',
        // Asset names (CSS, fonts)
        assetFileNames: 'assets/[name].[ext]',
      },
    },
    // Target modern browsers (Chrome/Edge latest)
    target: 'es2020',
    // Minify for production
    minify: 'terser',
  },
  // Copy static files
  publicDir: 'public',
});
```

### 4.2 TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": false,
    "outDir": "dist",
    "rootDir": "src",
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["src/shared/*"],
      "@content/*": ["src/content/*"],
      "@background/*": ["src/background/*"]
    },
    "types": ["chrome"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4.3 Package Dependencies

```json
// package.json (dependencies section)
{
  "devDependencies": {
    "vite": "^5.x",
    "typescript": "^5.x",
    "@types/chrome": "^0.0.x",
    "terser": "^5.x"
  }
}
```

### 4.4 Build Scripts

```json
// package.json (scripts section)
{
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "clean": "rm -rf dist"
  }
}
```

---

## 5. Type System Design

### 5.1 Shared Types (src/shared/types.ts)

```typescript
// ============================================================
// STORAGE TYPES
// ============================================================

/** Individual persona definition */
export interface Persona {
  name: string;
  prompt: string;
}

/** Complete extension settings */
export interface Settings {
  // API Configuration
  apiKey: string;
  baseUrl: string;         // e.g., "https://api.openai.com/v1"
  model: string;           // e.g., "gpt-4o-mini"
  maxTokens: number;       // e.g., 400

  // Personas
  personas: Record<string, string>;  // { name: prompt }
  currentPersona: string;            // Selected persona name

  // UI Preferences
  btnLabel: string;        // Button text (max 6 chars, e.g., "推了么")
  lang: 'auto' | 'zh' | 'en' | 'ja' | 'ko';

  // Internal state (not user-editable)
  lastSelectedPersona?: string;
}

/** Default settings for first-time users */
export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  maxTokens: 400,
  personas: {
    'SHINJI': 'As Shinji Ikari: somewhat reserved, introspective, cautious but responds with honesty.',
    'ASUKA': 'Asuka Langley Soryu: confident, competitive, direct, occasionally tsundere.',
    'REI': 'Rei Ayanami: detached, analytical, speaks concisely, shows minimal emotion.',
    'MISATO': 'Misato Katsuragi: casual, caring, military commander style, uses informal language.',
  },
  currentPersona: 'SHINJI',
  btnLabel: '推了么',
  lang: 'auto',
};

// ============================================================
// MESSAGE TYPES (Content <-> Background)
// ============================================================

/** Content -> Background: Request to generate reply */
export interface GenerateReplyStreamRequest {
  type: 'GENERATE_REPLY_STREAM';
  prompt: string;      // Persona prompt
  tweetText: string;   // Tweet content to reply to
}

/** Background -> Content: Stream progress updates */
export interface AiReplyProgressMessage {
  type: 'AI_REPLY_PROGRESS';
  status: 'start' | 'thinking' | 'stream' | 'done' | 'error';
  delta?: string;      // Incremental text (for thinking/stream)
  error?: string;      // Error message (for error status)
}

/** Union type for all messages */
export type ExtensionMessage = 
  | GenerateReplyStreamRequest
  | AiReplyProgressMessage;

// ============================================================
// COMPOSER TYPES
// ============================================================

/** Result of attempting to fill the reply composer */
export interface FillResult {
  ok: boolean;
  mode: 'auto' | 'clipboard' | 'failed';
  reason?: string;
}

/** Result of opening the reply composer */
export interface ComposerOpenResult {
  ok: boolean;
  composer?: HTMLElement;
  reason?: string;
}

// ============================================================
// STREAM PARSER TYPES
// ============================================================

/** Parsed SSE event from LLM API */
export interface StreamEvent {
  type: 'thinking' | 'content' | 'done' | 'error';
  delta?: string;
  error?: string;
}

/** OpenAI-compatible stream chunk */
export interface OpenAIStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      content?: string;
      reasoning_content?: string;  // For models that support thinking
    };
    finish_reason: string | null;
  }>;
}

// ============================================================
// PERMISSION TYPES
// ============================================================

/** State of a domain authorization attempt */
export type PermissionState = 
  | 'idle'
  | 'requesting'
  | 'testing'
  | 'success'
  | 'failed';

/** Result of permission request + test */
export interface PermissionResult {
  granted: boolean;
  tested: boolean;
  error?: string;
}

// ============================================================
// I18N TYPES
// ============================================================

export type SupportedLang = 'zh' | 'en' | 'ja' | 'ko';

export interface I18nStrings {
  title: string;
  generating: string;
  done: string;
  error: string;
  copied: string;
  copyHint: string;
  retry: string;
  openingReply: string;
  filling: string;
}
```

### 5.2 Config Constants (src/shared/config.ts)

```typescript
// ============================================================
// DOM SELECTORS (Twitter/X specific)
// ============================================================

export const SELECTORS = {
  // Tweet detection
  TWEET_ARTICLE: 'article[data-testid="tweet"]',
  TWEET_TEXT: '[data-testid="tweetText"]',
  
  // Reply button (in tweet action bar)
  REPLY_BUTTON: 'button[data-testid="reply"]',
  REPLY_BUTTON_ALT: 'div[data-testid="reply"] button',
  
  // Reply composer (after clicking reply)
  COMPOSER_DIALOG: '[role="dialog"] [role="textbox"][contenteditable="true"]',
  COMPOSER_TEXTAREA: '[data-testid="tweetTextarea_0"][role="textbox"]',
  COMPOSER_FALLBACK: '[role="textbox"][contenteditable="true"]',
  
  // Inline reply button (in composer toolbar)
  TWEET_BUTTON_INLINE: '[data-testid="tweetButtonInline"]',
} as const;

// ============================================================
// UI CONFIGURATION
// ============================================================

export const UI_CONFIG = {
  BUTTON_CONTAINER_CLASS: 'tuileme-btn-container',
  OVERLAY_ID: 'tuileme-ai-overlay',
  BRAND_COLOR: '#f0903a',
  
  // Timeouts
  COMPOSER_WAIT_TIMEOUT: 5000,  // ms to wait for composer to appear
  INJECTION_RETRY_TIMEOUT: 10000,  // ms before giving up on injection
  AUTO_CLOSE_DELAY: 2000,  // ms to wait before auto-closing overlay
} as const;

// ============================================================
// STATUS PAGE DETECTION
// ============================================================

/** Regex to match tweet detail pages */
export const STATUS_PAGE_REGEX = /^\/[^/]+\/status\/\d+/;

/** Pages to explicitly ignore */
export const IGNORED_PATHS = ['/', '/home', '/explore', '/search', '/notifications', '/messages'];
```

### 5.3 Storage Module (src/shared/storage.ts)

```typescript
import type { Settings } from './types';
import { DEFAULT_SETTINGS } from './types';

/**
 * Load settings from chrome.storage
 * - API Key from storage.local (privacy)
 * - Other settings from storage.sync (cross-device)
 */
export async function loadSettings(): Promise<Settings> {
  const [localData, syncData] = await Promise.all([
    chrome.storage.local.get(['apiKey']),
    chrome.storage.sync.get([
      'baseUrl', 'model', 'maxTokens',
      'personas', 'currentPersona', 'lastSelectedPersona',
      'btnLabel', 'lang'
    ]),
  ]);

  return {
    ...DEFAULT_SETTINGS,
    ...syncData,
    apiKey: localData.apiKey || '',
  };
}

/**
 * Save settings to chrome.storage
 * - API Key goes to storage.local
 * - Everything else to storage.sync
 */
export async function saveSettings(partial: Partial<Settings>): Promise<void> {
  const { apiKey, ...syncPart } = partial;

  const promises: Promise<void>[] = [];

  if (apiKey !== undefined) {
    promises.push(chrome.storage.local.set({ apiKey }));
  }

  if (Object.keys(syncPart).length > 0) {
    promises.push(chrome.storage.sync.set(syncPart));
  }

  await Promise.all(promises);
}

/**
 * Get a single setting value
 */
export async function getSetting<K extends keyof Settings>(
  key: K
): Promise<Settings[K]> {
  const settings = await loadSettings();
  return settings[key];
}
```

### 5.4 I18n Module (src/shared/i18n.ts)

```typescript
import type { SupportedLang, I18nStrings } from './types';

const translations: Record<SupportedLang, I18nStrings> = {
  zh: {
    title: '智能回复',
    generating: '正在生成...',
    done: '✓ 已完成',
    error: '生成失败',
    copied: '已复制到剪贴板',
    copyHint: '请在回复框按 Ctrl+V 粘贴',
    retry: '重试',
    openingReply: '正在打开回复框...',
    filling: '正在填充...',
  },
  en: {
    title: 'AI Reply',
    generating: 'Generating...',
    done: '✓ Done',
    error: 'Failed',
    copied: 'Copied to clipboard',
    copyHint: 'Press Ctrl+V to paste in reply box',
    retry: 'Retry',
    openingReply: 'Opening reply...',
    filling: 'Filling...',
  },
  ja: {
    title: 'AI返信',
    generating: '生成中...',
    done: '✓ 完了',
    error: '失敗',
    copied: 'クリップボードにコピーしました',
    copyHint: '返信欄でCtrl+Vを押して貼り付けてください',
    retry: 'リトライ',
    openingReply: '返信を開いています...',
    filling: '入力中...',
  },
  ko: {
    title: 'AI 답장',
    generating: '생성 중...',
    done: '✓ 완료',
    error: '실패',
    copied: '클립보드에 복사됨',
    copyHint: '답장란에서 Ctrl+V를 눌러 붙여넣기하세요',
    retry: '다시 시도',
    openingReply: '답장 열는 중...',
    filling: '입력 중...',
  },
};

/**
 * Detect browser language and map to supported language
 */
export function detectLanguage(): SupportedLang {
  const browserLang = navigator.language.split('-')[0];
  return (browserLang in translations) ? browserLang as SupportedLang : 'en';
}

/**
 * Get translations for specified language
 */
export function getStrings(lang: SupportedLang | 'auto'): I18nStrings {
  const effectiveLang = lang === 'auto' ? detectLanguage() : lang;
  return translations[effectiveLang] || translations.en;
}
```

---

## 6. Module Specifications

### 6.1 Content Entry (src/content/index.ts)

**Responsibility:** Ultra-thin entry point, only glue code

**Size Target:** < 50 lines

**Pseudocode:**
```typescript
import { RouteController } from './routeController';
import { setupMessageListener } from './messaging';
import { loadSettings } from '@shared/storage';

async function init() {
  const settings = await loadSettings();
  const routeController = new RouteController(settings);
  
  setupMessageListener(routeController);
  routeController.start();
}

init();
```

### 6.2 Route Controller (src/content/routeController.ts)

**Responsibility:** 
- Detect status page entry/exit
- Start/stop injection and UI
- Handle SPA navigation

**State Machine:**
```
IDLE ─────────────────────────────────────────────────────────┐
  │                                                           │
  │ (enter status page)                                       │
  v                                                           │
ACTIVE ─────────────────────────────────────────────────────> │
  │         │                                                 │
  │         │ (leave status page)                             │
  │         v                                                 │
  │       CLEANUP ────────────────────────────────────────────┘
  │
  │ (button clicked)
  v
GENERATING ──> DONE/ERROR ──> ACTIVE
```

**Interface:**
```typescript
export class RouteController {
  private state: 'idle' | 'active' | 'generating' = 'idle';
  private injector: Injector | null = null;
  private overlay: Overlay | null = null;

  constructor(settings: Settings);

  /** Start monitoring route changes */
  start(): void;

  /** Stop and cleanup everything */
  stop(): void;

  /** Called when button is clicked */
  onGenerateRequested(personaName: string): Promise<void>;

  /** Called when AI stream updates */
  onStreamUpdate(msg: AiReplyProgressMessage): void;
}
```

**SPA Navigation Handling:**
```typescript
// Hook history API
const originalPushState = history.pushState;
history.pushState = function(...args) {
  originalPushState.apply(this, args);
  window.dispatchEvent(new Event('pushstate'));
};

// Listen to all navigation events
window.addEventListener('pushstate', onRouteChange);
window.addEventListener('popstate', onRouteChange);
```

### 6.3 Twitter Adapter (src/content/twitterAdapter.ts)

**Responsibility:** All Twitter/X DOM interactions

**Interface:**
```typescript
/**
 * Check if current URL is a tweet detail page
 */
export function isStatusPage(url: URL): boolean;

/**
 * Extract status ID from URL
 * @returns null if not a status page
 */
export function getStatusId(url: URL): string | null;

/**
 * Find the main tweet article by status ID
 * Uses exact matching first, falls back to viewport-based detection
 */
export function getMainTweetArticle(statusId: string): HTMLElement | null;

/**
 * Extract plain text content from a tweet article
 * Only returns the main text, excludes:
 * - Quoted tweets
 * - Image alt text
 * - Link expansions
 * - Author info, timestamps, metrics
 */
export function getTweetText(article: HTMLElement): string | null;

/**
 * Find the reply button within a tweet article
 */
export function findReplyButton(article: HTMLElement): HTMLElement | null;
```

**Main Tweet Detection Algorithm:**
```typescript
export function getMainTweetArticle(statusId: string): HTMLElement | null {
  const articles = document.querySelectorAll(SELECTORS.TWEET_ARTICLE);
  
  // Strategy 1: Find article containing link to this status ID
  for (const article of articles) {
    const links = article.querySelectorAll(`a[href*="/status/${statusId}"]`);
    for (const link of links) {
      // Verify link ends with the status ID (not just contains)
      if (link.getAttribute('href')?.match(new RegExp(`/status/${statusId}/?$`))) {
        return article as HTMLElement;
      }
    }
  }

  // Strategy 2: Fallback to topmost visible article
  let topArticle: HTMLElement | null = null;
  let topY = Infinity;
  
  for (const article of articles) {
    const rect = article.getBoundingClientRect();
    if (rect.top >= 0 && rect.top < topY && isVisible(article)) {
      topY = rect.top;
      topArticle = article as HTMLElement;
    }
  }
  
  return topArticle;
}

function isVisible(el: Element): boolean {
  return el.getClientRects().length > 0;
}
```

### 6.4 Injector (src/content/injector.ts)

**Responsibility:** 
- Inject button into main tweet toolbar
- MutationObserver-based (no polling)
- Short lifecycle (disconnect after success)

**Interface:**
```typescript
export class Injector {
  private observer: MutationObserver | null = null;
  private injectedToolbars = new WeakSet<HTMLElement>();
  private timeoutId: number | null = null;

  constructor(
    private settings: Settings,
    private onButtonClick: (personaName: string) => void
  );

  /**
   * Start observing and attempt injection
   * Will auto-disconnect after successful injection or timeout
   */
  start(statusId: string): void;

  /**
   * Stop observing and remove injected buttons
   */
  stop(): void;
}
```

**Injection Strategy:**
```typescript
start(statusId: string): void {
  // Try immediate injection
  if (this.tryInject(statusId)) {
    return; // Success, no need for observer
  }

  // Set up observer for dynamic DOM
  this.observer = new MutationObserver(() => {
    if (this.tryInject(statusId)) {
      this.disconnectObserver();
    }
  });

  this.observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Timeout failsafe
  this.timeoutId = window.setTimeout(() => {
    this.disconnectObserver();
  }, UI_CONFIG.INJECTION_RETRY_TIMEOUT);
}

private tryInject(statusId: string): boolean {
  const mainArticle = getMainTweetArticle(statusId);
  if (!mainArticle) return false;

  const replyBtn = findReplyButton(mainArticle);
  if (!replyBtn) return false;

  const toolbar = replyBtn.closest('[role="group"]') as HTMLElement;
  if (!toolbar || this.injectedToolbars.has(toolbar)) return false;

  // Create and insert button
  const button = createButton(this.settings, this.onButtonClick);
  replyBtn.parentElement?.insertBefore(button, replyBtn);
  
  this.injectedToolbars.add(toolbar);
  return true;
}
```

### 6.5 Reply Composer (src/content/replyComposer.ts)

**Responsibility:**
- Find existing composer (reuse if open)
- Open composer by clicking Reply button
- Wait for composer to be ready

**Interface:**
```typescript
/**
 * Find an open reply composer
 * Checks multiple selectors in order of specificity
 */
export function findComposer(): HTMLElement | null;

/**
 * Ensure reply composer is open and ready
 * Strategy:
 * 1. Check if composer already exists -> reuse
 * 2. Click reply button
 * 3. Wait for composer to appear
 */
export async function openReplyComposer(
  mainArticle: HTMLElement
): Promise<ComposerOpenResult>;

/**
 * Wait for composer element to appear in DOM
 * Uses MutationObserver, not polling
 */
export function waitForComposer(
  timeoutMs: number
): Promise<HTMLElement | null>;
```

**Composer Detection Order:**
```typescript
export function findComposer(): HTMLElement | null {
  const selectors = [
    SELECTORS.COMPOSER_DIALOG,     // Dialog-based composer (most specific)
    SELECTORS.COMPOSER_TEXTAREA,   // Known data-testid
    SELECTORS.COMPOSER_FALLBACK,   // Generic contenteditable
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector) as HTMLElement;
    if (el && isVisible(el) && el.isContentEditable) {
      return el;
    }
  }

  return null;
}
```

**Open Composer Flow:**
```typescript
export async function openReplyComposer(
  mainArticle: HTMLElement
): Promise<ComposerOpenResult> {
  // Step 1: Check if already open
  const existing = findComposer();
  if (existing) {
    return { ok: true, composer: existing };
  }

  // Step 2: Find and click reply button
  const replyBtn = findReplyButton(mainArticle);
  if (!replyBtn) {
    return { ok: false, reason: 'Reply button not found' };
  }

  replyBtn.click();

  // Step 3: Wait for composer to appear
  const composer = await waitForComposer(UI_CONFIG.COMPOSER_WAIT_TIMEOUT);
  if (!composer) {
    return { ok: false, reason: 'Composer did not open (timeout)' };
  }

  return { ok: true, composer };
}
```

### 6.6 Composer Filler (src/content/composerFiller.ts)

**Responsibility:**
- Fill reply text into composer
- Multiple strategies with fallback
- Clipboard as last resort

**Interface:**
```typescript
/**
 * Attempt to fill reply text into composer
 * Strategies (in order):
 * 1. execCommand('insertText') + input event
 * 2. textContent + InputEvent
 * 3. Clipboard copy (fallback)
 */
export async function fillReply(
  composer: HTMLElement,
  text: string
): Promise<FillResult>;
```

**Fill Strategies:**
```typescript
export async function fillReply(
  composer: HTMLElement,
  text: string
): Promise<FillResult> {
  // Ensure composer is focused
  composer.focus();

  // Strategy 1: execCommand (widest compatibility with React)
  if (tryExecCommand(composer, text)) {
    return { ok: true, mode: 'auto' };
  }

  // Strategy 2: DOM manipulation + InputEvent
  if (tryDOMInsert(composer, text)) {
    return { ok: true, mode: 'auto' };
  }

  // Strategy 3: Clipboard fallback
  try {
    await navigator.clipboard.writeText(text);
    return { ok: true, mode: 'clipboard' };
  } catch (err) {
    return { 
      ok: false, 
      mode: 'failed', 
      reason: 'Could not fill or copy text' 
    };
  }
}

function tryExecCommand(el: HTMLElement, text: string): boolean {
  try {
    el.focus();
    
    // Select all existing content
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    selection?.removeAllRanges();
    selection?.addRange(range);
    
    // Insert new text
    const success = document.execCommand('insertText', false, text);
    
    if (success) {
      // Dispatch input event to trigger React state update
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }
  } catch (e) {
    // Fall through to next strategy
  }
  return false;
}

function tryDOMInsert(el: HTMLElement, text: string): boolean {
  try {
    // Clear existing content
    el.textContent = '';
    
    // Insert new content
    el.textContent = text;
    
    // Dispatch InputEvent
    el.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      composed: true,
      inputType: 'insertText',
      data: text,
    }));
    
    // Verify content was set
    return el.textContent === text;
  } catch (e) {
    return false;
  }
}
```

### 6.7 Messaging (src/content/messaging.ts)

**Responsibility:**
- Send messages to background
- Handle incoming stream updates
- Type-safe message passing

**Interface:**
```typescript
/**
 * Send generate request to background
 */
export function sendGenerateRequest(
  prompt: string,
  tweetText: string
): void;

/**
 * Setup listener for AI stream updates
 */
export function setupMessageListener(
  controller: RouteController
): void;
```

**Implementation:**
```typescript
export function sendGenerateRequest(prompt: string, tweetText: string): void {
  const message: GenerateReplyStreamRequest = {
    type: 'GENERATE_REPLY_STREAM',
    prompt,
    tweetText,
  };
  chrome.runtime.sendMessage(message);
}

export function setupMessageListener(controller: RouteController): void {
  chrome.runtime.onMessage.addListener((msg: ExtensionMessage) => {
    if (msg.type === 'AI_REPLY_PROGRESS') {
      controller.onStreamUpdate(msg);
    }
  });
}
```

### 6.8 Button (src/content/ui/button.ts)

**Responsibility:**
- Create trigger button with Shadow DOM
- Persona menu (if multiple personas)
- EVA/NERV styling (local fonts)

**Interface:**
```typescript
/**
 * Create the DaShen trigger button
 * Uses Shadow DOM for style isolation
 */
export function createButton(
  settings: Settings,
  onGenerate: (personaName: string) => void
): HTMLElement;

/**
 * Destroy button and cleanup
 */
export function destroyButton(button: HTMLElement): void;
```

**Font Loading in Shadow DOM:**
```typescript
function getButtonStyles(): string {
  const fontUrl = chrome.runtime.getURL('assets/fonts/Orbitron-Bold.woff2');
  
  return `
    @font-face {
      font-family: 'Orbitron';
      src: url('${fontUrl}') format('woff2');
      font-weight: 700;
      font-display: swap;
    }

    /* Rest of button styles... */
  `;
}
```

### 6.9 Overlay (src/content/ui/overlay.ts) - LAZY LOADED

**Responsibility:**
- Stream display overlay with Shadow DOM
- Show thinking/generating/done/error states
- EVA/NERV styling

**Size:** This is the heavy module, hence lazy loaded

**Interface:**
```typescript
/**
 * Overlay manager (singleton pattern)
 */
export class Overlay {
  private container: HTMLDivElement | null = null;
  private shadow: ShadowRoot | null = null;

  /** Create and show overlay */
  show(tweetText: string): void;

  /** Hide overlay */
  hide(): void;

  /** Update thinking content */
  updateThinking(text: string): void;

  /** Update stream content */
  updateStream(text: string): void;

  /** Show completion state */
  showComplete(mode: 'auto' | 'clipboard'): void;

  /** Show error state */
  showError(error: string): void;

  /** Destroy overlay completely */
  destroy(): void;
}

export const overlay = new Overlay();
```

**Lazy Loading Pattern (in routeController.ts):**
```typescript
async function showOverlay(tweetText: string): Promise<void> {
  // Dynamic import - only loads when needed
  const { overlay } = await import('./ui/overlay');
  overlay.show(tweetText);
}
```

### 6.10 Background Entry (src/background/index.ts)

**Responsibility:**
- Message routing
- Delegate to appropriate handlers

**Interface:**
```typescript
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GENERATE_REPLY_STREAM') {
    handleGenerateStream(msg, sender.tab?.id);
    return true; // Async response
  }
});
```

### 6.11 LLM Client (src/background/llmClient.ts)

**Responsibility:**
- OpenAI-compatible API calls
- Stream handling
- Error normalization

**Interface:**
```typescript
/**
 * Generate reply using streaming API
 * Sends progress updates to content script
 */
export async function generateReplyStream(
  prompt: string,
  tweetText: string,
  tabId: number
): Promise<void>;
```

### 6.12 Stream Parser (src/background/streamParser.ts)

**Responsibility:**
- Parse SSE stream from LLM
- Handle buffer/line splitting
- Extract thinking vs content

**Interface:**
```typescript
/**
 * Parse SSE stream and yield events
 */
export async function* parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<StreamEvent>;
```

**Implementation:**
```typescript
export async function* parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<StreamEvent> {
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;

      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') {
        yield { type: 'done' };
        return;
      }

      try {
        const json: OpenAIStreamChunk = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta;

        if (delta?.reasoning_content) {
          yield { type: 'thinking', delta: delta.reasoning_content };
        }
        if (delta?.content) {
          yield { type: 'content', delta: delta.content };
        }
      } catch {
        // Ignore parse errors
      }
    }
  }
}
```

### 6.13 Permissions (src/background/permissions.ts)

**Responsibility:**
- Check if origin is authorized
- Request permission for new origin
- Test API connectivity

**Interface:**
```typescript
/**
 * Check if we have permission to access an origin
 */
export async function hasPermission(origin: string): Promise<boolean>;

/**
 * Request permission for an origin
 */
export async function requestPermission(origin: string): Promise<boolean>;

/**
 * Test API connectivity after permission granted
 */
export async function testConnection(
  baseUrl: string,
  apiKey: string
): Promise<{ ok: boolean; error?: string }>;

/**
 * Extract origin pattern from baseUrl
 * e.g., "https://api.example.com/v1" -> "https://api.example.com/*"
 */
export function getOriginPattern(baseUrl: string): string;
```

---

## 7. UI/UX Improvements

### 7.1 User Flow (Target State)

```
User clicks [推了么] button
         │
         v
┌─────────────────────────────────────────────────────────────┐
│ 1. Lock main tweet text                                     │
│ 2. Check if composer already open                           │
│    ├─ YES: Reuse existing composer                          │
│    └─ NO: Click Reply button → Wait for composer            │
│ 3. Show overlay with "Generating..."                        │
│ 4. Stream response (show thinking + content)                │
│ 5. On complete:                                             │
│    ├─ Try auto-fill (execCommand → DOM)                     │
│    ├─ If failed: Copy to clipboard + show hint              │
│    └─ Show "Done" or "Copied" status                        │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Button States

| State | Visual | Behavior |
|-------|--------|----------|
| Idle | `推了么` (orange border) | Hover shows persona menu |
| Loading | `推了么` (dimmed, disabled) | Click ignored |
| Error | `推了么` (red border, brief) | Returns to idle after 2s |

### 7.3 Overlay States

| State | Header | Content |
|-------|--------|---------|
| Opening Reply | `OPENING REPLY...` | Spinner |
| Generating | `GENERATING...` | Thinking (green) + Stream (orange) |
| Filling | `FILLING...` | Final text |
| Done (auto) | `✓ DONE` | Final text + auto-close after 2s |
| Done (clipboard) | `✓ COPIED` | Final text + "Press Ctrl+V" hint |
| Error | `✗ ERROR` | Error message + Retry button |

### 7.4 Error Handling

| Error | User Message | Action |
|-------|--------------|--------|
| Tweet text not found | "Could not read tweet" | Show retry |
| Reply button not found | "Could not find reply button" | Show retry |
| Composer timeout | "Could not open reply box. Please click Reply manually." | Show retry |
| API error | "{error message}" | Show retry |
| Fill failed | "Copied to clipboard. Press Ctrl+V to paste." | Auto-copy done |

### 7.5 Settings (Options Page Additions)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Fill behavior | Select | Auto-fill | "Auto-fill" / "Always copy" |
| Auto-close overlay | Toggle | On | Close overlay 2s after success |
| Show thinking | Toggle | On | Display reasoning process |

---

## 8. Store Compliance

### 8.1 Manifest (Final Version)

```json
{
  "manifest_version": 3,
  "name": "推了么",
  "version": "1.0.0",
  "description": "AI-powered reply assistant for X/Twitter. Generate contextual replies with customizable personas.",
  
  "permissions": [
    "storage"
  ],
  
  "optional_host_permissions": [
    "https://*/*"
  ],
  
  "content_scripts": [
    {
      "matches": [
        "https://x.com/*",
        "https://twitter.com/*"
      ],
      "js": ["content/index.js"],
      "run_at": "document_idle"
    }
  ],
  
  "background": {
    "service_worker": "background/index.js"
  },
  
  "options_page": "options.html",
  
  "web_accessible_resources": [
    {
      "resources": [
        "assets/fonts/*",
        "assets/*.js",
        "assets/*.css"
      ],
      "matches": [
        "https://x.com/*",
        "https://twitter.com/*"
      ]
    }
  ],
  
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

### 8.2 Permission Justifications (Store Listing)

| Permission | Justification |
|------------|---------------|
| `storage` | Store user preferences (personas, language, UI settings) and API configuration |
| `optional_host_permissions: https://*/*` | Only requested when user configures a custom API endpoint. Required to send requests to user-specified LLM API servers. **Not requested by default.** |
| Content script on x.com/twitter.com | Core functionality: inject AI reply button on tweet detail pages |

### 8.3 Privacy Policy Requirements

Your privacy policy MUST include:

1. **Data Collection:**
   - Tweet text content is sent to user-configured LLM API only when user clicks the generate button
   - No background data collection
   - No browsing history tracking

2. **Data Storage:**
   - API Key stored locally on device only (`storage.local`)
   - User preferences synced via Chrome sync (`storage.sync`)
   - No data sent to extension developer

3. **Third-Party Services:**
   - Extension connects to LLM API endpoints configured by user
   - Default: OpenAI API (api.openai.com)
   - User may configure custom endpoints
   - Data handling by third-party APIs is governed by their respective privacy policies

4. **Data Sharing:**
   - Extension does not sell, share, or transfer user data
   - No analytics or tracking

### 8.4 Options Page - Domain Authorization Flow

**State Machine:**
```
IDLE ──────────────────────────────────────────────────────────┐
  │                                                            │
  │ (user enters baseUrl + clicks "Authorize & Test")          │
  v                                                            │
REQUESTING ───────────────────────────────────────────────────>│
  │                                                            │
  │ (permission granted)          (permission denied)          │
  v                                    │                       │
TESTING ──────────────────────────────>│                       │
  │                                    │                       │
  │ (test passed)    (test failed)     │                       │
  v                       │            │                       │
SUCCESS ─────────────────>│            │                       │
  │                       v            v                       │
  │                    FAILED ─────────────────────────────────┘
  │
  v
(Save baseUrl as active)
```

**UI Elements:**
- Input: Base URL
- Button: "Authorize & Test"
- Status: Current state indicator
- List: Authorized domains (with revoke button)

---

## 9. Implementation Checklist

### Phase 1: Build System Setup (Day 1)

- [ ] Initialize npm project (`npm init`)
- [ ] Install dependencies (vite, typescript, @types/chrome)
- [ ] Create `vite.config.ts` with multi-entry setup
- [ ] Create `tsconfig.json`
- [ ] Create directory structure (`src/`, `assets/`, `public/`)
- [ ] Move `manifest.json` to `public/`, update paths
- [ ] Move `options.html` to `public/`, update script reference
- [ ] Verify `npm run build` produces correct `dist/` structure
- [ ] Load unpacked extension from `dist/`, verify it loads without error

### Phase 2: Background Migration (Day 2)

- [ ] Create `src/shared/types.ts` with message types
- [ ] Create `src/shared/config.ts` with constants
- [ ] Create `src/shared/storage.ts` with load/save functions
- [ ] Create `src/background/index.ts` (migrate from background.js)
- [ ] Create `src/background/llmClient.ts`
- [ ] Create `src/background/streamParser.ts`
- [ ] Create `src/background/permissions.ts`
- [ ] Verify background service worker functions correctly

### Phase 3: Options Migration (Day 3)

- [ ] Create `src/shared/i18n.ts` (unified i18n)
- [ ] Create `src/options/index.ts` (migrate from options.js)
- [ ] Create `src/options/personas.ts`
- [ ] Create `src/options/i18nBind.ts`
- [ ] Create `src/options/permissions-ui.ts` (domain authorization)
- [ ] Update `options.html` to use new module structure
- [ ] Verify options page functions correctly
- [ ] Test domain authorization flow end-to-end

### Phase 4: Content - Core Infrastructure (Day 4)

- [ ] Create `src/content/index.ts` (thin entry)
- [ ] Create `src/content/routeController.ts`
- [ ] Create `src/content/twitterAdapter.ts`
- [ ] Create `src/content/injector.ts`
- [ ] Create `src/content/messaging.ts`
- [ ] Create `src/content/ui/button.ts`
- [ ] Verify button injection works on tweet detail page
- [ ] Verify button does NOT appear on other pages

### Phase 5: Content - Composer & Fill (Day 5)

- [ ] Create `src/content/replyComposer.ts`
- [ ] Create `src/content/composerFiller.ts`
- [ ] Test "reuse existing composer" flow
- [ ] Test "auto-click Reply" flow
- [ ] Test auto-fill strategies
- [ ] Test clipboard fallback

### Phase 6: Content - Overlay (Day 6)

- [ ] Download Orbitron & Share Tech Mono woff2 fonts
- [ ] Place fonts in `assets/fonts/`
- [ ] Create `src/content/ui/overlay.ts` (lazy loaded)
- [ ] Create `src/content/ui/overlay.css`
- [ ] Update manifest `web_accessible_resources`
- [ ] Verify lazy loading works (overlay chunk only loads on button click)
- [ ] Test full flow: button click → overlay → stream → fill

### Phase 7: Final Integration & Cleanup (Day 7)

- [ ] Remove old `content.js`, `background.js`, `options.js`, `styles.css`
- [ ] Full end-to-end testing on Chrome
- [ ] Full end-to-end testing on Edge
- [ ] Test with multiple personas
- [ ] Test with custom baseUrl (non-OpenAI)
- [ ] Test error scenarios (API error, fill failure, etc.)
- [ ] Verify no console errors

### Phase 8: Store Submission Preparation (Day 8)

- [ ] Write privacy policy page
- [ ] Prepare store listing description (both languages if needed)
- [ ] Prepare screenshots
- [ ] Prepare permission justifications
- [ ] Create promotional images (440x280, 920x680 if featured)
- [ ] Final build: `npm run build`
- [ ] Create zip from `dist/` folder
- [ ] Submit to Chrome Web Store
- [ ] Submit to Edge Add-ons

---

## Appendix A: Font Files

Download these fonts and place in `assets/fonts/`:

- **Orbitron Bold** (for headers, buttons)
  - Source: Google Fonts
  - File: `Orbitron-Bold.woff2`, `Orbitron-ExtraBold.woff2`

- **Share Tech Mono** (for body text)
  - Source: Google Fonts
  - File: `ShareTechMono-Regular.woff2`

---

## Appendix B: Testing Checklist

### Functional Tests

- [ ] Button appears only on tweet detail pages (`/username/status/123`)
- [ ] Button does NOT appear on home, explore, search, notifications, messages
- [ ] Persona menu shows all configured personas
- [ ] Clicking button opens Reply composer (if not already open)
- [ ] Clicking button reuses existing composer (if already open)
- [ ] Overlay shows generating state during API call
- [ ] Overlay shows thinking content (if model supports it)
- [ ] Overlay shows streaming content
- [ ] Auto-fill works in composer
- [ ] Clipboard fallback works when auto-fill fails
- [ ] Error states display correctly
- [ ] Retry button works after error

### Edge Cases

- [ ] Works after Twitter/X site update (DOM changes)
- [ ] Works with slow network (API timeout handling)
- [ ] Works with API errors (4xx, 5xx responses)
- [ ] Works when navigating between tweets (SPA navigation)
- [ ] Works when closing/reopening Reply composer
- [ ] Does not break when multiple tabs open

### Compliance Tests

- [ ] No remote resource loading (all fonts local)
- [ ] No excessive permissions at install time
- [ ] Domain authorization works correctly
- [ ] API Key stored in storage.local (not sync)
- [ ] No console errors or warnings

---

## Appendix C: Rollback Plan

If issues arise after migration:

1. **Build fails:** Check Vite/TS config, verify all imports use correct paths
2. **Extension won't load:** Check manifest.json paths match dist output
3. **Content script not working:** Verify matches patterns in manifest
4. **Overlay not loading:** Check web_accessible_resources, verify chunk file exists
5. **API calls failing:** Check permissions, verify origin pattern extraction
6. **Fonts not loading:** Check web_accessible_resources, verify woff2 paths

Keep the original files (`content.js`, `background.js`, `options.js`) in a `legacy/` folder until migration is fully validated.
