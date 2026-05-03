import type { FillResult } from '@shared/types';
import { findComposer, openReplyComposer } from './replyComposer';

export async function fillReplyToComposer(
  text: string,
  statusId: string | null
): Promise<FillResult> {
  let composer = findComposer();

  if (!composer && statusId) {
    const result = await openReplyComposer(statusId);
    if (!result.ok || !result.composer) {
      return tryClipboardFallback(text);
    }
    composer = result.composer;
  }

  if (!composer) {
    return tryClipboardFallback(text);
  }

  if (tryExecCommand(composer, text)) {
    return { ok: true, mode: 'auto' };
  }

  if (tryDOMInsert(composer, text)) {
    return { ok: true, mode: 'auto' };
  }

  return tryClipboardFallback(text);
}

function tryExecCommand(el: HTMLElement, text: string): boolean {
  try {
    el.focus();

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const success = document.execCommand('insertText', false, text);

    if (success) {
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }
  } catch {}
  return false;
}

function tryDOMInsert(el: HTMLElement, text: string): boolean {
  try {
    el.textContent = '';
    el.textContent = text;

    el.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        composed: true,
        inputType: 'insertText',
        data: text,
      })
    );

    return el.textContent === text;
  } catch {
    return false;
  }
}

async function tryClipboardFallback(text: string): Promise<FillResult> {
  try {
    await navigator.clipboard.writeText(text);
    return { ok: true, mode: 'clipboard' };
  } catch {
    return { ok: false, mode: 'failed', reason: 'Could not fill or copy text' };
  }
}
