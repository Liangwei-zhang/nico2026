import { loadSettings } from '@shared/storage';
import { DEFAULT_API_BASE } from '@shared/config';
import type { AiReplyProgressMessage } from '@shared/types';
import { parseSSEStream } from './streamParser';

function sendToTab(tabId: number, message: AiReplyProgressMessage): void {
  chrome.tabs.sendMessage(tabId, message).catch(() => {});
}

export async function generateReplyStream(
  prompt: string,
  tweetText: string,
  tabId: number
): Promise<void> {
  const { apiKey, baseUrl, model, maxTokens } = await loadSettings();

  if (!apiKey) {
    sendToTab(tabId, {
      type: 'AI_REPLY_PROGRESS',
      status: 'error',
      error: '请先在设置页填写 API Key',
    });
    return;
  }

  const apiBase = (baseUrl || DEFAULT_API_BASE).replace(/\/+$/, '');

  const body = {
    model: model || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: `请根据以下推文内容生成回复：\n${tweetText}` },
    ],
    temperature: 0.8,
    max_tokens: Number(maxTokens) || 400,
    stream: true,
  };

  try {
    const resp = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok || !resp.body) {
      let errorMsg = `接口错误 ${resp.status}`;
      try {
        const errorData = await resp.json();
        if (errorData.error?.message) {
          errorMsg = errorData.error.message;
        }
      } catch {}
      sendToTab(tabId, { type: 'AI_REPLY_PROGRESS', status: 'error', error: errorMsg });
      return;
    }

    sendToTab(tabId, { type: 'AI_REPLY_PROGRESS', status: 'start' });

    const reader = resp.body.getReader();

    for await (const event of parseSSEStream(reader)) {
      if (event.type === 'thinking') {
        sendToTab(tabId, { type: 'AI_REPLY_PROGRESS', status: 'thinking', delta: event.delta });
      } else if (event.type === 'content') {
        sendToTab(tabId, { type: 'AI_REPLY_PROGRESS', status: 'stream', delta: event.delta });
      } else if (event.type === 'done') {
        sendToTab(tabId, { type: 'AI_REPLY_PROGRESS', status: 'done' });
        return;
      } else if (event.type === 'error') {
        sendToTab(tabId, { type: 'AI_REPLY_PROGRESS', status: 'error', error: event.error });
        return;
      }
    }

    sendToTab(tabId, { type: 'AI_REPLY_PROGRESS', status: 'done' });
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : '未知错误';
    sendToTab(tabId, { type: 'AI_REPLY_PROGRESS', status: 'error', error: errorMsg });
  }
}
