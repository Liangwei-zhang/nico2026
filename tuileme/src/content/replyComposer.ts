import { SELECTORS, UI_CONFIG } from '@shared/config';
import type { ComposerOpenResult } from '@shared/types';
import { getMainTweetArticle, findReplyButton } from './twitterAdapter';

export function findComposer(): HTMLElement | null {
  const selectors = [
    SELECTORS.COMPOSER_DIALOG,
    SELECTORS.COMPOSER_TEXTAREA,
    SELECTORS.COMPOSER_FALLBACK,
  ];

  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el && isVisible(el) && el.isContentEditable) {
      return el;
    }
  }

  return null;
}

export async function openReplyComposer(statusId: string): Promise<ComposerOpenResult> {
  const existing = findComposer();
  if (existing) {
    return { ok: true, composer: existing };
  }

  const mainArticle = getMainTweetArticle(statusId);
  if (!mainArticle) {
    return { ok: false, reason: 'Main tweet not found' };
  }

  const replyBtn = findReplyButton(mainArticle);
  if (!replyBtn) {
    return { ok: false, reason: 'Reply button not found' };
  }

  replyBtn.click();

  const composer = await waitForComposer(UI_CONFIG.COMPOSER_WAIT_TIMEOUT);
  if (!composer) {
    return { ok: false, reason: 'Composer did not open (timeout)' };
  }

  return { ok: true, composer };
}

function waitForComposer(timeoutMs: number): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const immediate = findComposer();
    if (immediate) {
      resolve(immediate);
      return;
    }

    let resolved = false;
    const observer = new MutationObserver(() => {
      const composer = findComposer();
      if (composer && !resolved) {
        resolved = true;
        observer.disconnect();
        resolve(composer);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        observer.disconnect();
        resolve(null);
      }
    }, timeoutMs);
  });
}

function isVisible(el: Element): boolean {
  return el.getClientRects().length > 0;
}
