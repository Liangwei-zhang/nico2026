export const SELECTORS = {
  TWEET_ARTICLE: 'article[data-testid="tweet"]',
  TWEET_TEXT: '[data-testid="tweetText"]',
  REPLY_BUTTON: '[data-testid="tweetButtonInline"]',
  REPLY_BUTTON_ALT: 'button[data-testid="reply"]',
  COMPOSER_DIALOG: '[role="dialog"] [role="textbox"][contenteditable="true"]',
  COMPOSER_TEXTAREA: '[data-testid="tweetTextarea_0"][role="textbox"]',
  COMPOSER_FALLBACK: '[role="textbox"][contenteditable="true"]',
} as const;

export const UI_CONFIG = {
  BUTTON_CONTAINER_CLASS: 'tuileme-btn-container',
  OVERLAY_ID: 'tuileme-ai-overlay',
  BRAND_COLOR: '#f0903a',
  COMPOSER_WAIT_TIMEOUT: 5000,
  INJECTION_RETRY_TIMEOUT: 10000,
  AUTO_CLOSE_DELAY: 2000,
} as const;

export const STATUS_PAGE_REGEX = /^\/[^/]+\/status\/\d+/;

export const IGNORED_PATHS = ['/', '/home', '/explore', '/search', '/notifications', '/messages'];

export const DEFAULT_API_BASE = 'https://api.openai.com/v1';
