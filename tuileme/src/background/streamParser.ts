import type { StreamEvent, OpenAIStreamChunk } from '@shared/types';

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
    buffer = lines.pop() || '';

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
