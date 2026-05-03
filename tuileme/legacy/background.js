const DEFAULT_BASE = "https://api.openai.com/v1";

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "GENERATE_REPLY") {
    handleReply(msg.prompt, msg.tweetText).then(sendResponse);
    return true; // 异步响应
  }
  if (msg.type === "GENERATE_REPLY_STREAM") {
    const tabId = _sender?.tab?.id;
    handleReplyStream(msg.prompt, msg.tweetText, tabId);
    sendResponse({ ok: true });
    return true;
  }
});

async function handleReply(prompt, tweetText) {
  const { apiKey, baseUrl, model, maxTokens } = await chrome.storage.sync.get([
    "apiKey",
    "baseUrl",
    "model",
    "maxTokens"
  ]);
  if (!apiKey) return { error: "请先在设置页填写 OpenAI API Key" };

  const apiBase = (baseUrl || DEFAULT_BASE).replace(/\/+$/, "");
  const body = {
    model: model || "gpt-3.5-turbo",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: `请根据以下推文内容生成回复：\n${tweetText}` }
    ],
    temperature: 0.8,
    max_tokens: Number(maxTokens) || 400
  };

  try {
    const resp = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });
    if (!resp.ok) return { error: `接口错误 ${resp.status}` };
    const data = await resp.json();
    return { reply: data.choices?.[0]?.message?.content?.trim() || "" };
  } catch (e) {
    return { error: e.message };
  }
}

async function handleReplyStream(prompt, tweetText, tabId) {
  const { apiKey, baseUrl, model, maxTokens } = await chrome.storage.sync.get([
    "apiKey",
    "baseUrl",
    "model",
    "maxTokens"
  ]);
  if (!apiKey) {
    sendTab(tabId, { type: "AI_REPLY_PROGRESS", status: "error", error: "请先在设置页填写 OpenAI API Key" });
    return;
  }

  const apiBase = (baseUrl || DEFAULT_BASE).replace(/\/+$/, "");
  const body = {
    model: model || "gpt-3.5-turbo",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: `请根据以下推文内容生成回复：\n${tweetText}` }
    ],
    temperature: 0.8,
    max_tokens: Number(maxTokens) || 400,
    stream: true
  };

  try {
    const resp = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });
    if (!resp.ok || !resp.body) {
      let errorMsg = `接口错误 ${resp.status}`;
      try {
        const errorData = await resp.json();
        if (errorData.error?.message) {
          errorMsg = errorData.error.message;
        }
      } catch (e) {}
      sendTab(tabId, { type: "AI_REPLY_PROGRESS", status: "error", error: errorMsg });
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    sendTab(tabId, { type: "AI_REPLY_PROGRESS", status: "start" });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n");
      buffer = parts.pop(); // 留下可能未完整的一行
      for (const part of parts) {
        const line = part.trim();
        if (!line || !line.startsWith("data:")) continue;
        const payload = line.replace(/^data:\s*/, "");
        if (payload === "[DONE]") {
          sendTab(tabId, { type: "AI_REPLY_PROGRESS", status: "done" });
          return;
        }
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta;
          
          if (delta?.reasoning_content) {
            sendTab(tabId, { type: "AI_REPLY_PROGRESS", status: "thinking", delta: delta.reasoning_content });
          }
          
          if (delta?.content) {
            sendTab(tabId, { type: "AI_REPLY_PROGRESS", status: "stream", delta: delta.content });
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
    sendTab(tabId, { type: "AI_REPLY_PROGRESS", status: "done" });
  } catch (e) {
    sendTab(tabId, { type: "AI_REPLY_PROGRESS", status: "error", error: e.message });
  }
}

function sendTab(tabId, payload) {
  if (!tabId) return;
  chrome.tabs.sendMessage(tabId, payload, () => chrome.runtime.lastError);
}
