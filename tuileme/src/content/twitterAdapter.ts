import { SELECTORS, STATUS_PAGE_REGEX, IGNORED_PATHS } from '@shared/config';

/**
 * Check if current URL is a tweet detail page
 */
export function isStatusPage(url: URL): boolean {
  const path = url.pathname;
  if (IGNORED_PATHS.some((ignored) => path === ignored || path.startsWith(ignored + '/'))) {
    return false;
  }
  return STATUS_PAGE_REGEX.test(path);
}

/**
 * Extract status ID from URL
 * @returns null if not a status page
 */
export function getStatusId(url: URL): string | null {
  const match = url.pathname.match(/\/status\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Find the main tweet article by status ID
 * Uses exact matching first, falls back to viewport-based detection
 */
export function getMainTweetArticle(statusId: string): HTMLElement | null {
  const articles = document.querySelectorAll<HTMLElement>(SELECTORS.TWEET_ARTICLE);

  // Strategy 1: Find article containing link to this status ID
  for (const article of articles) {
    const links = article.querySelectorAll<HTMLAnchorElement>(`a[href*="/status/${statusId}"]`);
    for (const link of links) {
      const href = link.getAttribute('href');
      // X may append extra segments or queries, e.g.:
      // - /status/<id>/photo/1
      // - /status/<id>?s=20
      // - /status/<id>/analytics
      if (href && new RegExp(`/status/${statusId}(?:$|/|\\?)`).test(href)) {
        return article;
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
      topArticle = article;
    }
  }

  return topArticle;
}

/**
 * Extract plain text content from a tweet article
 * Only returns the main text, excludes quoted tweets, image alt text, etc.
 */
export function getTweetText(article: HTMLElement): string | null {
  const textEl = article.querySelector<HTMLElement>(SELECTORS.TWEET_TEXT);
  if (!textEl) return null;

  // Get innerText to preserve line breaks and exclude hidden content
  return textEl.innerText.trim() || null;
}

/**
 * Find the reply button within a tweet article
 */
export function findReplyButton(article: HTMLElement): HTMLElement | null {
  // Try primary selector
  let btn = article.querySelector<HTMLElement>(SELECTORS.REPLY_BUTTON);
  if (btn) return btn;

  // Try alternative selector
  btn = article.querySelector<HTMLElement>(SELECTORS.REPLY_BUTTON_ALT);
  return btn;
}

/**
 * Check if element is visible in DOM
 */
function isVisible(el: Element): boolean {
  return el.getClientRects().length > 0;
}
