import type { ExtensionMessage } from '@shared/types';
import { generateReplyStream } from './llmClient';

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    if (message.type === 'GENERATE_REPLY_STREAM') {
      const tabId = sender.tab?.id;
      if (tabId) {
        generateReplyStream(message.prompt, message.tweetText, tabId);
      }
      sendResponse({ ok: true });
      return true;
    }
    return false;
  }
);

console.log('[推了么] Background service worker initialized');
