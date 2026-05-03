import type { GenerateReplyStreamRequest, ExtensionMessage, AiReplyProgressMessage } from '@shared/types';

/**
 * Send generate request to background
 */
export function sendGenerateRequest(prompt: string, tweetText: string): void {
  const message: GenerateReplyStreamRequest = {
    type: 'GENERATE_REPLY_STREAM',
    prompt,
    tweetText,
  };
  chrome.runtime.sendMessage(message);
}

/**
 * Setup listener for AI stream updates
 */
export function setupMessageListener(
  onProgress: (msg: AiReplyProgressMessage) => void
): void {
  chrome.runtime.onMessage.addListener((msg: ExtensionMessage) => {
    if (msg.type === 'AI_REPLY_PROGRESS') {
      onProgress(msg);
    }
  });
}
